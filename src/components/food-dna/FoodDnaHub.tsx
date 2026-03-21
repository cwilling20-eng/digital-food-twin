import { useState, useCallback, useEffect } from 'react';
import {
  ArrowLeft,
  ShieldAlert,
  Sparkles,
  Utensils,
  ChefHat,
  ThumbsDown,
  ChevronRight,
  Loader2,
  Dna
} from 'lucide-react';
import { ProgressRing } from './SharedComponents';
import { useFoodDna } from './useFoodDna';
import { useProfile } from '../../contexts/ProfileContext';
import { DietaryConstraintsSection } from './DietaryConstraintsSection';
import { FlavorProfileSection } from './FlavorProfileSection';
import { MealFavoritesSection } from './MealFavoritesSection';
import { CuisineExpertiseSection } from './CuisineExpertiseSection';
import { DislikesSection } from './DislikesSection';

type Section = 'hub' | 'constraints' | 'flavors' | 'meals' | 'cuisines' | 'dislikes';

interface FoodDnaHubProps {
  onBack: () => void;
}

interface SectionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  completionItems: string[];
  onClick: () => void;
  accentColor: string;
}

function NavigationCard({
  icon,
  title,
  description,
  completionItems,
  onClick,
  accentColor
}: SectionCardProps) {
  const hasData = completionItems.length > 0;

  return (
    <button
      onClick={onClick}
      className="w-full bg-nm-surface rounded-[2rem] p-5 hover:bg-nm-surface-high transition-all text-left group active:scale-[0.98]"
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-[1rem] flex items-center justify-center ${accentColor}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-nm-text">{title}</h3>
            <ChevronRight className="w-5 h-5 text-nm-text/30 group-hover:text-nm-signature transition-colors" />
          </div>
          <p className="text-sm text-nm-text/60 mt-0.5">{description}</p>
          {hasData && (
            <div className="mt-3 flex flex-wrap gap-2">
              {completionItems.slice(0, 3).map((item, i) => (
                <span
                  key={i}
                  className="text-xs px-3 py-1 bg-nm-surface-high text-nm-text rounded-full font-bold"
                >
                  {item}
                </span>
              ))}
              {completionItems.length > 3 && (
                <span className="text-xs px-3 py-1 bg-nm-surface-high text-nm-text/60 rounded-full font-bold">
                  +{completionItems.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export function FoodDnaHub({ onBack }: FoodDnaHubProps) {
  const [currentSection, setCurrentSection] = useState<Section>('hub');
  const { refreshProfile } = useProfile();
  const {
    loading,
    saving,
    dietaryConstraints,
    flavorProfile,
    mealFavorites,
    cuisinePreferences,
    foodDislikes,
    completionPercentage,
    saveDietaryConstraints,
    saveFlavorProfile,
    saveMealFavorites,
    saveCuisinePreference,
    saveFoodDislikes
  } = useFoodDna();

  // Wrap save functions to sync comprehensive profile after each save
  const handleSaveDietaryConstraints = useCallback(async (...args: Parameters<typeof saveDietaryConstraints>) => {
    await saveDietaryConstraints(...args);
    await refreshProfile();
  }, [saveDietaryConstraints, refreshProfile]);

  const handleSaveFlavorProfile = useCallback(async (...args: Parameters<typeof saveFlavorProfile>) => {
    await saveFlavorProfile(...args);
    await refreshProfile();
  }, [saveFlavorProfile, refreshProfile]);

  const handleSaveMealFavorites = useCallback(async (...args: Parameters<typeof saveMealFavorites>) => {
    await saveMealFavorites(...args);
    await refreshProfile();
  }, [saveMealFavorites, refreshProfile]);

  const handleSaveCuisinePreference = useCallback(async (...args: Parameters<typeof saveCuisinePreference>) => {
    await saveCuisinePreference(...args);
    await refreshProfile();
  }, [saveCuisinePreference, refreshProfile]);

  const handleSaveFoodDislikes = useCallback(async (...args: Parameters<typeof saveFoodDislikes>) => {
    await saveFoodDislikes(...args);
    await refreshProfile();
  }, [saveFoodDislikes, refreshProfile]);

  // Loading timeout — if data doesn't load after 5s, show the page anyway with defaults
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setTimedOut(true), 5000);
    return () => clearTimeout(t);
  }, [loading]);

  if (loading && !timedOut) {
    return (
      <div className="min-h-screen bg-nm-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-nm-signature animate-spin mx-auto mb-3" />
          <p className="text-nm-text/60">Loading your Food DNA...</p>
        </div>
      </div>
    );
  }

  if (currentSection === 'constraints') {
    return (
      <DietaryConstraintsSection
        data={dietaryConstraints}
        onSave={handleSaveDietaryConstraints}
        onBack={() => setCurrentSection('hub')}
        saving={saving}
      />
    );
  }

  if (currentSection === 'flavors') {
    return (
      <FlavorProfileSection
        data={flavorProfile}
        onSave={handleSaveFlavorProfile}
        onBack={() => setCurrentSection('hub')}
        saving={saving}
      />
    );
  }

  if (currentSection === 'meals') {
    return (
      <MealFavoritesSection
        data={mealFavorites}
        onSave={handleSaveMealFavorites}
        onBack={() => setCurrentSection('hub')}
        saving={saving}
      />
    );
  }

  if (currentSection === 'cuisines') {
    return (
      <CuisineExpertiseSection
        data={cuisinePreferences}
        onSave={handleSaveCuisinePreference}
        onBack={() => setCurrentSection('hub')}
        saving={saving}
      />
    );
  }

  if (currentSection === 'dislikes') {
    return (
      <DislikesSection
        data={foodDislikes}
        onSave={handleSaveFoodDislikes}
        onBack={() => setCurrentSection('hub')}
        saving={saving}
      />
    );
  }

  const constraintItems = [
    ...dietaryConstraints.allergies,
    ...dietaryConstraints.restrictions.slice(0, 2)
  ];

  const flavorItems = [];
  if (flavorProfile.spicyPreference !== 5) {
    flavorItems.push(flavorProfile.spicyPreference >= 7 ? 'Loves spicy' : 'Mild preference');
  }
  if (flavorProfile.preferredTextures.length > 0) {
    flavorItems.push(...flavorProfile.preferredTextures.slice(0, 2));
  }
  if (flavorProfile.portionPreference !== 'Medium') {
    flavorItems.push(`${flavorProfile.portionPreference} portions`);
  }

  const mealItems = mealFavorites.flatMap(m => m.foodItems).slice(0, 4);
  const cuisineItems = cuisinePreferences.map(c => c.cuisineType.replace('-', ' ')).slice(0, 3);
  const dislikeItems = foodDislikes.dislikedFoods.slice(0, 3);

  return (
    <div className="min-h-screen bg-nm-bg pb-40">
      <div className="bg-gradient-to-br from-nm-signature to-nm-signature-light px-6 pt-12 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Food DNA Hub</h1>
            <p className="text-white/70 text-sm mt-0.5">Your complete taste profile</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-[2rem] p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Dna className="w-5 h-5 text-white/80" />
                <span className="text-white font-bold">Your Food DNA</span>
              </div>
              <p className="text-white/70 text-sm">
                {completionPercentage < 30 && "Just getting started! Tell us about your tastes."}
                {completionPercentage >= 30 && completionPercentage < 60 && "Good progress! Keep adding your preferences."}
                {completionPercentage >= 60 && completionPercentage < 90 && "Almost there! A few more details would help."}
                {completionPercentage >= 90 && "Excellent! Your Food DNA is well-defined."}
              </p>
              <p className="text-white/50 text-xs mt-2">
                The more you tell us, the better your recommendations!
              </p>
            </div>
            <ProgressRing percentage={completionPercentage} size={100} strokeWidth={6} />
          </div>
        </div>
      </div>

      <div className="px-6 -mt-4 space-y-3">
        <NavigationCard
          icon={<ShieldAlert className="w-5 h-5 text-nm-signature" />}
          title="Dietary Constraints"
          description="Allergies, restrictions & health goals"
          completionItems={constraintItems}
          onClick={() => setCurrentSection('constraints')}
          accentColor="bg-nm-signature/10"
        />

        <NavigationCard
          icon={<Sparkles className="w-5 h-5 text-nm-accent" />}
          title="Flavor Profile"
          description="Taste preferences, textures & portions"
          completionItems={flavorItems}
          onClick={() => setCurrentSection('flavors')}
          accentColor="bg-nm-accent/10"
        />

        <NavigationCard
          icon={<Utensils className="w-5 h-5 text-nm-success" />}
          title="Meal Favorites"
          description="Favorite foods for each meal type"
          completionItems={mealItems}
          onClick={() => setCurrentSection('meals')}
          accentColor="bg-nm-success/10"
        />

        <NavigationCard
          icon={<ChefHat className="w-5 h-5 text-nm-signature" />}
          title="Cuisine Expertise"
          description="Your preferences for each cuisine"
          completionItems={cuisineItems}
          onClick={() => setCurrentSection('cuisines')}
          accentColor="bg-nm-surface"
        />

        <NavigationCard
          icon={<ThumbsDown className="w-5 h-5 text-nm-text/60" />}
          title="Dislikes & Avoid"
          description="Foods you'd rather not see"
          completionItems={dislikeItems}
          onClick={() => setCurrentSection('dislikes')}
          accentColor="bg-nm-surface-high"
        />
      </div>

      <div className="px-6 mt-6">
        <div className="bg-nm-surface-low rounded-[2rem] p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-nm-surface rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xl">✨</span>
            </div>
            <div>
              <p className="font-bold text-nm-text">How this helps you</p>
              <p className="text-sm text-nm-text/60 mt-1">
                Your Food DNA powers personalized menu recommendations. When you scan a menu,
                we'll highlight dishes that match your preferences and flag anything you want to avoid.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
