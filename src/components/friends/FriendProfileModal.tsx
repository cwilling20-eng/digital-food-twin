import { useState, useEffect } from 'react';
import { X, Heart, AlertTriangle, Utensils, Trash2, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
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

  useEffect(() => {
    const loadFoodDna = async () => {
      if (!friend.profile.shareFoodDna) {
        setLoading(false);
        return;
      }

      const [cuisineRes, constraintsRes] = await Promise.all([
        supabase
          .from('user_cuisine_preferences')
          .select('cuisine_type')
          .eq('user_id', friend.friendId),
        supabase
          .from('user_dietary_constraints')
          .select('allergies, restrictions')
          .eq('user_id', friend.friendId)
          .maybeSingle()
      ]);

      const favoriteCuisines = cuisineRes.data?.map(c => c.cuisine_type) || [];
      const constraints = constraintsRes.data;

      setFoodDna({
        favoriteCuisines,
        restrictions: constraints?.restrictions || [],
        allergies: constraints?.allergies || []
      });

      const { data: myConstraints } = await supabase
        .from('user_dietary_constraints')
        .select('restrictions')
        .eq('user_id', currentUserId)
        .maybeSingle();

      const { data: myCuisines } = await supabase
        .from('user_cuisine_preferences')
        .select('cuisine_type')
        .eq('user_id', currentUserId);

      const myCuisineTypes = myCuisines?.map(c => c.cuisine_type) || [];
      const shared = favoriteCuisines.filter(c => myCuisineTypes.includes(c));
      setSharedPrefs(shared);

      setLoading(false);
    };

    loadFoodDna();
  }, [friend.friendId, friend.profile.shareFoodDna, currentUserId]);

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-white px-6 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Friend Profile</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-2xl mb-3">
              {friend.profile.avatarUrl ? (
                <img src={friend.profile.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                getInitials(friend.profile.displayName)
              )}
            </div>
            <h3 className="text-xl font-bold text-gray-900">{friend.profile.displayName}</h3>
            {friend.profile.username && (
              <p className="text-gray-500">@{friend.profile.username}</p>
            )}
          </div>

          {friend.profile.shareFoodDna ? (
            loading ? (
              <div className="text-center text-gray-500 py-4">Loading Food DNA...</div>
            ) : (
              <div className="space-y-4">
                {sharedPrefs.length > 0 && (
                  <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="w-5 h-5 text-pink-500" />
                      <span className="font-semibold text-pink-900">You both love</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sharedPrefs.map(pref => (
                        <span
                          key={pref}
                          className="px-3 py-1 bg-white/80 rounded-full text-sm font-medium text-pink-700"
                        >
                          {pref}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {foodDna && foodDna.favoriteCuisines.length > 0 && (
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Utensils className="w-5 h-5 text-emerald-500" />
                      <span className="font-semibold text-gray-900">Favorite Cuisines</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {foodDna.favoriteCuisines.map(cuisine => (
                        <span
                          key={cuisine}
                          className="px-3 py-1 bg-emerald-50 rounded-full text-sm font-medium text-emerald-700"
                        >
                          {cuisine}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {foodDna && (foodDna.allergies.length > 0 || foodDna.restrictions.length > 0) && (
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      <span className="font-semibold text-amber-900">Dietary Restrictions</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {foodDna.allergies.map(allergy => (
                        <span
                          key={allergy}
                          className="px-3 py-1 bg-red-100 rounded-full text-sm font-medium text-red-700"
                        >
                          {allergy} (Allergy)
                        </span>
                      ))}
                      {foodDna.restrictions.map(restriction => (
                        <span
                          key={restriction}
                          className="px-3 py-1 bg-amber-100 rounded-full text-sm font-medium text-amber-700"
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
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                <Utensils className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">Food DNA is private</p>
              <p className="text-gray-500 text-sm mt-1">
                This friend hasn't shared their food preferences
              </p>
            </div>
          )}

          <div className="space-y-3 pt-4">
            <button
              onClick={onPlanDinner}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Plan Dinner Together
            </button>

            {showRemoveConfirm ? (
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <p className="text-red-800 font-medium text-center mb-3">
                  Remove {friend.profile.displayName} as a friend?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowRemoveConfirm(false)}
                    className="flex-1 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onRemove}
                    className="flex-1 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowRemoveConfirm(true)}
                className="w-full py-3 text-red-600 font-medium rounded-xl border border-red-200 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
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
