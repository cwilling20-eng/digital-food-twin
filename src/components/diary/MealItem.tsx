import { useState, useRef, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import type { MealLogEntry } from '../../types';

interface MealItemProps {
  meal: MealLogEntry;
  onDelete: (meal: MealLogEntry) => void;
  onTap: (meal: MealLogEntry) => void;
}

const SWIPE_THRESHOLD = 60;
const DELETE_WIDTH = 80;

export function MealItem({ meal, onDelete, onTap }: MealItemProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isDragging = useRef(false);
  const isHorizontal = useRef<boolean | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
    isHorizontal.current = null;
    setTransitioning(false);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - startX.current;
    const diffY = currentY - startY.current;

    if (isHorizontal.current === null) {
      if (Math.abs(diffX) > 5 || Math.abs(diffY) > 5) {
        isHorizontal.current = Math.abs(diffX) > Math.abs(diffY);
      }
      return;
    }

    if (!isHorizontal.current) return;

    e.preventDefault();

    const base = isRevealed ? -DELETE_WIDTH : 0;
    const raw = base + diffX;
    const clamped = Math.max(-DELETE_WIDTH, Math.min(0, raw));
    setOffsetX(clamped);
  }, [isRevealed]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setTransitioning(true);

    if (offsetX < -SWIPE_THRESHOLD) {
      setOffsetX(-DELETE_WIDTH);
      setIsRevealed(true);
    } else {
      setOffsetX(0);
      setIsRevealed(false);
    }
  }, [offsetX]);

  const closeSwipe = useCallback(() => {
    setTransitioning(true);
    setOffsetX(0);
    setIsRevealed(false);
  }, []);

  const handleTap = useCallback(() => {
    if (isRevealed) {
      closeSwipe();
    } else if (isHorizontal.current === null || isHorizontal.current === false) {
      onTap(meal);
    }
  }, [isRevealed, closeSwipe, onTap, meal]);

  return (
    <div className="relative overflow-hidden rounded-[2rem]">
      {/* Swipe-to-delete background */}
      <div className="absolute inset-y-0 right-0 flex items-stretch" style={{ width: DELETE_WIDTH }}>
        <button
          onClick={() => onDelete(meal)}
          className="w-full flex items-center justify-center bg-nm-signature hover:opacity-90 transition-opacity rounded-r-[2rem]"
        >
          <Trash2 className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Card content */}
      <div
        className={`relative bg-nm-surface rounded-[2rem] px-6 py-5 ${transitioning ? 'transition-transform duration-200 ease-out' : ''}`}
        style={{ transform: `translateX(${offsetX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleTap}
      >
        <div className="flex items-center justify-between cursor-pointer">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-lg text-nm-text truncate">{meal.meal_name}</p>
            {(meal.protein_g || meal.carbs_g || meal.fat_g) && (
              <p className="text-sm text-nm-text/60 mt-1">
                {meal.protein_g ? `P ${Math.round(meal.protein_g)}g` : ''}
                {meal.carbs_g ? ` · C ${Math.round(meal.carbs_g)}g` : ''}
                {meal.fat_g ? ` · F ${Math.round(meal.fat_g)}g` : ''}
              </p>
            )}
          </div>
          <span className="text-nm-signature font-bold text-lg ml-4 flex-shrink-0">
            {meal.estimated_calories ? `${meal.estimated_calories}` : '--'}
          </span>
        </div>
      </div>
    </div>
  );
}
