export interface FoodItem {
  id: string;
  name: string;
  image_url: string;
  tags: string[];
  savory_score: number;
  spicy_score: number;
  fresh_score: number;
}

export interface UserProfile {
  id: string;
  onboarding_complete: boolean;
  savory_preference: number;
  spicy_preference: number;
  fresh_preference: number;
}

export interface FoodPreference {
  id: string;
  user_id: string;
  food_id: string;
  liked: boolean;
}

export type DietType = 'Omnivore' | 'Vegetarian' | 'Vegan' | 'Keto' | 'Paleo';
export type AllergyType = 'Gluten' | 'Dairy' | 'Nuts' | 'Shellfish' | 'Soy';
export type GoalType = 'Weight Loss' | 'Muscle Gain' | 'Maintenance';

export interface CoreProfile {
  diets: DietType[];
  allergies: AllergyType[];
  goals: GoalType[];
}

export interface TasteProfile {
  spicyTolerance: number;
  texturePreferences: string[];
  sweetVsSavory: number;
}

export interface ComprehensiveUserProfile {
  coreProfile: CoreProfile;
  tasteProfile: TasteProfile;
  dislikes: string[];
  favoriteFoods: string[];
}

export interface SwipeTag {
  category: 'taste' | 'texture' | 'cuisine' | 'temperature';
  value: string;
}

export interface NutritionGoals {
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  waterGoal: number;
}

export interface MealLogEntry {
  id: string;
  meal_name: string;
  meal_type: string | null;
  estimated_calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  sugar_g: number | null;
  sodium_mg: number | null;
  feeling: string | null;
  created_at: string;
  quantity?: number | null;
  unit?: string | null;
  nutrition_source?: 'estimated' | 'manual' | 'combined' | null;
  per_unit_calories?: number | null;
  per_unit_protein_g?: number | null;
  per_unit_carbs_g?: number | null;
  per_unit_fat_g?: number | null;
}

export type Screen = 'onboarding' | 'swipe' | 'dashboard' | 'diary' | 'nutrition' | 'scanner' | 'recommendations' | 'history' | 'chat' | 'profile' | 'food-dna' | 'my-goals' | 'progress' | 'settings' | 'about' | 'friends';

export interface PublicProfile {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  shareFoodDna: boolean;
}

export interface FriendData {
  id: string;
  friendId: string;
  userId: string;
  status: 'pending' | 'accepted' | 'declined';
  profile: PublicProfile;
  requestedAt: string;
  acceptedAt: string | null;
}

export type MealTypeContext = 'breakfast' | 'brunch' | 'lunch' | 'dinner' | 'snack';
export type CuisinePreference = 'surprise_me' | string;

export interface DiningContext {
  isGroupDining: boolean;
  selectedFriendIds: string[];
  selectedFriendNames: string[];
  mealType?: MealTypeContext;
  cuisinePreference?: CuisinePreference;
}

export interface FriendFoodDna {
  userId: string;
  displayName: string;
  shared?: boolean;
  foodDna?: {
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
    };
    mealPreferences: Record<string, { favoriteFoods: string[]; favoriteCuisines: string[] }>;
    cuisineExpertise: Record<string, {
      favoriteDishes: string[];
      favoriteProteins: string[];
      spiceLevel: number;
      avoid: string[];
    }>;
    dislikes: string[];
  };
  favoriteCuisines: string[];
  restrictions: string[];
  allergies: string[];
}
