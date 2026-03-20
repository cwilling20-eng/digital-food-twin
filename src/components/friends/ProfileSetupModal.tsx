import { useState } from 'react';
import { X, User, AtSign, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { usePublicProfile } from '../../hooks/usePublicProfile';
import type { PublicProfile } from '../../types';

interface ProfileSetupModalProps {
  userId: string;
  currentProfile: PublicProfile | null;
  onClose: () => void;
  onSave: () => void;
}

const DEFAULT_AVATARS = [
  { id: 'emerald', gradient: 'from-emerald-400 to-teal-500' },
  { id: 'blue', gradient: 'from-blue-400 to-cyan-500' },
  { id: 'purple', gradient: 'from-violet-400 to-purple-500' },
  { id: 'pink', gradient: 'from-pink-400 to-rose-500' },
  { id: 'amber', gradient: 'from-amber-400 to-orange-500' },
  { id: 'red', gradient: 'from-red-400 to-rose-500' }
];

export function ProfileSetupModal({
  userId,
  currentProfile,
  onClose,
  onSave
}: ProfileSetupModalProps) {
  const [username, setUsername] = useState(currentProfile?.username || '');
  const [displayName, setDisplayName] = useState(currentProfile?.displayName || '');
  const [selectedAvatar, setSelectedAvatar] = useState(currentProfile?.avatarUrl || 'emerald');
  const [shareFoodDna, setShareFoodDna] = useState(currentProfile?.shareFoodDna ?? false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const { checkUsernameAvailable: checkAvailable, upsertProfile } = usePublicProfile(userId);

  const validateUsername = (value: string): boolean => {
    if (value.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setUsernameError('Only letters, numbers, and underscores allowed');
      return false;
    }
    setUsernameError(null);
    return true;
  };

  const checkUsernameAvailable = async (value: string): Promise<boolean> => {
    if (!validateUsername(value)) return false;

    setChecking(true);
    const available = await checkAvailable(value);
    setChecking(false);

    if (!available) {
      setUsernameError('Username is already taken');
      return false;
    }

    setUsernameError(null);
    return true;
  };

  const handleSave = async () => {
    if (!username || !displayName) return;

    const isAvailable = await checkUsernameAvailable(username);
    if (!isAvailable) return;

    setSaving(true);

    const result = await upsertProfile({
      username,
      displayName,
      avatarUrl: selectedAvatar,
      shareFoodDna,
    });

    setSaving(false);

    if (!result.error) {
      onSave();
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-white px-6 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Set Up Your Profile</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          <div className="text-center">
            <p className="text-gray-600">
              Create a profile so friends can find and add you
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose Avatar Color
            </label>
            <div className="flex justify-center gap-3">
              {DEFAULT_AVATARS.map(avatar => (
                <button
                  key={avatar.id}
                  onClick={() => setSelectedAvatar(avatar.id)}
                  className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatar.gradient} flex items-center justify-center text-white font-bold transition-all ${
                    selectedAvatar === avatar.id
                      ? 'ring-4 ring-emerald-500/50 scale-110'
                      : 'hover:scale-105'
                  }`}
                >
                  {displayName ? getInitials(displayName) : '?'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <AtSign className="w-4 h-4 inline mr-1" />
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                  setUsername(value);
                  if (value.length >= 3) {
                    validateUsername(value);
                  }
                }}
                onBlur={() => username.length >= 3 && checkUsernameAvailable(username)}
                placeholder="your_username"
                className={`w-full px-4 py-3 bg-gray-50 rounded-xl border outline-none transition-all ${
                  usernameError
                    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                }`}
              />
              {checking && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            {usernameError && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {usernameError}
              </p>
            )}
            <p className="mt-1.5 text-sm text-gray-500">
              This is how friends will find you
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <button
              onClick={() => setShareFoodDna(!shareFoodDna)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                {shareFoodDna ? (
                  <Eye className="w-5 h-5 text-emerald-600" />
                ) : (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                )}
                <div className="text-left">
                  <p className="font-medium text-gray-900">Share Food DNA with friends</p>
                  <p className="text-sm text-gray-500">
                    Let friends see your food preferences for better group dining
                  </p>
                </div>
              </div>
              <div
                className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${
                  shareFoodDna ? 'bg-emerald-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                    shareFoodDna ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={!username || !displayName || !!usernameError || saving}
            className={`w-full py-4 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
              !username || !displayName || !!usernameError || saving
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Save Profile
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
