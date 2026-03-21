import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Loader2, Utensils, Check, RefreshCw } from 'lucide-react';
import { fetchNutritionEstimate, type NutritionEstimate } from '../../utils/nutritionCache';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
type Feeling = 'Energized' | 'Satisfied' | 'Bloated' | 'Regret' | 'Hungry';

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
  // Track which meal name the current estimate was fetched for
  const [estimatedForName, setEstimatedForName] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Whether the displayed estimate is stale (user changed text since last fetch)
  const isStale = nutritionEstimate != null && mealName.trim().toLowerCase() !== estimatedForName.toLowerCase();

  const doEstimate = useCallback(async (name?: string) => {
    const target = (name ?? mealName).trim();
    if (!target || target.length < 3) return;

    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    setIsEstimatingNutrition(true);
    const result = await fetchNutritionEstimate(target);
    if (result) {
      setNutritionEstimate(result);
      setEstimatedForName(target);
    }
    setIsEstimatingNutrition(false);
  }, [mealName]);

  // Debounced estimate trigger (1500ms safety net for blur/enter)
  const triggerEstimateDebounced = useCallback((name: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doEstimate(name), 1500);
  }, [doEstimate]);

  const handleMealNameChange = (value: string) => {
    setMealName(value);
    // Do NOT trigger estimation on keystroke — only clear if empty
    if (!value.trim()) {
      setNutritionEstimate(null);
      setEstimatedForName('');
      if (debounceRef.current) clearTimeout(debounceRef.current);
    }
  };

  const handleInputBlur = () => {
    const trimmed = mealName.trim();
    if (trimmed.length >= 3 && trimmed.toLowerCase() !== estimatedForName.toLowerCase()) {
      triggerEstimateDebounced(trimmed);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = mealName.trim();
      if (trimmed.length >= 3) {
        triggerEstimateDebounced(trimmed);
      }
    }
  };

  const handleSave = async () => {
    if (!mealName.trim() || !selectedFeeling) return;
    setIsSaving(true);
    try {
      let nutrition = nutritionEstimate;
      // If no estimate yet (user skipped), fetch one now
      if (!nutrition || isStale) {
        setIsEstimatingNutrition(true);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        nutrition = await fetchNutritionEstimate(mealName.trim());
        if (nutrition) {
          setNutritionEstimate(nutrition);
          setEstimatedForName(mealName.trim());
        }
        setIsEstimatingNutrition(false);
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
          {/* Meal name input + estimate button */}
          <div>
            <label htmlFor="qa-meal-name" className="block text-nm-label-md text-nm-text/60 uppercase tracking-wider mb-2">What did you eat?</label>
            <div className="flex gap-2">
              <input
                id="qa-meal-name"
                type="text"
                value={mealName}
                onChange={(e) => handleMealNameChange(e.target.value)}
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown}
                placeholder="e.g., Grilled Chicken Salad"
                autoFocus
                className="flex-1 px-5 py-3.5 bg-nm-surface-high rounded-full text-nm-text placeholder:text-nm-text/30 focus:outline-none focus:bg-nm-surface-lowest focus:ring-2 focus:ring-nm-signature/40 transition-all text-sm"
              />
              <button
                onClick={() => doEstimate()}
                disabled={!mealName.trim() || mealName.trim().length < 3 || isEstimatingNutrition}
                className="px-4 py-3.5 bg-gradient-to-br from-nm-signature to-nm-signature-light text-white font-bold text-sm rounded-full disabled:opacity-30 active:scale-95 transition-all flex items-center gap-1.5 flex-shrink-0"
              >
                {isEstimatingNutrition ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    Estimate
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Nutrition estimate preview */}
          {(isEstimatingNutrition || nutritionEstimate) && (
            <div className={`rounded-[2rem] p-6 transition-all ${
              isStale
                ? 'bg-nm-surface-high/50 opacity-60'
                : 'bg-nm-surface'
            }`}>
              {isEstimatingNutrition ? (
                <div className="flex items-center gap-2 text-nm-text">
                  <Loader2 className="w-4 h-4 animate-spin text-nm-signature" />
                  <span className="text-sm font-medium">Estimating nutrition...</span>
                </div>
              ) : nutritionEstimate && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {!isStale && (
                        <Check className="w-4 h-4 text-nm-success" />
                      )}
                      <span className="text-nm-label-md text-nm-text/40 uppercase tracking-wider">
                        {isStale ? 'Stale estimate — tap Estimate to refresh' : 'Estimated Nutrition'}
                      </span>
                    </div>
                    {nutritionEstimate.confidence && !isStale && (
                      <span className={`text-nm-label-md px-3 py-1 rounded-full font-bold ${confidenceColors[nutritionEstimate.confidence]}`}>
                        {nutritionEstimate.confidence}
                      </span>
                    )}
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
            disabled={!mealName.trim() || !selectedFeeling || isSaving}
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
                {nutritionEstimate && !isStale && (
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
