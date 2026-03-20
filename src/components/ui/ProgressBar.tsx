interface ProgressBarProps {
  percentage: number;
  className?: string;
  gradient?: boolean;
}

export function ProgressBar({ percentage, className = '', gradient = true }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percentage));

  return (
    <div className={`h-3 w-full bg-nm-surface-high rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${
          gradient
            ? 'bg-gradient-to-r from-nm-signature to-nm-signature-light'
            : 'bg-nm-signature'
        }`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
