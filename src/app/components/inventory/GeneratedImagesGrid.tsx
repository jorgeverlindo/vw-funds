// ─── GeneratedImagesGrid ───────────────────────────────────────────────────────
// DataGrid-style table for the Generated Images tab in the VIN Detail View.
// Figma: CP-12009 – Multi-Angle, node 4297:801317
//
// Columns: expand (chevron) · checkbox · thumbnail (76×76)
//          · Name (flex, min 180, max 300) · Dimensions (flex, min 75, max 200)
//          · Generated Image (220px status chip) · Filters applied (370px chips)
//          · Image Type (154px) · Last Update (140px)
// Row height: 90px

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../../lib/utils';
import type { GeneratedImageConfig, GeneratedImageStatus } from '../../../data/inventory/generatedImages';
import { SourceImagesDrawer } from './SourceImagesDrawer';
import type { SourceImageRecord } from '../../../data/inventory/sourceImages';
import { emitSnackbar } from '../Snackbar';
import { setMainGeneratedImage, getMainConfigId } from './generatedMainStore';

// ─── Typography constants ─────────────────────────────────────────────────────
const BODY2   = { fontSize: 12, fontFamily: "'Roboto',sans-serif", fontWeight: 400, letterSpacing: '0.17px', lineHeight: 1.43 } as React.CSSProperties;
const CAPTION = { fontSize: 11, fontFamily: "'Roboto',sans-serif", fontWeight: 400, letterSpacing: '0.4px',  lineHeight: 1.66 } as React.CSSProperties;
const SUB2    = { fontSize: 14, fontFamily: "'Roboto',sans-serif", fontWeight: 500, letterSpacing: '0.1px',  lineHeight: '24px' } as React.CSSProperties;
const HEADER  = { fontSize: 14, fontFamily: "'Roboto',sans-serif", fontWeight: 500, letterSpacing: '0.17px', lineHeight: '24px' } as React.CSSProperties;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function relativeDate(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 30) return `${diff} days ago`;
  const months = Math.floor(diff / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function ChevronRightIcon({ rotated }: { rotated?: boolean }) {
  return (
    <svg
      width="24" height="24" viewBox="0 0 24 24" fill="currentColor"
      className="transition-transform duration-200"
      style={{ transform: rotated ? 'rotate(90deg)' : 'none' }}
    >
      <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.54 }}>
      <path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="7" y1="12" x2="17" y2="12" />
      <line x1="10" y1="18" x2="14" y2="18" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function MoreVertIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5"  r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ViewListIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 5h2v2H3zm4 0h14v2H7zM3 11h2v2H3zm4 0h14v2H7zM3 17h2v2H3zm4 0h14v2H7z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ─── Status chip ──────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<GeneratedImageStatus, { bg: string; text: string }> = {
  Main: { bg: '#e8f5e9', text: '#1b5e20' },
};

function StatusChipGenerated({ status }: { status: GeneratedImageStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 8px 3px 6px',
        borderRadius: 8,
        background: s.bg,
        ...CAPTION,
        color: s.text,
        whiteSpace: 'nowrap',
        lineHeight: '18px',
      }}
    >
      {status === 'Main' && (
        <span style={{ color: s.text, display: 'flex', alignItems: 'center' }}>
          <CheckIcon />
        </span>
      )}
      {status}
    </span>
  );
}

// ─── Filter chip ──────────────────────────────────────────────────────────────
function FilterChip({ label }: { label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: 8,
        background: 'rgba(17,16,20,0.04)',
        ...CAPTION,
        color: '#1f1d25',
        whiteSpace: 'nowrap',
        lineHeight: '18px',
        letterSpacing: '0.16px',
      }}
    >
      {label}
    </span>
  );
}

// ─── Checkbox (indeterminate-capable) ────────────────────────────────────────
function Checkbox({ checked, indeterminate, onChange }: {
  checked: boolean;
  indeterminate?: boolean;
  onChange?: (v: boolean) => void;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate;
  }, [indeterminate]);

  return (
    <input
      type="checkbox"
      ref={ref}
      checked={checked}
      onChange={e => onChange?.(e.target.checked)}
      style={{ width: 18, height: 18, accentColor: '#473bab', cursor: 'pointer', flexShrink: 0 }}
    />
  );
}

// ─── Resizable header divider ─────────────────────────────────────────────────
function ResizeDivider({ prevWidth, onPrevWidthChange }: {
  prevWidth: number;
  onPrevWidthChange: (w: number) => void;
}) {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX;
    const startW = prevWidth;
    const onMove = (ev: MouseEvent) =>
      onPrevWidthChange(Math.max(60, startW + (ev.clientX - startX)));
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };
  return (
    <div
      style={{
        width: 8, height: '100%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'col-resize',
      }}
      onMouseDown={handleMouseDown}
    >
      <span style={{ display: 'block', width: 1, height: 24, background: 'rgba(0,0,0,0.12)' }} />
    </div>
  );
}

