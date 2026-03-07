import { ArrowLeft, ExternalLink } from 'lucide-react';

interface AboutScreenProps {
  onBack: () => void;
}

export function AboutScreen({ onBack }: AboutScreenProps) {
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
              <h1 className="text-xl font-bold text-gray-900">About</h1>
              <p className="text-xs text-gray-500 mt-0.5">App information</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-6">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-3">
            <span className="text-2xl font-bold text-white">F</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900">Digital Food Twin</h2>
          <p className="text-sm text-gray-500 mt-0.5">Version 1.0.0</p>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <a
            href="#"
            className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-medium text-gray-900">Terms of Service</span>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </a>
          <a
            href="#"
            className="flex items-center justify-between px-4 py-4 border-t border-gray-50 hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-medium text-gray-900">Privacy Policy</span>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </a>
          <div className="flex items-center justify-between px-4 py-4 border-t border-gray-50">
            <span className="text-sm font-medium text-gray-900">Licenses</span>
            <span className="text-sm text-gray-400">Open Source</span>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Made with care for better food choices.
        </p>
      </div>
    </div>
  );
}
