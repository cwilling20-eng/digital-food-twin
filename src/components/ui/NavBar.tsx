import { useState, useEffect, useRef } from 'react';
import type { Screen } from '../../types';

interface NavBarProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  onQuickAdd?: () => void;
  onScanMenu?: () => void;
}

/**
 * Floating pill nav bar — extracted directly from design/home-dashboard.html lines 250-280.
 *
 * Stitch structure:
 *   nav.fixed.bottom-0.z-50 > div.bg-[#FFFAF5]/80.backdrop-blur-[20px].shadow-[...].rounded-full.w-[90%].max-w-md.mx-auto.p-2
 *     4 tabs + center FAB at relative -top-4
 *   Active tab: bg-gradient from-[#FF6B6B] to-[#FF8E8E] text-white rounded-full p-4 scale-110 shadow-lg
 *   Inactive tab: text-slate-400 p-2
 */
const NAV_ITEMS: { screen: Screen; icon: string; label: string }[] = [
  { screen: 'dashboard', icon: 'home', label: 'Home' },
  { screen: 'diary', icon: 'restaurant_menu', label: 'Meal Log' },
  // center FAB goes here
  { screen: 'social', icon: 'group', label: 'Social' },
  { screen: 'profile', icon: 'person', label: 'Profile' },
];

export function NavBar({ currentScreen, onNavigate, onQuickAdd, onScanMenu }: NavBarProps) {
  const [showActions, setShowActions] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showActions) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowActions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showActions]);

  const isActive = (screen: Screen) => {
    const profileSubScreens: string[] = ['food-dna', 'my-goals', 'progress', 'settings', 'about', 'history'];
    return (
      currentScreen === screen ||
      (screen === 'social' && (currentScreen === 'friends' || currentScreen === 'chat' || currentScreen === 'recommendations')) ||
      (screen === 'dashboard' && currentScreen === 'scanner') ||
      (screen === 'profile' && profileSubScreens.includes(currentScreen))
    );
  };

  return (
    <>
      {showActions && (
        <div className="fixed inset-0 bg-black/20 z-40 transition-opacity" />
      )}

      {/* Exact Stitch: nav.fixed.bottom-0.left-0.right-0.z-50.flex.justify-around.items-center.px-4.pb-8.pointer-events-none */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-4 pb-8 pointer-events-none">
        {/* Exact Stitch: div.bg-[#FFFAF5]/80.backdrop-blur-[20px].shadow-[0_20px_50px_rgba(255,107,107,0.15)].rounded-full.w-[90%].max-w-md.mx-auto.flex.justify-around.items-center.p-2.pointer-events-auto */}
        <div
          ref={menuRef}
          className="bg-[#FFFAF5]/80 backdrop-blur-[20px] shadow-[0_20px_50px_rgba(255,107,107,0.15)] rounded-full w-[90%] max-w-md mx-auto flex justify-around items-center p-2 pointer-events-auto"
        >
          {/* Home */}
          <NavTab screen="dashboard" icon="home" label="Home" active={isActive('dashboard')} onClick={() => onNavigate('dashboard')} />

          {/* Meal Log */}
          <NavTab screen="diary" icon="restaurant_menu" label="Meal Log" active={isActive('diary')} onClick={() => onNavigate('diary')} />

          {/* FAB Replacement (Central Action) — Stitch: div.relative.-top-4 > button.w-14.h-14.bg-primary.rounded-full.shadow-xl */}
          <div className="relative -top-4">
            {/* Fan-out actions */}
            <div
              className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-4 flex flex-col items-center gap-3 transition-all duration-300 ${
                showActions
                  ? 'opacity-100 translate-y-0 pointer-events-auto'
                  : 'opacity-0 translate-y-4 pointer-events-none'
              }`}
            >
              {onScanMenu && (
                <button
                  onClick={() => { setShowActions(false); onScanMenu(); }}
                  className="flex items-center gap-3 bg-white px-5 py-3 rounded-full shadow-[0_20px_50px_rgba(255,107,107,0.15)] min-w-[180px] active:scale-95 transition-transform"
                >
                  <div className="w-10 h-10 bg-nm-accent/15 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-nm-accent" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-nm-text">Scan Menu</p>
                    <p className="text-[10px] text-nm-text/50">Photo or upload</p>
                  </div>
                </button>
              )}
              {onQuickAdd && (
                <button
                  onClick={() => { setShowActions(false); onQuickAdd(); }}
                  className="flex items-center gap-3 bg-white px-5 py-3 rounded-full shadow-[0_20px_50px_rgba(255,107,107,0.15)] min-w-[180px] active:scale-95 transition-transform"
                >
                  <div className="w-10 h-10 bg-nm-signature/15 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-nm-signature" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-nm-text">Log Food</p>
                    <p className="text-[10px] text-nm-text/50">Quick add a meal</p>
                  </div>
                </button>
              )}
            </div>

            <button
              onClick={() => setShowActions((prev) => !prev)}
              className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all active:scale-95 ${
                showActions
                  ? 'bg-nm-text rotate-45'
                  : 'bg-nm-signature hover:scale-110'
              }`}
            >
              <span className="material-symbols-outlined text-white text-3xl">add</span>
            </button>
          </div>

          {/* Social */}
          <NavTab screen="social" icon="group" label="Social" active={isActive('social')} onClick={() => onNavigate('social')} />

          {/* Profile */}
          <NavTab screen="profile" icon="person" label="Profile" active={isActive('profile')} onClick={() => onNavigate('profile')} />
        </div>
      </nav>
    </>
  );
}

/**
 * Single nav tab — extracted from Stitch.
 * Active:  a.flex.flex-col.items-center.justify-center.bg-gradient-to-r.from-[#FF6B6B].to-[#FF8E8E].text-white.rounded-full.p-4.scale-110.shadow-lg
 * Inactive: a.flex.flex-col.items-center.justify-center.text-slate-400.p-2.hover:scale-105
 */
function NavTab({ screen, icon, label, active, onClick }: {
  screen: Screen; icon: string; label: string; active: boolean; onClick: () => void;
}) {
  if (active) {
    return (
      <button
        onClick={onClick}
        className="flex flex-col items-center justify-center bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] text-white rounded-full p-4 scale-110 shadow-lg transition-transform active:scale-90 duration-300 ease-out"
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        <span className="font-bold text-[10px] uppercase tracking-widest mt-1">{label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center text-slate-400 p-2 hover:scale-105 transition-transform active:scale-90 duration-300 ease-out"
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span className="font-bold text-[10px] uppercase tracking-widest mt-1">{label}</span>
    </button>
  );
}
