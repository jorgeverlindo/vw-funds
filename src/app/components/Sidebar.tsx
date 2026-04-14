import { useState } from 'react';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
}

function NavItem({ icon, label, isActive = false }: NavItemProps) {
  return (
    <div className="relative w-full flex flex-col items-center gap-2 px-4 py-2 rounded-xl cursor-pointer group">
      {/* Active background */}
      {isActive && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-[#2f2673] h-8 w-14 rounded-full" />
        </div>
      )}
      
      {/* Icon */}
      <div className="relative z-10 size-6 text-[#ACABFF]">
        {icon}
      </div>
      
      {/* Label */}
      <div className="relative z-10 text-[11px] font-normal text-[#f9fafa] tracking-[0.4px] leading-[1.66]">
        {label}
      </div>
    </div>
  );
}

export function Sidebar() {
  const [activeNav, setActiveNav] = useState('campaigns');

  return (
    <div className="fixed left-0 top-0 bottom-0 w-[72px] bg-[#1e1a42] flex flex-col items-center z-50">
      {/* Logo */}
      <div className="h-[60px] flex items-center justify-center p-3">
        <div className="size-10 bg-[#0c1b44] rounded flex items-center justify-center">
          <div className="size-8 bg-gray-700 rounded" />
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 flex flex-col gap-3 px-1 pt-4">
        <NavItem
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
          }
          label="Projects"
        />

        <NavItem
          icon={
            <svg fill="none" viewBox="0 0 24 24">
              <circle cx="6" cy="12" r="2" fill="currentColor" />
              <circle cx="12" cy="6" r="2" fill="currentColor" />
              <circle cx="12" cy="18" r="2" fill="currentColor" />
            </svg>
          }
          label="Feeds"
        />

        <NavItem
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <circle cx="12" cy="12" r="10" />
              <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none" />
              <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none" />
              <path d="M9 14h6" strokeLinecap="round" />
            </svg>
          }
          label="Design"
        />

        <NavItem
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 3v18" />
            </svg>
          }
          label="Portal"
        />

        <NavItem
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          label="Campaigns"
          isActive={activeNav === 'campaigns'}
        />

        <NavItem
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10m-8-10v10l8 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          label="Inventory"
        />

        <NavItem
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path d="M3 3v18h18M7 16l4-4 4 4 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          label="Insights"
        />

        <NavItem
          icon={
            <svg fill="none" viewBox="0 0 24 24">
              <path d="M12 3l2 7h7l-5.5 4.5L17 21l-5-4-5 4 1.5-6.5L3 10h7l2-7z" fill="currentColor" />
            </svg>
          }
          label="AI Tools"
        />
      </nav>

      {/* Help button */}
      <div className="pb-6 flex flex-col items-center">
        <div className="size-6 text-[#ACABFF]">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
