// ─── VinsAppliedTab ───────────────────────────────────────────────────────────
// Two-column layout (50/50, gap 24px):
//   Left  — Added by filtering: AdvancedFilters box + VIN list
//   Right — Added manually:     ADD VINs button + VIN list
//
// Cascading filters: Year → Make → Model → Trim → Color (uses existing VIN_DATA)
// All fields are multi-select with chips + checkboxes (matches Figma Autocomplete 2.0)
// Multiple filter rows: union of results, deduplicated

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, ChevronDown } from 'lucide-react';
import { getVinField, filterVins } from '../../../data/inventory/vins';
import type { VinFilters, VinRecord } from '../../../data/inventory/types';
import { VEHICLE_INVENTORY } from '../../../data/inventory/vehicleInventory';
import { cn } from '../../../lib/utils';

// ─── VIN → thumbnail lookup (sourced directly from VEHICLE_INVENTORY) ────────
// Using the real inventory as the single source of truth means this tab always
// shows the correct image for every VIN — jellybean PNGs, AI-generated angles,
// or static thumbnails — without any manual mapping to maintain.
const VIN_THUMBNAILS: Record<string, string> = Object.fromEntries(
  VEHICLE_INVENTORY.map(r => [r.vin, r.thumbnail]),
);

// ─── Shared styles ────────────────────────────────────────────────────────────
const LABEL =
  "font-['Roboto',sans-serif] font-normal text-[11px] leading-[1.66] tracking-[0.4px] text-[#686576]";

// ─── MultiSelectField ─────────────────────────────────────────────────────────
// Figma Autocomplete 2.0 — Type: Tags, Checkboxes: true
//
// Design rules:
// • Fixed 36px input height — never grows, single chip row, max 2 visible + "+N"
// • Dropdown rendered via createPortal at position: fixed → escapes overflow-hidden parents
// • All fields in FilterRow share equal column width (CSS grid) → consistent vertical alignment
// • Disabled state when upstream has no selection
interface MultiSelectFieldProps {
  label: string;
  required?: boolean;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

function MultiSelectField({
  label,
  required,
  options,
  selected,
  onChange,
  disabled = false,
  placeholder = 'All',
}: MultiSelectFieldProps) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');
  const triggerRef          = useRef<HTMLDivElement>(null);
  const [pos, setPos]       = useState({ top: 0, left: 0, width: 0 });

  // Compute dropdown position from trigger's bounding rect
  const openDropdown = () => {
    if (disabled) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    setOpen(true);
  };

