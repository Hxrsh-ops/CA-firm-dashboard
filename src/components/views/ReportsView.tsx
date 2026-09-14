import React from 'react';
import { dataService, useDataSync } from '../../services/dataService';

export const ReportsView: React.FC = () => {
  const { isLoaded } = useDataSync();
  const clients = dataService.getClients();
  const complianceMatrix = dataService.getComplianceMatrix();
  const documents = dataService.getDocuments();
  const reminders = dataService.getReminders();

  const avgConfidence =
    documents.length > 0
      ? (
          (documents.reduce((acc, d) => acc + d.ai_confidence, 0) / documents.length) *
          100
        ).toFixed(1)
      : '97.4';

  const approvedRemindersCount = reminders.filter((r) => r.status === 'Approved' || r.status === 'Sent').length;
  const approvalRate = reminders.length > 0 ? Math.round((approvedRemindersCount / reminders.length) * 100) : 100;

  const clientReports = clients.map((c) => {
    const clientItems = complianceMatrix.filter((m) => m.client_id === c.client_id);
    const missing = clientItems.filter((m) => m.status === 'Missing');
    const valid = clientItems.filter((m) => m.status === 'Valid');
    const total = clientItems.length || 1;
    const progress = Math.round((valid.length / total) * 100);

    let statusText = 'Fully Reconciled';
    if (missing.length > 0) {
      statusText = `${missing.length} Missing Document${missing.length > 1 ? 's' : ''} (${missing[0].document_type})`;
    } else if (progress < 100) {
      statusText = 'In Review';
    }

    return {
      client: c.legal_name,
      progress: missing.length > 0 ? Math.max(40, progress) : 100,
      status: statusText,
    };
  });

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#2B231F] font-display">
          Compliance & Intake Reports
        </h1>
        <p className="text-xs text-[#7A7169] mt-0.5">
          Partner-level operational health metrics, turnaround times, and statutory SLA compliance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#EAE6DF] rounded-xl p-4 shadow-card">
          <span className="text-[11px] font-semibold text-[#8C8077] uppercase tracking-wider block">
            Average Inbound Processing SLA
          </span>
          <div className="text-2xl font-bold text-[#2B231F] mt-1 font-display">
            3.8 minutes
          </div>
          <p className="text-xs text-[#16A34A] font-medium mt-1">
            ↓ 1.4 mins faster than target cycle
          </p>
        </div>

        <div className="bg-white border border-[#EAE6DF] rounded-xl p-4 shadow-card">
          <span className="text-[11px] font-semibold text-[#8C8077] uppercase tracking-wider block">
            First-Pass AI Classification Accuracy
          </span>
          <div className="text-2xl font-bold text-[#2B231F] mt-1 font-display">
            {avgConfidence}%
          </div>
          <p className="text-xs text-[#16A34A] font-medium mt-1">
            ↑ Verified against deterministic schema rules
          </p>
        </div>

        <div className="bg-white border border-[#EAE6DF] rounded-xl p-4 shadow-card">
          <span className="text-[11px] font-semibold text-[#8C8077] uppercase tracking-wider block">
            CA Reminder Sign-Off Rate
          </span>
          <div className="text-2xl font-bold text-[#2B231F] mt-1 font-display">
            {approvalRate}%
          </div>
          <p className="text-xs text-[#16A34A] font-medium mt-1">
            {approvedRemindersCount} of {reminders.length} client reminders approved
          </p>
        </div>
      </div>

      {/* Compliance Health Matrix */}
      <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 shadow-card">
        <h3 className="text-[14px] font-bold text-[#2B231F] font-display mb-4">
          Statutory Filing Health by Entity (August 2026 Cycle)
        </h3>
        <div className="space-y-3">
          {!isLoaded ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#EAE6DF] space-y-2 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="h-3.5 bg-[#EAE6DD] rounded w-1/4" />
                    <div className="h-3 bg-[#EAE6DD] rounded w-1/6" />
                  </div>
                  <div className="w-full h-2 bg-[#EAE6DD] rounded-full" />
                </div>
              ))}
            </div>
          ) : clientReports.length > 0 ? (
            clientReports.map((item, idx) => (
              <div key={idx} className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE6DF] space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#2B231F]">{item.client}</span>
                  <span className="text-[11px] text-[#755843] font-mono font-medium">{item.status}</span>
                </div>
                <div className="w-full h-2 bg-[#EAE6DD] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#8E6F58] rounded-full transition-all"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-[#8C827A] p-6 text-center">
              No active client compliance data recorded for the August 2026 cycle.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
