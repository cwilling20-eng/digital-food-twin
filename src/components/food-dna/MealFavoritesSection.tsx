import { useState, useEffect } from 'react';
import { ArrowLeft, Utensils, Check, Loader2 } from 'lucide-react';
import { ChipSelector, TagInput, SectionCard } from './SharedComponents';
import { MEAL_TYPE_SUGGESTIONS, CUISINE_OPTIONS, type MealFavorites } from './types';

interface MealFavoritesSectionProps {
  data: MealFavorites[];
  onSave: (mealType: string, data: Omit<MealFavorites, 'mealType'>) => Promise<void>;
  onBack: () => void;
  saving?: boolean;
}

const MEAL_TABS = [
  { id: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { id: 'brunch', label: 'Brunch', emoji: '🥞' },
  { id: 'lunch', label: 'Lunch', emoji: '☀️' },
  { id: 'dinner', label: 'Dinner', emoji: '🌙' },
  { id: 'snacks', label: 'Snacks', emoji: '🍿' },
  { id: 'desserts', label: 'Desserts', emoji: '🍰' },
  { id: 'drinks', label: 'Drinks', emoji: '🍹' }
];

export function MealFavoritesSection({
  data,
  onSave,
  onBack,
  saving
}: MealFavoritesSectionProps) {
  const [activeTab, setActiveTab] = useState('breakfast');
  const [localData, setLocalData] = useState<Record<string, Omit<MealFavorites, 'mealType'>>>({});
  const [savedTabs, setSavedTabs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const dataMap: Record<string, Omit<MealFavorites, 'mealType'>> = {};
    data.forEach(item => {
      dataMap[item.mealType] = {
        foodItems: item.foodItems,
        cuisinePreferences: item.cuisinePreferences
      };
    });
    setLocalData(dataMap);
  }, [data]);

  const getCurrentData = (): Omit<MealFavorites, 'mealType'> => {
    return localData[activeTab] || { foodItems: [], cuisinePreferences: [] };
  };

  const updateCurrentData = (updates: Partial<Omit<MealFavorites, 'mealType'>>) => {
    setLocalData(prev => ({
      ...prev,
      [activeTab]: { ...getCurrentData(), ...updates }
    }));
  };

  const handleSave = async () => {
    await onSave(activeTab, getCurrentData());
    setSavedTabs(prev => ({ ...prev, [activeTab]: true }));
    setTimeout(() => {
      setSavedTabs(prev => ({ ...prev, [activeTab]: false }));
    }, 2000);
  };

  const currentData = getCurrentData();
  const currentTab = MEAL_TABS.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-50 pb-40">
      <div className="bg-white sticky top-0 z-20 shadow-sm">
        <div className="px-4 pt-12 pb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Meal Favorites</h1>
              <p className="text-xs text-gray-500 mt-0.5">What do you love for each meal?</p>
            </div>
          </div>
        </div>

        <div className="px-4 pb-3 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            {MEAL_TABS.map(tab => {
              const hasData = localData[tab.id]?.foodItems?.length > 0 ||
                             localData[tab.id]?.cuisinePreferences?.length > 0;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? 'bg-nm-bg0 text-white'
                      : hasData
                      ? 'bg-nm-bg text-nm-text border border-nm-surface-high'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span>{tab.emoji}</span>
                  <span>{tab.label}</span>
                  {hasData && activeTab !== tab.id && (
                    <Check className="w-3.5 h-3.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        <SectionCard
          title={`Favorite ${currentTab?.label} Foods`}
          description="Add your go-to dishes for this meal"
          icon={<Utensils className="w-5 h-5" />}
        >
          <TagInput
            tags={currentData.foodItems}
            onChange={(foodItems) => updateCurrentData({ foodItems })}
            suggestions={MEAL_TYPE_SUGGESTIONS[activeTab] || []}
            placeholder={`e.g., ${(MEAL_TYPE_SUGGESTIONS[activeTab] || ['Pizza', 'Salad']).slice(0, 2).join(', ')}...`}
            tagColor="amber"
          />
        </SectionCard>

        <SectionCard
          title={`Preferred Cuisines for ${currentTab?.label}`}
          description="What type of food do you usually want?"
        >
          <ChipSelector
            options={CUISINE_OPTIONS}
            selected={currentData.cuisinePreferences}
            onChange={(cuisinePreferences) => updateCurrentData({ cuisinePreferences })}
            colorScheme="emerald"
          />
        </SectionCard>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-4 px-8 rounded-2xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            savedTabs[activeTab]
              ? 'bg-green-500 text-white'
              : saving
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-nm-signature hover:bg-nm-text text-white shadow-lg shadow-nm-signature/30 active:scale-[0.98]'
          }`}
        >
          {savedTabs[activeTab] ? (
            <>
              <Check className="w-5 h-5" />
              Saved {currentTab?.label}!
            </>
          ) : saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            `Save ${currentTab?.label} Preferences`
          )}
        </button>
      </div>
    </div>
  );
}
