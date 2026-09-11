import React from 'react';
import { MailCheck, RefreshCw } from 'lucide-react';

interface EmptyInboxStateProps {
  message?: string;
  submessage?: string;
  onReset?: () => void;
}

export const EmptyInboxState: React.FC<EmptyInboxStateProps> = ({
  message = 'No documents need review',
  submessage = 'All incoming client documents are currently processed and up to date.',
  onReset,
}) => {
  return (
    <div className="bg-white border border-[#EAE6DF] rounded-xl p-12 shadow-card text-center select-none flex flex-col items-center justify-center max-w-lg mx-auto my-6">
      <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] text-[#755843] flex items-center justify-center mb-3">
        <MailCheck className="w-6 h-6 stroke-[1.7]" />
      </div>
      <h3 className="text-[15px] font-bold text-[#2B231F] font-display">
        {message}
      </h3>
      <p className="text-xs text-[#8C827A] mt-1 max-w-sm leading-relaxed">
        {submessage}
      </p>
      {onReset && (
        <button
          onClick={onReset}
          className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] hover:border-[#D5C2B4] text-xs font-semibold text-[#5C5148] hover:text-[#2B231F] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Clear All Filters</span>
        </button>
      )}
    </div>
  );
};
