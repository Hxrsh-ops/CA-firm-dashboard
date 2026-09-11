import React, { useState } from 'react';
import { MoreVertical, ArrowRight, CheckCircle, Clock, Eye } from 'lucide-react';
import type { PriorityWorkItem } from '../../types';
import { ClientAvatar } from '../common/ClientAvatar';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityIndicator } from '../common/PriorityIndicator';

interface PriorityWorkTableProps {
  items: PriorityWorkItem[];
  onSelectItem: (item: PriorityWorkItem) => void;
  onViewAll?: () => void;
}

export const PriorityWorkTable: React.FC<PriorityWorkTableProps> = ({
  items,
  onSelectItem,
  onViewAll,
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  return (
    <div className="bg-white border border-[#EAE6DF] rounded-xl shadow-card overflow-hidden select-none">
      {/* Table Header Section */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-[#F5F2EC]">
        <div className="flex items-center gap-2.5">
          <h2 className="text-[15px] font-bold text-[#2B231F] font-display">
            Priority Work
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FDF2F2] text-[#B91C1C] border border-[#FCA5A5]/60">
            {items.length} items
          </span>
        </div>

        <button
          onClick={onViewAll}
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#755843] hover:text-[#3D2D22] transition-colors group"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#EAE6DF] bg-[#FAF8F5]/80 text-[10.5px] font-bold text-[#8C8077] tracking-wider uppercase">
              <th className="py-2.5 px-4 font-semibold">Client</th>
              <th className="py-2.5 px-3 font-semibold">Document / Task</th>
              <th className="py-2.5 px-3 font-semibold">Period</th>
              <th className="py-2.5 px-3 font-semibold">Status</th>
              <th className="py-2.5 px-3 font-semibold">Priority</th>
              <th className="py-2.5 px-3 font-semibold">Assigned To</th>
              <th className="py-2.5 px-3 font-semibold">Due Date</th>
              <th className="py-2.5 px-3 text-right font-semibold pr-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F2EC] text-[12.5px]">
            {items.map((item) => (
              <tr
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="hover:bg-[#FAF9F6] transition-colors cursor-pointer group"
              >
                {/* Client column */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <ClientAvatar initials={item.client_initials} size="md" />
                    <span className="font-semibold text-[#2B231F] group-hover:text-[#5F4635] transition-colors">
                      {item.client_name}
                    </span>
                  </div>
                </td>

                {/* Document / Task */}
                <td className="py-3 px-3 text-[#4A3E38] font-medium">
                  {item.document_type}
                </td>

                {/* Period */}
                <td className="py-3 px-3 text-[#7A7067] font-normal">
                  {item.period}
                </td>

                {/* Status */}
                <td className="py-3 px-3">
                  <StatusBadge status={item.status} size="sm" />
                </td>

                {/* Priority */}
                <td className="py-3 px-3">
                  <PriorityIndicator priority={item.priority} />
                </td>

                {/* Assigned To */}
                <td className="py-3 px-3 text-[#4A3E38] font-normal">
                  {item.assigned_to}
                </td>

                {/* Due Date */}
                <td className="py-3 px-3 text-[#7A7067] font-normal whitespace-nowrap">
                  {item.due_date}
                </td>

                {/* Action Column */}
                <td className="py-3 px-3 text-right pr-4 relative">
                  <button
                    onClick={(e) => toggleMenu(e, item.id)}
                    className="p-1 rounded-lg text-[#9E9288] hover:text-[#2B231F] hover:bg-[#EAE6DD] transition-colors"
                    aria-label="Actions"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Row Action Dropdown */}
                  {activeMenuId === item.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-4 top-10 w-48 bg-white rounded-xl shadow-modal border border-[#EAE6DF] py-1.5 z-30 text-xs text-left animate-in fade-in zoom-in-95 duration-100"
                    >
                      <button
                        onClick={() => {
                          setActiveMenuId(null);
                          onSelectItem(item);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-[#3D2D22] hover:bg-[#FAF8F5] transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#8C827A]" />
                        <span>Inspect Details</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveMenuId(null);
                          alert(`Triggered quick reminder for ${item.client_name}`);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-[#3D2D22] hover:bg-[#FAF8F5] transition-colors"
                      >
                        <Clock className="w-3.5 h-3.5 text-[#8C827A]" />
                        <span>Draft Follow-up Nudge</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveMenuId(null);
                          alert(`Marked ${item.client_name} task as verified`);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-[#16A34A] hover:bg-[#F0FDF4] transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Mark as Approved</span>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
