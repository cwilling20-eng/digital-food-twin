import { useNavigate } from 'react-router-dom';
import { AboutScreen } from '../components/more/AboutScreen';

export function AboutRoute() {
  const navigate = useNavigate();
  return <AboutScreen onBack={() => navigate('/profile')} />;
}
