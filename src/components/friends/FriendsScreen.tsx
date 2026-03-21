import { useState, useEffect, useCallback } from 'react';
import { Users, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { useFriends } from '../../hooks/useFriends';
import { usePublicProfile } from '../../hooks/usePublicProfile';
import type { Screen, FriendData } from '../../types';
import { FriendProfileModal } from './FriendProfileModal';
import { QRCodeModal } from './QRCodeModal';
import { ProfileSetupModal } from './ProfileSetupModal';
import { FriendsListModal } from './FriendsListModal';
import {
  MOCK_STORIES, MOCK_DINING_SIGNALS, MOCK_POSTS,
  type MockStory, type MockPost, type MockDiningSignal,
} from '../../data/mockSocialFeed';

interface FriendsScreenProps {
  userId: string;
  onNavigate: (screen: Screen) => void;
  onPlanDinner: (friendIds: string[], friendNames: string[]) => void;
}

export function FriendsScreen({ userId, onNavigate, onPlanDinner }: FriendsScreenProps) {
  const [showFriendsList, setShowFriendsList] = useState(false);
  const [selectedStory, setSelectedStory] = useState<MockStory | null>(null);
  const [downToEat, setDownToEat] = useState(false);
  const [showDownToEat, setShowDownToEat] = useState(true);
  const [shareToast, setShareToast] = useState(false);

  const {
    friends, loading, loadFriends,
    searchUsers: hookSearchUsers,
    sendFriendRequest: hookSendRequest,
    handleRequest: hookHandleRequest,
    removeFriend: hookRemoveFriend,
    incomingRequests, outgoingRequests,
  } = useFriends(userId);

  const { publicProfile: userProfile, loadProfile: loadUserProfile } = usePublicProfile(userId);

  useEffect(() => {
    loadUserProfile();
    loadFriends();
  }, [loadUserProfile, loadFriends]);

  return (
    <div className="min-h-screen bg-nm-bg pb-40">
      {/* Header */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-nm-text tracking-tight">Dining Buddies</h1>
          <p className="text-sm text-nm-text/60 font-medium mt-1">See what your flavor circle is devouring today</p>
        </div>
        <button
          onClick={() => setShowFriendsList(true)}
          className="w-11 h-11 rounded-full bg-nm-surface flex items-center justify-center hover:bg-nm-surface-high transition-colors"
        >
          <Users className="w-5 h-5 text-nm-text/60" />
        </button>
      </div>

      {/* A. Stories Row */}
      <div className="px-4 py-4">
        <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {MOCK_STORIES.map(story => (
            <button
              key={story.id}
              onClick={() => story.id !== 'you' && setSelectedStory(story)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0"
            >
              <div className={`w-16 h-16 rounded-full p-0.5 ${
                story.id === 'you'
                  ? 'bg-nm-surface-high'
                  : story.hasNewStory
                    ? 'bg-gradient-to-br from-nm-signature to-nm-accent'
                    : 'bg-nm-surface-high'
              }`}>
                <div className={`w-full h-full rounded-full bg-gradient-to-br ${story.avatarGradient} flex items-center justify-center text-white font-bold text-sm border-2 border-nm-bg`}>
                  {story.id === 'you' ? (
                    <span className="material-symbols-outlined text-nm-text/40 text-xl">add</span>
                  ) : (
                    story.avatarInitials
                  )}
                </div>
              </div>
              <span className="text-[10px] font-bold text-nm-text/60 truncate max-w-[64px]">{story.userName}</span>
            </button>
          ))}
        </div>
      </div>

      {/* B. Down to Eat */}
      <div className="px-6 mb-6">
        <button
          onClick={() => setShowDownToEat(prev => !prev)}
          className="flex items-center justify-between w-full mb-3"
        >
          <div className="flex items-center gap-2">
            <span className="text-nm-label-md text-nm-text/60 uppercase tracking-widest">Down to eat</span>
            <span className="text-nm-label-md text-nm-success font-bold">{MOCK_DINING_SIGNALS.length}</span>
          </div>
          {showDownToEat ? <ChevronUp className="w-4 h-4 text-nm-text/30" /> : <ChevronDown className="w-4 h-4 text-nm-text/30" />}
        </button>

        {showDownToEat && (
          <div className="space-y-3">
            {/* Current user toggle */}
            <button
              onClick={() => setDownToEat(prev => !prev)}
              className={`w-full py-3 px-5 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                downToEat
                  ? 'bg-nm-success text-white'
                  : 'bg-nm-surface-high text-nm-text'
              }`}
            >
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
              {downToEat ? "You're down to eat!" : "I'm down to eat"}
            </button>

            {/* Friends who are down */}
            {MOCK_DINING_SIGNALS.map(signal => (
              <div key={signal.id} className="flex items-center justify-between bg-nm-surface rounded-[2rem] p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${signal.avatarGradient} flex items-center justify-center text-white font-bold text-xs`}>
                    {signal.avatarInitials}
                  </div>
                  <div>
                    <p className="font-bold text-nm-text text-sm">{signal.userName}</p>
                    <p className="text-nm-label-md text-nm-text/40">{signal.activatedAgo}</p>
                  </div>
                </div>
                <span className="text-nm-label-md font-bold text-nm-success bg-nm-success/10 px-3 py-1 rounded-full">
                  Down to eat
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* D. Group Dinner CTA */}
      <div className="px-6 mb-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-nm-signature to-nm-signature-light p-8 text-white shadow-[0_30px_60px_-12px_rgba(255,107,107,0.3)]">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2 tracking-tight">Plan a group dinner</h2>
            <p className="text-white/80 mb-5 font-medium">Coordinate with your matches seamlessly.</p>
            <div className="flex items-center -space-x-3 mb-6">
              {MOCK_STORIES.slice(1, 4).map(s => (
                <div key={s.id} className={`w-10 h-10 rounded-full border-3 border-nm-signature bg-gradient-to-br ${s.avatarGradient} flex items-center justify-center text-white font-bold text-xs`}>
                  {s.avatarInitials}
                </div>
              ))}
              <div className="w-10 h-10 rounded-full border-3 border-nm-signature bg-white/20 backdrop-blur-sm flex items-center justify-center text-sm font-bold">
                +{Math.max(0, friends.length - 3)}
              </div>
            </div>
            <button
              onClick={() => onPlanDinner([], [])}
              className="bg-white text-nm-signature px-6 py-3 rounded-full font-bold hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              Find the Perfect Spot
            </button>
          </div>
          <div className="absolute -right-8 -top-8 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-nm-accent/20 rounded-full blur-2xl" />
        </div>
      </div>

      {/* C. Activity Feed */}
      <div className="px-6 space-y-8">
        {MOCK_POSTS.map(post => (
          <FeedPost key={post.id} post={post} onShareToast={() => { setShareToast(true); setTimeout(() => setShareToast(false), 2500); }} />
        ))}
      </div>

      {/* Story overlay */}
      {selectedStory && (
        <StoryOverlay story={selectedStory} onClose={() => setSelectedStory(null)} />
      )}

      {/* Friends list modal */}
      {showFriendsList && (
        <FriendsListModal
          userId={userId}
          friends={friends}
          incomingRequests={incomingRequests}
          outgoingRequests={outgoingRequests}
          loading={loading}
          userProfile={userProfile}
          onClose={() => setShowFriendsList(false)}
          onSearch={hookSearchUsers}
          onSendRequest={hookSendRequest}
          onHandleRequest={hookHandleRequest}
          onRemoveFriend={hookRemoveFriend}
          onLoadFriends={loadFriends}
          onLoadUserProfile={loadUserProfile}
          onPlanDinner={onPlanDinner}
        />
      )}

      {/* Share toast */}
      {shareToast && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-nm-text text-white px-6 py-3 rounded-full shadow-nm-float z-50 flex items-center gap-2 animate-fade-in">
          <span className="text-sm font-bold">Sharing to feed coming soon!</span>
        </div>
      )}
    </div>
  );
}

// ── Feed Post Card ──
function FeedPost({ post, onShareToast }: { post: MockPost; onShareToast: () => void }) {
  if (post.type === 'achievement') {
    return (
      <article className="bg-nm-success/10 rounded-[2rem] p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${post.avatarGradient} flex items-center justify-center text-white font-bold text-xs`}>
            {post.avatarInitials}
          </div>
          <span className="text-nm-label-md text-nm-text/40 uppercase tracking-widest">{post.timestamp}</span>
        </div>
        <p className="text-lg font-bold text-nm-text">{post.achievementText}</p>
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-nm-success/20 rounded-full">
          <span className="material-symbols-outlined text-nm-success text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
          <span className="text-nm-label-md font-bold text-nm-success">Achievement</span>
        </div>
      </article>
    );
  }

  if (post.type === 'discovery') {
    return (
      <article className="bg-nm-surface-lowest rounded-[2rem] p-6 shadow-nm-float">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${post.avatarGradient} flex items-center justify-center text-white font-bold text-xs`}>
            {post.avatarInitials}
          </div>
          <div className="flex-1">
            <p className="font-bold text-nm-text text-sm">{post.userName}</p>
            <p className="text-nm-label-md text-nm-text/40 uppercase tracking-widest">{post.timestamp}</p>
          </div>
        </div>
        <p className="text-nm-text font-medium mb-3">
          {post.userName} just dined at <span className="font-bold">{post.restaurantName}</span>
        </p>
        {post.dishName && <p className="text-sm text-nm-text/60 mb-3">{post.dishName}</p>}
        <div className="flex items-center gap-2">
          <span className="bg-nm-signature/10 text-nm-signature rounded-full px-3 py-1 text-xs font-bold">
            {post.discoveryMatch}% DNA match
          </span>
          <button onClick={onShareToast} className="text-nm-signature text-sm font-bold hover:opacity-80">
            Try this spot
          </button>
        </div>
      </article>
    );
  }

  // Meal post or recommendation
  return (
    <article className="group">
      {/* Post header — Stitch: flex items-center justify-between mb-4 px-2 */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${post.avatarGradient} flex items-center justify-center text-white font-bold text-sm`}>
            {post.avatarInitials}
          </div>
          <div>
            <h3 className="font-bold text-lg text-nm-text">{post.userName}</h3>
            <p className="text-nm-label-md text-nm-text/40 uppercase tracking-widest">{post.timestamp}</p>
          </div>
        </div>
        {post.dnaMatch && (
          <div className="bg-nm-signature/10 px-4 py-2 rounded-full flex items-center gap-1.5">
            <span className="material-symbols-outlined text-nm-signature text-sm" style={{ fontVariationSettings: "'FILL' 1, 'wght' 700" }}>genetics</span>
            <span className="text-nm-signature font-black text-sm">{post.dnaMatch}%</span>
          </div>
        )}
      </div>

      {/* Post body — Stitch: bg-[#FFF0E5] rounded-xl p-3 */}
      <div className="bg-nm-surface rounded-[2rem] p-3 shadow-sm group-hover:shadow-md transition-shadow">
        {/* Food image area */}
        <div className="relative aspect-square rounded-[1.5rem] overflow-hidden mb-5 bg-nm-surface-high">
          {post.imageUrl ? (
            <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src={post.imageUrl} alt={post.dishName || ''} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-6xl text-nm-text/10">restaurant</span>
            </div>
          )}
          {/* Dish info overlay — Stitch: absolute bottom-4 left-4 right-4 bg-white/80 backdrop-blur-xl */}
          {post.dishName && (
            <div className="absolute bottom-4 left-4 right-4 bg-white/80 backdrop-blur-xl p-4 rounded-[1rem] shadow-lg">
              <h4 className="text-lg font-bold text-nm-text">{post.dishName}</h4>
              {post.restaurantName && (
                <p className="text-nm-signature font-bold text-sm flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-sm">restaurant</span>
                  {post.restaurantName}
                </p>
              )}
            </div>
          )}
          {/* NomMigo picked badge */}
          {post.recommendationSource && (
            <div className="absolute top-3 left-3 bg-nm-text text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              {post.recommendationSource}
            </div>
          )}
        </div>

        {/* Caption + reactions */}
        <div className="px-4 pb-4">
          {post.caption && (
            <p className="text-nm-text leading-relaxed font-medium mb-5">{post.caption}</p>
          )}
          {/* Stitch: flex items-center justify-between border-t ... pt-4 */}
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-5">
              <button className="flex items-center gap-1.5 group/btn">
                <span className="material-symbols-outlined text-nm-signature group-hover/btn:scale-125 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>mood</span>
                <span className="font-bold text-sm text-nm-text">{post.reactions || 0}</span>
              </button>
              <button className="flex items-center gap-1.5 group/btn">
                <span className="material-symbols-outlined text-nm-text/30 group-hover/btn:text-nm-text/60 transition-colors">chat_bubble</span>
                <span className="font-bold text-sm text-nm-text">{post.comments || 0}</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onShareToast} className="text-nm-signature text-sm font-bold hover:opacity-80">
                Try This
              </button>
              <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-nm-surface-high transition-colors">
                <span className="material-symbols-outlined text-nm-text/30">bookmark</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

// ── Story Overlay ──
function StoryOverlay({ story, onClose }: { story: MockStory; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-nm-text flex flex-col" onClick={onClose}>
      <div className="flex items-center gap-3 px-6 pt-12 pb-4">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${story.avatarGradient} flex items-center justify-center text-white font-bold text-xs border-2 border-white/30`}>
          {story.avatarInitials}
        </div>
        <div>
          <p className="font-bold text-white text-sm">{story.userName}</p>
          <p className="text-white/40 text-xs">Just now</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full aspect-[3/4] bg-white/5 rounded-[2rem] flex items-center justify-center">
          <span className="material-symbols-outlined text-white/20 text-8xl">restaurant</span>
        </div>
      </div>
      {(story.restaurantName || story.dishName) && (
        <div className="px-6 pb-12">
          <div className="bg-white/10 backdrop-blur-xl rounded-[1.5rem] p-5">
            {story.dishName && <p className="font-bold text-white text-lg">{story.dishName}</p>}
            {story.restaurantName && (
              <p className="text-nm-signature font-bold text-sm mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">restaurant</span>
                {story.restaurantName}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
