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
    <div className="min-h-screen bg-nm-bg pb-24">
      {/* Header */}
      <div className="bg-nm-bg/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="px-6 pt-12 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('dashboard')}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-nm-surface transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-nm-text" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-nm-text tracking-tight">Dining Buddies</h1>
              <p className="text-sm text-nm-text/60">
                {friends.length} friend{friends.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 space-y-6">
        {/* Plan a group dinner CTA */}
        <div className="bg-gradient-to-br from-nm-signature to-nm-signature-light rounded-[2rem] p-8 text-white shadow-nm-float">
          <h2 className="text-2xl font-bold tracking-tight mb-2">Plan a group dinner</h2>
          <p className="text-white/80 mb-5 font-medium">Coordinate with your matches seamlessly.</p>
          <button
            className="bg-white text-nm-signature px-6 py-3 rounded-full font-bold hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            Find the Perfect Spot
          </button>
        </div>

        {/* Search/QR toggle */}
        <div className="bg-nm-surface-lowest rounded-[2rem] shadow-nm-float overflow-hidden">
          <div className="flex p-1.5 bg-nm-surface-high rounded-full mx-5 mt-5 mb-4">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'search'
                  ? 'bg-nm-surface-lowest text-nm-text shadow-nm-float'
                  : 'text-nm-text/60 hover:text-nm-text'
              }`}
            >
              <Search className="w-4 h-4" />
              Search
            </button>
            <button
              onClick={() => { setActiveTab('qr'); handleAddFriend(); }}
              className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'qr'
                  ? 'bg-nm-surface-lowest text-nm-text shadow-nm-float'
                  : 'text-nm-text/60 hover:text-nm-text'
              }`}
            >
              <QrCode className="w-4 h-4" />
              QR Code
            </button>
          </div>

          {activeTab === 'search' && (
            <div className="px-5 pb-5">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-nm-text/30" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by username or name..."
                  className="w-full pl-12 pr-4 py-3.5 bg-nm-surface-high rounded-full text-nm-text placeholder:text-nm-text/30 focus:outline-none focus:bg-nm-surface-lowest focus:ring-2 focus:ring-nm-signature/40 transition-all"
                />
              </div>

              {searching && (
                <div className="mt-4 text-center text-nm-text/40 text-sm">Searching...</div>
              )}

              {searchResults.length > 0 && (
                <div className="mt-4 space-y-3">
                  {searchResults.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-nm-surface rounded-[2rem]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-nm-signature to-nm-signature-light flex items-center justify-center text-white font-bold text-sm">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            getInitials(user.display_name)
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-nm-text">{user.display_name}</p>
                          {user.username && (
                            <p className="text-sm text-nm-text/60">@{user.username}</p>
                          )}
                        </div>
                      </div>
                      {user.alreadyFriend ? (
                        <span className="text-sm text-nm-success font-bold">Friends</span>
                      ) : user.pendingRequest ? (
                        <span className="text-sm text-nm-accent font-bold">Pending</span>
                      ) : (
                        <button
                          onClick={() => sendFriendRequest(user.id)}
                          className="px-4 py-2 bg-gradient-to-br from-nm-signature to-nm-signature-light text-white text-sm font-bold rounded-full active:scale-95 transition-transform"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
                <div className="mt-4 text-center text-nm-text/40 text-sm">
                  No users found matching "{searchQuery}"
                </div>
              )}
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="px-5 pb-5">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowQR(true)}
                  className="flex flex-col items-center gap-2 p-5 bg-nm-surface rounded-[2rem] hover:bg-nm-surface-high transition-colors active:scale-95"
                >
                  <div className="w-12 h-12 bg-nm-signature/10 rounded-full flex items-center justify-center">
                    <Share2 className="w-6 h-6 text-nm-signature" />
                  </div>
                  <span className="text-sm font-bold text-nm-text">Share My Code</span>
                </button>
                <button
                  onClick={() => setShowQR(true)}
                  className="flex flex-col items-center gap-2 p-5 bg-nm-surface rounded-[2rem] hover:bg-nm-surface-high transition-colors active:scale-95"
                >
                  <div className="w-12 h-12 bg-nm-success/10 rounded-full flex items-center justify-center">
                    <Camera className="w-6 h-6 text-nm-success" />
                  </div>
                  <span className="text-sm font-bold text-nm-text">Scan Code</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Friend Requests */}
        {incomingRequests.length > 0 && (
          <div>
            <h2 className="text-nm-label-md text-nm-text/60 uppercase tracking-widest mb-3 px-1">Friend Requests</h2>
            <div className="space-y-3">
              {incomingRequests.map(request => (
                <div
                  key={request.id}
                  className="bg-nm-surface rounded-[2rem] p-5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-nm-signature to-nm-signature-light flex items-center justify-center text-white font-bold">
                        {request.profile.avatarUrl ? (
                          <img src={request.profile.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          getInitials(request.profile.displayName)
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-nm-text">{request.profile.displayName}</p>
                        {request.profile.username && (
                          <p className="text-sm text-nm-text/60">@{request.profile.username}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRequest(request.id, true)}
                        className="w-10 h-10 bg-nm-success rounded-full flex items-center justify-center hover:opacity-90 transition-opacity active:scale-95"
                      >
                        <Check className="w-5 h-5 text-white" />
                      </button>
                      <button
                        onClick={() => handleRequest(request.id, false)}
                        className="w-10 h-10 bg-nm-surface-high rounded-full flex items-center justify-center hover:bg-nm-surface-highest transition-colors active:scale-95"
                      >
                        <X className="w-5 h-5 text-nm-text/60" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Requests */}
        {outgoingRequests.length > 0 && (
          <div>
            <h2 className="text-nm-label-md text-nm-text/60 uppercase tracking-widest mb-3 px-1">Pending Requests</h2>
            <div className="space-y-3">
              {outgoingRequests.map(request => (
                <div
                  key={request.id}
                  className="bg-nm-surface rounded-[2rem] p-5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-nm-accent to-nm-signature flex items-center justify-center text-white font-bold">
                        {request.profile.avatarUrl ? (
                          <img src={request.profile.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          getInitials(request.profile.displayName)
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-nm-text">{request.profile.displayName}</p>
                        {request.profile.username && (
                          <p className="text-sm text-nm-text/60">@{request.profile.username}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-nm-label-md text-nm-accent font-bold px-3 py-1.5 bg-nm-accent/10 rounded-full">
                      Pending...
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div>
          <h2 className="text-nm-label-md text-nm-text/60 uppercase tracking-widest mb-3 px-1">Friends</h2>
          {loading ? (
            <div className="bg-nm-surface rounded-[2rem] p-8 text-center">
              <p className="text-nm-text/40">Loading...</p>
            </div>
          ) : friends.length === 0 ? (
            <div className="bg-nm-surface rounded-[2rem] p-8 text-center">
              <div className="w-16 h-16 bg-nm-surface-high rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-nm-text/30" />
              </div>
              <h3 className="font-bold text-nm-text mb-1">No friends yet</h3>
              <p className="text-sm text-nm-text/60">Search for users or share your QR code to connect!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {friends.map(friend => (
                <button
                  key={friend.id}
                  onClick={() => setSelectedFriend(friend)}
                  className="w-full bg-nm-surface rounded-[2rem] p-5 text-left hover:bg-nm-surface-high transition-colors active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-nm-signature to-nm-signature-light flex items-center justify-center text-white font-bold">
                        {friend.profile.avatarUrl ? (
                          <img src={friend.profile.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          getInitials(friend.profile.displayName)
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-nm-text">{friend.profile.displayName}</p>
                        <div className="flex items-center gap-2">
                          {friend.profile.username && (
                            <span className="text-sm text-nm-text/60">@{friend.profile.username}</span>
                          )}
                          {friend.profile.shareFoodDna && (
                            <span className="text-xs text-nm-signature bg-nm-signature/10 px-2.5 py-0.5 rounded-full font-bold">
                              DNA Shared
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-nm-text/30" />
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
