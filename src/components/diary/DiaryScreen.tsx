import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, Loader2, BarChart3 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useMeals } from '../../hooks/useMeals';
import { useWaterLogs } from '../../hooks/useWaterLogs';
import { QuickAddModal } from './QuickAddModal';
import { WaterTracker } from './WaterTracker';
import { MealItem } from './MealItem';
import { MealDetailModal } from './MealDetailModal';
import { ProgressBar } from '../ui/ProgressBar';
import type { MealLogEntry } from '../../types';
import { ErrorToast, useErrorToast } from '../ui/Toast';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

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

interface DiaryScreenProps {
  userId: string;
  onOpenQuickAdd: () => void;
  onOpenNutrition: (meals: MealLogEntry[], date: Date) => void;
}

const MEAL_SECTIONS: { type: MealType; label: string; emoji: string }[] = [
  { type: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { type: 'lunch', label: 'Lunch', emoji: '☀️' },
  { type: 'dinner', label: 'Dinner', emoji: '🌙' },
  { type: 'snack', label: 'Snacks', emoji: '🍿' }
];

function formatDateHeader(date: Date): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';
  if (isSameDay(date, tomorrow)) return 'Tomorrow';

  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function getDateRange(date: Date): { start: string; end: string } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function DiaryScreen({ userId, onOpenQuickAdd, onOpenNutrition }: DiaryScreenProps) {
  const { nutritionGoals: goals } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { meals, setMeals, loading: mealsLoading, fetchMealsForDate, addMeal, updateMeal: hookUpdateMeal, deleteMeal: hookDeleteMeal } = useMeals(userId);
  const { waterLogs, fetchWaterForDate, addWater, removeWater } = useWaterLogs(userId);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMealType, setAddMealType] = useState<MealType>('lunch');
  const [saveToast, setSaveToast] = useState(false);
  const { errorMessage, showError, clearError } = useErrorToast();

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    await Promise.all([
      fetchMealsForDate(selectedDate),
      fetchWaterForDate(selectedDate),
    ]);
    setLoading(false);
  }, [userId, selectedDate, fetchMealsForDate, fetchWaterForDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const navigateDate = (direction: -1 | 1) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  const goToToday = () => setSelectedDate(new Date());

  const getMealsForType = (type: MealType): MealLogEntry[] =>
    meals.filter(m => m.meal_type === type);

  const getCaloriesForType = (type: MealType): number =>
    getMealsForType(type).reduce((sum, m) => sum + (m.estimated_calories || 0), 0);

  const totalFood = meals.reduce((sum, m) => sum + (m.estimated_calories || 0), 0);
  const totalProtein = meals.reduce((sum, m) => sum + (m.protein_g || 0), 0);
  const totalCarbs = meals.reduce((sum, m) => sum + (m.carbs_g || 0), 0);
  const totalFat = meals.reduce((sum, m) => sum + (m.fat_g || 0), 0);
  const remaining = goals.calorieGoal - totalFood;
  const progressPercent = Math.min((totalFood / goals.calorieGoal) * 100, 100);

  const handleOpenAdd = (mealType: MealType) => {
    setAddMealType(mealType);
    setShowAddModal(true);
  };

  const handleSaveMeal = async (data: {
    meal_name: string;
    meal_type: MealType;
    feeling: string;
    notes: string | null;
    nutrition: NutritionEstimate | null;
    quantity?: number;
    unit?: string;
    nutrition_source?: 'estimated' | 'manual' | 'combined';
    per_unit_nutrition?: NutritionEstimate | null;
  }) => {
    const result = await addMeal({
      meal_name: data.meal_name,
      meal_type: data.meal_type,
      feeling: data.feeling,
      notes: data.notes,
      nutrition: data.nutrition,
      quantity: data.quantity,
      unit: data.unit,
      nutrition_source: data.nutrition_source,
      per_unit_nutrition: data.per_unit_nutrition,
    });

    if (result.error) {
      showError(`Failed to save: ${result.error}`);
      return;
    }

    setShowAddModal(false);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
    fetchData();
  };

  const [deleteTarget, setDeleteTarget] = useState<MealLogEntry | null>(null);
  const [detailMeal, setDetailMeal] = useState<MealLogEntry | null>(null);
  const [deleteToast, setDeleteToast] = useState(false);
  const [updateToast, setUpdateToast] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const result = await hookDeleteMeal(deleteTarget.id);

    if (result.error) {
      showError(`Failed to delete: ${result.error}`);
      return;
    }

    setDeleteTarget(null);
    setDetailMeal(null);
    setDeleteToast(true);
    setTimeout(() => setDeleteToast(false), 2500);
  };

  const handleUpdateMeal = async (id: string, updates: Partial<MealLogEntry>) => {
    const result = await hookUpdateMeal(id, updates);

    if (result.error) {
      showError(`Failed to update: ${result.error}`);
      return;
    }

    setDetailMeal(prev => prev && prev.id === id ? { ...prev, ...updates } : prev);
    setUpdateToast(true);
    setTimeout(() => setUpdateToast(false), 2500);
  };

  const isToday = isSameDay(selectedDate, new Date());

  return (
    <div className="min-h-screen bg-nm-bg pb-40">
      {/* Date Header */}
      <div className="sticky top-0 z-20 bg-nm-bg/80 backdrop-blur-xl">
        <div className="px-6 pt-12 pb-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateDate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-nm-surface transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-nm-text/60" />
            </button>
            <button onClick={goToToday} className="flex flex-col items-center">
              <span className="text-2xl font-bold text-nm-text tracking-tight">{formatDateHeader(selectedDate)}</span>
              <span className="text-nm-label-md text-nm-text/40 uppercase tracking-wider mt-1">
                {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </button>
            <button
              onClick={() => navigateDate(1)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-nm-surface transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-nm-text/60" />
            </button>
          </div>
        </div>

        {/* Calorie Summary Card */}
        <div className="px-6 pb-6">
          <div className="bg-nm-surface-lowest rounded-[2rem] p-8 shadow-nm-float">
            <div className="text-center mb-4">
              <span className="text-5xl font-black text-nm-text tracking-tight">{totalFood.toLocaleString()}</span>
              <p className="text-nm-label-md text-nm-text/40 uppercase tracking-wider mt-1">CALORIES CONSUMED</p>
            </div>

            <ProgressBar percentage={progressPercent} className="h-4 mb-6" />

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-nm-text">{goals.calorieGoal.toLocaleString()}</div>
                <div className="text-nm-label-md text-nm-text/40 uppercase tracking-wider mt-1">Goal</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-nm-accent">{totalFood.toLocaleString()}</div>
                <div className="text-nm-label-md text-nm-text/40 uppercase tracking-wider mt-1">Food</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${remaining >= 0 ? 'text-nm-success' : 'text-nm-signature'}`}>
                  {Math.abs(remaining).toLocaleString()}
                </div>
                <div className="text-nm-label-md text-nm-text/40 uppercase tracking-wider mt-1">
                  {remaining >= 0 ? 'Remaining' : 'Over'}
                </div>
              </div>
            </div>

            {totalFood > 0 && (
              <div className="flex items-center justify-center gap-6 mt-6">
                <div className="bg-nm-signature text-white px-4 py-2 rounded-full">
                  <span className="text-sm font-bold">{Math.round(totalProtein)}g</span>
                  <span className="text-[10px] ml-1 opacity-80">P</span>
                </div>
                <div className="bg-nm-accent text-nm-text px-4 py-2 rounded-full">
                  <span className="text-sm font-bold">{Math.round(totalCarbs)}g</span>
                  <span className="text-[10px] ml-1 opacity-80">C</span>
                </div>
                <div className="bg-nm-surface text-nm-text px-4 py-2 rounded-full">
                  <span className="text-sm font-bold">{Math.round(totalFat)}g</span>
                  <span className="text-[10px] ml-1 opacity-80">F</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-nm-signature" />
        </div>
      ) : (
        <div className="px-6 space-y-[2.75rem] mt-2">
          {MEAL_SECTIONS.map(section => {
            const sectionMeals = getMealsForType(section.type);
            const sectionCals = getCaloriesForType(section.type);

            return (
              <div key={section.type}>
                {/* Section header — label-md ALL-CAPS */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{section.emoji}</span>
                    <span className="text-nm-label-md text-nm-text/60 uppercase tracking-wider">{section.label}</span>
                  </div>
                  <span className="text-nm-label-md text-nm-text/40">
                    {sectionCals > 0 ? `${sectionCals} cal` : ''}
                  </span>
                </div>

                {/* Meal items with spacing-3 gaps */}
                {sectionMeals.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {sectionMeals.map(meal => (
                      <MealItem
                        key={meal.id}
                        meal={meal}
                        onDelete={(meal: MealLogEntry) => setDeleteTarget(meal)}
                        onTap={(meal: MealLogEntry) => setDetailMeal(meal)}
                      />
                    ))}
                  </div>
                )}

                <button
                  onClick={() => handleOpenAdd(section.type)}
                  className="flex items-center gap-2 text-nm-signature font-bold text-sm hover:opacity-80 transition-opacity"
                >
                  <Plus className="w-4 h-4" />
                  <span>ADD FOOD</span>
                </button>
              </div>
            );
          })}

          <WaterTracker
            waterGoal={goals.waterGoal}
            waterLogs={waterLogs}
            onAddWater={addWater}
            onRemoveWater={removeWater}
            onRefresh={fetchData}
          />

          {meals.length === 0 && (
            <div className="text-center py-6">
              <p className="text-nm-text/40 text-sm">No food logged {isToday ? 'today' : 'for this day'}.</p>
              <button
                onClick={onOpenQuickAdd}
                className="mt-2 text-nm-signature font-bold text-sm hover:opacity-80 transition-opacity"
              >
                Log your first meal
              </button>
            </div>
          )}

          <button
            onClick={() => onOpenNutrition(meals, selectedDate)}
            className="w-full flex items-center justify-center gap-2.5 py-4 bg-nm-surface-lowest rounded-[2rem] shadow-nm-float hover:bg-nm-surface-low transition-colors mb-4"
          >
            <BarChart3 className="w-5 h-5 text-nm-signature" />
            <span className="text-nm-label-lg text-nm-text">Nutrition Summary</span>
          </button>
        </div>
      )}

      {showAddModal && (
        <QuickAddModal
          defaultMealType={addMealType}
          onSave={handleSaveMeal}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-nm-surface-lowest rounded-[2rem] shadow-nm-float mx-6 w-full max-w-sm overflow-hidden animate-scale-in">
            <div className="p-8 text-center">
              <div className="w-14 h-14 bg-nm-signature/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-nm-signature" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-nm-text mb-1">Remove meal?</h3>
              <p className="text-sm text-nm-text/60 leading-relaxed">
                Remove <span className="font-semibold text-nm-text">{deleteTarget.meal_name}</span> from your diary?
              </p>
            </div>
            <div className="flex gap-3 px-8 pb-8">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3.5 text-sm font-bold text-nm-text rounded-full bg-nm-surface hover:bg-nm-surface-high transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-3.5 text-sm font-bold text-white rounded-full bg-nm-signature hover:opacity-90 transition-opacity"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {detailMeal && !deleteTarget && (
        <MealDetailModal
          meal={detailMeal}
          onUpdate={handleUpdateMeal}
          onDelete={(meal: MealLogEntry) => setDeleteTarget(meal)}
          onClose={() => setDetailMeal(null)}
        />
      )}

      {errorMessage && (
        <ErrorToast message={errorMessage} onDismiss={clearError} />
      )}

      {saveToast && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-nm-text text-white px-6 py-3 rounded-full shadow-nm-float z-50 flex items-center gap-2 animate-fade-in">
          <span className="text-sm font-bold">Food logged!</span>
        </div>
      )}

      {deleteToast && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-nm-text text-white px-6 py-3 rounded-full shadow-nm-float z-50 flex items-center gap-2 animate-fade-in">
          <span className="text-sm font-bold">Meal removed</span>
        </div>
      )}

      {updateToast && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-nm-text text-white px-6 py-3 rounded-full shadow-nm-float z-50 flex items-center gap-2 animate-fade-in">
          <span className="text-sm font-bold">Meal updated</span>
        </div>
      )}
    </div>
  );
}
