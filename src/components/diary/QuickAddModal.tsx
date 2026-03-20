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
    low: 'text-amber-600 bg-amber-50',
    medium: 'text-emerald-600 bg-emerald-50',
    high: 'text-blue-600 bg-blue-50'
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-md w-full max-h-[92vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-2xl z-10">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-emerald-500" />
            Log Food
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label htmlFor="qa-meal-name" className="block text-sm font-medium text-gray-700 mb-1.5">What did you eat?</label>
            <input
              id="qa-meal-name"
              type="text"
              value={mealName}
              onChange={(e) => handleMealNameChange(e.target.value)}
              placeholder="e.g., Grilled Chicken Salad"
              autoFocus
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm bg-white"
            />
          </div>

          {mealName.trim() && (isEstimatingNutrition || nutritionEstimate) && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
              {isEstimatingNutrition ? (
                <div className="flex items-center gap-2 text-emerald-700">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Estimating nutrition...</span>
                </div>
              ) : nutritionEstimate && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Estimated Nutrition</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${confidenceColors[nutritionEstimate.confidence]}`}>
                      {nutritionEstimate.confidence}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="text-center">
                      <div className="text-xl font-bold text-gray-900">{nutritionEstimate.calories}</div>
                      <div className="text-[10px] text-gray-500 uppercase">Cal</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">{nutritionEstimate.protein_g}g</div>
                      <div className="text-[10px] text-gray-500 uppercase">Protein</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-amber-600">{nutritionEstimate.carbs_g}g</div>
                      <div className="text-[10px] text-gray-500 uppercase">Carbs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-rose-600">{nutritionEstimate.fat_g}g</div>
                      <div className="text-[10px] text-gray-500 uppercase">Fat</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Meal type</label>
            <div className="grid grid-cols-4 gap-2">
              {MEAL_TYPES.map((type) => (
                <button
                  key={type.label}
                  onClick={() => setSelectedMealType(type.label)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 transition-all ${
                    selectedMealType === type.label
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <span className="text-xl mb-0.5">{type.emoji}</span>
                  <span className="text-[11px] text-gray-700 font-medium">{type.display}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">How do you feel?</label>
            <div className="grid grid-cols-5 gap-2">
              {FEELINGS.map((feeling) => (
                <button
                  key={feeling.label}
                  onClick={() => setSelectedFeeling(feeling.label)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 transition-all ${
                    selectedFeeling === feeling.label
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <span className="text-xl mb-0.5">{feeling.emoji}</span>
                  <span className="text-[10px] text-gray-700 font-medium leading-tight">{feeling.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="qa-notes" className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optional)</label>
            <textarea
              id="qa-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional thoughts?"
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm resize-none bg-white"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={!mealName.trim() || !selectedFeeling || isSaving || isEstimatingNutrition}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
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
                  <span className="text-emerald-200 font-normal">
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
