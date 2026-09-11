import React from 'react';

export const DashboardHeader: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 select-none gap-4">
      {/* Left Greeting */}
      <div>
        <div className="text-[13px] font-normal text-[#8A7F77] mb-1">
          Thursday, 11 September 2026
        </div>
        <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#2B231F] leading-tight font-display">
          Good morning, Arun.
        </h1>
        <p className="text-[14px] text-[#7A7169] mt-1 font-normal">
          Here&apos;s what needs your attention today.
        </p>
      </div>

      {/* Right Editorial Quote */}
      <div className="hidden lg:block text-right pr-1">
        <blockquote className="font-serif italic text-[14px] text-[#8C8077] tracking-wide">
          &ldquo;Discipline today<br />builds freedom tomorrow.&rdquo;
        </blockquote>
      </div>
    </div>
  );
};
