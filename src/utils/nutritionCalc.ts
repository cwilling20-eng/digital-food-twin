export interface BodyMetrics {
  startingWeight: number | null;
  currentWeight: number | null;
  goalWeight: number | null;
  heightFeet: number | null;
  heightInches: number | null;
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  weeklyWeightGoal: number;
  activityLevel: string;
  useCustomGoals: boolean;
}

export interface CalculatedGoals {
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  weightDifference: number;
  weeksToGoal: number | null;
  suggestedWeeklyGoal: number;
  hasConflict: boolean;
  conflictMessage?: string;
}

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9,
};

export function calculateAge(birthDate: string): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function totalHeightInches(feet: number | null, inches: number | null): number | null {
  if (feet === null) return null;
  return feet * 12 + (inches || 0);
}

export function feetFromTotalInches(total: number | null): { feet: number; inches: number } | null {
  if (total === null) return null;
  return { feet: Math.floor(total / 12), inches: total % 12 };
}

export function suggestWeeklyGoal(currentWeight: number, goalWeight: number): number {
  const weightDifference = Math.abs(goalWeight - currentWeight);

  if (weightDifference > 20) {
    return 1.5;
  } else if (weightDifference > 10) {
    return 1;
  } else if (weightDifference > 0) {
    return 0.5;
  } else {
    return 0;
  }
}

export function calculateGoals(metrics: BodyMetrics): CalculatedGoals | null {
  const { currentWeight, goalWeight, heightFeet, heightInches: hInches, birthDate, gender, weeklyWeightGoal, activityLevel } = metrics;

  if (!currentWeight || heightFeet === null || !birthDate || !gender) return null;

  const age = calculateAge(birthDate);
  if (!age || age < 1) return null;

  const heightTotal = totalHeightInches(heightFeet, hInches);
  if (!heightTotal) return null;

  const weightKg = currentWeight * 0.453592;
  const heightCm = heightTotal * 2.54;

  let bmr: number;
  if (gender === 'male') {
    bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
  } else {
    bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
  }

  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.2;
  const tdee = bmr * multiplier;

  const weightDifference = goalWeight !== null && currentWeight !== null ? goalWeight - currentWeight : 0;
  const wantsToLose = goalWeight !== null && currentWeight !== null && goalWeight < currentWeight;
  const wantsToGain = goalWeight !== null && currentWeight !== null && goalWeight > currentWeight;
  const caloriesPerPound = 3500;
  const dailyCalorieChange = (Math.abs(weeklyWeightGoal) * caloriesPerPound) / 7;

  let calorieGoal: number;
  if (wantsToLose) {
    calorieGoal = Math.round(tdee - dailyCalorieChange);
  } else if (wantsToGain) {
    calorieGoal = Math.round(tdee + dailyCalorieChange);
  } else {
    calorieGoal = Math.round(tdee);
  }

  calorieGoal = Math.max(1200, calorieGoal);

  const proteinGoal = Math.round((calorieGoal * 0.30) / 4);
  const carbsGoal = Math.round((calorieGoal * 0.40) / 4);
  const fatGoal = Math.round((calorieGoal * 0.30) / 9);

  const suggestedWeeklyGoal = goalWeight !== null && currentWeight !== null ? suggestWeeklyGoal(currentWeight, goalWeight) : 0;
  const weeksToGoal = weeklyWeightGoal !== 0 && weightDifference !== 0 ? Math.abs(weightDifference / Math.abs(weeklyWeightGoal)) : null;

  let hasConflict = false;
  let conflictMessage = undefined;

  return {
    calorieGoal,
    proteinGoal,
    carbsGoal,
    fatGoal,
    weightDifference,
    weeksToGoal,
    suggestedWeeklyGoal,
    hasConflict,
    conflictMessage
  };
}

export const WEEKLY_GOAL_OPTIONS = [
  { value: 2, label: '2 lbs/week', sublabel: 'Aggressive' },
  { value: 1.5, label: '1.5 lbs/week', sublabel: '' },
  { value: 1, label: '1 lb/week', sublabel: 'Recommended' },
  { value: 0.5, label: '0.5 lbs/week', sublabel: 'Gradual' },
  { value: 0, label: 'Maintain weight', sublabel: '' },
];

export const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentary', sublabel: 'Little or no exercise' },
  { value: 'lightly_active', label: 'Lightly Active', sublabel: 'Light exercise 1-3 days/week' },
  { value: 'moderately_active', label: 'Moderately Active', sublabel: 'Moderate exercise 3-5 days/week' },
  { value: 'very_active', label: 'Very Active', sublabel: 'Hard exercise 6-7 days/week' },
  { value: 'extremely_active', label: 'Extremely Active', sublabel: 'Very hard exercise, physical job' },
];

export const DEFAULT_BODY_METRICS: BodyMetrics = {
  startingWeight: null,
  currentWeight: null,
  goalWeight: null,
  heightFeet: null,
  heightInches: null,
  birthDate: '',
  gender: 'male',
  weeklyWeightGoal: 1,
  activityLevel: 'sedentary',
  useCustomGoals: true,
};
