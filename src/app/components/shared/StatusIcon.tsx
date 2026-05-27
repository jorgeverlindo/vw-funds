// ─── StatusIcon ───────────────────────────────────────────────────────────────
// Modular icon component — each status is a variant.
// Extend `StatusIconVariant` and the switch to add new states.
//
// Sizes:
//   sm → 14 × 14 px   (DataGrid chip)
//   md → 18 × 18 px   (inline usage)
//   lg → 24 × 24 px   (header / large contexts)
//
// Variants:
//   check  → Active  — green circle with checkmark (Figma: Status Icons/check)
//   pause  → Paused  — two vertical bars, gray   (Figma: Status Icons/pause)
// ─────────────────────────────────────────────────────────────────────────────

export type StatusIconVariant = 'check' | 'pause';
export type StatusIconSize    = 'sm' | 'md' | 'lg';

const SIZE_PX: Record<StatusIconSize, number> = {
  sm: 14,
  md: 18,
  lg: 24,
};

interface StatusIconProps {
  variant:   StatusIconVariant;
  size?:     StatusIconSize;
  className?: string;
}

export function StatusIcon({ variant, size = 'sm', className }: StatusIconProps) {
  const px = SIZE_PX[size];

  if (variant === 'check') {
    // Active — green circle with checkmark stroke
    // Source: src/assets/icons/VIN List/Card & Row/.AI Images_Center Pane/Status Indicator/Status Icons/check.svg
    return (
      <svg
        width={px}
        height={px}
        viewBox="0 0 14 14"
        fill="none"
        className={className}
        aria-label="Active"
      >
        <path
          d="M8.75065 5.54183L6.12565 8.75016L4.95898 7.5835M12.5423 7.00016C12.5423 10.0607 10.0612 12.5418 7.00065 12.5418C3.94007 12.5418 1.45898 10.0607 1.45898 7.00016C1.45898 3.93958 3.94007 1.4585 7.00065 1.4585C10.0612 1.4585 12.5423 3.93958 12.5423 7.00016Z"
          stroke="#4CAF50"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // pause — Paused — two vertical bars, muted gray
  // Source: src/assets/icons/VIN List/Card & Row/.AI Images_Center Pane/Status Indicator/Status Icons/pause.svg
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 14 14"
      fill="none"
      className={className}
      aria-label="Paused"
    >
      <path
        d="M2.625 2.62484C2.625 2.30267 2.88617 2.0415 3.20833 2.0415H4.95833C5.2805 2.0415 5.54167 2.30267 5.54167 2.62484V11.3748C5.54167 11.697 5.2805 11.9582 4.95833 11.9582H3.20833C2.88617 11.9582 2.625 11.697 2.625 11.3748V2.62484Z"
        stroke="#9C99A9"
        strokeLinejoin="round"
      />
      <path
        d="M8.45833 2.62484C8.45833 2.30267 8.7195 2.0415 9.04167 2.0415H10.7917C11.1138 2.0415 11.375 2.30267 11.375 2.62484V11.3748C11.375 11.697 11.1138 11.9582 10.7917 11.9582H9.04167C8.7195 11.9582 8.45833 11.697 8.45833 11.3748V2.62484Z"
        stroke="#9C99A9"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── StatusChip ───────────────────────────────────────────────────────────────
// Convenience wrapper: icon + text label, styled per status.
// Use this in DataGrid or any table that needs a compact status pill.

const CHIP_STYLES: Record<StatusIconVariant, { bg: string; text: string }> = {
  check: { bg: 'bg-[#e8f5e9]',               text: 'text-[#1b5e20]'              },
  pause: { bg: 'bg-[rgba(17,16,20,0.06)]',    text: 'text-[rgba(17,16,20,0.56)]'  },
};

const VARIANT_LABELS: Record<StatusIconVariant, string> = {
  check: 'Active',
  pause: 'Paused',
};

interface StatusChipProps {
  variant:  StatusIconVariant;
  label?:   string;
  className?: string;
}

export function StatusChip({ variant, label, className }: StatusChipProps) {
  const { bg, text } = CHIP_STYLES[variant];
  const displayLabel  = label ?? VARIANT_LABELS[variant];

  return (
    <span
      className={[
        'inline-flex items-center gap-[4px] rounded-[8px] pl-[6px] pr-[8px] py-[3px] whitespace-nowrap select-none',
        bg,
        className,
      ].filter(Boolean).join(' ')}
    >
      <span className="w-[14px] h-[14px] flex items-center justify-center shrink-0">
        <StatusIcon variant={variant} size="sm" />
      </span>
      <span
        className={[
          "font-['Roboto',sans-serif] font-normal text-[11px] leading-[1.66] tracking-[0.4px]",
          text,
        ].join(' ')}
      >
        {displayLabel}
      </span>
    </span>
  );
}
