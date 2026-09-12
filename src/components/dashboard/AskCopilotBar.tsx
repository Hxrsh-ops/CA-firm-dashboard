import React, { useState } from 'react';
import { Sparkles, ArrowRight, CornerDownLeft } from 'lucide-react';

interface AskCopilotBarProps {
  onAsk: (query: string) => void;
}

export const AskCopilotBar: React.FC<AskCopilotBarProps> = ({ onAsk }) => {
  const [query, setQuery] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      onAsk(query);
      setQuery('');
    }
  };

  const suggestions = [
    'What documents are missing for August 2026?',
    'Draft client reminder for Acme Global Solutions',
    'Review active open alerts and exceptions',
    'Show GSTR-1 readiness overview',
  ];

  return (
    <div className="bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl p-4 sm:p-5 shadow-card select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#8E6F58] text-white flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-[13.5px] font-bold text-[#2B231F] font-display">
            Ask CA Copilot
          </span>
        </div>
        <p className="text-[11.5px] text-[#8C827A]">
          Get instant intake insights, draft communications, or verify compliance rules.
        </p>
      </div>

      {/* Input box */}
      <div className="relative mt-1">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your clients, documents or compliance status..."
          className="w-full bg-white border border-[#E4DFD6] focus:border-[#8E6F58] focus:ring-1 focus:ring-[#8E6F58] text-[13px] text-[#2B231F] placeholder-[#9E948B] rounded-xl pl-3.5 pr-20 py-2.5 outline-none transition-all shadow-xs"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button
            onClick={() => {
              if (query.trim()) {
                onAsk(query);
                setQuery('');
              }
            }}
            disabled={!query.trim()}
            className="h-7 px-2.5 rounded-lg bg-[#3D2D22] hover:bg-[#261B14] disabled:bg-[#EAE6DD] text-white disabled:text-[#A89F95] text-[11px] font-medium flex items-center gap-1 transition-colors"
          >
            <span>Ask</span>
            <CornerDownLeft className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Suggested prompts */}
      <div className="flex flex-wrap items-center gap-2 mt-3 pt-2">
        <span className="text-[11px] text-[#8C827A] font-medium">Suggested:</span>
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => onAsk(s)}
            className="text-[11.5px] text-[#5C5148] bg-white hover:bg-[#F3EFE9] border border-[#EAE6DF] hover:border-[#D5C2B4] px-2.5 py-1 rounded-lg transition-colors inline-flex items-center gap-1 group"
          >
            <span>{s}</span>
            <ArrowRight className="w-2.5 h-2.5 text-[#A89F95] group-hover:text-[#5C5148] group-hover:translate-x-0.5 transition-transform" />
          </button>
        ))}
      </div>
    </div>
  );
};
