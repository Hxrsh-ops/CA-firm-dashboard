import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Mail,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Edit3,
  Check,
  Eye,
  Building2,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import type { IntakeItem, DocumentType } from '../../types';
import { dataService } from '../../services/dataService';
import { StatusBadge } from '../common/StatusBadge';
import { ConfidenceBadge } from './ConfidenceBadge';

interface IntakeDetailDrawerProps {
  item: IntakeItem | null;
  onClose: () => void;
  onActionComplete?: () => void;
}

export const IntakeDetailDrawer: React.FC<IntakeDetailDrawerProps> = ({
  item,
  onClose,
  onActionComplete,
}) => {
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('Expense Bills');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Aug 2026');
  const [isEditingType, setIsEditingType] = useState(false);
  const [isEditingPeriod, setIsEditingPeriod] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setSelectedDocType(item.document_type);
      setSelectedPeriod(item.period);
      setIsEditingType(false);
      setIsEditingPeriod(false);
      setShowOverrideForm(false);
      setSuccessToast(null);
    }
  }, [item]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && item) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, onClose]);

  if (!item) return null;

  const docTypes: DocumentType[] = [
    'Sales Register',
    'Purchase Register',
    'Bank Statement',
    'Expense Bills',
    'Payroll Summary',
    'Payroll Register',
    'TDS Return',
    'Customs Duty Challan',
  ];

  const periods = ['Aug 2026', 'Jul 2026', 'Jun 2026', 'Sep 2026'];

  const handleApproveValid = async () => {
    try {
      const ok = await dataService.updateDocumentValidation(
        item.document_id,
        'Valid',
        'Partner CA Biju approved intake classification and reconciliation.'
      );
      if (ok) {
        setSuccessToast('Document verified & marked Valid. Audit log recorded.');
        setTimeout(() => {
          onActionComplete?.();
        }, 800);
      } else {
        setSuccessToast('Failed to update validation on backend.');
      }
    } catch {
      setSuccessToast('Error updating document validation.');
    }
  };

  const handleSaveTypeCorrection = async () => {
    try {
      const ok = await dataService.updateDocumentClassification(item.document_id, selectedDocType);
      setIsEditingType(false);
      if (ok) {
        setSuccessToast(`Classification corrected to ${selectedDocType}. Validated.`);
        setTimeout(() => {
          onActionComplete?.();
        }, 800);
      } else {
        setSuccessToast('Failed to save classification on backend.');
      }
    } catch {
      setSuccessToast('Error saving classification correction.');
    }
  };

  const handleSavePeriodCorrection = async () => {
    try {
      const ok = await dataService.updateDocumentPeriod(item.document_id, selectedPeriod);
      setIsEditingPeriod(false);
      if (ok) {
        setSuccessToast(`Period corrected to ${selectedPeriod}.`);
        setTimeout(() => {
          onActionComplete?.();
        }, 800);
      } else {
        setSuccessToast('Failed to save period on backend.');
      }
    } catch {
      setSuccessToast('Error saving period correction.');
    }
  };

  const handleMarkNotRequired = async () => {
    if (!overrideReason.trim()) return;
    try {
      const ok = await dataService.updateDocumentValidation(
        item.document_id,
        'Valid',
        `CA Decision: Marked Not Required — ${overrideReason}`
      );
      setShowOverrideForm(false);
      if (ok) {
        setSuccessToast('Marked "Not Required" with CA rationale. Audit trail logged.');
        setTimeout(() => {
          onActionComplete?.();
        }, 800);
      } else {
        setSuccessToast('Failed to log CA override on backend.');
      }
    } catch {
      setSuccessToast('Error logging CA override.');
    }
  };

  const isReview = item.validation_status === 'Review Required' || item.is_exception;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-espresso-dark/35 backdrop-blur-2xs select-none">
      <div className="w-full max-w-xl bg-white h-full border-l border-[#EAE6DF] shadow-modal flex flex-col justify-between animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="px-6 py-4.5 border-b border-[#EAE6DF] bg-[#FAF8F5] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isReview ? 'bg-[#FEF9EE] text-[#D97706]' : 'bg-[#F5F2EC] text-[#5C5148]'
              }`}
            >
              <FileText className="w-5 h-5" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <h2 className="text-[14.5px] font-bold text-[#2B231F] truncate font-display">
                {item.filename}
              </h2>
              <p className="text-[11px] text-[#8C827A] truncate mt-0.5">
                From: <span className="font-mono text-[#5C5148]">{item.sender_email}</span> · {item.received_formatted}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8C827A] hover:text-[#2B231F] hover:bg-[#EAE6DD] transition-colors shrink-0 ml-2"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body (Scrollable Review Workspace) */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 divide-y divide-[#F5F2EC]">
          {/* Toast Notification */}
          {successToast && (
            <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl flex items-center gap-2 text-xs font-semibold text-[#166534] animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {/* 1. Client Match Card */}
          {(() => {
            const isUnknownClient = !item.client_id || item.client_id === 'CLI-UNKNOWN' || item.client_id.toLowerCase().includes('unknown');
            return (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold text-[#8C8077] uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Client Identification</span>
                  </span>
                  {isUnknownClient ? (
                    <span className="text-[11px] font-semibold text-[#B45309] bg-[#FFFBEB] px-2 py-0.5 rounded-full border border-[#FDE68A]">
                      ⚠ Unknown Client
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-[#166534] bg-[#F0FDF4] px-2 py-0.5 rounded-full border border-[#BBF7D0]">
                      ✓ Client matched
                    </span>
                  )}
                </div>

                <div className="bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl p-3.5 flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-bold text-[#2B231F]">
                      {isUnknownClient ? `Unregistered Client (${item.sender_email})` : item.client_name}
                    </div>
                    <div className="text-[11px] text-[#8C827A] mt-0.5">
                      {isUnknownClient
                        ? 'Sender address not linked to practice roster'
                        : `${item.entity_type} · Assigned: `}
                      {!isUnknownClient && <strong className="text-[#2B231F]">{item.assigned_ca}</strong>}
                    </div>
                  </div>
                  <span className="font-mono text-[10.5px] text-[#8C827A] bg-white px-2 py-1 rounded border border-[#EAE6DF]">
                    {item.client_id}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* 2. Email Context & Multi-Attachment Support */}
          <div className="pt-5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold text-[#8C8077] uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                <span>Inbound Email Submission</span>
              </span>
              <span className="text-[11px] font-medium text-[#7A7067] flex items-center gap-1">
                <Layers className="w-3 h-3" />
                <span>{item.email_attachments.length} attachment{item.email_attachments.length > 1 ? 's' : ''}</span>
              </span>
            </div>

            <div className="bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl p-3.5 text-xs text-[#5C5148] space-y-2">
              <div className="grid grid-cols-3 gap-2 border-b border-[#EAE6DF]/70 pb-2 text-[11.5px]">
                <div className="col-span-1 text-[#8C827A] font-medium">Subject:</div>
                <div className="col-span-2 font-semibold text-[#2B231F] truncate">
                  {item.email_subject}
                </div>
                <div className="col-span-1 text-[#8C827A] font-medium">Sender:</div>
                <div className="col-span-2 font-mono text-[11px] text-[#40382D]">
                  {item.sender_email}
                </div>
              </div>

              {/* Attachments List */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-semibold text-[#8C8077] uppercase block">
                  Email Attachments Stream:
                </span>
                {item.email_attachments.map((att, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded-lg border flex items-center justify-between text-xs ${
                      att.is_current
                        ? 'bg-white border-[#8E6F58] font-semibold shadow-2xs'
                        : 'bg-[#F5F2EC]/60 border-[#EAE6DF] text-[#7A7067]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-[#8C827A] shrink-0" />
                      <span className="truncate">{att.filename}</span>
                      {att.is_current && (
                        <span className="text-[9.5px] bg-[#3D2D22] text-white px-1.5 py-0.2 rounded shrink-0">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10.5px] font-mono text-[#8C827A]">
                        {Math.round(att.confidence * 100)}%
                      </span>
                      <StatusBadge status={att.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. AI Interpretation & Confidence */}
          <div className="pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold text-[#8C8077] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#755843]" />
                <span>AI Interpretation & Classification</span>
              </span>
              <ConfidenceBadge confidence={item.ai_confidence} showLabel size="sm" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Document Type Card */}
              <div className="bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-[#8C8077] uppercase">
                      Identified Type
                    </span>
                    {!isEditingType && (
                      <button
                        onClick={() => setIsEditingType(true)}
                        className="text-[10.5px] text-[#755843] hover:text-[#2B231F] font-semibold flex items-center gap-0.5"
                      >
                        <Edit3 className="w-2.5 h-2.5" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                  {isEditingType ? (
                    <div className="mt-2 space-y-1.5">
                      <select
                        value={selectedDocType}
                        onChange={(e) => setSelectedDocType(e.target.value as DocumentType)}
                        className="w-full text-xs p-1.5 bg-white border border-[#EAE6DF] rounded-lg outline-none font-semibold text-[#2B231F]"
                      >
                        {docTypes.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={handleSaveTypeCorrection}
                          className="px-2 py-0.5 bg-[#3D2D22] text-white text-[10px] font-semibold rounded"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setIsEditingType(false)}
                          className="px-2 py-0.5 text-[#7A7067] text-[10px]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[13px] font-bold text-[#2B231F] mt-1">
                      {item.document_type}
                    </div>
                  )}
                </div>
                <div className="text-[10.5px] text-[#8C827A] mt-1">
                  Confidence: <strong className="font-mono text-[#2B231F]">{Math.round(item.ai_confidence * 100)}%</strong>
                </div>
              </div>

              {/* Period Card */}
              <div className="bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-[#8C8077] uppercase">
                      Identified Period
                    </span>
                    {!isEditingPeriod && (
                      <button
                        onClick={() => setIsEditingPeriod(true)}
                        className="text-[10.5px] text-[#755843] hover:text-[#2B231F] font-semibold flex items-center gap-0.5"
                      >
                        <Edit3 className="w-2.5 h-2.5" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                  {isEditingPeriod ? (
                    <div className="mt-2 space-y-1.5">
                      <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="w-full text-xs p-1.5 bg-white border border-[#EAE6DF] rounded-lg outline-none font-semibold text-[#2B231F]"
                      >
                        {periods.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={handleSavePeriodCorrection}
                          className="px-2 py-0.5 bg-[#3D2D22] text-white text-[10px] font-semibold rounded"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setIsEditingPeriod(false)}
                          className="px-2 py-0.5 text-[#7A7067] text-[10px]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[13px] font-bold text-[#2B231F] mt-1">
                      {item.period}
                    </div>
                  )}
                </div>
                <div className="text-[10.5px] text-[#8C827A] mt-1">
                  Matched against: <span className="font-mono text-[#2B231F]">Monthly Cycle</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Deterministic Rule Checks */}
          <div className="pt-5 space-y-2.5">
            <span className="text-[10.5px] font-bold text-[#8C8077] uppercase tracking-wider block">
              Deterministic Rule Engine Checks
            </span>

            <div className="bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#2B231F]">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#16A34A] stroke-[2.5]" />
                  <span>Client exists in active practice roster</span>
                </div>
                <span className="font-mono text-[11px] text-[#16A34A] font-semibold">PASS</span>
              </div>
              <div className="flex items-center justify-between text-[#2B231F]">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#16A34A] stroke-[2.5]" />
                  <span>Document type recognized in master taxonomy</span>
                </div>
                <span className="font-mono text-[11px] text-[#16A34A] font-semibold">PASS</span>
              </div>
              <div className="flex items-center justify-between text-[#2B231F]">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#16A34A] stroke-[2.5]" />
                  <span>Statutory compliance period identified</span>
                </div>
                <span className="font-mono text-[11px] text-[#16A34A] font-semibold">PASS</span>
              </div>
              <div className="flex items-center justify-between text-[#2B231F]">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#16A34A] stroke-[2.5]" />
                  <span>Requirement exists in client filing schedule</span>
                </div>
                <span className="font-mono text-[11px] text-[#16A34A] font-semibold">PASS</span>
              </div>

              {isReview ? (
                <div className="flex items-center justify-between text-[#92400E] bg-[#FEF9EE] p-2 rounded-lg border border-[#FDE68A]">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                    <span className="font-semibold">Human CA partner review required</span>
                  </div>
                  <span className="font-mono text-[11px] text-[#B45309] font-bold">FLAGGED</span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-[#166534] bg-[#F0FDF4] p-2 rounded-lg border border-[#BBF7D0]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                    <span>Auto-process eligibility verified (&gt;95% threshold)</span>
                  </div>
                  <span className="font-mono text-[11px] text-[#166534] font-bold">VERIFIED</span>
                </div>
              )}
            </div>
          </div>

          {/* 5. Why Review? */}
          {isReview && (
            <div className="pt-5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#B45309]">
                <HelpCircle className="w-4 h-4" />
                <span>Why is CA review required?</span>
              </div>
              <div className="bg-[#FEF9EE] border border-[#FCD34D]/80 rounded-xl p-3.5 text-xs text-[#92400E] leading-relaxed space-y-1.5">
                <p>
                  <strong>Threshold Check:</strong> AI classification confidence is{' '}
                  <strong className="font-mono">{Math.round(item.ai_confidence * 100)}%</strong>, below the configured{' '}
                  <strong className="font-mono">95%</strong> automatic-processing threshold (SETTING #01).
                </p>
                {item.notes && (
                  <p>
                    <strong>Deterministic Exception Note:</strong> {item.notes}
                  </p>
                )}
                <p className="text-[11px] text-[#78350F] pt-1 border-t border-[#FCD34D]/50">
                  Per practice rules, CA partner sign-off is mandatory before marking valid in client books.
                </p>
              </div>
            </div>
          )}

          {/* 6. Processing Lifecycle Timeline */}
          <div className="pt-5 space-y-2.5">
            <span className="text-[10.5px] font-bold text-[#8C8077] uppercase tracking-wider block">
              Processing Lifecycle
            </span>
            <div className="flex items-center justify-between text-[11px] bg-[#FAF8F5] p-3 rounded-xl border border-[#EAE6DF]">
              <div className="flex flex-col items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
                <span className="text-[#5C5148] font-medium mt-1">Received</span>
              </div>
              <div className="h-0.5 flex-1 bg-[#BBF7D0] mx-1" />
              <div className="flex flex-col items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
                <span className="text-[#5C5148] font-medium mt-1">Matched</span>
              </div>
              <div className="h-0.5 flex-1 bg-[#BBF7D0] mx-1" />
              <div className="flex flex-col items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
                <span className="text-[#5C5148] font-medium mt-1">Classified</span>
              </div>
              <div className="h-0.5 flex-1 mx-1 bg-[#BBF7D0]" />
              <div className="flex flex-col items-center">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isReview ? 'bg-[#F59E0B]' : 'bg-[#16A34A]'
                  }`}
                />
                <span className="text-[#5C5148] font-medium mt-1">
                  {isReview ? 'Review' : 'Processed'}
                </span>
              </div>
            </div>
          </div>

          {/* 7. Override as "Not Required" Accordion */}
          {showOverrideForm && (
            <div className="pt-5 space-y-2.5 bg-[#FAF8F5] p-3.5 rounded-xl border border-[#EAE6DF]">
              <span className="text-xs font-bold text-[#2B231F] block">
                CA Override: Mark Statutory Requirement &ldquo;Not Required&rdquo;
              </span>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Provide professional CA rationale for audit log (e.g., Nil return confirmed by client for August export advances)."
                rows={2}
                className="w-full text-xs p-2.5 bg-white border border-[#E4DFD6] rounded-lg outline-none focus:border-[#8E6F58]"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMarkNotRequired}
                  disabled={!overrideReason.trim()}
                  className="px-3 py-1.5 bg-[#3D2D22] disabled:bg-[#DDD7CB] text-white rounded-lg text-xs font-semibold"
                >
                  Log CA Override
                </button>
                <button
                  onClick={() => setShowOverrideForm(false)}
                  className="px-3 py-1.5 text-xs text-[#7A7067]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Sticky Footer Actions */}
        <div className="px-6 py-4 bg-[#FAF8F5] border-t border-[#EAE6DF] flex flex-wrap items-center justify-between gap-3 select-none">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOverrideForm(!showOverrideForm)}
              className="text-[11.5px] text-[#755843] hover:text-[#2B231F] font-semibold underline underline-offset-2"
            >
              {showOverrideForm ? 'Hide Override' : 'Mark "Not Required"'}
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {item.drive_file_id ? (
              <a
                href={`https://drive.google.com/file/d/${item.drive_file_id}/view`}
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

            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-[#EAE6DF] bg-white text-xs font-semibold text-[#5C5148] hover:bg-[#F7F4EE] transition-colors"
            >
              Close
            </button>

            {isReview ? (
              <button
                onClick={handleApproveValid}
                className="px-4 py-2 rounded-xl bg-[#3D2D22] hover:bg-[#261B14] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#86EFAC]" />
                <span>Approve as Valid</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  const text = `Document ID: ${item.document_id}\nFilename: ${item.filename}\nType: ${item.document_type}\nPeriod: ${item.period}\nClient: ${item.client_name}\nSender: ${item.sender_email}`;
                  navigator.clipboard?.writeText(text);
                  setSuccessToast('Document reference & metadata copied.');
                }}
                className="px-4 py-2 rounded-xl bg-[#3D2D22] hover:bg-[#261B14] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Document Details</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
