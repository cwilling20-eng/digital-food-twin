import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Search, QrCode, Check, X, Users,
  ChevronRight, Share2, Camera
} from 'lucide-react';
import { useFriends } from '../../hooks/useFriends';
import { usePublicProfile } from '../../hooks/usePublicProfile';
import type { Screen, PublicProfile, FriendData } from '../../types';
import { FriendProfileModal } from './FriendProfileModal';
import { QRCodeModal } from './QRCodeModal';
import { ProfileSetupModal } from './ProfileSetupModal';

interface FriendsScreenProps {
  userId: string;
  onNavigate: (screen: Screen) => void;
  onPlanDinner: (friendIds: string[], friendNames: string[]) => void;
}

interface SearchResult {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  alreadyFriend: boolean;
  pendingRequest: boolean;
}

export function FriendsScreen({ userId, onNavigate, onPlanDinner }: FriendsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<FriendData | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'qr'>('search');

  const {
    friends, incomingRequests, outgoingRequests, loading,
    loadFriends,
    searchUsers: hookSearchUsers,
    sendFriendRequest: hookSendRequest,
    handleRequest: hookHandleRequest,
    removeFriend: hookRemoveFriend,
  } = useFriends(userId);

  const { publicProfile: userProfile, loadProfile: loadUserProfile } = usePublicProfile(userId);

  useEffect(() => {
    loadUserProfile();
    loadFriends();
  }, [loadUserProfile, loadFriends]);

  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);

    const friendSet = new Set(friends.map(f => f.friendId));
    const pendingSet = new Set([
      ...outgoingRequests.map(r => r.friendId),
      ...incomingRequests.map(r => r.friendId)
    ]);

    const results = await hookSearchUsers(query, friendSet, pendingSet);
    setSearchResults(results);
    setSearching(false);
  }, [friends, outgoingRequests, incomingRequests, hookSearchUsers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);

  const sendFriendRequest = async (friendId: string) => {
    if (!userProfile?.username) {
      setShowProfileSetup(true);
      return;
    }

    await hookSendRequest(friendId);
    loadFriends();
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRequest = async (requestId: string, accept: boolean) => {
    await hookHandleRequest(requestId, accept);
    loadFriends();
  };

  const removeFriend = async (_friendId: string, recordId: string) => {
    await hookRemoveFriend(recordId);
    setSelectedFriend(null);
    loadFriends();
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleAddFriend = () => {
    if (!userProfile?.username) {
      setShowProfileSetup(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white sticky top-0 z-10 border-b border-gray-100">
        <div className="px-4 pt-12 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('dashboard')}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">My Dining Buddies</h1>
              <p className="text-sm text-gray-500">
                {friends.length} friend{friends.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'search'
                  ? 'text-emerald-600 border-b-2 border-emerald-500 -mb-px bg-emerald-50/50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Search className="w-4 h-4" />
                Search
              </div>
            </button>
            <button
              onClick={() => { setActiveTab('qr'); handleAddFriend(); }}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'qr'
                  ? 'text-emerald-600 border-b-2 border-emerald-500 -mb-px bg-emerald-50/50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <QrCode className="w-4 h-4" />
                QR Code
              </div>
            </button>
          </div>

          {activeTab === 'search' && (
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by username or name..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                />
              </div>

              {searching && (
                <div className="mt-4 text-center text-gray-500 text-sm">Searching...</div>
              )}

              {searchResults.length > 0 && (
                <div className="mt-4 space-y-2">
                  {searchResults.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-medium text-sm">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            getInitials(user.display_name)
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.display_name}</p>
                          {user.username && (
                            <p className="text-sm text-gray-500">@{user.username}</p>
                          )}
                        </div>
                      </div>
                      {user.alreadyFriend ? (
                        <span className="text-sm text-emerald-600 font-medium">Friends</span>
                      ) : user.pendingRequest ? (
                        <span className="text-sm text-amber-600 font-medium">Pending</span>
                      ) : (
                        <button
                          onClick={() => sendFriendRequest(user.id)}
                          className="px-3 py-1.5 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
                <div className="mt-4 text-center text-gray-500 text-sm">
                  No users found matching "{searchQuery}"
                </div>
              )}
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowQR(true)}
                  className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 hover:border-emerald-200 transition-colors"
                >
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Share2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-emerald-900">Share My Code</span>
                </button>
                <button
                  onClick={() => setShowQR(true)}
                  className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100 hover:border-blue-200 transition-colors"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Camera className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-blue-900">Scan Code</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {incomingRequests.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-3 px-1">Friend Requests</h2>
            <div className="space-y-2">
              {incomingRequests.map(request => (
                <div
                  key={request.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-medium">
                        {request.profile.avatarUrl ? (
                          <img src={request.profile.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          getInitials(request.profile.displayName)
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{request.profile.displayName}</p>
                        {request.profile.username && (
                          <p className="text-sm text-gray-500">@{request.profile.username}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRequest(request.id, true)}
                        className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center hover:bg-emerald-200 transition-colors"
                      >
                        <Check className="w-5 h-5 text-emerald-600" />
                      </button>
                      <button
                        onClick={() => handleRequest(request.id, false)}
                        className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {outgoingRequests.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-3 px-1">Pending Requests</h2>
            <div className="space-y-2">
              {outgoingRequests.map(request => (
                <div
                  key={request.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-medium">
                        {request.profile.avatarUrl ? (
                          <img src={request.profile.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          getInitials(request.profile.displayName)
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{request.profile.displayName}</p>
                        {request.profile.username && (
                          <p className="text-sm text-gray-500">@{request.profile.username}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-amber-600 font-medium px-3 py-1 bg-amber-50 rounded-full">
                      Pending...
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="font-semibold text-gray-900 mb-3 px-1">Friends</h2>
          {loading ? (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : friends.length === 0 ? (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">No friends yet</h3>
              <p className="text-sm text-gray-500">Search for users or share your QR code to connect!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map(friend => (
                <button
                  key={friend.id}
                  onClick={() => setSelectedFriend(friend)}
                  className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left hover:border-emerald-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-medium">
                        {friend.profile.avatarUrl ? (
                          <img src={friend.profile.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          getInitials(friend.profile.displayName)
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{friend.profile.displayName}</p>
                        <div className="flex items-center gap-2">
                          {friend.profile.username && (
                            <span className="text-sm text-gray-500">@{friend.profile.username}</span>
                          )}
                          {friend.profile.shareFoodDna && (
                            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                              DNA Shared
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedFriend && (
        <FriendProfileModal
          friend={selectedFriend}
          currentUserId={userId}
          onClose={() => setSelectedFriend(null)}
          onRemove={() => removeFriend(selectedFriend.friendId, selectedFriend.id)}
          onPlanDinner={() => {
            const friendName = selectedFriend.profile.displayName || 'Friend';
            setSelectedFriend(null);
            onPlanDinner([selectedFriend.friendId], [friendName]);
          }}
        />
      )}

      {showQR && userProfile && (
        <QRCodeModal
          userId={userId}
          username={userProfile.username}
          displayName={userProfile.displayName}
          onClose={() => setShowQR(false)}
          onFriendAdded={() => {
            setShowQR(false);
            loadFriends();
          }}
        />
      )}

      {showProfileSetup && (
        <ProfileSetupModal
          userId={userId}
          currentProfile={userProfile}
          onClose={() => setShowProfileSetup(false)}
          onSave={() => {
            setShowProfileSetup(false);
            loadUserProfile();
          }}
        />
      )}
    </div>
  );
}
