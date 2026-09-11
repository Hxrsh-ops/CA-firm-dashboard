import React, { useState } from 'react';
import { InboxTabs } from '../inbox/InboxTabs';
import { InboxFilters } from '../inbox/InboxFilters';
import { InboxTable } from '../inbox/InboxTable';
import { IntakeDetailDrawer } from '../inbox/IntakeDetailDrawer';
import { EmptyInboxState } from '../inbox/EmptyInboxState';
import { dataService } from '../../services/dataService';
import type { IntakeItem, IntakeTabFilter } from '../../types';

export const InboxView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<IntakeTabFilter>('all');
  const [search, setSearch] = useState('');
  const [clientId, setClientId] = useState('all');
  const [documentType, setDocumentType] = useState('all');
  const [period, setPeriod] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'lowest_confidence' | 'highest_confidence' | 'needs_attention'>('newest');
  const [selectedItem, setSelectedItem] = useState<IntakeItem | null>(null);
  const [, setRefreshKey] = useState(0);

  const counts = dataService.getIntakeSummary();

  const items = dataService.getIntakeItems({
    tab: activeTab,
    search,
    clientId,
    documentType,
    period,
    sortBy,
  });

  const hasActiveFilters =
    search.trim() !== '' ||
    clientId !== 'all' ||
    documentType !== 'all' ||
    period !== 'all' ||
    sortBy !== 'newest';

  const handleResetFilters = () => {
    setSearch('');
    setClientId('all');
    setDocumentType('all');
    setPeriod('all');
    setSortBy('newest');
  };

  const handleActionComplete = () => {
    setRefreshKey((k) => k + 1);
    if (selectedItem) {
      const refreshed = dataService.getIntakeItemById(selectedItem.document_id);
      setSelectedItem(refreshed || null);
    }
  };

  return (
    <div className="space-y-5 pb-12 select-none">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#2B231F] font-display">
            AI Intake Inbox
          </h1>
          <p className="text-[13px] text-[#7A7169] mt-0.5">
            Incoming client documents, automatically understood and routed by CA Copilot.
          </p>
        </div>

        {/* Quick Summary Tabs */}
        <InboxTabs
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          counts={counts}
        />
      </div>

      {/* 2. Filter & Search Controls */}
      <InboxFilters
        search={search}
        onSearchChange={setSearch}
        clientId={clientId}
        onClientChange={setClientId}
        documentType={documentType}
        onDocumentTypeChange={setDocumentType}
        period={period}
        onPeriodChange={setPeriod}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* 3. Main Operational Table or Empty State */}
      {items.length > 0 ? (
        <InboxTable
          items={items}
          selectedItemId={selectedItem?.document_id}
          onSelectItem={(item) => setSelectedItem(item)}
        />
      ) : (
        <EmptyInboxState
          message={
            activeTab === 'needs_review'
              ? 'No documents currently need review'
              : activeTab === 'exceptions'
              ? 'No active intake exceptions'
              : 'No matching intake items found'
          }
          submessage={
            hasActiveFilters
              ? 'Try adjusting your search criteria or resetting filters to see all inbound documents.'
              : 'All incoming client documents have been processed and validated.'
          }
          onReset={hasActiveFilters ? handleResetFilters : undefined}
        />
      )}

      {/* 4. Detail Review Workspace Drawer */}
      <IntakeDetailDrawer
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onActionComplete={handleActionComplete}
      />
    </div>
  );
};
