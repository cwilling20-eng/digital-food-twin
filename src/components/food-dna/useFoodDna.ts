import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type {
  DietaryConstraints,
  FlavorProfile,
  MealFavorites,
  CuisinePreference,
  FoodDislikes,
  FoodDnaData
} from './types';

const DEFAULT_DIETARY_CONSTRAINTS: DietaryConstraints = {
  allergies: [],
  sensitivities: [],
  restrictions: [],
  healthGoals: [],
  neverEat: []
};

const DEFAULT_FLAVOR_PROFILE: FlavorProfile = {
  sweetPreference: 5,
  saltyPreference: 5,
  sourPreference: 5,
  bitterPreference: 5,
  umamiPreference: 5,
  spicyPreference: 5,
  preferredTextures: [],
  dislikedTextures: [],
  breakfastHeaviness: 5,
  lunchHeaviness: 5,
  dinnerHeaviness: 5,
  adventurousEater: 5,
  portionPreference: 'Medium'
};

const DEFAULT_FOOD_DISLIKES: FoodDislikes = {
  dislikedFoods: [],
  avoidIngredients: []
};

export function useFoodDna() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dietaryConstraints, setDietaryConstraints] = useState<DietaryConstraints>(DEFAULT_DIETARY_CONSTRAINTS);
  const [flavorProfile, setFlavorProfile] = useState<FlavorProfile>(DEFAULT_FLAVOR_PROFILE);
  const [mealFavorites, setMealFavorites] = useState<MealFavorites[]>([]);
  const [cuisinePreferences, setCuisinePreferences] = useState<CuisinePreference[]>([]);
  const [foodDislikes, setFoodDislikes] = useState<FoodDislikes>(DEFAULT_FOOD_DISLIKES);

  const calculateCompletion = useCallback((): number => {
    let filled = 0;
    let total = 0;

    total += 5;
    if (dietaryConstraints.allergies.length > 0) filled++;
    if (dietaryConstraints.sensitivities.length > 0) filled++;
    if (dietaryConstraints.restrictions.length > 0) filled++;
    if (dietaryConstraints.healthGoals.length > 0) filled++;
    if (dietaryConstraints.neverEat.length > 0) filled++;

    total += 6;
    if (flavorProfile.sweetPreference !== 5) filled++;
    if (flavorProfile.saltyPreference !== 5) filled++;
    if (flavorProfile.spicyPreference !== 5) filled++;
    if (flavorProfile.preferredTextures.length > 0) filled++;
    if (flavorProfile.adventurousEater !== 5) filled++;
    if (flavorProfile.portionPreference !== 'Medium') filled++;

    total += 3;
    if (mealFavorites.length > 0) filled += Math.min(mealFavorites.length, 3);

    total += 3;
    if (cuisinePreferences.length > 0) filled += Math.min(cuisinePreferences.length, 3);

    total += 2;
    if (foodDislikes.dislikedFoods.length > 0) filled++;
    if (foodDislikes.avoidIngredients.length > 0) filled++;

    return Math.round((filled / total) * 100);
  }, [dietaryConstraints, flavorProfile, mealFavorites, cuisinePreferences, foodDislikes]);

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [constraintsRes, flavorRes, mealRes, cuisineRes, dislikesRes] = await Promise.all([
        supabase.from('user_dietary_constraints').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_flavor_profile').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_meal_favorites').select('*').eq('user_id', user.id),
        supabase.from('user_cuisine_preferences').select('*').eq('user_id', user.id),
        supabase.from('user_food_dislikes').select('*').eq('user_id', user.id).maybeSingle()
      ]);

      if (constraintsRes.data) {
        setDietaryConstraints({
          allergies: constraintsRes.data.allergies || [],
          sensitivities: constraintsRes.data.sensitivities || [],
          restrictions: constraintsRes.data.restrictions || [],
          healthGoals: constraintsRes.data.health_goals || [],
          neverEat: constraintsRes.data.never_eat || []
        });
      }

      if (flavorRes.data) {
        setFlavorProfile({
          sweetPreference: flavorRes.data.sweet_preference ?? 5,
          saltyPreference: flavorRes.data.salty_preference ?? 5,
          sourPreference: flavorRes.data.sour_preference ?? 5,
          bitterPreference: flavorRes.data.bitter_preference ?? 5,
          umamiPreference: flavorRes.data.umami_preference ?? 5,
          spicyPreference: flavorRes.data.spicy_preference ?? 5,
          preferredTextures: flavorRes.data.preferred_textures || [],
          dislikedTextures: flavorRes.data.disliked_textures || [],
          breakfastHeaviness: flavorRes.data.breakfast_heaviness ?? 5,
          lunchHeaviness: flavorRes.data.lunch_heaviness ?? 5,
          dinnerHeaviness: flavorRes.data.dinner_heaviness ?? 5,
          adventurousEater: flavorRes.data.adventurous_eater ?? 5,
          portionPreference: flavorRes.data.portion_preference || 'Medium'
        });
      }

      if (mealRes.data) {
        setMealFavorites(mealRes.data.map(m => ({
          mealType: m.meal_type,
          foodItems: m.food_items || [],
          cuisinePreferences: m.cuisine_preferences || []
        })));
      }

      if (cuisineRes.data) {
        setCuisinePreferences(cuisineRes.data.map(c => ({
          cuisineType: c.cuisine_type,
          favoriteDishes: c.favorite_dishes || [],
          favoriteProteins: c.favorite_proteins || [],
          favoritePreparations: c.favorite_preparations || [],
          spiceLevel: c.spice_level ?? 5,
          adventureLevel: c.adventure_level ?? 5,
          stylePreferences: c.style_preferences || [],
          avoidItems: c.avoid_items || [],
          extraPreferences: c.extra_preferences || {}
        })));
      }

      if (dislikesRes.data) {
        setFoodDislikes({
          dislikedFoods: dislikesRes.data.disliked_foods || [],
          avoidIngredients: dislikesRes.data.avoid_ingredients || []
        });
      }
    } catch (error) {
      console.error('Error loading Food DNA data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveDietaryConstraints = async (data: DietaryConstraints) => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_dietary_constraints')
        .upsert({
          user_id: user.id,
          allergies: data.allergies,
          sensitivities: data.sensitivities,
          restrictions: data.restrictions,
          health_goals: data.healthGoals,
          never_eat: data.neverEat,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
      setDietaryConstraints(data);
    } catch (error) {
      console.error('Error saving dietary constraints:', error);
    } finally {
      setSaving(false);
    }
  };

  const saveFlavorProfile = async (data: FlavorProfile) => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_flavor_profile')
        .upsert({
          user_id: user.id,
          sweet_preference: data.sweetPreference,
          salty_preference: data.saltyPreference,
          sour_preference: data.sourPreference,
          bitter_preference: data.bitterPreference,
          umami_preference: data.umamiPreference,
          spicy_preference: data.spicyPreference,
          preferred_textures: data.preferredTextures,
          disliked_textures: data.dislikedTextures,
          breakfast_heaviness: data.breakfastHeaviness,
          lunch_heaviness: data.lunchHeaviness,
          dinner_heaviness: data.dinnerHeaviness,
          adventurous_eater: data.adventurousEater,
          portion_preference: data.portionPreference,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
      setFlavorProfile(data);
    } catch (error) {
      console.error('Error saving flavor profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const saveMealFavorites = async (mealType: string, data: Omit<MealFavorites, 'mealType'>) => {
    if (!user) return;
    setSaving(true);
    try {
      const existingIndex = mealFavorites.findIndex(m => m.mealType === mealType);

      const { error } = await supabase
        .from('user_meal_favorites')
        .upsert({
          user_id: user.id,
          meal_type: mealType,
          food_items: data.foodItems,
          cuisine_preferences: data.cuisinePreferences,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,meal_type' });

      if (error) {
        const existing = await supabase
          .from('user_meal_favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('meal_type', mealType)
          .maybeSingle();

        if (existing.data) {
          await supabase
            .from('user_meal_favorites')
            .update({
              food_items: data.foodItems,
              cuisine_preferences: data.cuisinePreferences,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.data.id);
        } else {
          await supabase
            .from('user_meal_favorites')
            .insert({
              user_id: user.id,
              meal_type: mealType,
              food_items: data.foodItems,
              cuisine_preferences: data.cuisinePreferences
            });
        }
      }

      const newFavorite: MealFavorites = { mealType, ...data };
      if (existingIndex >= 0) {
        const updated = [...mealFavorites];
        updated[existingIndex] = newFavorite;
        setMealFavorites(updated);
      } else {
        setMealFavorites([...mealFavorites, newFavorite]);
      }
    } catch (error) {
      console.error('Error saving meal favorites:', error);
    } finally {
      setSaving(false);
    }
  };

  const saveCuisinePreference = async (cuisineType: string, data: Omit<CuisinePreference, 'cuisineType'>) => {
    if (!user) return;
    setSaving(true);
    try {
      const existingIndex = cuisinePreferences.findIndex(c => c.cuisineType === cuisineType);

      const existing = await supabase
        .from('user_cuisine_preferences')
        .select('id')
        .eq('user_id', user.id)
        .eq('cuisine_type', cuisineType)
        .maybeSingle();

      if (existing.data) {
        await supabase
          .from('user_cuisine_preferences')
          .update({
            favorite_dishes: data.favoriteDishes,
            favorite_proteins: data.favoriteProteins,
            favorite_preparations: data.favoritePreparations,
            spice_level: data.spiceLevel,
            adventure_level: data.adventureLevel,
            style_preferences: data.stylePreferences,
            avoid_items: data.avoidItems,
            extra_preferences: data.extraPreferences,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.data.id);
      } else {
        await supabase
          .from('user_cuisine_preferences')
          .insert({
            user_id: user.id,
            cuisine_type: cuisineType,
            favorite_dishes: data.favoriteDishes,
            favorite_proteins: data.favoriteProteins,
            favorite_preparations: data.favoritePreparations,
            spice_level: data.spiceLevel,
            adventure_level: data.adventureLevel,
            style_preferences: data.stylePreferences,
            avoid_items: data.avoidItems,
            extra_preferences: data.extraPreferences
          });
      }

      const newPref: CuisinePreference = { cuisineType, ...data };
      if (existingIndex >= 0) {
        const updated = [...cuisinePreferences];
        updated[existingIndex] = newPref;
        setCuisinePreferences(updated);
      } else {
        setCuisinePreferences([...cuisinePreferences, newPref]);
      }
    } catch (error) {
      console.error('Error saving cuisine preference:', error);
    } finally {
      setSaving(false);
    }
  };

  const saveFoodDislikes = async (data: FoodDislikes) => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_food_dislikes')
        .upsert({
          user_id: user.id,
          disliked_foods: data.dislikedFoods,
          avoid_ingredients: data.avoidIngredients,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
      setFoodDislikes(data);
    } catch (error) {
      console.error('Error saving food dislikes:', error);
    } finally {
      setSaving(false);
    }
  };

  const getFoodDnaData = useCallback((): FoodDnaData => ({
    dietaryConstraints,
    flavorProfile,
    mealFavorites,
    cuisinePreferences,
    foodDislikes,
    completionPercentage: calculateCompletion()
  }), [dietaryConstraints, flavorProfile, mealFavorites, cuisinePreferences, foodDislikes, calculateCompletion]);

  return {
    loading,
    saving,
    dietaryConstraints,
    flavorProfile,
    mealFavorites,
    cuisinePreferences,
    foodDislikes,
    completionPercentage: calculateCompletion(),
    saveDietaryConstraints,
    saveFlavorProfile,
    saveMealFavorites,
    saveCuisinePreference,
    saveFoodDislikes,
    getFoodDnaData,
    reload: loadData
  };
}