// ─── Column header cell ───────────────────────────────────────────────────────
function ColHeader({
  label, showSort = false, width, onWidthChange, style,
}: {
  label: string;
  showSort?: boolean;
  width?: number;
  onWidthChange?: (w: number) => void;
  style?: React.CSSProperties;
}) {
  return (
    <th
      style={{
        padding: 0,
        textAlign: 'left',
        fontWeight: 'normal',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        verticalAlign: 'middle',
        ...(width !== undefined ? { width, minWidth: width } : {}),
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        {onWidthChange !== undefined && width !== undefined
          ? <ResizeDivider prevWidth={width} onPrevWidthChange={onWidthChange} />
          : <span style={{ display: 'block', width: 1, height: 24, background: 'rgba(0,0,0,0.12)', flexShrink: 0 }} />
        }
        <span style={{ ...HEADER, color: '#1f1d25', padding: '0 4px 0 16px' }}>{label}</span>
        {showSort && <span style={{ padding: '0 4px' }}><ArrowDownIcon /></span>}
      </div>
    </th>
  );
}

// ─── Thumbnail ────────────────────────────────────────────────────────────────
function Thumbnail({ src, alt }: { src: string | null; alt: string }) {
  return (
    <div
      style={{
        width: 76, height: 76, flexShrink: 0,
        background: '#f0f2f4',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {src && (
        <img
          src={src}
          alt={alt}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      )}
    </div>
  );
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────
function Toolbar({
  total, onSearch, searchValue,
}: {
  total: number;
  onSearch: (v: string) => void;
  searchValue: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 12px 8px 16px',
        flexWrap: 'wrap',
        gap: 8,
        flexShrink: 0,
      }}
    >
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {/* Filter icon */}
        <button
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 30, height: 30, borderRadius: '50%', border: 'none',
            background: 'transparent', cursor: 'pointer', color: '#1f1d25',
          }}
          title="Filters"
        >
          <FilterIcon />
        </button>

        {/* + New Config button */}
        <button
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '4px 10px',
            background: '#473bab', color: 'white',
            border: 'none', borderRadius: 100,
            fontSize: 13, fontFamily: "'Roboto',sans-serif", fontWeight: 500,
            letterSpacing: '0.46px', lineHeight: '22px',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          <PlusIcon />
          New Config
        </button>

        {/* Kebab menu */}
        <button
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 30, height: 30, borderRadius: '50%', border: 'none',
            background: 'transparent', cursor: 'pointer', color: '#1f1d25',
          }}
          title="More options"
        >
          <MoreVertIcon />
        </button>

        {/* Search */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            height: 34, padding: '0 8px',
            background: '#f9fafa',
            border: '1px solid #cac9cf',
            borderRadius: 20, minWidth: 200, width: 200,
          }}
        >
          <span style={{ color: '#9c99a9', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Find below"
            value={searchValue}
            onChange={e => onSearch(e.target.value)}
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 14, fontFamily: "'Roboto',sans-serif", color: '#1f1d25',
              letterSpacing: '0.15px',
            }}
          />
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ ...CAPTION, color: '#686576', display: 'flex', gap: 3 }}>
          <span>{total}</span>
          <span>Items</span>
        </span>
        <button
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 30, height: 30, borderRadius: '50%', border: 'none',
            background: 'transparent', cursor: 'pointer', color: 'rgba(17,16,20,0.54)',
          }}
          title="List view"
        >
          <ViewListIcon />
        </button>
      </div>
    </div>
  );
}

// ─── MakeMainChip ────────────────────────────────────────────────────────────
// Gray chip shown on hover over a non-Main row — same style as FilterChip.
function MakeMainChip({ onClick }: { onClick: () => void }) {
  return (
    <span
      onClick={e => { e.stopPropagation(); onClick(); }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: 8,
        background: 'rgba(17,16,20,0.04)',
        ...CAPTION,
        color: '#1f1d25',
        whiteSpace: 'nowrap',
        lineHeight: '18px',
        letterSpacing: '0.16px',
        cursor: 'pointer',
      }}
    >
      Make it Main Image
    </span>
  );
}

// ─── GeneratedImageCell ───────────────────────────────────────────────────────
// Shows the Main chip, or the gray MakeMainChip on hover.
function GeneratedImageCell({ isMain, onMakeMain }: { isMain: boolean; onMakeMain: () => void }) {
  const [hovered, setHovered] = useState(false);
  if (isMain) return <StatusChipGenerated status="Main" />;
  return (
    <div
      style={{ display: 'inline-flex', alignItems: 'center', minHeight: 24 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ opacity: hovered ? 1 : 0, transition: 'opacity 150ms' }}>
        <MakeMainChip onClick={onMakeMain} />
      </span>
    </div>
  );
}

