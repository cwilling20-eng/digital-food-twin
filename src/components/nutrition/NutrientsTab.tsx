import { NutrientBar } from './NutrientBar';
import type { MealData, Goals } from './types';

interface NutrientsTabProps {
  meals: MealData[];
  goals: Goals;
}

export function NutrientsTab({ meals, goals }: NutrientsTabProps) {
  const totals = meals.reduce(
    (acc, m) => ({
      protein: acc.protein + (m.protein_g || 0),
      carbs: acc.carbs + (m.carbs_g || 0),
      fiber: acc.fiber + (m.fiber_g || 0),
      sugar: acc.sugar + (m.sugar_g || 0),
      fat: acc.fat + (m.fat_g || 0),
      sodium: acc.sodium + (m.sodium_mg || 0)
    }),
    { protein: 0, carbs: 0, fiber: 0, sugar: 0, fat: 0, sodium: 0 }
  );

  const nutrients = [
    { label: 'Protein', current: totals.protein, goal: goals.proteinGoal, unit: 'g', color: '#3b82f6' },
    { label: 'Carbohydrates', current: totals.carbs, goal: goals.carbsGoal, unit: 'g', color: '#f59e0b' },
    { label: 'Fiber', current: totals.fiber, goal: 28, unit: 'g', color: '#10b981' },
    { label: 'Sugar', current: totals.sugar, goal: 50, unit: 'g', color: '#ec4899' },
    { label: 'Fat', current: totals.fat, goal: goals.fatGoal, unit: 'g', color: '#f43f5e' },
    { label: 'Saturated Fat', current: totals.fat * 0.35, goal: 20, unit: 'g', color: '#ef4444' },
    { label: 'Sodium', current: totals.sodium, goal: 2300, unit: 'mg', color: '#8b5cf6' }
  ];

  return (
    <div className="pb-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="grid grid-cols-4 gap-2 pb-3 mb-1 border-b border-gray-100">
          <span className="text-xs font-semibold text-gray-500 uppercase">Nutrient</span>
          <span className="text-xs font-semibold text-gray-500 uppercase text-right">Total</span>
          <span className="text-xs font-semibold text-gray-500 uppercase text-right">Goal</span>
          <span className="text-xs font-semibold text-gray-500 uppercase text-right">Left</span>
        </div>

        <div className="divide-y divide-gray-50">
          {nutrients.map((n) => (
            <div key={n.label}>
              <NutrientBar
                label={n.label}
                current={n.current}
                goal={n.goal}
                unit={n.unit}
                color={n.color}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
