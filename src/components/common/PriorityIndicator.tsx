import React from 'react';

interface PriorityIndicatorProps {
  priority: 'High' | 'Medium' | 'Low';
}

export const PriorityIndicator: React.FC<PriorityIndicatorProps> = ({ priority }) => {
  const config = {
    High: {
      dotColor: 'bg-[#DC2626]',
      text: 'High',
      textColor: 'text-[#4A3E38]',
    },
    Medium: {
      dotColor: 'bg-[#F59E0B]',
      text: 'Medium',
      textColor: 'text-[#4A3E38]',
    },
    Low: {
      dotColor: 'bg-[#10B981]',
      text: 'Low',
      textColor: 'text-[#6B7280]',
    },
  }[priority];

  return (
    <div className="inline-flex items-center gap-1.5 text-[13px]">
      <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
      <span className={`font-medium ${config.textColor}`}>{config.text}</span>
    </div>
  );
};
