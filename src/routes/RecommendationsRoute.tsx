import { useNavigate, useLocation } from 'react-router-dom';
import { useProfile } from '../contexts/ProfileContext';
import { useUI } from '../contexts/UIContext';
import { ChatResults } from '../components/ChatResults';

export function RecommendationsRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, comprehensiveProfile } = useProfile();
  const { setShowQuickAdd } = useUI();

  const state = location.state as { apiRecommendations?: any } | null;
  const apiRecommendations = state?.apiRecommendations;

  const initialAnalysis = apiRecommendations?.output
    || JSON.stringify(apiRecommendations?.recommendations || apiRecommendations || {}, null, 2);

  return (
    <ChatResults
      initialAnalysis={initialAnalysis}
      userProfile={comprehensiveProfile}
      userId={userId}
      onBack={() => navigate('/')}
      onLogMeal={() => {
        navigate('/diary');
        setShowQuickAdd(true);
      }}
    />
  );
}
