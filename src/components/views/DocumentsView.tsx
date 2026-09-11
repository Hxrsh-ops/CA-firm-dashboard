import React, { useState } from 'react';
import { FileText, Download, Eye } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { StatusBadge } from '../common/StatusBadge';

export const DocumentsView: React.FC = () => {
  const [selectedType, setSelectedType] = useState('All');
  const documents = dataService.getDocuments();

  const docTypes = ['All', 'Bank Statement', 'Expense Bills', 'Payroll Register', 'Sales Register', 'Purchase Register', 'TDS Return'];

  const filtered = selectedType === 'All'
    ? documents
    : documents.filter((d) => d.document_type === selectedType);

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#2B231F] font-display">
            Statutory Document Repository
          </h1>
          <p className="text-xs text-[#7A7169] mt-0.5">
            Verified client registers, statements, and tax supporting schedules
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {docTypes.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              selectedType === type
                ? 'bg-[#3D2D22] text-white'
                : 'bg-white border border-[#EAE6DF] text-[#5C5148] hover:bg-[#FAF8F5]'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Document Table */}
      <div className="bg-white border border-[#EAE6DF] rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#EAE6DF] bg-[#FAF8F5] text-[10.5px] font-bold text-[#8C8077] uppercase tracking-wider">
                <th className="py-3 px-4">Filename</th>
                <th className="py-3 px-3">Document Type</th>
                <th className="py-3 px-3">Period</th>
                <th className="py-3 px-3">Size</th>
                <th className="py-3 px-3">AI Match Confidence</th>
                <th className="py-3 px-3">Validation Status</th>
                <th className="py-3 px-3 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F2EC]">
              {filtered.map((doc) => (
                <tr key={doc.document_id} className="hover:bg-[#FAF9F6] transition-colors">
                  <td className="py-3 px-4 font-semibold text-[#2B231F] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#8C827A]" />
                    <span>{doc.filename}</span>
                  </td>
                  <td className="py-3 px-3 text-[#4A3E38] font-medium">
                    {doc.document_type}
                  </td>
                  <td className="py-3 px-3 text-[#7A7067]">
                    {doc.period}
                  </td>
                  <td className="py-3 px-3 text-[#8C827A] font-mono text-[11px]">
                    {doc.file_size || '1.8 MB'}
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
                      {Math.round(doc.ai_confidence * 100)}%
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={doc.validation_status} size="sm" />
                  </td>
                  <td className="py-3 px-3 text-right pr-4">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => alert(`Opening preview of ${doc.filename}`)}
                        className="p-1 rounded text-[#8C827A] hover:text-[#2B231F] hover:bg-[#EAE6DD]"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => alert(`Downloading ${doc.filename}`)}
                        className="p-1 rounded text-[#8C827A] hover:text-[#2B231F] hover:bg-[#EAE6DD]"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
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
