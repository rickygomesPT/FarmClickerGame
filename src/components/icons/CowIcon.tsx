
import type React from 'react';

const CowIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
    <path d="M18.5 6.5A5.5 5.5 0 0 0 12 1a5.5 5.5 0 0 0-6.5 5.5c0 2.52 1.19 4.73 3 5.85V18a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2v-5.65c1.81-1.12 3-3.33 3-5.85Z" />
    <path d="M8 12s-1.5 2-1.5 4" />
    <path d="M16 12s1.5 2 1.5 4" />
    <path d="M5 6.5A1.5 1.5 0 0 1 6.5 5C8.05 5 9 6.05 9 7.5" />
    <path d="M19 6.5A1.5 1.5 0 0 0 17.5 5c-1.55 0-2.5 1.05-2.5 2.5" />
    <path d="M12 12v-2" />
    <path d="M12 18.5v-1.5" />
  </svg>
);

export default CowIcon;
