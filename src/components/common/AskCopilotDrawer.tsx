import React, { useState } from 'react';
import { Sparkles, X, Send } from 'lucide-react';

interface AskCopilotDrawerProps {
  isOpen: boolean;
  initialQuery?: string;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
  timestamp: string;
  actions?: string[];
}

import { dataService } from '../../services/dataService';

export const AskCopilotDrawer: React.FC<AskCopilotDrawerProps> = ({
  isOpen,
  initialQuery,
  onClose,
}) => {
  const firm = dataService.getFirm();
  const clients = dataService.getClients();
  const documents = dataService.getDocuments();
  const alerts = dataService.getAlerts();
  const reminders = dataService.getReminders();
  const complianceMatrix = dataService.getComplianceMatrix();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'copilot',
      text: `Good day, Partner. I am your CA Copilot assistant for ${firm.legal_name}. I can inspect client document queues, summarize missing items for August 2026, or draft client reminders for your review.`,
      timestamp: '11:40 AM',
    },
  ]);
  const [inputValue, setInputValue] = useState(initialQuery || '');

  React.useEffect(() => {
    if (initialQuery && isOpen) {
      handleSend(initialQuery);
    }
  }, [initialQuery, isOpen]);

  if (!isOpen) return null;

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');

    // Generate grounded deterministic intelligence response
    setTimeout(() => {
      let botReply = '';
      let actions: string[] | undefined = undefined;
      const lower = text.toLowerCase();

      const missingItems = complianceMatrix.filter((m) => m.status === 'Missing');
      const openAlerts = alerts.filter((a) => a.status === 'Open');

      if (lower.includes('missing') || lower.includes('august')) {
        if (missingItems.length > 0) {
          const listText = missingItems
            .slice(0, 3)
            .map((m, i) => `${i + 1}. **${m.client_name}** — ${m.document_type} (Due ${m.due_date})`)
            .join('\n');
          botReply = `Based on deterministic requirement rules for **August 2026**, statutory documents are pending for:\n${listText}\n\nDraft reminders are staged in your queue. Would you like to review and approve them?`;
          actions = missingItems.slice(0, 2).map((m) => `Review ${m.client_name} Reminder`);
        } else {
          botReply = `All statutory documents for **August 2026** have been received and verified for active clients under **${firm.legal_name}**.`;
        }
      } else if (lower.includes('alert') || lower.includes('exception')) {
        if (openAlerts.length > 0) {
          const listText = openAlerts
            .slice(0, 3)
            .map((a, i) => `${i + 1}. **${a.client_id}** (${a.document_type}): ${a.message}`)
            .join('\n');
          botReply = `There are **${openAlerts.length} active exceptions** flagged by deterministic compliance rules:\n${listText}\n\nEach requires partner review before proceeding.`;
          actions = ['View All Alerts'];
        } else {
          botReply = 'There are no active exceptions. All inbound documents conform to master validation rules.';
        }
      } else if (lower.includes('draft') || lower.includes('reminder')) {
        const pendingRem = reminders.find((r) => r.status === 'Pending Approval') || reminders[0];
        if (pendingRem) {
          const client = clients.find((c) => c.client_id === pendingRem.client_id);
          botReply = `I have drafted a reminder for **${client?.legal_name || pendingRem.client_id}**:\n\n> *Subject: ${pendingRem.subject}*\n> \n> *Recipient: ${pendingRem.recipient_email}*\n\n*Note: Partner approval is required before dispatch.*`;
          actions = ['Approve & Dispatch', 'View Reminders Queue'];
        } else {
          botReply = 'No reminder drafts currently pending partner approval.';
        }
      } else {
        botReply = `I have analyzed the practice records for **${firm.legal_name}**.\n\n- **${clients.length} Clients** active on the roster.\n- **${documents.length} Inbound Documents** processed.\n- **${openAlerts.length} Open Exceptions** requiring attention.\n\nWhat specific client, document requirement, or statutory filing would you like me to inspect?`;
      }

      const copilotMsg: Message = {
        id: `cop_${Date.now()}`,
        sender: 'copilot',
        text: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions,
      };

      setMessages((prev) => [...prev, copilotMsg]);
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-espresso-dark/30 backdrop-blur-xs select-none">
      <div className="w-full max-w-md bg-white h-full border-l border-[#EAE6DF] shadow-modal flex flex-col justify-between animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-[#EAE6DF] bg-[#FAF8F5] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#8E6F58] text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-[#2B231F] font-display">
                CA Copilot Assistant
              </h3>
              <p className="text-[10.5px] text-[#8C827A]">
                AI Interprets · Rules Decide · CA Approves
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8C827A] hover:text-[#2B231F] hover:bg-[#EAE6DD] transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 space-y-2 leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-[#3D2D22] text-white rounded-br-none'
                    : 'bg-[#FAF8F5] border border-[#EAE6DF] text-[#2B231F] rounded-bl-none shadow-xs'
                }`}
              >
                <div className="whitespace-pre-line">{m.text}</div>
                {m.actions && (
                  <div className="pt-2 flex flex-wrap gap-1.5 border-t border-[#EAE6DF]/60">
                    {m.actions.map((act, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(act)}
                        className="px-2 py-1 rounded-lg bg-white border border-[#DDD7CB] text-[#5C5148] hover:bg-[#FAF8F5] text-[11px] font-medium transition-colors"
                      >
                        {act}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-[#8C827A] mt-1 px-1">
                {m.timestamp}
              </span>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3.5 border-t border-[#EAE6DF] bg-[#FAF8F5]">
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
              placeholder="Ask CA Copilot or request draft..."
              className="w-full bg-white border border-[#E4DFD6] rounded-xl pl-3 pr-10 py-2.5 text-xs text-[#2B231F] placeholder-[#9E948B] outline-none focus:border-[#8E6F58]"
            />
            <button
              onClick={() => handleSend(inputValue)}
              disabled={!inputValue.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-[#3D2D22] disabled:bg-[#EAE6DD] text-white disabled:text-[#A89F95] transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-center text-[#8C827A] mt-2">
            Deterministic compliance rules safeguard every output.
          </p>
        </div>
      </div>
    </div>
  );
};
