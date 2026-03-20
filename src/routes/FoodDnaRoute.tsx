import { useNavigate } from 'react-router-dom';
import { FoodDnaHub } from '../components/food-dna';

export function FoodDnaRoute() {
  const navigate = useNavigate();
  return <FoodDnaHub onBack={() => navigate('/profile')} />;
}
