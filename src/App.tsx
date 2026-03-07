import { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider, useApp } from './contexts/AppContext';
import { AuthScreen } from './components/AuthScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { SwipeDeck } from './components/SwipeDeck';
import { Dashboard } from './components/Dashboard';
import { MenuScanner } from './components/MenuScanner';
import { ChatResults } from './components/ChatResults';
import { HistoryScreen } from './components/HistoryScreen';
import { BottomNav } from './components/BottomNav';
import { MoreMenu } from './components/more/MoreMenu';
import { FoodDnaHub } from './components/food-dna';
import { MyGoalsScreen } from './components/more/MyGoalsScreen';
import { ProgressScreen } from './components/more/ProgressScreen';
import { SettingsScreen } from './components/more/SettingsScreen';
import { AboutScreen } from './components/more/AboutScreen';
import { DiaryScreen } from './components/diary/DiaryScreen';
import { QuickAddModal } from './components/diary/QuickAddModal';
import { NutritionSummary } from './components/nutrition/NutritionSummary';
import { FriendsScreen } from './components/friends';
import type { MealData } from './components/nutrition/types';
import { LOCAL_FOODS, ONBOARDING_FOODS } from './data/foods';
import type { FoodItem, Screen, ComprehensiveUserProfile, DiningContext } from './types';
import { DEFAULT_BODY_METRICS, feetFromTotalInches, totalHeightInches } from './utils/nutritionCalc';

const STORAGE_KEY = 'digital_food_twin_profile';
const COMPREHENSIVE_PROFILE_KEY = 'digital_food_twin_comprehensive_profile';

interface StoredProfile {
  onboardingComplete: boolean;
  savoryPreference: number;
  spicyPreference: number;
  freshPreference: number;
  swipedFoods: string[];
}

