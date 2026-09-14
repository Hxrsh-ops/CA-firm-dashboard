import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Phone,
  User,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Bell,
  History,
  CheckCircle2,
  Eye,
  Check,
  Send,
  ShieldAlert
} from 'lucide-react';
import type { Client, Document } from '../../types';
import { dataService } from '../../services/dataService';
import { ClientAvatar } from './ClientAvatar';
import { StatusBadge } from './StatusBadge';
import { DocumentReviewModal } from './DocumentReviewModal';

interface ClientDetailModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onActionComplete?: () => void;
}

type TabKey = 'compliance' | 'documents' | 'alerts' | 'reminders' | 'activity';

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  client,
  isOpen,
  onClose,
  onActionComplete,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('compliance');
  const [selectedDocForReview, setSelectedDocForReview] = useState<Document | null>(null);
  const [isDocReviewOpen, setIsDocReviewOpen] = useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (client) {
      setActiveTab('compliance');
      setToastMessage(null);
      setSelectedDocForReview(null);
      setIsDocReviewOpen(false);
    }
  }, [client]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isDocReviewOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDocReviewOpen, onClose]);

  if (!isOpen || !client) return null;

  // Live Data Scoped to Client
  const matrixItems = dataService.getComplianceMatrix().filter((m) => m.client_id === client.client_id);
  const clientDocs = dataService.getDocuments({ client_id: client.client_id });
  const clientAlerts = dataService.getAlerts().filter((a) => a.client_id === client.client_id);
  const clientReminders = dataService.getReminders().filter((r) => r.client_id === client.client_id);
  const allAuditLogs = dataService.getAuditLogs();
  const clientAuditLogs = allAuditLogs.filter((log) => {
    if (log.entity_id === client.client_id) return true;
    if (clientDocs.some((d) => d.document_id === log.entity_id)) return true;
    if (clientAlerts.some((a) => a.alert_id === log.entity_id)) return true;
    if (clientReminders.some((r) => r.reminder_id === log.entity_id)) return true;
    const strVal = typeof log.new_value === 'string' ? log.new_value : JSON.stringify(log.new_value || '');
    return strVal.includes(client.client_id) || strVal.includes(client.legal_name);
  });

  // Client Operational Metrics
  const totalReqs = matrixItems.length;
  const onTrackReqs = matrixItems.filter((m) => m.status === 'Received' || m.status === 'Not Required').length;
  const compliancePct = totalReqs > 0 ? Math.round((onTrackReqs / totalReqs) * 100) : 100;
  const openAlertsCount = clientAlerts.filter((a) => a.status === 'Open').length;
  const pendingRemindersCount = clientReminders.filter((r) => r.status === 'Pending Approval').length;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleResolveAlert = async (alertId: string) => {
    setIsActionLoading(true);
    try {
      const success = await dataService.resolveAlert(alertId, 'CA Partner');
      if (success) {
        showToast('Alert marked Resolved and recorded to Audit Trail.');
        onActionComplete?.();
      } else {
        showToast('Failed to resolve alert.');
      }
    } catch {
      showToast('Error resolving alert.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleApproveReminder = async (reminderId: string) => {
    setIsActionLoading(true);
    try {
      const success = await dataService.approveReminder(reminderId, 'CA Partner');
      if (success) {
        showToast('Reminder approved for automated dispatch.');
        onActionComplete?.();
      } else {
        showToast('Failed to approve reminder.');
      }
    } catch {
      showToast('Error approving reminder.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleOpenDocReview = (doc: Document) => {
    setSelectedDocForReview(doc);
    setIsDocReviewOpen(true);
  };

  const handleOpenDocFromMatrix = (matrixItem: any) => {
    if (matrixItem.document_id) {
      const doc = dataService.getDocumentById(matrixItem.document_id);
      if (doc) {
        setSelectedDocForReview(doc);
        setIsDocReviewOpen(true);
        return;
      }
    }
    const fallback = clientDocs.find(
      (d) => d.document_type.toLowerCase() === matrixItem.document_type.toLowerCase()
    );
    if (fallback) {
      setSelectedDocForReview(fallback);
      setIsDocReviewOpen(true);
    }
  };

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

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/45 backdrop-blur-xs select-none animate-in fade-in duration-150">
        <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-modal border border-[#EAE6DF] overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-6 py-4.5 bg-[#FAF8F5] border-b border-[#EAE6DF] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
            <div className="flex items-start gap-3.5 min-w-0">
              <ClientAvatar initials={client.display_name.slice(0, 2)} size="lg" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-[#2B231F] truncate font-display">
                    {client.legal_name}
                  </h2>
                  <span className="text-[11px] font-semibold bg-[#EAE6DD] text-[#40382D] px-2.5 py-0.5 rounded-full">
                    {client.entity_type}
                  </span>
                  <span
                    className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${
                      client.active
                        ? 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]'
                        : 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                    }`}
                  >
                    {client.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#7A7169] mt-1">
                  <span className="font-mono font-medium text-[#4A3E38]">ID: {client.client_id}</span>
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#8C827A]" />
                    {client.primary_email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#8C827A]" />
                    {client.phone}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#8C827A]" />
                    Assigned: <strong className="text-[#2B231F]">{client.assigned_ca}</strong>
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8C827A] hover:text-[#2B231F] hover:bg-[#EAE6DD] transition-colors shrink-0 self-start sm:self-center"
              title="Close Client Hub"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 bg-[#F5F2EC]/60 border-b border-[#EAE6DF] px-6 py-2.5 gap-3 text-xs shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] flex items-center justify-center font-bold font-mono text-xs shrink-0">
                {compliancePct}%
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8C8077] block">Compliance</span>
                <span className="font-semibold text-[#2B231F]">{onTrackReqs}/{totalReqs} On Track</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white text-[#2B231F] border border-[#EAE6DF] flex items-center justify-center font-bold font-mono text-xs shrink-0">
                {clientDocs.length}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8C8077] block">Documents</span>
                <span className="font-semibold text-[#2B231F]">{clientDocs.length} Received</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold font-mono text-xs shrink-0 border ${
                  openAlertsCount > 0
                    ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                    : 'bg-white text-[#7A7067] border-[#EAE6DF]'
                }`}
              >
                {openAlertsCount}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8C8077] block">Open Alerts</span>
                <span className="font-semibold text-[#2B231F]">{openAlertsCount} Unresolved</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold font-mono text-xs shrink-0 border ${
                  pendingRemindersCount > 0
                    ? 'bg-[#FEF9EE] text-[#D97706] border-[#FDE68A]'
                    : 'bg-white text-[#7A7067] border-[#EAE6DF]'
                }`}
              >
                {pendingRemindersCount}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8C8077] block">Reminders</span>
                <span className="font-semibold text-[#2B231F]">{pendingRemindersCount} Pending Sign-off</span>
              </div>
            </div>
          </div>

          {/* Toast Notification */}
          {toastMessage && (
            <div className="px-6 py-2.5 bg-[#F0FDF4] border-b border-[#BBF7D0] text-xs font-semibold text-[#166534] flex items-center gap-2 animate-in fade-in duration-150 shrink-0">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="px-6 pt-3 bg-white border-b border-[#EAE6DF] flex items-center gap-2 overflow-x-auto shrink-0">
            <button
              onClick={() => setActiveTab('compliance')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'compliance'
                  ? 'border-[#3D2D22] text-[#2B231F]'
                  : 'border-transparent text-[#7A7067] hover:text-[#2B231F]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Compliance Schedule ({matrixItems.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('documents')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'documents'
                  ? 'border-[#3D2D22] text-[#2B231F]'
                  : 'border-transparent text-[#7A7067] hover:text-[#2B231F]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Documents ({clientDocs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'alerts'
                  ? 'border-[#3D2D22] text-[#2B231F]'
                  : 'border-transparent text-[#7A7067] hover:text-[#2B231F]'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Alerts & Exceptions ({clientAlerts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('reminders')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'reminders'
                  ? 'border-[#3D2D22] text-[#2B231F]'
                  : 'border-transparent text-[#7A7067] hover:text-[#2B231F]'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Reminders ({clientReminders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('activity')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'activity'
                  ? 'border-[#3D2D22] text-[#2B231F]'
                  : 'border-transparent text-[#7A7067] hover:text-[#2B231F]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Trail ({clientAuditLogs.length})</span>
            </button>
          </div>

          {/* Tab Content Panels */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* TAB 1: COMPLIANCE MATRIX */}
            {activeTab === 'compliance' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-[#8C8077] uppercase tracking-wider">
                    Statutory Compliance Filing Requirements
                  </h3>
                  <p className="text-[11px] text-[#7A7169] mt-0.5">
                    Authoritative schedule evaluated by backend Compliance Engine for August 2026
                  </p>
                </div>

                {matrixItems.length > 0 ? (
                  <div className="bg-white border border-[#EAE6DF] rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#EAE6DF] bg-[#FAF8F5] text-[10.5px] font-bold text-[#8C8077] uppercase tracking-wider">
                          <th className="py-2.5 px-4">Document Type</th>
                          <th className="py-2.5 px-3">Period</th>
                          <th className="py-2.5 px-3">Due Date</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right pr-4">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F5F2EC]">
                        {matrixItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-[#FAF9F6] transition-colors">
                            <td className="py-3 px-4 font-semibold text-[#2B231F] flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5 text-[#8C827A]" />
                              <span>{item.document_type}</span>
                            </td>
                            <td className="py-3 px-3 text-[#5C5148]">{item.period}</td>
                            <td className="py-3 px-3 font-mono text-[11px] text-[#7A7067]">
                              {item.due_date || '2026-09-20'}
                            </td>
                            <td className="py-3 px-3">
                              <StatusBadge status={item.status} size="sm" />
                            </td>
                            <td className="py-3 px-3 text-right pr-4">
                              {(item.status === 'Received' || item.status === 'Review Required') ? (
                                <button
                                  onClick={() => handleOpenDocFromMatrix(item)}
                                  className="px-2.5 py-1 bg-[#FAF8F5] hover:bg-[#EAE6DD] text-[#3D2D22] border border-[#EAE6DF] rounded-lg text-[11px] font-semibold flex items-center gap-1 ml-auto transition-colors"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Review Doc</span>
                                </button>
                              ) : (
                                <span className="text-[11px] text-[#A89F95]">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-xs text-[#8C827A]">
                    No active compliance requirements configured for this client in the current period.
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: DOCUMENTS */}
            {activeTab === 'documents' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-[#8C8077] uppercase tracking-wider">
                    Statutory Documents Ingested
                  </h3>
                  <p className="text-[11px] text-[#7A7169] mt-0.5">
                    Files received via inbound email or intake pipelines for {client.display_name}
                  </p>
                </div>

                {clientDocs.length > 0 ? (
                  <div className="bg-white border border-[#EAE6DF] rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#EAE6DF] bg-[#FAF8F5] text-[10.5px] font-bold text-[#8C8077] uppercase tracking-wider">
                          <th className="py-2.5 px-4">Filename</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">Period</th>
                          <th className="py-2.5 px-3">Confidence</th>
                          <th className="py-2.5 px-3">Validation</th>
                          <th className="py-2.5 px-3 text-right pr-4">Review</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F5F2EC]">
                        {clientDocs.map((doc) => (
                          <tr
                            key={doc.document_id}
                            onClick={() => handleOpenDocReview(doc)}
                            className="hover:bg-[#FAF9F6] transition-colors cursor-pointer"
                          >
                            <td className="py-3 px-4 font-semibold text-[#2B231F] flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5 text-[#8C827A]" />
                              <span className="truncate max-w-xs" title={doc.filename}>{doc.filename}</span>
                            </td>
                            <td className="py-3 px-3 text-[#5C5148]">{doc.document_type}</td>
                            <td className="py-3 px-3 text-[#7A7067]">{doc.period}</td>
                            <td className="py-3 px-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
                                {Math.round(doc.ai_confidence * 100)}%
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <StatusBadge status={doc.validation_status} size="sm" />
                            </td>
                            <td className="py-3 px-3 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleOpenDocReview(doc)}
                                className="p-1 text-[#8C827A] hover:text-[#2B231F] hover:bg-[#EAE6DD] rounded transition-colors"
                                title="Inspect & Review"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-xs text-[#8C827A]">
                    No statutory documents received yet for {client.display_name}.
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ALERTS & EXCEPTIONS */}
            {activeTab === 'alerts' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-[#8C8077] uppercase tracking-wider">
                    Client Exceptions & Alerts
                  </h3>
                  <p className="text-[11px] text-[#7A7169] mt-0.5">
                    Deterministic compliance rule exceptions and document mismatch alerts
                  </p>
                </div>

                {clientAlerts.length > 0 ? (
                  <div className="space-y-3">
                    {clientAlerts.map((alert) => (
                      <div
                        key={alert.alert_id}
                        className={`bg-white border rounded-xl p-4 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                          alert.status === 'Open' ? 'border-[#EAE6DF] hover:border-[#FCA5A5]' : 'border-[#EAE6DF] opacity-75'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                              alert.status === 'Open' ? 'bg-[#FDF2F2] text-[#DC2626]' : 'bg-[#F0FDF4] text-[#166534]'
                            }`}
                          >
                            {alert.status === 'Open' ? (
                              <AlertTriangle className="w-4 h-4" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-[#2B231F]">{alert.document_type} ({alert.period})</span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  alert.severity === 'High'
                                    ? 'bg-[#FDF2F2] text-[#DC2626] border-[#FCA5A5]'
                                    : 'bg-[#FEF9EE] text-[#D97706] border-[#FDE68A]'
                                }`}
                              >
                                {alert.severity}
                              </span>
                              <span className="text-[10.5px] font-semibold text-[#8C827A] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#EAE6DF]">
                                {alert.alert_type}
                              </span>
                            </div>
                            <p className="text-xs text-[#5C5148] mt-1 leading-relaxed">
                              {alert.message}
                            </p>
                            <p className="text-[10.5px] text-[#8C827A] mt-1">
                              Assigned to: <strong className="text-[#2B231F]">{alert.assigned_to}</strong> · Logged {formatDateTime(alert.created_at)}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          {alert.status === 'Open' ? (
                            <button
                              onClick={() => handleResolveAlert(alert.alert_id)}
                              disabled={isActionLoading}
                              className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#F0FDF4] border border-[#EAE6DF] hover:border-[#BBF7D0] text-xs font-semibold text-[#166534] rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Mark Resolved</span>
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-[#166534] flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Resolved
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-xs text-[#166534] font-medium">
                    ✓ No active or unresolved exceptions for {client.display_name}.
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: REMINDERS */}
            {activeTab === 'reminders' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-[#8C8077] uppercase tracking-wider">
                    Client Reminder Queue
                  </h3>
                  <p className="text-[11px] text-[#7A7169] mt-0.5">
                    AI-generated statutory reminder drafts requiring CA Partner approval
                  </p>
                </div>

                {clientReminders.length > 0 ? (
                  <div className="space-y-3">
                    {clientReminders.map((r) => (
                      <div
                        key={r.reminder_id}
                        className="bg-white border border-[#EAE6DF] rounded-xl p-4 shadow-card space-y-2.5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F5F2EC] pb-2">
                          <div>
                            <span className="text-xs font-bold text-[#2B231F]">{r.document_type} ({r.period})</span>
                            <span className="text-[11px] text-[#8C827A] block mt-0.5 font-mono">
                              Recipient: {r.recipient_email}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={r.status} size="sm" />
                            {r.status === 'Pending Approval' && (
                              <button
                                onClick={() => handleApproveReminder(r.reminder_id)}
                                disabled={isActionLoading}
                                className="px-3 py-1 bg-[#3D2D22] hover:bg-[#261B14] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50"
                              >
                                <Send className="w-3 h-3" />
                                <span>Approve Reminder</span>
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="text-[11px] font-semibold text-[#5C5148]">Subject: {r.subject}</div>
                          <div className="mt-1 p-2.5 bg-[#FAF8F5] border border-[#EAE6DF] rounded-lg font-mono text-[11px] text-[#40382D] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto">
                            {r.body}
                          </div>
                        </div>

                        <div className="text-[10px] text-[#8C827A] flex items-center justify-between pt-1">
                          <span>Created {formatDateTime(r.created_at)}</span>
                          {r.approved_by && <span>Approved by: {r.approved_by}</span>}
                          {r.sent_at && <span className="text-[#166534] font-semibold">Sent at: {formatDateTime(r.sent_at)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-xs text-[#8C827A]">
                    No reminder notices queued for {client.display_name}.
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: AUDIT TRAIL */}
            {activeTab === 'activity' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-[#8C8077] uppercase tracking-wider">
                    Client Activity & Immutable Audit Trail
                  </h3>
                  <p className="text-[11px] text-[#7A7169] mt-0.5">
                    Chronological log of document ingestions, CA reviews, and compliance decisions
                  </p>
                </div>

                {clientAuditLogs.length > 0 ? (
                  <div className="space-y-2">
                    {clientAuditLogs.map((log) => (
                      <div
                        key={log.log_id}
                        className="bg-white border border-[#EAE6DF] rounded-xl p-3 text-xs flex items-start justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#2B231F]">{log.user}</span>
                            <span className="font-mono text-[10.5px] bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#EAE6DF] text-[#755843]">
                              {log.action}
                            </span>
                          </div>
                          <p className="text-[#5C5148] text-[11.5px]">{log.reason || 'Statutory action logged'}</p>
                        </div>
                        <span className="text-[10px] font-mono text-[#8C827A] shrink-0">
                          {formatDateTime(log.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-xs text-[#8C827A]">
                    No activity recorded yet for {client.display_name}.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-[#FAF8F5] border-t border-[#EAE6DF] flex items-center justify-between shrink-0 text-xs">
            <span className="text-[#8C827A]">
              Firm Scope: <strong className="text-[#2B231F]">Vertex & Associates (FIR-001)</strong>
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-[#F7F4EE] border border-[#EAE6DF] rounded-xl text-[#5C5148] font-semibold transition-colors"
            >
              Close Hub
            </button>
          </div>
        </div>
      </div>

      {/* Cross-Modal Document Review */}
      <DocumentReviewModal
        document={selectedDocForReview}
        isOpen={isDocReviewOpen}
        onClose={() => {
          setIsDocReviewOpen(false);
          setSelectedDocForReview(null);
        }}
        onActionComplete={() => {
          dataService.syncWithBackend();
          onActionComplete?.();
        }}
      />
    </>
  );
};
