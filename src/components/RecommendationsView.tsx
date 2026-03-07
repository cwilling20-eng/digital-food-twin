import { ArrowLeft, Sparkles, ChefHat } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { FoodItem } from '../types';

interface RecommendationsViewProps {
  recommendations: FoodItem[];
  apiRecommendations?: any;
  savoryPreference: number;
  spicyPreference: number;
  freshPreference: number;
  onBack: () => void;
}

export function RecommendationsView({
  apiRecommendations,
  onBack
}: RecommendationsViewProps) {
  const hasMarkdownOutput = apiRecommendations?.output && typeof apiRecommendations.output === 'string';

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white pb-24">
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Your Matches</h1>
            <p className="text-sm text-gray-500">Based on your Food DNA</p>
          </div>
        </div>
      </div>

      <div className="px-6 mb-6">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-emerald-100 text-sm">Menu analyzed successfully</p>
            <p className="text-white font-semibold">Personalized Recommendations</p>
          </div>
        </div>
      </div>

      {hasMarkdownOutput ? (
        <div className="px-6 pb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-ul:text-gray-700 prose-ol:text-gray-700">
              <ReactMarkdown>{apiRecommendations.output}</ReactMarkdown>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-6 pb-8">
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
            <p className="text-sm text-amber-900">No recommendations available. Please try scanning again.</p>
          </div>
        </div>
      )}

      <div className="px-6">
        <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600">
              These recommendations are personalized based on your unique taste profile.
              The more you use Digital Food Twin, the better we understand your preferences.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