// ─── Column widths (resizable) ────────────────────────────────────────────────
interface ColWidths {
  name:           number;
  dimensions:     number;
  generatedImage: number;
  filters:        number;
  imageType:      number;
  lastUpdate:     number;
}

const DEFAULT_COL_WIDTHS: ColWidths = {
  name:           220,
  dimensions:     120,
  generatedImage: 220,
  filters:        370,
  imageType:      154,
  lastUpdate:     140,
};

// ─── GeneratedImagesGrid ──────────────────────────────────────────────────────
interface GeneratedImagesGridProps {
  configs: GeneratedImageConfig[];
  vin: string;
}

export function GeneratedImagesGrid({ configs, vin }: GeneratedImagesGridProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [search,      setSearch]      = useState('');
  const [colWidths, setColWidths]     = useState<ColWidths>(DEFAULT_COL_WIDTHS);

  const setW = (key: keyof ColWidths) => (val: number) =>
    setColWidths(prev => ({ ...prev, [key]: val }));

  // Radio-style: only one config is Main at a time.
  // Prefer the persisted selection from the store; fall back to isDefaultMain.
  const [mainId, setMainId] = useState<string | null>(() => {
    const stored = vin ? getMainConfigId(vin) : null;
    if (stored && configs.some(c => c.id === stored)) return stored;
    return (configs.find(c => c.isDefaultMain) ?? configs.find(c => c.status === 'Main'))?.id ?? null;
  });

  // Initialize the store with the initial main's coverImage on mount.
  useEffect(() => {
    const initial = configs.find(c => c.id === mainId);
    if (initial && vin) {
      setMainGeneratedImage(vin, initial.coverImage ?? initial.thumbnail ?? '', initial.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const filtered = configs.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  const allSelected   = filtered.length > 0 && filtered.every(c => selectedIds.has(c.id));
  const someSelected  = filtered.some(c => selectedIds.has(c.id));
  const indeterminate = someSelected && !allSelected;

  const toggleAll = (v: boolean) => {
    setSelectedIds(v ? new Set(filtered.map(c => c.id)) : new Set());
  };

  const toggleRow = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column',
        flex: '1 1 0%', minHeight: 0, overflow: 'hidden',
      }}
    >
      <Toolbar total={filtered.length} onSearch={setSearch} searchValue={search} />

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(0,0,0,0.12)', flexShrink: 0 }} />

      {/* Table */}
      <div ref={scrollContainerRef} style={{ flex: '1 1 0%', overflowY: 'auto', overflowX: 'auto' }}>
        <table
          style={{
            borderCollapse: 'collapse',
            tableLayout: 'fixed',
            width: 'max-content',
            minWidth: '100%',
          }}
        >
          {/* Header */}
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.12)', height: 56 }}>
              {/* Chevron placeholder */}
              <th style={{ width: 24, minWidth: 24, padding: 0 }} />

              {/* Select all */}
              <th style={{ width: 42, minWidth: 42, padding: '0 0 0 9px', verticalAlign: 'middle', textAlign: 'left' }}>
                <Checkbox
                  checked={allSelected}
                  indeterminate={indeterminate}
                  onChange={toggleAll}
                />
              </th>

              {/* Thumbnail placeholder (spacer only) */}
              <th style={{ width: 76, minWidth: 76, padding: 0 }} />

              <ColHeader label="Name"            showSort width={colWidths.name}           onWidthChange={setW('name')} />
              <ColHeader label="Dimensions"      showSort width={colWidths.dimensions}      onWidthChange={setW('dimensions')} />
              <ColHeader label="Generated Image" showSort width={colWidths.generatedImage}  onWidthChange={setW('generatedImage')} />
              <ColHeader label="Filters applied" showSort width={colWidths.filters}         onWidthChange={setW('filters')} />
              <ColHeader label="Image Type"      showSort width={colWidths.imageType}       onWidthChange={setW('imageType')} />
              <ColHeader label="Last Update"     showSort width={colWidths.lastUpdate}      onWidthChange={setW('lastUpdate')} />
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  style={{ ...BODY2, color: 'rgba(17,16,20,0.38)', textAlign: 'center', padding: 48 }}
                >
                  {search ? 'No results found' : 'No generated image configs yet'}
                </td>
              </tr>
            ) : filtered.map(config => {
              const isExpanded = expandedIds.has(config.id);
              const isSelected = selectedIds.has(config.id);
              const isMain     = mainId === config.id;

              return (
                <React.Fragment key={config.id}>
                  <tr
                    style={{
                      height: 90,
                      background: isSelected ? 'rgba(71,59,171,0.04)' : 'white',
                      transition: 'background 150ms',
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#fafafa'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isSelected ? 'rgba(71,59,171,0.04)' : 'white'; }}
                  >
                    {/* Chevron */}
                    <td
                      style={{ width: 24, padding: 0, cursor: 'pointer', color: 'rgba(17,16,20,0.54)', verticalAlign: 'middle' }}
                      onClick={() => toggleExpand(config.id)}
                    >
                      <ChevronRightIcon rotated={isExpanded} />
                    </td>

                    {/* Checkbox */}
                    <td style={{ padding: '0 0 0 9px', verticalAlign: 'middle' }}>
                      <Checkbox checked={isSelected} onChange={() => toggleRow(config.id)} />
                    </td>

                    {/* Thumbnail */}
                    <td style={{ padding: 0, verticalAlign: 'middle' }}>
                      <Thumbnail src={config.thumbnail} alt={config.name} />
                    </td>

                    {/* Name */}
                    <td style={{ width: colWidths.name, minWidth: colWidths.name, padding: '0 16px', verticalAlign: 'middle', overflow: 'hidden' }}>
                      <span
                        style={{
                          ...BODY2, color: '#473bab',
                          cursor: 'pointer',
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {config.name}
                      </span>
                    </td>

                    {/* Dimensions */}
                    <td style={{ width: colWidths.dimensions, minWidth: colWidths.dimensions, padding: '0 16px', verticalAlign: 'middle' }}>
                      <span style={{ ...BODY2, color: '#1f1d25' }}>{config.dimensions}</span>
                    </td>

                    {/* Generated Image — Main chip or Make Main hover zone */}
                    <td style={{ width: colWidths.generatedImage, minWidth: colWidths.generatedImage, padding: '0 4px 0 16px', verticalAlign: 'middle', position: 'relative' }}>
                      <GeneratedImageCell
                        isMain={isMain}
                        onMakeMain={() => {
                          setMainId(config.id);
                          setMainGeneratedImage(vin, config.coverImage ?? config.thumbnail ?? '', config.id);
                          emitSnackbar('Generated image updated successfully');
                        }}
                      />
                    </td>

                    {/* Filters applied */}
                    <td style={{ width: colWidths.filters, minWidth: colWidths.filters, padding: '0 16px', verticalAlign: 'middle' }}>
                      <div
                        style={{
                          display: 'flex', flexWrap: 'wrap',
                          gap: 8, alignItems: 'center',
                          padding: '4px 0',
                        }}
                      >
                        {config.filters.length > 0
                          ? config.filters.map((f, i) => <FilterChip key={i} label={f} />)
                          : <span style={{ ...CAPTION, color: 'rgba(17,16,20,0.38)' }}>—</span>
                        }
                      </div>
                    </td>

                    {/* Image Type */}
                    <td style={{ width: colWidths.imageType, minWidth: colWidths.imageType, padding: '0 16px', verticalAlign: 'middle', overflow: 'hidden' }}>
                      <span
                        style={{
                          ...BODY2, color: '#1f1d25',
                          display: 'block',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}
                      >
                        {config.imageType}
                      </span>
                    </td>

                    {/* Last Update */}
                    <td style={{ width: colWidths.lastUpdate, minWidth: colWidths.lastUpdate, padding: '0 16px', verticalAlign: 'middle', overflow: 'hidden' }}>
                      <span
                        style={{
                          ...BODY2, color: '#1f1d25',
                          display: 'block',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}
                      >
                        {relativeDate(config.lastUpdate)}
                      </span>
                    </td>
                  </tr>

                  {/* Generated Images drawer — animated accordion, always in DOM */}
                  <tr className="border-b border-[rgba(0,0,0,0.12)]">
                    <td
                      colSpan={9}
                      className="p-0"
                      style={{ overflow: 'clip' } as React.CSSProperties}
                    >
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateRows: isExpanded ? '1fr' : '0fr',
                          transition: 'grid-template-rows 450ms ease-in-out',
                          overflow: 'clip',
                        } as React.CSSProperties}
                      >
                        <div style={{ overflow: 'hidden', minWidth: 0 }}>
                          <SourceImagesDrawer
                            mode="generated"
                            containerWidth={containerWidth}
                            record={{
                              id:         config.id,
                              thumbnail:  config.thumbnail ?? '',
                              imageCount: 1,
                              name:       config.name,
                              format:     'JPG',
                              dimensions: config.dimensions,
                              status:     'Active',
                              tags:       [],
                              source:     'Manual',
                              date:       config.lastUpdate,
                              angleGroups: config.angleGroups,
                            } as SourceImageRecord}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
