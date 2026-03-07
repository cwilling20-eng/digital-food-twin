import { PieChart } from './PieChart';
import type { MealData, Goals } from './types';

interface MacrosTabProps {
  meals: MealData[];
  goals: Goals;
}

export function MacrosTab({ meals, goals }: MacrosTabProps) {
  const totalProtein = meals.reduce((s, m) => s + (m.protein_g || 0), 0);
  const totalCarbs = meals.reduce((s, m) => s + (m.carbs_g || 0), 0);
  const totalFat = meals.reduce((s, m) => s + (m.fat_g || 0), 0);
  const totalGrams = totalProtein + totalCarbs + totalFat;

  const segments = [
    { value: totalCarbs, color: '#f59e0b', label: 'Carbs' },
    { value: totalFat, color: '#f43f5e', label: 'Fat' },
    { value: totalProtein, color: '#3b82f6', label: 'Protein' }
  ];

  const goalTotalG = goals.proteinGoal + goals.carbsGoal + goals.fatGoal;

  const macros = [
    {
      name: 'Carbohydrates',
      grams: totalCarbs,
      goal: goals.carbsGoal,
      goalPercent: goalTotalG > 0 ? Math.round((goals.carbsGoal / goalTotalG) * 100) : 0,
      actualPercent: totalGrams > 0 ? Math.round((totalCarbs / totalGrams) * 100) : 0,
      color: '#f59e0b',
      bgClass: 'bg-amber-50'
    },
    {
      name: 'Fat',
      grams: totalFat,
      goal: goals.fatGoal,
      goalPercent: goalTotalG > 0 ? Math.round((goals.fatGoal / goalTotalG) * 100) : 0,
      actualPercent: totalGrams > 0 ? Math.round((totalFat / totalGrams) * 100) : 0,
      color: '#f43f5e',
      bgClass: 'bg-rose-50'
    },
    {
      name: 'Protein',
      grams: totalProtein,
      goal: goals.proteinGoal,
      goalPercent: goalTotalG > 0 ? Math.round((goals.proteinGoal / goalTotalG) * 100) : 0,
      actualPercent: totalGrams > 0 ? Math.round((totalProtein / totalGrams) * 100) : 0,
      color: '#3b82f6',
      bgClass: 'bg-blue-50'
    }
  ];

  const topProteinFoods = [...meals]
    .filter(m => (m.protein_g || 0) > 0)
    .sort((a, b) => (b.protein_g || 0) - (a.protein_g || 0))
    .slice(0, 3);

  const topCarbFoods = [...meals]
    .filter(m => (m.carbs_g || 0) > 0)
    .sort((a, b) => (b.carbs_g || 0) - (a.carbs_g || 0))
    .slice(0, 3);

  return (
    <div className="space-y-5 pb-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex justify-center mb-6">
          <PieChart
            segments={segments}
            size={200}
            strokeWidth={32}
            centerValue={`${Math.round(totalGrams)}g`}
            centerLabel="Total"
          />
        </div>

        <div className="space-y-3">
          {macros.map((macro) => (
            <div key={macro.name} className={`p-3.5 rounded-xl ${macro.bgClass}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: macro.color }} />
                  <span className="text-sm font-semibold text-gray-900">{macro.name}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{Math.round(macro.grams)}g</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Actual</div>
                  <div className="text-lg font-bold text-gray-900">{macro.actualPercent}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Goal</div>
                  <div className="text-lg font-bold text-gray-400">{macro.goalPercent}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {topProteinFoods.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            Foods Highest in Protein
          </h3>
          <div className="space-y-2">
            {topProteinFoods.map((food, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-gray-700 truncate flex-1">{food.meal_name}</span>
                <span className="text-sm font-medium text-blue-600 ml-2">{Math.round(food.protein_g || 0)}g</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {topCarbFoods.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            Foods Highest in Carbs
          </h3>
          <div className="space-y-2">
            {topCarbFoods.map((food, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-gray-700 truncate flex-1">{food.meal_name}</span>
                <span className="text-sm font-medium text-amber-600 ml-2">{Math.round(food.carbs_g || 0)}g</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
