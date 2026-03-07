import { ArrowLeft, Mail, Lock, Bell, Palette, LogOut } from 'lucide-react';

interface SettingsScreenProps {
  userEmail: string;
  onLogout: () => void;
  onBack: () => void;
}

export function SettingsScreen({ userEmail, onLogout, onBack }: SettingsScreenProps) {
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
              <h1 className="text-xl font-bold text-gray-900">Settings</h1>
              <p className="text-xs text-gray-500 mt-0.5">Account & app preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-6">
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">Account</h2>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 px-4 py-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">Email</p>
                <p className="text-xs text-gray-500 truncate">{userEmail}</p>
              </div>
            </div>
            <div className="border-t border-gray-50 flex items-center gap-3 px-4 py-4 opacity-50">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <Lock className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Change Password</p>
                <p className="text-xs text-gray-500">Coming soon</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">Preferences</h2>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 px-4 py-4 opacity-50">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Notifications</p>
                <p className="text-xs text-gray-500">Coming soon</p>
              </div>
            </div>
            <div className="border-t border-gray-50 flex items-center gap-3 px-4 py-4 opacity-50">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <Palette className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Appearance</p>
                <p className="text-xs text-gray-500">Coming soon</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-red-50 hover:border-red-100 transition-colors"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            <span className="text-sm font-semibold text-red-500">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
