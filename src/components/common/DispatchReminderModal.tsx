import React from 'react';
import { X, Send, AlertTriangle, Building2, FileText, Calendar, Mail } from 'lucide-react';
import type { Reminder, Client } from '../../types';

interface DispatchReminderModalProps {
  isOpen: boolean;
  reminder: Reminder | null;
  client: Client | undefined;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDispatching: boolean;
}

export const DispatchReminderModal: React.FC<DispatchReminderModalProps> = ({
  isOpen,
  reminder,
  client,
  onClose,
  onConfirm,
  isDispatching,
}) => {
  if (!isOpen || !reminder) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B231F]/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white border border-[#EAE6DF] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#F5F2EC]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2B231F] font-display">
                Confirm Reminder Dispatch
              </h2>
              <p className="text-xs text-[#7A7169] mt-0.5">
                Send statutory compliance reminder email
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isDispatching}
            className="p-1.5 rounded-lg text-[#8C827A] hover:text-[#2B231F] hover:bg-[#F5F2EC] transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning / Advisory Notice */}
        <div className="my-4 p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl flex items-start gap-2.5 text-xs text-[#92400E]">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#D97706] mt-0.5" />
          <p className="leading-relaxed">
            This action will initiate the automated email delivery to the client. Please confirm the recipient and message contents are accurate.
          </p>
        </div>

        {/* Details Card */}
        <div className="space-y-3 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl p-4 text-xs">
          {/* Client */}
          <div className="flex items-start justify-between gap-2">
            <span className="text-[#8C827A] font-medium flex items-center gap-1.5 shrink-0">
              <Building2 className="w-3.5 h-3.5 text-[#8E6F58]" />
              Client:
            </span>
            <span className="font-bold text-[#2B231F] text-right">
              {client?.display_name || client?.legal_name || reminder.client_id}
            </span>
          </div>

          {/* Document */}
          <div className="flex items-start justify-between gap-2">
            <span className="text-[#8C827A] font-medium flex items-center gap-1.5 shrink-0">
              <FileText className="w-3.5 h-3.5 text-[#8E6F58]" />
              Document:
            </span>
            <span className="font-semibold text-[#40382D] text-right">
              {reminder.document_type}
            </span>
          </div>

          {/* Period */}
          <div className="flex items-start justify-between gap-2">
            <span className="text-[#8C827A] font-medium flex items-center gap-1.5 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-[#8E6F58]" />
              Period:
            </span>
            <span className="font-mono font-medium text-[#40382D] text-right">
              {reminder.period}
            </span>
          </div>

          {/* Recipient */}
          <div className="flex items-start justify-between gap-2">
            <span className="text-[#8C827A] font-medium flex items-center gap-1.5 shrink-0">
              <Mail className="w-3.5 h-3.5 text-[#8E6F58]" />
              Recipient:
            </span>
            <span className="font-mono font-semibold text-[#1E40AF] text-right break-all">
              {reminder.recipient_email}
            </span>
          </div>

          {/* Subject */}
          <div className="pt-2 border-t border-[#EAE6DF]">
            <span className="text-[#8C827A] font-medium block text-[11px]">
              Subject:
            </span>
            <span className="text-[#2B231F] font-medium block mt-0.5 leading-snug">
              {reminder.subject}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDispatching}
            className="px-4 py-2 rounded-xl border border-[#D5C2B4] hover:bg-[#F5F2EC] text-[#5C5148] font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDispatching}
            className="px-4 py-2 rounded-xl bg-[#3D2D22] hover:bg-[#261B14] text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-[#86EFAC]" />
            <span>{isDispatching ? 'Starting workflow...' : 'Send Reminder'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
