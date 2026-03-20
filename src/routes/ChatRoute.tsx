import { useNavigate, useLocation } from 'react-router-dom';
import { useProfile } from '../contexts/ProfileContext';
import { useUI } from '../contexts/UIContext';
import { ChatResults } from '../components/ChatResults';
import type { DiningContext } from '../types';

export function ChatRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, comprehensiveProfile } = useProfile();
  const { setShowQuickAdd } = useUI();

  const state = location.state as {
    diningContext?: DiningContext;
    autoMessage?: string;
  } | null;

  return (
    <ChatResults
      userProfile={comprehensiveProfile}
      userId={userId}
      onBack={() => navigate('/')}
      diningContext={state?.diningContext}
      autoMessage={state?.autoMessage}
      onLogMeal={() => {
        navigate('/diary');
        setShowQuickAdd(true);
      }}
    />
  );
}
