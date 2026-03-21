/**
 * FriendsListModal — The original friend management UI (search, QR, requests, friend list)
 * extracted into a modal. Opened from the social feed header's Users icon button.
 */

import { useState, useCallback, useEffect } from 'react';
import { X, Search, QrCode, Check, Users, ChevronRight, Share2, Camera } from 'lucide-react';
import type { FriendData, PublicProfile } from '../../types';
import { FriendProfileModal } from './FriendProfileModal';
import { QRCodeModal } from './QRCodeModal';
import { ProfileSetupModal } from './ProfileSetupModal';

interface FriendRequest {
  id: string;
  friendId: string;
  profile: {
    displayName: string;
    username: string | null;
    avatarUrl: string | null;
    shareFoodDna?: boolean;
  };
}

interface FriendsListModalProps {
  userId: string;
  friends: FriendData[];
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  loading: boolean;
  userProfile: PublicProfile | null;
  onClose: () => void;
  onSearch: (query: string, friendSet: Set<string>, pendingSet: Set<string>) => Promise<any[]>;
  onSendRequest: (friendId: string) => Promise<void>;
  onHandleRequest: (requestId: string, accept: boolean) => Promise<void>;
  onRemoveFriend: (recordId: string) => Promise<void>;
  onLoadFriends: () => void;
  onLoadUserProfile: () => void;
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

export function FriendsListModal({
  userId, friends, incomingRequests, outgoingRequests, loading, userProfile,
  onClose, onSearch, onSendRequest, onHandleRequest, onRemoveFriend,
  onLoadFriends, onLoadUserProfile, onPlanDinner,
}: FriendsListModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<FriendData | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'qr'>('search');

  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const friendSet = new Set(friends.map(f => f.friendId));
    const pendingSet = new Set([
      ...outgoingRequests.map(r => r.friendId),
      ...incomingRequests.map(r => r.friendId)
    ]);
    const results = await onSearch(query, friendSet, pendingSet);
    setSearchResults(results);
    setSearching(false);
  }, [friends, outgoingRequests, incomingRequests, onSearch]);

  useEffect(() => {
    const timer = setTimeout(() => searchUsers(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);

  const sendFriendRequest = async (friendId: string) => {
    if (!userProfile?.username) { setShowProfileSetup(true); return; }
    await onSendRequest(friendId);
    onLoadFriends();
    setSearchQuery('');
    setSearchResults([]);
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-nm-surface-lowest rounded-[2rem] rounded-b-none max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-nm-surface-lowest px-8 pt-5 pb-4 rounded-t-[2rem] z-10">
          <div className="w-10 h-1 bg-nm-surface-high rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-nm-text">Friends</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-nm-surface transition-colors">
              <X className="w-5 h-5 text-nm-text/40" />
            </button>
          </div>
        </div>

        <div className="px-6 pb-8 space-y-5">
          {/* Search/QR toggle */}
          <div className="flex p-1.5 bg-nm-surface-high rounded-full">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'search' ? 'bg-nm-surface-lowest text-nm-text shadow-nm-float' : 'text-nm-text/60'
              }`}
            >
              <Search className="w-4 h-4" /> Search
            </button>
            <button
              onClick={() => { setActiveTab('qr'); if (!userProfile?.username) setShowProfileSetup(true); }}
              className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'qr' ? 'bg-nm-surface-lowest text-nm-text shadow-nm-float' : 'text-nm-text/60'
              }`}
            >
              <QrCode className="w-4 h-4" /> QR Code
            </button>
          </div>

          {activeTab === 'search' && (
            <div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-nm-text/30" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by username or name..."
                  className="w-full pl-12 pr-4 py-3.5 bg-nm-surface-high rounded-full text-nm-text placeholder:text-nm-text/30 focus:outline-none focus:bg-nm-surface-lowest focus:ring-2 focus:ring-nm-signature/40"
                />
              </div>
              {searching && <p className="text-center text-nm-text/40 text-sm mt-3">Searching...</p>}
              {searchResults.length > 0 && (
                <div className="mt-3 space-y-2">
                  {searchResults.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-nm-surface rounded-[2rem]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-nm-signature to-nm-signature-light flex items-center justify-center text-white font-bold text-sm">
                          {getInitials(user.display_name)}
                        </div>
                        <div>
                          <p className="font-bold text-nm-text">{user.display_name}</p>
                          {user.username && <p className="text-sm text-nm-text/60">@{user.username}</p>}
                        </div>
                      </div>
                      {user.alreadyFriend ? (
                        <span className="text-sm text-nm-success font-bold">Friends</span>
                      ) : user.pendingRequest ? (
                        <span className="text-sm text-nm-accent font-bold">Pending</span>
                      ) : (
                        <button onClick={() => sendFriendRequest(user.id)} className="px-4 py-2 bg-gradient-to-br from-nm-signature to-nm-signature-light text-white text-sm font-bold rounded-full active:scale-95">
                          Add
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowQR(true)} className="flex flex-col items-center gap-2 p-5 bg-nm-surface rounded-[2rem] active:scale-95">
                <div className="w-12 h-12 bg-nm-signature/10 rounded-full flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-nm-signature" />
                </div>
                <span className="text-sm font-bold text-nm-text">Share Code</span>
              </button>
              <button onClick={() => setShowQR(true)} className="flex flex-col items-center gap-2 p-5 bg-nm-surface rounded-[2rem] active:scale-95">
                <div className="w-12 h-12 bg-nm-success/10 rounded-full flex items-center justify-center">
                  <Camera className="w-6 h-6 text-nm-success" />
                </div>
                <span className="text-sm font-bold text-nm-text">Scan Code</span>
              </button>
            </div>
          )}

          {/* Incoming requests */}
          {incomingRequests.length > 0 && (
            <div>
              <h3 className="text-nm-label-md text-nm-text/60 uppercase tracking-widest mb-2">Requests</h3>
              <div className="space-y-2">
                {incomingRequests.map(req => (
                  <div key={req.id} className="flex items-center justify-between bg-nm-surface rounded-[2rem] p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-nm-signature to-nm-signature-light flex items-center justify-center text-white font-bold text-xs">
                        {getInitials(req.profile.displayName)}
                      </div>
                      <p className="font-bold text-nm-text text-sm">{req.profile.displayName}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { onHandleRequest(req.id, true); onLoadFriends(); }} className="w-9 h-9 bg-nm-success rounded-full flex items-center justify-center active:scale-95">
                        <Check className="w-4 h-4 text-white" />
                      </button>
                      <button onClick={() => { onHandleRequest(req.id, false); onLoadFriends(); }} className="w-9 h-9 bg-nm-surface-high rounded-full flex items-center justify-center active:scale-95">
                        <X className="w-4 h-4 text-nm-text/60" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friends list */}
          <div>
            <h3 className="text-nm-label-md text-nm-text/60 uppercase tracking-widest mb-2">
              {friends.length} Friend{friends.length !== 1 ? 's' : ''}
            </h3>
            {loading ? (
              <p className="text-center text-nm-text/40 py-4">Loading...</p>
            ) : friends.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-10 h-10 text-nm-text/20 mx-auto mb-3" />
                <p className="text-sm text-nm-text/40">No friends yet — search or share your QR code!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {friends.map(friend => (
                  <button key={friend.id} onClick={() => setSelectedFriend(friend)} className="w-full flex items-center justify-between bg-nm-surface rounded-[2rem] p-4 active:scale-[0.98]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-nm-signature to-nm-signature-light flex items-center justify-center text-white font-bold text-xs">
                        {getInitials(friend.profile.displayName)}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-nm-text text-sm">{friend.profile.displayName}</p>
                        {friend.profile.username && <p className="text-nm-label-md text-nm-text/40">@{friend.profile.username}</p>}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-nm-text/30" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedFriend && (
        <FriendProfileModal
          friend={selectedFriend}
          currentUserId={userId}
          onClose={() => setSelectedFriend(null)}
          onRemove={async () => { await onRemoveFriend(selectedFriend.id); setSelectedFriend(null); onLoadFriends(); }}
          onPlanDinner={() => {
            const name = selectedFriend.profile.displayName || 'Friend';
            setSelectedFriend(null);
            onClose();
            onPlanDinner([selectedFriend.friendId], [name]);
          }}
        />
      )}

      {showQR && userProfile && (
        <QRCodeModal
          userId={userId}
          username={userProfile.username}
          displayName={userProfile.displayName}
          onClose={() => setShowQR(false)}
          onFriendAdded={() => { setShowQR(false); onLoadFriends(); }}
        />
      )}

      {showProfileSetup && (
        <ProfileSetupModal
          userId={userId}
          currentProfile={userProfile}
          onClose={() => setShowProfileSetup(false)}
          onSave={() => { setShowProfileSetup(false); onLoadUserProfile(); }}
        />
      )}
    </div>
  );
}
