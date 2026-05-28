// ─── VehicleCardGrid ──────────────────────────────────────────────────────────
// Vertical card grid — 5 columns, square image with 12px radius + border,
// footer below. Anatomy from Figma CP-12009 node 3975-2215165.

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Check, MoreVertical, MessageSquare, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type {
  VinInventoryRecord,
  SyndicationStatus,
  AIGenerationStatus,
} from '../../../data/inventory/vehicleInventory';
import { VehiclesMenu, type VehiclesMenuAnchor, type VehiclesMenuAction } from './VehiclesMenu';

const CAPTION = "font-['Roboto',sans-serif] font-normal text-[11px] leading-[1.66] tracking-[0.4px]";
const BODY2   = "font-['Roboto',sans-serif] font-normal text-[12px] leading-[1.43] tracking-[0.17px]";

const LAYOUT_SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const;

interface Props {
  records: VinInventoryRecord[];
  selected: Set<string>;
  onToggleRow: (id: string, checked: boolean) => void;
  onVinClick: (id: string) => void;
  onSyndicationToggle?: (id: string) => void;
  onAiGenerationToggle?: (id: string) => void;
  onViewSourceImages?: (id: string) => void;
}

function VerticalCard({
  record, isSelected, onToggle, onClick, onKebabClick, isMenuOpen,
}: {
  record: VinInventoryRecord;
  isSelected: boolean;
  onToggle: (c: boolean) => void;
  onClick: () => void;
  onKebabClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isMenuOpen: boolean;
}) {
  const aiEnabled = record.aiGeneration === 'enabled';

  return (
    <div
      className="group relative flex flex-col cursor-pointer select-none"
      onClick={onClick}
    >
      {/* ── Image block ── */}
      <motion.div
        layoutId={`thumb-${record.id}`}
        transition={LAYOUT_SPRING}
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

        {/* Checkbox */}
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

        {/* AI angles indicator */}
        {record.vehicleGroup && (
          <div className="absolute bottom-[8px] left-[8px] z-10 size-[22px] flex items-center justify-center bg-white/80 rounded-full shadow-sm">
            <MessageSquare size={10} className="text-[rgba(17,16,20,0.56)]" />
          </div>
        )}

        {/* Asset Details button */}
        <button
          onClick={e => { e.stopPropagation(); onClick(); }}
          className="absolute bottom-[9px] right-[9px] z-10 flex items-center gap-[4px] opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          style={{
            backgroundColor: '#473bab', color: 'white', borderRadius: 100,
            paddingLeft: 10, paddingRight: 10, paddingTop: 4, paddingBottom: 4,
            fontFamily: "'Roboto', sans-serif", fontSize: 12, fontWeight: 500,
            letterSpacing: '0.46px', lineHeight: '22px',
          }}
        >
          Asset Details
        </button>
      </motion.div>

      {/* ── Footer ── */}
      <div className="pt-[8px] pb-[12px]">
        <motion.p
          layoutId={`vin-${record.id}`}
          transition={LAYOUT_SPRING}
          className={cn(BODY2, 'text-[#1f1d25] truncate font-medium')}
        >
          {record.vin}
        </motion.p>
        <div className="flex items-start justify-between gap-[4px] mt-[2px]">
          {/* Condition · Year · Make · Model · Trim · Color */}
          <motion.p
            layoutId={`subtitle-${record.id}`}
            transition={LAYOUT_SPRING}
            className={cn(CAPTION, 'text-[#686576] flex-1 min-w-0 leading-[1.5]')}
          >
            {record.condition} · {record.year} · {record.make} · {record.model} · {record.trim} · {record.exteriorColor}
          </motion.p>
          {/* Kebab button — visible on hover */}
          <button
            onClick={onKebabClick}
            className="shrink-0 p-[3px] rounded-full hover:bg-[rgba(17,16,20,0.08)] text-[rgba(17,16,20,0.38)] transition-colors opacity-0 group-hover:opacity-100 mt-[1px]"
          >
            {isMenuOpen ? <X size={13} /> : <MoreVertical size={13} />}
          </button>
        </div>
      </div>
    </div>
  );
}

export function VehicleCardGrid({
  records, selected, onToggleRow, onVinClick,
  onSyndicationToggle, onAiGenerationToggle, onViewSourceImages,
}: Props) {
  const [openMenu, setOpenMenu] = useState<{
    recordId: string;
    anchor: VehiclesMenuAnchor;
    syndicationStatus: SyndicationStatus;
    aiGenerationStatus: AIGenerationStatus;
  } | null>(null);

  const handleMenuAction = useCallback((action: VehiclesMenuAction) => {
    if (!openMenu) return;
    const { recordId } = openMenu;
    if (action === 'vinDetails')        onVinClick(recordId);
    if (action === 'syndicate')         onSyndicationToggle?.(recordId);
    if (action === 'disableAiImage')    onAiGenerationToggle?.(recordId);
    if (action === 'viewSourceImages')  onViewSourceImages?.(recordId);
  }, [openMenu, onVinClick, onSyndicationToggle, onAiGenerationToggle, onViewSourceImages]);

  return (
    <>
      <div className="flex-1 overflow-y-auto min-h-0 p-[16px]">
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
              isMenuOpen={openMenu?.recordId === record.id}
              onKebabClick={e => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                setOpenMenu(prev =>
                  prev?.recordId === record.id ? null : {
                    recordId: record.id,
                    syndicationStatus: record.syndication,
                    aiGenerationStatus: record.aiGeneration,
                    anchor: {
                      top:   rect.bottom + 8,
                      right: window.innerWidth - rect.right,
                    },
                  }
                );
              }}
            />
          ))}
        </div>
      </div>

      {openMenu && (
        <VehiclesMenu
          anchor={openMenu.anchor}
          syndicationStatus={openMenu.syndicationStatus}
          aiGenerationStatus={openMenu.aiGenerationStatus}
          onAction={handleMenuAction}
          onClose={() => setOpenMenu(null)}
        />
      )}
    </>
  );
}
