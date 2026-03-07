import { ArrowLeft, TrendingUp, Construction } from 'lucide-react';

interface ProgressScreenProps {
  onBack: () => void;
}

export function ProgressScreen({ onBack }: ProgressScreenProps) {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white sticky top-0 z-20 shadow-sm">
        <div className="px-4 pt-12 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Progress</h1>
              <p className="text-xs text-gray-500 mt-0.5">Trends and insights over time</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center px-6 pt-24">
        <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mb-5">
          <TrendingUp className="w-9 h-9 text-teal-400" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Coming Soon</h2>
        <p className="text-sm text-gray-500 text-center leading-relaxed max-w-xs">
          Track your weight trends, calorie patterns, and nutrition insights with weekly and monthly charts.
        </p>
        <div className="flex items-center gap-2 mt-6 text-gray-400">
          <Construction className="w-4 h-4" />
          <span className="text-xs font-medium">Under Development</span>
        </div>
      </div>
    </div>
  );
}
