// ─── SourceImagesGrid ─────────────────────────────────────────────────────────
// DataGrid-style table for the Source Images tab in the VIN Detail View.
// Follows the same patterns as DataGrid.tsx:
//   • Sticky header with HeaderDivider drag-to-resize columns
//   • ArrowDownIcon sort indicators
//   • Per-row checkbox + select-all
//   • Row height 90px, row hover states
//
// Columns: expand (chevron) · checkbox · thumbnail (stacked) · name
//          · format · dimensions · status · tags
//
// Expansion drawer (shows angle breakdown) is NOT implemented here — chevrons are
// always dimmed. A future iteration will replace this component with the full
// accordion (Figma node 4073:450941).

import React, { useState } from 'react';
import { cn } from '../../../lib/utils';
import { StackedThumbnail } from './StackedThumbnail';
import { StatusChip } from '../shared/StatusIcon';
import { ChannelChip } from '../ui/ChannelChip';
import { SourceImagesDrawer } from './SourceImagesDrawer';
import type { SourceImageRecord } from '../../../data/inventory/sourceImages';

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
  expand:     number;
  checkbox:   number;
  thumbnail:  number;
  name:       number;
  format:     number;
  dimensions: number;
  status:     number;
  tags:       number;
}

const DEFAULT_WIDTHS: ColWidths = {
  expand:     24,
  checkbox:   42,
  thumbnail:  76,
  name:       240,
  format:     80,
  dimensions: 120,
  status:     140,
  tags:       200,
};

// ─── Typography (mirrors DataGrid constants) ───────────────────────────────────
const BODY2         = "font-['Roboto',sans-serif] font-normal text-[12px] leading-[1.43] tracking-[0.17px]";
const HEADER_LABEL  = "font-['Roboto',sans-serif] font-medium text-[14px] leading-[24px] tracking-[0.17px] text-[#1f1d25] whitespace-nowrap";

// ─── SourceImagesGrid ──────────────────────────────────────────────────────────
interface SourceImagesGridProps {
  records: SourceImageRecord[];
}

export function SourceImagesGrid({ records }: SourceImagesGridProps) {
  const [selected,     setSelected]     = useState<Set<string>>(new Set());
  const [widths,       setWidths]       = useState<ColWidths>(DEFAULT_WIDTHS);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

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

            {/* Name — left divider resizes thumbnail col */}
            <th className="text-left h-[52px] p-0" style={w('name')}>
              <div className="flex items-center h-full">
                <HeaderDivider prevWidth={widths.thumbnail} onPrevWidthChange={setW('thumbnail')} />
                <div className="flex items-center gap-4 pr-[16px] py-[16px] flex-1 min-w-0">
                  <span className={HEADER_LABEL}>Name</span>
                  <ArrowDownIcon />
                </div>
              </div>
            </th>

            {/* Format — left divider resizes name */}
            <th className="text-left h-[52px] p-0" style={w('format')}>
              <div className="flex items-center h-full">
                <HeaderDivider prevWidth={widths.name} onPrevWidthChange={setW('name')} />
                <div className="flex items-center gap-4 pr-[16px] py-[16px] flex-1 min-w-0">
                  <span className={HEADER_LABEL}>Format</span>
                  <ArrowDownIcon />
                </div>
              </div>
            </th>

            {/* Dimensions — left divider resizes format */}
            <th className="text-left h-[52px] p-0" style={w('dimensions')}>
              <div className="flex items-center h-full">
                <HeaderDivider prevWidth={widths.format} onPrevWidthChange={setW('format')} />
                <div className="flex items-center gap-4 pr-[16px] py-[16px] flex-1 min-w-0">
                  <span className={HEADER_LABEL}>Dimensions</span>
                  <ArrowDownIcon />
                </div>
              </div>
            </th>

            {/* Status — left divider resizes dimensions */}
            <th className="text-left h-[52px] p-0" style={w('status')}>
              <div className="flex items-center h-full">
                <HeaderDivider prevWidth={widths.dimensions} onPrevWidthChange={setW('dimensions')} />
                <div className="flex items-center gap-4 pr-[16px] py-[16px] flex-1 min-w-0">
                  <span className={HEADER_LABEL}>Status</span>
                  <ArrowDownIcon />
                </div>
              </div>
            </th>

            {/* Tags — left divider resizes status; last column */}
            <th className="text-left h-[52px] p-0" style={w('tags')}>
              <div className="flex items-center h-full">
                <HeaderDivider prevWidth={widths.status} onPrevWidthChange={setW('status')} />
                <div className="flex items-center gap-4 pr-[16px] py-[16px] flex-1 min-w-0">
                  <span className={HEADER_LABEL}>Tags</span>
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
            const hasDrawer  = (record.angleGroups?.length ?? 0) > 0;

            return (
              <React.Fragment key={record.id}>
              <tr
                className={cn(
                  'group h-[90px] transition-colors border-b border-[rgba(0,0,0,0.12)]',
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

                {/* Stacked thumbnail */}
                <td style={w('thumbnail')}>
                  <StackedThumbnail
                    src={record.thumbnail}
                    alt={record.name}
                    count={record.imageCount}
                  />
                </td>

                {/* Name — primary purple, truncated */}
                <td className="px-4" style={w('name')}>
                  <p className={cn(
                    BODY2,
                    'text-[#473bab] overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer hover:underline',
                  )}>
                    {record.name}
                  </p>
                </td>

                {/* Format */}
                <td className="px-4" style={w('format')}>
                  <p className={cn(BODY2, 'text-[#1f1d25]')}>{record.format}</p>
                </td>

                {/* Dimensions — tabular numerals */}
                <td className="px-4" style={w('dimensions')}>
                  <p
                    className={cn(BODY2, 'text-[#1f1d25] whitespace-nowrap')}
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {record.dimensions}
                  </p>
                </td>

                {/* Status chip — only shown for Active rows; Paused rows are blank */}
                <td className="px-4" style={w('status')}>
                  {record.status === 'Active' && <StatusChip variant="check" />}
                </td>

                {/* Tags — ChannelChip without icon or remove */}
                <td className="px-4" style={w('tags')}>
                  <div className="flex items-center flex-wrap gap-[4px] py-[4px]">
                    {record.tags.map(tag => (
                      <ChannelChip key={tag} label={tag} />
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
