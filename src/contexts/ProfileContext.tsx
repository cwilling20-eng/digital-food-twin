import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';
import type { ComprehensiveUserProfile } from '../types';
import { feetFromTotalInches } from '../utils/nutritionCalc';
import { fetchUserFoodDNA } from '../utils/fetchUserFoodDNA';
import { buildComprehensiveProfile, migrateProfileToFoodDna } from '../utils/profileAdapter';

export interface StoredProfile {
  onboardingComplete: boolean;
  savoryPreference: number;
  spicyPreference: number;
  freshPreference: number;
  swipedFoods: string[];
}

interface ProfileContextType {
  profile: StoredProfile;
  comprehensiveProfile: ComprehensiveUserProfile;
  refreshProfile: () => Promise<void>;
  saveProfile: (p: StoredProfile) => Promise<void>;
  isLoading: boolean;
  userId: string;
  userEmail: string;
  handleLogout: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const DEFAULT_PROFILE: StoredProfile = {
  onboardingComplete: false,
  savoryPreference: 50,
  spicyPreference: 50,
  freshPreference: 50,
  swipedFoods: [],
};

const DEFAULT_COMPREHENSIVE: ComprehensiveUserProfile = {
  coreProfile: { diets: [], allergies: [], goals: [] },
  tasteProfile: { spicyTolerance: 5, texturePreferences: [], sweetVsSavory: 5 },
  dislikes: [],
  favoriteFoods: [],
};

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const { setNutritionGoals, setBodyMetrics } = useApp();

  const [profile, setProfile] = useState<StoredProfile>(DEFAULT_PROFILE);
  const [comprehensiveProfile, setComprehensiveProfile] = useState<ComprehensiveUserProfile>(DEFAULT_COMPREHENSIVE);
  const [isLoading, setIsLoading] = useState(true);

  const userId = user?.id || '';
  const userEmail = user?.email || '';

  useEffect(() => {
    if (!userId) return;

    const initializeApp = async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
      }

      if (data) {
        const loadedProfile: StoredProfile = {
          onboardingComplete: data.onboarding_complete,
          savoryPreference: data.savory_preference,
          spicyPreference: data.spicy_preference,
          freshPreference: data.fresh_preference,
          swipedFoods: data.swiped_foods || [],
        };
        setProfile(loadedProfile);

        // Fetch Food DNA from dedicated tables
        let foodDna = await fetchUserFoodDNA(userId);

        // One-time migration: if legacy data exists but Food DNA is empty
        if (!foodDna && (data.core_profile || data.taste_profile)) {
          foodDna = await migrateProfileToFoodDna(userId, {
            coreProfile: data.core_profile,
            tasteProfile: data.taste_profile,
            dislikes: data.dislikes,
            favoriteFoods: data.favorite_foods,
          });
        }

        setComprehensiveProfile(buildComprehensiveProfile(foodDna));

        setNutritionGoals({
          calorieGoal: data.calorie_goal || data.daily_calorie_target || 2000,
          proteinGoal: data.protein_goal || 150,
          carbsGoal: data.carbs_goal || 200,
          fatGoal: data.fat_goal || 65,
          waterGoal: data.water_goal || 8,
        });

        const heightParts = feetFromTotalInches(data.height_inches ?? null);
        setBodyMetrics({
          startingWeight: data.starting_weight ?? null,
          currentWeight: data.current_weight ?? null,
          goalWeight: data.goal_weight ?? null,
          heightFeet: heightParts?.feet ?? null,
          heightInches: heightParts?.inches ?? null,
          birthDate: data.birth_date ?? '',
          gender: data.gender ?? 'male',
          weeklyWeightGoal: data.weekly_weight_goal ?? 1,
          activityLevel: data.activity_level ?? 'sedentary',
          useCustomGoals: data.use_custom_goals ?? true,
        });
      } else {
        // No Supabase profile yet — still load Food DNA if available
        const foodDna = await fetchUserFoodDNA(userId);
        setComprehensiveProfile(buildComprehensiveProfile(foodDna));
      }

      setIsLoading(false);
    };

    initializeApp();
  }, [userId]);

  const saveProfile = useCallback(async (newProfile: StoredProfile) => {
    setProfile(newProfile);

    if (userId) {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          onboarding_complete: newProfile.onboardingComplete,
          savory_preference: newProfile.savoryPreference,
          spicy_preference: newProfile.spicyPreference,
          fresh_preference: newProfile.freshPreference,
          swiped_foods: newProfile.swipedFoods,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Error saving profile to Supabase:', error);
      }
    }
  }, [userId]);

  const refreshProfile = useCallback(async () => {
    if (!userId) return;
    const foodDna = await fetchUserFoodDNA(userId);
    setComprehensiveProfile(buildComprehensiveProfile(foodDna));
  }, [userId]);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <ProfileContext.Provider value={{
      profile, comprehensiveProfile, refreshProfile,
      saveProfile, isLoading, userId, userEmail, handleLogout,
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
