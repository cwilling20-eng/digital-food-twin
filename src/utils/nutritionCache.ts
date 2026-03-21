import { WEBHOOK_NUTRITION_URL } from '../config/api';

export interface NutritionEstimate {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  confidence?: 'low' | 'medium' | 'high';
  notes?: string;
}

/**
 * In-memory cache for nutrition estimates.
 * Key: lowercase trimmed food name.
 * Persists for the browser session (cleared on page refresh).
 */
const cache = new Map<string, NutritionEstimate>();

function cacheKey(name: string): string {
  return name.trim().toLowerCase();
}

export function getCachedEstimate(name: string): NutritionEstimate | null {
  return cache.get(cacheKey(name)) ?? null;
}

function setCachedEstimate(name: string, estimate: NutritionEstimate): void {
  cache.set(cacheKey(name), estimate);
}

/**
 * Fetch nutrition estimate with cache-first strategy.
 * Returns cached result if available, otherwise calls the n8n webhook
 * and caches the response before returning.
 */
export async function fetchNutritionEstimate(
  mealName: string
): Promise<NutritionEstimate | null> {
  const trimmed = mealName.trim();
  if (!trimmed || trimmed.length < 3) return null;

  // Check cache first
  const cached = getCachedEstimate(trimmed);
  if (cached) return cached;

  // Call the API
  try {
    const response = await fetch(WEBHOOK_NUTRITION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meal_name: trimmed }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const raw = Array.isArray(data) ? data[0] : data;

    // Normalize — the n8n webhook sometimes wraps in .output
    const output = typeof raw?.output === 'string'
      ? JSON.parse(raw.output)
      : raw?.output ?? raw;

    const estimate: NutritionEstimate = {
      calories: output.calories ?? output.estimated_calories ?? 0,
      protein_g: output.protein_g ?? 0,
      carbs_g: output.carbs_g ?? 0,
      fat_g: output.fat_g ?? 0,
      fiber_g: output.fiber_g ?? 0,
      sugar_g: output.sugar_g ?? 0,
      sodium_mg: output.sodium_mg ?? 0,
      confidence: output.confidence,
      notes: output.notes,
    };

    setCachedEstimate(trimmed, estimate);
    return estimate;
  } catch {
    return null;
  }
}
