// ─── VIN Data ────────────────────────────────────────────────────────────────
// Single source of truth for VIN filter options and VIN lookups.
//
// VIN_DATA is derived directly from VEHICLE_INVENTORY so that every filter
// dropdown in the Global AI Config → VINs Applied tab always reflects the
// actual inventory rows shown in the Data Grid — no divergence possible.

import { VinRecord, VinFilters } from './types';
import { VEHICLE_INVENTORY } from './vehicleInventory';

const VIN_DATA: VinRecord[] = VEHICLE_INVENTORY.map(r => ({
  vin:   r.vin,
  year:  r.year,
  make:  r.make,
  model: r.model,
  trim:  r.trim,
  color: r.exteriorColor,
}));

// ─── Internal filter engine ────────────────────────────────────────────────────

function applyFilters(data: VinRecord[], filters: VinFilters): VinRecord[] {
  return data.filter(r => {
    // ── Multi-value (arrays take precedence) ──────────────────────────────────
    if (filters.years?.length  && !filters.years.some(y => Number(y) === r.year))    return false;
    if (filters.makes?.length  && !filters.makes.includes(r.make))                   return false;
    if (filters.models?.length && !filters.models.includes(r.model))                 return false;
    if (filters.trims?.length  && !filters.trims.includes(r.trim))                   return false;
    if (filters.colors?.length && !filters.colors.includes(r.color))                 return false;
    // ── Legacy single-value fallback (only when no array provided) ────────────
    if (!filters.years?.length  && filters.year  && r.year  !== Number(filters.year)) return false;
    if (!filters.makes?.length  && filters.make  && r.make  !== filters.make)          return false;
    if (!filters.models?.length && filters.model && r.model !== filters.model)         return false;
    if (!filters.trims?.length  && filters.trim  && r.trim  !== filters.trim)          return false;
    if (!filters.colors?.length && filters.color && r.color !== filters.color)         return false;
    return true;
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getVinField(field: keyof Omit<VinRecord, 'vin'>, filters: VinFilters = {}): string[] {
  return [...new Set(applyFilters(VIN_DATA, filters).map(r => String(r[field])))].sort();
}

export function countVins(filters: VinFilters = {}): number {
  return applyFilters(VIN_DATA, filters).length;
}

export function filterVins(filters: VinFilters = {}): VinRecord[] {
  return applyFilters(VIN_DATA, filters);
}

export function findVin(vinStr: string): VinRecord | null {
  return VIN_DATA.find(r => r.vin === vinStr) ?? null;
}

export { VIN_DATA };
