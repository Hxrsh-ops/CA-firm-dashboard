import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { StatusBadge } from '../common/StatusBadge';

export const InboxView: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'unprocessed' | 'needs_review'>('all');
  const documents = dataService.getDocuments();

  const filteredDocs = documents.filter((doc) => {
    if (filter === 'needs_review') return doc.validation_status === 'Review Required';
    if (filter === 'unprocessed') return doc.processing_status !== 'Processed';
    return true;
  });

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#2B231F] font-display">
            AI Intake Inbox
          </h1>
          <p className="text-xs text-[#7A7169] mt-0.5">
            Real-time inbound client documents, email parsing & AI vector classifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-[#3D2D22] text-white'
                : 'bg-white border border-[#EAE6DF] text-[#5C5148] hover:bg-[#FAF8F5]'
            }`}
          >
            All Inbound ({documents.length})
          </button>
          <button
            onClick={() => setFilter('needs_review')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              filter === 'needs_review'
                ? 'bg-[#3D2D22] text-white'
                : 'bg-white border border-[#EAE6DF] text-[#5C5148] hover:bg-[#FAF8F5]'
            }`}
          >
            Needs Review (2)
          </button>
        </div>
      </div>

      {/* Intake Table */}
      <div className="bg-white border border-[#EAE6DF] rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#EAE6DF] bg-[#FAF8F5] text-[10.5px] font-bold text-[#8C8077] uppercase tracking-wider">
                <th className="py-3 px-4">Attachment / File</th>
                <th className="py-3 px-3">Sender Email</th>
                <th className="py-3 px-3">Extracted Type</th>
                <th className="py-3 px-3">Period</th>
                <th className="py-3 px-3">AI Confidence</th>
                <th className="py-3 px-3">Validation</th>
                <th className="py-3 px-3">Received At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F2EC]">
              {filteredDocs.map((doc) => (
                <tr key={doc.document_id} className="hover:bg-[#FAF9F6] transition-colors">
                  <td className="py-3 px-4 font-semibold text-[#2B231F] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#8C827A]" />
                    <span>{doc.filename}</span>
                  </td>
                  <td className="py-3 px-3 text-[#5C5148] font-mono text-[11px]">
                    {doc.sender_email}
                  </td>
                  <td className="py-3 px-3 text-[#2B231F] font-medium">
                    {doc.document_type}
                  </td>
                  <td className="py-3 px-3 text-[#7A7067]">
                    {doc.period}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        doc.ai_confidence >= 0.95
                          ? 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]'
                          : 'bg-[#FEF9EE] text-[#B45309] border border-[#FDE68A]'
                      }`}
                    >
                      {Math.round(doc.ai_confidence * 100)}%
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={doc.validation_status} size="sm" />
                  </td>
                  <td className="py-3 px-3 text-[#8C827A] whitespace-nowrap">
                    {new Date(doc.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, 11 Sep
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
