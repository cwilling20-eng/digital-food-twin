import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft, Check, Scale, Ruler, Calendar, User,
  TrendingDown, Activity, Flame, Beef, Wheat, Droplets,
  ChevronDown, ToggleLeft, ToggleRight, Target
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import type { NutritionGoals } from '../../types';
import {
  BodyMetrics, calculateGoals, calculateAge, WEEKLY_GOAL_OPTIONS,
  ACTIVITY_OPTIONS, DEFAULT_BODY_METRICS
} from '../../utils/nutritionCalc';

interface MyGoalsScreenProps {
  onSave: (goals: NutritionGoals, metrics: BodyMetrics) => Promise<{ error?: string }>;
  onBack: () => void;
}

export function MyGoalsScreen({ onSave, onBack }: MyGoalsScreenProps) {
  const { nutritionGoals: goals, bodyMetrics } = useApp();
  const [metrics, setMetrics] = useState<BodyMetrics>({ ...DEFAULT_BODY_METRICS, ...bodyMetrics });
  const [customGoals, setCustomGoals] = useState<NutritionGoals>({ ...goals });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [calculated, setCalculated] = useState<ReturnType<typeof calculateGoals>>(null);

  useEffect(() => {
    setMetrics({ ...DEFAULT_BODY_METRICS, ...bodyMetrics });
  }, [bodyMetrics]);

  useEffect(() => {
    setCustomGoals({ ...goals });
  }, [goals]);

  useEffect(() => {
    console.log("🔄 Recalculating! Metrics:", {
      currentWeight: metrics.currentWeight,
      goalWeight: metrics.goalWeight,
      weeklyWeightGoal: metrics.weeklyWeightGoal,
      heightFeet: metrics.heightFeet,
      heightInches: metrics.heightInches,
      birthDate: metrics.birthDate,
      gender: metrics.gender,
      activityLevel: metrics.activityLevel
    });
    const result = calculateGoals(metrics);
    console.log("📊 Calculation result:", result);
    setCalculated(result);
  }, [
    metrics.currentWeight,
    metrics.goalWeight,
    metrics.heightFeet,
    metrics.heightInches,
    metrics.birthDate,
    metrics.gender,
    metrics.activityLevel,
    metrics.weeklyWeightGoal
  ]);

  const age = useMemo(() => metrics.birthDate ? calculateAge(metrics.birthDate) : null, [metrics.birthDate]);

  const goalsToSave = useMemo((): NutritionGoals => {
    if (metrics.useCustomGoals) return customGoals;
    if (calculated) {
      return {
        ...customGoals,
        calorieGoal: calculated.calorieGoal,
        proteinGoal: calculated.proteinGoal,
        carbsGoal: calculated.carbsGoal,
        fatGoal: calculated.fatGoal,
      };
    }
    return customGoals;
  }, [metrics.useCustomGoals, customGoals, calculated]);

  const weightToGo = (metrics.currentWeight && metrics.goalWeight)
    ? Math.abs(metrics.currentWeight - metrics.goalWeight)
    : null;
  const goalReached = metrics.currentWeight !== null && metrics.goalWeight !== null && metrics.currentWeight === metrics.goalWeight;
  const weightProgress = (metrics.startingWeight && metrics.currentWeight && metrics.goalWeight && metrics.startingWeight !== metrics.goalWeight)
    ? Math.min(100, Math.max(0, ((metrics.startingWeight - metrics.currentWeight) / (metrics.startingWeight - metrics.goalWeight)) * 100))
    : 0;

  const handleSave = async () => {
    setSaveStatus('saving');
    setSaveError('');
    const result = await onSave(goalsToSave, metrics);
    if (result?.error) {
      setSaveStatus('error');
      setSaveError(result.error);
    } else {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const updateMetric = <K extends keyof BodyMetrics>(key: K, value: BodyMetrics[K]) => {
    console.log(`📝 Updating ${key} to:`, value);
    setMetrics(prev => ({ ...prev, [key]: value }));
    setSaveStatus('idle');
  };

  const updateCustomGoal = (key: keyof NutritionGoals, value: number) => {
    setCustomGoals(prev => ({ ...prev, [key]: value }));
    setSaveStatus('idle');
  };

  const weeklyLabel = WEEKLY_GOAL_OPTIONS.find(o => o.value === metrics.weeklyWeightGoal)?.label || 'Select...';
  const activityLabel = ACTIVITY_OPTIONS.find(o => o.value === metrics.activityLevel)?.label || 'Select...';

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="bg-white sticky top-0 z-30 shadow-sm">
        <div className="px-4 pt-12 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">My Goals</h1>
              <p className="text-xs text-gray-500 mt-0.5">Body metrics & nutrition targets</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-5">
        <BodyMetricsSection
          metrics={metrics}
          age={age}
          weightToGo={weightToGo}
          goalReached={goalReached}
          weightProgress={weightProgress}
          onUpdate={updateMetric}
        />

        <WeightPlanSection
          metrics={metrics}
          weeklyLabel={weeklyLabel}
          activityLabel={activityLabel}
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
          onUpdate={updateMetric}
          calculated={calculated}
        />

        <CalculatedSection calculated={calculated} />

        <GoalModeSection
          metrics={metrics}
          customGoals={customGoals}
          calculated={calculated}
          activeGoals={goalsToSave}
          onToggle={() => updateMetric('useCustomGoals', !metrics.useCustomGoals)}
          onUpdateGoal={updateCustomGoal}
        />

        <WaterGoalCard
          value={goalsToSave.waterGoal}
          onChange={(v) => updateCustomGoal('waterGoal', v)}
        />

        {saveStatus === 'error' && saveError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            {saveError}
          </div>
        )}

        <div className="pt-2 pb-4">
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className={`w-full py-4 rounded-2xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              saveStatus === 'saved'
                ? 'bg-emerald-500 text-white'
                : saveStatus === 'error'
                  ? 'bg-red-500 text-white'
                  : saveStatus === 'saving'
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 active:scale-[0.98]'
            }`}
          >
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'saved' && <><Check className="w-5 h-5" /> Saved!</>}
            {saveStatus === 'error' && 'Save Failed - Try Again'}
            {saveStatus === 'idle' && 'Save Goals'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{title}</h2>
    </div>
  );
}

