import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { MealLogEntry } from '../types';

interface NutritionData {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
}

interface MealInsertData {
  meal_name: string;
  meal_type?: string | null;
  feeling?: string | null;
  notes?: string | null;
  nutrition?: NutritionData | null;
}

function getDateRange(date: Date): { start: string; end: string } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function useMeals(userId: string) {
  const [meals, setMeals] = useState<MealLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMealsForDate = useCallback(async (date: Date) => {
    if (!userId) return;
    setLoading(true);

    const { start, end } = getDateRange(date);
    const { data, error } = await supabase
      .from('meal_logs')
      .select('id, meal_name, meal_type, estimated_calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, feeling, created_at')
      .eq('user_id', userId)
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: true });

    if (!error) setMeals(data || []);
    setLoading(false);
  }, [userId]);

  const fetchAllMeals = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error) setMeals(data || []);
    setLoading(false);
  }, [userId]);

  const fetchTodayProgress = useCallback(async () => {
    const { start, end } = getDateRange(new Date());

    const { data, error } = await supabase
      .from('meal_logs')
      .select('estimated_calories, protein_g, carbs_g, fat_g')
      .eq('user_id', userId)
      .gte('created_at', start)
      .lte('created_at', end);

    if (error) return null;

    const meals = data || [];
    return {
      calories: meals.reduce((sum, m) => sum + (m.estimated_calories || 0), 0),
      protein: meals.reduce((sum, m) => sum + (m.protein_g || 0), 0),
      carbs: meals.reduce((sum, m) => sum + (m.carbs_g || 0), 0),
      fat: meals.reduce((sum, m) => sum + (m.fat_g || 0), 0),
      mealsLogged: meals.length,
    };
  }, [userId]);

  const addMeal = useCallback(async (data: MealInsertData): Promise<{ error?: string }> => {
    const mealLogData: Record<string, unknown> = {
      user_id: userId,
      meal_name: data.meal_name,
      meal_type: data.meal_type,
      feeling: data.feeling,
      notes: data.notes,
    };

    if (data.nutrition) {
      mealLogData.estimated_calories = data.nutrition.calories;
      mealLogData.protein_g = data.nutrition.protein_g;
      mealLogData.carbs_g = data.nutrition.carbs_g;
      mealLogData.fat_g = data.nutrition.fat_g;
      mealLogData.fiber_g = data.nutrition.fiber_g;
      mealLogData.sugar_g = data.nutrition.sugar_g;
      mealLogData.sodium_mg = data.nutrition.sodium_mg;
    }

    const { error } = await supabase.from('meal_logs').insert(mealLogData);
    if (error) return { error: error.message };
    return {};
  }, [userId]);

  const updateMeal = useCallback(async (id: string, updates: Partial<MealLogEntry>): Promise<{ error?: string }> => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.meal_name !== undefined) dbUpdates.meal_name = updates.meal_name;
    if (updates.estimated_calories !== undefined) dbUpdates.estimated_calories = updates.estimated_calories;
    if (updates.protein_g !== undefined) dbUpdates.protein_g = updates.protein_g;
    if (updates.carbs_g !== undefined) dbUpdates.carbs_g = updates.carbs_g;
    if (updates.fat_g !== undefined) dbUpdates.fat_g = updates.fat_g;
    if (updates.fiber_g !== undefined) dbUpdates.fiber_g = updates.fiber_g;
    if (updates.sugar_g !== undefined) dbUpdates.sugar_g = updates.sugar_g;
    if (updates.sodium_mg !== undefined) dbUpdates.sodium_mg = updates.sodium_mg;

    const { error } = await supabase
      .from('meal_logs')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', userId);

    if (error) return { error: error.message };

    setMeals(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    return {};
  }, [userId]);

  const deleteMeal = useCallback(async (id: string): Promise<{ error?: string }> => {
    const { error } = await supabase
      .from('meal_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) return { error: error.message };

    setMeals(prev => prev.filter(m => m.id !== id));
    return {};
  }, [userId]);

  return {
    meals,
    setMeals,
    loading,
    fetchMealsForDate,
    fetchAllMeals,
    fetchTodayProgress,
    addMeal,
    updateMeal,
    deleteMeal,
  };
}
