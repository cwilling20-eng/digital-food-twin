import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface WaterLog {
  id: string;
  cups: number;
  logged_at: string;
}

function getDateRange(date: Date): { start: string; end: string } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function useWaterLogs(userId: string) {
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWaterForDate = useCallback(async (date: Date) => {
    if (!userId) return;
    setLoading(true);

    const { start, end } = getDateRange(date);
    const { data, error } = await supabase
      .from('water_logs')
      .select('id, cups, logged_at')
      .eq('user_id', userId)
      .gte('logged_at', start)
      .lte('logged_at', end)
      .order('logged_at', { ascending: true });

    if (!error) setWaterLogs(data || []);
    setLoading(false);
  }, [userId]);

  const fetchTodayWater = useCallback(async () => {
    const { start } = getDateRange(new Date());

    const { data, error } = await supabase
      .from('water_logs')
      .select('cups')
      .eq('user_id', userId)
      .gte('logged_at', start);

    if (error) return 0;
    return (data || []).reduce((sum, w) => sum + (w.cups || 0), 0);
  }, [userId]);

  const addWater = useCallback(async (cups: number): Promise<{ error?: string }> => {
    const { error } = await supabase.from('water_logs').insert({
      user_id: userId,
      cups,
    });
    if (error) return { error: error.message };
    return {};
  }, [userId]);

  const removeWater = useCallback(async (logId: string): Promise<{ error?: string }> => {
    const { error } = await supabase
      .from('water_logs')
      .delete()
      .eq('id', logId);
    if (error) return { error: error.message };
    return {};
  }, []);

  return {
    waterLogs,
    setWaterLogs,
    loading,
    fetchWaterForDate,
    fetchTodayWater,
    addWater,
    removeWater,
  };
}
