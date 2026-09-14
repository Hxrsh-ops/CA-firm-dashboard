import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  Send,
  History,
  CheckCircle2,
} from 'lucide-react';
import type { PriorityWorkItem } from '../../types';
import { dataService } from '../../services/dataService';
import { StatusBadge } from './StatusBadge';
import { ClientAvatar } from './ClientAvatar';

interface WorkItemDetailModalProps {
  item: PriorityWorkItem | null;
  onClose: () => void;
  onActionComplete?: () => void;
}

export const WorkItemDetailModal: React.FC<WorkItemDetailModalProps> = ({
  item,
  onClose,
  onActionComplete,
}) => {
  if (!item) return null;

  const client = dataService.getClientById(item.client_id);
  const auditLogs = dataService.getAuditLogs().filter(
    (a) => a.entity_id.includes(item.client_id.slice(4)) || a.entity_id === item.context_id
  );

  const [reminderDraft, setReminderDraft] = useState(
    `Dear ${client?.display_name || 'Client'} Team,\n\nThis is a notification from Vertex & Associates regarding your ${item.document_type} for ${item.period}.\n\nPlease ensure this is submitted by ${item.due_date} to prevent statutory filing delays.\n\nWarm regards,\n${item.assigned_to}\nVertex & Associates`
  );
  const [overrideReason, setOverrideReason] = useState('');
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleApprove = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      let success = false;
      if (item.status === 'Needs Review' && item.context_id) {
        success = await dataService.updateDocumentValidation(item.context_id, 'Valid', 'CA partner manual review approval');
      } else if (item.status === 'Pending Approval' && item.context_id) {
        success = await dataService.approveReminder(item.context_id, 'CA Partner');
      } else {
        success = true;
      }
      if (success) {
        setSuccessMessage('Action approved and logged to immutable Audit Trail.');
        setTimeout(() => {
          onActionComplete?.();
          onClose();
        }, 800);
      } else {
        setErrorMessage('Failed to apply action. Please check backend connection.');
      }
    } catch {
      setErrorMessage('An error occurred while processing action.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkNotRequired = async () => {
    if (!overrideReason.trim()) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      let success = false;
      if (item.context_id) {
        success = await dataService.updateDocumentValidation(
          item.context_id,
          'Valid',
          `CA Decision: Marked Not Required — ${overrideReason}`
        );
      } else {
        success = true;
      }
      if (success) {
        setSuccessMessage('Statutory requirement marked "Not Required" with CA rationale.');
        setTimeout(() => {
          onActionComplete?.();
          onClose();
        }, 800);
      } else {
        setErrorMessage('Failed to log CA override to backend.');
      }
    } catch {
      setErrorMessage('An error occurred while logging override.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso-dark/40 backdrop-blur-xs select-none">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#EAE6DF] shadow-modal overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#EAE6DF] bg-[#FAF8F5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClientAvatar initials={item.client_initials} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[16px] font-bold text-[#2B231F] font-display">
                  {item.client_name}
                </h3>
                <span className="text-[11px] font-medium bg-[#EAE6DD] text-[#40382D] px-2 py-0.5 rounded-full">
                  {client?.entity_type || 'Private Limited'}
                </span>
              </div>
              <p className="text-xs text-[#8C827A] mt-0.5">
                Client ID: <span className="font-mono">{item.client_id}</span> · Assigned: {item.assigned_to}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8C827A] hover:text-[#2B231F] hover:bg-[#EAE6DD] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 divide-y divide-[#F5F2EC]">
          {/* Key Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EAE6DF]">
              <span className="text-[10.5px] font-semibold text-[#8C8077] uppercase tracking-wider block">
                Document / Task
              </span>
              <span className="text-[13px] font-bold text-[#2B231F] mt-1 block">
                {item.document_type}
              </span>
            </div>
            <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EAE6DF]">
              <span className="text-[10.5px] font-semibold text-[#8C8077] uppercase tracking-wider block">
                Period
              </span>
              <span className="text-[13px] font-bold text-[#2B231F] mt-1 block">
                {item.period}
              </span>
            </div>
            <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EAE6DF]">
              <span className="text-[10.5px] font-semibold text-[#8C8077] uppercase tracking-wider block">
                Current Status
              </span>
              <div className="mt-1">
                <StatusBadge status={item.status} size="sm" />
              </div>
            </div>
            <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EAE6DF]">
              <span className="text-[10.5px] font-semibold text-[#8C8077] uppercase tracking-wider block">
                Due Date
              </span>
              <span className="text-[13px] font-bold text-[#2B231F] mt-1 block">
                {item.due_date}
              </span>
            </div>
          </div>

          {/* AI Intelligence & Confidence Layer */}
          <div className="pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-[#8E6F58] text-white flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span className="text-[13px] font-bold text-[#2B231F]">
                  AI Intake Interpretation & Confidence
                </span>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
                96% Confidence Score
              </span>
            </div>

            <div className="bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl p-3.5 text-xs text-[#5C5148] space-y-1.5 leading-relaxed">
              <p>
                <strong className="text-[#2B231F]">Document Classification:</strong> {item.document_type} identified via attachment vector match and sender email verification.
              </p>
              <p>
                <strong className="text-[#2B231F]">Deterministic Rule Status:</strong> Requirement is marked <code className="bg-white px-1.5 py-0.5 rounded border border-[#EAE6DF] text-[#755843]">ACTIVE (Monthly)</code> in firm schedule.
              </p>
              {item.status === 'Needs Review' && (
                <div className="mt-2 bg-[#FEF9EE] border border-[#FDE68A] p-2.5 rounded-lg text-[#92400E] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#D97706]" />
                  <span>
                    <strong>Human Review Flag:</strong> Vendor GSTIN discrepancy detected against master database. Requires CA Arun manual sign-off.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* CA Approval / Action Box */}
          <div className="pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-[#2B231F] flex items-center gap-2">
                <Send className="w-4 h-4 text-[#755843]" />
                CA Action & Communication
              </span>
              <button
                onClick={() => setShowOverrideForm(!showOverrideForm)}
                className="text-[11px] text-[#755843] hover:text-[#3D2D22] font-semibold underline underline-offset-2"
              >
                {showOverrideForm ? 'Hide CA Override' : 'Mark as "Not Required"'}
              </button>
            </div>

            {showOverrideForm ? (
              <div className="bg-[#FAF8F5] border border-[#EAE6DF] p-3.5 rounded-xl space-y-2.5">
                <label className="text-[11.5px] font-semibold text-[#2B231F] block">
                  CA Rationale for Marking Statutory Document &ldquo;Not Required&rdquo;
                </label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g., Client confirmed zero export operations for this month with nil return declaration."
                  rows={2}
                  className="w-full text-xs p-2.5 bg-white border border-[#E4DFD6] rounded-lg outline-none focus:border-[#8E6F58]"
                />
                <button
                  onClick={handleMarkNotRequired}
                  disabled={!overrideReason.trim()}
                  className="px-3 py-1.5 bg-[#3D2D22] disabled:bg-[#DDD7CB] text-white rounded-lg text-xs font-semibold"
                >
                  Confirm & Log CA Override
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[11.5px] font-medium text-[#7A7067] block">
                  Drafted Client Follow-up (AI drafted · CA approves)
                </label>
                <textarea
                  value={reminderDraft}
                  onChange={(e) => setReminderDraft(e.target.value)}
                  rows={4}
                  className="w-full text-xs p-3 bg-white border border-[#E4DFD6] rounded-xl outline-none focus:border-[#8E6F58] font-mono leading-relaxed text-[#2B231F]"
                />
              </div>
            )}
          </div>

          {/* Audit Trail Snippet */}
          <div className="pt-5 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#8C8077] uppercase tracking-wider">
              <History className="w-3.5 h-3.5" />
              <span>Immutable Audit Trail</span>
            </div>
            <div className="bg-[#FAF8F5] rounded-xl border border-[#EAE6DF] p-3 text-xs space-y-2 max-h-28 overflow-y-auto">
              {auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <div key={log.log_id} className="text-[11px] text-[#5C5148] flex items-start justify-between">
                    <div>
                      <span className="font-semibold text-[#2B231F]">{log.user}:</span> {log.action} — {log.reason}
                    </div>
                    <span className="text-[#8C827A] shrink-0 ml-2 font-mono text-[10px]">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-[#8C827A]">Requirement initialized under standard monthly recurring policy.</p>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#FAF8F5] border-t border-[#EAE6DF] flex flex-wrap items-center justify-between gap-3">
          <div>
            {successMessage && (
              <span className="text-xs font-semibold text-[#166534] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                {successMessage}
              </span>
            )}
            {errorMessage && (
              <span className="text-xs font-semibold text-[#DC2626] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                {errorMessage}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-[#EAE6DF] bg-white text-xs font-semibold text-[#5C5148] hover:bg-[#F7F4EE] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-[#3D2D22] hover:bg-[#261B14] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Processing...' : 'Approve & Dispatch'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
