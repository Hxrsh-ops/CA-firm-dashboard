import React from 'react';
import { ArrowRight, FileText, AlertTriangle, Users, Clock } from 'lucide-react';
import type { RecentActivityItem } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface RecentActivityProps {
  items: RecentActivityItem[];
  onSelectItem?: (item: RecentActivityItem) => void;
  onViewAll?: () => void;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  items,
  onSelectItem,
  onViewAll,
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'document':
        return { icon: FileText, bg: 'bg-[#F5F2EC]', color: 'text-[#5C5148]' };
      case 'reminder':
        return { icon: Clock, bg: 'bg-[#EFF6FF]', color: 'text-[#2563EB]' };
      case 'alert':
        return { icon: AlertTriangle, bg: 'bg-[#FDF2F2]', color: 'text-[#DC2626]' };
      case 'client':
      default:
        return { icon: Users, bg: 'bg-[#F0FDF4]', color: 'text-[#166534]' };
    }
  };

  return (
    <div className="bg-white border border-[#EAE6DF] rounded-xl shadow-card overflow-hidden select-none flex flex-col justify-between">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-[#F5F2EC]">
        <h2 className="text-[15px] font-bold text-[#2B231F] font-display">
          Recent Activity
        </h2>
        <button
          onClick={onViewAll}
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#755843] hover:text-[#3D2D22] transition-colors group"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Activity List */}
      <div className="divide-y divide-[#F5F2EC]">
        {items.map((item) => {
          const { icon: Icon, bg, color } = getIcon(item.type);
          return (
            <div
              key={item.id}
              onClick={() => onSelectItem?.(item)}
              className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-[#FAF9F6] transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg ${bg} ${color} flex items-center justify-center shrink-0`}
                >
                  <Icon className="w-4 h-4" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-[#2B231F] truncate group-hover:text-[#5F4635] transition-colors">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-[#8C827A] truncate mt-0.5">
                    {item.subtitle}
                  </div>
                </div>
              </div>

              <div className="shrink-0 pl-2">
                <StatusBadge status={item.status} size="sm" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
