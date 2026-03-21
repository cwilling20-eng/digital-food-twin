import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { PublicProfile } from '../types';

export function usePublicProfile(userId: string) {
  const [publicProfile, setPublicProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);

    const { data } = await supabase
      .from('user_public_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      setPublicProfile({
        id: data.id,
        username: data.username,
        displayName: data.display_name,
        avatarUrl: data.avatar_url,
        shareFoodDna: data.share_food_dna,
      });
    }

    setLoading(false);
  }, [userId]);

  // Auto-load on mount / userId change
  useEffect(() => { loadProfile(); }, [loadProfile]);

  const upsertProfile = useCallback(async (profile: {
    username: string;
    displayName: string;
    avatarUrl: string;
    shareFoodDna: boolean;
  }): Promise<{ error?: string }> => {
    const { error } = await supabase
      .from('user_public_profiles')
      .upsert({
        id: userId,
        username: profile.username.toLowerCase(),
        display_name: profile.displayName,
        avatar_url: profile.avatarUrl,
        share_food_dna: profile.shareFoodDna,
        updated_at: new Date().toISOString(),
      });

    if (error) return { error: error.message };

    setPublicProfile({
      id: userId,
      username: profile.username.toLowerCase(),
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      shareFoodDna: profile.shareFoodDna,
    });

    return {};
  }, [userId]);

  const checkUsernameAvailable = useCallback(async (username: string): Promise<boolean> => {
    const { data } = await supabase
      .from('user_public_profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .neq('id', userId)
      .maybeSingle();

    return !data;
  }, [userId]);

  return {
    publicProfile,
    loading,
    loadProfile,
    upsertProfile,
    checkUsernameAvailable,
  };
}
