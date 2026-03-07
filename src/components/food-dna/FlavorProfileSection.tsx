import { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, Shapes, Scale, Compass } from 'lucide-react';
import { ChipSelector, SliderInput, SectionCard, SaveButton } from './SharedComponents';
import { TEXTURE_OPTIONS, PORTION_OPTIONS, type FlavorProfile } from './types';

interface FlavorProfileSectionProps {
  data: FlavorProfile;
  onSave: (data: FlavorProfile) => Promise<void>;
  onBack: () => void;
  saving?: boolean;
}

export function FlavorProfileSection({
  data,
  onSave,
  onBack,
  saving
}: FlavorProfileSectionProps) {
  const [localData, setLocalData] = useState<FlavorProfile>(data);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const handleSave = async () => {
    await onSave(localData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateField = <K extends keyof FlavorProfile>(key: K, value: FlavorProfile[K]) => {
    setLocalData({ ...localData, [key]: value });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white sticky top-0 z-20 shadow-sm">
        <div className="px-4 pt-12 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Flavor Profile</h1>
              <p className="text-xs text-gray-500 mt-0.5">How do you like your food?</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        <SectionCard
          title="Taste Preferences"
          description="Rate how much you enjoy each flavor profile"
          icon={<Sparkles className="w-5 h-5" />}
        >
          <div className="space-y-6">
            <SliderInput
              label="Sweet flavors"
              value={localData.sweetPreference}
              onChange={(v) => updateField('sweetPreference', v)}
              leftLabel="Not for me"
              rightLabel="Love it"
            />
            <SliderInput
              label="Salty flavors"
              value={localData.saltyPreference}
              onChange={(v) => updateField('saltyPreference', v)}
              leftLabel="Light salt"
              rightLabel="Salty please"
            />
            <SliderInput
              label="Sour/tangy flavors"
              value={localData.sourPreference}
              onChange={(v) => updateField('sourPreference', v)}
              leftLabel="No thanks"
              rightLabel="Pucker up"
            />
            <SliderInput
              label="Bitter flavors (coffee, dark chocolate, arugula)"
              value={localData.bitterPreference}
              onChange={(v) => updateField('bitterPreference', v)}
              leftLabel="Too bitter"
              rightLabel="Love bitter"
            />
            <SliderInput
              label="Rich/umami flavors (aged cheese, mushrooms, soy)"
              value={localData.umamiPreference}
              onChange={(v) => updateField('umamiPreference', v)}
              leftLabel="Keep it light"
              rightLabel="Rich & savory"
            />
            <SliderInput
              label="Spice tolerance"
              value={localData.spicyPreference}
              onChange={(v) => updateField('spicyPreference', v)}
              leftLabel="Mild only"
              rightLabel="Bring the heat!"
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Texture Preferences"
          description="What textures do you love and avoid?"
          icon={<Shapes className="w-5 h-5" />}
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Textures I love</p>
              <ChipSelector
                options={TEXTURE_OPTIONS}
                selected={localData.preferredTextures}
                onChange={(v) => updateField('preferredTextures', v)}
                colorScheme="emerald"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Textures I dislike</p>
              <ChipSelector
                options={TEXTURE_OPTIONS}
                selected={localData.dislikedTextures}
                onChange={(v) => updateField('dislikedTextures', v)}
                colorScheme="red"
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Meal Weight Preferences"
          description="How heavy do you like each meal?"
          icon={<Scale className="w-5 h-5" />}
        >
          <div className="space-y-6">
            <SliderInput
              label="Breakfast"
              value={localData.breakfastHeaviness}
              onChange={(v) => updateField('breakfastHeaviness', v)}
              leftLabel="Light"
              rightLabel="Heavy"
            />
            <SliderInput
              label="Lunch"
              value={localData.lunchHeaviness}
              onChange={(v) => updateField('lunchHeaviness', v)}
              leftLabel="Light"
              rightLabel="Heavy"
            />
            <SliderInput
              label="Dinner"
              value={localData.dinnerHeaviness}
              onChange={(v) => updateField('dinnerHeaviness', v)}
              leftLabel="Light"
              rightLabel="Heavy"
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Eating Style"
          description="Your general approach to food"
          icon={<Compass className="w-5 h-5" />}
        >
          <div className="space-y-6">
            <SliderInput
              label="Adventurous eater"
              value={localData.adventurousEater}
              onChange={(v) => updateField('adventurousEater', v)}
              leftLabel="I stick to what I know"
              rightLabel="Love trying new things"
            />
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Portion preference</p>
              <div className="flex flex-wrap gap-2">
                {PORTION_OPTIONS.map(portion => (
                  <button
                    key={portion}
                    onClick={() => updateField('portionPreference', portion)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                      localData.portionPreference === portion
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    {portion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        <SaveButton onClick={handleSave} saving={saving} saved={saved} />
      </div>
    </div>
  );
}
