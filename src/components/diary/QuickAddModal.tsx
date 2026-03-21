import { useState, useRef } from 'react';
import { X, Loader2, Utensils } from 'lucide-react';
import { MealNutritionInput, type MealNutritionData } from './MealNutritionInput';
import { fetchNutritionEstimate, type NutritionEstimate } from '../../utils/nutritionCache';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
type Feeling = 'Energized' | 'Satisfied' | 'Bloated' | 'Regret' | 'Hungry';

interface QuickAddPrefill {
  mealName: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

interface QuickAddModalProps {
  defaultMealType?: MealType;
  prefill?: QuickAddPrefill;
  onSave: (data: {
    meal_name: string;
    meal_type: MealType;
    feeling: Feeling;
    notes: string | null;
    nutrition: NutritionEstimate | null;
    quantity?: number;
    unit?: string;
    nutrition_source?: 'estimated' | 'manual' | 'combined';
    per_unit_nutrition?: NutritionEstimate | null;
  }) => Promise<void>;
  onClose: () => void;
}

const MEAL_TYPES: { label: MealType; emoji: string; display: string }[] = [
  { label: 'breakfast', emoji: '🌅', display: 'Breakfast' },
  { label: 'lunch', emoji: '☀️', display: 'Lunch' },
  { label: 'dinner', emoji: '🌙', display: 'Dinner' },
  { label: 'snack', emoji: '🍿', display: 'Snack' }
];

const FEELINGS: { label: Feeling; emoji: string }[] = [
  { label: 'Energized', emoji: '⚡️' },
  { label: 'Satisfied', emoji: '🙂' },
  { label: 'Bloated', emoji: '🎈' },
  { label: 'Regret', emoji: '🤢' },
  { label: 'Hungry', emoji: '🤤' }
];

export function QuickAddModal({ defaultMealType, prefill, onSave, onClose }: QuickAddModalProps) {
  const [mealName, setMealName] = useState(prefill?.mealName ?? '');
  const [selectedMealType, setSelectedMealType] = useState<MealType>(defaultMealType || 'lunch');
  const [selectedFeeling, setSelectedFeeling] = useState<Feeling | null>(null);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const nutritionRef = useRef<MealNutritionData | null>(null);

  const handleNutritionChange = (data: MealNutritionData) => {
    nutritionRef.current = data;
  };

  const handleSave = async () => {
    if (!mealName.trim() || !selectedFeeling) return;
    setIsSaving(true);
    try {
      const nd = nutritionRef.current;
      let totalNutrition = nd?.total ?? null;

      // If no nutrition at all, try one last fetch
      if (!totalNutrition) {
        const fetched = await fetchNutritionEstimate(mealName.trim());
        if (fetched) totalNutrition = fetched;
      }

      await onSave({
        meal_name: mealName.trim(),
        meal_type: selectedMealType,
        feeling: selectedFeeling,
        notes: notes.trim() || null,
        nutrition: totalNutrition,
        quantity: nd?.quantity ?? 1,
        unit: nd?.unit ?? 'serving',
        nutrition_source: nd?.nutritionSource ?? 'estimated',
        per_unit_nutrition: nd?.perUnit ?? null,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-nm-surface-lowest rounded-[2rem] rounded-b-none sm:rounded-[2rem] shadow-nm-float max-w-md w-full max-h-[92vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-nm-surface-lowest px-8 py-5 flex items-center justify-between rounded-t-[2rem] z-10">
          <h2 className="text-xl font-bold text-nm-text flex items-center gap-2">
            <Utensils className="w-5 h-5 text-nm-signature" />
            Log Food
          </h2>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-nm-surface transition-colors">
            <X className="w-5 h-5 text-nm-text/40" />
          </button>
        </div>

        <div className="px-8 pb-8 space-y-6">
          {/* Meal name input */}
          <div>
            <label htmlFor="qa-meal-name" className="block text-nm-label-md text-nm-text/60 uppercase tracking-wider mb-2">What did you eat?</label>
            <input
              id="qa-meal-name"
              type="text"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              placeholder="e.g., Grilled Chicken Salad"
              autoFocus
              className="w-full px-5 py-3.5 bg-nm-surface-high rounded-full text-nm-text placeholder:text-nm-text/30 focus:outline-none focus:bg-nm-surface-lowest focus:ring-2 focus:ring-nm-signature/40 transition-all text-sm"
            />
          </div>

          {/* Quantity, unit, estimation, manual override — shared component */}
          <MealNutritionInput
            mealName={mealName}
            initialNutrition={prefill?.calories != null ? {
              calories: prefill.calories,
              protein_g: prefill.protein ?? 0,
              carbs_g: prefill.carbs ?? 0,
              fat_g: prefill.fat ?? 0,
              fiber_g: 0,
              sugar_g: 0,
              sodium_mg: 0,
            } : undefined}
            onChange={handleNutritionChange}
          />

          {/* Meal type selector */}
          <div>
            <label className="block text-nm-label-md text-nm-text/60 uppercase tracking-wider mb-3">Meal type</label>
            <div className="grid grid-cols-4 gap-3">
              {MEAL_TYPES.map((type) => (
                <button
                  key={type.label}
                  onClick={() => setSelectedMealType(type.label)}
                  className={`flex flex-col items-center justify-center p-3 rounded-[2rem] transition-all active:scale-95 ${
                    selectedMealType === type.label
                      ? 'bg-nm-signature text-white shadow-nm-float'
                      : 'bg-nm-surface text-nm-text hover:bg-nm-surface-high'
                  }`}
                >
                  <span className="text-xl mb-1">{type.emoji}</span>
                  <span className="text-nm-label-md font-bold">{type.display}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Feeling selector */}
          <div>
            <label className="block text-nm-label-md text-nm-text/60 uppercase tracking-wider mb-3">How do you feel?</label>
            <div className="grid grid-cols-5 gap-2">
              {FEELINGS.map((feeling) => (
                <button
                  key={feeling.label}
                  onClick={() => setSelectedFeeling(feeling.label)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-[1.5rem] transition-all active:scale-95 ${
                    selectedFeeling === feeling.label
                      ? 'bg-nm-signature text-white shadow-nm-float'
                      : 'bg-nm-surface text-nm-text hover:bg-nm-surface-high'
                  }`}
                >
                  <span className="text-xl mb-0.5">{feeling.emoji}</span>
                  <span className="text-[10px] font-bold leading-tight">{feeling.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="qa-notes" className="block text-nm-label-md text-nm-text/60 uppercase tracking-wider mb-2">Notes (optional)</label>
            <textarea
              id="qa-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional thoughts?"
              rows={2}
              className="w-full px-5 py-3.5 bg-nm-surface-high rounded-[1.5rem] text-nm-text placeholder:text-nm-text/30 focus:outline-none focus:bg-nm-surface-lowest focus:ring-2 focus:ring-nm-signature/40 transition-all text-sm resize-none"
            />
          </div>

          {/* CTA */}
          <button
            onClick={handleSave}
            disabled={!mealName.trim() || !selectedFeeling || isSaving}
            className="w-full py-4 bg-gradient-to-br from-nm-signature to-nm-signature-light text-white font-bold rounded-full shadow-nm-float transition-all active:scale-95 disabled:opacity-40 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              'Log Food'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
