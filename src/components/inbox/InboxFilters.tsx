import React from 'react';
import { Search, X, ArrowUpDown } from 'lucide-react';
import { dataService } from '../../services/dataService';

interface InboxFiltersProps {
  search: string;
  onSearchChange: (search: string) => void;
  clientId: string;
  onClientChange: (clientId: string) => void;
  documentType: string;
  onDocumentTypeChange: (docType: string) => void;
  period: string;
  onPeriodChange: (period: string) => void;
  sortBy: 'newest' | 'oldest' | 'lowest_confidence' | 'highest_confidence' | 'needs_attention';
  onSortByChange: (sort: 'newest' | 'oldest' | 'lowest_confidence' | 'highest_confidence' | 'needs_attention') => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export const InboxFilters: React.FC<InboxFiltersProps> = ({
  search,
  onSearchChange,
  clientId,
  onClientChange,
  documentType,
  onDocumentTypeChange,
  period,
  onPeriodChange,
  sortBy,
  onSortByChange,
  onResetFilters,
  hasActiveFilters,
}) => {
  const clients = dataService.getClients();
  const docTypes = [
    'All Document Types',
    'Bank Statement',
    'Expense Bills',
    'Payroll Register',
    'Sales Register',
    'Purchase Register',
    'TDS Return',
    'Customs Duty Challan',
  ];
  const periods = ['All Periods', 'Aug 2026', 'Jul 2026'];

  return (
    <div className="bg-white border border-[#EAE6DF] rounded-xl p-3 shadow-card space-y-3 select-none">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[#8C827A] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search files, clients, or senders..."
            className="w-full bg-[#FAF8F5] border border-[#E4DFD6] focus:border-[#8E6F58] focus:bg-white text-xs text-[#2B231F] placeholder-[#9E948B] rounded-xl pl-9 pr-8 py-2 outline-none transition-all shadow-2xs"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C827A] hover:text-[#2B231F]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters & Sort */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Client Filter */}
          <div className="relative">
            <select
              value={clientId}
              onChange={(e) => onClientChange(e.target.value)}
              className="bg-[#FAF8F5] border border-[#EAE6DF] text-[#5C5148] hover:border-[#D5C2B4] rounded-lg px-2.5 py-1.5 outline-none font-medium cursor-pointer"
            >
              <option value="all">All Clients</option>
              {clients.map((c) => (
                <option key={c.client_id} value={c.client_id}>
                  {c.display_name}
                </option>
              ))}
            </select>
          </div>

          {/* Document Type Filter */}
          <div className="relative">
            <select
              value={documentType}
              onChange={(e) => onDocumentTypeChange(e.target.value)}
              className="bg-[#FAF8F5] border border-[#EAE6DF] text-[#5C5148] hover:border-[#D5C2B4] rounded-lg px-2.5 py-1.5 outline-none font-medium cursor-pointer"
            >
              {docTypes.map((t) => (
                <option key={t} value={t === 'All Document Types' ? 'all' : t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Period Filter */}
          <div className="relative">
            <select
              value={period}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="bg-[#FAF8F5] border border-[#EAE6DF] text-[#5C5148] hover:border-[#D5C2B4] rounded-lg px-2.5 py-1.5 outline-none font-medium cursor-pointer"
            >
              {periods.map((p) => (
                <option key={p} value={p === 'All Periods' ? 'all' : p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-[#FAF8F5] border border-[#EAE6DF] rounded-lg px-2.5 py-1.5">
            <ArrowUpDown className="w-3 h-3 text-[#8C827A]" />
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as any)}
              className="bg-transparent text-[#5C5148] outline-none font-medium cursor-pointer"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="needs_attention">Needs attention</option>
              <option value="lowest_confidence">Lowest confidence</option>
              <option value="highest_confidence">Highest confidence</option>
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="text-[#991B1B] hover:text-[#7F1D1D] font-semibold text-[11px] px-2 py-1 bg-[#FDF2F2] rounded-lg border border-[#FCA5A5]/60 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
