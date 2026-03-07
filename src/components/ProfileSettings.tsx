import { useState } from 'react';
import { User, LogOut, Mail, RotateCcw } from 'lucide-react';
import { MyBlueprint } from './MyBlueprint';
import type { ComprehensiveUserProfile } from '../types';

interface ProfileSettingsProps {
  comprehensiveProfile: ComprehensiveUserProfile;
  onSaveProfile: (profile: ComprehensiveUserProfile) => void;
  onReset: () => void;
  onLogout: () => void;
  userEmail: string;
}

export function ProfileSettings({ comprehensiveProfile, onSaveProfile, onReset, onLogout, userEmail }: ProfileSettingsProps) {
  const [profile, setProfile] = useState<ComprehensiveUserProfile>(comprehensiveProfile);

  const handleSave = (updatedProfile: ComprehensiveUserProfile) => {
    setProfile(updatedProfile);
    onSaveProfile(updatedProfile);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white px-6 pt-12 pb-6 shadow-sm mb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">My Blueprint</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm text-gray-500 truncate">{userEmail}</span>
            </div>
          </div>
        </div>
        <p className="text-gray-500 text-sm">Your complete food DNA and preferences</p>
      </div>

      <div className="space-y-6 px-6">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-6 shadow-xl">
          <h3 className="text-white font-semibold text-lg mb-6 text-center">Your Food DNA</h3>
          <div className="flex justify-around items-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-2 mx-auto">
                <span className="text-2xl font-bold text-white">
                  {Math.round((profile.tasteProfile.sweetVsSavory / 10) * 100)}
                </span>
              </div>
              <p className="text-white/90 text-sm font-medium">Savory</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center mb-2 mx-auto">
                <span className="text-3xl font-bold text-white">
                  {Math.round((profile.tasteProfile.spicyTolerance / 10) * 100)}
                </span>
              </div>
              <p className="text-white/90 text-sm font-medium">Spicy</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-2 mx-auto">
                <span className="text-2xl font-bold text-white">75</span>
              </div>
              <p className="text-white/90 text-sm font-medium">Fresh</p>
            </div>
          </div>
        </div>

        <MyBlueprint profile={profile} onSave={handleSave} />

        <div className="space-y-3 pt-2">
          <button
            onClick={onReset}
            className="w-full py-3 px-8 rounded-2xl font-semibold border-2 border-amber-200 text-amber-600 hover:bg-amber-50 transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <RotateCcw className="w-5 h-5" />
            Reset Profile
          </button>

          <button
            onClick={onLogout}
            className="w-full py-3 px-8 rounded-2xl font-semibold border-2 border-red-200 text-red-600 hover:bg-red-50 transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
