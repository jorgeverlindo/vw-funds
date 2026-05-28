// ─── VehicleCardGrid ──────────────────────────────────────────────────────────
// Vertical card grid — 5 columns, square image with 12px radius + border,
// footer below. Anatomy from Figma CP-12009 node 3975-2215165.
//
// NOTE: No per-item motion wrappers — the parent AnimatePresence container
// handles enter/exit. Per-item stagger was causing the "loads a new view"
// glitch where cards appeared one-by-one during the crossfade.

import { Check, MoreVertical, MessageSquare } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { VinInventoryRecord } from '../../../data/inventory/vehicleInventory';

const CAPTION = "font-['Roboto',sans-serif] font-normal text-[11px] leading-[1.66] tracking-[0.4px]";
const BODY2   = "font-['Roboto',sans-serif] font-normal text-[12px] leading-[1.43] tracking-[0.17px]";

interface Props {
  records: VinInventoryRecord[];
  selected: Set<string>;
  onToggleRow: (id: string, checked: boolean) => void;
  onVinClick: (id: string) => void;
}

function VerticalCard({
  record, isSelected, onToggle, onClick,
}: {
  record: VinInventoryRecord;
  isSelected: boolean;
  onToggle: (c: boolean) => void;
  onClick: () => void;
}) {
  const aiEnabled = record.aiGeneration === 'enabled';

  return (
    <div
      className="group relative flex flex-col cursor-pointer select-none"
      onClick={onClick}
    >
      {/* ── Image block — square, 12px radius, 1px border ── */}
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-[12px] border border-[#e7e7e9] bg-[#f0f2f4] shrink-0',
          !aiEnabled && 'opacity-60',
        )}
        style={{ aspectRatio: '1 / 1' }}
      >
        {record.thumbnail || (record.aiConfigApplied && record.vehicleGroup?.angles?.['34l']) ? (
          <img
            src={
              record.aiConfigApplied && record.vehicleGroup?.angles?.['34l']
                ? record.vehicleGroup.angles['34l'] as string
                : record.thumbnail!
            }
            alt={`${record.make} ${record.model}`}
            className={`w-full h-full transition-transform duration-500 group-hover:scale-105 ${
              record.aiConfigApplied && record.vehicleGroup?.angles?.['34l'] ? 'object-cover' : 'object-contain'
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[rgba(17,16,20,0.2)]">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
          </div>
        )}

        {/* Checkbox — PortalCard style: fades in on hover, always visible when selected */}
        <div
          className={cn(
            'absolute top-[8px] left-[8px] z-10 transition-opacity duration-200',
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          )}
          onClick={e => { e.stopPropagation(); onToggle(!isSelected); }}
        >
          <div className={cn(
            'w-5 h-5 rounded flex items-center justify-center border-2 transition-colors',
            isSelected
              ? 'bg-[#473bab] border-[#473bab]'
              : 'bg-white/80 border-white hover:border-[#473bab]',
          )}>
            {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
          </div>
        </div>

        {/* Disabled badge */}
        {!aiEnabled && (
          <div className="absolute top-[8px] right-[8px] z-10 flex items-center bg-[rgba(0,0,0,0.54)] backdrop-blur-sm rounded-full px-[8px] h-[20px]">
            <span className="text-white font-['Roboto'] font-medium" style={{ fontSize: 10 }}>Disabled</span>
          </div>
        )}

        {/* AI angles comment indicator */}
        {record.vehicleGroup && (
          <div className="absolute bottom-[8px] left-[8px] z-10 size-[22px] flex items-center justify-center bg-white/80 rounded-full shadow-sm">
            <MessageSquare size={10} className="text-[rgba(17,16,20,0.56)]" />
          </div>
        )}

        {/* Asset Details — Figma: bg-[#473bab], white text, pill, bottom-right 9px */}
        <button
          onClick={e => { e.stopPropagation(); onClick(); }}
          className="absolute bottom-[9px] right-[9px] z-10 flex items-center gap-[4px] opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          style={{
            backgroundColor: '#473bab',
            color: 'white',
            borderRadius: 100,
            paddingLeft: 10,
            paddingRight: 10,
            paddingTop: 4,
            paddingBottom: 4,
            fontFamily: "'Roboto', sans-serif",
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: '0.46px',
            lineHeight: '22px',
          }}
        >
          Asset Details
        </button>
      </div>

      {/* ── Footer ── */}
      <div className="pt-[8px] pb-[12px]">
        <p className={cn(BODY2, 'text-[#1f1d25] truncate font-medium')}>
          {record.vin}
        </p>
        <div className="flex items-center justify-between gap-[4px] mt-[2px]">
          <p className={cn(CAPTION, 'text-[#686576] truncate flex-1 min-w-0')}>
            {record.condition} | {record.year} {record.make}
          </p>
          <button
            onClick={e => e.stopPropagation()}
            className="shrink-0 p-[3px] rounded-full hover:bg-[rgba(17,16,20,0.04)] text-[rgba(17,16,20,0.38)] transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function VehicleCardGrid({ records, selected, onToggleRow, onVinClick }: Props) {
  return (
    <div className="flex-1 overflow-y-auto min-h-0 p-[16px]">
      {/* 5 columns, 12px column gap, 20px row gap — matches Figma CP-12009 */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
          columnGap: 12,
          rowGap: 20,
        }}
      >
        {records.map((record) => (
          <VerticalCard
            key={record.id}
            record={record}
            isSelected={selected.has(record.id)}
            onToggle={checked => onToggleRow(record.id, checked)}
            onClick={() => onVinClick(record.id)}
          />
        ))}
      </div>
    </div>
  );
}
