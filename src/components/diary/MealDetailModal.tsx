import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Trash2, Loader2, Pencil, Check } from 'lucide-react';
import { WEBHOOK_NUTRITION_URL } from '../../config/api';
import { MacroPills } from '../ui/MacroPills';
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

  const detailRows = [
    { label: 'Fiber', value: meal.fiber_g, unit: 'g' },
    { label: 'Sugar', value: meal.sugar_g, unit: 'g' },
    { label: 'Sodium', value: meal.sodium_mg, unit: 'mg' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-nm-surface-lowest rounded-[2rem] rounded-b-none shadow-nm-float animate-slide-up max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-nm-surface-lowest z-10 px-8 pt-5 pb-4">
          <div className="w-10 h-1 bg-nm-surface-high rounded-full mx-auto mb-5" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-nm-label-md text-nm-text/40 uppercase tracking-wider">{mealTypeLabel}</span>
              <span className="text-nm-label-md text-nm-text/30">at {time}</span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-nm-surface transition-colors"
            >
              <X className="w-4 h-4 text-nm-text/40" />
            </button>
          </div>
        </div>

        <div className="px-8 pb-8 space-y-6">
          {/* Food name */}
          <div>
            {isEditing ? (
              <div className="flex items-center gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') { setIsEditing(false); setEditName(meal.meal_name); } }}
                  className="flex-1 px-5 py-3 bg-nm-surface-high rounded-full text-nm-text focus:outline-none focus:ring-2 focus:ring-nm-signature/40 focus:bg-nm-surface-lowest"
                  disabled={isSaving}
                />
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-nm-signature to-nm-signature-light text-white shadow-nm-float disabled:opacity-50 active:scale-95 transition-transform"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-5 h-5" />}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-nm-text">{meal.meal_name}</h2>
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-nm-surface transition-colors"
                >
                  <Pencil className="w-4 h-4 text-nm-text/40" />
                </button>
              </div>
            )}
            {isReEstimating && (
              <div className="flex items-center gap-2 mt-3">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-nm-signature" />
                <span className="text-nm-label-md text-nm-signature">Re-estimating nutrition...</span>
              </div>
            )}
          </div>

          {/* Feeling badge */}
          {meal.feeling && (
            <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-nm-surface rounded-full">
              <span className="text-nm-label-md text-nm-text/40">Feeling:</span>
              <span className="text-nm-label-md font-bold text-nm-text">{meal.feeling}</span>
            </div>
          )}

          {/* Calorie hero */}
          <div className="text-center py-2">
            <span className="text-nm-display-md text-nm-text">{meal.estimated_calories ?? '--'}</span>
            <p className="text-nm-label-md text-nm-text/40 uppercase tracking-wider mt-1">CALORIES</p>
          </div>

          {/* MacroPills */}
          <MacroPills
            data={{
              protein: Math.round(meal.protein_g || 0),
              carbs: Math.round(meal.carbs_g || 0),
              fat: Math.round(meal.fat_g || 0),
            }}
          />

          {/* Detail nutrition rows */}
          <div className="grid grid-cols-3 gap-3">
            {detailRows.map(row => (
              <div key={row.label} className="bg-nm-surface rounded-[2rem] p-4 text-center">
                <span className="text-lg font-bold text-nm-text">
                  {row.value !== null && row.value !== undefined ? Math.round(row.value) : '--'}
                </span>
                <span className="text-nm-label-md text-nm-text/40 ml-0.5">{row.unit}</span>
                <p className="text-nm-label-md text-nm-text/40 uppercase tracking-wider mt-1">{row.label}</p>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full bg-gradient-to-br from-nm-signature to-nm-signature-light text-white font-bold text-sm shadow-nm-float active:scale-95 transition-transform"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => onDelete(meal)}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full bg-transparent text-nm-text font-bold text-sm hover:bg-nm-surface transition-colors active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </button>
          </div>
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
}
