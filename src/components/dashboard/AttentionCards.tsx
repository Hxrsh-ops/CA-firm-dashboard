import React from 'react';
import {
  FileText,
  FileQuestion,
  CheckSquare,
  BarChart2,
  ChevronRight,
} from 'lucide-react';
import type { DashboardAttentionMetrics } from '../../types';

interface AttentionCardsProps {
  metrics: DashboardAttentionMetrics;
  onCardClick?: (type: 'missing' | 'review' | 'approval' | 'processed') => void;
}

export const AttentionCards: React.FC<AttentionCardsProps> = ({
  metrics,
  onCardClick,
}) => {
  const cards = [
    {
      type: 'missing' as const,
      count: metrics.missing_documents,
      title: 'Missing Documents',
      subtitle: 'Require client follow-up',
      icon: FileText,
      iconBg: 'bg-[#FDF2F2]',
      iconColor: 'text-[#DC2626]',
      borderHover: 'hover:border-[#FCA5A5]',
    },
    {
      type: 'review' as const,
      count: metrics.needs_review,
      title: 'Need Review',
      subtitle: 'AI flagged for your review',
      icon: FileQuestion,
      iconBg: 'bg-[#FEF9EE]',
      iconColor: 'text-[#D97706]',
      borderHover: 'hover:border-[#FCD34D]',
    },
    {
      type: 'approval' as const,
      count: metrics.pending_approval,
      title: 'Pending Approval',
      subtitle: 'Reminders / Actions',
      icon: CheckSquare,
      iconBg: 'bg-[#EFF6FF]',
      iconColor: 'text-[#2563EB]',
      borderHover: 'hover:border-[#BFDBFE]',
    },
    {
      type: 'processed' as const,
      count: metrics.automatically_processed,
      title: 'Automatically Processed',
      subtitle: 'No action needed',
      icon: BarChart2,
      iconBg: 'bg-[#F0FDF4]',
      iconColor: 'text-[#166534]',
      borderHover: 'hover:border-[#BBF7D0]',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.type}
            onClick={() => onCardClick?.(card.type)}
            className={`bg-white border border-[#EAE6DF] ${card.borderHover} rounded-xl p-4 sm:p-4.5 flex items-center justify-between shadow-card hover:shadow-subtle transition-all cursor-pointer group select-none`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-11 h-11 rounded-xl ${card.iconBg} ${card.iconColor} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}
              >
                <Icon className="w-5 h-5" strokeWidth={2} />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#2B231F] leading-none font-display">
                  {card.count}
                </div>
                <div className="text-[13.5px] font-semibold text-[#2B231F] mt-1 leading-snug">
                  {card.title}
                </div>
                <div className="text-[11.5px] text-[#8C827A] font-normal leading-tight mt-0.5">
                  {card.subtitle}
                </div>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-[#B8ADA4] group-hover:text-[#2B231F] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </div>
        );
      })}
    </div>
  );
};
