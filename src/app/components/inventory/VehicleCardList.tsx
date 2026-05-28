// ─── VehicleCardList ──────────────────────────────────────────────────────────
// Horizontal card list view — 3-col grid, thumbnail left, info right.
// Figma: CP-12009 node 3975-2248310
//
// NOTE: No per-item motion wrappers — the parent AnimatePresence container
// handles enter/exit. Per-item stagger was causing the "loads a new view"
// glitch where cards appeared one-by-one during the crossfade.

import { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { VinInventoryRecord } from '../../../data/inventory/vehicleInventory';
import { PriceToMarketChip, PriorityScoreChip } from './VehicleInventoryGrid';

const CAPTION = "font-['Roboto',sans-serif] font-normal text-[11px] leading-[1.66] tracking-[0.4px]";
const BODY2   = "font-['Roboto',sans-serif] font-medium text-[13px] leading-[1.43] tracking-[0.17px]";
const BODY1   = "font-['Roboto',sans-serif] font-normal text-[13px] leading-[1.43] tracking-[0.17px]";

interface Props {
  records: VinInventoryRecord[];
  selected: Set<string>;
  onToggleRow: (id: string, checked: boolean) => void;
  onVinClick: (id: string) => void;
}

function HorizontalCard({
  record, isSelected, onToggle, onClick,
}: {
  record: VinInventoryRecord;
  isSelected: boolean;
  onToggle: (c: boolean) => void;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const aiEnabled = record.aiGeneration === 'enabled';

  return (
    <div
      className={cn(
        'flex rounded-[12px] border overflow-hidden bg-white cursor-pointer select-none',
        'transition-shadow duration-150',
        'shadow-[0px_1px_3px_0px_rgba(0,0,0,0.08)] hover:shadow-[0px_4px_14px_0px_rgba(0,0,0,0.12)]',
        isSelected ? 'border-[#473bab]' : 'border-[rgba(0,0,0,0.10)]',
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {/* Left: thumbnail */}
      <div
        className="relative shrink-0 bg-[#f0f2f4]"
        style={{ width: 160, minHeight: 120 }}
      >
        {record.thumbnail || (record.aiConfigApplied && record.vehicleGroup?.angles?.['34l']) ? (
          <img
            src={
              record.aiConfigApplied && record.vehicleGroup?.angles?.['34l']
                ? record.vehicleGroup.angles['34l'] as string
                : record.thumbnail!
            }
            alt={`${record.make} ${record.model}`}
            className={`absolute inset-0 w-full h-full ${
              record.aiConfigApplied && record.vehicleGroup?.angles?.['34l'] ? 'object-cover' : 'object-contain'
            }`}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[rgba(17,16,20,0.2)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
          </div>
        )}

        {/* Checkbox */}
        <div
          className="absolute top-[8px] left-[8px] z-10"
          onClick={e => { e.stopPropagation(); onToggle(!isSelected); }}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={e => onToggle(e.target.checked)}
            className="size-[16px] rounded accent-[#473bab] cursor-pointer"
          />
        </div>

        {/* Disabled badge */}
        {!aiEnabled && (
          <div className="absolute top-[8px] right-[8px] z-10 flex items-center bg-[rgba(0,0,0,0.54)] backdrop-blur-sm rounded-full px-[8px] h-[20px]">
            <span className="text-white font-['Roboto'] font-medium" style={{ fontSize: 10 }}>Disabled</span>
          </div>
        )}

        {/* Asset Details hover overlay */}
        <div
          className="absolute inset-0 flex items-end justify-start p-[8px] bg-gradient-to-t from-black/40 to-transparent transition-opacity duration-150"
          style={{ opacity: hovered ? 1 : 0 }}
        >
          <button
            onClick={e => { e.stopPropagation(); onClick(); }}
            className="flex items-center gap-[5px] bg-white/90 hover:bg-white text-[#473bab] px-[8px] h-[26px] rounded-full font-['Roboto'] font-medium shadow-sm transition-colors shrink-0"
            style={{ fontSize: 11 }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
            </svg>
            Asset Details
          </button>
        </div>
      </div>

      {/* Right: info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between p-[12px] gap-[6px]">
        <div className="flex items-start justify-between gap-[6px]">
          <div className="min-w-0 flex-1">
            <p
              className={cn(BODY2, 'text-[#473bab] truncate hover:underline')}
              onClick={e => { e.stopPropagation(); onClick(); }}
            >
              {record.vin}
            </p>
            <p className={cn(CAPTION, 'text-[rgba(17,16,20,0.56)] truncate mt-[2px]')}>
              {record.condition} | {record.year} {record.make} {record.model}
            </p>
          </div>
          <button
            onClick={e => e.stopPropagation()}
            className="shrink-0 p-[2px] rounded-full hover:bg-[rgba(17,16,20,0.04)] text-[rgba(17,16,20,0.38)] transition-colors"
          >
            <MoreVertical size={14} />
          </button>
        </div>

        <div className="flex items-center gap-[6px] flex-wrap">
          <span className={cn(BODY1, 'text-[#1f1d25] shrink-0')}>
            ${record.price.toLocaleString()}
          </span>
          <span className="text-[rgba(0,0,0,0.2)] shrink-0">·</span>
          <PriceToMarketChip value={record.priceToMarket} />
          <PriorityScoreChip score={record.priorityScore} />
        </div>
      </div>
    </div>
  );
}

export function VehicleCardList({ records, selected, onToggleRow, onVinClick }: Props) {
  return (
    <div className="flex-1 overflow-y-auto min-h-0 p-[16px]">
      <div
        className="grid gap-[16px]"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}
      >
        {records.map((record) => (
          <HorizontalCard
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
