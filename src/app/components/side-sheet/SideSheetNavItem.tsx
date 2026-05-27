import { cn } from '@/lib/utils';

// ─── SideSheetNavItem ─────────────────────────────────────────────────────────
//
// States (from Figma node 3771:68304):
//   Default  — transparent bg
//   Hover    — rgba(17,16,20,0.04)
//   Selected — rgba(99,86,225,0.08)  +  hover → rgba(99,86,225,0.12)
//
// Figma specs:
//   Container:  rounded-[12px], p-[8px], w-full, gap-[12px]
//   Text:       Roboto Regular 12px #1f1d25 tracking 0.17px line-height 1.43
// ─────────────────────────────────────────────────────────────────────────────

interface SideSheetNavItemProps {
  label: string;
  isSelected?: boolean;
  onClick?: () => void;
  /** Optional leading icon — rendered in a 24×24 slot */
  icon?: React.ReactNode;
}

export function SideSheetNavItem({ label, isSelected = false, onClick, icon }: SideSheetNavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        // Base — Figma: rounded-[12px], p-[8px], full-width flex row, gap-[12px]
        'w-full text-left flex items-center gap-[12px] rounded-[12px] p-[8px]',
        'transition-colors cursor-pointer',
        // States
        isSelected
          ? 'bg-[rgba(99,86,225,0.08)] hover:bg-[rgba(99,86,225,0.12)]'
          : 'bg-transparent hover:bg-[rgba(17,16,20,0.04)]',
      )}
    >
      {/* Optional icon slot — 24×24 */}
      {icon && (
        <span className="size-[24px] flex items-center justify-center shrink-0 text-[rgba(17,16,20,0.56)]">
          {icon}
        </span>
      )}

      {/* Label — Figma: Roboto Regular 12px #1f1d25 tracking 0.17px leading 1.43 */}
      <span
        className={cn(
          "font-['Roboto',sans-serif] font-normal text-[12px] leading-[1.43] tracking-[0.17px] py-[4px]",
          isSelected ? 'text-[#1f1d25]' : 'text-[#1f1d25]',
        )}
      >
        {label}
      </span>
    </button>
  );
}
