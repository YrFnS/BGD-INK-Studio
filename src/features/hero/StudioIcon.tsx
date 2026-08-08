import React from 'react';
import type { StudioIconId } from '@/data/storefront';

interface StudioIconProps {
  icon: StudioIconId;
  className?: string;
}

const commonProps = {
  fill: 'none',
  viewBox: '0 0 48 48',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export const StudioIcon: React.FC<StudioIconProps> = ({ icon, className = 'h-6 w-6' }) => {
  if (icon === 'garment') {
    return (
      <svg {...commonProps} className={className}>
        <path d="M16 10.5 7.5 16l4.2 9.2 5.3-2.7V39h14V22.5l5.3 2.7 4.2-9.2-8.5-5.5c-1.6 2.4-4.2 3.8-8 3.8s-6.4-1.4-8-3.8Z" />
        <path d="M19.2 11.3c.7 3 2.3 4.5 4.8 4.5s4.1-1.5 4.8-4.5" />
        <path d="M18.8 24.5h10.4v9.2H18.8z" strokeDasharray="2.8 2.8" />
      </svg>
    );
  }

  if (icon === 'placement') {
    return (
      <svg {...commonProps} className={className}>
        <rect x="9" y="9" width="30" height="30" rx="3" strokeDasharray="4 3" />
        <rect x="16" y="17" width="16" height="14" rx="2" />
        <path d="M13 9v6M9 13h6M35 9v6M39 13h-6M13 39v-6M9 35h6M35 39v-6M39 35h-6" />
        <path d="m21 23 3-3 4 5" />
      </svg>
    );
  }

  if (icon === 'export') {
    return (
      <svg {...commonProps} className={className}>
        <path d="M13 7h15l8 8v26H13z" />
        <path d="M28 7v9h8M19 23h11M19 28h11M19 33h7" />
        <path d="M24 3v13m0 0-4-4m4 4 4-4" />
      </svg>
    );
  }

  if (icon === 'local') {
    return (
      <svg {...commonProps} className={className}>
        <rect x="7" y="9" width="34" height="25" rx="3" />
        <path d="M17 41h14M21 34v7M27 34v7" />
        <path d="M18 22a6 6 0 1 1 2.1 4.6" />
        <path d="m17 24 3 2.6.5-4" />
      </svg>
    );
  }

  if (icon === 'surface') {
    return (
      <svg {...commonProps} className={className}>
        <path d="M13 8h22v32H13z" />
        <path d="M18 14h12v16H18z" strokeDasharray="3 2.5" />
        <path d="M24 5v6M21 8h6M24 37v6M21 40h6" />
        <path d="m9 19-4 5 4 5M39 19l4 5-4 5" />
      </svg>
    );
  }

  return (
    <svg {...commonProps} className={className}>
      <circle cx="24" cy="24" r="17" />
      <path d="M7 24h34M24 7c5 5 7.5 10.7 7.5 17S29 36 24 41c-5-5-7.5-10.7-7.5-17S19 12 24 7Z" />
      <path d="M13 14h22M13 34h22" />
    </svg>
  );
};
