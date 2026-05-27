// ─── VehicleRow ───────────────────────────────────────────────────────────────
// One vehicle/color variant row inside a YMMTC expansion panel.
// Clicking the row toggles the AnglesSource sub-panel (grid-template-rows animation).

import { cn } from '../../../lib/utils';
import type { VehicleGroup } from '../../../data/inventory/types';
import { AnglesSource } from './AnglesSource';

// ─── Status badge (Active / Inactive) ────────────────────────────────────────
const STATUS_STYLES = {
  Active: {
    bg:   'bg-[#e8f5e9]',
    text: 'text-[#1b5e20]',
    dot:  'bg-[#4CAF50]',
  },
  Inactive: {
    bg:   'bg-[rgba(17,16,20,0.06)]',
    text: 'text-[rgba(17,16,20,0.56)]',
    dot:  'bg-[rgba(17,16,20,0.38)]',
  },
} as const;

function StatusBadge({ status }: { status: 'Active' | 'Inactive' }) {
  const s = STATUS_STYLES[status];
  return (
    <span className={cn(
      'inline-flex items-center gap-[4px] rounded-[8px] pl-[6px] pr-[8px] py-[3px] whitespace-nowrap select-none',
      s.bg,
    )}>
      <span className="w-[14px] h-[14px] flex items-center justify-center shrink-0">
        <span className={cn('w-[6px] h-[6px] rounded-full', s.dot)} />
      </span>
      <span className={cn(
        "font-['Roboto',sans-serif] font-normal text-[11px] leading-[1.66] tracking-[0.4px]",
        s.text,
      )}>
        {status}
      </span>
    </span>
  );
}

// ─── VehicleRow ───────────────────────────────────────────────────────────────

interface VehicleRowProps {
  group: VehicleGroup;
  isExpanded: boolean;
  onToggle: () => void;
  /** Fired when user drag-reorders angles; first key in array is the new Hero */
  onAngleReorder?: (order: import('../../../data/inventory/types').AngleKey[]) => void;
}

export function VehicleRow({ group, isExpanded, onToggle, onAngleReorder }: VehicleRowProps) {
  const label = `${group.year} · ${group.make} · ${group.model} · ${group.trim} · ${group.color}`;

  return (
    <div className="border-t border-[rgba(0,0,0,0.08)]">
      {/* ── Collapsed row ── */}
      <div
        className="flex items-center h-[56px] pl-[40px] pr-[16px] bg-[#f9fafa] hover:bg-[rgba(17,16,20,0.04)] cursor-pointer transition-colors select-none"
        onClick={onToggle}
        role="button"
        aria-expanded={isExpanded}
      >
        {/* Expand chevron */}
        <div className="shrink-0 w-[24px] h-[24px] flex items-center justify-center mr-[8px]">
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="rgba(17,16,20,0.56)" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            className={cn(
              'transition-transform duration-300 ease-out',
              isExpanded ? 'rotate-90' : 'rotate-0',
            )}
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>

        {/* Vehicle thumbnail */}
        <div className="shrink-0 w-[60px] h-[38px] mr-[12px] flex items-center justify-center">
          <img
            src={group.thumbnail}
            alt={group.model}
            className="h-[38px] w-[60px] object-contain"
          />
        </div>

        {/* YMMTC name */}
        <span className="flex-1 font-['Roboto',sans-serif] font-normal text-[12px] leading-[1.43] tracking-[0.17px] text-[#1f1d25] overflow-hidden text-ellipsis whitespace-nowrap mr-[12px]">
          {label}
        </span>

        {/* Source */}
        <span className="shrink-0 w-[110px] font-['Roboto',sans-serif] font-normal text-[12px] leading-[1.43] tracking-[0.17px] text-[#686576] whitespace-nowrap overflow-hidden text-ellipsis mr-[12px]">
          {group.source}
        </span>

        {/* Status badge */}
        <div className="shrink-0 w-[90px] flex items-center">
          <StatusBadge status={group.status} />
        </div>
      </div>

      {/* ── AnglesSource — animates open/closed via grid-template-rows ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: isExpanded ? '1fr' : '0fr',
          transition: 'grid-template-rows 300ms ease-out',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <AnglesSource
            angles={group.angles}
            sourceAngles={group.sourceAngles}
            previousAngles={group.previousAngles}
            vehicleName={group.model}
            initialOrder={group.angleOrder}
            onOrderChange={onAngleReorder}
          />
        </div>
      </div>
    </div>
  );
}
