import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft, Check, Scale, Ruler, Calendar, User,
  TrendingDown, Activity, Flame, Beef, Wheat, Droplets,
  ChevronDown, ToggleLeft, ToggleRight, Target
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { ProgressBar } from '../ui/ProgressBar';
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
    const result = calculateGoals(metrics);
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
    <div className="min-h-screen bg-nm-bg pb-32">
      <div className="bg-nm-bg/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="px-6 pt-12 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-nm-surface transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-nm-text" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-nm-text">My Goals</h1>
              <p className="text-nm-label-md text-nm-text/40">Body metrics & nutrition targets</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 mt-4 space-y-5">
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
          <div className="bg-nm-signature/10 text-nm-signature text-sm px-5 py-3 rounded-[2rem]">
            {saveError}
          </div>
        )}

        <div className="pt-2 pb-4">
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className={`w-full py-4 rounded-full font-bold transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 ${
              saveStatus === 'saved'
                ? 'bg-nm-success text-white'
                : saveStatus === 'error'
                  ? 'bg-nm-signature text-white'
                  : saveStatus === 'saving'
                    ? 'bg-nm-surface-high text-nm-text/40 cursor-not-allowed'
                    : 'bg-gradient-to-br from-nm-signature to-nm-signature-light text-white shadow-nm-float'
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
      <h2 className="text-nm-label-md text-nm-text/60 uppercase tracking-widest">{title}</h2>
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
    <div className="bg-nm-surface-lowest rounded-[2rem] p-6 shadow-nm-float">
      <SectionHeader icon={<Scale className="w-4 h-4 text-nm-text/40" />} title="Body Metrics" />

      {metrics.startingWeight && metrics.currentWeight && metrics.goalWeight && (
        <div className="mb-5 p-5 bg-nm-surface rounded-[1.5rem]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-nm-label-md text-nm-text/40 uppercase tracking-wider">Progress to goal</span>
            <span className="text-nm-label-md font-bold text-nm-signature">
              {goalReached ? 'Goal reached!' : `${weightToGo?.toFixed(1)} lbs to go`}
            </span>
          </div>
          <ProgressBar percentage={weightProgress} className="h-3" />
          <div className="flex justify-between mt-2">
            <span className="text-nm-label-md text-nm-text/40">{metrics.startingWeight} lbs</span>
            <span className="text-nm-label-md text-nm-text/40">{metrics.goalWeight} lbs</span>
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
          <label className="text-nm-label-md text-nm-text/60 uppercase tracking-widest mb-2 block">
            <Ruler className="w-3 h-3 inline mr-1 opacity-60" />Height
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="number"
                value={metrics.heightFeet ?? ''}
                onChange={(e) => onUpdate('heightFeet', e.target.value ? Number(e.target.value) : null)}
                placeholder="5"
                className="w-full px-4 py-3 bg-nm-surface-high rounded-full text-sm text-nm-text focus:outline-none focus:ring-2 focus:ring-nm-signature/40 focus:bg-nm-surface-lowest pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-nm-label-md text-nm-text/40">ft</span>
            </div>
            <div className="flex-1 relative">
              <input
                type="number"
                min={0}
                max={11}
                value={metrics.heightInches ?? ''}
                onChange={(e) => onUpdate('heightInches', e.target.value ? Number(e.target.value) : null)}
                placeholder="10"
                className="w-full px-4 py-3 bg-nm-surface-high rounded-full text-sm text-nm-text focus:outline-none focus:ring-2 focus:ring-nm-signature/40 focus:bg-nm-surface-lowest pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-nm-label-md text-nm-text/40">in</span>
            </div>
          </div>
        </div>
        <div>
          <label className="text-nm-label-md text-nm-text/60 uppercase tracking-widest mb-2 block">
            <Calendar className="w-3 h-3 inline mr-1 opacity-60" />Birth Date
          </label>
          <input
            type="date"
            value={metrics.birthDate}
            onChange={(e) => onUpdate('birthDate', e.target.value)}
            className="w-full px-4 py-3 bg-nm-surface-high rounded-full text-sm text-nm-text focus:outline-none focus:ring-2 focus:ring-nm-signature/40 focus:bg-nm-surface-lowest"
          />
          {age !== null && (
            <span className="text-nm-label-md text-nm-text/40 mt-1 block">{age} years old</span>
          )}
        </div>
      </div>

      <div>
        <label className="text-nm-label-md text-nm-text/60 uppercase tracking-widest mb-2 block">
          <User className="w-3 h-3 inline mr-1 opacity-60" />Gender
        </label>
        <div className="flex gap-2">
          {(['male', 'female', 'other'] as const).map((g) => (
            <button
              key={g}
              onClick={() => onUpdate('gender', g)}
              className={`flex-1 py-3 rounded-full text-sm font-bold transition-all active:scale-95 ${
                metrics.gender === g
                  ? 'bg-nm-signature text-white shadow-nm-float'
                  : 'bg-nm-surface-high text-nm-text hover:bg-nm-surface-highest'
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
    <div className="bg-nm-surface-lowest rounded-[2rem] p-6 shadow-nm-float">
      <SectionHeader icon={<TrendingDown className="w-4 h-4 text-nm-text/40" />} title="Weight Plan" />

      {showWeightContext && (
        <div className="mb-4 p-4 bg-nm-surface rounded-[1.5rem]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-nm-label-md font-bold text-nm-text">
              {calculated!.weightDifference > 0
                ? `Goal: Gain ${Math.abs(calculated!.weightDifference).toFixed(1)} lbs`
                : `Goal: Lose ${Math.abs(calculated!.weightDifference).toFixed(1)} lbs`
              }
            </span>
            {calculated!.weeksToGoal && (
              <span className="text-nm-label-md text-nm-text/60">
                ~{Math.ceil(calculated!.weeksToGoal)} weeks
              </span>
            )}
          </div>
          {suggestedLabel && metrics.weeklyWeightGoal !== calculated!.suggestedWeeklyGoal && (
            <p className="text-nm-label-md text-nm-signature">
              Suggested rate: {suggestedLabel}
            </p>
          )}
        </div>
      )}

      <div className="space-y-4">
        <div className="relative">
          <label className="text-nm-label-md text-nm-text/60 uppercase tracking-widest mb-2 block">
            Weekly Rate
          </label>
          <p className="text-nm-label-md text-nm-text/30 mb-2">Direction is determined by your goal weight</p>
          <button
            onClick={() => setOpenDropdown(openDropdown === 'weekly' ? null : 'weekly')}
            className="w-full flex items-center justify-between px-5 py-3.5 bg-nm-surface-high rounded-full text-sm text-nm-text hover:bg-nm-surface-highest transition-colors"
          >
            <span>{weeklyLabel}</span>
            <ChevronDown className={`w-4 h-4 text-nm-text/40 transition-transform ${openDropdown === 'weekly' ? 'rotate-180' : ''}`} />
          </button>
          {openDropdown === 'weekly' && (
            <div className="absolute top-full left-0 right-0 z-20 mt-2 bg-nm-surface-lowest rounded-[1.5rem] shadow-nm-float overflow-hidden">
              {WEEKLY_GOAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { onUpdate('weeklyWeightGoal', opt.value); setOpenDropdown(null); }}
                  className={`w-full flex items-center justify-between px-5 py-3.5 text-sm hover:bg-nm-surface transition-colors ${
                    metrics.weeklyWeightGoal === opt.value ? 'bg-nm-surface text-nm-text' : 'text-nm-text/80'
                  }`}
                >
                  <span className="font-bold">{opt.label}</span>
                  {opt.sublabel && <span className="text-nm-label-md text-nm-text/40">{opt.sublabel}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <label className="text-nm-label-md text-nm-text/60 uppercase tracking-widest mb-2 block">
            <Activity className="w-3 h-3 inline mr-1 opacity-60" />Activity Level
          </label>
          <button
            onClick={() => setOpenDropdown(openDropdown === 'activity' ? null : 'activity')}
            className="w-full flex items-center justify-between px-5 py-3.5 bg-nm-surface-high rounded-full text-sm text-nm-text hover:bg-nm-surface-highest transition-colors"
          >
            <span>{activityLabel}</span>
            <ChevronDown className={`w-4 h-4 text-nm-text/40 transition-transform ${openDropdown === 'activity' ? 'rotate-180' : ''}`} />
          </button>
          {openDropdown === 'activity' && (
            <div className="absolute top-full left-0 right-0 z-20 mt-2 bg-nm-surface-lowest rounded-[1.5rem] shadow-nm-float overflow-hidden">
              {ACTIVITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { onUpdate('activityLevel', opt.value); setOpenDropdown(null); }}
                  className={`w-full flex flex-col px-5 py-3.5 text-sm hover:bg-nm-surface transition-colors text-left ${
                    metrics.activityLevel === opt.value ? 'bg-nm-surface' : ''
                  }`}
                >
                  <span className={`font-bold ${metrics.activityLevel === opt.value ? 'text-nm-text' : 'text-nm-text/80'}`}>
                    {opt.label}
                  </span>
                  <span className="text-nm-label-md text-nm-text/40">{opt.sublabel}</span>
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
      <div className="bg-nm-surface rounded-[2rem] p-6">
        <SectionHeader icon={<Target className="w-4 h-4 text-nm-text/30" />} title="Recommendations" />
        <p className="text-sm text-nm-text/40">
          Fill in your body metrics above to see personalized calorie and macro recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-nm-surface-lowest rounded-[2rem] p-6 shadow-nm-float">
      <SectionHeader icon={<Target className="w-4 h-4 text-nm-signature" />} title="Recommendations" />
      <div className="grid grid-cols-2 gap-3">
        <RecommendationBadge label="Calories" value={`${calculated.calorieGoal.toLocaleString()}`} unit="kcal" />
        <RecommendationBadge label="Protein" value={`${calculated.proteinGoal}`} unit="g" />
        <RecommendationBadge label="Carbs" value={`${calculated.carbsGoal}`} unit="g" />
        <RecommendationBadge label="Fat" value={`${calculated.fatGoal}`} unit="g" />
      </div>
      <p className="text-nm-label-md text-nm-text/30 mt-3">Based on Mifflin-St Jeor formula with 30/40/30 macro split</p>
    </div>
  );
}

function RecommendationBadge({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-nm-surface rounded-[1.5rem] px-4 py-4 flex items-baseline justify-between">
      <span className="text-nm-label-md text-nm-text/60 uppercase tracking-wider">{label}</span>
      <div className="flex items-baseline gap-0.5">
        <span className="text-3xl font-bold text-nm-signature">{value}</span>
        <span className="text-nm-label-md text-nm-text/40">{unit}</span>
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
  const goalFields: { key: keyof NutritionGoals; label: string; unit: string; icon: React.ReactNode; min: number; max: number; step: number }[] = [
    { key: 'calorieGoal', label: 'Calories', unit: 'kcal', icon: <Flame className="w-4 h-4" />, min: 800, max: 5000, step: 50 },
    { key: 'proteinGoal', label: 'Protein', unit: 'g', icon: <Beef className="w-4 h-4" />, min: 20, max: 400, step: 5 },
    { key: 'carbsGoal', label: 'Carbs', unit: 'g', icon: <Wheat className="w-4 h-4" />, min: 20, max: 600, step: 5 },
    { key: 'fatGoal', label: 'Fat', unit: 'g', icon: <Droplets className="w-4 h-4" />, min: 10, max: 250, step: 5 },
  ];

  return (
    <div className="bg-nm-surface-lowest rounded-[2rem] p-6 shadow-nm-float">
      <div className="flex items-center justify-between mb-4">
        <SectionHeader icon={<Flame className="w-4 h-4 text-nm-text/40" />} title="Daily Targets" />
        <button onClick={onToggle} className="flex items-center gap-1.5 text-sm">
          {metrics.useCustomGoals ? (
            <ToggleRight className="w-6 h-6 text-nm-signature" />
          ) : (
            <ToggleLeft className="w-6 h-6 text-nm-text/30" />
          )}
          <span className={`text-nm-label-md font-bold ${metrics.useCustomGoals ? 'text-nm-signature' : 'text-nm-text/30'}`}>
            Custom
          </span>
        </button>
      </div>

      {!metrics.useCustomGoals && calculated && (
        <p className="text-nm-label-md text-nm-signature bg-nm-signature/10 px-4 py-2.5 rounded-full mb-4">
          Using calculated recommendations based on your body metrics.
        </p>
      )}

      {!metrics.useCustomGoals && !calculated && (
        <p className="text-nm-label-md text-nm-accent bg-nm-accent/10 px-4 py-2.5 rounded-full mb-4">
          Complete your body metrics above to get personalized targets.
        </p>
      )}

      <div className="space-y-5">
        {goalFields.map((field) => {
          const value = activeGoals[field.key];
          const isEditable = metrics.useCustomGoals;
          const recommendedValue = calculated ? calculated[field.key as keyof typeof calculated] : null;

          return (
            <div key={field.key} className={`${!isEditable ? 'opacity-70' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-nm-surface text-nm-signature">
                    {field.icon}
                  </div>
                  <span className="text-sm font-bold text-nm-text">{field.label}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-nm-text">{value}</span>
                  <span className="text-nm-label-md text-nm-text/40">{field.unit}</span>
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
                  className="w-full h-2 bg-nm-surface-high rounded-full appearance-none cursor-pointer accent-nm-signature"
                />
              )}
              {isEditable && recommendedValue !== null && (
                <p className="text-nm-label-md text-nm-text/30 mt-1">
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
    <div className="bg-nm-surface-lowest rounded-[2rem] p-6 shadow-nm-float">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-nm-success/10 text-nm-success">
            <Droplets className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-nm-text">Water Goal</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold text-nm-text">{value}</span>
          <span className="text-nm-label-md text-nm-text/40">cups</span>
        </div>
      </div>
      <input
        type="range"
        min={1}
        max={20}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-nm-surface-high rounded-full appearance-none cursor-pointer accent-nm-success"
      />
      <div className="flex justify-between text-nm-label-md text-nm-text/30 mt-1">
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
      <label className="text-nm-label-md text-nm-text/60 uppercase tracking-widest mb-2 block">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-nm-surface-high rounded-full text-sm text-nm-text focus:outline-none focus:ring-2 focus:ring-nm-signature/40 focus:bg-nm-surface-lowest pr-9"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-nm-label-md text-nm-text/40">{unit}</span>
      </div>
    </div>
  );
}
