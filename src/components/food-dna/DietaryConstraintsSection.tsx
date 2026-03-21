import { useState, useEffect } from 'react';
import { ArrowLeft, ShieldAlert, AlertTriangle, Leaf, Heart, Ban } from 'lucide-react';
import { ChipSelector, TagInput, SectionCard, SaveButton } from './SharedComponents';
import {
  ALLERGY_OPTIONS,
  SENSITIVITY_OPTIONS,
  DIETARY_RESTRICTIONS,
  HEALTH_GOALS,
  type DietaryConstraints
} from './types';

interface DietaryConstraintsSectionProps {
  data: DietaryConstraints;
  onSave: (data: DietaryConstraints) => Promise<void>;
  onBack: () => void;
  saving?: boolean;
}

export function DietaryConstraintsSection({
  data,
  onSave,
  onBack,
  saving
}: DietaryConstraintsSectionProps) {
  const [localData, setLocalData] = useState<DietaryConstraints>(data);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const handleSave = async () => {
    await onSave(localData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-40">
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
              <h1 className="text-xl font-bold text-gray-900">Dietary Constraints</h1>
              <p className="text-xs text-gray-500 mt-0.5">Safety first - tell us what to avoid</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        <SectionCard
          title="Allergies"
          description="Severe reactions - we'll always warn you about these"
          icon={<ShieldAlert className="w-5 h-5" />}
        >
          <ChipSelector
            options={ALLERGY_OPTIONS}
            selected={localData.allergies}
            onChange={(allergies) => setLocalData({ ...localData, allergies })}
            colorScheme="red"
            allowCustom
            customPlaceholder="Add other allergy..."
          />
        </SectionCard>

        <SectionCard
          title="Sensitivities"
          description="Uncomfortable but not dangerous - we'll deprioritize these"
          icon={<AlertTriangle className="w-5 h-5" />}
        >
          <ChipSelector
            options={SENSITIVITY_OPTIONS}
            selected={localData.sensitivities}
            onChange={(sensitivities) => setLocalData({ ...localData, sensitivities })}
            colorScheme="amber"
            allowCustom
            customPlaceholder="Add other sensitivity..."
          />
        </SectionCard>

        <SectionCard
          title="Dietary Restrictions"
          description="Lifestyle or religious dietary requirements"
          icon={<Leaf className="w-5 h-5" />}
        >
          <ChipSelector
            options={DIETARY_RESTRICTIONS}
            selected={localData.restrictions}
            onChange={(restrictions) => setLocalData({ ...localData, restrictions })}
            colorScheme="emerald"
          />
        </SectionCard>

        <SectionCard
          title="Health Goals"
          description="Nutritional priorities for recommendations"
          icon={<Heart className="w-5 h-5" />}
        >
          <ChipSelector
            options={HEALTH_GOALS}
            selected={localData.healthGoals}
            onChange={(healthGoals) => setLocalData({ ...localData, healthGoals })}
            colorScheme="blue"
          />
        </SectionCard>

        <SectionCard
          title="Never Eat List"
          description="Specific items you never want recommended"
          icon={<Ban className="w-5 h-5" />}
        >
          <TagInput
            tags={localData.neverEat}
            onChange={(neverEat) => setLocalData({ ...localData, neverEat })}
            placeholder="e.g., Raw oysters, Blue cheese..."
            tagColor="red"
          />
        </SectionCard>

        <SaveButton onClick={handleSave} saving={saving} saved={saved} />
      </div>
    </div>
  );
}
