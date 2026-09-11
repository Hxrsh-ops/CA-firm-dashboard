import React from 'react';
import { FileText, ChevronRight, Layers, AlertTriangle } from 'lucide-react';
import type { IntakeItem } from '../../types';
import { ClientAvatar } from '../common/ClientAvatar';
import { StatusBadge } from '../common/StatusBadge';
import { ConfidenceBadge } from './ConfidenceBadge';

interface InboxTableProps {
  items: IntakeItem[];
  selectedItemId?: string;
  onSelectItem: (item: IntakeItem) => void;
}

export const InboxTable: React.FC<InboxTableProps> = ({
  items,
  selectedItemId,
  onSelectItem,
}) => {
  return (
    <div className="bg-white border border-[#EAE6DF] rounded-xl shadow-card overflow-hidden select-none">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#EAE6DF] bg-[#FAF8F5]/90 text-[10.5px] font-bold text-[#8C8077] uppercase tracking-wider">
              <th className="py-3 px-4 font-semibold">File / Attachment</th>
              <th className="py-3 px-3 font-semibold">Client</th>
              <th className="py-3 px-3 font-semibold">Document Type</th>
              <th className="py-3 px-3 font-semibold">Period</th>
              <th className="py-3 px-3 font-semibold">AI Confidence</th>
              <th className="py-3 px-3 font-semibold">Validation</th>
              <th className="py-3 px-3 font-semibold">Received</th>
              <th className="py-3 px-3 text-right font-semibold pr-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F2EC] text-[12.5px]">
            {items.map((item) => {
              const isSelected = selectedItemId === item.document_id;
              const isReview = item.validation_status === 'Review Required' || item.is_exception;

              return (
                <tr
                  key={item.document_id}
                  onClick={() => onSelectItem(item)}
                  className={`transition-colors cursor-pointer group ${
                    isSelected
                      ? 'bg-[#F5EFEB]/90 ring-1 ring-[#8E6F58]/30'
                      : isReview
                      ? 'bg-[#FFFDF9] hover:bg-[#FAF6F0]'
                      : 'hover:bg-[#FAF9F6]'
                  }`}
                >
                  {/* File / Attachment */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isReview ? 'bg-[#FEF9EE] text-[#D97706]' : 'bg-[#F5F2EC] text-[#5C5148]'
                        }`}
                      >
                        <FileText className="w-4 h-4" strokeWidth={1.8} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-[#2B231F] truncate group-hover:text-[#5F4635] transition-colors flex items-center gap-1.5">
                          <span className="truncate">{item.filename}</span>
                          {item.total_attachments > 1 && (
                            <span
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[9.5px] font-medium bg-[#EAE6DD] text-[#5C5148] rounded shrink-0"
                              title={`${item.total_attachments} files attached in this email submission`}
                            >
                              <Layers className="w-2.5 h-2.5" />
                              <span>{item.total_attachments}</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#8C827A] truncate mt-0.5 font-mono">
                          {item.file_size}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Client */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2">
                      <ClientAvatar initials={item.client_initials} size="sm" />
                      <div className="min-w-0">
                        <div className="font-semibold text-[#2B231F] truncate text-[12px]">
                          {item.client_name}
                        </div>
                        <div className="text-[10px] text-[#8C827A] truncate">
                          {item.entity_type}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Document Type */}
                  <td className="py-3.5 px-3 font-medium text-[#3D2D22]">
                    {item.document_type}
                  </td>

                  {/* Period */}
                  <td className="py-3.5 px-3 text-[#7A7067] font-normal">
                    {item.period}
                  </td>

                  {/* AI Confidence */}
                  <td className="py-3.5 px-3">
                    <ConfidenceBadge confidence={item.ai_confidence} showLabel={false} size="sm" />
                  </td>

                  {/* Validation Status */}
                  <td className="py-3.5 px-3">
                    {item.is_exception ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FDF2F2] text-[#991B1B] border border-[#FCA5A5]/70">
                        <AlertTriangle className="w-2.5 h-2.5 text-[#DC2626]" />
                        <span>{item.exception_type || 'Exception'}</span>
                      </span>
                    ) : (
                      <StatusBadge status={item.validation_status} size="sm" />
                    )}
                  </td>

                  {/* Received Timestamp */}
                  <td className="py-3.5 px-3 text-[#7A7067] whitespace-nowrap text-[11.5px]">
                    {item.received_formatted}
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-3 text-right pr-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectItem(item);
                      }}
                      className={`inline-flex items-center gap-1 text-[11.5px] font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                        isReview
                          ? 'bg-[#3D2D22] text-white border-transparent hover:bg-[#261B14]'
                          : 'bg-white border-[#EAE6DF] text-[#5C5148] hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <span>{isReview ? 'Review' : 'Inspect'}</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
