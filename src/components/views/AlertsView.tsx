import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { dataService, useDataSync } from '../../services/dataService';

export const AlertsView: React.FC = () => {
  const { isLoaded } = useDataSync();
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const alerts = dataService.getAlerts();
  const openAlerts = alerts.filter((a) => a.status === 'Open');
  const resolvedAlerts = alerts.filter((a) => a.status === 'Resolved');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleResolve = async (alertId: string) => {
    setResolvingId(alertId);
    try {
      const success = await dataService.resolveAlert(alertId, 'CA Partner');
      if (success) {
        showToast('Exception marked Resolved and recorded to Audit Trail.');
      } else {
        showToast('Failed to resolve exception. Please verify backend connection.');
      }
    } catch {
      showToast('Error resolving exception.');
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#2B231F] font-display">
          Compliance Alerts & Exceptions
        </h1>
        <p className="text-xs text-[#7A7169] mt-0.5">
          Exceptions flagged by deterministic compliance rules and AI intake cross-checks
        </p>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl text-xs font-semibold text-[#166534] flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Alerts Content */}
      {!isLoaded ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-[#EAE6DF] rounded-xl p-4 shadow-card animate-pulse flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-[#EAE6DD]" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-[#EAE6DD] rounded w-1/3" />
                <div className="h-2.5 bg-[#F5F2EC] rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : openAlerts.length === 0 && resolvedAlerts.length === 0 ? (
        <div className="bg-white border border-[#EAE6DF] rounded-xl p-10 text-center text-xs text-[#8C827A] shadow-card space-y-2">
          <CheckCircle className="w-8 h-8 text-[#16A34A] mx-auto mb-1" />
          <p className="font-semibold text-[#2B231F]">No compliance exceptions found</p>
          <p className="text-[11px] text-[#7A7169]">
            All inbound client records and filing deadlines are fully reconciled with zero open rule discrepancies.
          </p>
        </div>
      ) : (
        <>
          {/* Open Alerts List */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-[#8C8077] uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>Active Open Exceptions ({openAlerts.length})</span>
            </h2>

            {openAlerts.length > 0 ? (
              openAlerts.map((alert) => {
                const client = dataService.getClientById(alert.client_id);
                const isResolving = resolvingId === alert.alert_id;
                return (
                  <div
                    key={alert.alert_id}
                    className="bg-white border border-[#EAE6DF] hover:border-[#FCA5A5] rounded-xl p-4 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#FDF2F2] text-[#DC2626] flex items-center justify-center shrink-0 mt-0.5">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#2B231F]">
                            {client?.legal_name || alert.client_id}
                          </span>
                          <span className="text-[10.5px] bg-[#EAE6DD] text-[#40382D] px-2 py-0.5 rounded-full font-medium">
                            {alert.document_type} ({alert.period})
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              alert.severity === 'High'
                                ? 'bg-[#FDF2F2] text-[#DC2626] border border-[#FCA5A5]'
                                : 'bg-[#FEF9EE] text-[#D97706] border border-[#FDE68A]'
                            }`}
                          >
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-xs text-[#5C5148] mt-1 leading-relaxed">
                          {alert.message}
                        </p>
                        <p className="text-[11px] text-[#8C827A] mt-1">
                          Assigned: <strong className="text-[#2B231F]">{alert.assigned_to}</strong> · Exception Type: {alert.alert_type}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        onClick={() => handleResolve(alert.alert_id)}
                        disabled={isResolving}
                        className="px-3.5 py-1.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F0FDF4] border border-[#EAE6DF] hover:border-[#BBF7D0] text-xs font-semibold text-[#166534] flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{isResolving ? 'Resolving...' : 'Mark Resolved'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl text-xs text-[#166534] font-medium text-center">
                ✓ All compliance alerts for this cycle have been resolved.
              </div>
            )}
          </div>

          {/* Resolved Alerts */}
          {resolvedAlerts.length > 0 && (
            <div className="space-y-3 pt-4">
              <h2 className="text-xs font-bold text-[#8C8077] uppercase tracking-wider">
                Recently Cleared Exceptions ({resolvedAlerts.length})
              </h2>
              {resolvedAlerts.map((alert) => (
                <div
                  key={alert.alert_id}
                  className="bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl p-3 text-xs text-[#8C827A] flex items-center justify-between"
                >
                  <span>{alert.document_type} — {alert.message}</span>
                  <span className="text-[#166534] font-semibold">Resolved</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
