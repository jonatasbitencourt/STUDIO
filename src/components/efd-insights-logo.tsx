import React from 'react';

export function AppLogo(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="flex items-center gap-3 group/logo" {...props}>
      <div className="p-2 bg-background rounded-lg shadow-neumo-inset group-data-[collapsible=icon]:p-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary transition-all group-data-[collapsible=icon]:size-7"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
      </div>
      <span className="font-bold text-lg text-foreground group-data-[collapsible=icon]:hidden">
        EFD Contribuições
      </span>
    </div>
  );
}
