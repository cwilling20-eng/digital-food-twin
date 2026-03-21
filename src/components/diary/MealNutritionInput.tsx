import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, RefreshCw, Check, Pencil, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { fetchNutritionEstimate, type NutritionEstimate } from '../../utils/nutritionCache';

const UNITS = ['serving', 'oz', 'g', 'cup', 'tbsp', 'piece'] as const;
export type ServingUnit = typeof UNITS[number];

export interface MealNutritionData {
  quantity: number;
  unit: ServingUnit;
  nutritionSource: 'estimated' | 'manual' | 'combined';
  /** Per-unit values from API — stored so quantity changes don't require re-fetch */
  perUnit: NutritionEstimate | null;
  /** Final values (perUnit * quantity, or manual overrides) */
  total: NutritionEstimate | null;
}

interface MealNutritionInputProps {
  mealName: string;
  /** Pre-populated nutrition (e.g. from ChatResultCard "Log this meal") */
  initialNutrition?: NutritionEstimate | null;
  onChange: (data: MealNutritionData) => void;
  className?: string;
}

function multiply(est: NutritionEstimate, qty: number): NutritionEstimate {
  return {
    calories: Math.round(est.calories * qty),
    protein_g: Math.round(est.protein_g * qty * 10) / 10,
    carbs_g: Math.round(est.carbs_g * qty * 10) / 10,
    fat_g: Math.round(est.fat_g * qty * 10) / 10,
    fiber_g: Math.round(est.fiber_g * qty * 10) / 10,
    sugar_g: Math.round(est.sugar_g * qty * 10) / 10,
    sodium_mg: Math.round(est.sodium_mg * qty * 10) / 10,
    confidence: est.confidence,
    notes: est.notes,
  };
}

