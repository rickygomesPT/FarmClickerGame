
import type React from 'react';

const SheepIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Body */}
    <ellipse cx="12" cy="14" rx="7" ry="4.5" />
    {/* Legs */}
    <line x1="9.5" y1="18.5" x2="8.5" y2="21" />
    <line x1="14.5" y1="18.5" x2="15.5" y2="21" />
    {/* Head */}
    <circle cx="12" cy="8" r="3" />
    {/* Ears */}
    <path d="M10.5 6.5L9 5" />
    <path d="M13.5 6.5L15 5" />
  </svg>
);

export default SheepIcon;
