import { useState, useEffect } from 'react';
import { X, Heart, AlertTriangle, Utensils, Trash2, Calendar } from 'lucide-react';
import { useFriends } from '../../hooks/useFriends';
import type { FriendData } from '../../types';

interface FriendProfileModalProps {
  friend: FriendData;
  currentUserId: string;
  onClose: () => void;
  onRemove: () => void;
  onPlanDinner: () => void;
}

interface FoodDnaData {
  favoriteCuisines: string[];
  restrictions: string[];
  allergies: string[];
}

export function FriendProfileModal({
  friend,
  currentUserId,
  onClose,
  onRemove,
  onPlanDinner
}: FriendProfileModalProps) {
  const [foodDna, setFoodDna] = useState<FoodDnaData | null>(null);
  const [sharedPrefs, setSharedPrefs] = useState<string[]>([]);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const { getFriendFoodDna, getUserCuisines } = useFriends(currentUserId);

  useEffect(() => {
    const loadFoodDna = async () => {
      if (!friend.profile.shareFoodDna) {
        setLoading(false);
        return;
      }

      const dna = await getFriendFoodDna(friend.friendId);
      setFoodDna(dna);

      const myCuisineTypes = await getUserCuisines(currentUserId);
      const shared = dna.favoriteCuisines.filter(c => myCuisineTypes.includes(c));
      setSharedPrefs(shared);

      setLoading(false);
    };

    loadFoodDna();
  }, [friend.friendId, friend.profile.shareFoodDna, currentUserId, getFriendFoodDna, getUserCuisines]);

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-nm-surface-lowest rounded-[2rem] rounded-b-none max-h-[85vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-nm-surface-lowest px-8 pt-5 pb-4 rounded-t-[2rem]">
          <div className="w-10 h-1 bg-nm-surface-high rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-nm-text">Friend Profile</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-nm-surface transition-colors"
            >
              <X className="w-5 h-5 text-nm-text/40" />
            </button>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-nm-signature to-nm-signature-light flex items-center justify-center text-white font-bold text-2xl mb-3">
              {friend.profile.avatarUrl ? (
                <img src={friend.profile.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                getInitials(friend.profile.displayName)
              )}
            </div>
            <h3 className="text-xl font-bold text-nm-text">{friend.profile.displayName}</h3>
            {friend.profile.username && (
              <p className="text-nm-text/60">@{friend.profile.username}</p>
            )}
          </div>

          {friend.profile.shareFoodDna ? (
            loading ? (
              <div className="text-center text-nm-text/40 py-4">Loading Food DNA...</div>
            ) : (
              <div className="space-y-4">
                {sharedPrefs.length > 0 && (
                  <div className="bg-nm-signature/10 rounded-[2rem] p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Heart className="w-5 h-5 text-nm-signature" />
                      <span className="font-bold text-nm-text">You both love</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sharedPrefs.map(pref => (
                        <span
                          key={pref}
                          className="px-3 py-1.5 bg-nm-surface-lowest rounded-full text-sm font-bold text-nm-signature"
                        >
                          {pref}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {foodDna && foodDna.favoriteCuisines.length > 0 && (
                  <div className="bg-nm-surface rounded-[2rem] p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Utensils className="w-5 h-5 text-nm-signature" />
                      <span className="font-bold text-nm-text">Favorite Cuisines</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {foodDna.favoriteCuisines.map(cuisine => (
                        <span
                          key={cuisine}
                          className="px-3 py-1.5 bg-nm-surface-high rounded-full text-sm font-bold text-nm-text"
                        >
                          {cuisine}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {foodDna && (foodDna.allergies.length > 0 || foodDna.restrictions.length > 0) && (
                  <div className="bg-nm-accent/10 rounded-[2rem] p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-5 h-5 text-nm-accent" />
                      <span className="font-bold text-nm-text">Dietary Restrictions</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {foodDna.allergies.map(allergy => (
                        <span
                          key={allergy}
                          className="px-3 py-1.5 bg-nm-signature/10 rounded-full text-sm font-bold text-nm-signature"
                        >
                          {allergy} (Allergy)
                        </span>
                      ))}
                      {foodDna.restrictions.map(restriction => (
                        <span
                          key={restriction}
                          className="px-3 py-1.5 bg-nm-accent/20 rounded-full text-sm font-bold text-nm-accent"
                        >
                          {restriction}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="bg-nm-surface rounded-[2rem] p-8 text-center">
              <div className="w-12 h-12 bg-nm-surface-high rounded-full flex items-center justify-center mx-auto mb-3">
                <Utensils className="w-6 h-6 text-nm-text/30" />
              </div>
              <p className="font-bold text-nm-text">Food DNA is private</p>
              <p className="text-nm-text/60 text-sm mt-1">
                This friend hasn't shared their food preferences
              </p>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              onClick={onPlanDinner}
              className="w-full py-3.5 bg-gradient-to-br from-nm-signature to-nm-signature-light text-white font-bold rounded-full shadow-nm-float transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Calendar className="w-5 h-5" />
              Plan Dinner Together
            </button>

            {showRemoveConfirm ? (
              <div className="bg-nm-signature/10 rounded-[2rem] p-5">
                <p className="text-nm-signature font-bold text-center mb-3">
                  Remove {friend.profile.displayName} as a friend?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRemoveConfirm(false)}
                    className="flex-1 py-3 bg-nm-surface text-nm-text font-bold rounded-full hover:bg-nm-surface-high transition-colors active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onRemove}
                    className="flex-1 py-3 bg-nm-signature text-white font-bold rounded-full hover:opacity-90 transition-opacity active:scale-95"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowRemoveConfirm(true)}
                className="w-full py-3.5 text-nm-text font-bold rounded-full hover:bg-nm-surface transition-colors flex items-center justify-center gap-2 active:scale-95"
              >
                <Trash2 className="w-5 h-5" />
                Remove Friend
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
