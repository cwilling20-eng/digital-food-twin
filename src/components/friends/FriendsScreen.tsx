import { useState, useEffect, useRef } from 'react';
import { Users, ChevronDown, ChevronUp, Plus, X, Loader2 } from 'lucide-react';
import { useFriends } from '../../hooks/useFriends';
import { usePublicProfile } from '../../hooks/usePublicProfile';
import { useSocialPosts, useSocialStories, useDiningSignals, type SocialPost, type SocialStory } from '../../hooks/useSocialFeed';
import { supabase } from '../../lib/supabase';
import type { Screen, FriendData } from '../../types';
import { FriendsListModal } from './FriendsListModal';

interface FriendsScreenProps {
  userId: string;
  onNavigate: (screen: Screen) => void;
  onPlanDinner: (friendIds: string[], friendNames: string[]) => void;
}

function getInitials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function FriendsScreen({ userId, onNavigate, onPlanDinner }: FriendsScreenProps) {
  const [showFriendsList, setShowFriendsList] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedStory, setSelectedStory] = useState<SocialStory | null>(null);
  const [showDownToEat, setShowDownToEat] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const { friends, loading: friendsLoading, loadFriends, searchUsers: hookSearchUsers, sendFriendRequest: hookSendRequest, handleRequest: hookHandleRequest, removeFriend: hookRemoveFriend, incomingRequests, outgoingRequests } = useFriends(userId);
  const { publicProfile: userProfile, loadProfile: loadUserProfile } = usePublicProfile(userId);
  const { posts, loading: postsLoading, fetchPosts, createPost, toggleReaction } = useSocialPosts(userId);
  const { stories, fetchStories, createStory } = useSocialStories(userId);
  const { signals, mySignalActive, fetchSignals, toggleMySignal } = useDiningSignals(userId);

  const storyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadUserProfile();
    loadFriends();
    fetchPosts();
    fetchStories();
    fetchSignals();
  }, [loadUserProfile, loadFriends, fetchPosts, fetchStories, fetchSignals]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Story upload
  const handleStoryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const ext = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
    const path = `${userId}/${Date.now()}.${ext}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('social-stories')
        .upload(path, file, { upsert: true });

      if (uploadError) {
        showToast('Story upload coming soon!');
        return;
      }

      const { data: urlData } = supabase.storage
        .from('social-stories')
        .getPublicUrl(path);

      await createStory({
        media_url: urlData?.publicUrl || null,
        media_type: isVideo ? 'video' : 'photo',
      });

      fetchStories();
      showToast('Story posted!');
    } catch {
      showToast('Story upload coming soon!');
    }

    if (storyInputRef.current) storyInputRef.current.value = '';
  };

  // Build story avatars from real friends + stories
  const friendStoryMap = new Map<string, SocialStory>();
  for (const s of stories) {
    if (!friendStoryMap.has(s.user_id)) friendStoryMap.set(s.user_id, s);
  }

  return (
    <div className="min-h-screen bg-nm-bg pb-40">
      {/* Header */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-nm-text tracking-tight">Dining Buddies</h1>
          <p className="text-sm text-nm-text/60 font-medium mt-1">See what your flavor circle is devouring today</p>
        </div>
        <button onClick={() => setShowFriendsList(true)} className="w-11 h-11 rounded-full bg-nm-surface flex items-center justify-center hover:bg-nm-surface-high transition-colors">
          <Users className="w-5 h-5 text-nm-text/60" />
        </button>
      </div>

      {/* A. Stories Row */}
      <div className="px-4 py-4">
        <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {/* Your Story */}
          <button onClick={() => storyInputRef.current?.click()} className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className="w-16 h-16 rounded-full p-0.5 bg-nm-surface-high">
              <div className="w-full h-full rounded-full bg-nm-surface-high flex items-center justify-center border-2 border-nm-bg">
                <span className="material-symbols-outlined text-nm-text/40 text-xl">add</span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-nm-text/60">Your Story</span>
          </button>
          <input ref={storyInputRef} type="file" accept="image/*,video/*" onChange={handleStoryUpload} className="hidden" />

          {/* Friend stories from real data */}
          {friends.map(friend => {
            const story = friendStoryMap.get(friend.friendId);
            const hasStory = !!story;
            return (
              <button
                key={friend.friendId}
                onClick={() => story && setSelectedStory(story)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0"
              >
                <div className={`w-16 h-16 rounded-full p-0.5 ${hasStory ? 'bg-gradient-to-br from-nm-signature to-nm-accent' : 'bg-nm-surface-high'}`}>
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-nm-signature to-nm-signature-light flex items-center justify-center text-white font-bold text-sm border-2 border-nm-bg">
                    {getInitials(friend.profile.displayName)}
                  </div>
                </div>
                <span className="text-[10px] font-bold text-nm-text/60 truncate max-w-[64px]">
                  {friend.profile.displayName?.split(' ')[0] || 'Friend'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* B. Down to Eat */}
      <div className="px-6 mb-6">
        <button onClick={() => setShowDownToEat(prev => !prev)} className="flex items-center justify-between w-full mb-3">
          <div className="flex items-center gap-2">
            <span className="text-nm-label-md text-nm-text/60 uppercase tracking-widest">Down to eat</span>
            <span className="text-nm-label-md text-nm-success font-bold">{signals.length}</span>
          </div>
          {showDownToEat ? <ChevronUp className="w-4 h-4 text-nm-text/30" /> : <ChevronDown className="w-4 h-4 text-nm-text/30" />}
        </button>

        {showDownToEat && (
          <div className="space-y-3">
            <button
              onClick={toggleMySignal}
              className={`w-full py-3 px-5 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                mySignalActive ? 'bg-nm-success text-white' : 'bg-nm-surface-high text-nm-text'
              }`}
            >
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
              {mySignalActive ? "You're down to eat!" : "I'm down to eat"}
            </button>

            {signals.map(signal => (
              <div key={signal.id} className="flex items-center justify-between bg-nm-surface rounded-[2rem] p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-nm-signature to-nm-signature-light flex items-center justify-center text-white font-bold text-xs">
                    {getInitials(signal.display_name)}
                  </div>
                  <div>
                    <p className="font-bold text-nm-text text-sm">{signal.display_name}</p>
                    <p className="text-nm-label-md text-nm-text/40">{timeAgo(signal.activated_at)}</p>
                  </div>
                </div>
                <span className="text-nm-label-md font-bold text-nm-success bg-nm-success/10 px-3 py-1 rounded-full">Down to eat</span>
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
              {friends.slice(0, 3).map(f => (
                <div key={f.friendId} className="w-10 h-10 rounded-full border-3 border-nm-signature bg-gradient-to-br from-nm-signature-light to-nm-accent flex items-center justify-center text-white font-bold text-xs">
                  {getInitials(f.profile.displayName)}
                </div>
              ))}
              {friends.length > 3 && (
                <div className="w-10 h-10 rounded-full border-3 border-nm-signature bg-white/20 backdrop-blur-sm flex items-center justify-center text-sm font-bold">
                  +{friends.length - 3}
                </div>
              )}
            </div>
            <button onClick={() => onPlanDinner([], [])} className="bg-white text-nm-signature px-6 py-3 rounded-full font-bold hover:scale-105 active:scale-95 transition-all shadow-lg">
              Find the Perfect Spot
            </button>
          </div>
          <div className="absolute -right-8 -top-8 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-nm-accent/20 rounded-full blur-2xl" />
        </div>
      </div>

      {/* C. Activity Feed */}
      <div className="px-6 space-y-8">
        {postsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-nm-signature animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl opacity-15 mb-4">🍽️</div>
            <p className="text-nm-text/50 text-base font-medium mb-1">Your feed is quiet...</p>
            <p className="text-nm-text/30 text-sm mb-4">Be the first to share a nom!</p>
            <button
              onClick={() => setShowCreatePost(true)}
              className="px-6 py-3 bg-gradient-to-br from-nm-signature to-nm-signature-light text-white font-bold rounded-full shadow-nm-float active:scale-95 transition-transform"
            >
              Create Post
            </button>
          </div>
        ) : (
          posts.map(post => (
            <FeedPostCard
              key={post.id}
              post={post}
              currentUserId={userId}
              onToggleReaction={toggleReaction}
              onToast={showToast}
            />
          ))
        )}
      </div>

      {/* Create Post FAB */}
      <button
        onClick={() => setShowCreatePost(true)}
        className="fixed bottom-44 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-nm-signature to-nm-signature-light text-white shadow-[0_20px_40px_rgba(255,107,107,0.4)] flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-40"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Story overlay */}
      {selectedStory && <StoryOverlay story={selectedStory} onClose={() => setSelectedStory(null)} />}

      {/* Create Post modal */}
      {showCreatePost && (
        <CreatePostModal
          userId={userId}
          onClose={() => setShowCreatePost(false)}
          onCreated={() => { setShowCreatePost(false); fetchPosts(); showToast('Posted!'); }}
        />
      )}

      {/* Friends list modal */}
      {showFriendsList && (
        <FriendsListModal
          userId={userId} friends={friends} incomingRequests={incomingRequests} outgoingRequests={outgoingRequests}
          loading={friendsLoading} userProfile={userProfile}
          onClose={() => setShowFriendsList(false)} onSearch={hookSearchUsers} onSendRequest={hookSendRequest}
          onHandleRequest={hookHandleRequest} onRemoveFriend={hookRemoveFriend}
          onLoadFriends={loadFriends} onLoadUserProfile={loadUserProfile} onPlanDinner={onPlanDinner}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-nm-text text-white px-6 py-3 rounded-full shadow-nm-float z-[70] flex items-center gap-2 animate-fade-in">
          <span className="text-sm font-bold">{toast}</span>
        </div>
      )}
    </div>
  );
}

// ── Feed Post Card ──

function FeedPostCard({ post, currentUserId, onToggleReaction, onToast }: {
  post: SocialPost;
  currentUserId: string;
  onToggleReaction: (postId: string, type: string, isActive: boolean) => void;
  onToast: (msg: string) => void;
}) {
  const content = (post.content_json || {}) as Record<string, string>;

  if (post.post_type === 'achievement') {
    return (
      <article className="bg-nm-success/10 rounded-[2rem] p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-nm-success to-nm-success flex items-center justify-center text-white font-bold text-xs">
            {getInitials(post.display_name)}
          </div>
          <span className="text-nm-label-md text-nm-text/40 uppercase tracking-widest">{timeAgo(post.created_at)}</span>
        </div>
        <p className="text-lg font-bold text-nm-text">{content.caption || content.text || `${post.display_name} achieved a goal!`}</p>
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-nm-success/20 rounded-full">
          <span className="material-symbols-outlined text-nm-success text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
          <span className="text-nm-label-md font-bold text-nm-success">Achievement</span>
        </div>
      </article>
    );
  }

  if (post.post_type === 'discovery') {
    return (
      <article className="bg-nm-surface-lowest rounded-[2rem] p-6 shadow-nm-float">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-nm-signature to-nm-signature-light flex items-center justify-center text-white font-bold text-xs">
            {getInitials(post.display_name)}
          </div>
          <div className="flex-1">
            <p className="font-bold text-nm-text text-sm">{post.display_name}</p>
            <p className="text-nm-label-md text-nm-text/40 uppercase tracking-widest">{timeAgo(post.created_at)}</p>
          </div>
        </div>
        <p className="text-nm-text font-medium mb-3">
          {post.display_name} just dined at <span className="font-bold">{post.restaurant_name}</span>
        </p>
        {post.dish_name && <p className="text-sm text-nm-text/60 mb-3">{post.dish_name}</p>}
      </article>
    );
  }

  // Meal / recommendation post
  return (
    <article className="group">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-nm-signature to-nm-signature-light flex items-center justify-center text-white font-bold text-sm">
            {getInitials(post.display_name)}
          </div>
          <div>
            <h3 className="font-bold text-lg text-nm-text">{post.display_name}</h3>
            <p className="text-nm-label-md text-nm-text/40 uppercase tracking-widest">{timeAgo(post.created_at)}</p>
          </div>
        </div>
      </div>

      <div className="bg-nm-surface rounded-[2rem] p-3 shadow-sm">
        {/* Image or placeholder */}
        <div className="relative aspect-square rounded-[1.5rem] overflow-hidden mb-5 bg-nm-surface-high">
          {post.image_url ? (
            <img className="w-full h-full object-cover" src={post.image_url} alt={post.dish_name || ''} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-6xl text-nm-text/10">restaurant</span>
            </div>
          )}
          {post.dish_name && (
            <div className="absolute bottom-4 left-4 right-4 bg-white/80 backdrop-blur-xl p-4 rounded-[1rem] shadow-lg">
              <h4 className="text-lg font-bold text-nm-text">{post.dish_name}</h4>
              {post.restaurant_name && (
                <p className="text-nm-signature font-bold text-sm flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-sm">restaurant</span>
                  {post.restaurant_name}
                </p>
              )}
            </div>
          )}
          {post.post_type === 'recommendation' && (
            <div className="absolute top-3 left-3 bg-nm-text text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              NomMigo picked this
            </div>
          )}
        </div>

        <div className="px-4 pb-4">
          {content.caption && <p className="text-nm-text leading-relaxed font-medium mb-5">{content.caption}</p>}

          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-5">
              <button onClick={() => onToggleReaction(post.id, 'nom', post.user_nommed)} className="flex items-center gap-1.5">
                <span className={`material-symbols-outlined ${post.user_nommed ? 'text-nm-signature' : 'text-nm-text/30'}`} style={{ fontVariationSettings: post.user_nommed ? "'FILL' 1" : "'FILL' 0" }}>mood</span>
                <span className="font-bold text-sm text-nm-text">{post.nom_count}</span>
              </button>
              <button onClick={() => onToast('Comments coming soon!')} className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-nm-text/30">chat_bubble</span>
                <span className="font-bold text-sm text-nm-text">{post.comment_count}</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => onToast("Added to your Must Try list! 🍽️")} className="text-nm-signature text-sm font-bold hover:opacity-80">Try This</button>
              <button onClick={() => onToggleReaction(post.id, 'bookmark', post.user_bookmarked)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-nm-surface-high transition-colors">
                <span className={`material-symbols-outlined ${post.user_bookmarked ? 'text-nm-signature' : 'text-nm-text/30'}`} style={{ fontVariationSettings: post.user_bookmarked ? "'FILL' 1" : "'FILL' 0" }}>bookmark</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

// ── Story Overlay ──

function StoryOverlay({ story, onClose }: { story: SocialStory; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] bg-nm-text flex flex-col" onClick={onClose}>
      <div className="flex items-center gap-3 px-6 pt-12 pb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-nm-signature to-nm-signature-light flex items-center justify-center text-white font-bold text-xs border-2 border-white/30">
          {getInitials(story.display_name)}
        </div>
        <div>
          <p className="font-bold text-white text-sm">{story.display_name}</p>
          <p className="text-white/40 text-xs">{timeAgo(story.created_at)}</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-6">
        {story.media_url ? (
          story.media_type === 'video' ? (
            <video src={story.media_url} className="w-full max-h-[60vh] rounded-[2rem] object-contain" autoPlay muted playsInline />
          ) : (
            <img src={story.media_url} className="w-full max-h-[60vh] rounded-[2rem] object-contain" alt="" />
          )
        ) : (
          <div className="w-full aspect-[3/4] bg-white/5 rounded-[2rem] flex items-center justify-center">
            <span className="material-symbols-outlined text-white/20 text-8xl">restaurant</span>
          </div>
        )}
      </div>
      {(story.restaurant_name || story.caption) && (
        <div className="px-6 pb-12">
          <div className="bg-white/10 backdrop-blur-xl rounded-[1.5rem] p-5">
            {story.caption && <p className="font-bold text-white text-lg">{story.caption}</p>}
            {story.restaurant_name && (
              <p className="text-nm-signature font-bold text-sm mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">restaurant</span>
                {story.restaurant_name}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Create Post Modal ──

function CreatePostModal({ userId, onClose, onCreated }: { userId: string; onClose: () => void; onCreated: () => void }) {
  const [dishName, setDishName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [caption, setCaption] = useState('');
  const [postType, setPostType] = useState<'meal' | 'discovery' | 'recommendation'>('meal');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { createPost } = useSocialPosts(userId);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!dishName.trim() && !caption.trim()) return;
    setSaving(true);

    let imageUrl: string | null = null;

    if (imageFile) {
      const ext = imageFile.name.split('.').pop() || 'jpg';
      const path = `${userId}/${Date.now()}.${ext}`;
      try {
        const { error } = await supabase.storage.from('social-posts').upload(path, imageFile, { upsert: true });
        if (!error) {
          const { data } = supabase.storage.from('social-posts').getPublicUrl(path);
          imageUrl = data?.publicUrl || null;
        }
      } catch {
        // Post without image
      }
    }

    const result = await createPost({
      post_type: postType,
      content_json: { caption: caption.trim() },
      image_url: imageUrl,
      restaurant_name: restaurantName.trim() || undefined,
      dish_name: dishName.trim() || undefined,
    });

    setSaving(false);
    if (!result.error) onCreated();
  };

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-nm-surface-lowest rounded-[2rem] rounded-b-none max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-nm-surface-lowest px-8 pt-5 pb-4 rounded-t-[2rem] z-10">
          <div className="w-10 h-1 bg-nm-surface-high rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-nm-text">Create Post</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-nm-surface transition-colors">
              <X className="w-5 h-5 text-nm-text/40" />
            </button>
          </div>
        </div>

        <div className="px-8 pb-40 space-y-5">
          {/* Photo upload */}
          <button onClick={() => fileRef.current?.click()} className="w-full aspect-video bg-nm-surface rounded-[2rem] flex flex-col items-center justify-center gap-2 active:scale-[0.98] transition-transform overflow-hidden">
            {imagePreview ? (
              <img src={imagePreview} className="w-full h-full object-cover" alt="" />
            ) : (
              <>
                <span className="material-symbols-outlined text-3xl text-nm-text/20">add_a_photo</span>
                <span className="text-sm text-nm-text/30 font-bold">Add a photo</span>
              </>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />

          {/* Post type */}
          <div className="flex gap-2">
            {(['meal', 'discovery', 'recommendation'] as const).map(t => (
              <button
                key={t}
                onClick={() => setPostType(t)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${
                  postType === t ? 'bg-nm-signature text-white' : 'bg-nm-surface-high text-nm-text'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Inputs */}
          <input
            value={dishName}
            onChange={e => setDishName(e.target.value)}
            placeholder="Dish name"
            className="w-full px-5 py-3.5 bg-nm-surface-high rounded-full text-nm-text placeholder:text-nm-text/30 focus:outline-none focus:bg-nm-surface-lowest focus:ring-2 focus:ring-nm-signature/40 text-sm"
          />
          <input
            value={restaurantName}
            onChange={e => setRestaurantName(e.target.value)}
            placeholder="Restaurant name"
            className="w-full px-5 py-3.5 bg-nm-surface-high rounded-full text-nm-text placeholder:text-nm-text/30 focus:outline-none focus:bg-nm-surface-lowest focus:ring-2 focus:ring-nm-signature/40 text-sm"
          />
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="What's on your mind?"
            rows={3}
            className="w-full px-5 py-3.5 bg-nm-surface-high rounded-[1.5rem] text-nm-text placeholder:text-nm-text/30 focus:outline-none focus:bg-nm-surface-lowest focus:ring-2 focus:ring-nm-signature/40 text-sm resize-none"
          />

          <button
            onClick={handleSubmit}
            disabled={(!dishName.trim() && !caption.trim()) || saving}
            className="w-full py-4 bg-gradient-to-br from-nm-signature to-nm-signature-light text-white font-bold rounded-full shadow-nm-float active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Share'}
          </button>
        </div>
      </div>
    </div>
  );
}
