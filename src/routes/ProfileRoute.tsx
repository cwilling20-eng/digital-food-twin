import { useNavigate } from 'react-router-dom';
import { useProfile } from '../contexts/ProfileContext';
import { MoreMenu } from '../components/more/MoreMenu';

export function ProfileRoute() {
  const navigate = useNavigate();
  const { userEmail, handleLogout } = useProfile();

  return (
    <MoreMenu
      userEmail={userEmail}
      onNavigate={(screen) => {
        const map: Record<string, string> = {
          'dashboard': '/', 'diary': '/diary', 'chat': '/chat',
          'profile': '/profile', 'food-dna': '/profile/food-dna',
          'my-goals': '/profile/goals', 'progress': '/profile/progress',
          'settings': '/profile/settings', 'about': '/profile/about',
          'friends': '/profile/friends', 'history': '/history',
        };
        navigate(map[screen] || '/');
      }}
      onLogout={handleLogout}
    />
  );
}
