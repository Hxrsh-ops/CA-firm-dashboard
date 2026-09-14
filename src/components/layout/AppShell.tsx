import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import type { NavigationTab } from './Sidebar';
import { TopBar } from './TopBar';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { AskCopilotDrawer } from '../common/AskCopilotDrawer';
import { WorkItemDetailModal } from '../common/WorkItemDetailModal';
import type { PriorityWorkItem } from '../../types';
import { dataService, useDataSync } from '../../services/dataService';
import { Menu, X, AlertTriangle, RefreshCw } from 'lucide-react';

interface AppShellProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  selectedWorkItem: PriorityWorkItem | null;
  onCloseWorkItem: () => void;
  copilotQuery: string | null;
  onCloseCopilot: () => void;
  onOpenCopilotWithQuery: (query: string) => void;
  isCopilotOpen?: boolean;
  onOpenCopilot?: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeTab,
  onSelectTab,
  selectedWorkItem,
  onCloseWorkItem,
  copilotQuery,
  onCloseCopilot,
  onOpenCopilotWithQuery,
  isCopilotOpen = false,
  onOpenCopilot,
  children,
}) => {
  const { connectionStatus, refresh } = useDataSync();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [localCopilotOpen, setLocalCopilotOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const isDrawerOpen = isCopilotOpen || localCopilotOpen || !!copilotQuery;

  const handleOpenSearch = () => setIsSearchOpen(true);
  const handleCloseSearch = () => setIsSearchOpen(false);

  const handleAskCopilotFromSearch = (query: string) => {
    onOpenCopilotWithQuery(query);
    setLocalCopilotOpen(true);
  };

  const handleRetryConnection = async () => {
    setIsRetrying(true);
    try {
      await refresh();
    } finally {
      setIsRetrying(false);
    }
  };

  const inboxSummary = dataService.getIntakeSummary();
  const alertsCount = dataService.getAlerts('Open').length;
  const remindersCount = dataService.getReminders('Pending Approval').length;

  return (
    <div className="min-h-screen bg-[#F8F7F4] flex flex-col md:flex-row text-espresso">
      {/* Mobile Top Header (Small Screens Only) */}
      <div className="md:hidden bg-[#FAF8F5] border-b border-[#EAE6DF] px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#8E6F58] flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
            </svg>
          </div>
          <span className="font-bold text-sm text-[#2B231F]">CA Copilot</span>
        </div>
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="p-1.5 rounded-lg border border-[#EAE6DF] bg-white text-[#5C5148]"
        >
          {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block shrink-0 sticky top-0 h-screen overflow-y-auto">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          unreadInboxCount={inboxSummary.all}
          openAlertsCount={alertsCount}
          pendingRemindersCount={remindersCount}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-espresso-dark/30 backdrop-blur-xs"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative z-50 w-64 bg-[#FAF8F5] h-full shadow-modal">
            <Sidebar
              activeTab={activeTab}
              onSelectTab={(tab) => {
                onSelectTab(tab);
                setIsMobileSidebarOpen(false);
              }}
              unreadInboxCount={inboxSummary.all}
              openAlertsCount={alertsCount}
              pendingRemindersCount={remindersCount}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Backend Connection Warning Banner */}
        {connectionStatus === 'unavailable' && (
          <div className="bg-[#FEF2F2] border-b border-[#FECACA] px-4 py-2 text-xs text-[#991B1B] flex items-center justify-between z-30">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
              <span>
                <strong>Backend Service Unreachable:</strong> Live data updates are currently paused. Please verify backend server connection.
              </span>
            </div>
            <button
              onClick={handleRetryConnection}
              disabled={isRetrying}
              className="px-2.5 py-1 bg-white hover:bg-[#FDF2F2] border border-[#FECACA] rounded-lg font-semibold text-xs text-[#991B1B] flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Retrying...' : 'Retry'}</span>
            </button>
          </div>
        )}

        {/* Desktop TopBar */}
        <TopBar
          onOpenSearch={handleOpenSearch}
          onOpenCopilot={() => {
            setLocalCopilotOpen(true);
            onOpenCopilot?.();
          }}
          notificationCount={inboxSummary.needs_review + alertsCount}
        />

        {/* Dynamic Page Content View */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Global Command Palette / Search Modal (⌘K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={handleCloseSearch}
        onAskCopilot={handleAskCopilotFromSearch}
      />

      {/* AI Copilot Side Drawer */}
      <AskCopilotDrawer
        isOpen={isDrawerOpen}
        initialQuery={copilotQuery || undefined}
        onClose={() => {
          setLocalCopilotOpen(false);
          onCloseCopilot();
        }}
      />

      {/* Work Item Detail Modal */}
      <WorkItemDetailModal
        item={selectedWorkItem}
        onClose={onCloseWorkItem}
      />
    </div>
  );
};
