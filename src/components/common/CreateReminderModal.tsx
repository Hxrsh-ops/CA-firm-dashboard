import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Send,
  Building2,
  FileText,
  Calendar,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import type { Client, DocumentType } from '../../types';

interface CreateReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (reminderId: string) => void;
  initialClientId?: string;
  initialDocType?: DocumentType;
  initialPeriod?: string;
}

const DOCUMENT_TYPES: DocumentType[] = [
  'Expense Bills',
  'Sales Register',
  'Purchase Register',
  'Bank Statement',
  'Payroll Register',
  'Payroll Summary',
  'TDS Return',
  'Customs Duty Challan',
];

export const CreateReminderModal: React.FC<CreateReminderModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  initialClientId,
  initialDocType,
  initialPeriod,
}) => {
  const clients = dataService.getClients();

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('Expense Bills');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-08');
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize or reset when modal opens
  useEffect(() => {
    if (isOpen) {
      // Find initial client (prefer Quantum Bridge CLI-001 or initialClientId)
      let targetClient: Client | undefined;
      if (initialClientId) {
        targetClient = clients.find((c) => c.client_id === initialClientId);
      }
      if (!targetClient) {
        targetClient =
          clients.find((c) => c.client_id === 'CLI-001' || c.display_name.includes('Quantum Bridge')) ||
          clients[0];
      }

      const clientId = targetClient ? targetClient.client_id : '';
      const docType = initialDocType || 'Expense Bills';
      const period = initialPeriod || '2026-08';
      const email = targetClient ? targetClient.primary_email : '';
      const clientName = targetClient ? targetClient.display_name : 'Client';

      setSelectedClientId(clientId);
      setSelectedDocType(docType);
      setSelectedPeriod(period);
      setRecipientEmail(email);
      setSubject(`Statutory Compliance Notice: ${period} ${docType} — ${clientName}`);
      setBody(
        `Dear ${clientName} Finance Team,\n\nThis is an official compliance notice from Vertex & Associates regarding your pending ${docType} submission for the ${period} statutory cycle.\n\nPlease ensure the necessary records and statement files are uploaded or forwarded promptly to complete our review and maintain compliance readiness.\n\nWarm regards,\nCA Partner\nVertex & Associates`
      );
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen, initialClientId, initialDocType, initialPeriod, clients]);

  // Handle client selection change
  const handleClientChange = (newClientId: string) => {
    setSelectedClientId(newClientId);
    const client = clients.find((c) => c.client_id === newClientId);
    if (client) {
      setRecipientEmail(client.primary_email);
      setSubject(`Statutory Compliance Notice: ${selectedPeriod} ${selectedDocType} — ${client.display_name}`);
      setBody(
        `Dear ${client.display_name} Finance Team,\n\nThis is an official compliance notice from Vertex & Associates regarding your pending ${selectedDocType} submission for the ${selectedPeriod} statutory cycle.\n\nPlease ensure the necessary records and statement files are uploaded or forwarded promptly to complete our review and maintain compliance readiness.\n\nWarm regards,\nCA Partner\nVertex & Associates`
      );
    }
  };

  // Handle doc type change
  const handleDocTypeChange = (newType: DocumentType) => {
    setSelectedDocType(newType);
    const client = clients.find((c) => c.client_id === selectedClientId);
    const clientName = client ? client.display_name : 'Client';
    setSubject(`Statutory Compliance Notice: ${selectedPeriod} ${newType} — ${clientName}`);
  };

  // Handle period change
  const handlePeriodChange = (newPeriod: string) => {
    setSelectedPeriod(newPeriod);
    const client = clients.find((c) => c.client_id === selectedClientId);
    const clientName = client ? client.display_name : 'Client';
    setSubject(`Statutory Compliance Notice: ${newPeriod} ${selectedDocType} — ${clientName}`);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      setErrorMessage('Please select a client.');
      return;
    }
    if (!recipientEmail || !recipientEmail.includes('@')) {
      setErrorMessage('Please provide a valid recipient email.');
      return;
    }
    if (!subject.trim()) {
      setErrorMessage('Subject line cannot be empty.');
      return;
    }
    if (!body.trim()) {
      setErrorMessage('Message body cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const created = await dataService.createReminder({
        client_id: selectedClientId,
        document_type: selectedDocType,
        period: selectedPeriod,
        recipient_email: recipientEmail.trim(),
        subject: subject.trim(),
        body: body.trim(),
      });

      if (created && created.reminder_id) {
        onCreated?.(created.reminder_id);
        onClose();
      } else {
        setErrorMessage('Failed to create reminder. Please verify backend connection.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while creating reminder.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/45 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-modal border border-[#EAE6DF] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-[#FAF8F5] border-b border-[#EAE6DF] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#8E6F58] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2B231F] font-display flex items-center gap-2">
                <span>Create Client Reminder</span>
                <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80">
                  Draft Queue
                </span>
              </h2>
              <p className="text-[11px] text-[#8C827A] mt-0.5">
                Draft a statutory filing follow-up for CA Partner review & sign-off
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

        {/* Error Banner */}
        {errorMessage && (
          <div className="px-6 py-3 bg-[#FEF2F2] border-b border-[#FECACA] text-xs font-semibold text-[#991B1B] flex items-center gap-2 shrink-0 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4.5 text-xs">
          {/* Row 1: Client Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#8C8077] uppercase flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>Target Client Entity *</span>
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => handleClientChange(e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-[#EAE6DF] rounded-xl font-semibold text-[#2B231F] outline-none focus:border-[#8E6F58] focus:ring-1 focus:ring-[#8E6F58] transition-all"
            >
              {clients.map((c) => (
                <option key={c.client_id} value={c.client_id}>
                  {c.display_name} ({c.legal_name}) — {c.client_id}
                </option>
              ))}
            </select>
          </div>

          {/* Row 2: Document Type & Period */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#8C8077] uppercase flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Document Requirement *</span>
              </label>
              <select
                value={selectedDocType}
                onChange={(e) => handleDocTypeChange(e.target.value as DocumentType)}
                className="w-full text-xs p-2.5 bg-white border border-[#EAE6DF] rounded-xl font-semibold text-[#2B231F] outline-none focus:border-[#8E6F58] focus:ring-1 focus:ring-[#8E6F58] transition-all"
              >
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#8C8077] uppercase flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Statutory Period *</span>
              </label>
              <input
                type="text"
                value={selectedPeriod}
                onChange={(e) => handlePeriodChange(e.target.value)}
                placeholder="e.g. 2026-08"
                className="w-full text-xs p-2.5 bg-white border border-[#EAE6DF] rounded-xl font-semibold text-[#2B231F] outline-none focus:border-[#8E6F58] focus:ring-1 focus:ring-[#8E6F58] transition-all"
              />
            </div>
          </div>

          {/* Row 3: Recipient Email */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#8C8077] uppercase flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              <span>Recipient Email Address *</span>
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="recipient@clientcompany.com"
              className="w-full text-xs p-2.5 bg-white border border-[#EAE6DF] rounded-xl font-mono text-[#2B231F] outline-none focus:border-[#8E6F58] focus:ring-1 focus:ring-[#8E6F58] transition-all"
            />
            <p className="text-[10px] text-[#8C827A]">
              Dynamically derived from authoritative client registry. Visible to partner before approval.
            </p>
          </div>

          {/* Row 4: Subject */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#8C8077] uppercase">
              Email Subject *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Notice subject line"
              className="w-full text-xs p-2.5 bg-white border border-[#EAE6DF] rounded-xl font-semibold text-[#2B231F] outline-none focus:border-[#8E6F58] focus:ring-1 focus:ring-[#8E6F58] transition-all"
            />
          </div>

          {/* Row 5: Body */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#8C8077] uppercase flex items-center justify-between">
              <span>Message Content (Plaintext / Markdown) *</span>
              <span className="text-[10px] font-normal text-[#8C827A] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#8E6F58]" />
                Standard CA Practice Template
              </span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              placeholder="Write the reminder communication..."
              className="w-full text-xs p-3 bg-white border border-[#EAE6DF] rounded-xl font-mono text-[#40382D] outline-none focus:border-[#8E6F58] focus:ring-1 focus:ring-[#8E6F58] transition-all leading-relaxed"
            />
          </div>

          {/* Partner Notice */}
          <div className="p-3 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-[11px] text-[#7A7067] leading-relaxed">
            <strong className="text-[#2B231F]">Lifecycle Note:</strong> Creating this reminder places it in <strong className="text-[#2B231F]">Pending Approval</strong> status. No email will be sent until an explicit CA Partner approval is submitted.
          </div>

          {/* Modal Footer */}
          <div className="pt-2 flex items-center justify-between border-t border-[#EAE6DF]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-[#EAE6DF] bg-white text-xs font-semibold text-[#5C5148] hover:bg-[#F7F4EE] transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#3D2D22] hover:bg-[#261B14] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{isSubmitting ? 'Creating Reminder...' : 'Create Reminder'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
