import { useState } from 'react';
import { Droplets, Plus, Minus, X } from 'lucide-react';
import type { WaterLog } from '../../hooks/useWaterLogs';

interface WaterTrackerProps {
  waterGoal: number;
  waterLogs: WaterLog[];
  onAddWater: (cups: number) => Promise<{ error?: string }>;
  onRemoveWater: (logId: string) => Promise<{ error?: string }>;
  onRefresh: () => void;
}

export function WaterTracker({ waterGoal, waterLogs, onAddWater, onRemoveWater, onRefresh }: WaterTrackerProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customCups, setCustomCups] = useState(1);
  const [saving, setSaving] = useState(false);

  const totalCups = waterLogs.reduce((sum, l) => sum + (l.cups || 0), 0);
  const progressPercent = Math.min((totalCups / waterGoal) * 100, 100);
  const filledDrops = Math.min(totalCups, waterGoal);

  const addWater = async (cups: number) => {
    setSaving(true);
    const result = await onAddWater(cups);
    if (!result.error) onRefresh();
    setSaving(false);
    setShowCustom(false);
  };

  const removeLastLog = async () => {
    if (waterLogs.length === 0) return;
    const lastLog = waterLogs[waterLogs.length - 1];
    const result = await onRemoveWater(lastLog.id);
    if (!result.error) onRefresh();
  };

  return (
    <div className="bg-nm-surface-lowest rounded-[2rem] p-8 shadow-nm-float">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <Droplets className="w-5 h-5 text-nm-success" />
          <span className="text-nm-label-md text-nm-text/60 uppercase tracking-wider">Water</span>
        </div>
        <span className="text-nm-text/40 text-sm">
          <span className="font-bold text-nm-text text-lg">{totalCups}</span> / {waterGoal} cups
        </span>
      </div>

      {/* Water drop indicators */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {Array.from({ length: waterGoal }).map((_, i) => (
          <div
            key={i}
            className={`transition-all duration-300 ${
              i < filledDrops ? 'text-nm-success' : 'text-nm-surface-high'
            }`}
          >
            <Droplets className="w-5 h-5" />
          </div>
        ))}
        {totalCups > waterGoal && (
          <span className="text-nm-label-md font-bold text-nm-success ml-1">+{totalCups - waterGoal}</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full h-3 bg-nm-surface-high rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-nm-success rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Actions */}
      {!showCustom ? (
        <div className="flex items-center gap-3">
          <button
            onClick={() => addWater(1)}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-nm-success text-white rounded-full font-bold text-sm hover:opacity-90 transition-opacity active:scale-95"
          >
            <Plus className="w-4 h-4" />
            ADD WATER
          </button>
          <button
            onClick={() => setShowCustom(true)}
            className="px-4 py-3 text-nm-text/60 hover:bg-nm-surface transition-colors rounded-full text-nm-label-md font-bold bg-nm-surface"
          >
            Custom
          </button>
          {waterLogs.length > 0 && (
            <button
              onClick={removeLastLog}
              className="w-12 h-12 flex items-center justify-center text-nm-text/40 hover:bg-nm-signature/10 hover:text-nm-signature transition-colors rounded-full bg-nm-surface"
            >
              <Minus className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-nm-surface rounded-full overflow-hidden">
            <button
              onClick={() => setCustomCups(Math.max(1, customCups - 1))}
              className="px-4 py-3 hover:bg-nm-surface-high transition-colors"
            >
              <Minus className="w-4 h-4 text-nm-text/60" />
            </button>
            <span className="px-3 text-lg font-bold text-nm-text min-w-[2rem] text-center">
              {customCups}
            </span>
            <button
              onClick={() => setCustomCups(customCups + 1)}
              className="px-4 py-3 hover:bg-nm-surface-high transition-colors"
            >
              <Plus className="w-4 h-4 text-nm-text/60" />
            </button>
          </div>
          <button
            onClick={() => addWater(customCups)}
            disabled={saving}
            className="flex-1 py-3 bg-nm-success text-white rounded-full font-bold text-sm hover:opacity-90 transition-opacity active:scale-95"
          >
            Add {customCups} cup{customCups > 1 ? 's' : ''}
          </button>
          <button
            onClick={() => { setShowCustom(false); setCustomCups(1); }}
            className="w-10 h-10 flex items-center justify-center text-nm-text/40 hover:bg-nm-surface rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
