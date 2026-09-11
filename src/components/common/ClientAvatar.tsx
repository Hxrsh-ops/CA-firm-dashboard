import React from 'react';

interface ClientAvatarProps {
  initials: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ClientAvatar: React.FC<ClientAvatarProps> = ({ initials, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-7 h-7 text-[11px]',
    lg: 'w-9 h-9 text-xs',
  }[size];

  // Subtle neutral-warm background tones for avatar initials
  const getAvatarColors = (init: string) => {
    const charCode = (init.charCodeAt(0) || 65) + (init.charCodeAt(1) || 66);
    const variants = [
      'bg-[#EAE6DD] text-[#40382D]',
      'bg-[#E8DDD5] text-[#5F4635]',
      'bg-[#E3E8ED] text-[#2C3E50]',
      'bg-[#EADED2] text-[#634832]',
      'bg-[#E4EAE1] text-[#2D4E35]',
    ];
    return variants[charCode % variants.length];
  };

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full font-semibold shrink-0 select-none ${getAvatarColors(initials)} ${sizeClasses} ${className}`}
    >
      {initials.slice(0, 2).toUpperCase()}
    </div>
  );
};
