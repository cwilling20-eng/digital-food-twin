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
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
        <div className="flex items-center gap-2.5">
          <Droplets className="w-5 h-5 text-sky-500" />
          <span className="font-semibold text-gray-900 text-sm">Water</span>
        </div>
        <span className="text-sm font-medium text-gray-500">
          {totalCups} / {waterGoal} cups
        </span>
      </div>

      <div className="px-4 py-4">
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          {Array.from({ length: waterGoal }).map((_, i) => (
            <div
              key={i}
              className={`transition-all duration-300 ${
                i < filledDrops ? 'text-sky-500' : 'text-gray-200'
              }`}
            >
              <Droplets className="w-5 h-5" />
            </div>
          ))}
          {totalCups > waterGoal && (
            <span className="text-xs font-medium text-sky-600 ml-1">+{totalCups - waterGoal}</span>
          )}
        </div>

        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-sky-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {!showCustom ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => addWater(1)}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sky-600 hover:bg-sky-50 transition-colors rounded-xl border border-sky-200 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              ADD WATER
            </button>
            <button
              onClick={() => setShowCustom(true)}
              className="px-3 py-2.5 text-gray-500 hover:bg-gray-50 transition-colors rounded-xl border border-gray-200 text-xs font-medium"
            >
              Custom
            </button>
            {waterLogs.length > 0 && (
              <button
                onClick={removeLastLog}
                className="px-3 py-2.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors rounded-xl border border-gray-200"
              >
                <Minus className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-sky-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setCustomCups(Math.max(1, customCups - 1))}
                className="px-3 py-2.5 hover:bg-gray-50 transition-colors"
              >
                <Minus className="w-4 h-4 text-gray-500" />
              </button>
              <span className="px-3 text-sm font-semibold text-gray-900 min-w-[2rem] text-center">
                {customCups}
              </span>
              <button
                onClick={() => setCustomCups(customCups + 1)}
                className="px-3 py-2.5 hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <button
              onClick={() => addWater(customCups)}
              disabled={saving}
              className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Add {customCups} cup{customCups > 1 ? 's' : ''}
            </button>
            <button
              onClick={() => { setShowCustom(false); setCustomCups(1); }}
              className="p-2.5 text-gray-400 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
