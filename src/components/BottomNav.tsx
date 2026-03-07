import { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, BookOpen, MessageCircle, User, Plus, X, Utensils, ScanLine } from 'lucide-react';
import type { Screen } from '../types';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  onQuickAdd?: () => void;
  onScanMenu?: () => void;
}

export function BottomNav({ currentScreen, onNavigate, onQuickAdd, onScanMenu }: BottomNavProps) {
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

  const navItems: { screen: Screen; icon: React.ReactNode; label: string }[] = [
    { screen: 'dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
    { screen: 'diary', icon: <BookOpen className="w-5 h-5" />, label: 'Diary' },
    { screen: 'chat', icon: <MessageCircle className="w-5 h-5" />, label: 'Chat' },
    { screen: 'profile', icon: <User className="w-5 h-5" />, label: 'More' },
  ];

  return (
    <>
      {showActions && (
        <div className="fixed inset-0 bg-black/30 z-30 transition-opacity" />
      )}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div ref={menuRef}>
          {(onQuickAdd || onScanMenu) && (
            <>
              <div
                className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 flex flex-col items-center gap-2 transition-all duration-200 ${
                  showActions ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
                }`}
              >
                {onScanMenu && (
                  <button
                    onClick={() => {
                      setShowActions(false);
                      onScanMenu();
                    }}
                    className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-xl border border-gray-100 hover:bg-gray-50 transition-colors min-w-[180px]"
                  >
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                      <ScanLine className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">Scan Menu</p>
                      <p className="text-[11px] text-gray-500">Photo or upload</p>
                    </div>
                  </button>
                )}
                {onQuickAdd && (
                  <button
                    onClick={() => {
                      setShowActions(false);
                      onQuickAdd();
                    }}
                    className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-xl border border-gray-100 hover:bg-gray-50 transition-colors min-w-[180px]"
                  >
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Utensils className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">Log Food</p>
                      <p className="text-[11px] text-gray-500">Quick add a meal</p>
                    </div>
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowActions(prev => !prev)}
                className={`absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 active:scale-95 z-50 ${
                  showActions
                    ? 'bg-gray-800 shadow-gray-800/30 rotate-0'
                    : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30'
                }`}
              >
                {showActions ? (
                  <X className="w-6 h-6 text-white" />
                ) : (
                  <Plus className="w-7 h-7 text-white" />
                )}
              </button>
            </>
          )}
        </div>
        <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
          {navItems.map(({ screen, icon, label }) => {
            const profileSubScreens: string[] = ['food-dna', 'my-goals', 'progress', 'settings', 'about', 'history'];
            const isActive = currentScreen === screen ||
              (screen === 'chat' && currentScreen === 'recommendations') ||
              (screen === 'dashboard' && currentScreen === 'scanner') ||
              (screen === 'profile' && profileSubScreens.includes(currentScreen));

            return (
              <button
                key={screen}
                onClick={() => onNavigate(screen)}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive
                    ? 'text-emerald-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {icon}
                <span className={`text-xs mt-1 ${isActive ? 'font-medium' : ''}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
