import { PieChart } from './PieChart';
import type { MealData, Goals } from './types';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface CaloriesTabProps {
  meals: MealData[];
  goals: Goals;
}

const MEAL_COLORS: Record<MealType, string> = {
  breakfast: '#f59e0b',
  lunch: '#3b82f6',
  dinner: '#10b981',
  snack: '#f43f5e'
};

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks'
};

export function CaloriesTab({ meals, goals }: CaloriesTabProps) {
  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
  const totalCalories = meals.reduce((s, m) => s + (m.estimated_calories || 0), 0);

  const segments = mealTypes.map(type => {
    const cals = meals
      .filter(m => m.meal_type === type)
      .reduce((s, m) => s + (m.estimated_calories || 0), 0);
    return {
      value: cals,
      color: MEAL_COLORS[type],
      label: MEAL_LABELS[type]
    };
  });

  return (
    <div className="space-y-5 pb-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex justify-center mb-6">
          <PieChart
            segments={segments}
            size={200}
            strokeWidth={32}
            centerValue={totalCalories.toLocaleString()}
            centerLabel="Total Cal"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {segments.map((seg) => {
            const percent = totalCalories > 0 ? Math.round((seg.value / totalCalories) * 100) : 0;
            return (
              <div key={seg.label} className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                <div className="min-w-0">
                  <div className="text-xs text-gray-500">{seg.label}</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {seg.value} cal
                    <span className="text-gray-400 font-normal ml-1">({percent}%)</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">Total Calories</span>
            <span className="text-sm font-semibold text-gray-900">{totalCalories.toLocaleString()}</span>
          </div>
          <div className="h-px bg-gray-100" />
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">Net Calories</span>
            <span className="text-sm font-semibold text-gray-900">{totalCalories.toLocaleString()}</span>
          </div>
          <div className="h-px bg-gray-100" />
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">Goal</span>
            <span className="text-sm font-semibold text-nm-signature">{goals.calorieGoal.toLocaleString()}</span>
          </div>
          <div className="h-px bg-gray-100" />
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">Remaining</span>
            <span className={`text-sm font-semibold ${
              goals.calorieGoal - totalCalories >= 0 ? 'text-nm-signature' : 'text-red-500'
            }`}>
              {(goals.calorieGoal - totalCalories).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
