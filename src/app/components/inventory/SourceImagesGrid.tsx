// ─── SourceImagesGrid ─────────────────────────────────────────────────────────
// DataGrid-style table for the Source Images tab in the VIN Detail View.
// Follows the same patterns as DataGrid.tsx:
//   • Sticky header with HeaderDivider drag-to-resize columns
//   • ArrowDownIcon sort indicators
//   • Per-row checkbox + select-all
//   • Row height 90px, row hover states
//
// Columns: expand (chevron) · checkbox · thumbnail (simple img + count badge)
//          · current · source · subtype · timestamp · activeUrl

import React, { useState } from 'react';
import { Link } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { StatusChip } from '../shared/StatusIcon';
import { SourceImagesDrawer } from './SourceImagesDrawer';
import type { SourceImageRecord } from '../../../data/inventory/sourceImages';
import { emitSnackbar } from '../Snackbar';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';

// ─── Relative date helper ─────────────────────────────────────────────────────
function relativeDate(dateStr: string): string {
  const d = new Date(dateStr);
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 30) return `${diff} days ago`;
  const months = Math.floor(diff / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
}

// ─── Angle labels ─────────────────────────────────────────────────────────────
const ANGLE_LABELS: Record<string, string> = {
  '34l': '3/4 L',
  front: 'Front',
  '34r': '3/4 R',
  right: 'Right',
  rear: 'Rear',
  left: 'Left',
};

// ─── AngleUrlChip ─────────────────────────────────────────────────────────────
function AngleUrlChip({ label, url }: { label: string; url: string }) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url).catch(() => {});
    emitSnackbar('URL copied to clipboard');
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleClick}
          className="inline-flex items-center gap-[4px] h-[24px] px-[6px] rounded-[6px] bg-[#f0f2f4] shrink-0 transition-colors hover:bg-[#e4e6ea]"
        >
          <Link size={10} className="text-[#1f1d25] shrink-0" strokeWidth={2} />
          <span
            style={{
              fontSize: 11,
              fontFamily: "'Roboto',sans-serif",
              letterSpacing: '0.16px',
              maxWidth: 180,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block',
            }}
            className="text-[#1f1d25]"
          >
            {label}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[320px] break-all text-[11px]">
        {url}
      </TooltipContent>
    </Tooltip>
  );
}

// ─── Arrow Down Icon (Figma: ArrowDownwardFilled 18×18) ───────────────────────
function ArrowDownIcon() {
  return (
    <svg
      width="18" height="18" viewBox="0 0 24 24"
      fill="currentColor" className="shrink-0 text-[rgba(17,16,20,0.56)]"
    >
      <path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z" />
    </svg>
  );
}

// ─── Header Divider — visual separator + resize handle for the previous column ─
function HeaderDivider({
  prevWidth,
  onPrevWidthChange,
}: {
  prevWidth: number;
  onPrevWidthChange: (w: number) => void;
}) {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX         = e.clientX;
    const startPrevWidth = prevWidth;
    const onMove = (ev: MouseEvent) =>
      onPrevWidthChange(Math.max(40, startPrevWidth + (ev.clientX - startX)));
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div
      className="w-[8px] h-full shrink-0 flex items-center justify-center cursor-col-resize group/dv"
      onMouseDown={handleMouseDown}
    >
      <div className="w-[1px] h-[24px] bg-[rgba(0,0,0,0.12)] group-hover/dv:bg-[#6356e1] transition-colors" />
    </div>
  );
}

// ─── Column widths ─────────────────────────────────────────────────────────────
interface ColWidths {
  expand:    number;
  checkbox:  number;
  thumbnail: number;
  current:   number;
  source:    number;
  subtype:   number;
  timestamp: number;
}

const DEFAULT_WIDTHS: ColWidths = {
  expand:    24,
  checkbox:  42,
  thumbnail: 76,
  current:   160,
  source:    100,
  subtype:   120,
  timestamp: 120,
};

// ─── Typography (mirrors DataGrid constants) ───────────────────────────────────
const BODY2        = "font-['Roboto',sans-serif] font-normal text-[12px] leading-[1.43] tracking-[0.17px]";
const HEADER_LABEL = "font-['Roboto',sans-serif] font-medium text-[14px] leading-[24px] tracking-[0.17px] text-[#1f1d25] whitespace-nowrap";

// ─── SourceImagesGrid ──────────────────────────────────────────────────────────
interface SourceImagesGridProps {
  records: SourceImageRecord[];
}

