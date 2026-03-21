import { useState, useEffect } from 'react';
import { ArrowLeft, ChefHat, Check } from 'lucide-react';
import { ChipSelector, SliderInput, TagInput, SectionCard, SaveButton } from './SharedComponents';
import { CUISINE_CONFIGS, type CuisinePreference } from './types';

interface CuisineExpertiseSectionProps {
  data: CuisinePreference[];
  onSave: (cuisineType: string, data: Omit<CuisinePreference, 'cuisineType'>) => Promise<void>;
  onBack: () => void;
  saving?: boolean;
}

interface CuisineFormProps {
  cuisineId: string;
  config: typeof CUISINE_CONFIGS[string];
  data: Omit<CuisinePreference, 'cuisineType'>;
  onSave: (data: Omit<CuisinePreference, 'cuisineType'>) => Promise<void>;
  onBack: () => void;
  saving?: boolean;
}

function CuisineForm({ config, data, onSave, onBack, saving }: CuisineFormProps) {
  const [localData, setLocalData] = useState(data);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const handleSave = async () => {
    await onSave(localData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateField = <K extends keyof typeof localData>(key: K, value: typeof localData[K]) => {
    setLocalData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-nm-bg pb-40">
      <div className="bg-nm-bg/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="px-6 pt-12 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-nm-surface transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-nm-text" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{config.emoji}</span>
              <div>
                <h1 className="text-xl font-bold text-nm-text">{config.label}</h1>
                <p className="text-nm-label-md text-nm-text/40">Tell us your preferences</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 mt-4 space-y-4">
        <SectionCard title="Favorite Dishes" description="What do you usually order?">
          <ChipSelector
            options={config.dishes}
            selected={localData.favoriteDishes}
            onChange={(v) => updateField('favoriteDishes', v)}
            colorScheme="amber"
            allowCustom
            customPlaceholder="Add another dish..."
          />
        </SectionCard>

        <SectionCard title="Favorite Proteins" description="Your go-to proteins for this cuisine">
          <ChipSelector
            options={config.proteins}
            selected={localData.favoriteProteins}
            onChange={(v) => updateField('favoriteProteins', v)}
            colorScheme="emerald"
          />
        </SectionCard>

        <SectionCard title="Preferred Style" description="How do you like it prepared?">
          <ChipSelector
            options={config.styles}
            selected={localData.stylePreferences}
            onChange={(v) => updateField('stylePreferences', v)}
            colorScheme="blue"
          />
        </SectionCard>

        <SectionCard title="Extras & Sides" description="The little things that make it perfect">
          <ChipSelector
            options={config.extras}
            selected={localData.favoritePreparations}
            onChange={(v) => updateField('favoritePreparations', v)}
            colorScheme="emerald"
          />
        </SectionCard>

        <SectionCard title="Spice & Adventure Level">
          <div className="space-y-6">
            <SliderInput
              label={`Spice level for ${config.label}`}
              value={localData.spiceLevel}
              onChange={(v) => updateField('spiceLevel', v)}
              leftLabel="Keep it mild"
              rightLabel="Maximum heat"
            />
            <SliderInput
              label="How adventurous?"
              value={localData.adventureLevel}
              onChange={(v) => updateField('adventureLevel', v)}
              leftLabel="Stick to classics"
              rightLabel="Surprise me!"
            />
          </div>
        </SectionCard>

        <SectionCard title="Items to Avoid" description="Specific things you don't want in this cuisine">
          <TagInput
            tags={localData.avoidItems}
            onChange={(v) => updateField('avoidItems', v)}
            placeholder="e.g., raw fish, extra spicy..."
            tagColor="red"
          />
        </SectionCard>

        <SaveButton onClick={handleSave} saving={saving} saved={saved} />
      </div>
    </div>
  );
}

export function CuisineExpertiseSection({
  data,
  onSave,
  onBack,
  saving
}: CuisineExpertiseSectionProps) {
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);

  const getDataForCuisine = (cuisineId: string): Omit<CuisinePreference, 'cuisineType'> => {
    const existing = data.find(d => d.cuisineType === cuisineId);
    if (existing) {
      const { cuisineType: _, ...rest } = existing;
      return rest;
    }
    return {
      favoriteDishes: [],
      favoriteProteins: [],
      favoritePreparations: [],
      spiceLevel: 5,
      adventureLevel: 5,
      stylePreferences: [],
      avoidItems: [],
      extraPreferences: {}
    };
  };

  const hasCuisineData = (cuisineId: string): boolean => {
    const cuisineData = data.find(d => d.cuisineType === cuisineId);
    if (!cuisineData) return false;
    return cuisineData.favoriteDishes.length > 0 ||
           cuisineData.favoriteProteins.length > 0 ||
           cuisineData.stylePreferences.length > 0;
  };

  if (selectedCuisine) {
    const config = CUISINE_CONFIGS[selectedCuisine];
    return (
      <CuisineForm
        cuisineId={selectedCuisine}
        config={config}
        data={getDataForCuisine(selectedCuisine)}
        onSave={(data) => onSave(selectedCuisine, data)}
        onBack={() => setSelectedCuisine(null)}
        saving={saving}
      />
    );
  }

  return (
    <div className="min-h-screen bg-nm-bg pb-40">
      <div className="bg-nm-bg/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="px-6 pt-12 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-nm-surface transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-nm-text" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-nm-text">Cuisine Expertise</h1>
              <p className="text-nm-label-md text-nm-text/40">Tell us your preferences for each cuisine</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 mt-4">
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(CUISINE_CONFIGS).map(([id, config]) => {
            const hasData = hasCuisineData(id);
            return (
              <button
                key={id}
                onClick={() => setSelectedCuisine(id)}
                className={`relative p-5 rounded-[2rem] transition-all text-left active:scale-[0.98] ${
                  hasData
                    ? 'bg-nm-surface border-2 border-nm-success'
                    : 'bg-nm-surface'
                }`}
              >
                {hasData && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-nm-success rounded-full flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div className="text-3xl mb-2">{config.emoji}</div>
                <div className="font-bold text-nm-text text-sm">{config.label}</div>
                <div className={`text-nm-label-md mt-0.5 ${hasData ? 'text-nm-success' : 'text-nm-text/50'}`}>
                  {hasData ? 'Configured' : 'Tap to configure'}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 p-6 bg-nm-surface-low rounded-[2rem]">
          <div className="flex items-start gap-3">
            <ChefHat className="w-5 h-5 text-nm-signature mt-0.5" />
            <div>
              <p className="text-sm font-bold text-nm-text">The more you tell us, the better!</p>
              <p className="text-nm-label-md text-nm-text/60 mt-1">
                Configure your favorite cuisines to get personalized menu recommendations that match your exact preferences.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
