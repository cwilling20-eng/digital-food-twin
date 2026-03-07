interface NutrientBarProps {
  label: string;
  current: number;
  goal: number;
  unit: string;
  color: string;
}

export function NutrientBar({ label, current, goal, unit, color }: NutrientBarProps) {
  const percent = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const left = Math.max(goal - current, 0);
  const isOver = current > goal;

  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-gray-800">{label}</span>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="font-medium text-gray-700">
            {Math.round(current)}{unit}
          </span>
          <span>{Math.round(goal)}{unit}</span>
          <span className={isOver ? 'text-red-500 font-medium' : 'text-gray-400'}>
            {isOver ? `+${Math.round(current - goal)}${unit}` : `${Math.round(left)}${unit}`}
          </span>
        </div>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percent}%`,
            backgroundColor: isOver ? '#ef4444' : color
          }}
        />
      </div>
    </div>
  );
}
