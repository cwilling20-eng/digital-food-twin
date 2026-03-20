import { useNavigate } from 'react-router-dom';
import { useProfile } from '../contexts/ProfileContext';
import { OnboardingScreen } from '../components/OnboardingScreen';

export function OnboardingRoute() {
  const navigate = useNavigate();
  const { profile } = useProfile();

  // If already onboarded, redirect to dashboard
  if (profile.onboardingComplete) {
    navigate('/', { replace: true });
    return null;
  }

  return <OnboardingScreen onStart={() => navigate('/swipe')} />;
}
