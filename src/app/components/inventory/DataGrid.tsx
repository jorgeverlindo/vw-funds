import React, { useState } from 'react';
import { MoreVertical, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { AIConfigRecord } from '../../../data/inventory/aiConfigs';
import { useInventory } from '../../contexts/InventoryContext';
import { emitSnackbar } from '../Snackbar';
import type { VinFilters } from '../../../data/inventory/types';
import { Thumbnail } from './Thumbnail';
import { YMMTCItems } from './YMMTCItems';
import { StatusChip } from '../shared/StatusIcon';
import { GlobalAIConfigMenu, type GlobalAIConfigMenuAnchor } from './GlobalAIConfigMenu';

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

// ─── Header Divider — visual separator + resize handle for PREVIOUS column ────
// Dragging it right expands the previous column; left shrinks it.
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
    const startX          = e.clientX;
    const startPrevWidth  = prevWidth;
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
    // 8px wide hotspot; 1px visual line centred inside
    <div
      className="w-[8px] h-full shrink-0 flex items-center justify-center cursor-col-resize group/dv"
      onMouseDown={handleMouseDown}
    >
      <div className="w-[1px] h-[24px] bg-[rgba(0,0,0,0.12)] group-hover/dv:bg-[#6356e1] transition-colors" />
    </div>
  );
}

// ─── VINs Applied Chip ────────────────────────────────────────────────────────
// Plain-text chip for static records that carry a pre-formatted vinsApplied string.
function VinsChip({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center max-h-[24px] min-h-[24px] overflow-hidden px-[4px] py-[3px] rounded-[8px] bg-[rgba(17,16,20,0.04)] shrink-0">
      <span
        className="font-['Roboto',sans-serif] font-normal text-[11px] leading-[18px] tracking-[0.16px] text-[#1f1d25] px-[6px] whitespace-nowrap"
      >
        {label}
      </span>
    </div>
  );
}

// ─── Filter Group Chip ────────────────────────────────────────────────────────
// Purple-tinted chip for structured VinFilters (form-created configs).
// One chip per filter group, stacked vertically.
function formatFilterLabel(filters: VinFilters): string {
  const parts = [filters.year, filters.make, filters.model, filters.trim, filters.color]
    .filter(v => v !== undefined && v !== null && v !== '')
    .map(String);
  return parts.length ? parts.join(' · ') : 'All VINs';
}

function FilterGroupChip({ filters }: { filters: VinFilters }) {
  return (
    <div className="inline-flex items-center max-h-[24px] min-h-[24px] overflow-hidden px-[4px] py-[3px] rounded-[8px] bg-[rgba(17,16,20,0.04)] shrink-0">
      <span
        className="font-['Roboto',sans-serif] font-normal text-[11px] leading-[18px] tracking-[0.16px] text-[#1f1d25] px-[6px] whitespace-nowrap"
      >
        {formatFilterLabel(filters)}
      </span>
    </div>
  );
}

// ─── Column widths state ───────────────────────────────────────────────────────
interface ColWidths {
  expand:      number;
  checkbox:    number;
  thumbnail:   number;
  name:        number;
  model:       number;
  dimensions:  number;
  vinsApplied: number;
  vins:        number;
  status:      number;
  createdAt:   number;
}

// Exact widths from Figma (Extra Column measurements)
const DEFAULT_WIDTHS: ColWidths = {
  expand:      24,
  checkbox:    42,
  thumbnail:   76,
  name:        200,
  model:       140,
  dimensions:  140,
  vinsApplied: 380,
  vins:        120,
  status:      140,
  createdAt:   200,
};

// ─── Typography helpers ────────────────────────────────────────────────────────
// body2: Roboto Regular 12px / 1.43 / tracking 0.17px
const BODY2 = "font-['Roboto',sans-serif] font-normal text-[12px] leading-[1.43] tracking-[0.17px]";
// table/header: Roboto Medium 14px / 24px / tracking 0.17px / #1f1d25  (from Figma)
const HEADER_LABEL = "font-['Roboto',sans-serif] font-medium text-[14px] leading-[24px] tracking-[0.17px] text-[#1f1d25] whitespace-nowrap";

