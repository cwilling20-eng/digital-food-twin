import { useNavigate } from 'react-router-dom';
import { ProgressScreen } from '../components/more/ProgressScreen';

export function ProgressRoute() {
  const navigate = useNavigate();
  return <ProgressScreen onBack={() => navigate('/profile')} />;
}
