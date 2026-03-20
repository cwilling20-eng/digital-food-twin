import { useNavigate } from 'react-router-dom';
import { useProfile } from '../contexts/ProfileContext';
import { FriendsScreen } from '../components/friends';
import type { DiningContext } from '../types';

export function FriendsRoute() {
  const navigate = useNavigate();
  const { userId } = useProfile();

  return (
    <FriendsScreen
      userId={userId}
      onNavigate={(screen) => {
        const map: Record<string, string> = {
          'dashboard': '/', 'diary': '/diary', 'chat': '/chat',
          'profile': '/profile', 'friends': '/profile/friends',
        };
        navigate(map[screen] || '/');
      }}
      onPlanDinner={(friendIds: string[], friendNames: string[]) => {
        const context: DiningContext = {
          isGroupDining: true,
          selectedFriendIds: friendIds,
          selectedFriendNames: friendNames,
          mealType: 'dinner',
          cuisinePreference: 'surprise_me',
        };
        navigate('/chat', { state: { diningContext: context } });
      }}
    />
  );
}
