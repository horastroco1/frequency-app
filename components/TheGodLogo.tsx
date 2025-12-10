import React from 'react';

export const TheGodLogo = ({ className }: { className?: string }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      aria-label="THE_G0D Logo"
    >
      {/* OUTER RING (THE UNIVERSE) */}
      <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="8" className="opacity-20" />
      
      {/* THE PHI (THE CUT) */}
      {/* Vertical Line - slightly extended beyond circle */}
      <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="8" className="opacity-100" />
      
      {/* The Loop - representing the Golden Spiral start */}
      <path d="M50 25 C63.8071 25 75 36.1929 75 50 C75 63.8071 63.8071 75 50 75" stroke="currentColor" strokeWidth="8" strokeLinecap="round" className="opacity-80" />
      
      {/* GLITCH ELEMENT (CHAOS) */}
      <rect x="40" y="45" width="20" height="2" fill="currentColor" className="animate-pulse" />
    </svg>
  );
};
