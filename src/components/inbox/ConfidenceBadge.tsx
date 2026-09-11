import React from 'react';

interface ConfidenceBadgeProps {
  confidence: number; // 0.00 to 1.00
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  confidence,
  showLabel = false,
  size = 'md',
}) => {
  const percentage = Math.round(confidence * 100);

  // Confidence thresholds:
  // >= 95%: High confidence (auto-processing eligible) -> Soft Green
  // 75% - 94%: Moderate / Review threshold -> Soft Amber
  // < 75%: Low confidence -> Soft Orange/Amber
  let bg = 'bg-[#F0FDF4]';
  let text = 'text-[#166534]';
  let border = 'border-[#BBF7D0]';
  let labelText = 'High confidence';

  if (percentage < 75) {
    bg = 'bg-[#FEF9EE]';
    text = 'text-[#B45309]';
    border = 'border-[#FDE68A]';
    labelText = 'Review territory';
  } else if (percentage < 95) {
    bg = 'bg-[#FEFCE8]';
    text = 'text-[#A16207]';
    border = 'border-[#FEF08A]';
    labelText = 'Moderate confidence';
  }

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px] font-semibold'
      : 'px-2.5 py-1 text-[12px] font-semibold';

  return (
    <div className="inline-flex items-center gap-1.5 group relative" title="AI interpretation confidence">
      <span
        className={`inline-flex items-center justify-center rounded-full border ${bg} ${text} ${border} ${sizeClasses} whitespace-nowrap leading-none transition-colors font-mono`}
      >
        {percentage}%
      </span>

      {showLabel && (
        <span className="text-[11px] text-[#7A7067] font-normal hidden sm:inline">
          {labelText}
        </span>
      )}
    </div>
  );
};