export function MealNutritionInput({
  mealName,
  initialNutrition,
  onChange,
  className = '',
}: MealNutritionInputProps) {
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState<ServingUnit>('serving');
  const [perUnit, setPerUnit] = useState<NutritionEstimate | null>(initialNutrition ?? null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimatedForName, setEstimatedForName] = useState(initialNutrition ? mealName : '');
  const [showManual, setShowManual] = useState(false);
  const [nutritionSource, setNutritionSource] = useState<'estimated' | 'manual' | 'combined'>(
    initialNutrition ? 'estimated' : 'manual'
  );
  const [manualOverrides, setManualOverrides] = useState<Partial<NutritionEstimate>>({});
  const [estimateFailed, setEstimateFailed] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  // Sync initial nutrition if it changes (e.g. from ChatResultCard)
  useEffect(() => {
    if (initialNutrition) {
      setPerUnit(initialNutrition);
      setEstimatedForName(mealName);
      setNutritionSource('estimated');
      setEstimateFailed(false);
    }
  }, [initialNutrition]);

  const isStale = perUnit != null && mealName.trim().toLowerCase() !== estimatedForName.toLowerCase();

  // Compute total nutrition
  const computeTotal = useCallback((): NutritionEstimate | null => {
    if (nutritionSource === 'manual') {
      const m = manualOverrides;
      return {
        calories: m.calories ?? 0,
        protein_g: m.protein_g ?? 0,
        carbs_g: m.carbs_g ?? 0,
        fat_g: m.fat_g ?? 0,
        fiber_g: m.fiber_g ?? 0,
        sugar_g: m.sugar_g ?? 0,
        sodium_mg: m.sodium_mg ?? 0,
      };
    }
    if (!perUnit) return null;
    const base = multiply(perUnit, quantity);
    if (nutritionSource === 'combined') {
      return { ...base, ...manualOverrides };
    }
    return base;
  }, [perUnit, quantity, nutritionSource, manualOverrides]);

  // Emit changes
  useEffect(() => {
    onChange({
      quantity,
      unit,
      nutritionSource,
      perUnit,
      total: computeTotal(),
    });
  }, [quantity, unit, nutritionSource, perUnit, manualOverrides, computeTotal]);

  const doEstimate = async () => {
    const trimmed = mealName.trim();
    if (!trimmed || trimmed.length < 3) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    setIsEstimating(true);
    setEstimateFailed(false);

    const result = await fetchNutritionEstimate(trimmed);

    if (result && result.calories > 0) {
      setPerUnit(result);
      setEstimatedForName(trimmed);
      setNutritionSource(Object.keys(manualOverrides).length > 0 ? 'combined' : 'estimated');
      setEstimateFailed(false);
    } else {
      setEstimateFailed(true);
      setPerUnit(null);
      setShowManual(true);
      setNutritionSource('manual');
    }
    setIsEstimating(false);
  };

  const handleManualChange = (field: keyof NutritionEstimate, value: string) => {
    const num = value === '' ? undefined : Number(value);
    const next = { ...manualOverrides, [field]: num };
    if (num === undefined) delete next[field];
    setManualOverrides(next);
    if (perUnit && Object.keys(next).length > 0) {
      setNutritionSource('combined');
    } else if (!perUnit) {
      setNutritionSource('manual');
    }
  };

  const total = computeTotal();
  const hasEstimate = perUnit != null && !isStale;
  const showNutrition = hasEstimate || nutritionSource === 'manual' || isEstimating || estimateFailed;

  const confidenceColors: Record<string, string> = {
    low: 'text-nm-accent bg-nm-accent/10',
    medium: 'text-nm-signature bg-nm-signature/10',
    high: 'text-nm-success bg-nm-success/10',
  };

  const MANUAL_FIELDS: { key: keyof NutritionEstimate; label: string; unit: string }[] = [
    { key: 'calories', label: 'Calories', unit: 'kcal' },
    { key: 'protein_g', label: 'Protein', unit: 'g' },
    { key: 'carbs_g', label: 'Carbs', unit: 'g' },
    { key: 'fat_g', label: 'Fat', unit: 'g' },
    { key: 'fiber_g', label: 'Fiber', unit: 'g' },
    { key: 'sugar_g', label: 'Sugar', unit: 'g' },
    { key: 'sodium_mg', label: 'Sodium', unit: 'mg' },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Quantity & Unit */}
      <div>
        <label className="block text-nm-label-md text-nm-text/60 uppercase tracking-wider mb-2">Quantity & serving</label>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            min={0.1}
            step={0.5}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(0.1, Number(e.target.value) || 1))}
            className="w-20 px-4 py-3 bg-nm-surface-high rounded-full text-nm-text text-center font-bold text-sm focus:outline-none focus:bg-nm-surface-lowest focus:ring-2 focus:ring-nm-signature/40"
          />
          <div className="flex-1 flex gap-1.5 overflow-x-auto pb-1">
            {UNITS.map(u => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={`px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 flex-shrink-0 ${
                  unit === u
                    ? 'bg-nm-signature text-white'
                    : 'bg-nm-surface-high text-nm-text hover:bg-nm-surface-highest'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
        <p className="text-nm-label-md text-nm-text/30 mt-1.5">e.g., 2 eggs, 8 oz chicken breast, 1 cup rice</p>
      </div>

      {/* Estimate button */}
      <button
        onClick={doEstimate}
        disabled={!mealName.trim() || mealName.trim().length < 3 || isEstimating}
        className="w-full py-3 bg-gradient-to-br from-nm-signature to-nm-signature-light text-white font-bold text-sm rounded-full disabled:opacity-30 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        {isEstimating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Estimating nutrition...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4" />
            {hasEstimate ? 'Re-estimate' : 'Estimate Nutrition'}
          </>
        )}
      </button>

      {/* Nutrition display */}
      {showNutrition && (
        <div className={`rounded-[2rem] p-5 transition-all ${
          isStale ? 'bg-nm-surface-high/50 opacity-60' : 'bg-nm-surface'
        }`}>
          {isEstimating ? (
            <div className="flex items-center gap-2 text-nm-text">
              <Loader2 className="w-4 h-4 animate-spin text-nm-signature" />
              <span className="text-sm font-medium">Estimating nutrition...</span>
            </div>
          ) : estimateFailed ? (
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-nm-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-nm-text">Couldn't estimate nutrition for this item</p>
                <p className="text-nm-label-md text-nm-text/40 mt-1">No worries — enter the nutrition info from the label or package</p>
              </div>
            </div>
          ) : total && (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {nutritionSource === 'estimated' && !isStale && (
                    <Check className="w-4 h-4 text-nm-success" />
                  )}
                  <span className="text-nm-label-md text-nm-text/40 uppercase tracking-wider">
                    {isStale
                      ? 'Stale — tap Re-estimate'
                      : nutritionSource === 'manual'
                        ? 'Manual entry'
                        : nutritionSource === 'combined'
                          ? 'Estimated + manual edits'
                          : 'Estimated nutrition'
                    }
                    {quantity !== 1 && !isStale && ` (×${quantity})`}
                  </span>
                </div>
                {nutritionSource === 'manual' || nutritionSource === 'combined' ? (
                  <span className="text-nm-label-md px-3 py-1 rounded-full font-bold text-nm-accent bg-nm-accent/10">
                    Custom values
                  </span>
                ) : perUnit?.confidence && !isStale ? (
                  <span className={`text-nm-label-md px-3 py-1 rounded-full font-bold ${confidenceColors[perUnit.confidence]}`}>
                    {perUnit.confidence}
                  </span>
                ) : null}
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center">
                  <div className="text-2xl font-black text-nm-text">{total.calories}</div>
                  <div className="text-nm-label-md text-nm-text/40 uppercase">Cal</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-nm-signature">{total.protein_g}g</div>
                  <div className="text-nm-label-md text-nm-text/40 uppercase">Protein</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-nm-accent">{total.carbs_g}g</div>
                  <div className="text-nm-label-md text-nm-text/40 uppercase">Carbs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-nm-text/80">{total.fat_g}g</div>
                  <div className="text-nm-label-md text-nm-text/40 uppercase">Fat</div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Manual override toggle */}
      {!isEstimating && (
        <button
          onClick={() => setShowManual(prev => !prev)}
          className="flex items-center gap-2 text-sm text-nm-text/50 hover:text-nm-text transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>Edit nutrition manually</span>
          {showManual ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      )}

      {/* Manual fields */}
      {showManual && (
        <div className="grid grid-cols-2 gap-3">
          {MANUAL_FIELDS.map(f => {
            const baseValue = perUnit ? (perUnit[f.key] as number) * quantity : undefined;
            const override = manualOverrides[f.key] as number | undefined;
            const displayValue = override ?? baseValue;
            return (
              <div key={f.key} className="relative">
                <label className="block text-nm-label-md text-nm-text/40 uppercase tracking-wider mb-1">{f.label}</label>
                <div className="relative">
                  <input
                    type="number"
                    value={displayValue ?? ''}
                    onChange={(e) => handleManualChange(f.key, e.target.value)}
                    placeholder="—"
                    className="w-full px-4 py-2.5 bg-nm-surface-high rounded-full text-sm text-nm-text font-bold focus:outline-none focus:bg-nm-surface-lowest focus:ring-2 focus:ring-nm-signature/40 pr-12"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-nm-label-md text-nm-text/30">{f.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
