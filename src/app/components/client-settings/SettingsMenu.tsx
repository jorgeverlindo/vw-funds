import { cn } from '@/lib/utils';

// ─── Icons — reconstructed from Figma SVG paths ──────────────────────────────

/** Client Settings icon — vertical sliders (exact Figma SVG) */
function IconClientSettings({ className }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M5.70123 20.254V14.0015M5.70123 10.25V3.74707M11.9998 20.0038V12.7505M11.9998 8.99915V3.99707M18.2984 20.2536V16.002M18.2984 12.2508V3.74707M3.74609 13.7515H7.74982M9.99982 9.24902H13.9998M16.2498 15.752H20.2498"
        stroke="currentColor" strokeOpacity="0.56" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

/** Platform Settings icon — gear with inner circle (exact Figma SVG) */
function IconPlatformSettings({ className }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M8.5515 5.36958L6.7588 4.95588C6.42284 4.87835 6.07064 4.97936 5.82684 5.22316L5.22316 5.82684C4.97936 6.07064 4.87835 6.42284 4.95588 6.7588L5.36958 8.5515C5.46311 8.9568 5.29598 9.37768 4.94989 9.60841L3.1953 10.7781C2.9171 10.9636 2.75 11.2758 2.75 11.6102V12.3898C2.75 12.7242 2.9171 13.0364 3.1953 13.2219L4.94989 14.3916C5.29598 14.6223 5.46311 15.0432 5.36958 15.4485L4.95588 17.2412C4.87835 17.5772 4.97936 17.9294 5.22316 18.1732L5.82684 18.7768C6.07064 19.0206 6.42284 19.1217 6.7588 19.0441L8.5515 18.6304C8.9568 18.5369 9.37768 18.704 9.60841 19.0501L10.7781 20.8047C10.9636 21.0829 11.2758 21.25 11.6102 21.25H12.3898C12.7242 21.25 13.0364 21.0829 13.2219 20.8047L14.3916 19.0501C14.6223 18.704 15.0432 18.5369 15.4485 18.6304L17.2412 19.0441C17.5772 19.1217 17.9294 19.0206 18.1732 18.7768L18.7768 18.1732C19.0206 17.9294 19.1217 17.5772 19.0441 17.2412L18.6304 15.4485C18.5369 15.0432 18.704 14.6223 19.0501 14.3916L20.8047 13.2219C21.0829 13.0364 21.25 12.7242 21.25 12.3898V11.6102C21.25 11.2758 21.0829 10.9636 20.8047 10.7781L19.0501 9.60841C18.704 9.37768 18.5369 8.9568 18.6304 8.5515L19.0441 6.7588C19.1217 6.42284 19.0206 6.07064 18.7768 5.82684L18.1732 5.22316C17.9294 4.97936 17.5772 4.87835 17.2412 4.95588L15.4485 5.36958C15.0432 5.46311 14.6223 5.29598 14.3916 4.94989L13.2219 3.1953C13.0364 2.9171 12.7242 2.75 12.3898 2.75H11.6102C11.2758 2.75 10.9636 2.9171 10.7781 3.1953L9.60841 4.94989C9.37768 5.29598 8.9568 5.46311 8.5515 5.36958Z"
        stroke="currentColor" strokeOpacity="0.56" strokeWidth="1.5" strokeLinejoin="round"
      />
      <path
        d="M14.75 12C14.75 13.5188 13.5188 14.75 12 14.75C10.4812 14.75 9.25 13.5188 9.25 12C9.25 10.4812 10.4812 9.25 12 9.25C13.5188 9.25 14.75 10.4812 14.75 12Z"
        stroke="currentColor" strokeOpacity="0.56" strokeWidth="1.5" strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Menu Item ────────────────────────────────────────────────────────────────

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

function MenuItem({ icon, label, onClick }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        // Figma: px-[16px] py-[6px], full width, flex row
        'w-full flex items-center px-[16px] py-[6px]',
        // Hover state — M3 menu item
        'hover:bg-[rgba(17,16,20,0.04)] transition-colors',
        'cursor-pointer',
      )}
    >
      {/* Left slot — Figma: min-w-[36px], icon size-[24px] */}
      <span className="min-w-[36px] flex items-center text-[rgba(17,16,20,0.56)] shrink-0">
        <span className="size-[24px] flex items-center justify-center">
          {icon}
        </span>
      </span>

      {/* Label — Figma: menu/itemDefault Roboto Regular 14px #1f1d25 tracking 0.15px */}
      <span
        className="font-['Roboto',sans-serif] font-normal text-[14px] leading-[1.5] tracking-[0.15px] text-[#1f1d25] whitespace-nowrap"
      >
        {label}
      </span>
    </button>
  );
}

// ─── Settings Menu ────────────────────────────────────────────────────────────

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with the route key when a menu item triggers navigation */
  onNavigate?: (route: string) => void;
  className?: string;
}

export function SettingsMenu({ isOpen, onClose, onNavigate, className }: SettingsMenuProps) {
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        // Figma: <Paper> bg white, rounded-[4px]
        // elevation/8: triple drop-shadow
        'bg-white rounded-[4px] overflow-hidden',
        'shadow-[0px_3px_14px_2px_rgba(0,0,0,0.12),0px_8px_10px_1px_rgba(0,0,0,0.14),0px_5px_5px_-3px_rgba(0,0,0,0.2)]',
        className,
      )}
    >
      {/* Figma: <MenuList> py-[8px] */}
      <div className="py-[8px]">
        <MenuItem
          icon={<IconClientSettings className="size-[24px]" />}
          label="Client Settings"
          onClick={() => { onNavigate?.('client-settings'); onClose(); }}
        />
        <MenuItem
          icon={<IconPlatformSettings className="size-[24px]" />}
          label="Platform Settings"
          onClick={onClose}
        />
      </div>
    </div>
  );
}
