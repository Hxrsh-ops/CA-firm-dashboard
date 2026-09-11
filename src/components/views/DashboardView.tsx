import React from 'react';
import { DashboardHeader } from '../dashboard/DashboardHeader';
import { AttentionCards } from '../dashboard/AttentionCards';
import { AnalyticsSection } from '../dashboard/AnalyticsSection';
import { SecondaryMetrics } from '../dashboard/SecondaryMetrics';
import { PriorityWorkTable } from '../dashboard/PriorityWorkTable';
import { RecentActivity } from '../dashboard/RecentActivity';
import { UpcomingRemindersPanel } from '../dashboard/UpcomingRemindersPanel';
import { AskCopilotBar } from '../dashboard/AskCopilotBar';
import { dataService } from '../../services/dataService';
import type { PriorityWorkItem, RecentActivityItem } from '../../types';

interface DashboardViewProps {
  onSelectWorkItem: (item: PriorityWorkItem) => void;
  onSelectActivity?: (item: RecentActivityItem) => void;
  onNavigateTab: (tab: any) => void;
  onAskCopilot: (query: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectWorkItem,
  onSelectActivity,
  onNavigateTab,
  onAskCopilot,
}) => {
  const attentionMetrics = dataService.getDashboardAttentionMetrics();
  const priorityWork = dataService.getPriorityWork();
  const recentActivities = dataService.getRecentActivities();
  const upcomingReminders = dataService.getUpcomingReminders();

  const handleCardClick = (type: 'missing' | 'review' | 'approval' | 'processed') => {
    switch (type) {
      case 'missing':
      case 'review':
        onNavigateTab('alerts');
        break;
      case 'approval':
        onNavigateTab('reminders');
        break;
      case 'processed':
        onNavigateTab('documents');
        break;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Dashboard Header */}
      <DashboardHeader />

      {/* 2. Primary Attention KPI Cards */}
      <AttentionCards
        metrics={attentionMetrics}
        onCardClick={handleCardClick}
      />

      {/* 3. Analytics 3-Column Charts Section */}
      <AnalyticsSection />

      {/* 4. Secondary Summary Metrics */}
      <SecondaryMetrics />

      {/* 5. Priority Work & Right Panels Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Priority Work Table */}
        <div className="xl:col-span-2">
          <PriorityWorkTable
            items={priorityWork}
            onSelectItem={onSelectWorkItem}
            onViewAll={() => onNavigateTab('documents')}
          />
        </div>

        {/* Right Side Stack */}
        <div className="space-y-6">
          <RecentActivity
            items={recentActivities}
            onSelectItem={onSelectActivity}
            onViewAll={() => onNavigateTab('inbox')}
          />

          <UpcomingRemindersPanel
            items={upcomingReminders}
            onViewAll={() => onNavigateTab('reminders')}
          />
        </div>
      </div>

      {/* 6. AI Copilot Restrained Assistant Bar */}
      <AskCopilotBar onAsk={onAskCopilot} />
    </div>
  );
};
