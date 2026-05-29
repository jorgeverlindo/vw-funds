// ─── VehicleCardGrid ──────────────────────────────────────────────────────────
// Vertical card grid — 5 columns, square image with 12px radius + border,
// footer below. Anatomy from Figma CP-12009 node 3975-2215165.

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Check, MoreVertical, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
const iconEye = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071156/vw-funds/icons/Inventory_Table/Card___Row/eye-open__show__see__reveal__look__visible.svg';
import type {
  VinInventoryRecord,
  SyndicationStatus,
  AIGenerationStatus,
} from '../../../data/inventory/vehicleInventory';
import { VehiclesMenu, type VehiclesMenuAnchor, type VehiclesMenuAction } from './VehiclesMenu';

const CAPTION = "font-['Roboto',sans-serif] font-normal text-[11px] leading-[1.66] tracking-[0.4px]";
const BODY2   = "font-['Roboto',sans-serif] font-normal text-[12px] leading-[1.43] tracking-[0.17px]";

const LAYOUT_SPRING = { type: 'tween', ease: 'easeOut', duration: 0.4 } as const;

interface Props {
  records: VinInventoryRecord[];
  selected: Set<string>;
  onToggleRow: (id: string, checked: boolean) => void;
  onVinClick: (id: string) => void;
  onSyndicationToggle?: (id: string) => void;
  onAiGenerationToggle?: (id: string) => void;
  onViewSourceImages?: (id: string) => void;
  onAttachComment?: (id: string) => void;
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
          'relative w-full overflow-hidden rounded-[12px] border bg-[#f0f2f4] shrink-0 transition-colors duration-150',
          isSelected ? 'border-[#473bab]' : 'border-[#e7e7e9] group-hover:border-[#473bab]',
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

        {/* AI Generation sparkle badge — bottom-left so Asset Details can sit bottom-right */}
        {aiEnabled && (
          <div className="absolute bottom-[8px] left-[8px] z-10 size-[22px] flex items-center justify-center bg-white/90 rounded-full shadow-[0px_0.8px_4px_0px_rgba(0,0,0,0.12),0px_1.6px_1.6px_0px_rgba(0,0,0,0.14)]">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M7.83008 3.11023C7.80147 2.85767 7.58794 2.66676 7.33376 2.6665C7.07959 2.66624 6.86567 2.85672 6.83655 3.10921C6.64717 4.75111 6.15627 5.90564 5.36433 6.69758C4.57239 7.48952 3.41786 7.98042 1.77596 8.1698C1.52346 8.19892 1.33299 8.41284 1.33325 8.66702C1.33351 8.92119 1.52442 9.13472 1.77698 9.16333C3.39174 9.34623 4.57081 9.83693 5.38155 10.633C6.18924 11.4261 6.69039 12.5804 6.83521 14.2107C6.85815 14.4689 7.0746 14.6668 7.33381 14.6665C7.59303 14.6662 7.80903 14.4679 7.83139 14.2096C7.9702 12.6061 8.47087 11.4275 9.28257 10.6158C10.0943 9.80412 11.2728 9.30345 12.8764 9.16464C13.1346 9.14229 13.333 8.92628 13.3333 8.66707C13.3335 8.40785 13.1357 8.1914 12.8775 8.16846C11.2471 8.02364 10.0928 7.5225 9.29976 6.7148C8.50367 5.90406 8.01298 4.72499 7.83008 3.11023Z" fill="#473BAB"/>
              <path d="M13.1931 0.839064C13.182 0.740847 13.099 0.666605 13.0001 0.666504C12.9013 0.666403 12.8181 0.740475 12.8068 0.838669C12.7331 1.47718 12.5422 1.92617 12.2342 2.23415C11.9263 2.54212 11.4773 2.73303 10.8388 2.80667C10.7406 2.818 10.6665 2.90119 10.6666 3.00004C10.6667 3.09888 10.7409 3.18192 10.8391 3.19305C11.4671 3.26418 11.9256 3.455 12.2409 3.76459C12.555 4.07301 12.7499 4.5219 12.8062 5.15593C12.8152 5.25634 12.8993 5.33328 13.0001 5.33317C13.1009 5.33306 13.1849 5.25592 13.1936 5.1555C13.2476 4.5319 13.4423 4.07357 13.758 3.75791C14.0736 3.44225 14.532 3.24754 15.1556 3.19356C15.256 3.18486 15.3331 3.10086 15.3333 3.00006C15.3334 2.89925 15.2564 2.81507 15.156 2.80616C14.522 2.74983 14.0731 2.55495 13.7647 2.24084C13.4551 1.92555 13.2643 1.46703 13.1931 0.839064Z" fill="#473BAB"/>
            </svg>
          </div>
        )}

        {/* Asset Details button — eye icon, appears on hover, bottom-right */}
        <button
          onClick={e => { e.stopPropagation(); onClick(); }}
          className="absolute bottom-[9px] right-[9px] z-10 flex items-center justify-center size-[30px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer"
          style={{ backgroundColor: '#473bab' }}
          title="Asset Details"
        >
          <img
            src={iconEye}
            alt="Asset Details"
            className="w-[16px] h-[16px]"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
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
            className="shrink-0 p-[3px] rounded-full hover:bg-[rgba(17,16,20,0.08)] text-[rgba(17,16,20,0.38)] transition-colors opacity-0 group-hover:opacity-100 mt-[1px] cursor-pointer"
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
  onSyndicationToggle, onAiGenerationToggle, onViewSourceImages, onAttachComment,
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
    if (action === 'attachComment')     onAttachComment?.(recordId);
  }, [openMenu, onVinClick, onSyndicationToggle, onAiGenerationToggle, onViewSourceImages, onAttachComment]);

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
