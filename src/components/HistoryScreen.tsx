import { useEffect } from 'react';
import { Clock, RefreshCw, Loader2, AlertCircle, UtensilsCrossed } from 'lucide-react';
import { useMeals } from '../hooks/useMeals';

interface HistoryScreenProps {
  userId: string;
}

const FEELING_EMOJI: Record<string, string> = {
  'Energized': '⚡️',
  'Satisfied': '🙂',
  'Bloated': '🎈',
  'Regret': '🤢',
  'Hungry': '🤤'
};

const FEELING_COLOR: Record<string, string> = {
  'Energized': 'text-green-600 bg-green-50',
  'Satisfied': 'text-blue-600 bg-blue-50',
  'Bloated': 'text-orange-600 bg-orange-50',
  'Regret': 'text-red-600 bg-red-50',
  'Hungry': 'text-yellow-600 bg-yellow-50'
};

export function HistoryScreen({ userId }: HistoryScreenProps) {
  const { meals: mealLogs, loading, fetchAllMeals } = useMeals(userId);

  useEffect(() => {
    if (userId) {
      fetchAllMeals();
    }
  }, [userId, fetchAllMeals]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-40">
      <div className="bg-white px-6 pt-12 pb-6 shadow-sm mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-6 h-6 text-nm-signature" />
              Meal History
            </h1>
            <p className="text-gray-500 text-sm mt-1">Your logged meals and feedback</p>
          </div>
          <button
            onClick={fetchAllMeals}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            title="Refresh History"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {loading && mealLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20">
            <Loader2 className="w-8 h-8 text-nm-bg0 animate-spin mb-2" />
            <p className="text-gray-400">Loading your meal history...</p>
          </div>
        ) : mealLogs.length === 0 ? (
          <div className="text-center pt-20 text-gray-400">
            <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="mb-2 font-medium">No meals logged yet.</p>
            <p className="text-sm">Start logging your meals to build your food history!</p>
          </div>
        ) : (
          mealLogs.map((log) => (
            <div
              key={log.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                  {log.meal_name}
                </h3>
                <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                  {formatDate(log.created_at)}
                </span>
              </div>

              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${FEELING_COLOR[log.feeling || ''] || 'text-gray-600 bg-gray-50'}`}>
                <span className="text-base">{FEELING_EMOJI[log.feeling || '']}</span>
                {log.feeling}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
