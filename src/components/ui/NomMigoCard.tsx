/**
 * AI Recommendation Card — extracted from design/home-dashboard.html lines 159-187.
 *
 * Stitch structure:
 *   div.bg-inverse-surface.text-surface.rounded-lg.p-1.overflow-hidden.soft-brutalist-shadow
 *     div.p-6.space-y-4
 *       header: auto_awesome icon + "NomMigo thinks you'd love..." in text-xs.font-bold.uppercase.tracking-widest.text-primary-container
 *       content row: w-32 h-32 image + title + description + badge pills
 *       CTA: w-full py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary font-black rounded-full
 */

interface NomMigoCardProps {
  title?: string;
  dishName: string;
  description: string;
  imageUrl?: string;
  imageAlt?: string;
  badges?: string[];
  ctaLabel?: string;
  onCtaClick?: () => void;
  className?: string;
}

export function NomMigoCard({
  title = "NomMigo thinks you'd love...",
  dishName,
  description,
  imageUrl,
  imageAlt,
  badges = [],
  ctaLabel = 'Log this Nom',
  onCtaClick,
  className = '',
}: NomMigoCardProps) {
  return (
    // Stitch: bg-inverse-surface → #0c0c1f ≈ nm-text (#1A1A2E). rounded-lg → 2rem. p-1. soft-brutalist-shadow
    <div className={`bg-[#1A1A2E] rounded-[2rem] p-1 overflow-hidden shadow-[0_40px_60px_-15px_rgba(255,107,107,0.08)] ${className}`}>
      <div className="p-6 space-y-4">
        {/* Stitch: auto_awesome icon FILL 1 + label text-xs font-bold uppercase tracking-widest text-primary-container (#ff7574) */}
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-[#FF7574]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
          <span className="text-xs font-bold uppercase tracking-widest text-[#FF7574]">
            {title}
          </span>
        </div>

        {/* Stitch: flex gap-4. Image: w-32 h-32 rounded-lg. Text: flex flex-col justify-between py-1 */}
        <div className="flex gap-4">
          <div className="w-32 h-32 rounded-[2rem] overflow-hidden shrink-0 bg-white/10">
            {imageUrl ? (
              <img src={imageUrl} alt={imageAlt || dishName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-white/20">restaurant</span>
              </div>
            )}
          </div>
          <div className="flex flex-col justify-between py-1">
            <div>
              {/* Stitch: text-xl font-extrabold leading-tight (white on dark bg) */}
              <h3 className="text-xl font-extrabold leading-tight text-white">{dishName}</h3>
              {/* Stitch: text-sm text-surface-dim mt-2 leading-relaxed */}
              <p className="text-sm text-white/40 mt-2 leading-relaxed">{description}</p>
            </div>
            {/* Stitch: badges - bg-tertiary text-on-tertiary + bg-primary text-on-primary, px-3 py-1 rounded-full text-[10px] font-black uppercase */}
            {badges.length > 0 && (
              <div className="flex items-center gap-2 mt-4">
                {badges.map((badge, i) => (
                  <span
                    key={badge}
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      i === 0
                        ? 'bg-nm-success text-[#1A1A2E]'
                        : 'bg-nm-signature text-white'
                    }`}
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stitch: w-full py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary font-black rounded-full text-sm uppercase tracking-widest mt-4 active:scale-95 */}
        <button
          onClick={onCtaClick}
          className="w-full py-4 bg-gradient-to-r from-nm-signature to-nm-signature-light text-white font-black rounded-full text-sm uppercase tracking-widest mt-4 active:scale-95 transition-transform"
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
