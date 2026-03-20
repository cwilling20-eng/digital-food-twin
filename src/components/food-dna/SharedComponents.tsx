import { useState } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { ProgressBar } from '../ui/ProgressBar';

interface ChipSelectorProps {
  options: readonly string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  colorScheme?: 'emerald' | 'red' | 'amber' | 'blue';
  allowCustom?: boolean;
  customPlaceholder?: string;
}

export function ChipSelector({
  options,
  selected,
  onChange,
  colorScheme = 'emerald',
  allowCustom = false,
  customPlaceholder = 'Add custom...'
}: ChipSelectorProps) {
  const [customValue, setCustomValue] = useState('');

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
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all active:scale-95 ${
              selected.includes(option)
                ? 'bg-nm-signature text-white shadow-nm-float'
                : 'bg-nm-surface-high text-nm-text hover:bg-nm-surface-highest'
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
            className="flex-1 px-5 py-3 bg-nm-surface-high rounded-full text-sm text-nm-text placeholder:text-nm-text/30 focus:outline-none focus:bg-nm-surface-lowest focus:ring-2 focus:ring-nm-signature/40"
          />
          <button
            onClick={addCustom}
            disabled={!customValue.trim()}
            className="px-4 py-3 bg-gradient-to-br from-nm-signature to-nm-signature-light text-white rounded-full disabled:opacity-40 active:scale-95 transition-transform"
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
      <label className="text-sm font-semibold text-nm-text mb-2 block">
        {label}{showValue && `: ${value}/${max}`}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-nm-surface-high rounded-full appearance-none cursor-pointer accent-nm-signature"
      />
      {(leftLabel || rightLabel) && (
        <div className="flex justify-between text-nm-label-md text-nm-text/40 mt-1">
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
  emerald: 'bg-nm-surface text-nm-text',
  amber: 'bg-nm-accent/10 text-nm-accent',
  red: 'bg-nm-signature/10 text-nm-signature',
  blue: 'bg-nm-success/10 text-nm-success'
};

const tagRemoveColors = {
  emerald: 'text-nm-text/40 hover:text-nm-text',
  amber: 'text-nm-accent/60 hover:text-nm-accent',
  red: 'text-nm-signature/60 hover:text-nm-signature',
  blue: 'text-nm-success/60 hover:text-nm-success'
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
            className="flex-1 px-5 py-3 bg-nm-surface-high rounded-full text-sm text-nm-text placeholder:text-nm-text/30 focus:outline-none focus:bg-nm-surface-lowest focus:ring-2 focus:ring-nm-signature/40"
          />
          <button
            onClick={() => input.trim() && addTag(input)}
            disabled={!input.trim()}
            className="px-4 py-3 bg-gradient-to-br from-nm-signature to-nm-signature-light text-white rounded-full disabled:opacity-40 active:scale-95 transition-transform"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        {showSuggestions && filteredSuggestions.length > 0 && input && (
          <div className="absolute top-full left-0 right-12 mt-2 bg-nm-surface-lowest rounded-[1.5rem] shadow-nm-float z-10 max-h-48 overflow-y-auto">
            {filteredSuggestions.slice(0, 8).map(suggestion => (
              <button
                key={suggestion}
                onClick={() => addTag(suggestion)}
                className="w-full px-5 py-3 text-left text-sm text-nm-text hover:bg-nm-surface first:rounded-t-[1.5rem] last:rounded-b-[1.5rem]"
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
              className={`flex items-center gap-2 px-4 py-2 rounded-full ${tagColors[tagColor]}`}
            >
              <span className="text-sm font-bold">{tag}</span>
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
    <div className="bg-nm-surface rounded-[2rem] p-6">
      <div className="flex items-start gap-3 mb-4">
        {icon && <div className="text-nm-signature mt-0.5">{icon}</div>}
        <div className="flex-1">
          <h3 className="text-xl font-bold text-nm-text">{title}</h3>
          {description && <p className="text-sm text-nm-text/60 mt-0.5">{description}</p>}
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
      className={`w-full py-4 px-8 rounded-full font-bold transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 ${
        saved
          ? 'bg-nm-success text-white'
          : saving
          ? 'bg-nm-surface-high text-nm-text/40 cursor-not-allowed'
          : 'bg-gradient-to-br from-nm-signature to-nm-signature-light text-white shadow-nm-float'
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

export function ProgressRing({ percentage }: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, percentage));

  return (
    <div className="flex flex-col items-center gap-2 min-w-[100px]">
      <span className="text-3xl font-extrabold text-white">{clamped}%</span>
      <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-white rounded-full transition-all duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-xs text-white/70 font-medium">Complete</span>
    </div>
  );
}
