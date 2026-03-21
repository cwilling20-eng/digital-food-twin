import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { NavBar } from './ui/NavBar';
import { AppHeader } from './ui/AppHeader';
import { QuickAddModal } from './diary/QuickAddModal';
import { ErrorToast } from './ui/Toast';
import { useUI } from '../contexts/UIContext';
import { useProfile } from '../contexts/ProfileContext';
import { usePublicProfile } from '../hooks/usePublicProfile';
import { useMeals } from '../hooks/useMeals';
import type { Screen } from '../types';

const HIDE_NAV_PATHS = ['/onboarding', '/swipe', '/nutrition'];
const HIDE_HEADER_PATHS = ['/onboarding', '/swipe', '/nutrition'];

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showQuickAdd, setShowQuickAdd, quickAddPrefill, clearQuickAddPrefill, errorMessage, showError, clearError } = useUI();
  const { userId } = useProfile();
  const { addMeal } = useMeals(userId);
  const { publicProfile } = usePublicProfile(userId);

  const showNav = !HIDE_NAV_PATHS.includes(location.pathname);
  const showHeader = !HIDE_HEADER_PATHS.includes(location.pathname);

  // Derive avatar URL — show uploaded image if it's a URL, otherwise undefined
  const avatarUrl = publicProfile?.avatarUrl?.startsWith('http') ? publicProfile.avatarUrl : undefined;

  return (
    <div className="max-w-md mx-auto bg-nm-bg min-h-screen">
      {showHeader && (
        <AppHeader
          avatarUrl={avatarUrl}
          onAvatarClick={() => navigate('/profile')}
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
          prefill={quickAddPrefill ?? undefined}
          onSave={async (data) => {
            const result = await addMeal({
              meal_name: data.meal_name,
              meal_type: data.meal_type,
              feeling: data.feeling,
              notes: data.notes,
              nutrition: data.nutrition,
              quantity: data.quantity,
              unit: data.unit,
              nutrition_source: data.nutrition_source,
              per_unit_nutrition: data.per_unit_nutrition,
            });
            if (result.error) {
              showError(`Failed to save: ${result.error}`);
              return;
            }
            setShowQuickAdd(false);
            clearQuickAddPrefill();
          }}
          onClose={() => { setShowQuickAdd(false); clearQuickAddPrefill(); }}
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
    '/social': 'social',
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
    'social': '/social',
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
