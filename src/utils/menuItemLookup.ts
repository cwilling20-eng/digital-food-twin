import { supabase } from '../lib/supabase';

interface MenuItemMatch {
  id: string;
  item_name: string;
  image_url: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  item_description: string | null;
}

/**
 * Look up a menu item by dish name and restaurant name in the
 * restaurant_menu_items table. Uses case-insensitive fuzzy matching
 * since AI-returned dish names won't be exact matches.
 *
 * Returns the best match or null if nothing is found.
 */
export async function lookupMenuItem(
  dishName: string,
  restaurantName?: string
): Promise<MenuItemMatch | null> {
  if (!dishName.trim()) return null;

  // Normalize: strip leading/trailing whitespace, collapse internal spaces
  const normalizedDish = dishName.trim().replace(/\s+/g, ' ');

  // Build query with fuzzy ILIKE match on item_name
  let query = supabase
    .from('restaurant_menu_items')
    .select('id, item_name, image_url, calories, protein_g, carbs_g, fat_g, item_description')
    .ilike('item_name', `%${normalizedDish}%`)
    .limit(1);

  // If we have a restaurant name, filter by it for a tighter match
  if (restaurantName?.trim()) {
    query = query.ilike('restaurant_name', `%${restaurantName.trim()}%`);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    // If restaurant-scoped search failed, try without restaurant filter
    if (restaurantName?.trim()) {
      return lookupMenuItem(dishName);
    }
    return null;
  }

  return data[0];
}

/**
 * Batch lookup for multiple dish names at once.
 * More efficient than calling lookupMenuItem one at a time
 * when rendering a ChatResultCard with 3+ dishes.
 *
 * Returns a Map of dishName → MenuItemMatch (only for found items).
 */
export async function lookupMenuItems(
  dishNames: string[],
  restaurantName?: string
): Promise<Map<string, MenuItemMatch>> {
  const results = new Map<string, MenuItemMatch>();

  if (dishNames.length === 0) return results;

  // Build OR filter for all dish names
  const normalizedNames = dishNames
    .map(n => n.trim().replace(/\s+/g, ' '))
    .filter(Boolean);

  if (normalizedNames.length === 0) return results;

  // Use a single query with OR conditions via Supabase's .or() filter
  const orConditions = normalizedNames
    .map(name => `item_name.ilike.%${name}%`)
    .join(',');

  let query = supabase
    .from('restaurant_menu_items')
    .select('id, item_name, image_url, calories, protein_g, carbs_g, fat_g, item_description')
    .or(orConditions);

  if (restaurantName?.trim()) {
    query = query.ilike('restaurant_name', `%${restaurantName.trim()}%`);
  }

  const { data, error } = await query;

  if (error || !data) return results;

  // Match each result back to the original dish name
  for (const item of data) {
    const itemNameLower = item.item_name.toLowerCase();
    for (const dishName of dishNames) {
      const dishLower = dishName.trim().toLowerCase();
      if (
        itemNameLower.includes(dishLower) ||
        dishLower.includes(itemNameLower)
      ) {
        results.set(dishName, item);
        break;
      }
    }
  }

  return results;
}
