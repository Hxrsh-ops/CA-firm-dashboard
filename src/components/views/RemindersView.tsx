import React, { useState } from 'react';
import { CheckCircle2, Send, Mail, ShieldCheck, Clock, Plus, Building2, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { dataService, useDataSync } from '../../services/dataService';
import type { Reminder } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { CreateReminderModal } from '../common/CreateReminderModal';
import { DispatchReminderModal } from '../common/DispatchReminderModal';

export const RemindersView: React.FC = () => {
  const { isLoaded } = useDataSync();
  const reminders = dataService.getReminders();
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [reminderToDispatch, setReminderToDispatch] = useState<Reminder | null>(null);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      const success = await dataService.approveReminder(id, 'CA Partner');
      if (success) {
        showToast('Reminder approved. Status updated to Approved.', 'success');
        const updated = dataService.getReminders().find((r) => r.reminder_id === id);
        if (updated) {
          setSelectedReminder(updated);
        } else if (selectedReminder?.reminder_id === id) {
          setSelectedReminder({ ...selectedReminder, status: 'Approved', approved_by: 'CA Partner' });
        }
      } else {
        showToast('Failed to approve reminder. Please verify backend connection.', 'error');
      }
    } catch {
      showToast('Error approving reminder.', 'error');
    } finally {
      setApprovingId(null);
    }
  };

  const handleConfirmDispatch = async () => {
    if (!reminderToDispatch) return;
    const id = reminderToDispatch.reminder_id;
    setDispatchingId(id);
    try {
      const result = await dataService.dispatchReminder(id);
      if (result.success) {
        showToast('Reminder workflow started.', 'success');
        setReminderToDispatch(null);
        const updated = dataService.getReminders().find((r) => r.reminder_id === id);
        if (updated) {
          setSelectedReminder(updated);
        }
      } else {
        showToast(result.message || 'Unable to start reminder workflow. No email was sent.', 'error');
        setReminderToDispatch(null);
      }
    } catch (err: any) {
      showToast(err?.message || 'Unable to start reminder workflow. No email was sent.', 'error');
      setReminderToDispatch(null);
    } finally {
      setDispatchingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#2B231F] font-display">
            Client Reminder & Follow-Up Engine
          </h1>
          <p className="text-xs text-[#7A7169] mt-0.5">
            AI drafts client notifications · CA Partner approves before automated dispatch
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-[#3D2D22] hover:bg-[#261B14] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Reminder</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150 ${
          toast.type === 'success'
            ? 'bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534]'
            : 'bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B]'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16A34A]" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {!isLoaded ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-[#EAE6DF] rounded-xl p-4 shadow-card animate-pulse flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-[#EAE6DD]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-[#EAE6DD] rounded w-1/3" />
                  <div className="h-2.5 bg-[#F5F2EC] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 shadow-card h-44 animate-pulse" />
        </div>
      ) : reminders.length === 0 ? (
        <div className="bg-white border border-[#EAE6DF] rounded-xl p-10 text-center text-xs text-[#8C827A] shadow-card space-y-3">
          <Clock className="w-8 h-8 text-[#8C827A] mx-auto mb-1" />
          <p className="font-semibold text-[#2B231F]">No reminders currently in queue</p>
          <p className="text-[11px] text-[#7A7169] max-w-sm mx-auto">
            All client filing requests are either completed or have no pending reminders generated. Click &ldquo;Create Reminder&rdquo; to draft a new follow-up.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-2 px-3.5 py-1.5 rounded-xl bg-[#3D2D22] text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Reminder</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reminders List */}
          <div className="lg:col-span-2 space-y-3">
            {reminders.map((r) => {
              const client = dataService.getClientById(r.client_id);
              const isApproving = approvingId === r.reminder_id;
              const isDispatching = dispatchingId === r.reminder_id;
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
                            {client?.display_name || client?.legal_name || r.client_id}
                          </span>
                          <span className="text-[10.5px] bg-[#EAE6DD] text-[#40382D] px-2 py-0.5 rounded-full font-medium">
                            {r.document_type} ({r.period})
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-[#5C5148] mt-1">
                          {r.subject}
                        </h4>
                        <p className="text-[11px] text-[#8C827A] mt-0.5">
                          Recipient: <span className="font-mono text-[#40382D]">{r.recipient_email}</span>
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <StatusBadge status={isDispatching ? 'Sending...' : r.status} size="sm" />
                      {r.status === 'Pending Approval' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(r.reminder_id);
                          }}
                          disabled={isApproving}
                          className="px-2.5 py-1 rounded-lg bg-[#3D2D22] hover:bg-[#261B14] text-white text-[11px] font-semibold flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3 text-[#86EFAC]" />
                          <span>{isApproving ? 'Approving...' : 'Approve'}</span>
                        </button>
                      )}
                      {r.status === 'Approved' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setReminderToDispatch(r);
                          }}
                          disabled={isDispatching}
                          className="px-2.5 py-1 rounded-lg bg-[#3D2D22] hover:bg-[#261B14] text-white text-[11px] font-semibold flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {isDispatching ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin text-[#86EFAC]" />
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3 h-3 text-[#86EFAC]" />
                              <span>Send</span>
                            </>
                          )}
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
              <span>Reminder Review & CA Sign-Off</span>
            </h3>

            {selectedReminder ? (
              <div className="mt-4 space-y-4 text-xs">
                {/* Target Client & Meta */}
                <div className="p-3 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#8C827A] font-semibold uppercase flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      Client Profile
                    </span>
                    <span className="font-mono text-[#5C5148]">{selectedReminder.client_id}</span>
                  </div>
                  <div className="font-bold text-[#2B231F] text-xs">
                    {dataService.getClientById(selectedReminder.client_id)?.display_name || selectedReminder.client_id}
                  </div>
                  <div className="text-[11px] text-[#7A7067] flex items-center gap-1 pt-0.5">
                    <FileText className="w-3 h-3 text-[#8E6F58]" />
                    <span>{selectedReminder.document_type}</span>
                    <span>·</span>
                    <span className="font-semibold">{selectedReminder.period}</span>
                  </div>
                </div>

                {/* Recipient */}
                <div>
                  <span className="text-[#8C827A] font-semibold uppercase text-[10px] block">
                    Recipient Address
                  </span>
                  <span className="font-mono text-[11.5px] text-[#2B231F] font-semibold block mt-0.5 bg-[#FAF8F5] p-2 rounded-lg border border-[#EAE6DF]">
                    {selectedReminder.recipient_email}
                  </span>
                </div>

                {/* Subject */}
                <div>
                  <span className="text-[#8C827A] font-semibold uppercase text-[10px] block">
                    Subject Line
                  </span>
                  <span className="text-[#2B231F] font-medium block mt-0.5">
                    {selectedReminder.subject}
                  </span>
                </div>

                {/* Body */}
                <div>
                  <span className="text-[#8C827A] font-semibold uppercase text-[10px] block">
                    Body (Markdown / Plaintext)
                  </span>
                  <div className="mt-1 p-3 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl font-mono text-[11px] text-[#40382D] whitespace-pre-line leading-relaxed max-h-56 overflow-y-auto">
                    {selectedReminder.body}
                  </div>
                </div>

                {/* Status & CA Approval / Dispatch Action */}
                <div className="pt-2 border-t border-[#EAE6DF] flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#8C827A] uppercase font-bold">Status</span>
                    <StatusBadge status={dispatchingId === selectedReminder.reminder_id ? 'Sending...' : selectedReminder.status} size="sm" />
                  </div>

                  {selectedReminder.status === 'Pending Approval' ? (
                    <button
                      onClick={() => handleApprove(selectedReminder.reminder_id)}
                      disabled={approvingId === selectedReminder.reminder_id}
                      className="px-4 py-2 rounded-xl bg-[#3D2D22] hover:bg-[#261B14] text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#86EFAC]" />
                      <span>{approvingId === selectedReminder.reminder_id ? 'Approving...' : 'Approve Reminder'}</span>
                    </button>
                  ) : selectedReminder.status === 'Approved' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setReminderToDispatch(selectedReminder)}
                        disabled={dispatchingId === selectedReminder.reminder_id}
                        className="px-4 py-2 rounded-xl bg-[#3D2D22] hover:bg-[#261B14] text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        {dispatchingId === selectedReminder.reminder_id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#86EFAC]" />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5 text-[#86EFAC]" />
                            <span>Send Reminder</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : selectedReminder.status === 'Sent' ? (
                    <div className="text-right">
                      <span className="text-xs font-semibold text-[#166534] bg-[#F0FDF4] px-2.5 py-1 rounded-full border border-[#BBF7D0] inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                        <span>Sent</span>
                      </span>
                      {selectedReminder.sent_at && (
                        <p className="text-[10px] text-[#8C827A] mt-0.5">
                          {new Date(selectedReminder.sent_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-[#4B5563] bg-[#F3F4F6] px-2.5 py-1 rounded-full border border-[#E5E7EB] flex items-center gap-1">
                      <span>{selectedReminder.status}</span>
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
      )}

      {/* Create Reminder Modal */}
      <CreateReminderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={(reminderId) => {
          showToast('Reminder created in Pending Approval queue.', 'success');
          const updated = dataService.getReminders().find((r) => r.reminder_id === reminderId);
          if (updated) {
            setSelectedReminder(updated);
          }
        }}
      />

      {/* Dispatch Confirmation Modal */}
      <DispatchReminderModal
        isOpen={!!reminderToDispatch}
        reminder={reminderToDispatch}
        client={reminderToDispatch ? dataService.getClientById(reminderToDispatch.client_id) : undefined}
        onClose={() => setReminderToDispatch(null)}
        onConfirm={handleConfirmDispatch}
        isDispatching={!!dispatchingId}
      />
    </div>
  );
};

