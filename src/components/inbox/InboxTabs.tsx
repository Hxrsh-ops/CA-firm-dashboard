import React from 'react';
import type { IntakeTabFilter } from '../../types';

interface InboxTabsProps {
  activeTab: IntakeTabFilter;
  onSelectTab: (tab: IntakeTabFilter) => void;
  counts: {
    all: number;
    needs_review: number;
    exceptions: number;
    processed: number;
  };
}

export const InboxTabs: React.FC<InboxTabsProps> = ({
  activeTab,
  onSelectTab,
  counts,
}) => {
  const tabs: { id: IntakeTabFilter; label: string; count: number; alert?: boolean }[] = [
    { id: 'all', label: 'All Inbound', count: counts.all },
    { id: 'needs_review', label: 'Needs Review', count: counts.needs_review, alert: counts.needs_review > 0 },
    { id: 'exceptions', label: 'Exceptions', count: counts.exceptions, alert: counts.exceptions > 0 },
    { id: 'processed', label: 'Processed', count: counts.processed },
  ];

  return (
    <div className="flex items-center gap-1.5 p-1 bg-[#F5F2EC] rounded-xl border border-[#EAE6DF] select-none w-fit overflow-x-auto max-w-full">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              isActive
                ? 'bg-[#3D2D22] text-white shadow-xs'
                : 'text-[#6B5E55] hover:text-[#2B231F] hover:bg-[#EAE5DC]/60'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10.5px] font-mono leading-none ${
                isActive
                  ? 'bg-white/20 text-white font-bold'
                  : tab.alert
                  ? 'bg-[#FEF9EE] text-[#B45309] border border-[#FDE68A]/80 font-bold'
                  : 'bg-[#EAE6DD] text-[#5C5148]'
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
