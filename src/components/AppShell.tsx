import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { NavBar } from './ui/NavBar';
import { AppHeader } from './ui/AppHeader';
import { QuickAddModal } from './diary/QuickAddModal';
import { ErrorToast } from './ui/Toast';
import { useUI } from '../contexts/UIContext';
import { useProfile } from '../contexts/ProfileContext';
import { useMeals } from '../hooks/useMeals';
import type { Screen } from '../types';

const HIDE_NAV_PATHS = ['/onboarding', '/swipe', '/nutrition'];
const HIDE_HEADER_PATHS = ['/onboarding', '/swipe', '/nutrition'];

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showQuickAdd, setShowQuickAdd, errorMessage, showError, clearError } = useUI();
  const { userId } = useProfile();
  const { addMeal } = useMeals(userId);

  const showNav = !HIDE_NAV_PATHS.includes(location.pathname);
  const showHeader = !HIDE_HEADER_PATHS.includes(location.pathname);

  return (
    <div className="max-w-md mx-auto bg-nm-bg min-h-screen">
      {showHeader && (
        <AppHeader
          onAvatarClick={() => navigate('/profile')}
          onNotificationClick={() => {/* TODO: notifications */}}
        />
      )}
      <Outlet />

      {showNav && (
        <NavBar
          currentScreen={pathnameToScreen(location.pathname) as Screen}
          onNavigate={(screen) => navigate(screenToPath(screen))}
          onQuickAdd={() => {
            if (location.pathname !== '/diary') navigate('/diary');
            setShowQuickAdd(true);
          }}
          onScanMenu={() => navigate('/scanner')}
        />
      )}

      {errorMessage && (
        <ErrorToast message={errorMessage} onDismiss={clearError} />
      )}

      {showQuickAdd && (
        <QuickAddModal
          onSave={async (data) => {
            const result = await addMeal({
              meal_name: data.meal_name,
              meal_type: data.meal_type,
              feeling: data.feeling,
              notes: data.notes,
              nutrition: data.nutrition,
            });
            if (result.error) {
              showError(`Failed to save: ${result.error}`);
              return;
            }
            setShowQuickAdd(false);
          }}
          onClose={() => setShowQuickAdd(false)}
        />
      )}
    </div>
  );
}

// Translate pathname back to Screen type for BottomNav compatibility
function pathnameToScreen(pathname: string): string {
  const map: Record<string, string> = {
    '/': 'dashboard',
    '/diary': 'diary',
    '/chat': 'chat',
    '/profile': 'profile',
    '/scanner': 'scanner',
    '/recommendations': 'recommendations',
    '/history': 'history',
    '/profile/food-dna': 'food-dna',
    '/profile/goals': 'my-goals',
    '/profile/progress': 'progress',
    '/profile/settings': 'settings',
    '/profile/about': 'about',
    '/profile/friends': 'friends',
  };
  return map[pathname] || 'dashboard';
}

// Translate Screen type to pathname for BottomNav compatibility
function screenToPath(screen: string): string {
  const map: Record<string, string> = {
    'dashboard': '/',
    'diary': '/diary',
    'chat': '/chat',
    'profile': '/profile',
    'scanner': '/scanner',
    'recommendations': '/recommendations',
    'history': '/history',
    'food-dna': '/profile/food-dna',
    'my-goals': '/profile/goals',
    'progress': '/profile/progress',
    'settings': '/profile/settings',
    'about': '/profile/about',
    'friends': '/profile/friends',
  };
  return map[screen] || '/';
}
