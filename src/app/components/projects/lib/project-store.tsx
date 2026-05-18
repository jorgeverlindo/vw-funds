"use client";

import { createContext, useContext, useState } from "react";
import type { BackgroundCollection } from "@projects/logos-backgrounds/BackgroundCollectionCard";
import { matchesMultiLifestyle } from "@projects/lib/lifestyle-data";
import { templateLibrary } from "@projects/lib/mock-data";

// ─── DataRow ──────────────────────────────────────────────────────────────────
/** A single row in the Data task — acts as the pharma equivalent of an Offer. */
export type DataRow = {
  id: string;
  data: Record<string, string>;
};

function makeRowId(): string {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

interface ProjectStore {
  // Deleted offer IDs (session-only — resets on page reload)
  deletedOfferIds: Set<string>;
  deleteOffers: (ids: string[]) => void;
  restoreOffers: (ids: string[]) => void;

  // Dynamically added offer IDs per project (via Browse All Offers dialog)
  addedOfferIds: Record<string, string[]>;
  addOffers: (projectId: string, ids: string[]) => void;

  // Dynamically added template IDs per project (via Select Template dialog)
  addedTemplateIds: Record<string, string[]>;
  addTemplates: (projectId: string, ids: string[]) => void;

  // Data rows per project — pharma equivalent of offers
  dataRows: Record<string, DataRow[]>;
  addDataRow: (projectId: string) => string;
  updateDataRow: (projectId: string, rowId: string, key: string, value: string) => void;
  removeDataRow: (projectId: string, rowId: string) => void;

  // Active brand kit per project+make: { projectId: { make: kitId } }
  activeBrandKitIds: Record<string, Record<string, string>>;
  setActiveBrandKit: (projectId: string, make: string, kitId: string) => void;

  // Active logo per project+make+slotType: { projectId: { make: { slotType: logoId } } }
  activeLogoIds: Record<string, Record<string, Record<string, string>>>;
  setActiveLogoId: (projectId: string, make: string, slotType: string, logoId: string) => void;

  // Active brand colors per project+make: { projectId: { make: [textColor, btnColor] } }
  // Index 0 = text color, index 1 = button background color (foreground is always white)
  activeColors: Record<string, Record<string, [string, string]>>;
  setActiveColor: (projectId: string, make: string, index: 0 | 1, color: string) => void;

  // UI state — persisted across navigation
  fineTune: boolean;
  setFineTune: (v: boolean) => void;
  groupBy: string;
  setGroupBy: (v: string) => void;
  offerOpen: Record<string, boolean>;
  setOfferOpen: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
  templateOpen: Record<string, boolean>;
  setTemplateOpen: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
  bgOpen: Record<string, boolean>;
  setBgOpen: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
  combinations: { id: string; offerIds: string[] }[];
  addCombination: () => void;
  removeCombination: (combinationId: string) => void;
  setCombinationOfferAtSlot: (combinationId: string, slotIndex: number, offerId: string) => void;
  /** Re-evaluate multi-vehicle lifestyle backgrounds for a combo after a slot change.
   *  Call this right after setCombinationOfferAtSlot, passing the same args plus offer/template context. */
  reEvaluateMultiLifestyleForCombo: (
    combinationId: string,
    slotIndex: number,
    newOfferId: string,
    allOffers: Array<{ id: string; model: string; trim: string }>,
    multiTemplateIds: string[],
    slotCount: number
  ) => void;

  backgrounds: BackgroundCollection[];
  addBackgrounds: (collections: BackgroundCollection[]) => void;
  removeBackground: (id: string) => void;
  clearBackgrounds: () => void;

  // Simple view: per-template exclusions (applies to all offers)
  excludeBackgroundFromTemplate: (templateId: string, bgId: string) => void;
  getBackgroundsForTemplate: (templateId: string) => BackgroundCollection[];

  // Fine Tuning: per-offer+template exclusions (scoped to a single offer)
  excludeBackgroundFromOfferTemplate: (offerId: string, templateId: string, bgId: string) => void;
  includeBackgroundForOfferTemplate: (offerId: string, templateId: string, bgId: string) => void;
  getBackgroundsForOfferTemplate: (offerId: string, templateId: string) => BackgroundCollection[];

  // Remove a background from ALL exclusion entries (global re-add)
  clearExclusionsForBackground: (bgIds: string[]) => void;

  // AI-optimized results keyed by "offerId_templateId_bgId"
  aiResults: Map<string, string>;
  setAiResult: (key: string, dataUrl: string) => void;
  clearAiResult: (key: string) => void;

  // Per-offer logo overrides: projectId → offerId → make → { slotType: logoId }
  offerLogoIds: Record<string, Record<string, Record<string, Record<string, string>>>>;
  setOfferLogoId: (projectId: string, offerId: string, make: string, slotType: string, logoId: string) => void;

  // Per-offer color overrides: projectId → offerId → make → [textColor, btnColor]
  offerColors: Record<string, Record<string, Record<string, [string, string]>>>;
  setOfferColor: (projectId: string, offerId: string, make: string, index: 0 | 1, color: string) => void;
  clearOfferColorOverrides: (projectId: string, offerId: string, make: string) => void;

  // Clears all logo overrides for a given offer+make (reverts to brand-kit default)
  clearOfferLogoOverrides: (projectId: string, offerId: string, make: string) => void;

  // Per-offer+template logo overrides: projectId → "offerId::templateId" → make → { slotType: logoId }
  offerTemplateLogoIds: Record<string, Record<string, Record<string, Record<string, string>>>>;
  setOfferTemplateLogoId: (projectId: string, offerId: string, templateId: string, make: string, slotType: string, logoId: string) => void;
  // Clears all logo overrides for a given offer+template+make
  clearOfferTemplateLogoOverrides: (projectId: string, offerId: string, templateId: string, make: string) => void;

  // Per-offer+template color overrides: projectId → "offerId::templateId" → make → [textColor, btnColor]
  offerTemplateColors: Record<string, Record<string, Record<string, [string, string]>>>;
  setOfferTemplateColor: (projectId: string, offerId: string, templateId: string, make: string, index: 0 | 1, color: string) => void;
  clearOfferTemplateColorOverrides: (projectId: string, offerId: string, templateId: string, make: string) => void;

  // Per-template logo overrides: projectId → templateId → make → { slotType: logoId }
  templateLogoIds: Record<string, Record<string, Record<string, Record<string, string>>>>;
  setTemplateLogoId: (projectId: string, templateId: string, make: string, slotType: string, logoId: string) => void;
  clearTemplateLogoOverrides: (projectId: string, templateId: string, make: string) => void;

  // Per-template color overrides: projectId → templateId → make → [textColor, btnColor]
  templateColors: Record<string, Record<string, Record<string, [string, string]>>>;
  setTemplateColor: (projectId: string, templateId: string, make: string, index: 0 | 1, color: string) => void;
  clearTemplateColorOverrides: (projectId: string, templateId: string, make: string) => void;

  // Per-background+make logo overrides: projectId → bgId → make → { slotType: logoId }
  backgroundMakeLogoIds: Record<string, Record<string, Record<string, Record<string, string>>>>;
  setBackgroundMakeLogoId: (projectId: string, bgId: string, make: string, slotType: string, logoId: string) => void;
  clearBackgroundMakeLogoOverrides: (projectId: string, bgId: string, make: string) => void;

  // Per-background+make color overrides: projectId → bgId → make → [textColor, btnColor]
  backgroundMakeColors: Record<string, Record<string, Record<string, [string, string]>>>;
  setBackgroundMakeColor: (projectId: string, bgId: string, make: string, index: 0 | 1, color: string) => void;
  clearBackgroundMakeColorOverrides: (projectId: string, bgId: string, make: string) => void;

  // Manually-editable template fields (e.g. keyMessage, year for the key-message template)
  // Keyed by templateId → { fieldKey → value }
  customTemplateFields: Record<string, Record<string, string>>;
  setCustomTemplateField: (templateId: string, fieldKey: string, value: string) => void;

  // Variable-to-offer-field mappings — used in the "Map Variables" pane and future CSV import.
  // Keys are canonical variable names (e.g. "vehicleTitle", "monthlyPayment").
  // Values are offer field names (e.g. "monthlyPayment") or special tokens ("__fullName__", "__fixed__", etc.).
  variableMappings: Record<string, string>;
  setVariableMapping: (variableKey: string, fieldValue: string) => void;
  resetVariableMappings: () => void;
}

const ProjectStoreContext = createContext<ProjectStore | null>(null);

function offerTemplateKey(offerId: string, templateId: string) {
  return `${offerId}::${templateId}`;
}

export function ProjectStoreProvider({ children }: { children: React.ReactNode }) {
  const [deletedOfferIds, setDeletedOfferIds] = useState<Set<string>>(new Set());
  const [addedOfferIds, setAddedOfferIds] = useState<Record<string, string[]>>({});
  const [addedTemplateIds, setAddedTemplateIds] = useState<Record<string, string[]>>({});

  function deleteOffers(ids: string[]) {
    setDeletedOfferIds((prev) => new Set([...prev, ...ids]));
  }

  function restoreOffers(ids: string[]) {
    setDeletedOfferIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  }

  function addOffers(projectId: string, ids: string[]) {
    setAddedOfferIds((prev) => {
      const existing = new Set(prev[projectId] ?? []);
      ids.forEach((id) => existing.add(id));
      return { ...prev, [projectId]: Array.from(existing) };
    });
  }

  function addTemplates(projectId: string, ids: string[]) {
    setAddedTemplateIds((prev) => {
      const existing = new Set(prev[projectId] ?? []);
      ids.forEach((id) => existing.add(id));
      return { ...prev, [projectId]: Array.from(existing) };
    });
  }

  // ── Data rows ────────────────────────────────────────────────────────────────
  const [dataRows, setDataRowsState] = useState<Record<string, DataRow[]>>({});

  function addDataRow(projectId: string): string {
    const newId = makeRowId();
    setDataRowsState((prev) => ({
      ...prev,
      [projectId]: [...(prev[projectId] ?? []), { id: newId, data: {} }],
    }));
    return newId;
  }

  function updateDataRow(projectId: string, rowId: string, key: string, value: string) {
    setDataRowsState((prev) => ({
      ...prev,
      [projectId]: (prev[projectId] ?? []).map((r) =>
        r.id === rowId ? { ...r, data: { ...r.data, [key]: value } } : r
      ),
    }));
  }

  function removeDataRow(projectId: string, rowId: string) {
    setDataRowsState((prev) => ({
      ...prev,
      [projectId]: (prev[projectId] ?? []).filter((r) => r.id !== rowId),
    }));
  }

  const [activeBrandKitIds, setActiveBrandKitIdsState] = useState<Record<string, Record<string, string>>>({});

  function setActiveBrandKit(projectId: string, make: string, kitId: string) {
    setActiveBrandKitIdsState((prev) => ({
      ...prev,
      [projectId]: { ...(prev[projectId] ?? {}), [make]: kitId },
    }));
  }

  const [activeLogoIds, setActiveLogoIdsState] = useState<Record<string, Record<string, Record<string, string>>>>({});

  function setActiveLogoId(projectId: string, make: string, slotType: string, logoId: string) {
    setActiveLogoIdsState((prev) => ({
      ...prev,
      [projectId]: {
        ...(prev[projectId] ?? {}),
        [make]: { ...(prev[projectId]?.[make] ?? {}), [slotType]: logoId },
      },
    }));
  }

  const [activeColors, setActiveColorsState] = useState<Record<string, Record<string, [string, string]>>>({});

  function setActiveColor(projectId: string, make: string, index: 0 | 1, color: string) {
    setActiveColorsState((prev) => {
      const projectColors = prev[projectId] ?? {};
      const existing = projectColors[make] ?? ["#000000", "#000000"] as [string, string];
      const updated: [string, string] = [existing[0], existing[1]];
      updated[index] = color;
      return { ...prev, [projectId]: { ...projectColors, [make]: updated } };
    });
  }

  const [fineTune, setFineTune] = useState(false);
  const [groupBy, setGroupBy] = useState("offer");
  const [offerOpen, setOfferOpen] = useState<Record<string, boolean>>({});
  const [templateOpen, setTemplateOpen] = useState<Record<string, boolean>>({});
  const [bgOpen, setBgOpen] = useState<Record<string, boolean>>({});
  const [combinations, setCombinations] = useState<{ id: string; offerIds: string[] }[]>([
    { id: "__combination__", offerIds: [] },
  ]);

  function addCombination() {
    setCombinations((prev) => [
      ...prev,
      { id: `__combination_${Date.now()}__`, offerIds: [] },
    ]);
  }

  function removeCombination(combinationId: string) {
    setCombinations((prev) => prev.filter((c) => c.id !== combinationId));
  }

  function setCombinationOfferAtSlot(combinationId: string, slotIndex: number, offerId: string) {
    setCombinations((prev) =>
      prev.map((c) => {
        if (c.id !== combinationId) return c;
        const next = [...c.offerIds];
        next[slotIndex] = offerId;
        return { ...c, offerIds: next };
      })
    );
  }

  function reEvaluateMultiLifestyleForCombo(
    combinationId: string,
    slotIndex: number,
    newOfferId: string,
    allOffers: Array<{ id: string; model: string; trim: string }>,
    multiTemplateIds: string[],
    slotCount: number
  ) {
    // Find the combo in current state (pre-update, but we override the changed slot below)
    const combo = combinations.find((c) => c.id === combinationId);
    if (!combo) return;

    // Build vehicle filter strings, overriding the changed slot
    const comboVehicleFilters = Array.from({ length: slotCount }, (_, i) => {
      const slotId = i === slotIndex ? newOfferId : (combo.offerIds[i] ?? allOffers[i]?.id);
      const offer = allOffers.find((o) => o.id === slotId);
      return offer ? `${offer.model} ${offer.trim}` : null;
    }).filter(Boolean) as string[];

    // For each multi-vehicle lifestyle background, include or exclude from all multi templates
    backgrounds
      .filter((bg) => bg.isLifestyle && bg.vehicleTags?.length)
      .forEach((bg) => {
        const matches = matchesMultiLifestyle(bg, comboVehicleFilters);
        multiTemplateIds.forEach((tplId) => {
          if (matches) {
            includeBackgroundForOfferTemplate(combinationId, tplId, bg.id);
          } else {
            excludeBackgroundFromOfferTemplate(combinationId, tplId, bg.id);
          }
        });
      });
  }

  const [backgrounds, setBackgrounds] = useState<BackgroundCollection[]>([]);
  // templateId → excluded bgIds  (simple view)
  const [templateExclusions, setTemplateExclusions] = useState<Record<string, string[]>>({});
  // "offerId::templateId" → excluded bgIds  (fine tuning)
  const [offerTemplateExclusions, setOfferTemplateExclusions] = useState<Record<string, string[]>>({});
  // AI-optimized results: "offerId_templateId_bgId" → data URL
  const [aiResults, setAiResults] = useState<Map<string, string>>(new Map());
  // Per-offer logo/color overrides
  const [offerLogoIds, setOfferLogoIdsState] = useState<Record<string, Record<string, Record<string, Record<string, string>>>>>({});
  const [offerColors, setOfferColorsState] = useState<Record<string, Record<string, Record<string, [string, string]>>>>({});
  const [offerTemplateLogoIds, setOfferTemplateLogoIdsState] = useState<Record<string, Record<string, Record<string, Record<string, string>>>>>({});
  const [offerTemplateColors, setOfferTemplateColorsState] = useState<Record<string, Record<string, Record<string, [string, string]>>>>({});
  const [templateLogoIds, setTemplateLogoIdsState] = useState<Record<string, Record<string, Record<string, Record<string, string>>>>>({});
  const [templateColors, setTemplateColorsState] = useState<Record<string, Record<string, Record<string, [string, string]>>>>({});
  const [backgroundMakeLogoIds, setBackgroundMakeLogoIdsState] = useState<Record<string, Record<string, Record<string, Record<string, string>>>>>({});
  const [backgroundMakeColors, setBackgroundMakeColorsState] = useState<Record<string, Record<string, Record<string, [string, string]>>>>({});

  function setBackgroundMakeLogoId(projectId: string, bgId: string, make: string, slotType: string, logoId: string) {
    setBackgroundMakeLogoIdsState((prev) => ({
      ...prev,
      [projectId]: {
        ...(prev[projectId] ?? {}),
        [bgId]: {
          ...(prev[projectId]?.[bgId] ?? {}),
          [make]: { ...(prev[projectId]?.[bgId]?.[make] ?? {}), [slotType]: logoId },
        },
      },
    }));
  }

  function clearBackgroundMakeLogoOverrides(projectId: string, bgId: string, make: string) {
    setBackgroundMakeLogoIdsState((prev) => {
      const project = { ...(prev[projectId] ?? {}) };
      const bg = { ...(project[bgId] ?? {}) };
      delete bg[make];
      project[bgId] = bg;
      return { ...prev, [projectId]: project };
    });
  }

  function setBackgroundMakeColor(projectId: string, bgId: string, make: string, index: 0 | 1, color: string) {
    setBackgroundMakeColorsState((prev) => {
      const existing = prev[projectId]?.[bgId]?.[make] ?? ["#000000", "#000000"] as [string, string];
      const updated: [string, string] = [existing[0], existing[1]];
      updated[index] = color;
      return {
        ...prev,
        [projectId]: {
          ...(prev[projectId] ?? {}),
          [bgId]: { ...(prev[projectId]?.[bgId] ?? {}), [make]: updated },
        },
      };
    });
  }

  function clearBackgroundMakeColorOverrides(projectId: string, bgId: string, make: string) {
    setBackgroundMakeColorsState((prev) => {
      const project = { ...(prev[projectId] ?? {}) };
      const bg = { ...(project[bgId] ?? {}) };
      delete bg[make];
      project[bgId] = bg;
      return { ...prev, [projectId]: project };
    });
  }

  function setOfferLogoId(projectId: string, offerId: string, make: string, slotType: string, logoId: string) {
    setOfferLogoIdsState((prev) => ({
      ...prev,
      [projectId]: {
        ...(prev[projectId] ?? {}),
        [offerId]: {
          ...(prev[projectId]?.[offerId] ?? {}),
          [make]: { ...(prev[projectId]?.[offerId]?.[make] ?? {}), [slotType]: logoId },
        },
      },
    }));
  }

  function clearOfferLogoOverrides(projectId: string, offerId: string, make: string) {
    setOfferLogoIdsState((prev) => {
      const project = { ...(prev[projectId] ?? {}) };
      const offer = { ...(project[offerId] ?? {}) };
      delete offer[make];
      project[offerId] = offer;
      return { ...prev, [projectId]: project };
    });
  }

  function setOfferColor(projectId: string, offerId: string, make: string, index: 0 | 1, color: string) {
    setOfferColorsState((prev) => {
      const existing = prev[projectId]?.[offerId]?.[make] ?? ["#000000", "#000000"] as [string, string];
      const updated: [string, string] = [existing[0], existing[1]];
      updated[index] = color;
      return {
        ...prev,
        [projectId]: {
          ...(prev[projectId] ?? {}),
          [offerId]: { ...(prev[projectId]?.[offerId] ?? {}), [make]: updated },
        },
      };
    });
  }

  function setOfferTemplateLogoId(projectId: string, offerId: string, templateId: string, make: string, slotType: string, logoId: string) {
    const key = offerTemplateKey(offerId, templateId);
    setOfferTemplateLogoIdsState((prev) => ({
      ...prev,
      [projectId]: {
        ...(prev[projectId] ?? {}),
        [key]: {
          ...(prev[projectId]?.[key] ?? {}),
          [make]: { ...(prev[projectId]?.[key]?.[make] ?? {}), [slotType]: logoId },
        },
      },
    }));
  }

  function clearOfferColorOverrides(projectId: string, offerId: string, make: string) {
    setOfferColorsState((prev) => {
      const project = { ...(prev[projectId] ?? {}) };
      const offer = { ...(project[offerId] ?? {}) };
      delete offer[make];
      project[offerId] = offer;
      return { ...prev, [projectId]: project };
    });
  }

  function clearOfferTemplateLogoOverrides(projectId: string, offerId: string, templateId: string, make: string) {
    const key = offerTemplateKey(offerId, templateId);
    setOfferTemplateLogoIdsState((prev) => {
      const project = { ...(prev[projectId] ?? {}) };
      const entry = { ...(project[key] ?? {}) };
      delete entry[make];
      project[key] = entry;
      return { ...prev, [projectId]: project };
    });
  }

  function clearOfferTemplateColorOverrides(projectId: string, offerId: string, templateId: string, make: string) {
    const key = offerTemplateKey(offerId, templateId);
    setOfferTemplateColorsState((prev) => {
      const project = { ...(prev[projectId] ?? {}) };
      const entry = { ...(project[key] ?? {}) };
      delete entry[make];
      project[key] = entry;
      return { ...prev, [projectId]: project };
    });
  }

  function setOfferTemplateColor(projectId: string, offerId: string, templateId: string, make: string, index: 0 | 1, color: string) {
    const key = offerTemplateKey(offerId, templateId);
    setOfferTemplateColorsState((prev) => {
      const existing = prev[projectId]?.[key]?.[make] ?? ["#000000", "#000000"] as [string, string];
      const updated: [string, string] = [existing[0], existing[1]];
      updated[index] = color;
      return {
        ...prev,
        [projectId]: {
          ...(prev[projectId] ?? {}),
          [key]: { ...(prev[projectId]?.[key] ?? {}), [make]: updated },
        },
      };
    });
  }

  function setTemplateLogoId(projectId: string, templateId: string, make: string, slotType: string, logoId: string) {
    setTemplateLogoIdsState((prev) => ({
      ...prev,
      [projectId]: {
        ...(prev[projectId] ?? {}),
        [templateId]: {
          ...(prev[projectId]?.[templateId] ?? {}),
          [make]: { ...(prev[projectId]?.[templateId]?.[make] ?? {}), [slotType]: logoId },
        },
      },
    }));
  }

  function clearTemplateLogoOverrides(projectId: string, templateId: string, make: string) {
    setTemplateLogoIdsState((prev) => {
      const project = { ...(prev[projectId] ?? {}) };
      const tpl = { ...(project[templateId] ?? {}) };
      delete tpl[make];
      project[templateId] = tpl;
      return { ...prev, [projectId]: project };
    });
  }

  function setTemplateColor(projectId: string, templateId: string, make: string, index: 0 | 1, color: string) {
    setTemplateColorsState((prev) => {
      const existing = prev[projectId]?.[templateId]?.[make] ?? ["#000000", "#000000"] as [string, string];
      const updated: [string, string] = [existing[0], existing[1]];
      updated[index] = color;
      return {
        ...prev,
        [projectId]: {
          ...(prev[projectId] ?? {}),
          [templateId]: { ...(prev[projectId]?.[templateId] ?? {}), [make]: updated },
        },
      };
    });
  }

  function clearTemplateColorOverrides(projectId: string, templateId: string, make: string) {
    setTemplateColorsState((prev) => {
      const project = { ...(prev[projectId] ?? {}) };
      const tpl = { ...(project[templateId] ?? {}) };
      delete tpl[make];
      project[templateId] = tpl;
      return { ...prev, [projectId]: project };
    });
  }

  // Manually-editable template fields: templateId → { fieldKey → value }
  const [customTemplateFields, setCustomTemplateFieldsState] = useState<Record<string, Record<string, string>>>({});

  function setCustomTemplateField(templateId: string, fieldKey: string, value: string) {
    setCustomTemplateFieldsState((prev) => ({
      ...prev,
      [templateId]: { ...(prev[templateId] ?? {}), [fieldKey]: value },
    }));
  }

  // ── Variable mappings ────────────────────────────────────────────────────────
  // Keys match the exact {variable} identifiers used in AdTemplate.tsx.
  const DEFAULT_VARIABLE_MAPPINGS: Record<string, string> = {
    year:              "year",
    make:              "make",
    model:             "model",
    trim:              "trim",
    monthlyPayment:    "monthlyPayment",
    term:              "term",
    totalDueAtSigning: "totalDueAtSigning",
    cta:               "__fixed__",
    dealerName:        "__project__",
    keyMessage:        "__manual__",
    modelLine:         "__auto__",
  };
  const [variableMappings, setVariableMappingsState] = useState<Record<string, string>>(DEFAULT_VARIABLE_MAPPINGS);

  function setVariableMapping(variableKey: string, fieldValue: string) {
    setVariableMappingsState((prev) => ({ ...prev, [variableKey]: fieldValue }));
  }

  function resetVariableMappings() {
    setVariableMappingsState(DEFAULT_VARIABLE_MAPPINGS);
  }

  function addBackgrounds(collections: BackgroundCollection[]) {
    setBackgrounds((prev) => {
      const existingIds = new Set(prev.map((b) => b.id));
      return [...prev, ...collections.filter((c) => !existingIds.has(c.id))];
    });
  }

  function removeBackground(id: string) {
    setBackgrounds((prev) => prev.filter((b) => b.id !== id));
    setTemplateExclusions((prev) => dropFromRecord(prev, id));
    setOfferTemplateExclusions((prev) => dropFromRecord(prev, id));
  }

  function clearBackgrounds() {
    setBackgrounds([]);
    setTemplateExclusions({});
    setOfferTemplateExclusions({});
    setAiResults(new Map());
  }

  function setAiResult(key: string, dataUrl: string) {
    setAiResults((prev) => new Map(prev).set(key, dataUrl));
  }

  function clearAiResult(key: string) {
    setAiResults((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }

  function excludeBackgroundFromTemplate(templateId: string, bgId: string) {
    setTemplateExclusions((prev) => addToRecord(prev, templateId, bgId));
  }

  function getBackgroundsForTemplate(templateId: string): BackgroundCollection[] {
    const excluded = new Set(templateExclusions[templateId] ?? []);
    return backgrounds.filter(
      (bg) => !excluded.has(bg.id) && !!resolveTemplateImage(bg, templateId)
    );
  }

  function excludeBackgroundFromOfferTemplate(offerId: string, templateId: string, bgId: string) {
    const key = offerTemplateKey(offerId, templateId);
    setOfferTemplateExclusions((prev) => addToRecord(prev, key, bgId));
  }

  function includeBackgroundForOfferTemplate(offerId: string, templateId: string, bgId: string) {
    const key = offerTemplateKey(offerId, templateId);
    setOfferTemplateExclusions((prev) => ({
      ...prev,
      [key]: (prev[key] ?? []).filter((id) => id !== bgId),
    }));
  }

  function clearExclusionsForBackground(bgIds: string[]) {
    const idSet = new Set(bgIds);
    setTemplateExclusions((prev) => dropSetFromRecord(prev, idSet));
    setOfferTemplateExclusions((prev) => dropSetFromRecord(prev, idSet));
  }

  function getBackgroundsForOfferTemplate(offerId: string, templateId: string): BackgroundCollection[] {
    const templateExcluded = new Set(templateExclusions[templateId] ?? []);
    const offerExcluded = new Set(offerTemplateExclusions[offerTemplateKey(offerId, templateId)] ?? []);
    return backgrounds.filter(
      (bg) =>
        !templateExcluded.has(bg.id) &&
        !offerExcluded.has(bg.id) &&
        !!resolveTemplateImage(bg, templateId)
    );
  }

  return (
    <ProjectStoreContext.Provider value={{
      deletedOfferIds,
      deleteOffers,
      restoreOffers,
      addedOfferIds,
      addOffers,
      addedTemplateIds,
      addTemplates,
      dataRows,
      addDataRow,
      updateDataRow,
      removeDataRow,
      activeBrandKitIds,
      setActiveBrandKit,
      activeLogoIds,
      setActiveLogoId,
      activeColors,
      setActiveColor,
      fineTune,
      setFineTune,
      groupBy,
      setGroupBy,
      offerOpen,
      setOfferOpen,
      templateOpen,
      setTemplateOpen,
      bgOpen,
      setBgOpen,
      combinations,
      addCombination,
      removeCombination,
      setCombinationOfferAtSlot,
      reEvaluateMultiLifestyleForCombo,
      backgrounds,
      addBackgrounds,
      removeBackground,
      clearBackgrounds,
      excludeBackgroundFromTemplate,
      getBackgroundsForTemplate,
      excludeBackgroundFromOfferTemplate,
      includeBackgroundForOfferTemplate,
      getBackgroundsForOfferTemplate,
      clearExclusionsForBackground,
      aiResults,
      setAiResult,
      clearAiResult,
      offerLogoIds,
      setOfferLogoId,
      clearOfferLogoOverrides,
      offerColors,
      setOfferColor,
      clearOfferColorOverrides,
      offerTemplateLogoIds,
      setOfferTemplateLogoId,
      clearOfferTemplateLogoOverrides,
      offerTemplateColors,
      setOfferTemplateColor,
      clearOfferTemplateColorOverrides,
      templateLogoIds,
      setTemplateLogoId,
      clearTemplateLogoOverrides,
      templateColors,
      setTemplateColor,
      clearTemplateColorOverrides,
      backgroundMakeLogoIds,
      setBackgroundMakeLogoId,
      clearBackgroundMakeLogoOverrides,
      backgroundMakeColors,
      setBackgroundMakeColor,
      clearBackgroundMakeColorOverrides,
      customTemplateFields,
      setCustomTemplateField,
      variableMappings,
      setVariableMapping,
      resetVariableMappings,
    }}>
      {children}
    </ProjectStoreContext.Provider>
  );
}

export function useProjectStore() {
  const ctx = useContext(ProjectStoreContext);
  if (!ctx) throw new Error("useProjectStore must be inside ProjectStoreProvider");
  return ctx;
}

/** Safe version — returns null outside ProjectStoreProvider (used in AdTemplate). */
export function useProjectStoreSafe() {
  return useContext(ProjectStoreContext);
}

// ─── helpers ─────────────────────────────────────────────────────────────────

// Returns the best available image URL for a given template ID.
// Falls back to a same-aspect sibling when the template is a multi-product variant.
const TEMPLATE_IMAGE_FALLBACKS: Record<string, string[]> = {
  "website-1969x1080-3prod":  ["website-2000x500"],
  "social-1080x1080-3prod":   ["social-1080x1080"],
  "social-1080x1080-keymsg":  ["social-1080x1080"],
};

export function resolveTemplateImage(
  bg: { images?: Record<string, string>; thumbnail?: string; dimensions?: { width: number; height: number; url: string }[] },
  templateId: string
): string | undefined {
  // 1. Direct key match (e.g. automotive "social-1080x1080" → template id "social-1080x1080")
  if (bg.images?.[templateId]) return bg.images[templateId];
  // 2. Named fallback aliases
  for (const fallback of TEMPLATE_IMAGE_FALLBACKS[templateId] ?? []) {
    if (bg.images?.[fallback]) return bg.images[fallback];
  }
  // 3. Dimension-based match — used by pharma backgrounds whose images are keyed by size label
  //    rather than template id (e.g. "banner-300x600") and by any collection that exposes a
  //    `dimensions` array.
  const tpl = templateLibrary.find((t) => t.id === templateId);
  if (tpl) {
    if (bg.dimensions?.length) {
      const match = bg.dimensions.find(
        (d) => d.width === tpl.width && d.height === tpl.height
      );
      if (match) return match.url;
    }
    // 4. Also try the images map keyed as "{width}x{height}"
    const sizeKey = `${tpl.width}x${tpl.height}`;
    if (bg.images?.[sizeKey]) return bg.images[sizeKey];
  }
  return undefined;
}

function addToRecord(record: Record<string, string[]>, key: string, value: string) {
  const current = record[key] ?? [];
  if (current.includes(value)) return record;
  return { ...record, [key]: [...current, value] };
}

function dropFromRecord(record: Record<string, string[]>, value: string) {
  const next: Record<string, string[]> = {};
  for (const [k, ids] of Object.entries(record)) {
    next[k] = ids.filter((i) => i !== value);
  }
  return next;
}

function dropSetFromRecord(record: Record<string, string[]>, values: Set<string>) {
  const next: Record<string, string[]> = {};
  for (const [k, ids] of Object.entries(record)) {
    next[k] = ids.filter((i) => !values.has(i));
  }
  return next;
}
