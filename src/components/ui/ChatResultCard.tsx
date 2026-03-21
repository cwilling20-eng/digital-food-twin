/**
 * ChatResultCard — Renders structured menu scan results inside the chat.
 *
 * Extracts layout patterns from design/menu-scanner.html (Stitch lines 113-254).
 * Uses FoodResultCard for individual dish cards.
 *
 * Phase 3.2: Queries restaurant_menu_items table for matching images
 * when rendering dish recommendations. If a match with image_url exists,
 * FoodResultCard renders the image variant; otherwise text-forward.
 */

import { useState, useEffect } from 'react';
import { FoodResultCard } from './FoodResultCard';
import { lookupMenuItems } from '../../utils/menuItemLookup';

export interface ParsedDish {
  dishName: string;
  matchPercentage?: number;
  calories?: number;
  caloriesLabel?: string;
  protein?: number;
  carbs?: number;
  fat?: number;
  explanation?: string;
  imageUrl?: string;
}

export interface ParsedMenuResult {
  restaurantName?: string;
  itemsAnalyzed?: number;
  mode?: 'goal' | 'enjoyment';
  dishes: ParsedDish[];
}

interface ChatResultCardProps {
  result: ParsedMenuResult;
  onLogMeal?: (dishName: string, calories?: number, protein?: number, carbs?: number, fat?: number) => void;
}

