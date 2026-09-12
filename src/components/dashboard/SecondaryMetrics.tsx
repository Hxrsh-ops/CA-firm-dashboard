import React from 'react';
import { Users, FileText, AlertTriangle, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { dataService, useDataSync } from '../../services/dataService';

export const SecondaryMetrics: React.FC = () => {
  useDataSync();
  const metrics = dataService.getSecondaryMetrics();

  const items = [
    {
      title: 'Total Clients',
      value: metrics.total_clients.count,
      change: `${metrics.total_clients.change_pct}%`,
      period: metrics.total_clients.period_text,
      isPositive: true,
      icon: Users,
      iconBg: 'bg-[#F5F2EC]',
      iconColor: 'text-[#5C5148]',
    },
    {
      title: 'Documents Received',
      value: metrics.documents_received.count,
      change: `${metrics.documents_received.change_pct}%`,
      period: metrics.documents_received.period_text,
      isPositive: true,
      icon: FileText,
      iconBg: 'bg-[#F5F2EC]',
      iconColor: 'text-[#5C5148]',
    },
    {
      title: 'Open Alerts',
      value: metrics.open_alerts.count,
      change: `${metrics.open_alerts.change_pct}%`,
      period: metrics.open_alerts.period_text,
      isPositive: false, // Downwards arrow
      isFavorable: true, // Decreasing open alerts is a positive operational signal
      icon: AlertTriangle,
      iconBg: 'bg-[#FDF2F2]',
      iconColor: 'text-[#DC2626]',
    },
    {
      title: 'Upcoming Reminders',
      value: metrics.upcoming_reminders.count,
      change: `${metrics.upcoming_reminders.change_pct}%`,
      period: metrics.upcoming_reminders.period_text,
      isPositive: true,
      icon: Clock,
      iconBg: 'bg-[#F5F2EC]',
      iconColor: 'text-[#5C5148]',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 select-none">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className="bg-white border border-[#EAE6DF] rounded-xl p-4 shadow-card flex items-center gap-3.5 hover:border-[#D5C2B4] transition-colors"
          >
            <div
              className={`w-10 h-10 rounded-xl ${item.iconBg} ${item.iconColor} flex items-center justify-center shrink-0`}
            >
              <Icon className="w-4.5 h-4.5" strokeWidth={2} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-[11.5px] font-medium text-[#8C827A] truncate">
                {item.title}
              </div>
              <div className="text-xl font-bold text-[#2B231F] leading-tight font-display">
                {item.value}
              </div>
              <div className="flex items-center gap-1 mt-0.5 text-[11px]">
                {item.isPositive ? (
                  <span className="inline-flex items-center text-[#16A34A] font-semibold">
                    <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                    {item.change}
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[#DC2626] font-semibold">
                    <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
                    {item.change}
                  </span>
                )}
                <span className="text-[#8C827A] truncate font-normal">
                  {item.period}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
