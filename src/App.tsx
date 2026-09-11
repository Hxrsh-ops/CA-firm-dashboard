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

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            onSelectWorkItem={(item) => setSelectedWorkItem(item)}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onAskCopilot={(q) => setCopilotQuery(q)}
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
            onAskCopilot={(q) => setCopilotQuery(q)}
          />
        );
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <DashboardView
            onSelectWorkItem={(item) => setSelectedWorkItem(item)}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onAskCopilot={(q) => setCopilotQuery(q)}
          />
        );
    }
  };

  return (
    <AppShell
      activeTab={activeTab}
      onSelectTab={(tab) => {
        if (tab === 'copilot') {
          setCopilotQuery('What documents are missing for August 2026?');
        } else {
          setActiveTab(tab);
        }
      }}
      selectedWorkItem={selectedWorkItem}
      onCloseWorkItem={() => setSelectedWorkItem(null)}
      copilotQuery={copilotQuery}
      onCloseCopilot={() => setCopilotQuery(null)}
      onOpenCopilotWithQuery={(q) => setCopilotQuery(q)}
    >
      {renderActiveView()}
    </AppShell>
  );
};

export default App;
