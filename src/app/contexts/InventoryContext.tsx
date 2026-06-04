/**
 * InventoryContext
 *
 * Single source of truth for the vehicle inventory list.
 * Merges the static VEHICLE_INVENTORY seed with user-applied config overrides
 * that survive page refreshes via localStorage.
 *
 * Key concepts
 * ─────────────
 * • The base data (VEHICLE_INVENTORY) is never mutated — overrides are stored
 *   separately as a sparse map keyed by raw VIN string.
 * • applyConfig: resolves which VINs match the config's filterGroups, then
 *   stamps each with aiConfigId + vehicleGroup. Persists to localStorage.
 * • removeConfig: strips the override from every VIN that carries the given
 *   configId. Persists to localStorage.
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { VEHICLE_INVENTORY, type VinInventoryRecord } from '../../data/inventory/vehicleInventory';
import { filterVins } from '../../data/inventory/vins';
import { STORAGE_KEYS } from '../constants/storageKeys';
import type { VehicleGroup, VinFilters } from '../../data/inventory/types';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Override that explicitly clears a VIN — strips any static vehicleGroup/aiConfigId. */
type ClearedOverride = { cleared: true };
/** Override that applies a config to a VIN. */
type AppliedOverride = { cleared?: false; aiConfigId: string; vehicleGroup: VehicleGroup };
type VinConfigOverride = ClearedOverride | AppliedOverride;

/** Sparse map: VIN string → override. Only VINs with an applied/cleared config appear here. */
type OverridesMap = Record<string, VinConfigOverride>;

interface InventoryContextValue {
  /** Full vehicle list with any applied config overrides merged in. */
  vehicles: VinInventoryRecord[];
  /**
   * Apply a published AI config to every VIN that matches its filterGroups.
   * Only call when at least one angle has been generated (Option B enforcement
   * lives in the caller — NewGlobalAIConfigContent.handleSave).
   */
  applyConfig: (
    configId:     string,
    vehicleGroup: VehicleGroup,
    filterGroups: Array<{ filters: VinFilters }>,
  ) => void;
  /**
   * Remove an AI config from every VIN that currently carries it.
   * Triggered by the "Remove" action in GlobalAIConfigMenu.
   */
  removeConfig: (configId: string) => void;
  /**
   * Remove an AI config from a single VIN (by its internal record id, e.g. 'vin-04').
   * Useful for per-row "detach" actions.
   */
  removeConfigFromVin: (recordId: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const InventoryContext = createContext<InventoryContextValue | null>(null);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadOverrides(): OverridesMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INVENTORY_CONFIG_OVERRIDES);
    return raw ? (JSON.parse(raw) as OverridesMap) : {};
  } catch {
    return {};
  }
}

function saveOverrides(map: OverridesMap): void {
  try {
    localStorage.setItem(STORAGE_KEYS.INVENTORY_CONFIG_OVERRIDES, JSON.stringify(map));
  } catch {
    // Quota exceeded or private browsing — fail silently.
  }
}

function mergeVehicles(overrides: OverridesMap): VinInventoryRecord[] {
  return VEHICLE_INVENTORY.map(r => {
    const ov = overrides[r.vin];
    if (!ov) return r;
    // Explicitly cleared — strip the applied-config fields but keep the base-record
    // vehicleGroup (source cutouts) so the angle strip still shows the vehicle on a
    // plain background. VINs without a static vehicleGroup get undefined naturally.
    if (ov.cleared) {
      // Keep base record's aiConfigApplied and vehicleGroup intact — only strip the
      // config link. Static-seed VINs with aiConfigApplied:true keep their AI images
      // in the grid even after their linked gallery config is deleted.
      return { ...r, aiConfigId: undefined };
    }
    return {
      ...r,
      aiConfigApplied: true,
      aiGeneration:    'enabled' as const,
      aiConfigId:      ov.aiConfigId,
      vehicleGroup:    ov.vehicleGroup,
    };
  });
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [overrides, setOverrides] = useState<OverridesMap>(loadOverrides);

  const vehicles = useMemo(() => mergeVehicles(overrides), [overrides]);

  const applyConfig = useCallback((
    configId:     string,
    vehicleGroup: VehicleGroup,
    filterGroups: Array<{ filters: VinFilters }>,
  ) => {
    if (!filterGroups.length) return;

    // Resolve matching VINs across all filter groups (union, de-duped by vin)
    const matchedVins = new Set(
      filterGroups.flatMap(g => filterVins(g.filters).map(v => v.vin)),
    );
    if (!matchedVins.size) return;

    setOverrides(prev => {
      const next: OverridesMap = { ...prev };
      matchedVins.forEach(vin => {
        next[vin] = { aiConfigId: configId, vehicleGroup };
      });
      saveOverrides(next);
      return next;
    });
  }, []);

  const removeConfig = useCallback((configId: string) => {
    setOverrides(prev => {
      const next: OverridesMap = { ...prev };

      // 1. Remove (or clear) overrides that reference this configId
      for (const [vin, ov] of Object.entries(prev)) {
        if (!ov.cleared && ov.aiConfigId === configId) {
          // If the base static record also has a vehicleGroup, write a cleared
          // marker so the static vehicleGroup is also suppressed.
          const base = VEHICLE_INVENTORY.find(r => r.vin === vin);
          if (base?.vehicleGroup) {
            next[vin] = { cleared: true };
          } else {
            delete next[vin];
          }
        }
      }

      saveOverrides(next);
      return next;
    });
  }, []);

  const removeConfigFromVin = useCallback((recordId: string) => {
    const base = VEHICLE_INVENTORY.find(r => r.id === recordId);
    if (!base) return;
    setOverrides(prev => {
      const next = { ...prev };
      // Always write a "cleared" marker so even static vehicleGroups are suppressed.
      next[base.vin] = { cleared: true };
      saveOverrides(next);
      return next;
    });
  }, []);

  return (
    <InventoryContext.Provider value={{ vehicles, applyConfig, removeConfig, removeConfigFromVin }}>
      {children}
    </InventoryContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useInventory(): InventoryContextValue {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory must be used inside <InventoryProvider>');
  return ctx;
}
