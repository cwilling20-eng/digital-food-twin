import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Loader2, Utensils } from 'lucide-react';

import { WEBHOOK_NUTRITION_URL } from '../../config/api';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
type Feeling = 'Energized' | 'Satisfied' | 'Bloated' | 'Regret' | 'Hungry';

interface NutritionEstimate {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  confidence: 'low' | 'medium' | 'high';
  notes: string;
}

interface QuickAddModalProps {
  defaultMealType?: MealType;
  onSave: (data: {
    meal_name: string;
    meal_type: MealType;
    feeling: Feeling;
    notes: string | null;
    nutrition: NutritionEstimate | null;
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

export function QuickAddModal({ defaultMealType, onSave, onClose }: QuickAddModalProps) {
  const [mealName, setMealName] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<MealType>(defaultMealType || 'lunch');
  const [selectedFeeling, setSelectedFeeling] = useState<Feeling | null>(null);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [nutritionEstimate, setNutritionEstimate] = useState<NutritionEstimate | null>(null);
  const [isEstimatingNutrition, setIsEstimatingNutrition] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const estimateNutrition = useCallback(async (meal: string) => {
    if (!meal.trim() || meal.length < 3) {
      setNutritionEstimate(null);
      return;
    }

    setIsEstimatingNutrition(true);
    try {
      const response = await fetch(WEBHOOK_NUTRITION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meal_name: meal.trim() })
      });
      if (!response.ok) throw new Error('Failed to estimate nutrition');
      const data = await response.json();
      const nutrition = Array.isArray(data) ? data[0] : data;
      setNutritionEstimate(nutrition);
    } catch {
      setNutritionEstimate(null);
    } finally {
      setIsEstimatingNutrition(false);
    }
  }, []);

  const handleMealNameChange = (value: string) => {
    setMealName(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setNutritionEstimate(null);
      return;
    }
    debounceRef.current = setTimeout(() => estimateNutrition(value), 500);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSave = async () => {
    if (!mealName.trim() || !selectedFeeling) return;
    setIsSaving(true);
    try {
      let nutrition = nutritionEstimate;
      if (!nutrition) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setIsEstimatingNutrition(true);
        try {
          const response = await fetch(WEBHOOK_NUTRITION_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ meal_name: mealName.trim() })
          });
          if (response.ok) {
            const data = await response.json();
            nutrition = Array.isArray(data) ? data[0] : data;
            setNutritionEstimate(nutrition);
          }
        } catch {
          // proceed without estimate
        } finally {
          setIsEstimatingNutrition(false);
        }
      }
      await onSave({
        meal_name: mealName.trim(),
        meal_type: selectedMealType,
        feeling: selectedFeeling,
        notes: notes.trim() || null,
        nutrition: nutrition
      });
    } finally {
      setIsSaving(false);
    }
  };

  const confidenceColors: Record<string, string> = {
    low: 'text-nm-accent bg-nm-accent/10',
    medium: 'text-nm-signature bg-nm-signature/10',
    high: 'text-nm-success bg-nm-success/10'
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
          {/* Meal name input — pill-shaped */}
          <div>
            <label htmlFor="qa-meal-name" className="block text-nm-label-md text-nm-text/60 uppercase tracking-wider mb-2">What did you eat?</label>
            <input
              id="qa-meal-name"
              type="text"
              value={mealName}
              onChange={(e) => handleMealNameChange(e.target.value)}
              placeholder="e.g., Grilled Chicken Salad"
              autoFocus
              className="w-full px-5 py-3.5 bg-nm-surface-high rounded-full text-nm-text placeholder:text-nm-text/30 focus:outline-none focus:bg-nm-surface-lowest focus:ring-2 focus:ring-nm-signature/40 transition-all text-sm"
            />
          </div>

          {/* Nutrition estimate preview */}
          {mealName.trim() && (isEstimatingNutrition || nutritionEstimate) && (
            <div className="bg-nm-surface rounded-[2rem] p-6">
              {isEstimatingNutrition ? (
                <div className="flex items-center gap-2 text-nm-text">
                  <Loader2 className="w-4 h-4 animate-spin text-nm-signature" />
                  <span className="text-sm font-medium">Estimating nutrition...</span>
                </div>
              ) : nutritionEstimate && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-nm-label-md text-nm-text/40 uppercase tracking-wider">Estimated Nutrition</span>
                    <span className={`text-nm-label-md px-3 py-1 rounded-full font-bold ${confidenceColors[nutritionEstimate.confidence]}`}>
                      {nutritionEstimate.confidence}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-black text-nm-text">{nutritionEstimate.calories}</div>
                      <div className="text-nm-label-md text-nm-text/40 uppercase">Cal</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-black text-nm-signature">{nutritionEstimate.protein_g}g</div>
                      <div className="text-nm-label-md text-nm-text/40 uppercase">Protein</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-black text-nm-accent">{nutritionEstimate.carbs_g}g</div>
                      <div className="text-nm-label-md text-nm-text/40 uppercase">Carbs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-black text-nm-text/80">{nutritionEstimate.fat_g}g</div>
                      <div className="text-nm-label-md text-nm-text/40 uppercase">Fat</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

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

          {/* Notes — pill-shaped textarea */}
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

          {/* CTA — coral gradient pill */}
          <button
            onClick={handleSave}
            disabled={!mealName.trim() || !selectedFeeling || isSaving || isEstimatingNutrition}
            className="w-full py-4 bg-gradient-to-br from-nm-signature to-nm-signature-light text-white font-bold rounded-full shadow-nm-float transition-all active:scale-95 disabled:opacity-40 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isEstimatingNutrition ? 'Estimating nutrition...' : 'Saving...'}
              </>
            ) : (
              <>
                Log Food
                {nutritionEstimate && (
                  <span className="text-white/70 font-normal">
                    ({nutritionEstimate.calories} cal)
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
