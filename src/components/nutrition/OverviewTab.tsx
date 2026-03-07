import type { MealData, Goals } from './types';

interface OverviewTabProps {
  meals: MealData[];
  goals: Goals;
}

export function OverviewTab({ meals, goals }: OverviewTabProps) {
  const totalProtein = meals.reduce((s, m) => s + (m.protein_g || 0), 0);
  const totalFiber = meals.reduce((s, m) => s + (m.fiber_g || 0), 0);
  const proteinPercent = goals.proteinGoal > 0 ? Math.min((totalProtein / goals.proteinGoal) * 100, 100) : 0;
  const fiberGoal = 28;
  const fiberPercent = Math.min((totalFiber / fiberGoal) * 100, 100);

  const nutrientGoals = [
    {
      name: 'Protein',
      current: totalProtein,
      goal: goals.proteinGoal,
      unit: 'g',
      percent: proteinPercent,
      color: '#3b82f6',
      tip: proteinPercent < 50
        ? 'Try adding lean meats, eggs, or legumes to boost your protein.'
        : proteinPercent < 100
          ? 'Good progress! A protein-rich snack could help you hit your goal.'
          : 'Great job hitting your protein target!'
    },
    {
      name: 'Fiber',
      current: totalFiber,
      goal: fiberGoal,
      unit: 'g',
      percent: fiberPercent,
      color: '#10b981',
      tip: fiberPercent < 50
        ? 'Add whole grains, fruits, or vegetables to increase fiber.'
        : fiberPercent < 100
          ? 'Almost there! Beans or berries are great fiber boosters.'
          : 'Excellent fiber intake today!'
    }
  ];

  return (
    <div className="space-y-5 pb-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Track your food</h3>
        {meals.length === 0 ? (
          <p className="text-sm text-gray-400">No foods logged yet for this day.</p>
        ) : (
          <div className="space-y-2">
            {meals.map((meal, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate">{meal.meal_name}</span>
                </div>
                <span className="text-sm text-gray-500 ml-2 flex-shrink-0">
                  {meal.estimated_calories || 0} cal
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-100">
              <span className="text-sm font-semibold text-gray-900">Total</span>
              <span className="text-sm font-semibold text-gray-900">
                {meals.reduce((s, m) => s + (m.estimated_calories || 0), 0)} cal
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Hit your top nutrient goals</h3>
        <div className="space-y-5">
          {nutrientGoals.map((nutrient) => (
            <div key={nutrient.name}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-700">{nutrient.name}</span>
                <span className="text-xs text-gray-500">
                  {Math.round(nutrient.current)}{nutrient.unit} / {nutrient.goal}{nutrient.unit}
                </span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${nutrient.percent}%`,
                    backgroundColor: nutrient.color
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{Math.round(nutrient.percent)}% complete</span>
                <span className="text-xs text-gray-400 italic max-w-[60%] text-right">{nutrient.tip}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
