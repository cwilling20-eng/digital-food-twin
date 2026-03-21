/**
 * App Header — extracted from design/home-dashboard.html lines 101-111.
 */

import { useState } from 'react';

interface AppHeaderProps {
  avatarUrl?: string;
  onNotificationClick?: () => void;
  onAvatarClick?: () => void;
}

export function AppHeader({ avatarUrl, onNotificationClick, onAvatarClick }: AppHeaderProps) {
  const [showToast, setShowToast] = useState(false);

  const handleNotificationClick = () => {
    if (onNotificationClick) {
      onNotificationClick();
    } else {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    }
  };

  return (
    <>
      <header className="bg-[#FFFAF5]/80 backdrop-blur-[24px] sticky top-0 z-40 flex justify-between items-center w-full px-6 py-4">
        <div className="flex items-center gap-3">
          <button onClick={onAvatarClick} className="w-10 h-10 rounded-full bg-nm-signature-light overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-nm-surface-high flex items-center justify-center">
                <span className="material-symbols-outlined text-nm-text/40">person</span>
              </div>
            )}
          </button>
          <span className="text-2xl font-black text-nm-signature tracking-tighter">NomMigo</span>
        </div>
        <button
          onClick={handleNotificationClick}
          className="material-symbols-outlined text-nm-signature hover:opacity-80 transition-opacity p-2 bg-nm-surface-low rounded-full"
        >
          notifications
        </button>
      </header>

      {showToast && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-nm-text text-white px-6 py-3 rounded-full shadow-nm-float z-[70] flex items-center gap-2 animate-fade-in">
          <span className="text-sm font-bold">Notifications coming soon!</span>
        </div>
      )}
    </>
  );
}
