/**
 * App Header — extracted from design/home-dashboard.html lines 101-111.
 *
 * Stitch: header.bg-[#FFFAF5]/80.backdrop-blur-[24px].fixed.top-0.left-0.right-0.z-40.flex.justify-between.items-center.w-full.px-6.py-4
 *   Left: avatar (w-10 h-10 rounded-full) + "NomMigo" span.text-2xl.font-black.text-[#AA2C32].tracking-tighter
 *   Right: notifications button with bg-surface-container-low rounded-full
 *
 * Using sticky instead of fixed since it's inside the AppShell max-w container.
 */

interface AppHeaderProps {
  avatarUrl?: string;
  onNotificationClick?: () => void;
  onAvatarClick?: () => void;
}

export function AppHeader({ avatarUrl, onNotificationClick, onAvatarClick }: AppHeaderProps) {
  return (
    <header className="bg-[#FFFAF5]/80 backdrop-blur-[24px] sticky top-0 z-40 flex justify-between items-center w-full px-6 py-4">
      <div className="flex items-center gap-3">
        {/* Stitch: w-10 h-10 rounded-full bg-primary-container overflow-hidden */}
        <button onClick={onAvatarClick} className="w-10 h-10 rounded-full bg-nm-signature-light overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-nm-surface-high flex items-center justify-center">
              <span className="material-symbols-outlined text-nm-text/40">person</span>
            </div>
          )}
        </button>
        {/* Stitch: span.text-2xl.font-black.text-[#AA2C32].tracking-tighter */}
        <span className="text-2xl font-black text-nm-signature tracking-tighter">NomMigo</span>
      </div>
      {/* Stitch: button.material-symbols-outlined.text-[#AA2C32].p-2.bg-surface-container-low.rounded-full */}
      <button
        onClick={onNotificationClick}
        className="material-symbols-outlined text-nm-signature hover:opacity-80 transition-opacity p-2 bg-nm-surface-low rounded-full"
      >
        notifications
      </button>
    </header>
  );
}
