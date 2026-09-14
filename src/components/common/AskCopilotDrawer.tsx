import React, { useState } from 'react';
import { Sparkles, X, Send, ShieldCheck, Database, Bot, RefreshCw } from 'lucide-react';
import { dataService } from '../../services/dataService';

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
  source?: string;
  grounded?: boolean;
  aiProvider?: 'gemini' | 'deterministic';
  intent?: string;
  actions?: string[];
}

export const AskCopilotDrawer: React.FC<AskCopilotDrawerProps> = ({
  isOpen,
  initialQuery,
  onClose,
}) => {
  const firm = dataService.getFirm();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'copilot',
      text: `Good day, Partner. I am your CA Copilot operations assistant for ${firm.legal_name}.\n\nI answer queries directly against authoritative practice records—missing documents, compliance statuses, partner review items, and reminder drafts.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      grounded: true,
      aiProvider: 'deterministic',
      actions: [
        'What needs my attention today?',
        'Which clients are missing documents for August 2026?',
        'Draft client reminder for Acme Global',
        'Show active open compliance alerts'
      ]
    },
  ]);
  const [inputValue, setInputValue] = useState(initialQuery || '');
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (initialQuery && isOpen) {
      handleSend(initialQuery);
    }
  }, [initialQuery, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const queryText = text.trim();
    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await dataService.askCopilot(queryText);
      const copilotMsg: Message = {
        id: `cop_${Date.now()}`,
        sender: 'copilot',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: response.source,
        grounded: response.grounded,
        aiProvider: response.aiProvider,
        intent: response.intent,
        actions: response.suggestedActions,
      };
      setMessages((prev) => [...prev, copilotMsg]);
    } catch (err: any) {
      console.error('[AskCopilotDrawer] Backend query error:', err);
      const errorMsg: Message = {
        id: `cop_err_${Date.now()}`,
        sender: 'copilot',
        text: `Unable to query backend: ${err.message || 'Network error'}. Please verify backend connection.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        grounded: false,
        actions: ['What needs my attention today?', 'Retry query']
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-espresso-dark/30 backdrop-blur-xs select-none">
      <div className="w-full max-w-lg bg-white h-full border-l border-[#EAE6DF] shadow-modal flex flex-col justify-between animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-[#EAE6DF] bg-[#FAF8F5] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#8E6F58] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[14px] font-bold text-[#2B231F] font-display">
                  CA Copilot Assistant
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80">
                  <ShieldCheck className="w-3 h-3 text-amber-700" />
                  Grounded
                </span>
              </div>
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
                className={`max-w-[90%] rounded-2xl p-4 space-y-2.5 leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-[#3D2D22] text-white rounded-br-none'
                    : 'bg-[#FAF8F5] border border-[#EAE6DF] text-[#2B231F] rounded-bl-none shadow-xs'
                }`}
              >
                {/* Message Header / Provider Badge */}
                {m.sender === 'copilot' && (
                  <div className="flex items-center justify-between gap-2 pb-1 border-b border-[#EAE6DF]/60 text-[10.5px] text-[#8C827A]">
                    <span className="flex items-center gap-1 font-medium text-[#5C5148]">
                      <Bot className="w-3.5 h-3.5 text-[#8E6F58]" />
                      CA Operations Engine
                    </span>
                    {m.aiProvider && (
                      <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-[#EDE8E1] text-[#5C5148] font-mono">
                        {m.aiProvider === 'gemini' ? 'Gemini 2.5 Flash' : 'Deterministic Rule Engine'}
                      </span>
                    )}
                  </div>
                )}

                {/* Text Body */}
                <div className="whitespace-pre-line text-[12.5px] space-y-1">
                  {m.text}
                </div>

                {/* Source Citation */}
                {m.source && (
                  <div className="pt-2 flex items-center gap-1.5 text-[10.5px] text-[#7A7067] border-t border-[#EAE6DF]/60 font-medium">
                    <Database className="w-3 h-3 text-[#8E6F58] shrink-0" />
                    <span>{m.source}</span>
                  </div>
                )}

                {/* Interactive Suggested Actions */}
                {m.actions && m.actions.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-1.5 border-t border-[#EAE6DF]/60">
                    {m.actions.map((act, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(act)}
                        disabled={isLoading}
                        className="px-2.5 py-1 rounded-lg bg-white border border-[#DDD7CB] hover:border-[#8E6F58] text-[#5C5148] hover:text-[#2B231F] hover:bg-[#FAF8F5] text-[11px] font-medium transition-colors shadow-2xs text-left"
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

          {/* Thinking / Loading Indicator */}
          {isLoading && (
            <div className="flex flex-col items-start">
              <div className="max-w-[85%] rounded-2xl p-3.5 bg-[#FAF8F5] border border-[#EAE6DF] text-[#2B231F] rounded-bl-none shadow-xs flex items-center gap-2.5 text-xs text-[#7A7067]">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#8E6F58]" />
                <span>Evaluating authoritative practice rules & records...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3.5 border-t border-[#EAE6DF] bg-[#FAF8F5]">
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
              disabled={isLoading}
              placeholder="Ask CA Copilot or request draft..."
              className="w-full bg-white border border-[#E4DFD6] rounded-xl pl-3 pr-10 py-2.5 text-xs text-[#2B231F] placeholder-[#9E948B] outline-none focus:border-[#8E6F58] focus:ring-1 focus:ring-[#8E6F58] transition-all"
            />
            <button
              onClick={() => handleSend(inputValue)}
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-[#3D2D22] disabled:bg-[#EAE6DD] text-white disabled:text-[#A89F95] transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-center text-[#8C827A] mt-2">
            Authoritative database grounding · No autonomous email dispatch without partner sign-off
          </p>
        </div>
      </div>
    </div>
  );
};
