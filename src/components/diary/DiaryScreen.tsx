import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, Flame, Loader2, BarChart3 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useMeals } from '../../hooks/useMeals';
import { useWaterLogs } from '../../hooks/useWaterLogs';
import { QuickAddModal } from './QuickAddModal';
import { WaterTracker } from './WaterTracker';
import { MealItem } from './MealItem';
import { MealDetailModal } from './MealDetailModal';
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
  }) => {
    const result = await addMeal({
      meal_name: data.meal_name,
      meal_type: data.meal_type,
      feeling: data.feeling,
      notes: data.notes,
      nutrition: data.nutrition,
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
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white sticky top-0 z-20 shadow-sm">
        <div className="px-4 pt-12 pb-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateDate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={goToToday} className="flex flex-col items-center">
              <span className="text-lg font-bold text-gray-900">{formatDateHeader(selectedDate)}</span>
              <span className="text-xs text-gray-500">
                {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </button>
            <button
              onClick={() => navigateDate(1)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" />
                <span className="text-sm font-medium text-gray-300">Calories</span>
              </div>
              <span className={`text-sm font-semibold ${remaining >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {remaining >= 0 ? `${remaining} remaining` : `${Math.abs(remaining)} over`}
              </span>
            </div>

            <div className="w-full h-2 bg-gray-700 rounded-full mb-4 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${remaining >= 0 ? 'bg-emerald-400' : 'bg-red-400'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{goals.calorieGoal.toLocaleString()}</div>
                <div className="text-[11px] text-gray-400 uppercase tracking-wider mt-0.5">Goal</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-400">{totalFood.toLocaleString()}</div>
                <div className="text-[11px] text-gray-400 uppercase tracking-wider mt-0.5">Food</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${remaining >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {Math.abs(remaining).toLocaleString()}
                </div>
                <div className="text-[11px] text-gray-400 uppercase tracking-wider mt-0.5">
                  {remaining >= 0 ? 'Remaining' : 'Over'}
                </div>
              </div>
            </div>

            {totalFood > 0 && (
              <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-700">
                <div className="text-center">
                  <span className="text-sm font-semibold text-blue-400">{Math.round(totalProtein)}g</span>
                  <span className="text-[10px] text-gray-500 ml-1">P</span>
                </div>
                <div className="text-center">
                  <span className="text-sm font-semibold text-amber-400">{Math.round(totalCarbs)}g</span>
                  <span className="text-[10px] text-gray-500 ml-1">C</span>
                </div>
                <div className="text-center">
                  <span className="text-sm font-semibold text-rose-400">{Math.round(totalFat)}g</span>
                  <span className="text-[10px] text-gray-500 ml-1">F</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="px-4 space-y-3 mt-3">
          {MEAL_SECTIONS.map(section => {
            const sectionMeals = getMealsForType(section.type);
            const sectionCals = getCaloriesForType(section.type);

            return (
              <div key={section.type} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{section.emoji}</span>
                    <span className="font-semibold text-gray-900 text-sm">{section.label}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-500">
                    {sectionCals > 0 ? `${sectionCals} cal` : ''}
                  </span>
                </div>

                {sectionMeals.length > 0 && (
                  <div className="divide-y divide-gray-50">
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
                  className="w-full flex items-center gap-2 px-4 py-3 text-emerald-600 hover:bg-emerald-50 transition-colors border-t border-gray-50"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">ADD FOOD</span>
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
              <p className="text-gray-400 text-sm">No food logged {isToday ? 'today' : 'for this day'}.</p>
              <button
                onClick={onOpenQuickAdd}
                className="mt-2 text-emerald-600 font-medium text-sm hover:text-emerald-700 transition-colors"
              >
                Log your first meal
              </button>
            </div>
          )}

          <button
            onClick={() => onOpenNutrition(meals, selectedDate)}
            className="w-full flex items-center justify-center gap-2.5 py-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors mb-4"
          >
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-semibold text-gray-900">Nutrition Summary</span>
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
          <div className="relative bg-white rounded-2xl shadow-2xl mx-6 w-full max-w-sm overflow-hidden animate-scale-in">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Remove meal?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Remove <span className="font-medium text-gray-700">{deleteTarget.meal_name}</span> from your diary?
              </p>
            </div>
            <div className="flex border-t border-gray-100">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-4 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <div className="w-px bg-gray-100" />
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-4 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
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
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2 animate-fade-in">
          <span className="text-sm font-medium">Food logged!</span>
        </div>
      )}

      {deleteToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2 animate-fade-in">
          <span className="text-sm font-medium">Meal removed</span>
        </div>
      )}

      {updateToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2 animate-fade-in">
          <span className="text-sm font-medium">Meal updated</span>
        </div>
      )}
    </div>
  );
}
