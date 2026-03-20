import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Trash2, Loader2, Pencil, Check } from 'lucide-react';
import { WEBHOOK_NUTRITION_URL } from '../../config/api';
import type { MealLogEntry } from '../../types';

interface MealDetailModalProps {
  meal: MealLogEntry;
  onUpdate: (id: string, updates: Partial<MealLogEntry>) => Promise<void>;
  onDelete: (meal: MealLogEntry) => void;
  onClose: () => void;
}

interface NutritionEstimate {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
}

export function MealDetailModal({ meal, onUpdate, onDelete, onClose }: MealDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(meal.meal_name);
  const [isSaving, setIsSaving] = useState(false);
  const [isReEstimating, setIsReEstimating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const estimateNutrition = useCallback(async (name: string): Promise<NutritionEstimate | null> => {
    try {
      const response = await fetch(WEBHOOK_NUTRITION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meal_description: name })
      });
      if (!response.ok) return null;
      const data = await response.json();
      const output = typeof data.output === 'string' ? JSON.parse(data.output) : data.output || data;
      return {
        calories: output.calories ?? output.estimated_calories ?? 0,
        protein_g: output.protein_g ?? 0,
        carbs_g: output.carbs_g ?? 0,
        fat_g: output.fat_g ?? 0,
        fiber_g: output.fiber_g ?? 0,
        sugar_g: output.sugar_g ?? 0,
        sodium_mg: output.sodium_mg ?? 0,
      };
    } catch {
      return null;
    }
  }, []);

  const handleSaveEdit = async () => {
    if (!editName.trim() || editName.trim() === meal.meal_name) {
      setIsEditing(false);
      setEditName(meal.meal_name);
      return;
    }

    setIsSaving(true);
    setIsReEstimating(true);

    const nutrition = await estimateNutrition(editName.trim());

    const updates: Partial<MealLogEntry> = {
      meal_name: editName.trim(),
    };

    if (nutrition) {
      updates.estimated_calories = nutrition.calories;
      updates.protein_g = nutrition.protein_g;
      updates.carbs_g = nutrition.carbs_g;
      updates.fat_g = nutrition.fat_g;
      updates.fiber_g = nutrition.fiber_g;
      updates.sugar_g = nutrition.sugar_g;
      updates.sodium_mg = nutrition.sodium_mg;
    }

    await onUpdate(meal.id, updates);
    setIsSaving(false);
    setIsReEstimating(false);
    setIsEditing(false);
  };

  const time = new Date(meal.created_at).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const mealTypeLabel = meal.meal_type
    ? meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)
    : 'Meal';

  const nutritionRows = [
    { label: 'Calories', value: meal.estimated_calories, unit: 'kcal', color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Protein', value: meal.protein_g, unit: 'g', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Carbs', value: meal.carbs_g, unit: 'g', color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Fat', value: meal.fat_g, unit: 'g', color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Fiber', value: meal.fiber_g, unit: 'g', color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Sugar', value: meal.sugar_g, unit: 'g', color: 'text-pink-600', bg: 'bg-pink-50' },
    { label: 'Sodium', value: meal.sodium_mg, unit: 'mg', color: 'text-gray-600', bg: 'bg-gray-50' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 px-5 pt-4 pb-3 border-b border-gray-100">
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{mealTypeLabel}</span>
              <span className="text-xs text-gray-300">at {time}</span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-5">
          <div>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') { setIsEditing(false); setEditName(meal.meal_name); } }}
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  disabled={isSaving}
                />
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">{meal.meal_name}</h2>
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <Pencil className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            )}
            {isReEstimating && (
              <div className="flex items-center gap-2 mt-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                <span className="text-xs text-emerald-600">Re-estimating nutrition...</span>
              </div>
            )}
          </div>

          {meal.feeling && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full">
              <span className="text-xs text-gray-500">Feeling:</span>
              <span className="text-xs font-medium text-gray-700">{meal.feeling}</span>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nutrition</h3>
            <div className="grid grid-cols-2 gap-2">
              {nutritionRows.map(row => (
                <div key={row.label} className={`${row.bg} rounded-xl px-3.5 py-2.5 flex items-center justify-between`}>
                  <span className="text-xs font-medium text-gray-600">{row.label}</span>
                  <span className={`text-sm font-bold ${row.color}`}>
                    {row.value !== null && row.value !== undefined ? Math.round(row.value) : '--'}
                    <span className="text-[10px] text-gray-400 ml-0.5 font-normal">{row.unit}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onDelete(meal)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Remove from Diary
          </button>
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
}
