import React from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import type { UpcomingReminderItem } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface UpcomingRemindersPanelProps {
  items: UpcomingReminderItem[];
  onSelectReminder?: (reminder: UpcomingReminderItem) => void;
  onViewAll?: () => void;
}

export const UpcomingRemindersPanel: React.FC<UpcomingRemindersPanelProps> = ({
  items,
  onSelectReminder,
  onViewAll,
}) => {
  return (
    <div className="bg-white border border-[#EAE6DF] rounded-xl shadow-card overflow-hidden select-none">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-[#F5F2EC]">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#755843]" />
          <h2 className="text-[15px] font-bold text-[#2B231F] font-display">
            Upcoming Reminders
          </h2>
        </div>
        <button
          onClick={onViewAll}
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#755843] hover:text-[#3D2D22] transition-colors group"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Reminder List */}
      <div className="divide-y divide-[#F5F2EC]">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectReminder?.(item)}
            className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-[#FAF9F6] transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Date Box */}
              <div className="w-11 h-11 rounded-lg bg-[#FAF8F5] border border-[#EAE6DF] flex flex-col items-center justify-center shrink-0">
                <span className="text-[14px] font-bold text-[#2B231F] leading-none font-display">
                  {item.day}
                </span>
                <span className="text-[9.5px] font-bold text-[#8C8077] uppercase tracking-wider mt-0.5">
                  {item.month}
                </span>
              </div>

              {/* Title & Client */}
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-[#2B231F] truncate group-hover:text-[#5F4635] transition-colors">
                  {item.title}
                </div>
                <div className="text-[11px] text-[#8C827A] truncate mt-0.5">
                  {item.client_name}
                </div>
              </div>
            </div>

            <div className="shrink-0 pl-2">
              <StatusBadge status={item.status} size="sm" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
