import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { FriendData, PublicProfile } from '../types';

interface SimpleFriend {
  id: string;
  friendId: string;
  displayName: string;
  status: string;
}

interface FriendsResult {
  accepted: FriendData[];
  incoming: FriendData[];
  outgoing: FriendData[];
}

interface SearchResult {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  alreadyFriend: boolean;
  pendingRequest: boolean;
}

export function useFriends(userId: string) {
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendData[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFriends = useCallback(async (): Promise<FriendsResult> => {
    if (!userId) return { accepted: [], incoming: [], outgoing: [] };
    setLoading(true);
    setError(null);

    try {
      const { data: friendsData, error: friendsError } = await supabase
        .from('user_friends')
        .select('*')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

      if (friendsError) {
        setError(friendsError.message);
        setLoading(false);
        return { accepted: [], incoming: [], outgoing: [] };
      }

      if (!friendsData || friendsData.length === 0) {
        setFriends([]);
        setIncomingRequests([]);
        setOutgoingRequests([]);
        setLoading(false);
        return { accepted: [], incoming: [], outgoing: [] };
      }

      const friendIds = friendsData.map(f => f.user_id === userId ? f.friend_id : f.user_id);

      const { data: profiles } = await supabase
        .from('user_public_profiles')
        .select('*')
        .in('id', friendIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const accepted: FriendData[] = [];
      const incoming: FriendData[] = [];
      const outgoing: FriendData[] = [];

      friendsData.forEach(f => {
        const isSender = f.user_id === userId;
        const friendUserId = isSender ? f.friend_id : f.user_id;
        const profile = profileMap.get(friendUserId);

        const friendData: FriendData = {
          id: f.id,
          friendId: friendUserId,
          userId: f.user_id,
          status: f.status,
          profile: {
            id: friendUserId,
            username: profile?.username || null,
            displayName: profile?.display_name || `User ${friendUserId.slice(0, 6)}`,
            avatarUrl: profile?.avatar_url || null,
            shareFoodDna: profile?.share_food_dna || false,
          },
          requestedAt: f.requested_at,
          acceptedAt: f.accepted_at,
        };

        if (f.status === 'accepted') {
          accepted.push(friendData);
        } else if (f.status === 'pending') {
          if (isSender) {
            outgoing.push(friendData);
          } else {
            incoming.push(friendData);
          }
        }
      });

      setFriends(accepted);
      setIncomingRequests(incoming);
      setOutgoingRequests(outgoing);
      setLoading(false);
      return { accepted, incoming, outgoing };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load friends';
      setError(msg);
      setLoading(false);
      return { accepted: [], incoming: [], outgoing: [] };
    }
  }, [userId]);

  const loadAcceptedFriendsList = useCallback(async (): Promise<SimpleFriend[]> => {
    if (!userId) return [];

    const { data: friendsData } = await supabase
      .from('user_friends')
      .select('user_id, friend_id')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq('status', 'accepted');

    if (!friendsData || friendsData.length === 0) return [];

    const friendIds = friendsData.map(f => f.user_id === userId ? f.friend_id : f.user_id);

    const { data: profiles } = await supabase
      .from('user_public_profiles')
      .select('id, display_name, username')
      .in('id', friendIds);

    if (!profiles) return [];

    return profiles.map(p => ({
      id: p.id,
      friendId: p.id,
      displayName: p.display_name || `User ${p.id.slice(0, 6)}`,
      status: 'accepted',
    }));
  }, [userId]);

  const searchUsers = useCallback(async (
    query: string,
    currentFriendIds: Set<string>,
    pendingIds: Set<string>
  ): Promise<SearchResult[]> => {
    if (query.length < 2) return [];

    const { data } = await supabase
      .from('user_public_profiles')
      .select('id, username, display_name, avatar_url')
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .neq('id', userId)
      .limit(10);

    if (!data) return [];

    return data.map(u => ({
      id: u.id,
      username: u.username || '',
      display_name: u.display_name || `User ${u.id.slice(0, 6)}`,
      avatar_url: u.avatar_url,
      alreadyFriend: currentFriendIds.has(u.id),
      pendingRequest: pendingIds.has(u.id),
    }));
  }, [userId]);

  const sendFriendRequest = useCallback(async (friendId: string): Promise<{ error?: string }> => {
    const { error } = await supabase
      .from('user_friends')
      .insert({
        user_id: userId,
        friend_id: friendId,
        status: 'pending',
      });

    if (error) return { error: error.message };
    return {};
  }, [userId]);

  const handleRequest = useCallback(async (requestId: string, accept: boolean): Promise<{ error?: string }> => {
    const { error } = await supabase
      .from('user_friends')
      .update({
        status: accept ? 'accepted' : 'declined',
        accepted_at: accept ? new Date().toISOString() : null,
      })
      .eq('id', requestId);

    if (error) return { error: error.message };
    return {};
  }, []);

  const removeFriend = useCallback(async (recordId: string): Promise<{ error?: string }> => {
    const { error } = await supabase
      .from('user_friends')
      .delete()
      .eq('id', recordId);

    if (error) return { error: error.message };
    return {};
  }, []);

  const getFriendFoodDna = useCallback(async (friendId: string) => {
    const [cuisineRes, constraintsRes] = await Promise.all([
      supabase
        .from('user_cuisine_preferences')
        .select('cuisine_type')
        .eq('user_id', friendId),
      supabase
        .from('user_dietary_constraints')
        .select('allergies, restrictions')
        .eq('user_id', friendId)
        .maybeSingle(),
    ]);

    return {
      favoriteCuisines: cuisineRes.data?.map(c => c.cuisine_type) || [],
      restrictions: constraintsRes.data?.restrictions || [],
      allergies: constraintsRes.data?.allergies || [],
    };
  }, []);

  const getUserCuisines = useCallback(async (uid: string): Promise<string[]> => {
    const { data } = await supabase
      .from('user_cuisine_preferences')
      .select('cuisine_type')
      .eq('user_id', uid);
    return data?.map(c => c.cuisine_type) || [];
  }, []);

  const getFriendPublicProfile = useCallback(async (friendId: string) => {
    const { data } = await supabase
      .from('user_public_profiles')
      .select('id, display_name, username, share_food_dna')
      .eq('id', friendId)
      .maybeSingle();

    return data;
  }, []);

  return {
    friends,
    incomingRequests,
    outgoingRequests,
    loading,
    error,
    loadFriends,
    loadAcceptedFriendsList,
    searchUsers,
    sendFriendRequest,
    handleRequest,
    removeFriend,
    getFriendFoodDna,
    getUserCuisines,
    getFriendPublicProfile,
  };
}
