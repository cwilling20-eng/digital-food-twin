import { supabase } from '../lib/supabase';

export interface UserFoodDNA {
  dietaryConstraints: {
    allergies: string[];
    sensitivities: string[];
    restrictions: string[];
    healthGoals: string[];
    neverEat: string[];
  };
  flavorProfile: {
    sweet: number;
    salty: number;
    sour: number;
    bitter: number;
    umami: number;
    spicy: number;
    preferredTextures: string[];
    dislikedTextures: string[];
    adventurousness: number;
    portionPreference: string;
    likesHotFood: boolean;
    likesColdFood: boolean;
    likesRoomTemp: boolean;
    presentationMatters: number;
  };
  mealPreferences: {
    breakfast: { heaviness: number; favoriteFoods: string[]; favoriteCuisines: string[] };
    brunch: { favoriteFoods: string[]; favoriteCuisines: string[] };
    lunch: { heaviness: number; favoriteFoods: string[]; favoriteCuisines: string[] };
    dinner: { heaviness: number; favoriteFoods: string[]; favoriteCuisines: string[] };
    snack: { favoriteFoods: string[]; favoriteCuisines: string[] };
    dessert: { favoriteFoods: string[]; favoriteCuisines: string[] };
    drink: { favoriteFoods: string[]; favoriteCuisines: string[] };
  };
  cuisineExpertise: Record<string, {
    favoriteDishes: string[];
    favoriteProteins: string[];
    favoritePreparations: string[];
    spiceLevel: number;
    flavorNotes: string[];
    avoid: string[];
    adventureLevel: number;
    stylePreferences: string[];
  }>;
  dislikes: string[];
}

export async function fetchUserFoodDNA(userId: string): Promise<UserFoodDNA | null> {
  try {
    const [
      { data: dietaryConstraints },
      { data: flavorProfile },
      { data: mealFavorites },
      { data: cuisinePreferences },
      { data: foodDislikes }
    ] = await Promise.all([
      supabase
        .from('user_dietary_constraints')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('user_flavor_profile')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('user_meal_favorites')
        .select('*')
        .eq('user_id', userId),
      supabase
        .from('user_cuisine_preferences')
        .select('*')
        .eq('user_id', userId),
      supabase
        .from('user_food_dislikes')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
    ]);

    const mealPreferencesMap: UserFoodDNA['mealPreferences'] = {
      breakfast: { heaviness: flavorProfile?.breakfast_heaviness ?? 5, favoriteFoods: [], favoriteCuisines: [] },
      brunch: { favoriteFoods: [], favoriteCuisines: [] },
      lunch: { heaviness: flavorProfile?.lunch_heaviness ?? 5, favoriteFoods: [], favoriteCuisines: [] },
      dinner: { heaviness: flavorProfile?.dinner_heaviness ?? 5, favoriteFoods: [], favoriteCuisines: [] },
      snack: { favoriteFoods: [], favoriteCuisines: [] },
      dessert: { favoriteFoods: [], favoriteCuisines: [] },
      drink: { favoriteFoods: [], favoriteCuisines: [] }
    };

    if (mealFavorites) {
      for (const fav of mealFavorites) {
        const mealType = fav.meal_type as keyof typeof mealPreferencesMap;
        if (mealPreferencesMap[mealType]) {
          mealPreferencesMap[mealType].favoriteFoods = fav.food_items || [];
          mealPreferencesMap[mealType].favoriteCuisines = fav.cuisine_preferences || [];
        }
      }
    }

    const cuisineExpertise: UserFoodDNA['cuisineExpertise'] = {};
    if (cuisinePreferences) {
      for (const pref of cuisinePreferences) {
        cuisineExpertise[pref.cuisine_type] = {
          favoriteDishes: pref.favorite_dishes || [],
          favoriteProteins: pref.favorite_proteins || [],
          favoritePreparations: pref.favorite_preparations || [],
          spiceLevel: pref.spice_level ?? 5,
          flavorNotes: pref.flavor_notes || [],
          avoid: pref.avoid_items || [],
          adventureLevel: pref.adventure_level ?? 5,
          stylePreferences: pref.style_preferences || []
        };
      }
    }

    const allDislikes: string[] = [
      ...(foodDislikes?.disliked_foods || []),
      ...(foodDislikes?.avoid_ingredients || []),
      ...(dietaryConstraints?.never_eat || [])
    ];

    return {
      dietaryConstraints: {
        allergies: dietaryConstraints?.allergies || [],
        sensitivities: dietaryConstraints?.sensitivities || [],
        restrictions: dietaryConstraints?.restrictions || [],
        healthGoals: dietaryConstraints?.health_goals || [],
        neverEat: dietaryConstraints?.never_eat || []
      },
      flavorProfile: {
        sweet: flavorProfile?.sweet_preference ?? 5,
        salty: flavorProfile?.salty_preference ?? 5,
        sour: flavorProfile?.sour_preference ?? 5,
        bitter: flavorProfile?.bitter_preference ?? 5,
        umami: flavorProfile?.umami_preference ?? 5,
        spicy: flavorProfile?.spicy_preference ?? 5,
        preferredTextures: flavorProfile?.preferred_textures || [],
        dislikedTextures: flavorProfile?.disliked_textures || [],
        adventurousness: flavorProfile?.adventurous_eater ?? 5,
        portionPreference: flavorProfile?.portion_preference || 'medium',
        likesHotFood: flavorProfile?.likes_hot_food ?? true,
        likesColdFood: flavorProfile?.likes_cold_food ?? true,
        likesRoomTemp: flavorProfile?.likes_room_temp ?? true,
        presentationMatters: flavorProfile?.presentation_matters ?? 5
      },
      mealPreferences: mealPreferencesMap,
      cuisineExpertise,
      dislikes: [...new Set(allDislikes)]
    };
  } catch (error) {
    console.error('Error fetching user Food DNA:', error);
    return null;
  }
}