export function ChatResultCard({ result, onLogMeal }: ChatResultCardProps) {
  const [enrichedDishes, setEnrichedDishes] = useState<ParsedDish[]>(result.dishes);

  // Phase 3.2: Look up menu item images from Supabase
  useEffect(() => {
    // Skip lookup if all dishes already have images
    const needsLookup = result.dishes.some(d => !d.imageUrl);
    if (!needsLookup) {
      setEnrichedDishes(result.dishes);
      return;
    }

    let cancelled = false;

    async function enrichWithImages() {
      const dishNames = result.dishes
        .filter(d => !d.imageUrl)
        .map(d => d.dishName);

      if (dishNames.length === 0) return;

      const matches = await lookupMenuItems(dishNames, result.restaurantName);

      if (cancelled) return;

      if (matches.size === 0) return;

      setEnrichedDishes(prev =>
        prev.map(dish => {
          if (dish.imageUrl) return dish;
          const match = matches.get(dish.dishName);
          if (!match?.image_url) return dish;
          return {
            ...dish,
            imageUrl: match.image_url,
            // Backfill nutrition from DB if the AI didn't provide it
            calories: dish.calories ?? match.calories ?? undefined,
            protein: dish.protein ?? (match.protein_g != null ? Number(match.protein_g) : undefined),
            carbs: dish.carbs ?? (match.carbs_g != null ? Number(match.carbs_g) : undefined),
            fat: dish.fat ?? (match.fat_g != null ? Number(match.fat_g) : undefined),
          };
        })
      );
    }

    enrichWithImages();

    return () => { cancelled = true; };
  }, [result.dishes, result.restaurantName]);

  const topPick = enrichedDishes[0];
  const picks2and3 = enrichedDishes.slice(1, 3);
  const otherSwaps = enrichedDishes.slice(3);

  const handleLog = (dish: ParsedDish) => {
    onLogMeal?.(dish.dishName, dish.calories, dish.protein, dish.carbs, dish.fat);
  };

  return (
    <div className="space-y-6 w-full max-w-[95%]">
      {/* Header */}
      <div className="space-y-3">
        {result.itemsAnalyzed != null && (
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-nm-surface-high text-nm-text text-xs font-bold uppercase tracking-widest">
            {result.itemsAnalyzed} items analyzed
          </span>
        )}
        {result.restaurantName && (
          <h2 className="text-2xl font-black text-nm-text tracking-tight">
            {result.restaurantName}
          </h2>
        )}

        {/* Mode toggle (display-only) */}
        {result.mode && (
          <div className="bg-nm-surface-low p-1.5 rounded-full flex items-center w-full max-w-[280px]">
            <div
              className={`flex-1 py-2 px-4 rounded-full text-center text-sm font-bold transition-all ${
                result.mode === 'goal'
                  ? 'bg-nm-signature text-white shadow-nm-float'
                  : 'text-nm-text/40'
              }`}
            >
              Goal Mode
            </div>
            <div
              className={`flex-1 py-2 px-4 rounded-full text-center text-sm font-bold transition-all ${
                result.mode === 'enjoyment'
                  ? 'bg-nm-signature text-white shadow-nm-float'
                  : 'text-nm-text/40'
              }`}
            >
              Enjoyment
            </div>
          </div>
        )}
      </div>

      {/* Top Pick (#1) — hero card */}
      {topPick && (
        <FoodResultCard
          dishName={topPick.dishName}
          matchPercentage={topPick.matchPercentage}
          calories={topPick.calories}
          caloriesLabel={topPick.caloriesLabel}
          protein={topPick.protein}
          carbs={topPick.carbs}
          fat={topPick.fat}
          explanation={topPick.explanation}
          imageUrl={topPick.imageUrl}
          rank={1}
          variant={topPick.imageUrl ? 'hero' : 'compact'}
          onLog={() => handleLog(topPick)}
        />
      )}

      {/* Picks #2 and #3 — compact cards */}
      {picks2and3.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {picks2and3.map((dish, i) => (
            <FoodResultCard
              key={i}
              dishName={dish.dishName}
              matchPercentage={dish.matchPercentage}
              calories={dish.calories}
              caloriesLabel={dish.caloriesLabel}
              protein={dish.protein}
              carbs={dish.carbs}
              fat={dish.fat}
              explanation={dish.explanation}
              imageUrl={dish.imageUrl}
              rank={i + 2}
              variant="compact"
              onLog={() => handleLog(dish)}
            />
          ))}
        </div>
      )}

      {/* Other Healthy Swaps */}
      {otherSwaps.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-nm-text">Other Healthy Swaps</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 hide-scrollbar">
            {otherSwaps.map((dish, i) => (
              <div key={i} className="flex-none w-36 space-y-2">
                {dish.imageUrl && (
                  <div className="h-36 rounded-[1rem] overflow-hidden bg-nm-surface-low">
                    <img
                      className="w-full h-full object-cover"
                      src={dish.imageUrl}
                      alt={dish.dishName}
                    />
                  </div>
                )}
                <p className="font-bold text-sm text-nm-text text-center px-1">{dish.dishName}</p>
                {dish.calories != null && (
                  <p className="text-nm-label-md text-nm-text/40 text-center">{dish.calories} kcal</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Attempt to parse structured menu recommendations from an AI text response.
 *
 * Looks for patterns like numbered dishes with calorie counts and macro info.
 * Returns null if parsing fails — caller should fall back to plain text rendering.
 *
 * TODO: The n8n workflow should eventually return structured JSON for cleaner parsing.
 * When that happens, this function can be simplified to just parse the JSON block.
 */
export function parseMenuRecommendations(text: string): ParsedMenuResult | null {
  // Try to find a JSON block first (future-proofing for structured responses)
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.dishes && Array.isArray(parsed.dishes)) {
        return {
          restaurantName: parsed.restaurantName || parsed.restaurant_name,
          itemsAnalyzed: parsed.itemsAnalyzed || parsed.items_analyzed,
          mode: parsed.mode,
          dishes: parsed.dishes.map((d: any) => ({
            dishName: d.dishName || d.dish_name || d.name || '',
            matchPercentage: d.matchPercentage || d.match_percentage || d.match,
            calories: d.calories || d.kcal,
            caloriesLabel: d.caloriesLabel || d.calories_label,
            protein: d.protein || d.protein_g,
            carbs: d.carbs || d.carbs_g,
            fat: d.fat || d.fat_g,
            explanation: d.explanation || d.why || d.reason,
            imageUrl: d.imageUrl || d.image_url || d.image,
          })),
        };
      }
    } catch {
      // JSON parse failed, continue with text parsing
    }
  }

  // Text-based parsing: look for numbered dish recommendations
  // Patterns: "1. Dish Name - 420 kcal" or "**1. Dish Name** (420 cal)"
  // Also handles: "Protein: 38g", "P: 38g / C: 42g / F: 12g"
  const lines = text.split('\n');
  const dishes: ParsedDish[] = [];
  let restaurantName: string | undefined;
  let currentDish: Partial<ParsedDish> | null = null;

  // Try to extract restaurant name from a header-like line
  const restaurantMatch = text.match(/(?:restaurant|from|at)\s*[:\-]?\s*\*{0,2}([A-Z][^*\n]{2,40})\*{0,2}/i);
  if (restaurantMatch) {
    restaurantName = restaurantMatch[1].trim();
  }

  for (const line of lines) {
    const trimmed = line.trim();

    // Match numbered dish entries: "1. **Dish Name**" or "1. Dish Name - 420 kcal"
    const dishMatch = trimmed.match(
      /^(?:#+\s*)?(?:\*{0,2})?\s*(?:#?\d+[\.\):\-]\s*)\*{0,2}\s*(.+?)(?:\*{0,2})\s*(?:[-–—]\s*(\d+)\s*(?:kcal|cal|calories))?/i
    );

    if (dishMatch) {
      // Save previous dish
      if (currentDish?.dishName) {
        dishes.push(currentDish as ParsedDish);
      }

      let name = dishMatch[1]
        .replace(/\*{1,2}/g, '')
        .replace(/\s*[-–—]\s*$/, '')
        .replace(/\s*\(\d+\s*(?:kcal|cal|calories)\)\s*$/i, '')
        .trim();

      currentDish = {
        dishName: name,
        calories: dishMatch[2] ? parseInt(dishMatch[2]) : undefined,
      };
      continue;
    }

    // If we're building a current dish, look for additional info
    if (currentDish) {
      // Calories on its own line
      const calMatch = trimmed.match(/(?:calories|kcal|cal)\s*[:\-]?\s*(\d+)/i) ||
        trimmed.match(/(\d+)\s*(?:kcal|cal|calories)/i);
      if (calMatch && !currentDish.calories) {
        currentDish.calories = parseInt(calMatch[1]);
      }

      // Macros: "Protein: 38g" or "P: 38g"
      const proteinMatch = trimmed.match(/(?:protein|prot|p)\s*[:\-]?\s*(\d+)\s*g/i);
      if (proteinMatch) currentDish.protein = parseInt(proteinMatch[1]);

      const carbsMatch = trimmed.match(/(?:carbs?|carbohydrates?|c)\s*[:\-]?\s*(\d+)\s*g/i);
      if (carbsMatch) currentDish.carbs = parseInt(carbsMatch[1]);

      const fatMatch = trimmed.match(/(?:fat|f)\s*[:\-]?\s*(\d+)\s*g/i);
      if (fatMatch) currentDish.fat = parseInt(fatMatch[1]);

      // Inline macro format: "P: 38g / C: 42g / F: 12g" or "38g protein, 42g carbs, 12g fat"
      const inlineMacros = trimmed.match(/(\d+)g?\s*(?:protein|prot|p)[,\/\|]\s*(\d+)g?\s*(?:carbs?|c)[,\/\|]\s*(\d+)g?\s*(?:fat|f)/i);
      if (inlineMacros) {
        currentDish.protein = parseInt(inlineMacros[1]);
        currentDish.carbs = parseInt(inlineMacros[2]);
        currentDish.fat = parseInt(inlineMacros[3]);
      }

      // Match percentage
      const matchMatch = trimmed.match(/(\d+)%\s*match/i);
      if (matchMatch) currentDish.matchPercentage = parseInt(matchMatch[1]);

      // Explanation lines (look for "why" or "reason" or description-like text)
      const whyMatch = trimmed.match(/(?:why|reason|because|this dish|great (?:choice|option|pick))[:\-]?\s*(.+)/i);
      if (whyMatch && !currentDish.explanation) {
        currentDish.explanation = whyMatch[1].replace(/\*{1,2}/g, '').trim();
      }
    }
  }

  // Don't forget the last dish
  if (currentDish?.dishName) {
    dishes.push(currentDish as ParsedDish);
  }

  // Only return structured result if we found at least 2 dishes
  // (single dish recommendations are better as plain text)
  if (dishes.length >= 2) {
    return {
      restaurantName,
      itemsAnalyzed: undefined,
      dishes,
    };
  }

  return null;
}
