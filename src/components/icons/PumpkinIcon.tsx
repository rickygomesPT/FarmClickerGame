
import type React from 'react';

const PumpkinIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
    <path d="M21.24,13.62A10.2,10.2,0,0,1,12,22h0A10.2,10.2,0,0,1,2.76,13.62" />
    <path d="M12,22V10.15" />
    <path d="M4.5,10.15A7.5,7.5,0,0,1,12,2h0a7.5,7.5,0,0,1,7.5,8.15" />
    <path d="M10,2h4" />
    <path d="M12,2a4.5,4.5,0,0,0-4.47,4.5c0,1.18.26,2.3.74,3.3" />
    <path d="M12,2a4.5,4.5,0,0,1,4.47,4.5c0,1.18-.26,2.3-.74,3.3" />
  </svg>
);

export default PumpkinIcon;
