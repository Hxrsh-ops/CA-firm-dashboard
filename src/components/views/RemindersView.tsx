import React, { useState } from 'react';
import { CheckCircle2, Send, Mail, ShieldCheck } from 'lucide-react';
import { dataService } from '../../services/dataService';
import type { Reminder } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

export const RemindersView: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>(dataService.getReminders());
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);

  const handleApprove = (id: string) => {
    dataService.approveReminder(id, 'CA Arun');
    setReminders([...dataService.getReminders()]);
    if (selectedReminder?.reminder_id === id) {
      setSelectedReminder(null);
    }
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#2B231F] font-display">
          Client Reminder & Follow-Up Engine
        </h1>
        <p className="text-xs text-[#7A7169] mt-0.5">
          AI drafts client notifications · CA Partner approves before automated dispatch
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reminders List */}
        <div className="lg:col-span-2 space-y-3">
          {reminders.map((r) => {
            const client = dataService.getClientById(r.client_id);
            return (
              <div
                key={r.reminder_id}
                onClick={() => setSelectedReminder(r)}
                className={`bg-white border rounded-xl p-4 shadow-card hover:shadow-subtle transition-all cursor-pointer ${
                  selectedReminder?.reminder_id === r.reminder_id
                    ? 'border-[#8E6F58] ring-1 ring-[#8E6F58]'
                    : 'border-[#EAE6DF] hover:border-[#D5C2B4]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#2B231F]">
                          {client?.legal_name || r.client_id}
                        </span>
                        <span className="text-[10.5px] bg-[#EAE6DD] text-[#40382D] px-2 py-0.5 rounded-full font-medium">
                          {r.document_type} ({r.period})
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-[#5C5148] mt-1">
                        {r.subject}
                      </h4>
                      <p className="text-[11px] text-[#8C827A] mt-0.5">
                        Recipient: <span className="font-mono">{r.recipient_email}</span>
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <StatusBadge status={r.status} size="sm" />
                    {r.status === 'Pending Approval' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(r.reminder_id);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#3D2D22] hover:bg-[#261B14] text-white text-[11px] font-semibold flex items-center gap-1 transition-colors"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Approve</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Reminder Preview & Sign-off Panel */}
        <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 shadow-card h-fit sticky top-24">
          <h3 className="text-[13.5px] font-bold text-[#2B231F] border-b border-[#F5F2EC] pb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#755843]" />
            <span>Reminder Review & Dispatch</span>
          </h3>

          {selectedReminder ? (
            <div className="mt-4 space-y-4 text-xs">
              <div>
                <span className="text-[#8C827A] font-semibold uppercase text-[10px] block">
                  Subject
                </span>
                <span className="text-[#2B231F] font-medium block mt-0.5">
                  {selectedReminder.subject}
                </span>
              </div>
              <div>
                <span className="text-[#8C827A] font-semibold uppercase text-[10px] block">
                  Body (Markdown / Plaintext)
                </span>
                <div className="mt-1 p-3 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl font-mono text-[11px] text-[#40382D] whitespace-pre-line leading-relaxed max-h-56 overflow-y-auto">
                  {selectedReminder.body}
                </div>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-[#8C827A]">
                  Status: <strong>{selectedReminder.status}</strong>
                </span>
                {selectedReminder.status === 'Pending Approval' ? (
                  <button
                    onClick={() => handleApprove(selectedReminder.reminder_id)}
                    className="px-4 py-2 rounded-xl bg-[#3D2D22] hover:bg-[#261B14] text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Approve & Dispatch</span>
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-[#166534] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approved by CA Arun
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-8 text-center text-xs text-[#8C827A]">
              Select a reminder from the queue to inspect message content and execute partner approval.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
