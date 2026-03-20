import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { NutritionSummary } from '../components/nutrition/NutritionSummary';

export function NutritionRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const { nutritionGoals } = useApp();

  const state = location.state as { meals?: any[]; date?: string } | null;

  return (
    <NutritionSummary
      meals={state?.meals || []}
      goals={{
        calorieGoal: nutritionGoals.calorieGoal,
        proteinGoal: nutritionGoals.proteinGoal,
        carbsGoal: nutritionGoals.carbsGoal,
        fatGoal: nutritionGoals.fatGoal,
      }}
      date={state?.date ? new Date(state.date) : new Date()}
      onBack={() => navigate('/diary')}
    />
  );
}
