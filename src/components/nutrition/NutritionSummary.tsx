import { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { OverviewTab } from './OverviewTab';
import { CaloriesTab } from './CaloriesTab';
import { NutrientsTab } from './NutrientsTab';
import { MacrosTab } from './MacrosTab';
import type { MealData, Goals } from './types';

type Tab = 'overview' | 'calories' | 'nutrients' | 'macros';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'calories', label: 'Calories' },
  { id: 'nutrients', label: 'Nutrients' },
  { id: 'macros', label: 'Macros' }
];

interface NutritionSummaryProps {
  meals: MealData[];
  goals: Goals;
  date: Date;
  onBack: () => void;
}

function formatDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  ) return 'Today';

  if (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  ) return 'Yesterday';

  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function NutritionSummary({ meals, goals, date, onBack }: NutritionSummaryProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [currentDate, setCurrentDate] = useState(date);

  const navigateDate = (direction: -1 | 1) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white sticky top-0 z-20 shadow-sm">
        <div className="px-4 pt-12 pb-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Nutrition</h1>
        </div>

        {activeTab !== 'overview' && (
          <div className="px-4 pb-2 flex items-center justify-between">
            <button
              onClick={() => navigateDate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-sm font-semibold text-gray-700">
              Day View / {formatDate(currentDate)}
            </span>
            <button
              onClick={() => navigateDate(1)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        )}

        <div className="flex border-b border-gray-200">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wide transition-colors relative ${
                activeTab === tab.id
                  ? 'text-emerald-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-emerald-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4">
        {activeTab === 'overview' && <OverviewTab meals={meals} goals={goals} />}
        {activeTab === 'calories' && <CaloriesTab meals={meals} goals={goals} />}
        {activeTab === 'nutrients' && <NutrientsTab meals={meals} goals={goals} />}
        {activeTab === 'macros' && <MacrosTab meals={meals} goals={goals} />}
      </div>
    </div>
  );
}
