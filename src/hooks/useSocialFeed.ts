import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ── Types ──

export interface SocialPost {
  id: string;
  user_id: string;
  post_type: 'meal' | 'achievement' | 'discovery' | 'recommendation';
  content_json: Record<string, unknown> | null;
  image_url: string | null;
  restaurant_name: string | null;
  dish_name: string | null;
  created_at: string;
  // Joined profile data
  display_name: string;
  avatar_url: string | null;
  // Reaction counts
  nom_count: number;
  bookmark_count: number;
  comment_count: number;
  // Current user's reactions
  user_nommed: boolean;
  user_bookmarked: boolean;
}

export interface SocialStory {
  id: string;
  user_id: string;
  media_url: string | null;
  media_type: 'photo' | 'video';
  caption: string | null;
  restaurant_name: string | null;
  expires_at: string;
  created_at: string;
  display_name: string;
  avatar_url: string | null;
}

export interface DiningSignal {
  id: string;
  user_id: string;
  is_active: boolean;
  activated_at: string;
  expires_at: string;
  display_name: string;
  avatar_url: string | null;
}

// ── Posts Hook ──

export function useSocialPosts(currentUserId: string) {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch posts with joined profile
      const { data: rawPosts, error } = await supabase
        .from('social_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (error || !rawPosts) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // Fetch profiles for all unique user_ids
      const userIds = [...new Set(rawPosts.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('user_public_profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      // Fetch reaction counts for all posts
      const postIds = rawPosts.map(p => p.id);
      const { data: reactions } = await supabase
        .from('social_reactions')
        .select('post_id, reaction_type, user_id')
        .in('post_id', postIds);

      const reactionsByPost = new Map<string, typeof reactions>();
      for (const r of reactions || []) {
        const existing = reactionsByPost.get(r.post_id) || [];
        existing.push(r);
        reactionsByPost.set(r.post_id, existing);
      }

      const enriched: SocialPost[] = rawPosts.map(p => {
        const profile = profileMap.get(p.user_id);
        const postReactions = reactionsByPost.get(p.id) || [];
        return {
          ...p,
          display_name: profile?.display_name || 'User',
          avatar_url: profile?.avatar_url || null,
          nom_count: postReactions.filter(r => r.reaction_type === 'nom').length,
          bookmark_count: postReactions.filter(r => r.reaction_type === 'bookmark').length,
          comment_count: 0, // Comments not implemented yet
          user_nommed: postReactions.some(r => r.reaction_type === 'nom' && r.user_id === currentUserId),
          user_bookmarked: postReactions.some(r => r.reaction_type === 'bookmark' && r.user_id === currentUserId),
        };
      });

      setPosts(enriched);
    } catch {
      setPosts([]);
    }
    setLoading(false);
  }, [currentUserId]);

  const createPost = useCallback(async (data: {
    post_type: string;
    content_json?: Record<string, unknown>;
    image_url?: string | null;
    restaurant_name?: string;
    dish_name?: string;
  }): Promise<{ error?: string }> => {
    const { error } = await supabase.from('social_posts').insert({
      user_id: currentUserId,
      post_type: data.post_type,
      content_json: data.content_json || null,
      image_url: data.image_url || null,
      restaurant_name: data.restaurant_name || null,
      dish_name: data.dish_name || null,
    });
    if (error) return { error: error.message };
    return {};
  }, [currentUserId]);

  const toggleReaction = useCallback(async (postId: string, reactionType: string, isActive: boolean) => {
    if (isActive) {
      await supabase.from('social_reactions')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', currentUserId)
        .eq('reaction_type', reactionType);
    } else {
      await supabase.from('social_reactions').insert({
        post_id: postId,
        user_id: currentUserId,
        reaction_type: reactionType,
      });
    }
    // Refresh to get updated counts
    await fetchPosts();
  }, [currentUserId, fetchPosts]);

  return { posts, loading, fetchPosts, createPost, toggleReaction };
}

// ── Stories Hook ──

export function useSocialStories(currentUserId: string) {
  const [stories, setStories] = useState<SocialStory[]>([]);

  const fetchStories = useCallback(async () => {
    const { data, error } = await supabase
      .from('social_stories')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error || !data) { setStories([]); return; }

    const userIds = [...new Set(data.map(s => s.user_id))];
    const { data: profiles } = await supabase
      .from('user_public_profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds.length > 0 ? userIds : ['__none__']);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    setStories(data.map(s => ({
      ...s,
      display_name: profileMap.get(s.user_id)?.display_name || 'User',
      avatar_url: profileMap.get(s.user_id)?.avatar_url || null,
    })));
  }, []);

  const createStory = useCallback(async (data: {
    media_url?: string | null;
    media_type: 'photo' | 'video';
    caption?: string;
    restaurant_name?: string;
  }): Promise<{ error?: string }> => {
    const { error } = await supabase.from('social_stories').insert({
      user_id: currentUserId,
      media_url: data.media_url || null,
      media_type: data.media_type,
      caption: data.caption || null,
      restaurant_name: data.restaurant_name || null,
    });
    if (error) return { error: error.message };
    return {};
  }, [currentUserId]);

  return { stories, fetchStories, createStory };
}

// ── Dining Signals Hook ──

export function useDiningSignals(currentUserId: string) {
  const [signals, setSignals] = useState<DiningSignal[]>([]);
  const [mySignalActive, setMySignalActive] = useState(false);

  const fetchSignals = useCallback(async () => {
    const { data, error } = await supabase
      .from('dining_signals')
      .select('*')
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString());

    if (error || !data) { setSignals([]); return; }

    const userIds = [...new Set(data.map(s => s.user_id))];
    const { data: profiles } = await supabase
      .from('user_public_profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds.length > 0 ? userIds : ['__none__']);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    const enriched = data.map(s => ({
      ...s,
      display_name: profileMap.get(s.user_id)?.display_name || 'User',
      avatar_url: profileMap.get(s.user_id)?.avatar_url || null,
    }));

    setSignals(enriched.filter(s => s.user_id !== currentUserId));
    setMySignalActive(data.some(s => s.user_id === currentUserId));
  }, [currentUserId]);

  const toggleMySignal = useCallback(async () => {
    if (mySignalActive) {
      await supabase.from('dining_signals')
        .update({ is_active: false })
        .eq('user_id', currentUserId);
    } else {
      const expires = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
      await supabase.from('dining_signals').upsert({
        user_id: currentUserId,
        is_active: true,
        activated_at: new Date().toISOString(),
        expires_at: expires,
      });
    }
    await fetchSignals();
  }, [currentUserId, mySignalActive, fetchSignals]);

  return { signals, mySignalActive, fetchSignals, toggleMySignal };
}
