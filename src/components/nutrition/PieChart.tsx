interface Segment {
  value: number;
  color: string;
  label: string;
}

interface PieChartProps {
  segments: Segment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
}

export function PieChart({ segments, size = 180, strokeWidth = 28, centerLabel, centerValue }: PieChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;
  const total = segments.reduce((s, seg) => s + seg.value, 0);

  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {centerLabel && (
          <>
            <text x={cx} y={cy - 6} textAnchor="middle" className="fill-gray-400 text-xs">
              {centerLabel}
            </text>
            <text x={cx} y={cy + 14} textAnchor="middle" className="fill-gray-300 text-sm font-semibold">
              0
            </text>
          </>
        )}
      </svg>
    );
  }

  let cumulativePercent = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.filter(s => s.value > 0).map((segment, i) => {
        const percent = segment.value / total;
        const dashLength = circumference * percent;
        const dashGap = circumference - dashLength;
        const offset = circumference * cumulativePercent;

        cumulativePercent += percent;

        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dashLength} ${dashGap}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
            className="transition-all duration-700"
          />
        );
      })}
      {(centerLabel || centerValue) && (
        <>
          {centerValue && (
            <text x={cx} y={centerLabel ? cy - 2 : cy + 5} textAnchor="middle" className="fill-gray-900 text-2xl font-bold" style={{ fontSize: '22px', fontWeight: 700 }}>
              {centerValue}
            </text>
          )}
          {centerLabel && (
            <text x={cx} y={centerValue ? cy + 18 : cy + 5} textAnchor="middle" className="fill-gray-400" style={{ fontSize: '11px' }}>
              {centerLabel}
            </text>
          )}
        </>
      )}
    </svg>
  );
}
