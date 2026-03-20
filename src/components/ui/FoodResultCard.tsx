/**
 * Food Result Card — extracted from design/menu-scanner.html.
 *
 * Top Pick (#1) — Stitch lines 133-183: Full hero image + overlay match badge + p-8 content + macro pills + explanation + CTA
 * Picks #2/#3 — Stitch lines 185-220: Compact card with h-40 image + match badge + text + add button
 */

interface FoodResultCardProps {
  dishName: string;
  matchPercentage?: number;
  calories?: number;
  caloriesLabel?: string;
  protein?: number;
  carbs?: number;
  fat?: number;
  explanation?: string;
  imageUrl?: string;
  imageAlt?: string;
  rank?: number;
  onLog?: () => void;
  className?: string;
  variant?: 'hero' | 'compact';
}

export function FoodResultCard({
  dishName,
  matchPercentage,
  calories,
  caloriesLabel,
  protein,
  carbs,
  fat,
  explanation,
  imageUrl,
  imageAlt,
  rank,
  onLog,
  className = '',
  variant = imageUrl ? 'hero' : 'compact',
}: FoodResultCardProps) {
  const hasMacros = protein != null || carbs != null || fat != null;

  // ── Hero variant (Top Pick #1) ── Stitch lines 133-183
  if (variant === 'hero' && imageUrl) {
    return (
      <div className={`relative group ${className}`}>
        {/* Match badge overlay — Stitch: absolute top-4 right-4 z-10 bg-gradient-to-r from-primary to-primary-container */}
        {matchPercentage != null && (
          <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-nm-signature to-nm-signature-light text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-1">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            {matchPercentage}% Match
          </div>
        )}

        {/* Stitch: bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_40px_60px_-15px_rgba(170,44,50,0.06)] */}
        <div className="bg-white rounded-xl overflow-hidden shadow-[0_40px_60px_-15px_rgba(255,107,107,0.06)]">
          {/* Stitch: h-64 w-full relative */}
          <div className="h-64 w-full relative">
            <img className="w-full h-full object-cover" src={imageUrl} alt={imageAlt || dishName} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>

          {/* Stitch: p-8 space-y-6 */}
          <div className="p-8 space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-nm-text">{dishName}</h3>
              {(calories != null || caloriesLabel) && (
                <p className="text-nm-text/50 font-medium mt-1">{caloriesLabel || `${calories} kcal`}</p>
              )}
            </div>

            {/* Macro pills — Stitch: flex gap-3, px-4 py-2 rounded-lg */}
            {hasMacros && (
              <div className="flex gap-3">
                {protein != null && (
                  <div className="px-4 py-2 rounded-[1rem] bg-nm-success/20 flex flex-col items-center min-w-[70px]">
                    <span className="text-[10px] uppercase font-bold text-nm-success">Prot</span>
                    <span className="text-lg font-bold text-nm-success">{protein}g</span>
                  </div>
                )}
                {carbs != null && (
                  <div className="px-4 py-2 rounded-[1rem] bg-nm-accent/20 flex flex-col items-center min-w-[70px]">
                    <span className="text-[10px] uppercase font-bold text-nm-accent">Carb</span>
                    <span className="text-lg font-bold text-nm-accent">{carbs}g</span>
                  </div>
                )}
                {fat != null && (
                  <div className="px-4 py-2 rounded-[1rem] bg-nm-signature/10 flex flex-col items-center min-w-[70px]">
                    <span className="text-[10px] uppercase font-bold text-nm-signature">Fat</span>
                    <span className="text-lg font-bold text-nm-signature">{fat}g</span>
                  </div>
                )}
              </div>
            )}

            {/* Explanation — Stitch: bg-surface-container-low p-6 rounded-lg with left accent bar */}
            {explanation && (
              <div className="bg-nm-surface-low p-6 rounded-[2rem] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-nm-signature" />
                <h4 className="font-bold text-nm-signature flex items-center gap-2 mb-2 pl-2">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  Why NomMigo chose this
                </h4>
                <p className="text-nm-text/50 leading-relaxed text-sm pl-2">{explanation}</p>
              </div>
            )}

            {/* CTA — Stitch: w-full py-5 rounded-xl bg-gradient-to-r */}
            {onLog && (
              <button
                onClick={onLog}
                className="w-full py-5 rounded-xl bg-gradient-to-r from-nm-signature to-nm-signature-light text-white font-extrabold text-lg shadow-[0_20px_40px_rgba(255,107,107,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Log this meal
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Compact variant (Picks #2/#3) ── Stitch lines 187-219
  return (
    <div className={`bg-white rounded-xl p-4 shadow-[0_20px_40px_rgba(0,0,0,0.03)] space-y-4 flex flex-col ${className}`}>
      {imageUrl && (
        <div className="relative h-40 rounded-[1rem] overflow-hidden">
          <img className="w-full h-full object-cover" src={imageUrl} alt={imageAlt || dishName} />
          {matchPercentage != null && (
            <span className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-nm-signature shadow-sm">
              {matchPercentage}% Match
            </span>
          )}
        </div>
      )}
      <div className="flex-1 space-y-2">
        <h4 className="font-bold text-nm-text">{dishName}</h4>
        {explanation && <p className="text-xs text-nm-text/50 line-clamp-2">{explanation}</p>}
      </div>
      <div className="flex items-center justify-between pt-2">
        <span className="text-sm font-bold text-nm-text">{calories ? `${calories} kcal` : ''}</span>
        {onLog && (
          <button
            onClick={onLog}
            className="bg-nm-surface-low p-2.5 rounded-full text-nm-signature hover:bg-nm-signature hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-lg">add</span>
          </button>
        )}
      </div>
    </div>
  );
}
