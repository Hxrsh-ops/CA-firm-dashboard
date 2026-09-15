import React, { useState } from 'react';
import { FileText, Copy, Eye, ExternalLink } from 'lucide-react';
import { dataService, useDataSync } from '../../services/dataService';
import { StatusBadge } from '../common/StatusBadge';
import { DocumentReviewModal } from '../common/DocumentReviewModal';
import type { Document } from '../../types';

export const DocumentsView: React.FC = () => {
  const { isLoaded } = useDataSync();
  const [selectedType, setSelectedType] = useState('All');
  const [selectedDocForReview, setSelectedDocForReview] = useState<Document | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const documents = dataService.getDocuments();

  const docTypes = ['All', 'Bank Statement', 'Expense Bills', 'Payroll Register', 'Sales Register', 'Purchase Register', 'TDS Return'];

  const filtered = selectedType === 'All'
    ? documents
    : documents.filter((d) => d.document_type === selectedType);

  const handleOpenReview = (doc: Document) => {
    setSelectedDocForReview(doc);
    setIsReviewOpen(true);
  };

  const handleDownloadInfo = (doc: Document) => {
    const text = `Document ID: ${doc.document_id}\nFilename: ${doc.filename}\nType: ${doc.document_type}\nPeriod: ${doc.period}\nClient ID: ${doc.client_id}\nValidation Status: ${doc.validation_status}\nDrive Ref: ${doc.drive_file_id || 'N/A'}\nReceived: ${doc.received_at}`;
    navigator.clipboard?.writeText(text);
    setToastMessage(`Document metadata copied for ${doc.filename}`);
    setTimeout(() => setToastMessage(null), 2500);
  };

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

      {/* Toast */}
      {toastMessage && (
        <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl text-xs font-semibold text-[#166534] animate-in fade-in duration-150">
          {toastMessage}
        </div>
      )}

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
              {!isLoaded ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[#8C827A]">
                    <div className="w-5 h-5 border-2 border-[#8E6F58] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading statutory documents repository...</span>
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((doc) => (
                  <tr 
                    key={doc.document_id} 
                    onClick={() => handleOpenReview(doc)}
                    className="hover:bg-[#FAF9F6] transition-colors cursor-pointer"
                  >
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
                    <td className="py-3 px-3 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1.5">
                        {doc.drive_file_id ? (
                          <a
                            href={`https://drive.google.com/file/d/${doc.drive_file_id}/view`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded text-[#8E6F58] hover:text-[#5F4635] hover:bg-[#EAE6DD] transition-colors"
                            title="Open Source Document in Google Drive"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        ) : (
                          <span
                            className="p-1 text-[#D5CECE] cursor-not-allowed"
                            title="Source document unavailable"
                          >
                            <FileText className="w-4 h-4 text-[#D5CECE]" />
                          </span>
                        )}
                        <button
                          onClick={() => handleOpenReview(doc)}
                          className="p-1 rounded text-[#8C827A] hover:text-[#2B231F] hover:bg-[#EAE6DD] transition-colors"
                          title="Inspect & Review Document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadInfo(doc)}
                          className="p-1 rounded text-[#8C827A] hover:text-[#2B231F] hover:bg-[#EAE6DD] transition-colors"
                          title="Copy Document Metadata / Reference"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[#8C827A]">
                    No statutory documents found {selectedType !== 'All' ? `for category "${selectedType}"` : 'in repository'}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Review Modal */}
      <DocumentReviewModal
        document={selectedDocForReview}
        isOpen={isReviewOpen}
        onClose={() => {
          setIsReviewOpen(false);
          setSelectedDocForReview(null);
        }}
        onActionComplete={() => {
          dataService.syncWithBackend();
        }}
      />
    </div>
  );
};