export function SourceImagesGrid({ records }: SourceImagesGridProps) {
  const [selected,     setSelected]     = useState<Set<string>>(new Set());
  const [widths,       setWidths]       = useState<ColWidths>(DEFAULT_WIDTHS);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentId,    setCurrentId]    = useState<string | null>(() => records[0]?.id ?? null);

  const toggleExpand = (id: string) =>
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const allSelected = records.length > 0 && records.every(r => selected.has(r.id));

  const toggleRow = (id: string, checked: boolean) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };

  const toggleAll = (checked: boolean) =>
    setSelected(checked ? new Set(records.map(r => r.id)) : new Set());

  const setW = (key: keyof ColWidths) => (val: number) =>
    setWidths(prev => ({ ...prev, [key]: val }));

  const w = (key: keyof ColWidths): React.CSSProperties => ({
    width:    widths[key],
    minWidth: widths[key],
  });

  return (
    <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0">
      <table
        className="border-collapse"
        style={{ tableLayout: 'fixed', width: 'max-content', minWidth: '100%' }}
      >

        {/* ── Sticky Header ── */}
        <thead className="sticky top-0 z-10 bg-white border-b border-[rgba(0,0,0,0.12)]">
          <tr className="h-[52px]">

            {/* Expand — no label, no divider */}
            <th className="shrink-0 pl-2" style={w('expand')} />

            {/* Checkbox — select-all */}
            <th className="px-1" style={w('checkbox')}>
              <div className="p-[9px]">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={e => toggleAll(e.target.checked)}
                  className="w-[14px] h-[14px] accent-[#473bab] cursor-pointer"
                />
              </div>
            </th>

            {/* Thumbnail — invisible per Figma (Card Image opacity-0 pattern) */}
            <th style={{ ...w('thumbnail'), opacity: 0 }} />

            {/* Current — left divider resizes thumbnail col */}
            <th className="text-left h-[52px] p-0" style={w('current')}>
              <div className="flex items-center h-full">
                <HeaderDivider prevWidth={widths.thumbnail} onPrevWidthChange={setW('thumbnail')} />
                <div className="flex items-center gap-4 pr-[16px] py-[16px] flex-1 min-w-0">
                  <span className={HEADER_LABEL}>Current Source Image</span>
                  <ArrowDownIcon />
                </div>
              </div>
            </th>

            {/* Source — left divider resizes current */}
            <th className="text-left h-[52px] p-0" style={w('source')}>
              <div className="flex items-center h-full">
                <HeaderDivider prevWidth={widths.current} onPrevWidthChange={setW('current')} />
                <div className="flex items-center gap-4 pr-[16px] py-[16px] flex-1 min-w-0">
                  <span className={HEADER_LABEL}>Source</span>
                  <ArrowDownIcon />
                </div>
              </div>
            </th>

            {/* Subtype — left divider resizes source */}
            <th className="text-left h-[52px] p-0" style={w('subtype')}>
              <div className="flex items-center h-full">
                <HeaderDivider prevWidth={widths.source} onPrevWidthChange={setW('source')} />
                <div className="flex items-center gap-4 pr-[16px] py-[16px] flex-1 min-w-0">
                  <span className={HEADER_LABEL}>Subtype</span>
                  <ArrowDownIcon />
                </div>
              </div>
            </th>

            {/* Timestamp — left divider resizes subtype */}
            <th className="text-left h-[52px] p-0" style={w('timestamp')}>
              <div className="flex items-center h-full">
                <HeaderDivider prevWidth={widths.subtype} onPrevWidthChange={setW('subtype')} />
                <div className="flex items-center gap-4 pr-[16px] py-[16px] flex-1 min-w-0">
                  <span className={HEADER_LABEL}>Timestamp</span>
                  <ArrowDownIcon />
                </div>
              </div>
            </th>

            {/* Active image URL — fill; left divider resizes timestamp */}
            <th className="text-left h-[52px] p-0" style={{ minWidth: 280, flex: 1 }}>
              <div className="flex items-center h-full">
                <HeaderDivider prevWidth={widths.timestamp} onPrevWidthChange={setW('timestamp')} />
                <div className="flex items-center gap-4 pr-[16px] py-[16px] flex-1 min-w-0">
                  <span className={HEADER_LABEL}>Active image URL</span>
                  <ArrowDownIcon />
                </div>
              </div>
            </th>

          </tr>
        </thead>

        {/* ── Body ── */}
        <tbody>
          {records.map(record => {
            const isSelected = selected.has(record.id);
            const isExpanded = expandedRows.has(record.id);
            const isCurrent  = record.id === currentId;
            const hasDrawer  = (record.angleGroups?.length ?? 0) > 0;

            // Compute angle URL chips from angleGroups
            const angleChips: { label: string; url: string }[] = [];
            if (record.angleGroups) {
              for (const group of record.angleGroups) {
                if (group.cards.length === 0) continue;
                const activeSrc =
                  group.cards.find(c => c.id === group.activeCardId)?.src
                  ?? group.cards[0]?.src;
                if (!activeSrc) continue;
                const label = ANGLE_LABELS[group.key] ?? group.label;
                angleChips.push({ label, url: activeSrc });
              }
            }

            return (
              <React.Fragment key={record.id}>
              <tr
                className={cn(
                  'group/row h-[90px] transition-colors border-b border-[rgba(0,0,0,0.12)]',
                  isSelected
                    ? 'bg-[rgba(99,86,225,0.08)] hover:bg-[rgba(99,86,225,0.12)]'
                    : 'bg-white hover:bg-[rgba(31,29,37,0.04)]',
                )}
                style={isExpanded ? { position: 'sticky', top: 52, zIndex: 9 } : undefined}
              >

                {/* Expand chevron — animates 450ms when row is expanded */}
                <td className="pl-2 pr-0" style={w('expand')}>
                  <button
                    onClick={() => hasDrawer && toggleExpand(record.id)}
                    className={cn(
                      'flex items-center justify-center w-[24px] h-[24px] transition-colors rounded',
                      hasDrawer
                        ? 'text-[rgba(17,16,20,0.56)] hover:text-[#1f1d25] hover:bg-[rgba(0,0,0,0.06)] cursor-pointer'
                        : 'text-[rgba(17,16,20,0.18)] cursor-default',
                    )}
                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    disabled={!hasDrawer}
                  >
                    <svg
                      width="24" height="24" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 450ms ease-in-out',
                      }}
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </td>

                {/* Checkbox */}
                <td className="px-1" style={w('checkbox')}>
                  <div className="p-[9px]">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={e => { e.stopPropagation(); toggleRow(record.id, e.target.checked); }}
                      className="w-[14px] h-[14px] accent-[#473bab] cursor-pointer"
                    />
                  </div>
                </td>

                {/* Thumbnail — simple img with numeric badge overlay */}
                <td style={w('thumbnail')}>
                  <div className="relative w-[60px] h-[60px] mx-[8px] shrink-0">
                    <img
                      src={record.thumbnail}
                      alt=""
                      className="w-full h-full object-cover rounded-[4px]"
                    />
                    {/* Count badge */}
                    <span className="absolute bottom-0 right-0 translate-x-[4px] translate-y-[4px] min-w-[18px] h-[18px] rounded-full bg-white border border-[rgba(0,0,0,0.12)] flex items-center justify-center px-[3px]">
                      <span className="text-[10px] font-medium text-[#1f1d25] leading-none" style={{ fontFamily: "'Roboto',sans-serif" }}>
                        {record.imageCount}
                      </span>
                    </span>
                  </div>
                </td>

                {/* Current column */}
                <td className="px-4" style={w('current')}>
                  {isCurrent ? (
                    <StatusChip variant="check" label="Current" />
                  ) : (
                    <button
                      onClick={() => setCurrentId(record.id)}
                      className="opacity-0 group-hover/row:opacity-100 transition-opacity"
                    >
                      <StatusChip variant="pause" label="Make current" />
                    </button>
                  )}
                </td>

                {/* Source */}
                <td className="px-4" style={w('source')}>
                  <p className={cn(BODY2, 'text-[#1f1d25]')}>{record.source}</p>
                </td>

                {/* Subtype */}
                <td className="px-4" style={w('subtype')}>
                  <p className={cn(BODY2, 'text-[#1f1d25]')}>{record.subtype ?? 'StockPhotos'}</p>
                </td>

                {/* Timestamp */}
                <td className="px-4" style={w('timestamp')}>
                  <p className={cn(BODY2, 'text-[#1f1d25] whitespace-nowrap')}>{relativeDate(record.date)}</p>
                </td>

                {/* Active image URL chips */}
                <td className="px-4" style={{ minWidth: 280, flex: 1 }}>
                  <div className="flex items-center flex-wrap gap-[4px] py-[4px]">
                    {angleChips.map(chip => (
                      <AngleUrlChip key={chip.label} label={chip.label} url={chip.url} />
                    ))}
                  </div>
                </td>

              </tr>

              {/* ── Expansion drawer row — animated 450ms ── */}
              {hasDrawer && (
                <tr className="border-b border-[rgba(0,0,0,0.12)]">
                  <td colSpan={8} className="p-0">
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateRows: isExpanded ? '1fr' : '0fr',
                        transition: 'grid-template-rows 450ms ease-in-out',
                      }}
                    >
                      <div style={{ overflow: 'hidden' }}>
                        <SourceImagesDrawer record={record} />
                      </div>
                    </div>
                  </td>
                </tr>
              )}

              </React.Fragment>
            );
          })}
        </tbody>

      </table>
    </div>
  );
}
