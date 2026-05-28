// ─── VehicleTableCondensed ────────────────────────────────────────────────────
// Table Small — dense rows at 52px height, 38×38px thumbnail, px-[16px] cells.
// Spacing from Figma node 3975-2248310. Includes Exterior Color column.

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { MoreVertical, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type {
  VinInventoryRecord,
  SyndicationStatus,
  AIGenerationStatus,
} from '../../../data/inventory/vehicleInventory';
import { AIGenerationChip, SyndicationChip, PriceToMarketChip, PriorityScoreChip } from './VehicleInventoryGrid';
import { VehiclesMenu, type VehiclesMenuAnchor, type VehiclesMenuAction } from './VehiclesMenu';

const CAPTION     = "font-['Roboto',sans-serif] font-normal text-[11px] leading-[1.66] tracking-[0.4px]";
const HEADER_LABEL = "font-['Roboto',sans-serif] font-medium text-[14px] leading-[24px] tracking-[0.17px] text-[#1f1d25] whitespace-nowrap";
const CELL        = "font-['Roboto',sans-serif] font-normal text-[12px] leading-[1.43] tracking-[0.17px] text-[#1f1d25]";
const VIN_STYLE   = "font-['Roboto',sans-serif] font-normal text-[12px] leading-[1.43] tracking-[0.17px] text-[#473bab] hover:underline cursor-pointer";

// Row height and thumbnail size (Figma spec)
const ROW_H  = 52;
const THUMB  = 38;

// Column definitions — widths from Figma node 3975-2248310
const EXTRA_COLS: { key: string; label: string; width: number }[] = [
  { key: 'year',           label: 'Year',           width: 124 },
  { key: 'make',           label: 'Make',           width: 124 },
  { key: 'model',          label: 'Model',          width: 124 },
  { key: 'trim',           label: 'Trim',           width: 80  },
  { key: 'price',          label: 'Price',          width: 120 },
  { key: 'aiGeneration',   label: 'AI Generation',  width: 140 },
  { key: 'syndication',    label: 'Syndication',    width: 136 },
  { key: 'exteriorColor',  label: 'Exterior Color', width: 144 },
  { key: 'vehicleStatus',  label: 'Vehicle Status', width: 156 },
  { key: 'dol',            label: 'DOL',            width: 120 },
  { key: 'priceToMarket',  label: 'Price to Market',width: 176 },
  { key: 'priorityScore',  label: 'Priority Score', width: 160 },
];

// Fixed-width columns before the extra block
const EXPAND_W   = 24;
const CHECKBOX_W = 42;
const THUMB_W    = THUMB;       // 38px
const VIN_W      = 190;         // min 180, max 300 — fixed at 190 to match Table Large
const CONDITION_W = 90;         // min 75, max 200

interface Props {
  records: VinInventoryRecord[];
  selected: Set<string>;
  onToggleRow: (id: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  onVinClick: (id: string) => void;
  onSyndicationToggle?: (id: string) => void;
  onAiGenerationToggle?: (id: string) => void;
  onViewSourceImages?: (id: string) => void;
  onAttachComment?: (id: string) => void;
}

export function VehicleTableCondensed({
  records, selected, onToggleRow, onToggleAll, onVinClick,
  onSyndicationToggle, onAiGenerationToggle, onViewSourceImages, onAttachComment,
}: Props) {
  const allSelected  = records.length > 0 && records.every(r => selected.has(r.id));
  const someSelected = !allSelected && records.some(r => selected.has(r.id));

  // ── Kebab menu state ─────────────────────────────────────────────────────
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

  const totalW =
    EXPAND_W + CHECKBOX_W + THUMB_W + VIN_W + CONDITION_W +
    EXTRA_COLS.reduce((s, c) => s + c.width, 0);

  return (
    <>
    <div className="flex-1 overflow-auto min-h-0">
      <table
        className="border-collapse"
        style={{ tableLayout: 'fixed', width: 'max-content', minWidth: totalW }}
      >
        {/* ── Sticky header ── */}
        <thead className="sticky top-0 z-10 bg-white border-b border-[rgba(0,0,0,0.12)]">
          <tr style={{ height: ROW_H }}>

            {/* Expand spacer */}
            <th style={{ width: EXPAND_W, minWidth: EXPAND_W }} />

            {/* Checkbox */}
            <th style={{ width: CHECKBOX_W, minWidth: CHECKBOX_W }} className="px-[1px]">
              <div className="p-[9px]">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={el => { if (el) el.indeterminate = someSelected; }}
                  onChange={e => onToggleAll(e.target.checked)}
                  className="w-[14px] h-[14px] accent-[#473bab] cursor-pointer"
                />
              </div>
            </th>

            {/* Thumbnail — invisible placeholder per Figma (like Table Large) */}
            <th style={{ width: THUMB_W, minWidth: THUMB_W, opacity: 0 }} />

            {/* VIN */}
            <th
              className="text-left p-0"
              style={{ width: VIN_W, minWidth: VIN_W }}
            >
              <div className="flex items-center h-full pl-[16px] pr-[16px] py-[16px]">
                <span className={HEADER_LABEL}>VIN</span>
              </div>
            </th>

            {/* Condition */}
            <th
              className="text-left p-0"
              style={{ width: CONDITION_W, minWidth: CONDITION_W }}
            >
              <div className="flex items-center h-full pl-[16px] pr-[16px] py-[16px]">
                <span className={HEADER_LABEL}>Condition</span>
              </div>
            </th>

            {/* Extra columns */}
            {EXTRA_COLS.map(col => (
              <th
                key={col.key}
                className="text-left p-0"
                style={{ width: col.width, minWidth: col.width }}
              >
                <div className="flex items-center h-full pl-[16px] pr-[16px] py-[16px]">
                  <span className={HEADER_LABEL}>{col.label}</span>
                </div>
              </th>
            ))}

            {/* Sticky kebab column — zero-width, no label */}
            <th className="sticky right-0 z-[11] bg-white p-0" style={{ width: 0, minWidth: 0 }} />

          </tr>
        </thead>

        {/* ── Body ── */}
        <tbody>
          {records.map((record, index) => {
            const isSelected = selected.has(record.id);
            const isDisabled = record.aiGeneration === 'disabled';

            return (
              <motion.tr
                key={record.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.12, delay: Math.min(index * 0.008, 0.25) }}
                className={cn(
                  'group border-b border-[rgba(0,0,0,0.12)] cursor-pointer transition-colors',
                  isDisabled && !isSelected
                    ? 'bg-[rgba(31,29,37,0.04)] hover:bg-[rgba(31,29,37,0.06)]'
                    : isSelected
                      ? 'bg-[rgba(99,86,225,0.08)] hover:bg-[rgba(99,86,225,0.12)]'
                      : 'bg-white hover:bg-[rgba(31,29,37,0.04)]',
                )}
                style={{ height: ROW_H }}
                onClick={() => onVinClick(record.id)}
              >
                {/* Expand spacer */}
                <td style={{ width: EXPAND_W, minWidth: EXPAND_W }} />

                {/* Checkbox */}
                <td
                  style={{ width: CHECKBOX_W, minWidth: CHECKBOX_W }}
                  className="px-[1px]"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="p-[9px]">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={e => onToggleRow(record.id, e.target.checked)}
                      className="w-[14px] h-[14px] accent-[#473bab] cursor-pointer"
                    />
                  </div>
                </td>

                {/* Thumbnail — 38×38px, shares layoutId with Table Large so it morphs on transition */}
                <td style={{ width: THUMB_W, minWidth: THUMB_W }}>
                  <motion.div
                    layoutId={`thumb-${record.id}`}
                    transition={{ type: 'tween', ease: 'easeOut', duration: 0.4 }}
                    className={cn(
                      'relative overflow-hidden bg-[#f0f2f4] flex items-center justify-center',
                      isDisabled && 'opacity-50',
                    )}
                    style={{ width: THUMB, height: THUMB }}
                  >
                    {record.thumbnail ? (
                      <img
                        src={
                          record.aiConfigApplied && record.vehicleGroup?.angles?.['34l']
                            ? record.vehicleGroup.angles['34l'] as string
                            : record.thumbnail
                        }
                        alt={`${record.make} ${record.model}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(17,16,20,0.2)">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                      </svg>
                    )}
                  </motion.div>
                </td>

                {/* VIN — shares layoutId so it slides to its new column position */}
                <td className="px-[16px]" style={{ width: VIN_W, minWidth: VIN_W }}>
                  <motion.button
                    layoutId={`vin-${record.id}`}
                    transition={{ type: 'tween', ease: 'easeOut', duration: 0.4 }}
                    onClick={e => { e.stopPropagation(); onVinClick(record.id); }}
                    className={cn(VIN_STYLE, 'truncate block max-w-full bg-transparent border-none p-0 text-left', isDisabled && 'opacity-50')}
                  >
                    {record.vin}
                  </motion.button>
                </td>

                {/* Condition — shares layoutId with subtitle in card views */}
                <td className="px-[16px]" style={{ width: CONDITION_W, minWidth: CONDITION_W }}>
                  <motion.span
                    layoutId={`subtitle-${record.id}`}
                    transition={{ type: 'tween', ease: 'easeOut', duration: 0.4 }}
                    className={cn(CELL, 'whitespace-nowrap', isDisabled && 'opacity-50')}
                  >
                    {record.condition}
                  </motion.span>
                </td>

                {/* Year */}
                <td className="px-[16px]" style={{ width: 124 }}>
                  <span className={cn(CELL, isDisabled && 'opacity-50')}>{record.year}</span>
                </td>

                {/* Make */}
                <td className="px-[16px]" style={{ width: 124 }}>
                  <span className={cn(CELL, 'truncate block', isDisabled && 'opacity-50')}>{record.make}</span>
                </td>

                {/* Model */}
                <td className="px-[16px]" style={{ width: 124 }}>
                  <span className={cn(CELL, 'truncate block', isDisabled && 'opacity-50')}>{record.model}</span>
                </td>

                {/* Trim */}
                <td className="px-[16px]" style={{ width: 80 }}>
                  <span className={cn(CELL, 'truncate block', isDisabled && 'opacity-50')}>{record.trim}</span>
                </td>

                {/* Price */}
                <td className="px-[16px]" style={{ width: 120 }}>
                  <span className={cn(CELL, 'whitespace-nowrap', isDisabled && 'opacity-50')}>
                    ${record.price.toLocaleString()}
                  </span>
                </td>

                {/* AI Generation — use same chip as Table Large */}
                <td className="px-[16px]" style={{ width: 140 }}>
                  <AIGenerationChip status={record.aiGeneration} />
                </td>

                {/* Syndication — use same chip as Table Large */}
                <td className="px-[16px]" style={{ width: 136 }}>
                  <SyndicationChip status={record.syndication} />
                </td>

                {/* Exterior Color */}
                <td className="px-[16px]" style={{ width: 144 }}>
                  <span className={cn(CELL, 'truncate block', isDisabled && 'opacity-50')}>{record.exteriorColor}</span>
                </td>

                {/* Vehicle Status */}
                <td className="px-[16px]" style={{ width: 156 }}>
                  <span className={cn(CELL, 'truncate block', isDisabled && 'opacity-50')}>{record.vehicleStatus}</span>
                </td>

                {/* DOL */}
                <td className="px-[16px]" style={{ width: 120 }}>
                  <span className={cn(CELL, isDisabled && 'opacity-50')}>{record.dol}</span>
                </td>

                {/* Price to Market */}
                <td className="px-[16px]" style={{ width: 176 }}>
                  <div className={cn(isDisabled && 'opacity-50')}>
                    <PriceToMarketChip value={record.priceToMarket} />
                  </div>
                </td>

                {/* Priority Score */}
                <td className="px-[16px]" style={{ width: 160 }}>
                  <div className={cn(isDisabled && 'opacity-50')}>
                    <PriorityScoreChip score={record.priorityScore} />
                  </div>
                </td>

                {/* Sticky kebab overlay — identical to Table Large */}
                {(() => {
                  const hoverBg = isSelected
                    ? 'rgba(99,86,225,0.12)'
                    : isDisabled
                      ? 'rgba(31,29,37,0.06)'
                      : 'rgba(31,29,37,0.04)';
                  return (
                    <td className="sticky right-0 z-[2] p-0 border-0" style={{ width: 0, minWidth: 0 }}>
                      <div className="invisible group-hover:visible absolute right-0 top-0 bottom-0 flex items-center pointer-events-none">
                        <div
                          className="h-full w-[80px] flex-none"
                          style={{ background: `linear-gradient(to right, transparent, ${hoverBg})` }}
                        />
                        <div
                          className="h-full flex items-center pr-2 flex-none pointer-events-auto"
                          style={{ backgroundColor: hoverBg }}
                        >
                          <button
                            onClick={e => {
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
                            className="w-8 h-8 flex items-center justify-center text-[rgba(17,16,20,0.56)] bg-white hover:bg-[rgba(255,255,255,0.92)] active:bg-[rgba(255,255,255,0.9)] transition-colors cursor-pointer"
                            style={{ borderRadius: 200 }}
                          >
                            {openMenu?.recordId === record.id ? <X size={16} /> : <MoreVertical size={16} />}
                          </button>
                        </div>
                      </div>
                    </td>
                  );
                })()}

              </motion.tr>
            );
          })}
        </tbody>
      </table>
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
