import React from 'react';

export type BadgeStatus = 
  | 'Missing'
  | 'Needs Review'
  | 'Need Review'
  | 'Review Required'
  | 'Reminder Ready'
  | 'Pending'
  | 'Pending Approval'
  | 'Processed'
  | 'Valid'
  | 'Invalid'
  | 'Failed'
  | 'Draft'
  | 'Approved'
  | 'Sent'
  | 'Cancelled'
  | 'Not Required'
  | 'Info'
  | 'Scheduled'
  | 'Draft Ready'
  | string;

interface StatusBadgeProps {
  status: BadgeStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStyle = () => {
    switch (status) {
      case 'Missing':
      case 'Invalid':
      case 'Failed':
        return 'bg-[#FDF2F2] text-[#991B1B] border-[#FCA5A5]/60';
      case 'Needs Review':
      case 'Need Review':
      case 'Review Required':
        return 'bg-[#FEF9EE] text-[#92400E] border-[#FCD34D]/70';
      case 'Reminder Ready':
      case 'Pending':
      case 'Pending Approval':
        return 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]/80';
      case 'Processed':
      case 'Valid':
      case 'Approved':
      case 'Sent':
        return 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]/80';
      case 'Draft':
      case 'Draft Ready':
        return 'bg-[#F5F3FF] text-[#6D28D9] border-[#DDD6FE]/80';
      case 'Scheduled':
        return 'bg-[#F0F9FF] text-[#0369A1] border-[#BAE6FD]/80';
      case 'Not Required':
      case 'Info':
      case 'Cancelled':
      default:
        return 'bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]';
    }
  };

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-[11px] font-medium' 
    : 'px-2.5 py-1 text-[12px] font-medium';

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border ${getStyle()} ${sizeClasses} whitespace-nowrap leading-none transition-colors`}
    >
      {status}
    </span>
  );
};
