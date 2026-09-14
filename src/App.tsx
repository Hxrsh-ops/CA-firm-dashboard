import React, { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import type { NavigationTab } from './components/layout/Sidebar';
import { DashboardView } from './components/views/DashboardView';
import { InboxView } from './components/views/InboxView';
import { ClientsView } from './components/views/ClientsView';
import { DocumentsView } from './components/views/DocumentsView';
import { AlertsView } from './components/views/AlertsView';
import { RemindersView } from './components/views/RemindersView';
import { ReportsView } from './components/views/ReportsView';
import { SettingsView } from './components/views/SettingsView';
import type { PriorityWorkItem } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [selectedWorkItem, setSelectedWorkItem] = useState<PriorityWorkItem | null>(null);
  const [copilotQuery, setCopilotQuery] = useState<string | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            onSelectWorkItem={(item) => setSelectedWorkItem(item)}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onAskCopilot={(q) => {
              setCopilotQuery(q);
              setIsCopilotOpen(true);
            }}
          />
        );
      case 'inbox':
        return <InboxView />;
      case 'clients':
        return <ClientsView />;
      case 'documents':
        return <DocumentsView />;
      case 'alerts':
        return <AlertsView />;
      case 'reminders':
        return <RemindersView />;
      case 'reports':
        return <ReportsView />;
      case 'copilot':
        return (
          <DashboardView
            onSelectWorkItem={(item) => setSelectedWorkItem(item)}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onAskCopilot={(q) => {
              setCopilotQuery(q);
              setIsCopilotOpen(true);
            }}
          />
        );
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <DashboardView
            onSelectWorkItem={(item) => setSelectedWorkItem(item)}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onAskCopilot={(q) => {
              setCopilotQuery(q);
              setIsCopilotOpen(true);
            }}
          />
        );
    }
  };

  return (
    <AppShell
      activeTab={activeTab}
      onSelectTab={(tab) => {
        if (tab === 'copilot') {
          setIsCopilotOpen(true);
        } else {
          setActiveTab(tab);
        }
      }}
      selectedWorkItem={selectedWorkItem}
      onCloseWorkItem={() => setSelectedWorkItem(null)}
      copilotQuery={copilotQuery}
      isCopilotOpen={isCopilotOpen}
      onCloseCopilot={() => {
        setCopilotQuery(null);
        setIsCopilotOpen(false);
      }}
      onOpenCopilot={() => setIsCopilotOpen(true)}
      onOpenCopilotWithQuery={(q) => {
        setCopilotQuery(q);
        setIsCopilotOpen(true);
      }}
    >
      {renderActiveView()}
    </AppShell>
  );
};

export default App;
