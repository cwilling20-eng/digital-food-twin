import { useNavigate } from 'react-router-dom';
import { useProfile } from '../contexts/ProfileContext';
import { SettingsScreen } from '../components/more/SettingsScreen';

export function SettingsRoute() {
  const navigate = useNavigate();
  const { userEmail, handleLogout } = useProfile();

  return (
    <SettingsScreen
      userEmail={userEmail}
      onLogout={handleLogout}
      onBack={() => navigate('/profile')}
    />
  );
}
