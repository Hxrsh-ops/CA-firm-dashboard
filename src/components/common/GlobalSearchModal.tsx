import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Users, FileText, AlertTriangle, ArrowRight } from 'lucide-react';
import { dataService } from '../../services/dataService';
import type { Client, Document, Alert } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectClient?: (client: Client) => void;
  onSelectDocument?: (doc: Document) => void;
  onSelectAlert?: (alert: Alert) => void;
  onAskCopilot?: (query: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectClient,
  onSelectDocument,
  onSelectAlert,
  onAskCopilot,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const clients = dataService.getClients().filter(
    (c) =>
      c.legal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const docs = dataService.getDocuments().filter(
    (d) =>
      d.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.document_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const alerts = dataService.getAlerts('Open').filter(
    (a) =>
      a.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.alert_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-espresso-dark/40 backdrop-blur-xs select-none">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-[#EAE6DF] shadow-modal overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#EAE6DF] flex items-center gap-3 bg-[#FAF8F5]">
          <Search className="w-5 h-5 text-[#8C827A]" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type a client, document, alert, or ask CA Copilot..."
            className="w-full bg-transparent text-sm text-[#2B231F] placeholder-[#9E948B] outline-none"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="p-1 text-[#8C827A] hover:text-[#2B231F]">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[10px] text-[#7A7169] bg-[#EAE6DD] px-1.5 py-0.5 rounded font-mono border border-[#DDD7CB]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {/* Ask CA Copilot Action if search typed */}
          {searchTerm.trim() && (
            <div
              onClick={() => {
                onAskCopilot?.(searchTerm);
                onClose();
              }}
              className="p-3 bg-[#FAF8F5] hover:bg-[#F3EFE9] border border-[#EAE6DF] rounded-xl flex items-center justify-between cursor-pointer group transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-md bg-[#8E6F58] text-white flex items-center justify-center text-xs">
                  ✨
                </span>
                <span className="text-xs font-semibold text-[#2B231F]">
                  Ask CA Copilot: &ldquo;{searchTerm}&rdquo;
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#8C827A] group-hover:translate-x-0.5 transition-transform" />
            </div>
          )}

          {/* Clients */}
          {clients.length > 0 && (
            <div>
              <div className="text-[10.5px] font-bold text-[#8C8077] uppercase tracking-wider px-2 mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Clients ({clients.length})</span>
              </div>
              <div className="space-y-1">
                {clients.slice(0, 4).map((client) => (
                  <div
                    key={client.client_id}
                    onClick={() => {
                      onSelectClient?.(client);
                      onClose();
                    }}
                    className="p-2.5 hover:bg-[#FAF9F6] rounded-xl flex items-center justify-between cursor-pointer group transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold text-[#2B231F] group-hover:text-brand-700">
                        {client.legal_name}
                      </div>
                      <div className="text-[10.5px] text-[#8C827A]">
                        {client.entity_type} · Assigned: {client.assigned_ca}
                      </div>
                    </div>
                    <span className="text-[10px] text-[#8C827A] font-mono">{client.client_id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {docs.length > 0 && (
            <div>
              <div className="text-[10.5px] font-bold text-[#8C8077] uppercase tracking-wider px-2 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Documents ({docs.length})</span>
              </div>
              <div className="space-y-1">
                {docs.slice(0, 3).map((doc) => (
                  <div
                    key={doc.document_id}
                    onClick={() => {
                      onSelectDocument?.(doc);
                      onClose();
                    }}
                    className="p-2.5 hover:bg-[#FAF9F6] rounded-xl flex items-center justify-between cursor-pointer group transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold text-[#2B231F] group-hover:text-brand-700">
                        {doc.filename}
                      </div>
                      <div className="text-[10.5px] text-[#8C827A]">
                        {doc.document_type} · {doc.period}
                      </div>
                    </div>
                    <span className="text-[10.5px] bg-[#F0FDF4] text-[#166534] font-medium px-2 py-0.5 rounded-full border border-[#BBF7D0]">
                      {Math.round(doc.ai_confidence * 100)}% AI Match
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alerts */}
          {alerts.length > 0 && (
            <div>
              <div className="text-[10.5px] font-bold text-[#8C8077] uppercase tracking-wider px-2 mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>Open Alerts ({alerts.length})</span>
              </div>
              <div className="space-y-1">
                {alerts.slice(0, 3).map((alert) => (
                  <div
                    key={alert.alert_id}
                    onClick={() => {
                      onSelectAlert?.(alert);
                      onClose();
                    }}
                    className="p-2.5 hover:bg-[#FAF9F6] rounded-xl flex items-start justify-between cursor-pointer group transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold text-[#2B231F] group-hover:text-brand-700">
                        {alert.alert_type}: {alert.document_type}
                      </div>
                      <div className="text-[10.5px] text-[#8C827A] line-clamp-1">
                        {alert.message}
                      </div>
                    </div>
                    <span className="text-[10px] bg-[#FDF2F2] text-[#B91C1C] font-semibold px-2 py-0.5 rounded-full border border-[#FCA5A5]/60 shrink-0 ml-2">
                      {alert.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!searchTerm && (
            <div className="p-4 text-center text-xs text-[#8C827A]">
              Quickly jump to any client record, audit trail, or statutory requirement.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
