// ─── VehicleCardGrid ──────────────────────────────────────────────────────────
// Vertical card grid view — responsive columns, 4:3 thumbnail top, info below.
// Styled after PortalCard (border-transparent → hover:border-gray → selected:
// border-[#473bab] ring + shadow).  Keeps motion layoutId wrappers for shared-
// element animation when transitioning to/from horizontal card view.
// Figma: CP-12009 node 3975-2215165

import { motion } from 'motion/react';
import { Check, MoreVertical, MessageSquare } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { VinInventoryRecord } from '../../../data/inventory/vehicleInventory';

const CAPTION = "font-['Roboto',sans-serif] font-normal text-[11px] leading-[1.66] tracking-[0.4px]";
const BODY2   = "font-['Roboto',sans-serif] font-medium text-[13px] leading-[1.43] tracking-[0.17px]";

interface Props {
  records: VinInventoryRecord[];
  selected: Set<string>;
  onToggleRow: (id: string, checked: boolean) => void;
  onVinClick: (id: string) => void;
}

function VerticalCard({
  record, isSelected, onToggle, onClick, index,
}: {
  record: VinInventoryRecord;
  isSelected: boolean;
  onToggle: (c: boolean) => void;
  onClick: () => void;
  index: number;
}) {
  const aiEnabled = record.aiGeneration === 'enabled';

  return (
    <motion.div
      layoutId={`card-${record.id}`}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, delay: Math.min(index * 0.012, 0.3) }}
      className={cn(
        'group relative flex flex-col bg-white rounded-xl border overflow-hidden cursor-pointer select-none',
        'transition-all duration-200',
        isSelected
          ? 'border-[#473bab] ring-1 ring-[#473bab] shadow-md'
          : 'border-transparent hover:border-gray-200 hover:shadow-sm',
      )}
      onClick={onClick}
    >
      {/* ── Thumbnail ── */}
      <motion.div
        layoutId={`thumb-${record.id}`}
        className="relative w-full bg-[#f0f2f4] overflow-hidden shrink-0"
        style={{ aspectRatio: '4/3' }}
      >
        {record.thumbnail ? (
          <img
            src={record.thumbnail}
            alt={`${record.make} ${record.model}`}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[rgba(17,16,20,0.2)]">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
          </div>
        )}

        {/* Checkbox — PortalCard style: hidden until hover or selected */}
        <div
          className={cn(
            'absolute top-[8px] left-[8px] z-10 transition-opacity duration-200',
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          )}
          onClick={e => { e.stopPropagation(); onToggle(!isSelected); }}
        >
          <div className={cn(
            'w-5 h-5 rounded flex items-center justify-center border transition-colors',
            isSelected
              ? 'bg-[#473bab] border-[#473bab]'
              : 'bg-white/80 border-gray-400 hover:bg-white',
          )}>
            {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
          </div>
        </div>

        {/* Disabled badge */}
        {!aiEnabled && (
          <div className="absolute top-[8px] right-[8px] z-10 flex items-center bg-[rgba(0,0,0,0.54)] backdrop-blur-sm rounded-full px-[8px] h-[20px]">
            <span className="text-white font-['Roboto'] font-medium" style={{ fontSize: 10 }}>Disabled</span>
          </div>
        )}

        {/* Comment icon — vehicle has AI angles */}
        {record.vehicleGroup && (
          <div className="absolute bottom-[8px] right-[8px] z-10 size-[22px] flex items-center justify-center bg-white/80 rounded-full shadow-sm">
            <MessageSquare size={11} className="text-[rgba(17,16,20,0.56)]" />
          </div>
        )}

        {/* Asset Details hover overlay */}
        <div className="absolute inset-0 flex items-end justify-start p-[10px] bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={e => { e.stopPropagation(); onClick(); }}
            className="flex items-center gap-[5px] bg-white/90 hover:bg-white text-[#473bab] px-[10px] h-[28px] rounded-full font-['Roboto'] font-medium shadow-sm transition-colors shrink-0"
            style={{ fontSize: 12 }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
            </svg>
            Asset Details
          </button>
        </div>
      </motion.div>

      {/* ── Footer ── */}
      <div className="flex items-start justify-between gap-[4px] px-[10px] pt-[8px] pb-[10px]">
        <div className="min-w-0 flex-1">
          <motion.p layoutId={`vin-${record.id}`} className={cn(BODY2, 'text-[#1f1d25] truncate')}>
            {record.vin}
          </motion.p>
          <motion.p layoutId={`subtitle-${record.id}`} className={cn(CAPTION, 'text-[rgba(17,16,20,0.56)] truncate')}>
            {record.condition} | {record.year} {record.make}
          </motion.p>
        </div>
        <button
          onClick={e => e.stopPropagation()}
          className="shrink-0 p-[2px] -mt-[2px] rounded-full hover:bg-[rgba(17,16,20,0.04)] text-[rgba(17,16,20,0.38)] transition-colors opacity-0 group-hover:opacity-100"
        >
          <MoreVertical size={14} />
        </button>
      </div>
    </motion.div>
  );
}

export function VehicleCardGrid({ records, selected, onToggleRow, onVinClick }: Props) {
  return (
    <div className="flex-1 overflow-y-auto min-h-0 p-[16px]">
      <div
        className="grid gap-[16px]"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}
      >
        {records.map((record, index) => (
          <VerticalCard
            key={record.id}
            record={record}
            isSelected={selected.has(record.id)}
            onToggle={checked => onToggleRow(record.id, checked)}
            onClick={() => onVinClick(record.id)}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
