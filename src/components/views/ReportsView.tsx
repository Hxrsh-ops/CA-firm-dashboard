import React from 'react';

export const ReportsView: React.FC = () => {
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
            4.2 minutes
          </div>
          <p className="text-xs text-[#16A34A] font-medium mt-1">
            ↓ 1.8 mins faster than previous cycle
          </p>
        </div>

        <div className="bg-white border border-[#EAE6DF] rounded-xl p-4 shadow-card">
          <span className="text-[11px] font-semibold text-[#8C8077] uppercase tracking-wider block">
            First-Pass AI Classification Accuracy
          </span>
          <div className="text-2xl font-bold text-[#2B231F] mt-1 font-display">
            97.4%
          </div>
          <p className="text-xs text-[#16A34A] font-medium mt-1">
            ↑ 0.6% improvement with learned templates
          </p>
        </div>

        <div className="bg-white border border-[#EAE6DF] rounded-xl p-4 shadow-card">
          <span className="text-[11px] font-semibold text-[#8C8077] uppercase tracking-wider block">
            Client Follow-up Response Rate
          </span>
          <div className="text-2xl font-bold text-[#2B231F] mt-1 font-display">
            89.2%
          </div>
          <p className="text-xs text-[#16A34A] font-medium mt-1">
            Within 24 hours of CA approved nudge
          </p>
        </div>
      </div>

      {/* Compliance Health Matrix */}
      <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 shadow-card">
        <h3 className="text-[14px] font-bold text-[#2B231F] font-display mb-4">
          Statutory Filing Health by Entity (August 2026 Cycle)
        </h3>
        <div className="space-y-3">
          {[
            { client: 'Quantum Bridge Technologies Pvt Ltd', progress: 85, status: '1 Missing Document (ICICI Statement)' },
            { client: 'Meridian Engineering Solutions Pvt Ltd', progress: 90, status: 'Needs Review (GSTIN Check)' },
            { client: 'BluePeak Retail Pvt Ltd', progress: 100, status: 'Fully Reconciled' },
            { client: 'SwiftLogix Solutions Pvt Ltd', progress: 75, status: 'Sales Register Reminder Pending' },
            { client: 'GreenCart Ventures LLP', progress: 80, status: 'TDS Section 194C Check' },
          ].map((item, idx) => (
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
          ))}
        </div>
      </div>
    </div>
  );
};
