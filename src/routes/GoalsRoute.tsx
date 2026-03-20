import { useNavigate } from 'react-router-dom';
import { useProfile } from '../contexts/ProfileContext';
import { useApp } from '../contexts/AppContext';
import { MyGoalsScreen } from '../components/more/MyGoalsScreen';
import { supabase } from '../lib/supabase';
import { totalHeightInches } from '../utils/nutritionCalc';

export function GoalsRoute() {
  const navigate = useNavigate();
  const { userId } = useProfile();
  const { setNutritionGoals, setBodyMetrics } = useApp();

  return (
    <MyGoalsScreen
      onSave={async (newGoals, newMetrics) => {
        if (!userId) return { error: 'Not signed in' };
        const { error } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: userId,
            calorie_goal: newGoals.calorieGoal,
            protein_goal: newGoals.proteinGoal,
            carbs_goal: newGoals.carbsGoal,
            fat_goal: newGoals.fatGoal,
            water_goal: newGoals.waterGoal,
            starting_weight: newMetrics.startingWeight,
            current_weight: newMetrics.currentWeight,
            goal_weight: newMetrics.goalWeight,
            height_inches: totalHeightInches(newMetrics.heightFeet, newMetrics.heightInches),
            birth_date: newMetrics.birthDate || null,
            gender: newMetrics.gender,
            weekly_weight_goal: newMetrics.weeklyWeightGoal,
            activity_level: newMetrics.activityLevel,
            use_custom_goals: newMetrics.useCustomGoals,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
        if (error) return { error: error.message };
        setNutritionGoals(newGoals);
        setBodyMetrics(newMetrics);
        return {};
      }}
      onBack={() => navigate('/profile')}
    />
  );
}
