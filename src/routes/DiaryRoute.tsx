import { useNavigate } from 'react-router-dom';
import { useProfile } from '../contexts/ProfileContext';
import { useUI } from '../contexts/UIContext';
import { DiaryScreen } from '../components/diary/DiaryScreen';
import type { MealData } from '../components/nutrition/types';

export function DiaryRoute() {
  const navigate = useNavigate();
  const { userId } = useProfile();
  const { setShowQuickAdd } = useUI();

  return (
    <DiaryScreen
      userId={userId}
      onOpenQuickAdd={() => setShowQuickAdd(true)}
      onOpenNutrition={(meals: MealData[], date: Date) => {
        navigate('/nutrition', { state: { meals, date: date.toISOString() } });
      }}
    />
  );
}
