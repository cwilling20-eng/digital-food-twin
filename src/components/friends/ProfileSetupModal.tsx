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
  { id: 'emerald', gradient: 'from-nm-signature to-nm-signature-light' },
  { id: 'blue', gradient: 'from-nm-success to-nm-success' },
  { id: 'purple', gradient: 'from-nm-accent to-nm-signature' },
  { id: 'pink', gradient: 'from-nm-signature-light to-nm-accent' },
  { id: 'amber', gradient: 'from-nm-accent to-nm-accent' },
  { id: 'red', gradient: 'from-nm-signature to-nm-signature' }
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
      <div className="absolute bottom-0 left-0 right-0 bg-nm-surface-lowest rounded-[2rem] rounded-b-none max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-nm-surface-lowest px-8 pt-5 pb-4 rounded-t-[2rem]">
          <div className="w-10 h-1 bg-nm-surface-high rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-nm-text">Set Up Your Profile</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-nm-surface transition-colors"
            >
              <X className="w-5 h-5 text-nm-text/40" />
            </button>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          <div className="text-center">
            <p className="text-nm-text/60">
              Create a profile so friends can find and add you
            </p>
          </div>

          <div>
            <label className="block text-nm-label-md text-nm-text/60 uppercase tracking-wider mb-3">
              Choose Avatar Color
            </label>
            <div className="flex justify-center gap-3">
              {DEFAULT_AVATARS.map(avatar => (
                <button
                  key={avatar.id}
                  onClick={() => setSelectedAvatar(avatar.id)}
                  className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatar.gradient} flex items-center justify-center text-white font-bold transition-all active:scale-95 ${
                    selectedAvatar === avatar.id
                      ? 'ring-4 ring-nm-signature/30 scale-110'
                      : 'hover:scale-105'
                  }`}
                >
                  {displayName ? getInitials(displayName) : '?'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-nm-label-md text-nm-text/60 uppercase tracking-wider mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="w-full px-5 py-3.5 bg-nm-surface-high rounded-full text-nm-text placeholder:text-nm-text/30 focus:outline-none focus:bg-nm-surface-lowest focus:ring-2 focus:ring-nm-signature/40 transition-all"
            />
          </div>

          <div>
            <label className="block text-nm-label-md text-nm-text/60 uppercase tracking-wider mb-2">
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
                className={`w-full px-5 py-3.5 bg-nm-surface-high rounded-full text-nm-text placeholder:text-nm-text/30 focus:outline-none transition-all ${
                  usernameError
                    ? 'ring-2 ring-nm-signature/40 bg-nm-signature/5'
                    : 'focus:bg-nm-surface-lowest focus:ring-2 focus:ring-nm-signature/40'
                }`}
              />
              {checking && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-nm-signature border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            {usernameError && (
              <p className="mt-2 text-sm text-nm-signature flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {usernameError}
              </p>
            )}
            <p className="mt-2 text-sm text-nm-text/40">
              This is how friends will find you
            </p>
          </div>

          <div className="bg-nm-surface rounded-[2rem] p-5">
            <button
              onClick={() => setShareFoodDna(!shareFoodDna)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                {shareFoodDna ? (
                  <Eye className="w-5 h-5 text-nm-signature" />
                ) : (
                  <EyeOff className="w-5 h-5 text-nm-text/30" />
                )}
                <div className="text-left">
                  <p className="font-bold text-nm-text">Share Food DNA with friends</p>
                  <p className="text-sm text-nm-text/60">
                    Let friends see your food preferences for better group dining
                  </p>
                </div>
              </div>
              <div
                className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${
                  shareFoodDna ? 'bg-nm-signature' : 'bg-nm-surface-high'
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
            className={`w-full py-4 font-bold rounded-full transition-all flex items-center justify-center gap-2 active:scale-95 ${
              !username || !displayName || !!usernameError || saving
                ? 'bg-nm-surface-high text-nm-text/30 cursor-not-allowed'
                : 'bg-gradient-to-br from-nm-signature to-nm-signature-light text-white shadow-nm-float'
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
