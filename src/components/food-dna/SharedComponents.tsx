import { useState } from 'react';
import { X, Plus, Check } from 'lucide-react';

interface ChipSelectorProps {
  options: readonly string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  colorScheme?: 'emerald' | 'red' | 'amber' | 'blue';
  allowCustom?: boolean;
  customPlaceholder?: string;
}

const colorSchemes = {
  emerald: {
    selected: 'bg-emerald-500 text-white border-emerald-500',
    unselected: 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
  },
  red: {
    selected: 'bg-red-500 text-white border-red-500',
    unselected: 'bg-white text-gray-700 border-gray-200 hover:border-red-300 hover:bg-red-50'
  },
  amber: {
    selected: 'bg-amber-500 text-white border-amber-500',
    unselected: 'bg-white text-gray-700 border-gray-200 hover:border-amber-300 hover:bg-amber-50'
  },
  blue: {
    selected: 'bg-blue-500 text-white border-blue-500',
    unselected: 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
  }
};

export function ChipSelector({
  options,
  selected,
  onChange,
  colorScheme = 'emerald',
  allowCustom = false,
  customPlaceholder = 'Add custom...'
}: ChipSelectorProps) {
  const [customValue, setCustomValue] = useState('');
  const colors = colorSchemes[colorScheme];

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const addCustom = () => {
    const trimmed = customValue.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
      setCustomValue('');
    }
  };

  const allOptions = [...new Set([...options, ...selected.filter(s => !options.includes(s))])];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {allOptions.map(option => (
          <button
            key={option}
            onClick={() => toggleOption(option)}
            className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
              selected.includes(option) ? colors.selected : colors.unselected
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      {allowCustom && (
        <div className="flex gap-2">
          <input
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCustom()}
            placeholder={customPlaceholder}
            className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-emerald-500 focus:outline-none"
          />
          <button
            onClick={addCustom}
            disabled={!customValue.trim()}
            className="px-3 py-2 bg-emerald-500 text-white rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

interface SliderInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  leftLabel?: string;
  rightLabel?: string;
  showValue?: boolean;
}

export function SliderInput({
  label,
  value,
  onChange,
  min = 1,
  max = 10,
  leftLabel,
  rightLabel,
  showValue = true
}: SliderInputProps) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-2 block">
        {label}{showValue && `: ${value}/${max}`}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
      />
      {(leftLabel || rightLabel) && (
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      )}
    </div>
  );
}

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  tagColor?: 'emerald' | 'amber' | 'red' | 'blue';
}

const tagColors = {
  emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  amber: 'bg-amber-50 border-amber-200 text-amber-900',
  red: 'bg-red-50 border-red-200 text-red-900',
  blue: 'bg-blue-50 border-blue-200 text-blue-900'
};

const tagRemoveColors = {
  emerald: 'text-emerald-500 hover:text-emerald-700',
  amber: 'text-amber-500 hover:text-amber-700',
  red: 'text-red-500 hover:text-red-700',
  blue: 'text-blue-500 hover:text-blue-700'
};

export function TagInput({
  tags,
  onChange,
  suggestions = [],
  placeholder = 'Add item...',
  tagColor = 'emerald'
}: TagInputProps) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput('');
    setShowSuggestions(false);
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter(t => t !== tag));
  };

  const filteredSuggestions = suggestions.filter(
    s => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyPress={(e) => e.key === 'Enter' && input.trim() && addTag(input)}
            placeholder={placeholder}
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
          />
          <button
            onClick={() => input.trim() && addTag(input)}
            disabled={!input.trim()}
            className="px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        {showSuggestions && filteredSuggestions.length > 0 && input && (
          <div className="absolute top-full left-0 right-12 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
            {filteredSuggestions.slice(0, 8).map(suggestion => (
              <button
                key={suggestion}
                onClick={() => addTag(suggestion)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <div
              key={tag}
              className={`flex items-center gap-2 px-3 py-2 border rounded-xl ${tagColors[tagColor]}`}
            >
              <span className="text-sm font-medium">{tag}</span>
              <button
                onClick={() => removeTag(tag)}
                className={tagRemoveColors[tagColor]}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface SectionCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function SectionCard({ title, description, icon, children }: SectionCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start gap-3 mb-4">
        {icon && <div className="text-emerald-500 mt-0.5">{icon}</div>}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

interface SaveButtonProps {
  onClick: () => void;
  saving?: boolean;
  saved?: boolean;
  label?: string;
}

export function SaveButton({ onClick, saving, saved, label = 'Save Changes' }: SaveButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className={`w-full py-4 px-8 rounded-2xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
        saved
          ? 'bg-green-500 text-white'
          : saving
          ? 'bg-gray-400 text-white cursor-not-allowed'
          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 active:scale-[0.98]'
      }`}
    >
      {saved ? (
        <>
          <Check className="w-5 h-5" />
          Saved!
        </>
      ) : saving ? (
        'Saving...'
      ) : (
        label
      )}
    </button>
  );
}

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

export function ProgressRing({ percentage, size = 120, strokeWidth = 8 }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-gray-900">{percentage}%</span>
        <span className="text-xs text-gray-500">Complete</span>
      </div>
    </div>
  );
}
