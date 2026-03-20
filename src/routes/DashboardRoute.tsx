import { useNavigate } from 'react-router-dom';
import { useProfile } from '../contexts/ProfileContext';
import { Dashboard } from '../components/Dashboard';
import type { DiningContext } from '../types';

export function DashboardRoute() {
  const navigate = useNavigate();
  const { userId, userEmail } = useProfile();

  return (
    <Dashboard
      userId={userId}
      userEmail={userEmail}
      onNavigate={(screen) => {
        const map: Record<string, string> = {
          'dashboard': '/', 'diary': '/diary', 'chat': '/chat',
          'profile': '/profile', 'scanner': '/scanner', 'history': '/history',
          'food-dna': '/profile/food-dna', 'my-goals': '/profile/goals',
          'progress': '/profile/progress', 'settings': '/profile/settings',
          'about': '/profile/about', 'friends': '/profile/friends',
        };
        navigate(map[screen] || '/');
      }}
      onScan={() => navigate('/scanner')}
      onFindRestaurant={(context: DiningContext, message: string) => {
        navigate('/chat', { state: { diningContext: context, autoMessage: message } });
      }}
    />
  );
}
