import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SplitButtonItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

interface SplitButtonProps {
  /** Label for the primary (left) action */
  mainLabel: string;
  /** Called when the primary button is clicked */
  onMain: () => void;
  /** Disables the primary button */
  mainDisabled?: boolean;
  /** Secondary items shown in the dropdown */
  items: SplitButtonItem[];
  className?: string;
}

/**
 * Split button: primary action on the left, chevron on the right opens a
 * dropdown with secondary actions (e.g. "Decline").
 * Styled in the outlined amber/orange tone used by "Request Adjustments".
 */
export function SplitButton({ mainLabel, onMain, mainDisabled = false, items, className }: SplitButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className={cn('relative flex items-stretch', className)}>
      {/* ── Primary button ── */}
      <button
        type="button"
        onClick={onMain}
        disabled={mainDisabled}
        className="px-5 py-2 rounded-l-full text-sm font-medium border border-[#E17613] text-[#E17613] hover:bg-[rgba(225,118,19,0.06)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        {mainLabel}
      </button>

      {/* ── Divider ── */}
      <div className="w-px bg-[#E17613]/50 self-stretch" />

      {/* ── Chevron trigger ── */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="px-2.5 py-2 rounded-r-full border border-l-0 border-[#E17613] text-[#E17613] hover:bg-[rgba(225,118,19,0.06)] transition-colors cursor-pointer"
        aria-label="More options"
      >
        <ChevronDown
          className={cn('w-4 h-4 transition-transform duration-150', open && 'rotate-180')}
          strokeWidth={2}
        />
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-xl border border-[rgba(0,0,0,0.09)] py-1 min-w-[160px] overflow-hidden">
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { item.onClick(); setOpen(false); }}
              disabled={item.disabled}
              className={cn(
                'w-full flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-left transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
                item.variant === 'danger'
                  ? 'text-[#D2323F] hover:bg-red-50'
                  : 'text-[#1f1d25] hover:bg-gray-50',
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
