import { Sparkles, Utensils, ChevronRight } from 'lucide-react';

interface OnboardingScreenProps {
  onStart: () => void;
}

export function OnboardingScreen({ onStart }: OnboardingScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-emerald-100 rounded-3xl flex items-center justify-center">
            <Utensils className="w-12 h-12 text-emerald-600" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 text-center mb-4">
          Digital Food Twin
        </h1>

        <p className="text-xl text-emerald-600 font-medium text-center mb-6">
          Your Personal Taste AI
        </p>

        <div className="max-w-sm text-center space-y-4 mb-12">
          <p className="text-gray-600 text-lg leading-relaxed">
            Discover dishes you'll love. We learn your unique taste profile to recommend
            the perfect meal, every time.
          </p>

          <div className="flex items-center justify-center gap-8 pt-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600">20</div>
              <div className="text-sm text-gray-500">Quick Swipes</div>
            </div>
            <div className="w-px h-12 bg-gray-200" />
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600">AI</div>
              <div className="text-sm text-gray-500">Powered</div>
            </div>
            <div className="w-px h-12 bg-gray-200" />
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600">100%</div>
              <div className="text-sm text-gray-500">Personalized</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pb-24">
        <button
          onClick={onStart}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-[0.98]"
        >
          Start My Profile
          <ChevronRight className="w-5 h-5" />
        </button>

        <p className="text-center text-sm text-gray-400 mt-4">
          Takes less than 60 seconds
        </p>
      </div>
    </div>
  );
}
