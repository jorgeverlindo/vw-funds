// ─── VehicleCardList ──────────────────────────────────────────────────────────
// Horizontal card list view — 3-col grid, thumbnail left, info right.
// Figma: CP-12009 node 3975-2248310

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { MoreVertical, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type {
  VinInventoryRecord,
  SyndicationStatus,
  AIGenerationStatus,
} from '../../../data/inventory/vehicleInventory';
import { PriceToMarketChip, PriorityScoreChip } from './VehicleInventoryGrid';
import { VehiclesMenu, type VehiclesMenuAnchor, type VehiclesMenuAction } from './VehiclesMenu';

const CAPTION = "font-['Roboto',sans-serif] font-normal text-[11px] leading-[1.66] tracking-[0.4px]";
const BODY2   = "font-['Roboto',sans-serif] font-medium text-[13px] leading-[1.43] tracking-[0.17px]";
const BODY1   = "font-['Roboto',sans-serif] font-normal text-[13px] leading-[1.43] tracking-[0.17px]";

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

function HorizontalCard({
  record, isSelected, onToggle, onClick, onKebabClick, isMenuOpen,
}: {
  record: VinInventoryRecord;
  isSelected: boolean;
  onToggle: (c: boolean) => void;
  onClick: () => void;
  onKebabClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isMenuOpen: boolean;
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
      <motion.div
        layoutId={`thumb-${record.id}`}
        transition={LAYOUT_SPRING}
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

        {/* AI Generation sparkle badge */}
        {aiEnabled && (
          <div className="absolute bottom-[8px] right-[8px] z-10 size-[22px] flex items-center justify-center bg-white/90 rounded-full shadow-[0px_0.8px_4px_0px_rgba(0,0,0,0.12),0px_1.6px_1.6px_0px_rgba(0,0,0,0.14)]">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M7.83008 3.11023C7.80147 2.85767 7.58794 2.66676 7.33376 2.6665C7.07959 2.66624 6.86567 2.85672 6.83655 3.10921C6.64717 4.75111 6.15627 5.90564 5.36433 6.69758C4.57239 7.48952 3.41786 7.98042 1.77596 8.1698C1.52346 8.19892 1.33299 8.41284 1.33325 8.66702C1.33351 8.92119 1.52442 9.13472 1.77698 9.16333C3.39174 9.34623 4.57081 9.83693 5.38155 10.633C6.18924 11.4261 6.69039 12.5804 6.83521 14.2107C6.85815 14.4689 7.0746 14.6668 7.33381 14.6665C7.59303 14.6662 7.80903 14.4679 7.83139 14.2096C7.9702 12.6061 8.47087 11.4275 9.28257 10.6158C10.0943 9.80412 11.2728 9.30345 12.8764 9.16464C13.1346 9.14229 13.333 8.92628 13.3333 8.66707C13.3335 8.40785 13.1357 8.1914 12.8775 8.16846C11.2471 8.02364 10.0928 7.5225 9.29976 6.7148C8.50367 5.90406 8.01298 4.72499 7.83008 3.11023Z" fill="#473BAB"/>
              <path d="M13.1931 0.839064C13.182 0.740847 13.099 0.666605 13.0001 0.666504C12.9013 0.666403 12.8181 0.740475 12.8068 0.838669C12.7331 1.47718 12.5422 1.92617 12.2342 2.23415C11.9263 2.54212 11.4773 2.73303 10.8388 2.80667C10.7406 2.818 10.6665 2.90119 10.6666 3.00004C10.6667 3.09888 10.7409 3.18192 10.8391 3.19305C11.4671 3.26418 11.9256 3.455 12.2409 3.76459C12.555 4.07301 12.7499 4.5219 12.8062 5.15593C12.8152 5.25634 12.8993 5.33328 13.0001 5.33317C13.1009 5.33306 13.1849 5.25592 13.1936 5.1555C13.2476 4.5319 13.4423 4.07357 13.758 3.75791C14.0736 3.44225 14.532 3.24754 15.1556 3.19356C15.256 3.18486 15.3331 3.10086 15.3333 3.00006C15.3334 2.89925 15.2564 2.81507 15.156 2.80616C14.522 2.74983 14.0731 2.55495 13.7647 2.24084C13.4551 1.92555 13.2643 1.46703 13.1931 0.839064Z" fill="#473BAB"/>
            </svg>
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
      </motion.div>

      {/* Right: info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between p-[12px] gap-[6px]">
        <div className="flex items-start justify-between gap-[6px]">
          <div className="min-w-0 flex-1">
            <motion.p
              layoutId={`vin-${record.id}`}
              transition={LAYOUT_SPRING}
              className={cn(BODY2, 'text-[#473bab] truncate hover:underline')}
              onClick={e => { e.stopPropagation(); onClick(); }}
            >
              {record.vin}
            </motion.p>
            <motion.p
              layoutId={`subtitle-${record.id}`}
              transition={LAYOUT_SPRING}
              className={cn(CAPTION, 'text-[rgba(17,16,20,0.56)] truncate mt-[2px]')}
            >
              {record.condition} | {record.year} {record.make} {record.model}
            </motion.p>
          </div>
          <button
            onClick={onKebabClick}
            className="shrink-0 p-[2px] rounded-full hover:bg-[rgba(17,16,20,0.08)] text-[rgba(17,16,20,0.38)] transition-colors cursor-pointer"
          >
            {isMenuOpen ? <X size={14} /> : <MoreVertical size={14} />}
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

export function VehicleCardList({
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
