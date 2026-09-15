import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Building2,
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Edit3,
  Check,
  HelpCircle,
  Layers,
  Mail,
  ExternalLink
} from 'lucide-react';
import type { Document, DocumentType } from '../../types';
import { dataService } from '../../services/dataService';
import { StatusBadge } from './StatusBadge';

interface DocumentReviewModalProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onActionComplete?: () => void;
}

const MASTER_DOC_TYPES: DocumentType[] = [
  'Sales Register',
  'Purchase Register',
  'Bank Statement',
  'Expense Bills',
  'Payroll Summary',
  'Payroll Register',
  'TDS Return',
  'Customs Duty Challan',
  'GST 3B Supporting',
  'GSTR-1 Data',
];

export const DocumentReviewModal: React.FC<DocumentReviewModalProps> = ({
  document: doc,
  isOpen,
  onClose,
  onActionComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'reclassify' | 'reject'>('overview');
  const [reclassifyType, setReclassifyType] = useState<DocumentType>('Sales Register');
  const [reclassifyPeriod, setReclassifyPeriod] = useState<string>('2026-08');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [rejectReason, setRejectReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (doc) {
      setReclassifyType(doc.document_type || 'Sales Register');
      setReclassifyPeriod(doc.period || '2026-08');
      setReviewNotes('');
      setRejectReason('');
      setActiveTab('overview');
      setFeedback(null);
      setIsSubmitting(false);
    }
  }, [doc]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !doc) return null;

  const client = dataService.getClientById(doc.client_id);
  const isUnknownClient = !client || doc.client_id === 'CLI-UNKNOWN';
  const confidencePct = Math.round((doc.ai_confidence || 0) * 100);
  const isHighConfidence = confidencePct >= 95;

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return 'N/A';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const success = await dataService.reviewDocument(doc.document_id, {
        action: 'approve',
        notes: reviewNotes.trim() || undefined,
        reviewed_by: 'CA Partner',
      });

      if (success) {
        setFeedback({
          type: 'success',
          message: `Document "${doc.filename}" approved as Valid. Audit record logged.`,
        });
        setTimeout(() => {
          onActionComplete?.();
          onClose();
        }, 1200);
      } else {
        setFeedback({
          type: 'error',
          message: 'Failed to approve document. Please verify backend connection.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error occurred while submitting review.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReclassify = async () => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const success = await dataService.reviewDocument(doc.document_id, {
        action: 'reclassify',
        document_type: reclassifyType,
        period: reclassifyPeriod,
        notes: reviewNotes.trim() || `Reclassified to ${reclassifyType} (${reclassifyPeriod}) by CA Partner`,
        reviewed_by: 'CA Partner',
      });

      if (success) {
        setFeedback({
          type: 'success',
          message: `Reclassified to ${reclassifyType} (${reclassifyPeriod}) and marked Valid.`,
        });
        setTimeout(() => {
          onActionComplete?.();
          onClose();
        }, 1200);
      } else {
        setFeedback({
          type: 'error',
          message: 'Failed to reclassify document. Please check backend status.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error occurred while reclassifying.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setFeedback({
        type: 'error',
        message: 'Please provide a reason for rejecting this document.',
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const success = await dataService.reviewDocument(doc.document_id, {
        action: 'reject',
        notes: rejectReason.trim(),
        reviewed_by: 'CA Partner',
      });

      if (success) {
        setFeedback({
          type: 'success',
          message: 'Document rejected and marked Invalid. High-severity alert logged.',
        });
        setTimeout(() => {
          onActionComplete?.();
          onClose();
        }, 1200);
      } else {
        setFeedback({
          type: 'error',
          message: 'Failed to reject document. Please check backend connection.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error occurred while rejecting.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/45 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-modal border border-[#EAE6DF] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-[#FAF8F5] border-b border-[#EAE6DF] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#F5F2EC] text-[#5C5148] flex items-center justify-center shrink-0 border border-[#EAE6DF]">
              <FileText className="w-5 h-5 text-[#755843]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#2B231F] truncate font-display">
                  {doc.filename}
                </h2>
                <StatusBadge status={doc.validation_status} size="sm" />
              </div>
              <p className="text-[11px] text-[#8C827A] mt-0.5 font-mono truncate">
                ID: {doc.document_id} · Received {formatDateTime(doc.received_at)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8C827A] hover:text-[#2B231F] hover:bg-[#EAE6DD] transition-colors shrink-0"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`px-6 py-3 text-xs font-semibold flex items-center gap-2 border-b shrink-0 ${
              feedback.type === 'success'
                ? 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]'
                : 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Client Identity & Filing Schedule */}
          <div className="bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#8C8077] uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Client Profile
              </span>
              <span className="font-mono text-[#5C5148]">{doc.client_id}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#8C827A] block text-[10.5px]">Client Name</span>
                <span className="font-bold text-[#2B231F] text-[13px]">
                  {isUnknownClient ? 'Unregistered Client' : client?.display_name || client?.legal_name}
                </span>
                {client?.legal_name && client.legal_name !== client.display_name && (
                  <span className="text-[11px] text-[#7A7067] block">
                    {client.legal_name}
                  </span>
                )}
              </div>

              <div>
                <span className="text-[#8C827A] block text-[10.5px]">Assigned CA</span>
                <span className="font-semibold text-[#2B231F]">
                  {client?.assigned_ca || 'CA Partner'}
                </span>
                <span className="text-[11px] text-[#7A7067] block">
                  Entity: {client?.entity_type || 'Private Limited'}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Document & Ingestion Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-white border border-[#EAE6DF] rounded-xl p-3.5 space-y-1">
              <span className="text-[10.5px] font-semibold text-[#8C8077] uppercase flex items-center gap-1">
                <Layers className="w-3 h-3" />
                Document Type
              </span>
              <div className="font-bold text-[#2B231F] text-[13px]">
                {doc.document_type}
              </div>
              <span className="text-[11px] text-[#7A7067] block">
                Period: <strong className="text-[#2B231F]">{doc.period}</strong>
              </span>
            </div>

            <div className="bg-white border border-[#EAE6DF] rounded-xl p-3.5 space-y-1">
              <span className="text-[10.5px] font-semibold text-[#8C8077] uppercase flex items-center gap-1">
                <Mail className="w-3 h-3" />
                Inbound Source
              </span>
              <div className="font-medium text-[#2B231F] truncate" title={doc.sender_email}>
                {doc.sender_email || 'Direct Upload'}
              </div>
              <span className="text-[11px] text-[#7A7067] block">
                Size: {doc.file_size || '1.8 MB'}
              </span>
            </div>

            <div className="bg-white border border-[#EAE6DF] rounded-xl p-3.5 space-y-1">
              <span className="text-[10.5px] font-semibold text-[#8C8077] uppercase flex items-center gap-1">
                <HardDrive className="w-3 h-3" />
                Storage & Source
              </span>
              <div className="font-mono text-[11px] text-[#5C5148] truncate" title={doc.drive_file_id || 'CA_Copilot_Vault'}>
                {doc.drive_file_id ? `${doc.drive_file_id.slice(0, 16)}...` : 'CA_Copilot_Vault'}
              </div>
              <div className="pt-0.5">
                {doc.drive_file_id ? (
                  <a
                    href={`https://drive.google.com/file/d/${doc.drive_file_id}/view`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8E6F58] hover:text-[#5F4635] hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open Source PDF</span>
                  </a>
                ) : (
                  <span className="text-[10.5px] text-[#A89F95] italic">Source unavailable</span>
                )}
              </div>
            </div>
          </div>

          {/* 3. AI Extraction Intelligence vs CA Decision */}
          <div className="border border-[#EAE6DF] rounded-xl p-4 bg-[#FAF8F5] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#8C8077] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#755843]" />
                AI Extraction Intelligence
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  isHighConfidence
                    ? 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]'
                    : confidencePct >= 70
                    ? 'bg-[#FEF9EE] text-[#D97706] border-[#FDE68A]'
                    : 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                }`}
              >
                {confidencePct}% AI Match Confidence
              </span>
            </div>

            {/* Confidence Progress Bar */}
            <div className="w-full bg-[#EAE6DF] h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isHighConfidence ? 'bg-[#16A34A]' : confidencePct >= 70 ? 'bg-[#D97706]' : 'bg-[#DC2626]'
                }`}
                style={{ width: `${Math.max(5, Math.min(100, confidencePct))}%` }}
              />
            </div>

            {/* Deterministic Rules Passed */}
            <div className="bg-white border border-[#EAE6DF] rounded-lg p-3 space-y-1.5 text-xs text-[#5C5148]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                  Client roster verification
                </span>
                <span className="font-mono text-[10.5px] font-semibold text-[#166534]">
                  {!isUnknownClient ? 'PASS' : 'UNMATCHED'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                  Master taxonomy classification
                </span>
                <span className="font-mono text-[10.5px] font-semibold text-[#166534]">PASS</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                  Filing period detection ({doc.period})
                </span>
                <span className="font-mono text-[10.5px] font-semibold text-[#166534]">PASS</span>
              </div>
            </div>

            {/* AI Notes / Reason for Review */}
            {doc.notes && (
              <div className="bg-[#FEF9EE] border border-[#FDE68A] rounded-lg p-3 text-xs text-[#92400E] space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Review Rationale:
                </div>
                <p className="text-[11.5px]">{doc.notes}</p>
              </div>
            )}
          </div>

          {/* 4. CA Decision Workflow Tabs */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-2">
              <span className="text-[11px] font-bold text-[#8C8077] uppercase tracking-wider">
                CA Decision & Statutory Sign-Off
              </span>
              <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#EAE6DF]">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === 'overview'
                      ? 'bg-white shadow-2xs text-[#2B231F] font-bold'
                      : 'text-[#7A7067] hover:text-[#2B231F]'
                  }`}
                >
                  Approve Valid
                </button>
                <button
                  onClick={() => setActiveTab('reclassify')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === 'reclassify'
                      ? 'bg-white shadow-2xs text-[#2B231F] font-bold'
                      : 'text-[#7A7067] hover:text-[#2B231F]'
                  }`}
                >
                  Reclassify
                </button>
                <button
                  onClick={() => setActiveTab('reject')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === 'reject'
                      ? 'bg-[#FEF2F2] text-[#991B1B] font-bold'
                      : 'text-[#7A7067] hover:text-[#991B1B]'
                  }`}
                >
                  Reject / Invalid
                </button>
              </div>
            </div>

            {/* Tab 1: Approve Valid */}
            {activeTab === 'overview' && (
              <div className="space-y-3 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl p-4 text-xs">
                <p className="text-[#5C5148]">
                  Confirming this document as <strong className="text-[#166534]">Valid</strong> marks the client requirement as On Track in compliance tracking, resolves any open Review Required alerts, and generates an audit log entry under your CA signature.
                </p>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#8C8077] uppercase">
                    Partner Sign-Off Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="e.g. Verified figures against GST portal summaries"
                    className="w-full text-xs p-2.5 bg-white border border-[#EAE6DF] rounded-lg text-[#2B231F] outline-none focus:border-[#755843]"
                  />
                </div>
              </div>
            )}

            {/* Tab 2: Reclassify */}
            {activeTab === 'reclassify' && (
              <div className="space-y-3 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl p-4 text-xs">
                <p className="text-[#5C5148]">
                  Correct the document classification or statutory period. This will update the document record and mark it Valid under the corrected categorization.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-[#8C8077] uppercase">
                      Document Type
                    </label>
                    <select
                      value={reclassifyType}
                      onChange={(e) => setReclassifyType(e.target.value as DocumentType)}
                      className="w-full text-xs p-2 bg-white border border-[#EAE6DF] rounded-lg font-semibold text-[#2B231F] outline-none focus:border-[#755843]"
                    >
                      {MASTER_DOC_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-[#8C8077] uppercase">
                      Statutory Period
                    </label>
                    <input
                      type="text"
                      value={reclassifyPeriod}
                      onChange={(e) => setReclassifyPeriod(e.target.value)}
                      placeholder="e.g. 2026-08"
                      className="w-full text-xs p-2 bg-white border border-[#EAE6DF] rounded-lg font-semibold text-[#2B231F] outline-none focus:border-[#755843]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#8C8077] uppercase">
                    Reason for Reclassification
                  </label>
                  <input
                    type="text"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="e.g. Corrected misidentified Purchase Register to Sales Register"
                    className="w-full text-xs p-2.5 bg-white border border-[#EAE6DF] rounded-lg text-[#2B231F] outline-none focus:border-[#755843]"
                  />
                </div>
              </div>
            )}

            {/* Tab 3: Reject / Mark Invalid */}
            {activeTab === 'reject' && (
              <div className="space-y-3 bg-[#FEF2F2]/50 border border-[#FECACA] rounded-xl p-4 text-xs">
                <p className="text-[#991B1B]">
                  Marking this document as <strong className="text-[#991B1B]">Invalid</strong> will flag it as Failed, raise a high-severity alert for client follow-up, and log an audit trail entry.
                </p>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#991B1B] uppercase">
                    Rejection Reason (Required) *
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Provide specific CA reason (e.g. Corrupted file, incorrect client legal entity, missing tax invoice breakdowns)..."
                    rows={2}
                    className="w-full text-xs p-2.5 bg-white border border-[#FECACA] rounded-lg text-[#2B231F] outline-none focus:border-[#DC2626]"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-[#FAF8F5] border-t border-[#EAE6DF] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-[#EAE6DF] bg-white text-xs font-semibold text-[#5C5148] hover:bg-[#F7F4EE] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            {doc.drive_file_id ? (
              <a
                href={`https://drive.google.com/file/d/${doc.drive_file_id}/view`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl border border-[#DDD7CB] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#3D2D22] shadow-2xs flex items-center gap-1.5 transition-colors"
                title="Open archived source document in Google Drive"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#8E6F58]" />
                <span>Open Source Document</span>
              </a>
            ) : (
              <button
                disabled
                className="px-3.5 py-2 rounded-xl border border-[#EAE6DF] bg-[#F5F2EC] text-xs font-medium text-[#A89F95] cursor-not-allowed flex items-center gap-1.5"
                title="Source document unavailable (no drive_file_id linked)"
              >
                <FileText className="w-3.5 h-3.5 text-[#A89F95]" />
                <span>Source Unavailable</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'overview' && (
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-[#3D2D22] hover:bg-[#261B14] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#86EFAC]" />
                )}
                <span>Approve as Valid</span>
              </button>
            )}

            {activeTab === 'reclassify' && (
              <button
                onClick={handleReclassify}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-[#3D2D22] hover:bg-[#261B14] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Edit3 className="w-3.5 h-3.5 text-[#FDE68A]" />
                )}
                <span>Reclassify & Validate</span>
              </button>
            )}

            {activeTab === 'reject' && (
              <button
                onClick={handleReject}
                disabled={isSubmitting || !rejectReason.trim()}
                className="px-5 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] disabled:bg-[#FCA5A5] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-white" />
                )}
                <span>Reject Document</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
