/**
 * Meal Card — extracted from design/home-dashboard.html lines 196-205.
 *
 * Stitch structure:
 *   div.min-w-[180px].bg-surface-container-lowest.rounded-lg.p-4.shadow-sm.space-y-3.shrink-0
 *     div.w-full.h-32.bg-surface-container-low.rounded-lg.overflow-hidden > img
 *     div > span.text-[10px].font-bold.text-on-surface-variant.uppercase.tracking-widest + h4.font-extrabold.text-sm.truncate + p.text-xs.font-bold.text-primary
 */

interface MealCardProps {
  mealType: string;
  mealName: string;
  calories: number;
  imageUrl?: string;
  imageAlt?: string;
  onClick?: () => void;
  className?: string;
}

export function MealCard({
  mealType,
  mealName,
  calories,
  imageUrl,
  imageAlt,
  onClick,
  className = '',
}: MealCardProps) {
  return (
    <button
      onClick={onClick}
      className={`min-w-[180px] bg-white rounded-[2rem] p-4 shadow-sm space-y-3 shrink-0 text-left active:scale-95 transition-transform ${className}`}
    >
      {/* Stitch: w-full h-32 bg-surface-container-low rounded-lg overflow-hidden */}
      <div className="w-full h-32 bg-nm-surface-low rounded-[2rem] overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={imageAlt || mealName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-nm-text/20">restaurant</span>
          </div>
        )}
      </div>
      <div>
        {/* Stitch: text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1 */}
        <span className="text-[10px] font-bold text-nm-text/50 uppercase tracking-widest block mb-1">
          {mealType}
        </span>
        {/* Stitch: font-extrabold text-sm truncate */}
        <h4 className="font-extrabold text-sm text-nm-text truncate">{mealName}</h4>
        {/* Stitch: text-xs font-bold text-primary mt-1 */}
        <p className="text-xs font-bold text-nm-signature mt-1">{calories} kcal</p>
      </div>
    </button>
  );
}
