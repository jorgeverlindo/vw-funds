// ─── VehicleTableCondensed ────────────────────────────────────────────────────
// Condensed table view — 36px rows, sticky header, all key fields.

import { motion } from 'motion/react';
import { cn } from '../../../lib/utils';
import type { VinInventoryRecord } from '../../../data/inventory/vehicleInventory';
import { PriceToMarketChip, PriorityScoreChip } from './VehicleInventoryGrid';

const CAPTION = "font-['Roboto',sans-serif] font-normal text-[11px] leading-[1.66] tracking-[0.4px]";
const BODY2   = "font-['Roboto',sans-serif] font-medium text-[12px] leading-[1.43] tracking-[0.17px]";
const CELL    = "font-['Roboto',sans-serif] font-normal text-[12px] leading-[1.43] tracking-[0.17px] text-[#1f1d25]";

interface Props {
  records: VinInventoryRecord[];
  selected: Set<string>;
  onToggleRow: (id: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  onVinClick: (id: string) => void;
}

const COLS: { key: string; label: string; width: number }[] = [
  { key: 'vin',          label: 'VIN',           width: 180 },
  { key: 'condition',    label: 'Condition',      width: 80  },
  { key: 'year',         label: 'Year',           width: 60  },
  { key: 'make',         label: 'Make',           width: 90  },
  { key: 'model',        label: 'Model',          width: 110 },
  { key: 'trim',         label: 'Trim',           width: 120 },
  { key: 'price',        label: 'Price',          width: 90  },
  { key: 'dol',          label: 'DOL',            width: 60  },
  { key: 'aiGeneration', label: 'AI Gen',         width: 100 },
  { key: 'syndication',  label: 'Syndication',    width: 110 },
  { key: 'priceToMkt',   label: 'Price to Mkt',   width: 130 },
  { key: 'priority',     label: 'Priority',       width: 100 },
  { key: 'status',       label: 'Status',         width: 120 },
];

export function VehicleTableCondensed({ records, selected, onToggleRow, onToggleAll, onVinClick }: Props) {
  const allSelected  = records.length > 0 && records.every(r => selected.has(r.id));
  const someSelected = !allSelected && records.some(r => selected.has(r.id));

  return (
    <div className="flex-1 overflow-auto min-h-0">
      <table className="border-collapse w-full" style={{ minWidth: 42 + COLS.reduce((s, c) => s + c.width, 0) }}>
        <thead className="sticky top-0 z-10 bg-white">
          <tr className="border-b border-[rgba(0,0,0,0.12)]">
            <th className="w-[42px] px-[12px] h-[36px] text-left" style={{ minWidth: 42 }}>
              <input
                type="checkbox"
                checked={allSelected}
                ref={el => { if (el) el.indeterminate = someSelected; }}
                onChange={e => onToggleAll(e.target.checked)}
                className="size-[14px] rounded accent-[#473bab] cursor-pointer"
              />
            </th>
            {COLS.map(col => (
              <th
                key={col.key}
                className={cn(CAPTION, 'h-[36px] px-[8px] text-left text-[rgba(17,16,20,0.6)] font-medium whitespace-nowrap')}
                style={{ width: col.width, minWidth: col.width }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((record, index) => {
            const isSelected = selected.has(record.id);
            return (
              <motion.tr
                key={record.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.12, delay: Math.min(index * 0.008, 0.25) }}
                className={cn(
                  'border-b border-[rgba(0,0,0,0.06)] cursor-pointer transition-colors',
                  isSelected ? 'bg-[rgba(71,59,171,0.04)]' : 'hover:bg-[rgba(17,16,20,0.02)]',
                )}
                onClick={() => onVinClick(record.id)}
              >
                <td className="w-[42px] px-[12px] h-[36px]" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={e => onToggleRow(record.id, e.target.checked)}
                    className="size-[14px] rounded accent-[#473bab] cursor-pointer"
                  />
                </td>
                <td className="px-[8px] h-[36px]" style={{ width: 180 }}>
                  <span className={cn(BODY2, 'text-[#473bab] hover:underline truncate block max-w-[160px]')}>
                    {record.vin}
                  </span>
                </td>
                <td className="px-[8px] h-[36px]" style={{ width: 80 }}>
                  <span className={cn(CELL, 'whitespace-nowrap')}>{record.condition}</span>
                </td>
                <td className="px-[8px] h-[36px]" style={{ width: 60 }}>
                  <span className={CELL}>{record.year}</span>
                </td>
                <td className="px-[8px] h-[36px]" style={{ width: 90 }}>
                  <span className={cn(CELL, 'truncate block max-w-[80px]')}>{record.make}</span>
                </td>
                <td className="px-[8px] h-[36px]" style={{ width: 110 }}>
                  <span className={cn(CELL, 'truncate block max-w-[100px]')}>{record.model}</span>
                </td>
                <td className="px-[8px] h-[36px]" style={{ width: 120 }}>
                  <span className={cn(CELL, 'truncate block max-w-[110px]')}>{record.trim}</span>
                </td>
                <td className="px-[8px] h-[36px]" style={{ width: 90 }}>
                  <span className={cn(CELL, 'whitespace-nowrap')}>${record.price.toLocaleString()}</span>
                </td>
                <td className="px-[8px] h-[36px]" style={{ width: 60 }}>
                  <span className={CELL}>{record.dol}</span>
                </td>
                <td className="px-[8px] h-[36px]" style={{ width: 100 }}>
                  <span className={cn(
                    CAPTION,
                    'px-[6px] h-[18px] rounded-full inline-flex items-center whitespace-nowrap',
                    record.aiGeneration === 'enabled'
                      ? 'bg-[#e8f5e9] text-[#2e7d32]'
                      : 'bg-[rgba(17,16,20,0.06)] text-[rgba(17,16,20,0.56)]',
                  )}>
                    {record.aiGeneration === 'enabled' ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
                <td className="px-[8px] h-[36px]" style={{ width: 110 }}>
                  <span className={cn(
                    CAPTION,
                    'px-[6px] h-[18px] rounded-full inline-flex items-center whitespace-nowrap',
                    record.syndication === 'syndicated'
                      ? 'bg-[rgba(71,59,171,0.08)] text-[#473bab]'
                      : 'bg-[rgba(17,16,20,0.06)] text-[rgba(17,16,20,0.56)]',
                  )}>
                    {record.syndication === 'syndicated' ? 'Syndicated' : 'Not Syndicated'}
                  </span>
                </td>
                <td className="px-[8px] h-[36px]" style={{ width: 130 }}>
                  <PriceToMarketChip value={record.priceToMarket} />
                </td>
                <td className="px-[8px] h-[36px]" style={{ width: 100 }}>
                  <PriorityScoreChip score={record.priorityScore} />
                </td>
                <td className="px-[8px] h-[36px]" style={{ width: 120 }}>
                  <span className={cn(CELL, 'truncate block max-w-[110px]')}>{record.vehicleStatus}</span>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