function AuthenticatedApp() {
  const { user, signUp, signIn, signOut } = useAuth();
  const { nutritionGoals, setNutritionGoals, bodyMetrics, setBodyMetrics } = useApp();

  const [screen, setScreen] = useState<Screen>('onboarding');
  const [foods, setFoods] = useState<FoodItem[]>(LOCAL_FOODS);
  const [loading, setLoading] = useState(true);
  const [scanMode, setScanMode] = useState<'goal' | 'enjoyment'>('goal');
  const [diningContext, setDiningContext] = useState<DiningContext | null>(null);
  const [autoMessage, setAutoMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<StoredProfile>({
    onboardingComplete: false,
    savoryPreference: 50,
    spicyPreference: 50,
    freshPreference: 50,
    swipedFoods: []
  });
  const [likedFoods, setLikedFoods] = useState<FoodItem[]>([]);
  const [apiRecommendations, setApiRecommendations] = useState<any>(null);
  const [comprehensiveProfile, setComprehensiveProfile] = useState<ComprehensiveUserProfile>({
    coreProfile: {
      diets: [],
      allergies: [],
      goals: []
    },
    tasteProfile: {
      spicyTolerance: 5,
      texturePreferences: [],
      sweetVsSavory: 5
    },
    dislikes: [],
    favoriteFoods: []
  });
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [nutritionMeals, setNutritionMeals] = useState<MealData[]>([]);
  const [nutritionDate, setNutritionDate] = useState(new Date());

  const userId = user?.id || '';

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
          swipedFoods: data.swiped_foods || []
        };
        setProfile(loadedProfile);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedProfile));

        if (data.core_profile || data.taste_profile || data.dislikes || data.favorite_foods) {
          const loadedComprehensive: ComprehensiveUserProfile = {
            coreProfile: {
              diets: data.core_profile?.diets || [],
              allergies: data.core_profile?.allergies || [],
              goals: data.core_profile?.goals || []
            },
            tasteProfile: {
              spicyTolerance: data.taste_profile?.spicyTolerance ?? 5,
              texturePreferences: data.taste_profile?.texturePreferences || [],
              sweetVsSavory: data.taste_profile?.sweetVsSavory ?? 5
            },
            dislikes: data.dislikes || [],
            favoriteFoods: data.favorite_foods || []
          };
          setComprehensiveProfile(loadedComprehensive);
          localStorage.setItem(COMPREHENSIVE_PROFILE_KEY, JSON.stringify(loadedComprehensive));
        }

        setNutritionGoals({
          calorieGoal: data.calorie_goal || data.daily_calorie_target || 2000,
          proteinGoal: data.protein_goal || 150,
          carbsGoal: data.carbs_goal || 200,
          fatGoal: data.fat_goal || 65,
          waterGoal: data.water_goal || 8
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

        if (data.onboarding_complete) {
          setScreen('dashboard');
        }
      } else {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as StoredProfile;
          setProfile(parsed);
          if (parsed.onboardingComplete) {
            setScreen('dashboard');
          }
        }

        const storedComprehensive = localStorage.getItem(COMPREHENSIVE_PROFILE_KEY);
        if (storedComprehensive) {
          const parsed = JSON.parse(storedComprehensive);
          setComprehensiveProfile({
            coreProfile: {
              diets: parsed.coreProfile?.diets || [],
              allergies: parsed.coreProfile?.allergies || [],
              goals: parsed.coreProfile?.goals || []
            },
            tasteProfile: {
              spicyTolerance: parsed.tasteProfile?.spicyTolerance ?? 5,
              texturePreferences: parsed.tasteProfile?.texturePreferences || [],
              sweetVsSavory: parsed.tasteProfile?.sweetVsSavory ?? 5
            },
            dislikes: parsed.dislikes || [],
            favoriteFoods: parsed.favoriteFoods || []
          });
        }
      }

      setLoading(false);
    };

    initializeApp();
  }, [userId]);

  useEffect(() => {
    const fetchFoods = async () => {
      const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .order('created_at');

      if (error) {
        console.error('Error fetching foods:', error);
        return;
      }

      if (data && data.length > 0) {
        setFoods([...data, ...LOCAL_FOODS]);
      }
    };

    fetchFoods();
  }, []);

  const saveProfile = useCallback(async (newProfile: StoredProfile) => {
    setProfile(newProfile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));

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
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving profile to Supabase:', error);
      }
    }
  }, [userId]);

  const handleStartProfile = () => {
    setScreen('swipe');
  };

  const handleSwipe = (food: FoodItem, liked: boolean) => {
    if (liked) {
      setLikedFoods(prev => [...prev, food]);
    }

    const newSwipedFoods = [...profile.swipedFoods, food.id];
    saveProfile({
      ...profile,
      swipedFoods: newSwipedFoods
    });
  };

  const handleSwipeComplete = () => {
    const totalLiked = likedFoods.length;
    if (totalLiked === 0) {
      saveProfile({
        ...profile,
        onboardingComplete: true,
        savoryPreference: 50,
        spicyPreference: 50,
        freshPreference: 50
      });
    } else {
      const avgSavory = Math.round(
        likedFoods.reduce((sum, f) => sum + f.savory_score, 0) / totalLiked
      );
      const avgSpicy = Math.round(
        likedFoods.reduce((sum, f) => sum + f.spicy_score, 0) / totalLiked
      );
      const avgFresh = Math.round(
        likedFoods.reduce((sum, f) => sum + f.fresh_score, 0) / totalLiked
      );

      saveProfile({
        ...profile,
        onboardingComplete: true,
        savoryPreference: avgSavory,
        spicyPreference: avgSpicy,
        freshPreference: avgFresh
      });
    }

    setScreen('food-dna');
  };

  const handleScanComplete = (recommendations: any) => {
    setApiRecommendations(recommendations);
    setDiningContext(null);
    setAutoMessage(null);
    setScreen('recommendations');
  };

  const handleBackToDashboard = () => {
    setScreen('dashboard');
    setApiRecommendations(null);
  };

  const handleReset = async () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(COMPREHENSIVE_PROFILE_KEY);

    const resetProfile = {
      onboardingComplete: false,
      savoryPreference: 50,
      spicyPreference: 50,
      freshPreference: 50,
      swipedFoods: []
    };

    const resetComprehensive = {
      coreProfile: {
        diets: [],
        allergies: [],
        goals: []
      },
      tasteProfile: {
        spicyTolerance: 5,
        texturePreferences: [],
        sweetVsSavory: 5
      },
      dislikes: [],
      favoriteFoods: []
    };

    setProfile(resetProfile);
    setComprehensiveProfile(resetComprehensive);
    setLikedFoods([]);

    if (userId) {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting profile from Supabase:', error);
      }
    }

    setScreen('onboarding');
  };

  const handleBackToOnboarding = () => {
    setScreen('onboarding');
  };

  const handleNavigate = (newScreen: Screen) => {
    setScreen(newScreen);
  };

  const handleSaveComprehensiveProfile = async (newProfile: ComprehensiveUserProfile) => {
    setComprehensiveProfile(newProfile);
    localStorage.setItem(COMPREHENSIVE_PROFILE_KEY, JSON.stringify(newProfile));

    if (userId) {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          core_profile: newProfile.coreProfile,
          taste_profile: newProfile.tasteProfile,
          dislikes: newProfile.dislikes,
          favorite_foods: newProfile.favoriteFoods,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving comprehensive profile to Supabase:', error);
      }
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(COMPREHENSIVE_PROFILE_KEY);
    await signOut();
  };

  const availableFoods = foods.filter(f => !profile.swipedFoods.includes(f.id));

  if (!user) {
    return <AuthScreen onSignIn={signIn} onSignUp={signUp} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {screen === 'onboarding' && (
        <OnboardingScreen onStart={handleStartProfile} />
      )}

      {screen === 'swipe' && (
        <SwipeDeck
          foods={ONBOARDING_FOODS}
          onSwipe={handleSwipe}
          onComplete={handleSwipeComplete}
          onBack={handleBackToOnboarding}
        />
      )}

      {screen === 'dashboard' && (
        <Dashboard
          userId={userId}
          userEmail={user.email || ''}
          onNavigate={handleNavigate}
          onScan={() => setScreen('scanner')}
          onFindRestaurant={(context, message) => {
            console.log("App.tsx onFindRestaurant called:", { context, message });
            setDiningContext(context);
            setAutoMessage(message);
            setScreen('chat');
          }}
        />
      )}

      {screen === 'scanner' && (
        <MenuScanner
          onScanComplete={handleScanComplete}
          comprehensiveProfile={comprehensiveProfile}
          scanMode={scanMode}
          setScanMode={setScanMode}
          deviceId={userId}
        />
      )}

      {screen === 'recommendations' && (
        <ChatResults
          initialAnalysis={apiRecommendations?.output || JSON.stringify(apiRecommendations?.recommendations || apiRecommendations || {}, null, 2)}
          userProfile={comprehensiveProfile}
          deviceId={userId}
          onBack={handleBackToDashboard}
          diningContext={diningContext || undefined}
          onLogMeal={() => {
            setScreen('diary');
            setShowQuickAdd(true);
          }}
        />
      )}

      {screen === 'chat' && (
        <ChatResults
          userProfile={comprehensiveProfile}
          deviceId={userId}
          onBack={() => {
            setDiningContext(null);
            setAutoMessage(null);
            setScreen('dashboard');
          }}
          diningContext={diningContext || undefined}
          autoMessage={autoMessage || undefined}
          onLogMeal={() => {
            setScreen('diary');
            setShowQuickAdd(true);
          }}
        />
      )}

      {screen === 'diary' && (
        <DiaryScreen
          userId={userId}
          onOpenQuickAdd={() => setShowQuickAdd(true)}
          onOpenNutrition={(meals, date) => {
            setNutritionMeals(meals);
            setNutritionDate(date);
            setScreen('nutrition');
          }}
        />
      )}

      {screen === 'nutrition' && (
        <NutritionSummary
          meals={nutritionMeals}
          goals={{
            calorieGoal: nutritionGoals.calorieGoal,
            proteinGoal: nutritionGoals.proteinGoal,
            carbsGoal: nutritionGoals.carbsGoal,
            fatGoal: nutritionGoals.fatGoal
          }}
          date={nutritionDate}
          onBack={() => setScreen('diary')}
        />
      )}

      {screen === 'history' && (
        <HistoryScreen userId={userId} />
      )}

      {screen === 'profile' && (
        <MoreMenu
          userEmail={user.email || ''}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}

      {screen === 'food-dna' && (
        <FoodDnaHub onBack={() => setScreen('profile')} />
      )}

      {screen === 'my-goals' && (
        <MyGoalsScreen
          onSave={async (newGoals, newMetrics) => {
            if (!userId) return { error: 'Not signed in' };
            const { error } = await supabase
              .from('user_profiles')
              .upsert({
                user_id: userId,
                calorie_goal: newGoals.calorieGoal,
                protein_goal: newGoals.proteinGoal,
                carbs_goal: newGoals.carbsGoal,
                fat_goal: newGoals.fatGoal,
                water_goal: newGoals.waterGoal,
                starting_weight: newMetrics.startingWeight,
                current_weight: newMetrics.currentWeight,
                goal_weight: newMetrics.goalWeight,
                height_inches: totalHeightInches(newMetrics.heightFeet, newMetrics.heightInches),
                birth_date: newMetrics.birthDate || null,
                gender: newMetrics.gender,
                weekly_weight_goal: newMetrics.weeklyWeightGoal,
                activity_level: newMetrics.activityLevel,
                use_custom_goals: newMetrics.useCustomGoals,
                updated_at: new Date().toISOString()
              }, { onConflict: 'user_id' });
            if (error) return { error: error.message };
            setNutritionGoals(newGoals);
            setBodyMetrics(newMetrics);
            return {};
          }}
          onBack={() => setScreen('profile')}
        />
      )}

      {screen === 'progress' && (
        <ProgressScreen onBack={() => setScreen('profile')} />
      )}

      {screen === 'settings' && (
        <SettingsScreen
          userEmail={user.email || ''}
          onLogout={handleLogout}
          onBack={() => setScreen('profile')}
        />
      )}

      {screen === 'about' && (
        <AboutScreen onBack={() => setScreen('profile')} />
      )}

      {screen === 'friends' && (
        <FriendsScreen
          userId={userId}
          onNavigate={handleNavigate}
          onPlanDinner={(friendIds, friendNames) => {
            setDiningContext({
              isGroupDining: true,
              selectedFriendIds: friendIds,
              selectedFriendNames: friendNames,
              mealType: 'dinner',
              cuisinePreference: 'surprise_me'
            });
            setScreen('chat');
          }}
        />
      )}

      {!['onboarding', 'swipe', 'nutrition'].includes(screen) && (
        <BottomNav
          currentScreen={screen}
          onNavigate={handleNavigate}
          onQuickAdd={() => {
            if (screen !== 'diary') setScreen('diary');
            setShowQuickAdd(true);
          }}
          onScanMenu={() => setScreen('scanner')}
        />
      )}

      {showQuickAdd && (
        <QuickAddModal
          onSave={async (data) => {
            const mealLogData: Record<string, unknown> = {
              user_id: userId,
              meal_name: data.meal_name,
              meal_type: data.meal_type,
              feeling: data.feeling,
              notes: data.notes
            };
            if (data.nutrition) {
              mealLogData.estimated_calories = data.nutrition.calories;
              mealLogData.protein_g = data.nutrition.protein_g;
              mealLogData.carbs_g = data.nutrition.carbs_g;
              mealLogData.fat_g = data.nutrition.fat_g;
              mealLogData.fiber_g = data.nutrition.fiber_g;
              mealLogData.sugar_g = data.nutrition.sugar_g;
              mealLogData.sodium_mg = data.nutrition.sodium_mg;
            }
            const { error } = await supabase.from('meal_logs').insert(mealLogData);
            if (error) {
              alert(`Failed to save: ${error.message}`);
              return;
            }
            setShowQuickAdd(false);
          }}
          onClose={() => setShowQuickAdd(false)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AuthenticatedApp />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
