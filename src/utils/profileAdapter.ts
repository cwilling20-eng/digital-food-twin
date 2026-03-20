import { supabase } from '../lib/supabase';
import { fetchUserFoodDNA, type UserFoodDNA } from './fetchUserFoodDNA';
import type { ComprehensiveUserProfile } from '../types';

const DEFAULT_COMPREHENSIVE: ComprehensiveUserProfile = {
  coreProfile: { diets: [], allergies: [], goals: [] },
  tasteProfile: { spicyTolerance: 5, texturePreferences: [], sweetVsSavory: 5 },
  dislikes: [],
  favoriteFoods: [],
};

export function buildComprehensiveProfile(
  foodDna: UserFoodDNA | null
): ComprehensiveUserProfile {
  if (!foodDna) return { ...DEFAULT_COMPREHENSIVE };

  // Derive sweetVsSavory: higher salty + lower sweet → higher (more savory)
  const sweet = foodDna.flavorProfile.sweet ?? 5;
  const salty = foodDna.flavorProfile.salty ?? 5;
  const rawSweetVsSavory = Math.round(((10 - sweet + salty) / 2) * 2) / 2;
  const sweetVsSavory = Math.max(1, Math.min(10, Math.round(rawSweetVsSavory))) || 5;

  // Collect all favorite foods from meal preferences, deduplicated
  const allFavoriteFoods = new Set<string>();
  if (foodDna.mealPreferences) {
    for (const meal of Object.values(foodDna.mealPreferences)) {
      if (meal?.favoriteFoods) {
        for (const food of meal.favoriteFoods) {
          allFavoriteFoods.add(food);
        }
      }
    }
  }

  return {
    coreProfile: {
      diets: foodDna.dietaryConstraints.restrictions as ComprehensiveUserProfile['coreProfile']['diets'],
      allergies: foodDna.dietaryConstraints.allergies as ComprehensiveUserProfile['coreProfile']['allergies'],
      goals: foodDna.dietaryConstraints.healthGoals as ComprehensiveUserProfile['coreProfile']['goals'],
    },
    tasteProfile: {
      spicyTolerance: foodDna.flavorProfile.spicy ?? 5,
      texturePreferences: foodDna.flavorProfile.preferredTextures ?? [],
      sweetVsSavory,
    },
    dislikes: foodDna.dislikes ?? [],
    favoriteFoods: [...allFavoriteFoods],
  };
}

interface LegacyProfileData {
  coreProfile?: { diets?: string[]; allergies?: string[]; goals?: string[] } | null;
  tasteProfile?: { spicyTolerance?: number; texturePreferences?: string[] } | null;
  dislikes?: string[] | null;
  favoriteFoods?: string[] | null;
}

export async function migrateProfileToFoodDna(
  userId: string,
  data: LegacyProfileData
): Promise<UserFoodDNA | null> {
  try {
    const promises: Promise<unknown>[] = [];

    // Migrate dietary constraints
    if (data.coreProfile?.allergies?.length || data.coreProfile?.diets?.length || data.coreProfile?.goals?.length) {
      promises.push(
        supabase.from('user_dietary_constraints').upsert({
          user_id: userId,
          allergies: data.coreProfile?.allergies || [],
          sensitivities: [],
          restrictions: data.coreProfile?.diets || [],
          health_goals: data.coreProfile?.goals || [],
          never_eat: [],
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
      );
    }

    // Migrate flavor profile
    if (data.tasteProfile?.spicyTolerance || data.tasteProfile?.texturePreferences?.length) {
      promises.push(
        supabase.from('user_flavor_profile').upsert({
          user_id: userId,
          spicy_preference: data.tasteProfile?.spicyTolerance ?? 5,
          preferred_textures: data.tasteProfile?.texturePreferences || [],
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
      );
    }

    // Migrate dislikes
    if (data.dislikes?.length) {
      promises.push(
        supabase.from('user_food_dislikes').upsert({
          user_id: userId,
          disliked_foods: data.dislikes,
          avoid_ingredients: [],
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
      );
    }

    await Promise.all(promises);

    // Re-fetch the freshly written Food DNA
    return await fetchUserFoodDNA(userId);
  } catch (error) {
    console.error('Error migrating legacy profile to Food DNA:', error);
    return null;
  }
}