  const closeDropdown = () => { setOpen(false); setSearch(''); };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!triggerRef.current?.contains(target)) closeDropdown();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Reposition on scroll/resize
  useEffect(() => {
    if (!open) return;
    const update = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    };
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => { window.removeEventListener('scroll', update, true); window.removeEventListener('resize', update); };
  }, [open]);

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value]);
  };
  const clearAll    = (e: React.MouseEvent) => { e.stopPropagation(); onChange([]); };
  const removeChip  = (value: string, e: React.MouseEvent) => { e.stopPropagation(); onChange(selected.filter(v => v !== value)); };

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col gap-[3px] min-w-0">
      {/* Label */}
      <label className={LABEL}>
        {required && <span className="text-[#d2323f] mr-[1px]">*</span>}
        {label}
      </label>

      {/* ── Trigger — grows when chips wrap to second row ── */}
      <div
        ref={triggerRef}
        onClick={() => open ? closeDropdown() : openDropdown()}
        className={cn(
          'min-h-[36px] flex items-start gap-[4px] px-[8px] py-[6px]',
          'bg-[#f9fafa] border rounded-[4px] transition-colors select-none',
          open     ? 'border-[#6356e1] ring-[1px] ring-[#6356e1]/20' : 'border-[#cac9cf]',
          disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-[#9b95d6]',
        )}
      >
        {/* Chips area — wraps to second row when needed */}
        <div className="flex flex-wrap items-center gap-[3px] flex-1 min-w-0">
          {selected.length === 0 ? (
            <span className="text-[12px] font-['Roboto'] text-[rgba(17,16,20,0.35)] whitespace-nowrap h-[24px] flex items-center">
              {placeholder}
            </span>
          ) : (
            <>
              {/* First two chips — gray bg, radius 8, no stroke */}
              {selected.slice(0, 2).map(v => (
                <span
                  key={v}
                  className="inline-flex items-center gap-[2px] h-[24px] px-[6px] rounded-[8px] bg-[#F0F2F4] text-[11px] font-['Roboto'] text-[#1f1d25] shrink-0"
                >
                  <span className="truncate leading-none max-w-[80px]">{v}</span>
                  <button
                    onMouseDown={e => removeChip(v, e)}
                    className="shrink-0 flex items-center justify-center w-[12px] h-[12px] rounded-sm hover:bg-black/10 transition-colors cursor-pointer ml-[1px]"
                  >
                    <X size={8} strokeWidth={2} className="text-[rgba(17,16,20,0.5)]" />
                  </button>
                </span>
              ))}
              {/* Plain text counter — no chip styling */}
              {selected.length > 2 && (
                <span className="text-[12px] font-['Roboto'] text-[#1f1d25] whitespace-nowrap h-[24px] flex items-center">
                  +{selected.length - 2}
                </span>
              )}
            </>
          )}
        </div>

        {/* Right controls — anchored to top */}
        <div className="flex items-center gap-[1px] shrink-0 self-start mt-[1px]">
          {selected.length > 0 && (
            <button
              onMouseDown={clearAll}
              className="p-[2px] rounded text-[rgba(17,16,20,0.35)] hover:text-[#d2323f] hover:bg-[rgba(210,50,63,0.06)] transition-colors cursor-pointer"
            >
              <X size={11} strokeWidth={2} />
            </button>
          )}
          <ChevronDown
            size={13}
            strokeWidth={1.8}
            className={cn(
              'text-[rgba(17,16,20,0.35)] transition-transform duration-150 ml-[1px]',
              open && 'rotate-180',
            )}
          />
        </div>
      </div>

      {/* ── Dropdown — rendered via portal to escape overflow-hidden ── */}
      {open && !disabled && createPortal(
        <div
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
          className="bg-white border border-[#cac9cf] rounded-[8px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] overflow-hidden"
          onMouseDown={e => e.stopPropagation()}
        >
          {/* Search box — shown when > 5 options */}
          {options.length > 5 && (
            <div className="px-[10px] py-[7px] border-b border-[rgba(0,0,0,0.06)] bg-[#fafafa]">
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full text-[12px] font-['Roboto'] outline-none bg-transparent text-[#1f1d25] placeholder:text-[rgba(17,16,20,0.35)]"
              />
            </div>
          )}

          {/* Option list */}
          <div className="max-h-[220px] overflow-y-auto py-[4px]">
            {filtered.length === 0 ? (
              <div className="px-[12px] py-[10px] text-[12px] font-['Roboto'] text-[rgba(17,16,20,0.38)] text-center">
                No results
              </div>
            ) : (
              <>
                {/* ALL option — always at top, not filtered by search */}
                {!search && (() => {
                  const allSelected   = options.length > 0 && selected.length === options.length;
                  const someSelected  = selected.length > 0 && !allSelected;
                  return (
                    <div
                      onMouseDown={e => {
                        e.preventDefault();
                        onChange(allSelected ? [] : options);
                      }}
                      className={cn(
                        'flex items-center gap-[8px] px-[12px] py-[7px] cursor-pointer transition-colors border-b border-[rgba(0,0,0,0.06)] mb-[2px]',
                        allSelected ? 'bg-[#473bab]/5' : 'hover:bg-[rgba(17,16,20,0.03)]',
                      )}
                    >
                      <div className={cn(
                        'shrink-0 w-[14px] h-[14px] rounded-[3px] border-[1.5px] flex items-center justify-center transition-colors',
                        allSelected ? 'bg-[#473bab] border-[#473bab]' : someSelected ? 'bg-[#473bab]/20 border-[#473bab]/60' : 'bg-white border-[#c5c3d0]',
                      )}>
                        {allSelected && (
                          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                            <path d="M1 3.5L3.2 5.8L8 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                        {someSelected && (
                          <svg width="8" height="2" viewBox="0 0 8 2" fill="none">
                            <path d="M1 1H7" stroke="#473bab" strokeWidth="1.8" strokeLinecap="round" />
                          </svg>
                        )}
                      </div>
                      <span className={cn(
                        'text-[12px] font-[\'Roboto\'] leading-none',
                        (allSelected || someSelected) ? 'text-[#473bab] font-medium' : 'text-[#1f1d25]',
                      )}>
                        ALL
                      </span>
                    </div>
                  );
                })()}
                {filtered.map(opt => {
                  const checked = selected.includes(opt);
                  return (
                    <div
                      key={opt}
                      onMouseDown={e => { e.preventDefault(); toggle(opt); }}
                      className={cn(
                        'flex items-center gap-[8px] px-[12px] py-[7px] cursor-pointer transition-colors',
                        checked ? 'bg-[#473bab]/5' : 'hover:bg-[rgba(17,16,20,0.03)]',
                      )}
                    >
                      <div className={cn(
                        'shrink-0 w-[14px] h-[14px] rounded-[3px] border-[1.5px] flex items-center justify-center transition-colors',
                        checked ? 'bg-[#473bab] border-[#473bab]' : 'bg-white border-[#c5c3d0]',
                      )}>
                        {checked && (
                          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                            <path d="M1 3.5L3.2 5.8L8 1" stroke="white" strokeWidth="1.6"
                              strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span className={cn(
                        'text-[12px] font-[\'Roboto\'] leading-none',
                        checked ? 'text-[#473bab] font-medium' : 'text-[#1f1d25]',
                      )}>
                        {opt}
                      </span>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

// ─── FilterGroup state ────────────────────────────────────────────────────────
// Uses multi-value arrays exclusively in the UI; legacy single fields untouched.
interface FilterGroup {
  id: string;
  filters: VinFilters;
}

let _uid = 0;
const uid = () => `fg-${++_uid}`;

// ── Helpers to read/write multi-value fields ──────────────────────────────────
const getYears  = (f: VinFilters): string[] => (f.years  ?? []).map(String);
const getMakes  = (f: VinFilters): string[] => f.makes  ?? [];
const getModels = (f: VinFilters): string[] => f.models ?? [];
const getTrims  = (f: VinFilters): string[] => f.trims  ?? [];
const getColors = (f: VinFilters): string[] => f.colors ?? [];

// ─── VehicleThumb ─────────────────────────────────────────────────────────────
function VehicleThumb({ vin }: { vin?: string }) {
  const img = vin ? VIN_THUMBNAILS[vin] : undefined;
  if (!img) return <div className="w-[48px] h-[36px] shrink-0" />;
  return (
    <div className="w-[48px] h-[36px] rounded-[4px] bg-[#f3f3f5] border border-[rgba(0,0,0,0.08)] shrink-0 overflow-hidden flex items-center justify-center">
      <img src={img} alt="" className="w-full h-full object-contain" />
    </div>
  );
}

// ─── VIN table row ────────────────────────────────────────────────────────────
function VinRow({
  record,
  checked,
  onToggle,
}: {
  record: VinRecord;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="flex items-center gap-[8px] px-[12px] py-[8px] border-b border-[rgba(0,0,0,0.06)] last:border-0 hover:bg-[rgba(17,16,20,0.02)] cursor-pointer"
      onClick={onToggle}
    >
      {/* Checkbox */}
      <div
        className={cn(
          'shrink-0 w-[16px] h-[16px] rounded-[3px] border flex items-center justify-center transition-colors',
          checked
            ? 'bg-[#473bab] border-[#473bab]'
            : 'bg-white border-[#cac9cf] hover:border-[#473bab]',
        )}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 5L3.8 7.5L8.5 2.5" stroke="white" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Thumbnail */}
      <VehicleThumb vin={record.vin} />

      {/* VIN */}
      <span
        className="font-['Roboto',sans-serif] font-normal text-[11px] tracking-[0.4px] text-[#1f1d25] whitespace-nowrap overflow-hidden text-ellipsis"
        style={{ width: 148 }}
        title={record.vin}
      >
        {record.vin}
      </span>

      {/* Year */}
      <span className="font-['Roboto',sans-serif] font-normal text-[11px] tracking-[0.4px] text-[#686576] shrink-0 w-[40px]">
        {record.year}
      </span>

      {/* Make */}
      <span className="font-['Roboto',sans-serif] font-normal text-[11px] tracking-[0.4px] text-[#686576] shrink-0 w-[56px] truncate">
        {record.make}
      </span>

      {/* Model */}
      <span className="font-['Roboto',sans-serif] font-normal text-[11px] tracking-[0.4px] text-[#686576] flex-1 truncate">
        {record.model}
      </span>

      {/* Trim */}
      <span className="font-['Roboto',sans-serif] font-normal text-[11px] tracking-[0.4px] text-[#686576] shrink-0 w-[80px] truncate hidden xl:block">
        {record.trim}
      </span>

      {/* Color */}
      <span className="font-['Roboto',sans-serif] font-normal text-[11px] tracking-[0.4px] text-[#686576] shrink-0 w-[80px] truncate hidden xl:block">
        {record.color}
      </span>
    </div>
  );
}

// ─── VIN table header ─────────────────────────────────────────────────────────
function VinTableHeader() {
  return (
    <div className="flex items-center gap-[8px] px-[12px] py-[6px] border-b border-[rgba(0,0,0,0.08)] bg-[#f9fafa] shrink-0">
      <div className="w-[16px] shrink-0" />
      <div className="w-[48px] shrink-0" />
      <span className={cn(LABEL, 'font-medium')} style={{ width: 148 }}>VIN</span>
      <span className={cn(LABEL, 'font-medium w-[40px] shrink-0')}>Year</span>
      <span className={cn(LABEL, 'font-medium w-[56px] shrink-0')}>Make</span>
      <span className={cn(LABEL, 'font-medium flex-1')}>Model</span>
      <span className={cn(LABEL, 'font-medium w-[80px] shrink-0 hidden xl:block')}>Trim</span>
      <span className={cn(LABEL, 'font-medium w-[80px] shrink-0 hidden xl:block')}>Color</span>
    </div>
  );
}

// ─── Single filter row ────────────────────────────────────────────────────────
// All 5 fields are multi-select with cascading:
//   years → makes → models → trims → colors
// When an upstream field changes, downstream selections that no longer exist
// in the matching set are automatically pruned.
function FilterRow({
  group,
  onChange,
  onRemove,
  showRemove,
}: {
  group: FilterGroup;
  onChange: (id: string, filters: VinFilters) => void;
  onRemove: (id: string) => void;
  showRemove: boolean;
}) {
  const f = group.filters;

  const selectedYears  = getYears(f);
  const selectedMakes  = getMakes(f);
  const selectedModels = getModels(f);
  const selectedTrims  = getTrims(f);
  const selectedColors = getColors(f);

  // ── Available options (cascading) ──────────────────────────────────────────
  // Each level only shows values that exist in VINs matching upstream selections.
  const availableYears  = getVinField('year',  {});
  const availableMakes  = getVinField('make',  { years: selectedYears.length ? selectedYears : undefined });
  const availableModels = getVinField('model', {
    years: selectedYears.length ? selectedYears : undefined,
    makes: selectedMakes.length ? selectedMakes : undefined,
  });
  const availableTrims  = getVinField('trim', {
    years:  selectedYears.length  ? selectedYears  : undefined,
    makes:  selectedMakes.length  ? selectedMakes  : undefined,
    models: selectedModels.length ? selectedModels : undefined,
  });
  const availableColors = getVinField('color', {
    years:  selectedYears.length  ? selectedYears  : undefined,
    makes:  selectedMakes.length  ? selectedMakes  : undefined,
    models: selectedModels.length ? selectedModels : undefined,
    trims:  selectedTrims.length  ? selectedTrims  : undefined,
  });

  // ── Change handlers with downstream pruning ────────────────────────────────
  const setYears = (next: string[]) => {
    // Recompute available makes for the new year selection
    const newMakes  = getVinField('make',  { years: next.length ? next : undefined });
    const prunedMakes  = selectedMakes.filter(v => newMakes.includes(v));
    const newModels = getVinField('model', {
      years: next.length ? next : undefined,
      makes: prunedMakes.length ? prunedMakes : undefined,
    });
    const prunedModels = selectedModels.filter(v => newModels.includes(v));
    const newTrims  = getVinField('trim', {
      years:  next.length         ? next          : undefined,
      makes:  prunedMakes.length  ? prunedMakes   : undefined,
      models: prunedModels.length ? prunedModels  : undefined,
    });
    const prunedTrims  = selectedTrims.filter(v => newTrims.includes(v));
    const newColors = getVinField('color', {
      years:  next.length         ? next          : undefined,
      makes:  prunedMakes.length  ? prunedMakes   : undefined,
      models: prunedModels.length ? prunedModels  : undefined,
      trims:  prunedTrims.length  ? prunedTrims   : undefined,
    });
    const prunedColors = selectedColors.filter(v => newColors.includes(v));
    onChange(group.id, {
      years:  next,
      makes:  prunedMakes,
      models: prunedModels,
      trims:  prunedTrims,
      colors: prunedColors,
    });
  };

  const setMakes = (next: string[]) => {
    const newModels = getVinField('model', {
      years: selectedYears.length ? selectedYears : undefined,
      makes: next.length ? next : undefined,
    });
    const prunedModels = selectedModels.filter(v => newModels.includes(v));
    const newTrims  = getVinField('trim', {
      years:  selectedYears.length  ? selectedYears  : undefined,
      makes:  next.length           ? next            : undefined,
      models: prunedModels.length   ? prunedModels    : undefined,
    });
    const prunedTrims  = selectedTrims.filter(v => newTrims.includes(v));
    const newColors = getVinField('color', {
      years:  selectedYears.length  ? selectedYears  : undefined,
      makes:  next.length           ? next            : undefined,
      models: prunedModels.length   ? prunedModels    : undefined,
      trims:  prunedTrims.length    ? prunedTrims     : undefined,
    });
    const prunedColors = selectedColors.filter(v => newColors.includes(v));
    onChange(group.id, { years: selectedYears, makes: next, models: prunedModels, trims: prunedTrims, colors: prunedColors });
  };

  const setModels = (next: string[]) => {
    const newTrims = getVinField('trim', {
      years:  selectedYears.length ? selectedYears : undefined,
      makes:  selectedMakes.length ? selectedMakes : undefined,
      models: next.length ? next : undefined,
    });
    const prunedTrims  = selectedTrims.filter(v => newTrims.includes(v));
    const newColors = getVinField('color', {
      years:  selectedYears.length ? selectedYears : undefined,
      makes:  selectedMakes.length ? selectedMakes : undefined,
      models: next.length          ? next           : undefined,
      trims:  prunedTrims.length   ? prunedTrims    : undefined,
    });
    const prunedColors = selectedColors.filter(v => newColors.includes(v));
    onChange(group.id, { years: selectedYears, makes: selectedMakes, models: next, trims: prunedTrims, colors: prunedColors });
  };

  const setTrims = (next: string[]) => {
    const newColors = getVinField('color', {
      years:  selectedYears.length  ? selectedYears  : undefined,
      makes:  selectedMakes.length  ? selectedMakes  : undefined,
      models: selectedModels.length ? selectedModels : undefined,
      trims:  next.length           ? next            : undefined,
    });
    const prunedColors = selectedColors.filter(v => newColors.includes(v));
    onChange(group.id, { years: selectedYears, makes: selectedMakes, models: selectedModels, trims: next, colors: prunedColors });
  };

  const setColors = (next: string[]) => {
    onChange(group.id, { years: selectedYears, makes: selectedMakes, models: selectedModels, trims: selectedTrims, colors: next });
  };

  return (
    <div className="flex flex-col gap-[6px]">
      {/* Row 1 — Year (1.2fr) · Make (1fr) · Model (1.8fr) ≈ +20px Year, -20px Model */}
      <div className="grid grid-cols-[1.2fr_1fr_1.8fr] gap-[6px] items-start">
        <MultiSelectField
          label="Year" required
          options={availableYears}
          selected={selectedYears}
          onChange={setYears}
        />
        <MultiSelectField
          label="Make" required
          options={availableMakes}
          selected={selectedMakes}
          onChange={setMakes}
          disabled={selectedYears.length === 0}
        />
        <MultiSelectField
          label="Model" required
          options={availableModels}
          selected={selectedModels}
          onChange={setModels}
          disabled={selectedMakes.length === 0}
        />
      </div>

      {/* Row 2 — Trim (1fr) · Color (1fr) [+ Remove button] */}
      <div className={cn(
        'grid gap-[6px] items-start',
        showRemove ? 'grid-cols-[1fr_1fr_auto]' : 'grid-cols-2',
      )}>
        <MultiSelectField
          label="Trim" required
          options={availableTrims}
          selected={selectedTrims}
          onChange={setTrims}
          disabled={selectedModels.length === 0}
        />
        <MultiSelectField
          label="Color"
          options={availableColors}
          selected={selectedColors}
          onChange={setColors}
          disabled={selectedTrims.length === 0}
        />
        {showRemove && (
          <button
            onClick={() => onRemove(group.id)}
            className="mt-[18px] p-[6px] rounded-full text-[rgba(17,16,20,0.38)] hover:text-[#d2323f] hover:bg-[rgba(210,50,63,0.06)] transition-colors shrink-0 self-start cursor-pointer"
            title="Remove filter row"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── AdvancedFilters box ──────────────────────────────────────────────────────
function AdvancedFilters({
  groups,
  onChange,
  onRemove,
  onAdd,
  onRemoveAll,
}: {
  groups: FilterGroup[];
  onChange: (id: string, filters: VinFilters) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  onRemoveAll: () => void;
}) {
  return (
    <div className="border border-[rgba(0,0,0,0.12)] rounded-[12px] overflow-hidden bg-white">
      <div className="flex flex-col gap-[12px] p-[12px]">
        {groups.map(g => (
          <FilterRow
            key={g.id}
            group={g}
            onChange={onChange}
            onRemove={onRemove}
            showRemove={groups.length > 1}
          />
        ))}
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between px-[12px] py-[8px] border-t border-[rgba(0,0,0,0.08)] bg-[#f9fafa]">
        <button
          onClick={onAdd}
          className="flex items-center gap-[4px] text-[12px] font-['Roboto'] font-medium text-[#473bab] hover:text-[#3c3192] transition-colors cursor-pointer"
        >
          <Plus size={14} />
          Add Filter
        </button>
        <button
          onClick={onRemoveAll}
          className="text-[11px] font-['Roboto'] text-[rgba(17,16,20,0.38)] hover:text-[#d2323f] transition-colors cursor-pointer"
        >
          Remove all
        </button>
      </div>
    </div>
  );
}

// ─── Column section header ────────────────────────────────────────────────────
function SectionHeader({
  label,
  count,
  action,
}: {
  label: string;
  count: number;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-[8px] mb-[12px]">
      <span className="font-['Roboto',sans-serif] font-medium text-[13px] tracking-[0.1px] text-[#1f1d25]">
        {label}
      </span>
      {count > 0 && (
        <span className="inline-flex items-center h-[20px] px-[7px] rounded-full bg-[#473bab]/10 font-['Roboto',sans-serif] font-medium text-[11px] tracking-[0.4px] text-[#473bab]">
          {count}
        </span>
      )}
      <div className="flex-1" />
      {action}
    </div>
  );
}

// ─── VIN list empty state ─────────────────────────────────────────────────────
function ListEmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-[40px] gap-[8px]">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="6" width="18" height="14" rx="2"
          stroke="rgba(17,16,20,0.20)" strokeWidth="1.5" />
        <path d="M3 10h18M8 6V4M16 6V4"
          stroke="rgba(17,16,20,0.20)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <p className="font-['Roboto',sans-serif] font-normal text-[12px] text-[rgba(17,16,20,0.38)] text-center">
        {message}
      </p>
    </div>
  );
}

// ─── VinsAppliedTab ───────────────────────────────────────────────────────────

interface VinsAppliedTabProps {
  /** Called whenever the total number of checked VINs changes (filter + manual) */
  onSelectionChange?: (count: number) => void;
  /** Called whenever the number of VINs matched by active filters changes */
  onFilteredCountChange?: (count: number) => void;
  /** Pre-filled filter groups for round-trip editing */
  initialFilterGroups?: Array<{ filters: VinFilters }>;
  /** Called whenever filter groups change (for save/restore) */
  onFilterGroupsChange?: (groups: Array<{ filters: VinFilters }>) => void;
}

export function VinsAppliedTab({
  onSelectionChange,
  onFilteredCountChange,
  initialFilterGroups,
  onFilterGroupsChange,
}: VinsAppliedTabProps = {}) {
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>(() =>
    initialFilterGroups?.length
      ? initialFilterGroups.map(fg => ({ id: uid(), filters: fg.filters }))
      : [{ id: uid(), filters: {} }],
  );
  const [checkedByFilter, setCheckedByFilter] = useState<Set<string>>(new Set());
  const [manualVins]                          = useState<VinRecord[]>([]);
  const [checkedManual, setCheckedManual]     = useState<Set<string>>(new Set());

  // ── Bubble selection count to parent ──
  useEffect(() => {
    onSelectionChange?.(checkedByFilter.size + checkedManual.size);
  }, [checkedByFilter.size, checkedManual.size, onSelectionChange]);

  // ── Computed filtered VINs (union of all groups, deduped) ──
  const filteredVins = useMemo(() => {
    const seen = new Set<string>();
    const result: VinRecord[] = [];
    for (const g of filterGroups) {
      const f = g.filters;
      const hasAny = !!(
        f.years?.length || f.makes?.length || f.models?.length || f.trims?.length || f.colors?.length ||
        f.year || f.make || f.model || f.trim || f.color
      );
      if (!hasAny) continue;
      for (const v of filterVins(f)) {
        if (!seen.has(v.vin)) { seen.add(v.vin); result.push(v); }
      }
    }
    return result;
  }, [filterGroups]);

  const hasAnyFilter = filterGroups.some(g => {
    const f = g.filters;
    return !!(f.years?.length || f.makes?.length || f.models?.length || f.trims?.length || f.colors?.length ||
              f.year || f.make || f.model || f.trim || f.color);
  });

  // ── Bubble filtered VINs count to parent (fires whenever filters produce results) ──
  useEffect(() => {
    onFilteredCountChange?.(hasAnyFilter ? filteredVins.length : 0);
  }, [filteredVins.length, hasAnyFilter, onFilteredCountChange]);

  // ── Bubble filter groups to parent for save/restore ──
  useEffect(() => {
    onFilterGroupsChange?.(filterGroups.map(g => ({ filters: g.filters })));
  }, [filterGroups, onFilterGroupsChange]);

  // ── Filter group handlers ──
  const handleGroupChange = (id: string, filters: VinFilters) => {
    setFilterGroups(prev => prev.map(g => g.id === id ? { ...g, filters } : g));
    // If filters changed, reset checked state for this group's previously matched VINs
    setCheckedByFilter(new Set());
  };

  const handleGroupRemove = (id: string) => {
    setFilterGroups(prev => prev.filter(g => g.id !== id));
    setCheckedByFilter(new Set());
  };

  const handleAddGroup = () => {
    setFilterGroups(prev => [...prev, { id: uid(), filters: {} }]);
  };

  const handleRemoveAll = () => {
    setFilterGroups([{ id: uid(), filters: {} }]);
    setCheckedByFilter(new Set());
  };

  // ── Checkbox toggles ──
  const toggleFilterVin = (vin: string) => {
    setCheckedByFilter(prev => {
      const next = new Set(prev);
      next.has(vin) ? next.delete(vin) : next.add(vin);
      return next;
    });
  };

  const toggleManualVin = (vin: string) => {
    setCheckedManual(prev => {
      const next = new Set(prev);
      next.has(vin) ? next.delete(vin) : next.add(vin);
      return next;
    });
  };

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ padding: '16px 24px' }}
    >
      <div className="flex gap-[24px] items-start h-full">

        {/* ── Left column — Added by filtering ── */}
        <div className="flex-1 min-w-0 flex flex-col">
          <SectionHeader
            label="Added by filtering"
            count={hasAnyFilter ? filteredVins.length : 0}
            action={
              <button
                onClick={handleAddGroup}
                className="flex items-center gap-[4px] h-[28px] px-[10px] border border-[#473bab] rounded-[100px] text-[11px] font-['Roboto'] font-medium text-[#473bab] hover:bg-[#473bab]/5 transition-colors cursor-pointer shrink-0"
              >
                <Plus size={12} />
                Add Filter
              </button>
            }
          />

          {/* Advanced Filters box */}
          <div className="mb-[12px]">
            <AdvancedFilters
              groups={filterGroups}
              onChange={handleGroupChange}
              onRemove={handleGroupRemove}
              onAdd={handleAddGroup}
              onRemoveAll={handleRemoveAll}
            />
          </div>

          {/* VIN list */}
          <div className="border border-[rgba(0,0,0,0.12)] rounded-[12px] overflow-hidden bg-white flex flex-col">
            {!hasAnyFilter ? (
              <ListEmptyState message="Set filters above to find matching VINs" />
            ) : filteredVins.length === 0 ? (
              <ListEmptyState message="No VINs match the selected filters" />
            ) : (
              <>
                <VinTableHeader />
                <div className="overflow-y-auto" style={{ maxHeight: 360 }}>
                  {filteredVins.map(v => (
                    <VinRow
                      key={v.vin}
                      record={v}
                      checked={checkedByFilter.has(v.vin)}
                      onToggle={() => toggleFilterVin(v.vin)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Right column — Added manually ── */}
        <div className="flex-1 min-w-0 flex flex-col">
          <SectionHeader
            label="Added manually"
            count={manualVins.length}
            action={
              <button
                className="flex items-center gap-[4px] h-[28px] px-[10px] border border-[#473bab] rounded-[100px] text-[11px] font-['Roboto'] font-medium text-[#473bab] hover:bg-[#473bab]/5 transition-colors cursor-pointer shrink-0"
              >
                <Plus size={12} />
                Add VINs
              </button>
            }
          />

          {/* VIN list */}
          <div className="border border-[rgba(0,0,0,0.12)] rounded-[12px] overflow-hidden bg-white flex flex-col">
            {manualVins.length === 0 ? (
              <ListEmptyState message="No VINs added manually yet" />
            ) : (
              <>
                <VinTableHeader />
                <div className="overflow-y-auto" style={{ maxHeight: 360 }}>
                  {manualVins.map(v => (
                    <VinRow
                      key={v.vin}
                      record={v}
                      checked={checkedManual.has(v.vin)}
                      onToggle={() => toggleManualVin(v.vin)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