function BodyMetricsSection({
  metrics, age, weightToGo, goalReached, weightProgress, onUpdate
}: {
  metrics: BodyMetrics;
  age: number | null;
  weightToGo: number | null;
  goalReached: boolean;
  weightProgress: number;
  onUpdate: <K extends keyof BodyMetrics>(key: K, value: BodyMetrics[K]) => void;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <SectionHeader icon={<Scale className="w-4 h-4 text-gray-500" />} title="Body Metrics" />

      {metrics.startingWeight && metrics.currentWeight && metrics.goalWeight && (
        <div className="mb-5 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">Progress to goal</span>
            <span className="text-xs font-bold text-emerald-600">
              {goalReached ? 'Goal reached!' : `${weightToGo?.toFixed(1)} lbs to go`}
            </span>
          </div>
          <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${weightProgress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-gray-400">{metrics.startingWeight} lbs</span>
            <span className="text-[10px] text-gray-400">{metrics.goalWeight} lbs</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-4">
        <NumberField
          label="Starting"
          value={metrics.startingWeight}
          unit="lbs"
          placeholder="180"
          onChange={(v) => onUpdate('startingWeight', v)}
        />
        <NumberField
          label="Current"
          value={metrics.currentWeight}
          unit="lbs"
          placeholder="175"
          onChange={(v) => onUpdate('currentWeight', v)}
        />
        <NumberField
          label="Goal"
          value={metrics.goalWeight}
          unit="lbs"
          placeholder="160"
          onChange={(v) => onUpdate('goalWeight', v)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
            <Ruler className="w-3 h-3 inline mr-1 opacity-60" />Height
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="number"
                value={metrics.heightFeet ?? ''}
                onChange={(e) => onUpdate('heightFeet', e.target.value ? Number(e.target.value) : null)}
                placeholder="5"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent pr-8"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">ft</span>
            </div>
            <div className="flex-1 relative">
              <input
                type="number"
                min={0}
                max={11}
                value={metrics.heightInches ?? ''}
                onChange={(e) => onUpdate('heightInches', e.target.value ? Number(e.target.value) : null)}
                placeholder="10"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent pr-8"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">in</span>
            </div>
          </div>
        </div>
        <div>
          <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
            <Calendar className="w-3 h-3 inline mr-1 opacity-60" />Birth Date
          </label>
          <input
            type="date"
            value={metrics.birthDate}
            onChange={(e) => onUpdate('birthDate', e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          {age !== null && (
            <span className="text-[10px] text-gray-400 mt-1 block">{age} years old</span>
          )}
        </div>
      </div>

      <div>
        <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
          <User className="w-3 h-3 inline mr-1 opacity-60" />Gender
        </label>
        <div className="flex gap-2">
          {(['male', 'female', 'other'] as const).map((g) => (
            <button
              key={g}
              onClick={() => onUpdate('gender', g)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                metrics.gender === g
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function WeightPlanSection({
  metrics, weeklyLabel, activityLabel, openDropdown, setOpenDropdown, onUpdate, calculated
}: {
  metrics: BodyMetrics;
  weeklyLabel: string;
  activityLabel: string;
  openDropdown: string | null;
  setOpenDropdown: (v: string | null) => void;
  onUpdate: <K extends keyof BodyMetrics>(key: K, value: BodyMetrics[K]) => void;
  calculated: ReturnType<typeof calculateGoals>;
}) {
  const showWeightContext = calculated && metrics.currentWeight && metrics.goalWeight && metrics.currentWeight !== metrics.goalWeight;
  const suggestedLabel = calculated ? WEEKLY_GOAL_OPTIONS.find(o => o.value === calculated.suggestedWeeklyGoal)?.label : null;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <SectionHeader icon={<TrendingDown className="w-4 h-4 text-gray-500" />} title="Weight Plan" />

      {showWeightContext && (
        <div className="mb-4 p-3 bg-blue-50 rounded-xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-blue-900">
              {calculated!.weightDifference > 0
                ? `Goal: Gain ${Math.abs(calculated!.weightDifference).toFixed(1)} lbs`
                : `Goal: Lose ${Math.abs(calculated!.weightDifference).toFixed(1)} lbs`
              }
            </span>
            {calculated!.weeksToGoal && (
              <span className="text-xs text-blue-600">
                ~{Math.ceil(calculated!.weeksToGoal)} weeks
              </span>
            )}
          </div>
          {suggestedLabel && metrics.weeklyWeightGoal !== calculated!.suggestedWeeklyGoal && (
            <p className="text-[10px] text-blue-600">
              Suggested rate: {suggestedLabel}
            </p>
          )}
        </div>
      )}

      <div className="space-y-4">
        <div className="relative">
          <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
            Weekly Rate
          </label>
          <p className="text-[10px] text-gray-400 mb-2">Direction is determined by your goal weight</p>
          <button
            onClick={() => setOpenDropdown(openDropdown === 'weekly' ? null : 'weekly')}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 hover:border-gray-300 transition-colors"
          >
            <span>{weeklyLabel}</span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openDropdown === 'weekly' ? 'rotate-180' : ''}`} />
          </button>
          {openDropdown === 'weekly' && (
            <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              {WEEKLY_GOAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { onUpdate('weeklyWeightGoal', opt.value); setOpenDropdown(null); }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                    metrics.weeklyWeightGoal === opt.value ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700'
                  }`}
                >
                  <span className="font-medium">{opt.label}</span>
                  {opt.sublabel && <span className="text-xs text-gray-400">{opt.sublabel}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
            <Activity className="w-3 h-3 inline mr-1 opacity-60" />Activity Level
          </label>
          <button
            onClick={() => setOpenDropdown(openDropdown === 'activity' ? null : 'activity')}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 hover:border-gray-300 transition-colors"
          >
            <span>{activityLabel}</span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openDropdown === 'activity' ? 'rotate-180' : ''}`} />
          </button>
          {openDropdown === 'activity' && (
            <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              {ACTIVITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { onUpdate('activityLevel', opt.value); setOpenDropdown(null); }}
                  className={`w-full flex flex-col px-4 py-3 text-sm hover:bg-gray-50 transition-colors text-left ${
                    metrics.activityLevel === opt.value ? 'bg-emerald-50' : ''
                  }`}
                >
                  <span className={`font-medium ${metrics.activityLevel === opt.value ? 'text-emerald-700' : 'text-gray-700'}`}>
                    {opt.label}
                  </span>
                  <span className="text-xs text-gray-400">{opt.sublabel}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CalculatedSection({ calculated }: { calculated: ReturnType<typeof calculateGoals> }) {
  if (!calculated) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-5 border border-gray-200 border-dashed">
        <SectionHeader icon={<Target className="w-4 h-4 text-gray-400" />} title="Recommendations" />
        <p className="text-sm text-gray-400">
          Fill in your body metrics above to see personalized calorie and macro recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100">
      <SectionHeader icon={<Target className="w-4 h-4 text-emerald-600" />} title="Recommendations" />
      <div className="grid grid-cols-2 gap-3">
        <RecommendationBadge label="Calories" value={`${calculated.calorieGoal.toLocaleString()}`} unit="kcal" color="text-orange-600" bg="bg-orange-50" />
        <RecommendationBadge label="Protein" value={`${calculated.proteinGoal}`} unit="g" color="text-blue-600" bg="bg-blue-50" />
        <RecommendationBadge label="Carbs" value={`${calculated.carbsGoal}`} unit="g" color="text-amber-600" bg="bg-amber-50" />
        <RecommendationBadge label="Fat" value={`${calculated.fatGoal}`} unit="g" color="text-rose-600" bg="bg-rose-50" />
      </div>
      <p className="text-[10px] text-emerald-600/60 mt-3">Based on Mifflin-St Jeor formula with 30/40/30 macro split</p>
    </div>
  );
}

function RecommendationBadge({ label, value, unit, color, bg }: { label: string; value: string; unit: string; color: string; bg: string }) {
  return (
    <div className={`${bg} rounded-xl px-4 py-3 flex items-baseline justify-between`}>
      <span className="text-xs font-medium text-gray-600">{label}</span>
      <div className="flex items-baseline gap-0.5">
        <span className={`text-lg font-bold ${color}`}>{value}</span>
        <span className="text-[10px] text-gray-400">{unit}</span>
      </div>
    </div>
  );
}

function GoalModeSection({
  metrics, customGoals, calculated, activeGoals, onToggle, onUpdateGoal
}: {
  metrics: BodyMetrics;
  customGoals: NutritionGoals;
  calculated: ReturnType<typeof calculateGoals>;
  activeGoals: NutritionGoals;
  onToggle: () => void;
  onUpdateGoal: (key: keyof NutritionGoals, value: number) => void;
}) {
  const goalFields: { key: keyof NutritionGoals; label: string; unit: string; icon: React.ReactNode; color: string; bgColor: string; min: number; max: number; step: number }[] = [
    { key: 'calorieGoal', label: 'Calories', unit: 'kcal', icon: <Flame className="w-4 h-4" />, color: 'text-orange-600', bgColor: 'bg-orange-50', min: 800, max: 5000, step: 50 },
    { key: 'proteinGoal', label: 'Protein', unit: 'g', icon: <Beef className="w-4 h-4" />, color: 'text-blue-600', bgColor: 'bg-blue-50', min: 20, max: 400, step: 5 },
    { key: 'carbsGoal', label: 'Carbs', unit: 'g', icon: <Wheat className="w-4 h-4" />, color: 'text-amber-600', bgColor: 'bg-amber-50', min: 20, max: 600, step: 5 },
    { key: 'fatGoal', label: 'Fat', unit: 'g', icon: <Droplets className="w-4 h-4" />, color: 'text-rose-600', bgColor: 'bg-rose-50', min: 10, max: 250, step: 5 },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <SectionHeader icon={<Flame className="w-4 h-4 text-gray-500" />} title="Daily Targets" />
        <button onClick={onToggle} className="flex items-center gap-1.5 text-sm">
          {metrics.useCustomGoals ? (
            <ToggleRight className="w-6 h-6 text-emerald-500" />
          ) : (
            <ToggleLeft className="w-6 h-6 text-gray-400" />
          )}
          <span className={`text-xs font-medium ${metrics.useCustomGoals ? 'text-emerald-600' : 'text-gray-400'}`}>
            Custom
          </span>
        </button>
      </div>

      {!metrics.useCustomGoals && calculated && (
        <p className="text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg mb-4">
          Using calculated recommendations based on your body metrics.
        </p>
      )}

      {!metrics.useCustomGoals && !calculated && (
        <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg mb-4">
          Complete your body metrics above to get personalized targets.
        </p>
      )}

      <div className="space-y-4">
        {goalFields.map((field) => {
          const value = activeGoals[field.key];
          const isEditable = metrics.useCustomGoals;
          const recommendedValue = calculated ? calculated[field.key as keyof typeof calculated] : null;

          return (
            <div key={field.key} className={`${!isEditable ? 'opacity-80' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${field.bgColor} ${field.color}`}>
                    {field.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{field.label}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-gray-900">{value}</span>
                  <span className="text-xs text-gray-400">{field.unit}</span>
                </div>
              </div>
              {isEditable && (
                <input
                  type="range"
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={customGoals[field.key]}
                  onChange={(e) => onUpdateGoal(field.key, Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              )}
              {isEditable && recommendedValue !== null && (
                <p className="text-[10px] text-gray-400 mt-1">
                  Recommended: {typeof recommendedValue === 'number' ? recommendedValue.toLocaleString() : recommendedValue} {field.unit}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WaterGoalCard({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-cyan-50 text-cyan-600">
            <Droplets className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium text-gray-900">Water Goal</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold text-gray-900">{value}</span>
          <span className="text-xs text-gray-400">cups</span>
        </div>
      </div>
      <input
        type="range"
        min={1}
        max={20}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
      />
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>1 cup</span>
        <span>20 cups</span>
      </div>
    </div>
  );
}

function NumberField({
  label, value, unit, placeholder, onChange
}: {
  label: string; value: number | null; unit: string; placeholder: string;
  onChange: (v: number | null) => void;
}) {
  return (
    <div>
      <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent pr-9"
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">{unit}</span>
      </div>
    </div>
  );
}
