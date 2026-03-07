import { useState, useEffect } from 'react';
import { ArrowLeft, ThumbsDown, Ban } from 'lucide-react';
import { ChipSelector, TagInput, SectionCard, SaveButton } from './SharedComponents';
import { COMMON_DISLIKES, type FoodDislikes } from './types';

interface DislikesSectionProps {
  data: FoodDislikes;
  onSave: (data: FoodDislikes) => Promise<void>;
  onBack: () => void;
  saving?: boolean;
}

export function DislikesSection({
  data,
  onSave,
  onBack,
  saving
}: DislikesSectionProps) {
  const [localData, setLocalData] = useState<FoodDislikes>(data);
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
              <h1 className="text-xl font-bold text-gray-900">Dislikes & Avoid</h1>
              <p className="text-xs text-gray-500 mt-0.5">Things you'd rather not see</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        <SectionCard
          title="Foods You Dislike"
          description="Select or add foods you generally don't enjoy"
          icon={<ThumbsDown className="w-5 h-5" />}
        >
          <div className="space-y-4">
            <ChipSelector
              options={COMMON_DISLIKES}
              selected={localData.dislikedFoods}
              onChange={(dislikedFoods) => setLocalData({ ...localData, dislikedFoods })}
              colorScheme="red"
              allowCustom
              customPlaceholder="Add another dislike..."
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Ingredients to Always Avoid"
          description="These will never appear in recommendations"
          icon={<Ban className="w-5 h-5" />}
        >
          <TagInput
            tags={localData.avoidIngredients}
            onChange={(avoidIngredients) => setLocalData({ ...localData, avoidIngredients })}
            placeholder="e.g., MSG, high fructose corn syrup..."
            tagColor="red"
          />
        </SectionCard>

        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-lg">💡</span>
            </div>
            <div>
              <p className="text-sm font-medium text-amber-900">Tip</p>
              <p className="text-xs text-amber-700 mt-1">
                Dislikes are different from allergies. These won't trigger safety warnings, but we'll try to avoid recommending dishes with these ingredients.
              </p>
            </div>
          </div>
        </div>

        <SaveButton onClick={handleSave} saving={saving} saved={saved} />
      </div>
    </div>
  );
}