// ─── DataGrid ──────────────────────────────────────────────────────────────────
interface DataGridProps {
  records:      AIConfigRecord[];
  selected:     Set<string>;
  onToggleRow:  (id: string, checked: boolean) => void;
  onToggleAll:  (checked: boolean) => void;
  onRowClick:   (id: string) => void;
  /** Fired when user drag-reorders angles in any vehicle accordion */
  onAngleReorder?: (recordId: string, groupId: string, order: import('../../../data/inventory/types').AngleKey[]) => void;
}

export function DataGrid({ records, selected, onToggleRow, onToggleAll, onRowClick, onAngleReorder, onRemoveConfig }: DataGridProps & { onRemoveConfig?: (configId: string) => void }) {
  const { removeConfig } = useInventory();
  const allSelected = records.length > 0 && records.every(r => selected.has(r.id));
  const [widths, setWidths] = useState<ColWidths>(DEFAULT_WIDTHS);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [openMenu, setOpenMenu] = useState<{ recordId: string; anchor: GlobalAIConfigMenuAnchor } | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const setW = (key: keyof ColWidths) => (val: number) =>
    setWidths(prev => ({ ...prev, [key]: val }));

  const w = (key: keyof ColWidths): React.CSSProperties => ({
    width: widths[key],
    minWidth: widths[key],
  });

  return (
    <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0">
      <table
        className="border-collapse"
        style={{ tableLayout: 'fixed', width: 'max-content', minWidth: '100%' }}
      >
        {/* ── Sticky Header — Figma: Variant=Table Large Header, h=52px ── */}
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
                  onChange={e => onToggleAll(e.target.checked)}
                  className="w-[14px] h-[14px] accent-[#473bab] cursor-pointer"
                />
              </div>
            </th>

            {/* Thumbnail — invisible per Figma (.Card Image opacity-0) */}
            <th style={{ ...w('thumbnail'), opacity: 0 }} />

            {/* Name
                Left divider resizes thumbnail col (prev).
                Padding: pr-[16px] py-[16px], no left pad — divider takes left side. */}
            <th className="text-left h-[52px] p-0" style={w('name')}>
              <div className="flex items-center h-full">
                <HeaderDivider prevWidth={widths.thumbnail} onPrevWidthChange={setW('thumbnail')} />
                <div className="flex items-center gap-4 pr-[16px] py-[16px] flex-1 min-w-0">
                  <span className={HEADER_LABEL}>Name</span>
                  <ArrowDownIcon />
                </div>
              </div>
            </th>

            {/* Model — left divider resizes name */}
            <th className="text-left h-[52px] p-0" style={w('model')}>
              <div className="flex items-center h-full">
                <HeaderDivider prevWidth={widths.name} onPrevWidthChange={setW('name')} />
                <div className="flex items-center gap-4 pr-[16px] py-[16px] flex-1 min-w-0">
                  <span className={HEADER_LABEL}>Model</span>
                  <ArrowDownIcon />
                </div>
              </div>
            </th>

            {/* Dimensions — left divider resizes model */}
            <th className="text-left h-[52px] p-0" style={w('dimensions')}>
              <div className="flex items-center h-full">
                <HeaderDivider prevWidth={widths.model} onPrevWidthChange={setW('model')} />
                <div className="flex items-center gap-4 pr-[16px] py-[16px] flex-1 min-w-0">
                  <span className={HEADER_LABEL}>Dimensions</span>
                  <ArrowDownIcon />
                </div>
              </div>
            </th>

            {/* Filter applied — left divider resizes dimensions */}
            <th className="text-left h-[52px] p-0" style={w('vinsApplied')}>
              <div className="flex items-center h-full">
                <HeaderDivider prevWidth={widths.dimensions} onPrevWidthChange={setW('dimensions')} />
                <div className="flex items-center gap-4 pr-[16px] py-[16px] flex-1 min-w-0">
                  <span className={HEADER_LABEL}>Filter applied</span>
                  <ArrowDownIcon />
                </div>
              </div>
            </th>

            {/* VINs applied — left divider resizes vinsApplied col */}
            <th className="text-left h-[52px] p-0" style={w('vins')}>
              <div className="flex items-center h-full">
                <HeaderDivider prevWidth={widths.vinsApplied} onPrevWidthChange={setW('vinsApplied')} />
                <div className="flex items-center gap-4 pr-[16px] py-[16px] flex-1 min-w-0">
                  <span className={HEADER_LABEL}>VINs applied</span>
                  <ArrowDownIcon />
                </div>
              </div>
            </th>

            {/* Status — left divider resizes vins col */}
            <th className="text-left h-[52px] p-0" style={w('status')}>
              <div className="flex items-center h-full">
                <HeaderDivider prevWidth={widths.vins} onPrevWidthChange={setW('vins')} />
                <div className="flex items-center gap-4 pr-[16px] py-[16px] flex-1 min-w-0">
                  <span className={HEADER_LABEL}>Status</span>
                  <ArrowDownIcon />
                </div>
              </div>
            </th>

            {/* Last Updated — left divider resizes status col; last col */}
            <th className="text-left h-[52px] p-0" style={w('createdAt')}>
              <div className="flex items-center h-full">
                <HeaderDivider prevWidth={widths.status} onPrevWidthChange={setW('status')} />
                <div className="flex items-center gap-4 pr-[16px] py-[16px] flex-1 min-w-0">
                  <span className={HEADER_LABEL}>Last Updated</span>
                  <ArrowDownIcon />
                </div>
              </div>
            </th>

          </tr>
        </thead>

        {/* ── Body ── */}
        <tbody>
          {records.map(record => {
            const isSelected  = selected.has(record.id);
            const isExpanded  = expandedRows.has(record.id);
            const hasChildren = (record.vehicleGroups?.length ?? 0) > 0;

            return (
              // React.Fragment with key — required for multiple sibling <tr> elements
              <React.Fragment key={record.id}>
                {/* ── Main data row ── */}
                <tr
                  key={record.id}
                  className={cn(
                    // Figma: data row height = 90px
                    'group h-[90px] transition-colors cursor-pointer',
                    // Only show bottom border when not expanded (expansion row has its own bottom border)
                    !isExpanded && 'border-b border-[rgba(0,0,0,0.12)]',
                    // States — exact fills from Figma component variants
                    isSelected
                      ? 'bg-[rgba(99,86,225,0.08)] hover:bg-[rgba(99,86,225,0.12)]'
                      : 'bg-white hover:bg-[rgba(31,29,37,0.04)]',
                  )}
                >
                  {/* Expand chevron — clickable only if has children */}
                  <td
                    className="pl-2 pr-0"
                    style={w('expand')}
                    onClick={hasChildren ? (e) => { e.stopPropagation(); toggleExpand(record.id); } : undefined}
                  >
                    <svg
                      width="24" height="24" viewBox="0 0 24 24" fill="none"
                      stroke={hasChildren ? 'rgba(17,16,20,0.56)' : 'rgba(17,16,20,0.18)'}
                      strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round"
                      className={cn(
                        'transition-transform duration-300 ease-out',
                        hasChildren && 'cursor-pointer',
                        isExpanded ? 'rotate-90' : 'rotate-0',
                      )}
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </td>

                  {/* Checkbox */}
                  <td className="px-1" style={w('checkbox')}>
                    <div className="p-[9px]">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={e => { e.stopPropagation(); onToggleRow(record.id, e.target.checked); }}
                        className="w-[14px] h-[14px] accent-[#473bab] cursor-pointer"
                      />
                    </div>
                  </td>

                  {/* Thumbnail — 76×76 square */}
                  <td style={w('thumbnail')} onClick={() => onRowClick(record.id)}>
                    <Thumbnail src={record.thumbnail} alt={record.name} width={76} height={76} />
                  </td>

                  {/* Name — body2 / primary color */}
                  <td className="px-4" style={w('name')} onClick={() => onRowClick(record.id)}>
                    <p className={cn(
                      BODY2,
                      'text-[#473bab] overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer hover:underline',
                    )}>
                      {record.name}
                    </p>
                  </td>

                  {/* Model */}
                  <td className="px-4" style={w('model')}>
                    <p className={cn(BODY2, 'text-[#1f1d25] whitespace-nowrap')}>
                      {record.model}
                    </p>
                  </td>

                  {/* Dimensions */}
                  <td className="px-4" style={w('dimensions')}>
                    <p className={cn(BODY2, 'text-[#1f1d25] whitespace-nowrap')}>
                      {record.dimensions}
                    </p>
                  </td>

                  {/* Filter applied — structured chips if filterGroups present, else plain chip */}
                  <td className="px-4" style={w('vinsApplied')}>
                    {record.filterGroups && record.filterGroups.length > 0 ? (
                      <div className="flex flex-col gap-[4px] py-[4px]">
                        {record.filterGroups.map((fg, i) => (
                          <FilterGroupChip key={i} filters={fg.filters} />
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center flex-wrap gap-2 py-[4px]">
                        <VinsChip label={record.vinsApplied} />
                      </div>
                    )}
                  </td>

                  {/* VINs count */}
                  <td className="px-4" style={w('vins')}>
                    <p className={cn(BODY2, 'text-[#1f1d25]')}>
                      {record.vins}
                    </p>
                  </td>

                  {/* AI Config status — uses shared StatusChip */}
                  <td className="px-4" style={w('status')}>
                    <StatusChip variant={record.status === 'Active' ? 'check' : 'pause'} />
                  </td>

                  {/* Creation Date */}
                  <td className="px-4" style={w('createdAt')}>
                    <p className={cn(BODY2, 'text-[#1f1d25] whitespace-nowrap')}>
                      {record.createdAt}
                    </p>
                  </td>

                  {/* Sticky kebab — zero-width td sticks to right edge, identical to VehicleInventoryGrid */}
                  {(() => {
                    const hoverBg = isSelected
                      ? 'rgba(99,86,225,0.12)'
                      : 'rgba(31,29,37,0.04)';
                    const menuOpen = openMenu?.recordId === record.id;
                    return (
                      <td className="sticky right-0 z-[2] p-0 border-0" style={{ width: 0, minWidth: 0 }}>
                        <div className={cn(
                          'absolute right-0 top-0 bottom-0 flex items-center pointer-events-none',
                          menuOpen ? 'visible' : 'invisible group-hover:visible',
                        )}>
                          {/* Gradient fade */}
                          <div
                            className="h-full w-[80px] flex-none"
                            style={{ background: `linear-gradient(to right, transparent, ${hoverBg})` }}
                          />
                          {/* Solid bg + kebab button */}
                          <div
                            className="h-full flex items-center pr-2 flex-none pointer-events-auto"
                            style={{ backgroundColor: hoverBg }}
                          >
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                if (menuOpen) {
                                  setOpenMenu(null);
                                } else {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setOpenMenu({
                                    recordId: record.id,
                                    anchor: {
                                      top:   rect.bottom + 4,
                                      right: window.innerWidth - rect.right,
                                    },
                                  });
                                }
                              }}
                              className="w-8 h-8 flex items-center justify-center text-[rgba(17,16,20,0.56)] bg-white hover:bg-[rgba(255,255,255,0.92)] active:bg-[rgba(255,255,255,0.9)] transition-colors cursor-pointer"
                              style={{ borderRadius: 200 }}
                            >
                              {menuOpen ? <X size={16} /> : <MoreVertical size={16} />}
                            </button>
                          </div>
                        </div>
                      </td>
                    );
                  })()}
                </tr>

                {/* ── Expansion row — animated via grid-template-rows ── */}
                {hasChildren && (
                  <tr key={`${record.id}-expand`} className="border-b border-[rgba(0,0,0,0.12)]">
                    <td colSpan={10} className="p-0">
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateRows: isExpanded ? '1fr' : '0fr',
                          transition: 'grid-template-rows 350ms ease-out',
                        }}
                      >
                        <div style={{ overflow: 'hidden' }}>
                          <YMMTCItems
                            vehicleGroups={record.vehicleGroups!}
                            onAngleReorder={(groupId, order) => onAngleReorder?.(record.id, groupId, order)}
                          />
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

      {/* GlobalAI Config row menu — portal-mounted, same animation as VehiclesMenu */}
      {openMenu && (
        <GlobalAIConfigMenu
          anchor={openMenu.anchor}
          onAction={action => {
            if (action === 'edit') {
              onRowClick(openMenu.recordId);
            } else if (action === 'remove') {
              const configId = openMenu.recordId;
              removeConfig(configId);
              onRemoveConfig?.(configId);
              emitSnackbar('AI Config removed from inventory');
              setOpenMenu(null);
            }
          }}
          onClose={() => setOpenMenu(null)}
        />
      )}
    </div>
  );
}
