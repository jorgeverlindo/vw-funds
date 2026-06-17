
import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, ImageIcon, Plus, MoreHorizontal,
  ChevronDown, Trash2, Eye, Pencil, Check,
  FileImage, Share2, Upload, X, Sparkles, Globe
} from "lucide-react";
import { SelectBackgroundDialog } from "@projects/logos-backgrounds/SelectBackgroundDialog";
import { SubsectionActions, TipWrapper } from "@projects/logos-backgrounds/SubsectionActions";
import { LogoPicker } from "@projects/logos-backgrounds/LogoPicker";
import { OfferAccordion, StyleOverrideButtons } from "@projects/logos-backgrounds/OfferAccordion";
import { DataRowAccordion } from "@projects/logos-backgrounds/DataRowAccordion";
import { CombinationAccordion, SlotPicker, OfferSlotThumbnail, COMBINATION_ID, KeyMessageInlineInputs } from "@projects/logos-backgrounds/CombinationAccordion";
import { BackgroundCollection } from "@projects/logos-backgrounds/BackgroundCollectionCard";
import { brandKits, getProjectTemplates, getProjectOffers, getProjectById, offerLibrary, templateLibrary } from "@projects/lib/mock-data";
import type { Offer, Template } from "@projects/lib/mock-data";
import { matchesLifestyle, matchesMultiLifestyle } from "@projects/lib/lifestyle-data";
import { LifestyleTaggingDialog } from "@projects/logos-backgrounds/LifestyleTaggingDialog";

import { AdTemplate, PharmaAdTemplate } from "@projects/templates/AdTemplate";
import { TemplateWireframe } from "@projects/templates/TemplateWireframe";
import { TemplateZoneEditor } from "@projects/templates/TemplateZoneEditor";
import { useProjectStore, resolveTemplateImage } from "@projects/lib/project-store";
import type { DataRow } from "@projects/lib/project-store";
import { thumbnailScale } from "@projects/lib/thumbnail-scale";
import { getSquareThumbnail } from "@projects/lib/bg-thumbnail";

type GroupBy = "offer" | "template" | "background";
const GROUP_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: "offer",      label: "Group by Offer" },
  { value: "template",   label: "Group by Template" },
  { value: "background", label: "Group by Background Collection" },
];


export function LogosBackgroundsPage({ projectId, onNavigateTo }: { projectId: string; onNavigateTo: (page: string) => void }) {
  const id = projectId;
  const project = getProjectById(id);
  const baseTemplates = getProjectTemplates(id);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogFolder, setDialogFolder] = useState<"recents" | "background-collections">("recents");
  const [combinationOpen, setCombinationOpen] = useState<Record<string, boolean>>({});
  const [contentVisible, setContentVisible] = useState(true);
  function handleFineTuneChange(v: boolean) {
    setContentVisible(false);
    setTimeout(() => {
      setFineTune(v);
      setContentVisible(true);
    }, 150);
  }
  const [lightbox, setLightbox] = useState<{ bg: BackgroundCollection; templateId: string; slotOffers?: typeof offers } | null>(null);
  const [viewMode, setViewMode] = useState<string>("backgrounds");
  const [groupByOpen, setGroupByOpen] = useState(false);
  const groupByRef = useRef<HTMLDivElement>(null);

  const GROUP_MODES: GroupBy[] = ["offer", "template", "background"];
  function changeGroupBy(next: GroupBy) {
    setGroupBy(next as GroupBy);
  }
  function cycleGroupBy(dir: 1 | -1) {
    const idx = GROUP_MODES.indexOf(groupBy as GroupBy);
    changeGroupBy(GROUP_MODES[(idx + dir + GROUP_MODES.length) % GROUP_MODES.length]);
  }

  function toggleOffer(id: string) {
    setOfferOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  }
  function toggleTemplate(id: string) {
    setTemplateOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  }
  function toggleBg(id: string) {
    setBgOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (groupByRef.current && !groupByRef.current.contains(e.target as Node)) {
        setGroupByOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);
  const {
    fineTune, setFineTune,
    groupBy, setGroupBy,
    offerOpen, setOfferOpen,
    templateOpen, setTemplateOpen,
    bgOpen, setBgOpen,
    backgrounds, addBackgrounds, clearBackgrounds,
    excludeBackgroundFromTemplate, getBackgroundsForTemplate,
    getBackgroundsForOfferTemplate, excludeBackgroundFromOfferTemplate,
    includeBackgroundForOfferTemplate, clearExclusionsForBackground,
    combinations, addCombination, removeCombination, setCombinationOfferAtSlot,
    reEvaluateMultiLifestyleForCombo,
    deletedOfferIds,
    addedOfferIds,
    addedTemplateIds,
    dataRows,
    activeBrandKitIds, setActiveBrandKit,
    activeLogoIds, setActiveLogoId,
    activeColors, setActiveColor,
    customTemplateFields, setCustomTemplateField,
  } = useProjectStore();
  // ── Templates (base from project + dynamically added via dialog) ─────────────
  const extraTemplates = useMemo(
    () =>
      (addedTemplateIds[id] ?? [])
        .map((tid) => templateLibrary.find((t) => t.id === tid))
        .filter((t): t is Template => !!t),
    [addedTemplateIds, id]
  );
  const templates = useMemo(
    () => [...baseTemplates, ...extraTemplates],
    [baseTemplates, extraTemplates]
  );
  const singleTemplates = useMemo(() => templates.filter((t) => t.products === 1), [templates]);
  const multiTemplates = useMemo(() => templates.filter((t) => t.products > 1), [templates]);

  // ── Offers ────────────────────────────────────────────────────────────────────
  const baseOffers = getProjectOffers(id);
  const extraOffers = (addedOfferIds[id] ?? [])
    .map((aid) => offerLibrary.find((o) => o.id === aid))
    .filter((o): o is Offer => !!o);
  const offers = [...baseOffers, ...extraOffers].filter((o) => !deletedOfferIds.has(o.id));
  const selectedOffer = offers.find((o) => o.id === viewMode) ?? offers[0];

  // ── Data rows (pharma equivalent of offers) ────────────────────────────────
  const dataRowsList: DataRow[] = dataRows[id] ?? [];
  // When no offers exist, data rows act as the entity list for background assignment
  const usesDataRows = offers.length === 0 && dataRowsList.length > 0;
  const selectedDataRow = usesDataRows ? dataRowsList.find((r) => r.id === viewMode) ?? null : null;
  // Unified entity IDs for background assignment
  const entityIds = usesDataRows
    ? dataRowsList.map((r) => r.id)
    : [...offers.map((o) => o.id), ...combinations.map((c) => c.id)];

  const [pendingAddContext, setPendingAddContext] = useState<{ offerId: string | null; templateId: string | null } | null>(null);
  const [taggingFile, setTaggingFile] = useState<{ file: File; url: string } | null>(null);

  /** Build the array of "model trim" strings for each slot in a combo (for multi-vehicle matching). */
  function buildComboVehicleFilters(
    combo: { id: string; offerIds: (string | undefined)[] },
    resolvedOffers: typeof offers,
    resolvedMultiTemplates: typeof multiTemplates
  ): string[] {
    const slotCount = resolvedMultiTemplates[0]?.products ?? 3;
    return Array.from({ length: slotCount }, (_, i) => {
      const slotId = combo.offerIds[i] ?? resolvedOffers[i]?.id;
      const offer = resolvedOffers.find((o) => o.id === slotId);
      return offer ? `${offer.model} ${offer.trim}` : null;
    }).filter(Boolean) as string[];
  }

  function handleDeleteSubsection(offerId: string, templateId: string) {
    getBackgroundsForOfferTemplate(offerId, templateId).forEach((bg) => {
      excludeBackgroundFromOfferTemplate(offerId, templateId, bg.id);
    });
  }

  function openDialogForOfferTemplate(offerId: string | null, templateId: string | null) {
    setPendingAddContext({ offerId, templateId });
    setDialogOpen(true);
  }

  function handleAdd(collections: BackgroundCollection[]) {
    // Snapshot which IDs already exist BEFORE adding
    const existingIds = new Set(backgrounds.map((b) => b.id));
    addBackgrounds(collections);

    if (pendingAddContext) {
      const { offerId, templateId } = pendingAddContext;
      collections.forEach((col) => {
        const isNew = !existingIds.has(col.id);
        entityIds.forEach((eid) => {
          templates.forEach((template) => {
            const matchEntity = offerId === null || eid === offerId;
            const matchTemplate = templateId === null || template.id === templateId;
            if (matchEntity && matchTemplate) {
              includeBackgroundForOfferTemplate(eid, template.id, col.id);
            } else if (isNew) {
              excludeBackgroundFromOfferTemplate(eid, template.id, col.id);
            }
          });
        });
      });
      setPendingAddContext(null);
    } else {
      // Global add: clear ALL exclusions so the bg appears everywhere
      clearExclusionsForBackground(collections.map((c) => c.id));

      if (!usesDataRows) {
        // ── Single-vehicle lifestyle images (automotive only) ──────────────
        const singleLifestyleAdded = collections.filter(
          (c) => c.isLifestyle && c.vehicleTag && !c.vehicleTags?.length
        );
        singleLifestyleAdded.forEach((bg) => {
          offers.forEach((offer) => {
            if (!matchesLifestyle(bg, offer.model, offer.trim)) {
              templates.forEach((tpl) => {
                excludeBackgroundFromOfferTemplate(offer.id, tpl.id, bg.id);
              });
            }
          });
          combinations.forEach((combo) => {
            multiTemplates.forEach((tpl) => {
              excludeBackgroundFromOfferTemplate(combo.id, tpl.id, bg.id);
            });
          });
        });

        // ── Multi-vehicle lifestyle images (automotive only) ───────────────
        const multiLifestyleAdded = collections.filter(
          (c) => c.isLifestyle && c.vehicleTags?.length
        );
        multiLifestyleAdded.forEach((bg) => {
          offers.forEach((offer) => {
            singleTemplates.forEach((tpl) => {
              excludeBackgroundFromOfferTemplate(offer.id, tpl.id, bg.id);
            });
          });
          combinations.forEach((combo) => {
            const comboVehicleFilters = buildComboVehicleFilters(combo, offers, multiTemplates);
            if (!matchesMultiLifestyle(bg, comboVehicleFilters)) {
              multiTemplates.forEach((tpl) => {
                excludeBackgroundFromOfferTemplate(combo.id, tpl.id, bg.id);
              });
            }
          });
        });
      }
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white">
        <h1 className="text-lg font-semibold text-gray-900">Styles</h1>

        {fineTune && (
          <div className="relative ml-2">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              type="text"
              placeholder="Find below"
              className="pl-7 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-[var(--brand-accent)]"
            />
          </div>
        )}
      </div>

      <div className={`flex-1 overflow-y-auto px-6 py-5 transition-opacity duration-150 ${contentVisible ? "opacity-100" : "opacity-0"}`}>
        {fineTune ? (
          /* Fine Tune View — grouped by offer as accordions */
          <div className="max-w-[1200px] mx-auto bg-gray-100 rounded-2xl p-6 space-y-2">
            {/* Controls row — first element always */}
            <div className="flex items-center gap-4">
              {/* Group by selector — first element always */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => cycleGroupBy(-1)}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 transition text-gray-500"
                >
                  <ChevronLeft size={15} />
                </button>
                <div ref={groupByRef} className="relative">
                  <button
                    onClick={() => setGroupByOpen((o) => !o)}
                    className="flex items-center gap-2 border border-gray-200 bg-white rounded px-3 h-[30px] w-[315px] hover:bg-gray-50 transition text-left"
                  >
                    <span className="text-xs font-medium text-gray-800 flex-1">
                      {GROUP_OPTIONS.find(o => o.value === groupBy)?.label}
                    </span>
                    <ChevronDown size={13} className="text-gray-400 shrink-0" />
                  </button>
                  {groupByOpen && (
                    <div className="absolute top-full mt-1 left-0 z-30 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 min-w-full">
                      {GROUP_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => { changeGroupBy(opt.value); setGroupByOpen(false); }}
                          className={`w-full flex items-center px-4 py-2.5 text-xs text-left hover:bg-gray-50 transition ${groupBy === opt.value ? "font-semibold text-[var(--brand-accent)] bg-[var(--brand-accent)/8]" : "font-medium text-gray-800"}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => cycleGroupBy(1)}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 transition text-gray-500"
                >
                  <ChevronRight size={15} />
                </button>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 ml-auto">
                <FineTuneSwitch value={fineTune} onChange={handleFineTuneChange} />
                <AddBackgroundMenu onOpenDialog={(folder) => { setPendingAddContext(null); setDialogFolder(folder); setDialogOpen(true); }} onClearAll={clearBackgrounds} onLifestyleUpload={(file, url) => setTaggingFile({ file, url })} />
                {backgrounds.length > 0 && (
                  <button
                    onClick={clearBackgrounds}
                    className="flex items-center gap-2 text-[13px] font-medium text-[var(--brand-accent)] hover:text-[var(--brand-accent)] transition px-1.5 py-1"
                  >
                    <X size={16} />
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {groupBy === "offer" && !usesDataRows && <div className="border-t border-gray-200 mt-5" />}

            {/* Compact brand kit — rendered once, reused in all three groupBy sections for pharma */}
            {usesDataRows && (() => {
              const make = project.oem ?? "";
              if (!make) return null;
              const available = brandKits;
              const activeKitId = (activeBrandKitIds[id] ?? {})[make];
              const activeKit = available.find((k) => k.id === activeKitId) ?? available.find((k) => k.oem === make) ?? available[0];
              if (!activeKit) return null;
              const storedColors = (activeColors[id] ?? {})[make] as [string, string] | undefined;
              const makeActiveColors: [string, string] = storedColors ?? [activeKit.colors[0] ?? "#000000", activeKit.colors[1] ?? "#000000"];
              const ftSlotTypes = Array.from(new Set(templates.flatMap((t) => t.logoSlots ?? [])));
              return (
                <>
                  <div className="border-t border-gray-200 mt-5" />
                  <div className="px-2 pt-2 pb-1">
                    <BrandKitRow
                      make={make}
                      available={available}
                      activeKit={activeKit}
                      slotTypes={ftSlotTypes}
                      activeLogoIds={(activeLogoIds[id] ?? {})[make] ?? {}}
                      activeColors={makeActiveColors}
                      onSelectKit={(kitId) => setActiveBrandKit(id, make, kitId)}
                      onSetLogoId={(slotType, logoId) => setActiveLogoId(id, make, slotType, logoId)}
                      onSetColor={(idx, color) => setActiveColor(id, make, idx, color)}
                      compact
                    />
                  </div>
                </>
              );
            })()}

            {/* Accordions — conditional on groupBy */}
            {groupBy === "offer" && usesDataRows ? (
              /* ── Data row accordions (pharma projects) ── */
              <div className="space-y-2 mt-2">

                {dataRowsList.map((row, ri) => (
                  <DataRowAccordion
                    key={row.id}
                    row={row}
                    rowIndex={ri}
                    backgrounds={backgrounds}
                    templates={templates}
                    open={offerOpen[row.id] ?? false}
                    onToggle={() => toggleOffer(row.id)}
                    onAddBackground={(templateId) => openDialogForOfferTemplate(row.id, templateId)}
                    onAddAll={() => openDialogForOfferTemplate(row.id, null)}
                    projectId={id}
                    make={project.oem ?? ""}
                  />
                ))}
                {dataRowsList.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-8">
                    Add rows in the Data task to see them here.
                  </p>
                )}
              </div>
            ) : groupBy === "offer" && (() => {
              const ftSlotTypes = Array.from(new Set(templates.flatMap((t) => t.logoSlots ?? [])));
              const ftMakeKits = Array.from(new Set(offers.map((o) => o.make)))
                .map((make) => {
                  const available = brandKits;
                  const activeKitId = (activeBrandKitIds[id] ?? {})[make];
                  const activeKit = available.find((k) => k.id === activeKitId) ?? available.find((k) => k.oem === make) ?? available[0];
                  if (!activeKit) return null;
                  const storedColors = (activeColors[id] ?? {})[make] as [string, string] | undefined;
                  const makeActiveColors: [string, string] = storedColors ?? [activeKit.colors[0] ?? "#000000", activeKit.colors[1] ?? "#000000"];
                  return { make, available, activeKit, makeActiveColors };
                })
                .filter((x): x is NonNullable<typeof x> => !!x);

              return (
                <>
                  {ftMakeKits.map(({ make, available, activeKit, makeActiveColors }, i) => (
                    <React.Fragment key={make}>
                      {/* Divider between make groups */}
                      {i > 0 && <div className="border-t border-gray-200 mt-5 mb-5" />}
                      {/* Compact brand kit row for this make */}
                      <div className="px-2 pt-2">
                        <BrandKitRow
                          make={make}
                          available={available}
                          activeKit={activeKit}
                          slotTypes={ftSlotTypes}
                          activeLogoIds={(activeLogoIds[id] ?? {})[make] ?? {}}
                          activeColors={makeActiveColors}
                          onSelectKit={(kitId) => setActiveBrandKit(id, make, kitId)}
                          onSetLogoId={(slotType, logoId) => setActiveLogoId(id, make, slotType, logoId)}
                          onSetColor={(idx, color) => setActiveColor(id, make, idx, color)}
                          compact
                        />
                      </div>
                      {/* Single-product offers for this make */}
                      {singleTemplates.length > 0 && offers
                        .filter((o) => o.make === make)
                        .map((offer) => (
                          <OfferAccordion
                            key={offer.id}
                            offer={offer}
                            backgrounds={backgrounds}
                            templates={singleTemplates}
                            open={offerOpen[offer.id] ?? false}
                            onToggle={() => toggleOffer(offer.id)}
                            onDelete={(templateId) => handleDeleteSubsection(offer.id, templateId)}
                            onAddBackground={(templateId) => openDialogForOfferTemplate(offer.id, templateId)}
                            onAddAll={() => openDialogForOfferTemplate(offer.id, null)}
                            projectId={id}
                          />
                        ))}
                    </React.Fragment>
                  ))}

                  {/* Multi-product combination accordions (not per-make) */}
                  {multiTemplates.length > 0 && combinations.map((combo) => (
                    <CombinationAccordion
                      key={combo.id}
                      combinationId={combo.id}
                      templates={multiTemplates}
                      allOffers={offers}
                      slotOfferIds={combo.offerIds}
                      onSetSlotOffer={(slot, offerId) => {
                        setCombinationOfferAtSlot(combo.id, slot, offerId);
                        reEvaluateMultiLifestyleForCombo(
                          combo.id, slot, offerId, offers,
                          multiTemplates.map((t) => t.id),
                          multiTemplates[0]?.products ?? 3
                        );
                      }}
                      open={combinationOpen[combo.id] ?? false}
                      onToggle={() => setCombinationOpen(prev => ({ ...prev, [combo.id]: !prev[combo.id] }))}
                      onAddBackground={(templateId) => openDialogForOfferTemplate(combo.id, templateId)}
                      onAddAll={() => openDialogForOfferTemplate(combo.id, null)}
                      onDelete={combinations.length > 1 ? () => removeCombination(combo.id) : undefined}
                      projectId={id}
                    />
                  ))}

                  {/* Add Combination */}
                  {multiTemplates.length > 0 && (
                    <button
                      onClick={addCombination}
                      className="flex items-center gap-1.5 text-xs font-medium text-[var(--brand-accent)] hover:text-[var(--brand-accent-hover)] transition-colors"
                    >
                      <Plus size={13} className="text-[var(--brand-accent)]" />
                      Add Combination
                    </button>
                  )}
                </>
              );
            })()}

            {groupBy === "template" && (
              <div className="mt-5 space-y-2">
                {templates.map((template) => (
                  <TemplateGroupAccordion
                    key={template.id}
                    template={template}
                    offers={offers}
                    open={templateOpen[template.id] ?? false}
                    onToggle={() => toggleTemplate(template.id)}
                    onDelete={(offerId) => handleDeleteSubsection(offerId, template.id)}
                    onAddBackground={(offerId) => openDialogForOfferTemplate(offerId, template.id)}
                    onAddAll={() => openDialogForOfferTemplate(null, template.id)}
                    dealerName={project.dealerName}
                    projectId={id}
                    dataRows={dataRowsList}
                    make={project.oem ?? ""}
                  />
                ))}
              </div>
            )}
            {groupBy === "background" && (
              <div className="mt-5 space-y-2">
                {backgrounds.map((bg) => (
                  <BackgroundGroupAccordion
                    key={bg.id}
                    bg={bg}
                    offers={offers}
                    templates={templates}
                    open={bgOpen[bg.id] ?? false}
                    onToggle={() => toggleBg(bg.id)}
                    dealerName={project.dealerName}
                    projectId={id}
                    dataRows={dataRowsList}
                    make={project.oem ?? ""}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Default view — card layout */
          <div className={`${backgrounds.length > 0 ? "max-w-[1200px]" : "max-w-3xl"} mx-auto bg-gray-100 rounded-2xl p-6 space-y-6`}>
            {/* Logos section */}
            <BrandKitSection
              offers={offers}
              projectId={id}
              templates={templates}
              activeBrandKitIds={activeBrandKitIds[id] ?? {}}
              onSetActiveBrandKit={setActiveBrandKit}
              activeLogoIds={activeLogoIds[id] ?? {}}
              onSetLogoId={setActiveLogoId}
              activeColors={activeColors[id] ?? {}}
              onSetColor={setActiveColor}
              fallbackMake={offers.length === 0 ? project.oem : undefined}
              projectName={project.name}
              dealerName={project.dealerName ?? ""}
            />

            <div className="border-t border-gray-200" />

            {/* Backgrounds section */}
            <div>
              {/* Header row */}
                <div className="flex items-center gap-4 mb-4">
                  {/* View mode selector — first element when backgrounds are present */}
                  {backgrounds.length > 0 && (
                    <ViewModeSelector
                      viewMode={viewMode}
                      onChange={setViewMode}
                      offers={offers}
                      singleTemplates={singleTemplates}
                      multiTemplates={multiTemplates}
                      combinations={combinations}
                      dataRows={dataRowsList}
                    />
                  )}

                  {/* Title — only in empty state */}
                  {backgrounds.length === 0 && (
                    <div className="shrink-0">
                      <h2 className="text-sm font-semibold text-gray-900 mb-1">Backgrounds</h2>
                      <p className="text-xs text-gray-400">Add collections or individual backgrounds</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2.5 shrink-0 ml-auto">
                    {backgrounds.length > 0 && (
                      <FineTuneSwitch value={fineTune} onChange={handleFineTuneChange} />
                    )}
                    {backgrounds.length > 0 && (
                      <AddBackgroundMenu onOpenDialog={(folder) => { setPendingAddContext(null); setDialogFolder(folder); setDialogOpen(true); }} onClearAll={clearBackgrounds} onLifestyleUpload={(file, url) => setTaggingFile({ file, url })} />
                    )}
                    {backgrounds.length > 0 && (
                      <button
                        onClick={clearBackgrounds}
                        className="flex items-center gap-2 text-[13px] font-medium text-[var(--brand-accent)] hover:text-[var(--brand-accent)] transition px-1.5 py-1"
                      >
                        <X size={16} />
                        Clear all
                      </button>
                    )}
                  </div>
                </div>

                {backgrounds.length === 0 ? (
                  /* Empty state */
                  <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center py-12 gap-3">
                    <div className="text-gray-300">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-400">No backgrounds added yet</p>
                    <div className="flex items-center gap-2 mt-1">
                      <EmptyAddMenu
                        label="Add Collection"
                        variant="solid"
                        onFromPortal={() => { setPendingAddContext(null); setDialogFolder("background-collections"); setDialogOpen(true); }}
                        onUpload={(files) => {
                          if (!files.length) return;
                          const url = URL.createObjectURL(files[0]);
                          handleAdd([{
                            id: `upload-col-${Date.now()}`,
                            name: files[0].name.replace(/\.[^.]+$/, ""),
                            type: "Background Collection",
                            sizes: files.length,
                            folder: "Uploads",
                            color: "#9CA3AF",
                            thumbnail: url,
                            images: {},
                          }]);
                        }}
                        multiple
                      />
                      <EmptyAddMenu
                        label="Add Lifestyle"
                        variant="outline"
                        onFromPortal={() => { setPendingAddContext(null); setDialogFolder("recents"); setDialogOpen(true); }}
                        onUpload={(files) => {
                          if (!files.length) return;
                          const file = files[0];
                          setTaggingFile({ file, url: URL.createObjectURL(file) });
                        }}
                      />
                    </div>
                  </div>
                ) : viewMode === "backgrounds" ? (
                  /* Backgrounds view — one card per template */
                  <div className="flex flex-wrap gap-3">
                    {templates.map((template) => (
                      <TemplateBackgroundCard
                        key={template.id}
                        template={template}
                        onOpenDialog={(folder) => { setDialogFolder(folder ?? "recents"); openDialogForOfferTemplate(null, template.id); }}
                      />
                    ))}
                  </div>
                ) : selectedDataRow ? (
                  /* Data row view — per-template rows with background thumbnails */
                  <div className="space-y-1">
                    {templates.map((template) => {
                      const assignedBgs = getBackgroundsForOfferTemplate(selectedDataRow.id, template.id);
                      return (
                        <div key={template.id} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-gray-700">{template.name}</span>
                            <span className="text-[10px] text-gray-400">{template.width}×{template.height}</span>
                            <button
                              onClick={() => { openDialogForOfferTemplate(selectedDataRow.id, template.id); }}
                              className="ml-1 flex items-center gap-1 text-[10px] font-medium text-[var(--brand-accent)] hover:text-[var(--brand-accent)] transition"
                            >
                              <Plus size={11} /> Add background
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {assignedBgs.map((bg) => {
                              const scale = thumbnailScale(template.width, template.height);
                              return (
                                <div key={bg.id} className="relative shrink-0 group rounded overflow-hidden">
                                  <PharmaAdTemplate
                                    templateId={template.id}
                                    background={bg}
                                    scale={scale}
                                    projectId={id}
                                    make={project.oem ?? ""}
                                    dataFields={selectedDataRow.data}
                                  />
                                  {/* Hover actions */}
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 z-10 rounded">
                                    <button
                                      onClick={() => excludeBackgroundFromOfferTemplate(selectedDataRow.id, template.id, bg.id)}
                                      className="w-7 h-7 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition shadow"
                                    >
                                      <Trash2 size={13} className="text-gray-700" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                            {assignedBgs.length === 0 && (
                              <button
                                onClick={() => openDialogForOfferTemplate(selectedDataRow.id, template.id)}
                                className="w-20 h-12 rounded border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 hover:border-[var(--brand-accent)/40] hover:text-[var(--brand-accent)]/60 transition"
                              >
                                <Plus size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (() => {
                  // Determine if the selected mode is a combination or a single offer
                  const selectedCombo = combinations.find((c) => c.id === viewMode);
                  const slotCount = multiTemplates[0]?.products ?? 3;
                  const comboSlotOffers = selectedCombo
                    ? Array.from({ length: slotCount }, (_, i) =>
                        offers.find((o) => o.id === (selectedCombo.offerIds[i] ?? offers[i]?.id))
                      ).filter(Boolean) as typeof offers
                    : [];
                  const activeTemplates = selectedCombo ? multiTemplates : singleTemplates.length > 0 ? singleTemplates : templates;
                  const lookupId = selectedCombo ? selectedCombo.id : selectedOffer?.id ?? "";

                  return (
                    /* Offer / Combination view — per-template rows with AdTemplate thumbnails */
                    <div className="space-y-1">
                      {activeTemplates.map((template) => (
                        <div key={template.id} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-gray-700">{template.name}</span>
                            <button className="text-gray-300 hover:text-gray-500">
                              <MoreHorizontal size={13} />
                            </button>
                          </div>
                          {selectedCombo && <KeyMessageInlineInputs templateId={template.id} />}
                          <div className="flex flex-wrap gap-2">
                            {getBackgroundsForOfferTemplate(lookupId, template.id).map((bg) => (
                              <div key={bg.id} className="relative shrink-0 group">
                                <div className="overflow-hidden isolate">
                                  <AdTemplate
                                    projectId={id}
                                    templateId={template.id}
                                    offer={selectedCombo ? comboSlotOffers[0] : selectedOffer}
                                    offers={selectedCombo ? comboSlotOffers : undefined}
                                    background={bg}
                                    scale={thumbnailScale(template.width, template.height)}
                                    customFields={customTemplateFields[template.id]}
                                  />
                                </div>
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                                  <button onClick={() => setLightbox({ bg, templateId: template.id, slotOffers: selectedCombo ? comboSlotOffers : undefined })} className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition shadow">
                                    <Eye size={14} className="text-gray-700" />
                                  </button>
                                  <button onClick={() => excludeBackgroundFromOfferTemplate(lookupId, template.id, bg.id)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition shadow">
                                    <Trash2 size={14} className="text-gray-700" />
                                  </button>
                                  <button className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition shadow">
                                    <Pencil size={14} className="text-gray-700" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
            </div>
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div className="flex items-center justify-between px-6 py-3 bg-white">
        <button
          onClick={() => onNavigateTo('templates')}
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--brand-accent)] border border-[var(--brand-accent)/30] rounded-full px-4 py-1.5 hover:bg-[var(--brand-accent)/5] transition"
        >
          <ChevronLeft size={14} />
          Templates
        </button>
        {(() => {
          const singleAssets = singleTemplates.reduce(
            (sum, t) => sum + offers.reduce((oSum, o) => oSum + getBackgroundsForOfferTemplate(o.id, t.id).length, 0),
            0
          );
          const multiAssets = multiTemplates.reduce(
            (sum, t) => sum + combinations.reduce((cSum, c) => cSum + getBackgroundsForOfferTemplate(c.id, t.id).length, 0),
            0
          );
          const totalAssets = singleAssets + multiAssets;
          return (
            <button
              onClick={() => onNavigateTo('preview')}
              className="flex items-center gap-2 text-sm font-medium text-[var(--brand-accent)] border border-[var(--brand-accent)/30] rounded-full px-4 py-1.5 hover:bg-[var(--brand-accent)/5] transition"
            >
              Preview
              {totalAssets > 0 && (
                <span className="flex items-center justify-center bg-[var(--brand-accent)] text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5">
                  {totalAssets}
                </span>
              )}
              <ChevronRight size={14} />
            </button>
          );
        })()}
      </div>

      {/* Lightbox */}
      {lightbox && (() => {
        const t = templates.find(t => t.id === lightbox.templateId)!;
        const maxW = 1200, maxH = 720;
        const scale = Math.min(maxW / t.width, maxH / t.height);
        return (
          <div
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-8"
            onClick={() => setLightbox(null)}
          >
            <div onClick={e => e.stopPropagation()}>
              <AdTemplate projectId={id} templateId={t.id} offer={lightbox.slotOffers?.[0] ?? selectedOffer} offers={lightbox.slotOffers} background={lightbox.bg} scale={scale} dealerName={project.dealerName} customFields={customTemplateFields[t.id]} />
            </div>
          </div>
        );
      })()}

      <SelectBackgroundDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setPendingAddContext(null); }}
        onAdd={handleAdd}
        initialFolder={pendingAddContext ? null : dialogFolder}
        initialSizeFilter={pendingAddContext?.templateId ?? null}
        vehicleFilter={
          pendingAddContext?.offerId
            ? (() => {
                const o = offers.find((off) => off.id === pendingAddContext.offerId);
                return o ? `${o.model} ${o.trim}` : undefined;
              })()
            : undefined
        }
        vehicleFilters={
          pendingAddContext?.offerId
            ? (() => {
                const combo = combinations.find((c) => c.id === pendingAddContext.offerId);
                if (!combo) return undefined;
                return buildComboVehicleFilters(combo, offers, multiTemplates);
              })()
            : undefined
        }
      />

      {taggingFile && (
        <LifestyleTaggingDialog
          file={taggingFile.file}
          imageUrl={taggingFile.url}
          onConfirm={(bg) => {
            setPendingAddContext(null);
            handleAdd([bg]);
            setTaggingFile(null);
          }}
          onCancel={() => setTaggingFile(null)}
        />
      )}
    </div>
  );
}

// ─── Key Message Fields Panel ─────────────────────────────────────────────────

function AddBackgroundMenu({ onOpenDialog, onClearAll, onLifestyleUpload }: { onOpenDialog: (folder: "recents" | "background-collections") => void; onClearAll: () => void; onLifestyleUpload: (file: File, url: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lifestyleInputRef = useRef<HTMLInputElement>(null);
  const { addBackgrounds } = useProjectStore();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const bg: BackgroundCollection = {
      id: `upload-${Date.now()}`,
      name: file.name.replace(/\.[^.]+$/, ""),
      type: "Background",
      sizes: 6,
      folder: "Uploads",
      color: "#888888",
      thumbnail: url,
      images: {
        "website-2000x500": url,
        "display-970x250": url,
        "display-300x250": url,
        "social-1080x1080": url,
        "website-600x450": url,
        "website-600x1067": url,
      },
    };
    addBackgrounds([bg]);
    setOpen(false);
    e.target.value = "";
  }

  function handleLifestyleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onLifestyleUpload(file, url);
    setOpen(false);
    e.target.value = "";
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-[13px] font-medium text-white bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] px-2.5 py-1 rounded-full transition"
      >
        <Plus size={16} />
        Add Background
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-30 min-w-[220px]">
          <button onClick={() => { onOpenDialog("recents"); setOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-left">
            <FileImage size={16} className="text-gray-400 shrink-0" />
            Background from Portal
          </button>
          <button onClick={() => { onOpenDialog("background-collections"); setOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-left">
            <Share2 size={16} className="text-gray-400 shrink-0" />
            Collection from Portal
          </button>
          <button onClick={() => { fileInputRef.current?.click(); setOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-left">
            <Upload size={16} className="text-gray-400 shrink-0" />
            Upload
          </button>
          <button onClick={() => { lifestyleInputRef.current?.click(); setOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-violet-50 text-violet-700">
            <Sparkles size={16} className="text-violet-500 shrink-0" />
            Upload Lifestyle Image
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button onClick={() => { onClearAll(); setOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 text-left">
            <X size={16} className="text-gray-400 shrink-0" />
            Remove All
          </button>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      <input ref={lifestyleInputRef} type="file" accept="image/*" className="hidden" onChange={handleLifestyleUpload} />
    </div>
  );
}

function AIToolsIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path fillRule="evenodd" clipRule="evenodd" d="M13 7C13.4142 7 13.75 7.33579 13.75 7.75C13.75 10.1758 14.2859 11.7513 15.2673 12.7327C16.2487 13.7141 17.8242 14.25 20.25 14.25C20.6642 14.25 21 14.5858 21 15C21 15.4142 20.6642 15.75 20.25 15.75C17.8242 15.75 16.2487 16.2859 15.2673 17.2673C14.2859 18.2487 13.75 19.8242 13.75 22.25C13.75 22.6642 13.4142 23 13 23C12.5858 23 12.25 22.6642 12.25 22.25C12.25 19.8242 11.7141 18.2487 10.7327 17.2673C9.75127 16.2859 8.17581 15.75 5.75 15.75C5.33579 15.75 5 15.4142 5 15C5 14.5858 5.33579 14.25 5.75 14.25C8.17581 14.25 9.75127 13.7141 10.7327 12.7327C11.7141 11.7513 12.25 10.1758 12.25 7.75C12.25 7.33579 12.5858 7 13 7ZM13 12.0086C12.699 12.6893 12.3008 13.2859 11.7934 13.7934C11.2859 14.3008 10.6893 14.699 10.0086 15C10.6893 15.301 11.2859 15.6992 11.7934 16.2066C12.3008 16.7141 12.699 17.3107 13 17.9914C13.301 17.3107 13.6992 16.7141 14.2066 16.2066C14.7141 15.6992 15.3107 15.301 15.9914 15C15.3107 14.699 14.7141 14.3008 14.2066 13.7934C13.6992 13.2859 13.301 12.6893 13 12.0086Z" fill="currentColor"/>
      <path d="M6 5.5C6 5.22386 5.77614 5 5.5 5C5.22386 5 5 5.22386 5 5.5C5 6.48063 4.78279 7.0726 4.4277 7.4277C4.0726 7.78279 3.48063 8 2.5 8C2.22386 8 2 8.22386 2 8.5C2 8.77614 2.22386 9 2.5 9C3.48063 9 4.0726 9.21721 4.4277 9.5723C4.78279 9.9274 5 10.5194 5 11.5C5 11.7761 5.22386 12 5.5 12C5.77614 12 6 11.7761 6 11.5C6 10.5194 6.21721 9.9274 6.5723 9.5723C6.9274 9.21721 7.51937 9 8.5 9C8.77614 9 9 8.77614 9 8.5C9 8.22386 8.77614 8 8.5 8C7.51937 8 6.9274 7.78279 6.5723 7.4277C6.21721 7.0726 6 6.48063 6 5.5Z" fill="currentColor"/>
      <path d="M11 1.5C11 1.22386 10.7761 1 10.5 1C10.2239 1 10 1.22386 10 1.5C10 2.13341 9.85918 2.47538 9.66728 2.66728C9.47538 2.85918 9.13341 3 8.5 3C8.22386 3 8 3.22386 8 3.5C8 3.77614 8.22386 4 8.5 4C9.13341 4 9.47538 4.14082 9.66728 4.33272C9.85918 4.52462 10 4.86659 10 5.5C10 5.77614 10.2239 6 10.5 6C10.7761 6 11 5.77614 11 5.5C11 4.86659 11.1408 4.52462 11.3327 4.33272C11.5246 4.14082 11.8666 4 12.5 4C12.7761 4 13 3.77614 13 3.5C13 3.22386 12.7761 3 12.5 3C11.8666 3 11.5246 2.85918 11.3327 2.66728C11.1408 2.47538 11 2.13341 11 1.5Z" fill="currentColor"/>
    </svg>
  );
}

function PortalIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.83203 6.11114V17.2222M8.38759 5.22225V18.1111M19.4987 6.42899V16.9044C19.4987 17.3245 19.2047 17.6872 18.7936 17.7741L13.0159 18.9955C12.4632 19.1123 11.9431 18.6907 11.9431 18.1258V5.20758C11.9431 4.64268 12.4632 4.22108 13.0159 4.33791L18.7936 5.55932C19.2047 5.6462 19.4987 6.00892 19.4987 6.42899Z" />
    </svg>
  );
}

// ─── EmptyAddMenu ─────────────────────────────────────────────────────────────
// Dropdown button used in the Backgrounds empty state.
// "solid" variant = Add Collection (indigo filled)
// "outline" variant = Add Lifestyle (indigo outlined)

function EmptyAddMenu({
  label,
  variant = "solid",
  onFromPortal,
  onUpload,
  multiple = false,
}: {
  label: string;
  variant?: "solid" | "outline";
  onFromPortal: () => void;
  onUpload: (files: File[]) => void;
  multiple?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onUpload(files);
    e.target.value = "";
  }

  const btnClass = variant === "solid"
    ? "flex items-center gap-1.5 text-xs font-semibold text-white bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] px-4 py-2 rounded-full transition"
    : "flex items-center gap-1.5 text-xs font-semibold text-[var(--brand-accent)] bg-white hover:bg-[var(--brand-accent)/8] border border-[var(--brand-accent)/20] px-4 py-2 rounded-full transition";

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)} className={btnClass}>
        <Plus size={13} />
        {label}
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-30 min-w-[190px]">
          <button
            onClick={() => { onFromPortal(); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-left"
          >
            <PortalIcon className="text-gray-400 shrink-0" />
            From Portal
          </button>
          <button
            onClick={() => { fileInputRef.current?.click(); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-left"
          >
            <Upload size={15} className="text-gray-400 shrink-0" />
            Upload
          </button>
          <button
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-left"
          >
            <AIToolsIcon className="text-gray-400 shrink-0" />
            Create with AI
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

// ─── BrandKitSection ─────────────────────────────────────────────────────────

// ─── Brand kit name-matching helper ──────────────────────────────────────────
// Returns true if any meaningful word in the kit name appears in the project
// name or dealer name (case-insensitive, punctuation-normalised).
// "Meaningful" = longer than 2 chars, to skip noise like "de", "of", etc.
function kitMatchesProjectName(
  kitName: string,
  projectName: string,
  dealerName: string
): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[-_]/g, " ");
  const haystack = norm(`${projectName} ${dealerName}`);
  const needles = norm(kitName).split(/\s+/).filter((w) => w.length > 2);
  return needles.length > 0 && needles.every((w) => haystack.includes(w));
}

interface BrandKitSectionProps {
  offers: import("@projects/lib/mock-data").Offer[];
  projectId: string;
  projectName: string;
  dealerName: string;
  templates: import("@projects/lib/mock-data").Template[];
  activeBrandKitIds: Record<string, string>; // make → kitId
  onSetActiveBrandKit: (projectId: string, make: string, kitId: string) => void;
  activeLogoIds: Record<string, Record<string, string>>; // make → slotType → logoId
  onSetLogoId: (projectId: string, make: string, slotType: string, logoId: string) => void;
  activeColors: Record<string, [string, string]>; // make → [textColor, btnColor]
  onSetColor: (projectId: string, make: string, index: 0 | 1, color: string) => void;
  compact?: boolean;
  /** Used when there are no offers — shows a brand kit row for this make with a blank selector */
  fallbackMake?: string;
}

function BrandKitSection({
  offers, projectId, projectName, dealerName, templates,
  activeBrandKitIds, onSetActiveBrandKit,
  activeLogoIds, onSetLogoId,
  activeColors, onSetColor,
  compact = false,
  fallbackMake,
}: BrandKitSectionProps) {
  // Derive slot types used across all project templates (deduplicated, ordered)
  const slotTypes = Array.from(
    new Set(templates.flatMap((t) => t.logoSlots ?? []))
  );

  // Makes from offers; fall back to fallbackMake when no offers (e.g. pharma project)
  const offerMakes = Array.from(new Set(offers.map((o) => o.make)));
  const makes = offerMakes.length > 0 ? offerMakes : fallbackMake ? [fallbackMake] : [];

  // For each make, resolve the active kit using this priority:
  //   1. Explicit user selection stored in activeBrandKitIds
  //   2. OEM match from offers (automotive)
  //   3. Name match — kit name words appear in project name / dealer name
  //   4. null (blank — user must pick manually)
  const makeKits = makes
    .map((make) => {
      const available = brandKits;
      const activeKitId = activeBrandKitIds[make];
      const byName = available.find((k) =>
        kitMatchesProjectName(k.name, projectName, dealerName)
      ) ?? null;
      const activeKit = activeKitId
        ? available.find((k) => k.id === activeKitId) ?? null
        : available.find((k) => k.oem === make)       // OEM match (automotive)
          ?? byName                                     // name match (any project)
          ?? null;                                      // blank — user picks
      return { make, available, activeKit };
    });

  if (makeKits.length === 0) return null;

  if (compact) {
    return (
      <div className="flex items-center flex-wrap">
        {makeKits.map(({ make, available, activeKit }, i) => {
          const storedColors = activeColors[make] as [string, string] | undefined;
          const makeActiveColors: [string, string] = storedColors ?? [activeKit?.colors[0] ?? "#000000", activeKit?.colors[1] ?? "#000000"];
          return (
            <div key={make} className="flex items-center">
              {i > 0 && <div className="w-px h-10 bg-gray-300 mx-4 shrink-0" />}
              <BrandKitRow
                make={make}
                available={available}
                activeKit={activeKit}
                slotTypes={slotTypes}
                activeLogoIds={activeLogoIds[make] ?? {}}
                activeColors={makeActiveColors}
                onSelectKit={(kitId) => onSetActiveBrandKit(projectId, make, kitId)}
                onSetLogoId={(slotType, logoId) => onSetLogoId(projectId, make, slotType, logoId)}
                onSetColor={(idx, color) => onSetColor(projectId, make, idx, color)}
                compact
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-900 mb-1">Logos</h2>
      <p className="text-xs text-gray-400 mb-5">
        Logo slots detected from this project's templates. Click a slot to swap the logo.
      </p>
      <div className="space-y-6">
        {makeKits.map(({ make, available, activeKit }) => {
          const storedColors = activeColors[make] as [string, string] | undefined;
          const makeActiveColors: [string, string] = storedColors ?? [activeKit?.colors[0] ?? "#000000", activeKit?.colors[1] ?? "#000000"];
          return (
            <BrandKitRow
              key={make}
              make={make}
              available={available}
              activeKit={activeKit}
              slotTypes={slotTypes}
              activeLogoIds={activeLogoIds[make] ?? {}}
              activeColors={makeActiveColors}
              onSelectKit={(kitId) => onSetActiveBrandKit(projectId, make, kitId)}
              onSetLogoId={(slotType, logoId) => onSetLogoId(projectId, make, slotType, logoId)}
              onSetColor={(idx, color) => onSetColor(projectId, make, idx, color)}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Single brand kit row ─────────────────────────────────────────────────────

function formatSlotType(slotType: string) {
  return slotType.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

/** Split "primary-square" → ["Primary", "Square"], "event-horizontal" → ["Event", "Horizontal"] */
function splitSlotLabel(slotType: string): [string, string] {
  const parts = slotType.split("-");
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return [cap(parts[0]), parts.slice(1).map(cap).join(" ")];
}

type LogoEntry = { image: string; label: string; sublabel: string };

function getActiveLogoForSlot(
  kit: import("@projects/lib/mock-data").BrandKit,
  slotType: string,
  storedLogoId: string | undefined
): LogoEntry | undefined {
  // Data URL = user-uploaded logo
  if (storedLogoId && (storedLogoId.startsWith("data:") || storedLogoId.startsWith("blob:"))) {
    return { image: storedLogoId, label: formatSlotType(slotType), sublabel: "Uploaded" };
  }
  const candidates = kit.logos.filter((l) => l.id.startsWith(slotType + "-"));
  if (storedLogoId) {
    const match = candidates.find((l) => l.id === storedLogoId);
    if (match) return match;
  }
  // Default: prefer "positive" variant
  return candidates.find((l) => l.id === slotType + "-positive") ?? candidates[0];
}

// ─── COLOR_LABELS ─────────────────────────────────────────────────────────────
const COLOR_LABELS: [string, string] = ["Text", "Button"];

// ─── ColorSwatchButton ───────────────────────────────────────────────────────
// Defined at the top level (NOT inside BrandKitRow) so React never sees it as a
// new component type on re-render — prevents focus loss after the first keystroke.
function ColorSwatchButton({
  idx,
  size = 20,
  tip,
  activeColors,
  openColorIdx,
  hexInput,
  onToggle,
  onNativeChange,
  onHexChange,
}: {
  idx: 0 | 1;
  size?: number;
  tip?: string;
  activeColors: [string, string];
  openColorIdx: 0 | 1 | null;
  hexInput: string;
  onToggle: (idx: 0 | 1) => void;
  onNativeChange: (hex: string) => void;
  onHexChange: (raw: string) => void;
}) {
  const color = activeColors[idx];
  const isOpen = openColorIdx === idx;
  const defaultTip = idx === 0 ? "Override text color across all assets" : "Override button color across all assets";
  return (
    <TipWrapper tip={tip ?? defaultTip}>
    <div className="relative shrink-0">
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(idx); }}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: color,
          border: isOpen
            ? "2px solid #6366f1"
            : `1px solid rgba(0,0,0,${color === "#ffffff" || color === "#FFFFFF" ? "0.25" : "0.15"})`,
          flexShrink: 0,
          cursor: "pointer",
          transition: "border 0.1s",
        }}
      />
      {isOpen && (
        <div
          className="absolute bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-3"
          style={{ top: size + 6, left: 0, minWidth: 196 }}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-xs font-medium text-gray-500 mb-2">{COLOR_LABELS[idx]} Color</p>
          {/* Native color picker — full-width, ~80px tall */}
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(hexInput) ? hexInput : activeColors[idx]}
            onChange={(e) => onNativeChange(e.target.value)}
            style={{ width: "100%", height: 80, padding: 0, border: "none", cursor: "pointer", borderRadius: 8 }}
          />
          {/* Hex text input */}
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-xs text-gray-400 font-mono">#</span>
            <input
              type="text"
              value={hexInput.replace(/^#/, "")}
              maxLength={6}
              onChange={(e) => onHexChange("#" + e.target.value)}
              placeholder="000000"
              className="flex-1 text-xs font-mono border border-gray-200 rounded-md px-2 py-1.5 focus:border-[var(--brand-accent)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--brand-accent)]/30 uppercase"
            />
          </div>
        </div>
      )}
    </div>
    </TipWrapper>
  );
}

function BrandKitRow({
  make,
  available,
  activeKit,
  slotTypes,
  activeLogoIds,
  activeColors,
  onSelectKit,
  onSetLogoId,
  onSetColor,
  compact = false,
}: {
  make: string;
  available: import("@projects/lib/mock-data").BrandKit[];
  activeKit: import("@projects/lib/mock-data").BrandKit | null;
  slotTypes: string[];
  activeLogoIds: Record<string, string>; // slotType → logoId
  activeColors: [string, string]; // [textColor, btnColor]
  onSelectKit: (kitId: string) => void;
  onSetLogoId: (slotType: string, logoId: string) => void;
  onSetColor: (index: 0 | 1, color: string) => void;
  compact?: boolean;
}) {
  const [openSlot, setOpenSlot] = useState<string | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (rowRef.current && !rowRef.current.contains(e.target as Node)) {
        setOpenSlot(null);
        setOpenColorIdx(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const [kitDropdownOpen, setKitDropdownOpen] = useState(false);
  const kitDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKitClick(e: MouseEvent) {
      if (kitDropdownRef.current && !kitDropdownRef.current.contains(e.target as Node)) {
        setKitDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleKitClick);
    return () => document.removeEventListener("mousedown", handleKitClick);
  }, []);

  // ── Color picker state ────────────────────────────────────────────────────
  const [openColorIdx, setOpenColorIdx] = useState<0 | 1 | null>(null);
  // hexInput tracks what the user is typing; may be invalid mid-edit
  const [hexInput, setHexInput] = useState<string>("#000000");

  function openColorPicker(idx: 0 | 1) {
    setOpenColorIdx(idx);
    setHexInput(activeColors[idx]);
  }

  function handleColorChange(raw: string) {
    setHexInput(raw);
    if (/^#[0-9a-fA-F]{6}$/.test(raw) && openColorIdx !== null) {
      onSetColor(openColorIdx, raw);
    }
  }

  function handleNativeColorChange(hex: string) {
    setHexInput(hex);
    if (openColorIdx !== null) onSetColor(openColorIdx, hex);
  }

  function handleColorToggle(idx: 0 | 1) {
    if (openColorIdx === idx) {
      setOpenColorIdx(null);
    } else {
      openColorPicker(idx);
    }
  }

  const tileSize = compact ? 36 : 56;

  // Slot tiles only available once a kit is selected
  const slotTiles = activeKit ? slotTypes.map((slotType) => {
    const logos = activeKit.logos.filter((l) => l.id.startsWith(slotType + "-"));
    const activeLogo = getActiveLogoForSlot(activeKit, slotType, activeLogoIds[slotType]);
    const isEmpty = !activeLogo;
    const isOpen = openSlot === slotType;
    const isHoriz = slotType.includes("horizontal");

    const [slotTitle, slotSubtitle] = splitSlotLabel(slotType);

    const tileButton = isEmpty ? (
      <button
        onClick={() => setOpenSlot(isOpen ? null : slotType)}
        className={`flex items-center gap-3 px-2 py-1.5 rounded-xl transition ${
          isOpen ? "bg-[var(--brand-accent)/8]" : "hover:bg-black/5"
        }`}
      >
        <div style={{
          width: tileSize, height: tileSize, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.3,
        }}>
          <imgIcon size={tileSize * 0.45} className="text-gray-400"  />
        </div>
        {!compact && (
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-400 leading-tight">{slotTitle}</p>
            <p className="text-xs text-gray-400 leading-tight">{slotSubtitle}</p>
          </div>
        )}
      </button>
    ) : (
      <button
        onClick={() => setOpenSlot(isOpen ? null : slotType)}
        className={`flex items-center gap-3 px-2 py-1.5 rounded-xl transition ${
          isOpen ? "bg-[var(--brand-accent)/8]" : "hover:bg-black/5"
        }`}
      >
        <LogoTile src={activeLogo!.image} alt={activeLogo!.label} horizontal={isHoriz} size={tileSize} bare />
        {!compact && (
          <div className="text-left">
            <p className="text-sm text-gray-800 leading-tight">{slotTitle}</p>
            <p className="text-xs text-gray-500 leading-tight">{slotSubtitle}</p>
          </div>
        )}
      </button>
    );

    return (
      <div key={slotType} className="relative">
        <TipWrapper tip="Override logo across all assets">
          {tileButton}
        </TipWrapper>
        {isOpen && (
          <LogoPicker
            make={activeKit.oem}
            slotType={slotType}
            selectedLogoId={activeLogoIds[slotType]}
            onSelectLogo={(logoId) => { onSetLogoId(slotType, logoId); setOpenSlot(null); }}
            onUpload={(dataUrl) => { onSetLogoId(slotType, dataUrl); setOpenSlot(null); }}
            onRevert={() => { onSetLogoId(slotType, ""); setOpenSlot(null); }}
            onClose={() => setOpenSlot(null)}
          />
        )}
      </div>
    );
  }) : [];

  if (compact) {
    return (
      <div className="flex items-center gap-2" ref={rowRef}>
        {/* Kit selector (compact) */}
        <TipWrapper tip="Swap Brand Kit across all assets">
        <div className="relative" ref={kitDropdownRef}>
          <button
            onClick={() => setKitDropdownOpen((v) => !v)}
            className="flex items-center gap-1.5 border border-gray-200 rounded px-2 py-1.5 bg-white transition text-xs cursor-pointer hover:bg-gray-50"
          >
            {activeKit ? <BrandLogoIcon kit={activeKit} size={14} /> : <span className="w-3.5 h-3.5 rounded bg-gray-200 shrink-0" />}
            <span className="text-gray-700">{activeKit ? activeKit.name : "Select…"}</span>
            <ChevronDown size={11} className="text-gray-400" />
          </button>
          {kitDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden min-w-[160px]">
              {available.map((kit) => (
                <button key={kit.id} onClick={() => { onSelectKit(kit.id); onSetColor(0, kit.colors[0] ?? "#000000"); onSetColor(1, kit.colors[1] ?? "#000000"); setKitDropdownOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-gray-50 transition ${kit.id === activeKit?.id ? "text-[var(--brand-accent)] font-medium" : "text-gray-700"}`}>
                  <BrandLogoIcon kit={kit} size={14} />
                  {kit.name}
                  {kit.id === activeKit?.id && <Check size={11} className="ml-auto text-[var(--brand-accent)]" />}
                </button>
              ))}
            </div>
          )}
        </div>
        </TipWrapper>
        {slotTiles}
        {/* Color swatches (compact) */}
        <ColorSwatchButton idx={0} size={24} activeColors={activeColors} openColorIdx={openColorIdx} hexInput={hexInput} onToggle={handleColorToggle} onNativeChange={handleNativeColorChange} onHexChange={handleColorChange} />
        <ColorSwatchButton idx={1} size={24} activeColors={activeColors} openColorIdx={openColorIdx} hexInput={hexInput} onToggle={handleColorToggle} onNativeChange={handleNativeColorChange} onHexChange={handleColorChange} />
      </div>
    );
  }

  return (
    <div className="flex items-end gap-4 flex-wrap" ref={rowRef}>
      {/* Make label + kit selector */}
      <div className="shrink-0">
        <p className="text-xs font-semibold text-gray-500 tracking-wide mb-2">{make} Assets</p>
        <TipWrapper tip="Swap Brand Kit across all assets">
          <div className="relative" ref={kitDropdownRef}>
            <button
              onClick={() => setKitDropdownOpen((v) => !v)}
              className="flex items-center gap-2 border border-gray-200 rounded px-3 h-[42px] bg-white w-44 cursor-pointer hover:bg-gray-50 transition"
            >
              {activeKit
                ? <BrandLogoIcon kit={activeKit} size={16} />
                : <span className="w-4 h-4 rounded bg-gray-200 shrink-0" />}
              <span className="text-sm text-gray-800 flex-1 text-left truncate">
                {activeKit ? activeKit.name : "Select brand kit…"}
              </span>
              <ChevronDown size={14} className="text-gray-400 shrink-0" />
            </button>
            {kitDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden min-w-[180px]">
                {available.map((kit) => (
                  <button key={kit.id} onClick={() => { onSelectKit(kit.id); onSetColor(0, kit.colors[0] ?? "#000000"); onSetColor(1, kit.colors[1] ?? "#000000"); setKitDropdownOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-gray-50 transition ${kit.id === activeKit?.id ? "text-[var(--brand-accent)] font-medium" : "text-gray-700"}`}>
                    <BrandLogoIcon kit={kit} size={16} />
                    {kit.name}
                    {kit.id === activeKit?.id && <Check size={13} className="ml-auto text-[var(--brand-accent)]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </TipWrapper>
      </div>

      {/* Color swatches and slot tiles — only shown once a kit is selected */}
      {activeKit && <>
        <div className="flex items-center gap-2 shrink-0">
          <ColorSwatchButton idx={0} size={36} activeColors={activeColors} openColorIdx={openColorIdx} hexInput={hexInput} onToggle={handleColorToggle} onNativeChange={handleNativeColorChange} onHexChange={handleColorChange} />
          <ColorSwatchButton idx={1} size={36} activeColors={activeColors} openColorIdx={openColorIdx} hexInput={hexInput} onToggle={handleColorToggle} onNativeChange={handleNativeColorChange} onHexChange={handleColorChange} />
        </div>
        <div className="flex items-center gap-3 flex-wrap -mb-1.5">
          {slotTiles}
        </div>
      </>}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Small brand logo icon in the kit dropdown — falls back to a colored monogram if image missing */
function BrandLogoIcon({ kit, size }: { kit: import("@projects/lib/mock-data").BrandKit; size: number }) {
  const [errored, setErrored] = useState(false);
  const primaryLogo = kit.logos.find((l) => l.id.startsWith("primary-square")) ?? kit.logos[0];
  if (errored || !primaryLogo) {
    return (
      <div style={{ width: size, height: size, borderRadius: 4, background: kit.colors[0], border: "1px solid rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontSize: size * 0.5, fontWeight: 700, color: kit.colors[1] ?? "#000" }}>
          {kit.name[0]}
        </span>
      </div>
    );
  }
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <img src={primaryLogo.image} alt={kit.name} className="absolute inset-0 w-full h-full object-contain" onError={() => setErrored(true)} />
    </div>
  );
}

/** Logo tile — square or horizontal, with fallback "No logo".
 *  bare=true removes the white background and border (for slot display on gray bg). */
function LogoTile({ src, alt, horizontal, size, bare = false }: { src: string; alt: string; horizontal: boolean; size: number; bare?: boolean }) {
  const [errored, setErrored] = useState(false);
  const w = horizontal ? Math.round(size * 2.2) : size;
  const h = size;

  if (bare) {
    return errored ? null : (
      // Use <img> directly for bare mode — avoids fill/overflow issues on transparent bg
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        style={{ width: w, height: h, objectFit: "contain", flexShrink: 0, display: "block" }}
        onError={() => setErrored(true)}
      />
    );
  }

  return (
    <div style={{ width: w, height: h, borderRadius: 6, background: "#f9fafb", border: "1px solid rgba(0,0,0,0.1)", overflow: "hidden", position: "relative", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {errored ? (
        <span style={{ fontSize: 10, color: "#aaa", textAlign: "center", padding: 4 }}>No logo</span>
      ) : (
        <img src={src} alt={alt} className="absolute inset-0 w-full h-full object-contain p-1.5" onError={() => setErrored(true)} />
      )}
    </div>
  );
}

/** @deprecated use LogoTile */
function LogoSquare({ src, alt, size }: { src: string; alt: string; size: number }) {
  return <LogoTile src={src} alt={alt} horizontal={false} size={size} />;
}


function HondaPrimaryLogoMini() {
  return (
    <div className="w-8 h-8 rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm relative">
      <img src="https://res.cloudinary.com/dvq75cqna/image/upload/v1780071713/vw-funds/public/logos/Honda-Logo.png" alt="Honda" className="absolute inset-0 w-full h-full object-contain p-0.5"  />
    </div>
  );
}

function HondaEventLogoMini() {
  return (
    <div className="w-8 h-8 rounded-full border border-gray-200 bg-white overflow-hidden shadow-sm relative">
      <img src="https://res.cloudinary.com/dvq75cqna/image/upload/v1780071714/vw-funds/public/logos/Spring-Event-Logo.png" alt="Honda Spring Event" className="absolute inset-0 w-full h-full object-contain"  />
    </div>
  );
}

// ─── Fine Tune: Group by Template accordion ───────────────────────────────────

function TemplateGroupAccordion({ template, offers, dataRows = [], make = "", open, onToggle, onDelete, onAddBackground, onAddAll, dealerName, projectId }: { template: import("@projects/lib/mock-data").Template; offers: import("@projects/lib/mock-data").Offer[]; dataRows?: import("@projects/lib/project-store").DataRow[]; make?: string; open: boolean; onToggle: () => void; onDelete: (offerId: string) => void; onAddBackground: (offerId: string) => void; onAddAll: () => void; dealerName: string; projectId: string }) {
  const [lightbox, setLightbox] = useState<{ bg: BackgroundCollection; offer: import("@projects/lib/mock-data").Offer; slotOffers?: import("@projects/lib/mock-data").Offer[] } | null>(null);
  const [editorBg, setEditorBg] = useState<{ bg: BackgroundCollection; offer: import("@projects/lib/mock-data").Offer } | null>(null);
  const { getBackgroundsForTemplate, getBackgroundsForOfferTemplate, excludeBackgroundFromOfferTemplate, includeBackgroundForOfferTemplate, combinations, setCombinationOfferAtSlot, customTemplateFields } = useProjectStore();
  const bgs = getBackgroundsForTemplate(template.id);
  const scale = thumbnailScale(template.width, template.height);
  const usesDataRows = offers.length === 0 && dataRows.length > 0;

  const isMulti = (template.products ?? 1) > 1;
  const slotCount = template.products ?? 1;

  // Per-offer filtered backgrounds (reflects offer-level exclusions from other views)
  const offerBgsMap = !isMulti ? Object.fromEntries(
    offers.map((o) => [o.id, getBackgroundsForOfferTemplate(o.id, template.id)])
  ) : {};

  const total = isMulti
    ? combinations.reduce((sum, c) => sum + getBackgroundsForOfferTemplate(c.id, template.id).length, 0)
    : usesDataRows
      ? dataRows.reduce((sum, r) => sum + getBackgroundsForOfferTemplate(r.id, template.id).length, 0)
      : offers.reduce((sum, o) => sum + (offerBgsMap[o.id]?.length ?? 0), 0);

  // Deduplicated backgrounds actually used under this template (union across offers/rows/combos)
  const activeBackgrounds = [...new Map(
    (isMulti
      ? combinations.flatMap((c) => getBackgroundsForOfferTemplate(c.id, template.id))
      : usesDataRows
        ? dataRows.flatMap((r) => getBackgroundsForOfferTemplate(r.id, template.id))
        : offers.flatMap((o) => getBackgroundsForOfferTemplate(o.id, template.id))
    ).map((bg) => [bg.id, bg])
  ).values()];

  // ── Per-offer helpers (subsection level) — only relevant for single-product ──
  function hasRemovedBackgrounds(offerId: string): boolean {
    if (isMulti) return false;
    return (offerBgsMap[offerId]?.length ?? 0) < bgs.length;
  }

  function restoreOffer(offerId: string) {
    bgs.forEach((bg) => {
      includeBackgroundForOfferTemplate(offerId, template.id, bg.id);
    });
  }

  // ── Template-level helpers (header level) ────────────────────────────────
  function hasAnyRemovedBackgrounds(): boolean {
    if (isMulti) return combinations.some(c => getBackgroundsForOfferTemplate(c.id, template.id).length < bgs.length);
    return offers.some((o) => hasRemovedBackgrounds(o.id));
  }

  function deleteAllForTemplate() {
    if (isMulti) {
      combinations.forEach((c) =>
        getBackgroundsForOfferTemplate(c.id, template.id).forEach((bg) =>
          excludeBackgroundFromOfferTemplate(c.id, template.id, bg.id)
        )
      );
    } else if (usesDataRows) {
      dataRows.forEach((r) => {
        getBackgroundsForOfferTemplate(r.id, template.id).forEach((bg) => {
          excludeBackgroundFromOfferTemplate(r.id, template.id, bg.id);
        });
      });
    } else {
      offers.forEach((o) => {
        (offerBgsMap[o.id] ?? []).forEach((bg) => {
          excludeBackgroundFromOfferTemplate(o.id, template.id, bg.id);
        });
      });
    }
  }

  function restoreAllForTemplate() {
    if (isMulti) {
      combinations.forEach((c) =>
        bgs.forEach((bg) => includeBackgroundForOfferTemplate(c.id, template.id, bg.id))
      );
    } else if (usesDataRows) {
      dataRows.forEach((r) => {
        bgs.forEach((bg) => {
          includeBackgroundForOfferTemplate(r.id, template.id, bg.id);
        });
      });
    } else {
      offers.forEach((o) => {
        bgs.forEach((bg) => {
          includeBackgroundForOfferTemplate(o.id, template.id, bg.id);
        });
      });
    }
  }

  return (
    <div className="rounded-lg bg-white">
      <div
        role="button" tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onToggle()}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer rounded-lg group/row"
      >
        {open ? <ChevronDown size={15} className="text-gray-400 shrink-0" /> : <ChevronRight size={15} className="text-gray-400 shrink-0" />}
        {/* Template mini-preview */}
        <div className="w-10 h-10 shrink-0 flex items-center justify-center overflow-hidden">
          <TemplateWireframe
            templateId={template.id}
            scale={Math.min(40 / template.width, 40 / template.height)}
          />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center">
            <p className="text-sm font-semibold text-gray-900 truncate">{template.name}</p>
            <SubsectionActions
              onDelete={deleteAllForTemplate}
              onAddBackground={onAddAll}
              deleteTip="Delete all assets under this Template"
              editTip="Edit all assets under this Template"
              onRestore={hasAnyRemovedBackgrounds() ? restoreAllForTemplate : undefined}
              restoreTip="Use all backgrounds added for this Template"
            />
          </div>
          <p className="text-xs text-gray-400">{template.width} × {template.height} · {usesDataRows ? `${dataRows.length} row${dataRows.length !== 1 ? "s" : ""}` : `${offers.length} offer${offers.length !== 1 ? "s" : ""}`} · {total} asset{total !== 1 ? "s" : ""}</p>
        </div>
        {!open && activeBackgrounds.length > 0 && (
          <div className="relative flex items-center shrink-0">
            <span className="absolute -top-2 -right-1 z-10 w-5 h-5 flex items-center justify-center bg-[var(--brand-accent)] text-white text-[10px] font-bold rounded-full">
              {activeBackgrounds.length}
            </span>
            <div className="flex gap-0.5">
              {activeBackgrounds.slice(0, 4).map((bg) => (
                <div key={bg.id} className="w-[38px] h-[26px] rounded border border-gray-200 shrink-0 overflow-hidden relative">
                  <img src={getSquareThumbnail(bg)} alt={bg.name} className="absolute inset-0 w-full h-full object-cover"  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {open && (
        <div className="border-t border-gray-100">
          {isMulti ? (
            // Multi-product: one row per combination
            combinations.map((combo, comboIdx) => {
              const comboSlotOffers = Array.from({ length: slotCount }, (_, i) =>
                offers.find((o) => o.id === (combo.offerIds[i] ?? offers[i]?.id))
              ).filter(Boolean) as typeof offers;
              const comboBgs = getBackgroundsForOfferTemplate(combo.id, template.id);
              const hasRemoved = comboBgs.length < bgs.length;
              return (
                <div key={combo.id} className={`px-4 py-3 group/row ${comboIdx < combinations.length - 1 ? "border-b border-gray-50" : ""}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      {comboSlotOffers.map((offer, i) => (
                        <OfferSlotThumbnail
                          key={i}
                          slotIndex={i}
                          offer={offer}
                          allOffers={offers}
                          onSelect={(id) => setCombinationOfferAtSlot(combo.id, i, id)}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-medium text-gray-700">Multiple offers</span>
                    <SubsectionActions
                      onDelete={() =>
                        comboBgs.forEach((bg) =>
                          excludeBackgroundFromOfferTemplate(combo.id, template.id, bg.id)
                        )
                      }
                      deleteTip="Remove all backgrounds for this combination"
                      onAddBackground={onAddAll}
                      onRestore={hasRemoved ? () =>
                        bgs.forEach((bg) =>
                          includeBackgroundForOfferTemplate(combo.id, template.id, bg.id)
                        ) : undefined}
                      restoreTip="Restore removed backgrounds"
                    />
                  </div>
                  <KeyMessageInlineInputs templateId={template.id} />
                  <div className="flex flex-wrap gap-2">
                    {comboBgs.map((bg) => (
                      <div key={bg.id} className="relative shrink-0 group">
                        <div className="overflow-hidden isolate">
                          <AdTemplate
                            projectId={projectId}
                            templateId={template.id}
                            offer={comboSlotOffers[0]}
                            offers={comboSlotOffers}
                            background={bg}
                            scale={scale}
                            customFields={customTemplateFields[template.id]}
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                          <button
                            onClick={() => setLightbox({ bg, offer: comboSlotOffers[0], slotOffers: comboSlotOffers })}
                            className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition shadow"
                          >
                            <Eye size={14} className="text-gray-700" />
                          </button>
                          <button
                            onClick={() => excludeBackgroundFromOfferTemplate(combo.id, template.id, bg.id)}
                            className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition shadow"
                          >
                            <Trash2 size={14} className="text-gray-700" />
                          </button>
                          <button
                            onClick={() => setEditorBg({ bg, offer: comboSlotOffers[0] })}
                            className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition shadow"
                          >
                            <Pencil size={14} className="text-gray-700" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            // Single-product: existing per-offer rows
            offers.map((offer, oidx) => (
              <div key={offer.id} className={`px-4 py-3 group/row hover:bg-gray-50 transition-colors ${oidx < offers.length - 1 ? "border-b border-gray-50" : ""}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative w-10 h-7 shrink-0">
                    <img src={offer.image} alt={offer.model} className="absolute inset-0 w-full h-full object-contain"  />
                  </div>
                  <span className="text-xs font-medium text-gray-700 truncate">
                    {offer.year} {offer.make} {offer.model} {offer.trim}
                  </span>
                  <SubsectionActions
                    onDelete={() => onDelete(offer.id)}
                    onAddBackground={() => onAddBackground(offer.id)}
                    deleteTip="Delete all assets under this Template/Offer"
                    editTip="Edit all assets under this Template/Offer"
                    onRestore={hasRemovedBackgrounds(offer.id) ? () => restoreOffer(offer.id) : undefined}
                    restoreTip="Use all backgrounds"
                  />
                  {/* Per-offer+template style override buttons */}
                  {(() => {
                    const slotTypes = Array.from(new Set((template as import("@projects/lib/mock-data").Template & { logoSlots?: string[] }).logoSlots ?? []));
                    return slotTypes.length > 0 && (
                      <StyleOverrideButtons
                        make={offer.make}
                        offerId={offer.id}
                        templateId={template.id}
                        scope="offerTemplate"
                        projectId={projectId}
                        slotTypes={slotTypes}
                      />
                    );
                  })()}
                </div>
                <div className="flex flex-wrap gap-2">
                  {offerBgsMap[offer.id].map((bg) => (
                    <div key={bg.id} className="relative shrink-0 group">
                      <div className="overflow-hidden isolate">
                        <AdTemplate projectId={projectId} templateId={template.id} offer={offer} background={bg} scale={scale} />
                      </div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                        <button onClick={() => setLightbox({ bg, offer })} className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition shadow">
                          <Eye size={14} className="text-gray-700" />
                        </button>
                        <button onClick={() => excludeBackgroundFromOfferTemplate(offer.id, template.id, bg.id)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition shadow">
                          <Trash2 size={14} className="text-gray-700" />
                        </button>
                        <button className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition shadow">
                          <Pencil size={14} className="text-gray-700" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {lightbox && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-8" onClick={() => setLightbox(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <AdTemplate
              projectId={projectId}
              templateId={template.id}
              offer={lightbox.offer}
              offers={lightbox.slotOffers}
              background={lightbox.bg}
              scale={Math.min(1200 / template.width, 720 / template.height)}
              dealerName={dealerName}
            />
          </div>
        </div>
      )}

      {editorBg && (
        <TemplateZoneEditor
          templateId={template.id}
          templateName={template.name}
          previewOffer={editorBg.offer}
          previewBackground={editorBg.bg}
          onClose={() => setEditorBg(null)}
        />
      )}
    </div>
  );
}

// ─── Fine Tune: Group by Background Collection accordion ──────────────────────

function BackgroundGroupAccordion({ bg, offers, templates, dataRows = [], make = "", open, onToggle, dealerName, projectId }: { bg: BackgroundCollection; offers: import("@projects/lib/mock-data").Offer[]; templates: import("@projects/lib/mock-data").Template[]; dataRows?: import("@projects/lib/project-store").DataRow[]; make?: string; open: boolean; onToggle: () => void; dealerName: string; projectId: string }) {
  const [lightbox, setLightbox] = useState<{ templateId: string; offer: import("@projects/lib/mock-data").Offer; slotOffers?: import("@projects/lib/mock-data").Offer[] } | null>(null);
  const [editorBg, setEditorBg] = useState<{ templateId: string; offer: import("@projects/lib/mock-data").Offer } | null>(null);
  const { getBackgroundsForOfferTemplate, excludeBackgroundFromOfferTemplate, includeBackgroundForOfferTemplate, combinations, setCombinationOfferAtSlot, customTemplateFields } = useProjectStore();

  const usesDataRows = offers.length === 0 && dataRows.length > 0;

  // Templates that have an image for this bg — uses resolveTemplateImage so
  // multi-product templates fall back to their single-product sibling key.
  const compatibleTemplates = templates.filter((t) => !!resolveTemplateImage(bg, t.id));

  const singleCompatible = compatibleTemplates.filter((t) => (t.products ?? 1) === 1);
  const multiCompatible = compatibleTemplates.filter((t) => (t.products ?? 1) > 1);

  // Visible templates per offer (those still included for this bg) — single-product only
  const visibleTemplatesMap = Object.fromEntries(
    offers.map((o) => [
      o.id,
      singleCompatible.filter((t) => getBackgroundsForOfferTemplate(o.id, t.id).some((b) => b.id === bg.id)),
    ])
  );

  // Visible templates per data row (pharma mode)
  const visibleTemplatesMapRows = Object.fromEntries(
    dataRows.map((r) => [
      r.id,
      compatibleTemplates.filter((t) => getBackgroundsForOfferTemplate(r.id, t.id).some((b) => b.id === bg.id)),
    ])
  );

  // Per-combination meta: which multi templates are visible + what slot offers to render
  const slotCount = multiCompatible[0]?.products ?? 3;
  const combosWithMeta = combinations.map((combo) => {
    const visibleTemplates = multiCompatible.filter((t) =>
      getBackgroundsForOfferTemplate(combo.id, t.id).some((b) => b.id === bg.id)
    );
    const slotOffers = Array.from({ length: slotCount }, (_, i) =>
      offers.find((o) => o.id === (combo.offerIds[i] ?? offers[i]?.id))
    ).filter(Boolean) as typeof offers;
    return { combo, visibleTemplates, slotOffers };
  });

  const totalMulti = combosWithMeta.reduce((sum, c) => sum + c.visibleTemplates.length, 0);
  const total = usesDataRows
    ? dataRows.reduce((sum, r) => sum + (visibleTemplatesMapRows[r.id]?.length ?? 0), 0)
    : offers.reduce((sum, o) => sum + visibleTemplatesMap[o.id].length, 0) + totalMulti;

  // ── Per-offer helpers (subsection level — single-product only) ───────────
  function deleteFromOffer(offerId: string) {
    (visibleTemplatesMap[offerId] ?? []).forEach((template) => {
      excludeBackgroundFromOfferTemplate(offerId, template.id, bg.id);
    });
  }

  function hasRemovedSingleTemplates(offerId: string): boolean {
    return (visibleTemplatesMap[offerId]?.length ?? 0) < singleCompatible.length;
  }

  function restoreOffer(offerId: string) {
    singleCompatible.forEach((t) => {
      includeBackgroundForOfferTemplate(offerId, t.id, bg.id);
    });
  }

  // ── Background-level helpers (header level) ──────────────────────────────
  function hasAnyRemovedTemplates(): boolean {
    if (usesDataRows) {
      return dataRows.some((r) => (visibleTemplatesMapRows[r.id]?.length ?? 0) < compatibleTemplates.length);
    }
    const singleRemoved = singleCompatible.length > 0 && offers.some((o) => hasRemovedSingleTemplates(o.id));
    const multiRemoved = combosWithMeta.some((c) => c.visibleTemplates.length < multiCompatible.length);
    return singleRemoved || multiRemoved;
  }

  function deleteAllForBackground() {
    if (usesDataRows) {
      dataRows.forEach((r) =>
        (visibleTemplatesMapRows[r.id] ?? []).forEach((t) =>
          excludeBackgroundFromOfferTemplate(r.id, t.id, bg.id)
        )
      );
    } else {
      offers.forEach((o) => deleteFromOffer(o.id));
      combinations.forEach((combo) =>
        multiCompatible.forEach((t) => excludeBackgroundFromOfferTemplate(combo.id, t.id, bg.id))
      );
    }
  }

  function restoreAllForBackground() {
    if (usesDataRows) {
      dataRows.forEach((r) =>
        compatibleTemplates.forEach((t) =>
          includeBackgroundForOfferTemplate(r.id, t.id, bg.id)
        )
      );
    } else {
      offers.forEach((o) => restoreOffer(o.id));
      combinations.forEach((combo) =>
        multiCompatible.forEach((t) => includeBackgroundForOfferTemplate(combo.id, t.id, bg.id))
      );
    }
  }

  return (
    <div className="rounded-lg bg-white">
      <div
        role="button" tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onToggle()}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer rounded-lg group/row"
      >
        {open ? <ChevronDown size={15} className="text-gray-400 shrink-0" /> : <ChevronRight size={15} className="text-gray-400 shrink-0" />}
        <div className="w-8 h-8 rounded-md shrink-0 overflow-hidden relative">
          <img src={getSquareThumbnail(bg)} alt={bg.name} className="absolute inset-0 w-full h-full object-cover"  />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center flex-wrap gap-x-[50px] gap-y-1">
            <div className="flex items-center">
              <p className="text-sm font-semibold text-gray-900 truncate">{bg.name}</p>
              <SubsectionActions
                onDelete={deleteAllForBackground}
                deleteTip="Delete all assets under this Background Collection"
                editTip="Edit all assets under this Background Collection"
                onRestore={hasAnyRemovedTemplates() ? restoreAllForBackground : undefined}
                restoreTip="Use all templates"
              />
            </div>
            {/* Style override buttons — one set per unique make, backgroundMake scope */}
            {(() => {
              const uniqueMakes = Array.from(new Set(offers.map((o) => o.make)));
              const slotTypes = Array.from(new Set(templates.flatMap((t) => (t as import("@projects/lib/mock-data").Template & { logoSlots?: string[] }).logoSlots ?? [])));
              return slotTypes.length > 0 ? uniqueMakes.map((make) => (
                <StyleOverrideButtons
                  key={make}
                  make={make}
                  bgId={bg.id}
                  scope="backgroundMake"
                  projectId={projectId}
                  slotTypes={slotTypes}
                />
              )) : null;
            })()}
          </div>
          <p className="text-xs text-gray-400">{usesDataRows ? `${dataRows.length} row${dataRows.length !== 1 ? "s" : ""}` : `${offers.length} offer${offers.length !== 1 ? "s" : ""}`} · {total} asset{total !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {open && (
        <div className="border-t border-gray-100">
          {usesDataRows ? (
            // ── Data-row mode (pharma) ────────────────────────────────────────
            dataRows.map((row, ridx) => {
              const rowTemplates = visibleTemplatesMapRows[row.id] ?? [];
              if (rowTemplates.length === 0) return null;
              const firstVal = Object.values(row.data).find((v) => v.trim() !== "");
              const rowLabel = firstVal ?? `Row ${ridx + 1}`;
              return (
                <div key={row.id} className={`px-4 py-3 group/row hover:bg-gray-50 transition-colors ${ridx < dataRows.length - 1 ? "border-b border-gray-50" : ""}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 shrink-0 flex items-center justify-center bg-[var(--brand-accent)/8] rounded-lg">
                      <span className="text-xs font-bold text-[var(--brand-accent)]">{ridx + 1}</span>
                    </div>
                    <span className="text-xs font-medium text-gray-700 truncate">{rowLabel}</span>
                    <SubsectionActions
                      onDelete={() => rowTemplates.forEach((t) => excludeBackgroundFromOfferTemplate(row.id, t.id, bg.id))}
                      deleteTip="Delete all assets under this Background/Row"
                      onRestore={rowTemplates.length < compatibleTemplates.length ? () => compatibleTemplates.forEach((t) => includeBackgroundForOfferTemplate(row.id, t.id, bg.id)) : undefined}
                      restoreTip="Restore all templates for this row"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {rowTemplates.map((template) => (
                      <div key={template.id} className="relative shrink-0 group">
                        <div className="overflow-hidden isolate rounded">
                          <PharmaAdTemplate
                            templateId={template.id}
                            background={bg}
                            scale={thumbnailScale(template.width, template.height)}
                            projectId={projectId}
                            make={make}
                            dataFields={row.data}
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                          <button onClick={() => excludeBackgroundFromOfferTemplate(row.id, template.id, bg.id)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition shadow">
                            <Trash2 size={14} className="text-gray-700" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
          <>
          {singleCompatible.length > 0 && offers.map((offer, oidx) => {
            const offerTemplates = visibleTemplatesMap[offer.id] ?? [];
            if (offerTemplates.length === 0) return null;
            return (
              <div key={offer.id} className={`px-4 py-3 group/row hover:bg-gray-50 transition-colors ${oidx < offers.length - 1 ? "border-b border-gray-50" : ""}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative w-10 h-7 shrink-0">
                    <img src={offer.image} alt={offer.model} className="absolute inset-0 w-full h-full object-contain"  />
                  </div>
                  <span className="text-xs font-medium text-gray-700 truncate">
                    {offer.year} {offer.make} {offer.model} {offer.trim}
                  </span>
                  <SubsectionActions
                    onDelete={() => deleteFromOffer(offer.id)}
                    deleteTip="Delete all assets under this Background Collection/Offer"
                    editTip="Edit all assets under this Background Collection/Offer"
                    onRestore={hasRemovedSingleTemplates(offer.id) ? () => restoreOffer(offer.id) : undefined}
                  />
                  {/* Per-offer style override buttons */}
                  {(() => {
                    const slotTypes = Array.from(new Set(templates.flatMap((t) => (t as import("@projects/lib/mock-data").Template & { logoSlots?: string[] }).logoSlots ?? [])));
                    return slotTypes.length > 0 && (
                      <StyleOverrideButtons
                        make={offer.make}
                        offerId={offer.id}
                        bgId={bg.id}
                        scope="offer"
                        projectId={projectId}
                        slotTypes={slotTypes}
                      />
                    );
                  })()}
                </div>
                <div className="flex flex-wrap gap-2">
                  {offerTemplates.map((template) => (
                    <div key={template.id} className="relative shrink-0 group">
                      <div className="overflow-hidden isolate">
                        <AdTemplate projectId={projectId} templateId={template.id} offer={offer} background={bg} scale={thumbnailScale(template.width, template.height)} />
                      </div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                        <button onClick={() => setLightbox({ templateId: template.id, offer })} className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition shadow">
                          <Eye size={14} className="text-gray-700" />
                        </button>
                        <button onClick={() => excludeBackgroundFromOfferTemplate(offer.id, template.id, bg.id)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition shadow">
                          <Trash2 size={14} className="text-gray-700" />
                        </button>
                        <button className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition shadow">
                          <Pencil size={14} className="text-gray-700" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {combosWithMeta.map(({ combo, visibleTemplates, slotOffers }, comboIdx) => visibleTemplates.length > 0 && (
            <div key={combo.id} className={`px-4 py-3 group/row ${singleCompatible.length > 0 || comboIdx > 0 ? "border-t border-gray-50" : ""}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1">
                  {slotOffers.map((offer, i) => (
                    <OfferSlotThumbnail
                      key={i}
                      slotIndex={i}
                      offer={offer}
                      allOffers={offers}
                      onSelect={(id) => setCombinationOfferAtSlot(combo.id, i, id)}
                    />
                  ))}
                </div>
                <span className="text-xs font-medium text-gray-700">Multiple offers</span>
                <SubsectionActions
                  onDelete={() =>
                    visibleTemplates.forEach((t) =>
                      excludeBackgroundFromOfferTemplate(combo.id, t.id, bg.id)
                    )
                  }
                  deleteTip="Remove from all multi-product templates"
                />
              </div>
              {visibleTemplates.map((t) => (
                <KeyMessageInlineInputs key={t.id} templateId={t.id} />
              ))}
              <div className="flex flex-wrap gap-2">
                {visibleTemplates.map((template) => (
                  <div key={template.id} className="relative shrink-0 group">
                    <div className="overflow-hidden isolate">
                      <AdTemplate
                        projectId={projectId}
                        templateId={template.id}
                        offer={slotOffers[0]}
                        offers={slotOffers}
                        background={bg}
                        scale={thumbnailScale(template.width, template.height)}
                        customFields={customTemplateFields[template.id]}
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                      <button
                        onClick={() => setLightbox({ templateId: template.id, offer: slotOffers[0], slotOffers })}
                        className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition shadow"
                      >
                        <Eye size={14} className="text-gray-700" />
                      </button>
                      <button
                        onClick={() => excludeBackgroundFromOfferTemplate(combo.id, template.id, bg.id)}
                        className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition shadow"
                      >
                        <Trash2 size={14} className="text-gray-700" />
                      </button>
                      <button
                        onClick={() => setEditorBg({ templateId: template.id, offer: slotOffers[0] })}
                        className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition shadow"
                      >
                        <Pencil size={14} className="text-gray-700" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          </>
          )}
        </div>
      )}

      {lightbox && (() => {
        const t = templates.find((t) => t.id === lightbox.templateId)!;
        return (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-8" onClick={() => setLightbox(null)}>
            <div onClick={(e) => e.stopPropagation()}>
              <AdTemplate
                projectId={projectId}
                templateId={t.id}
                offer={lightbox.offer}
                offers={lightbox.slotOffers}
                background={bg}
                scale={Math.min(1200 / t.width, 720 / t.height)}
                dealerName={dealerName}
              />
            </div>
          </div>
        );
      })()}

      {editorBg && (() => {
        const t = templates.find((t) => t.id === editorBg.templateId)!;
        return (
          <TemplateZoneEditor
            templateId={t.id}
            templateName={t.name}
            previewOffer={editorBg.offer}
            previewBackground={bg}
            onClose={() => setEditorBg(null)}
          />
        );
      })()}
    </div>
  );
}

// ─── Simple View: mode selector ──────────────────────────────────────────────

function ViewModeSelector({
  viewMode,
  onChange,
  offers,
  singleTemplates,
  multiTemplates,
  combinations,
  dataRows = [],
}: {
  viewMode: string;
  onChange: (v: string) => void;
  offers: import("@projects/lib/mock-data").Offer[];
  singleTemplates: import("@projects/lib/mock-data").Template[];
  multiTemplates: import("@projects/lib/mock-data").Template[];
  combinations: { id: string; offerIds: string[] }[];
  dataRows?: DataRow[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Build the cycle order: backgrounds, then single-offer/data-row IDs, then combo IDs
  const usesDataRows = offers.length === 0 && dataRows.length > 0;
  const singleOfferIds = !usesDataRows && singleTemplates.length > 0 ? offers.map((o) => o.id) : [];
  const dataRowIds = usesDataRows ? dataRows.map((r) => r.id) : [];
  const comboIds = !usesDataRows && multiTemplates.length > 0 ? combinations.map((c) => c.id) : [];
  const allModes = ["backgrounds", ...singleOfferIds, ...dataRowIds, ...comboIds];
  const currentIdx = Math.max(0, allModes.indexOf(viewMode));
  const prev = () => onChange(allModes[(currentIdx - 1 + allModes.length) % allModes.length]);
  const next = () => onChange(allModes[(currentIdx + 1) % allModes.length]);

  const currentOffer = singleOfferIds.includes(viewMode) ? offers.find((o) => o.id === viewMode) : null;
  const currentCombo = comboIds.includes(viewMode) ? combinations.find((c) => c.id === viewMode) : null;
  const currentDataRow = dataRowIds.includes(viewMode) ? dataRows.find((r) => r.id === viewMode) : null;

  // Helper: resolve the slot offers for a combo (for thumbnail display)
  function getComboThumbnailOffers(combo: { id: string; offerIds: string[] }) {
    const slotCount = multiTemplates[0]?.products ?? 3;
    return Array.from({ length: slotCount }, (_, i) =>
      offers.find((o) => o.id === (combo.offerIds[i] ?? offers[i]?.id))
    ).filter(Boolean) as import("@projects/lib/mock-data").Offer[];
  }

  // Stacked car thumbnails for a combo
  function ComboThumbnails({ combo }: { combo: { id: string; offerIds: string[] } }) {
    const slotOffers = getComboThumbnailOffers(combo);
    return (
      <div className="w-12 h-8 shrink-0 relative flex items-center">
        {slotOffers.slice(0, 3).map((o, i) => (
          <div
            key={o.id}
            className="absolute w-7 h-7 rounded border border-white bg-white shadow-sm overflow-hidden"
            style={{ left: i * 10, zIndex: slotOffers.length - i }}
          >
            <img src={o.image} alt={o.model} className="absolute inset-0 w-full h-full object-contain"  />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {/* Prev */}
      <button
        onClick={prev}
        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 transition text-gray-500"
      >
        <ChevronLeft size={15} />
      </button>

      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 border border-gray-200 bg-white rounded px-3 h-[42px] w-[315px] hover:bg-gray-50 transition text-left"
        >
          {viewMode === "backgrounds" ? (
            <>
              <div className="w-12 h-8 shrink-0 flex items-center justify-center">
                <imgIcon size={16} className="text-[var(--brand-accent)]"  />
              </div>
              <span className="text-xs font-medium text-gray-800 flex-1">Backgrounds by Template</span>
            </>
          ) : currentDataRow ? (
            <>
              <div className="w-12 h-8 shrink-0 flex items-center justify-center bg-[var(--brand-accent)/8] rounded">
                <span className="text-xs font-bold text-[var(--brand-accent)]">
                  {(dataRows.indexOf(currentDataRow) + 1)}
                </span>
              </div>
              <span className="text-xs font-medium text-gray-800 truncate flex-1">
                {Object.values(currentDataRow.data).find(Boolean) || `Row ${dataRows.indexOf(currentDataRow) + 1}`}
              </span>
            </>
          ) : currentOffer ? (
            <>
              <div className="relative w-12 h-8 shrink-0">
                <img src={currentOffer.image} alt={currentOffer.model} className="absolute inset-0 w-full h-full object-contain"  />
              </div>
              <span className="text-xs font-medium text-gray-800 truncate flex-1">
                {currentOffer.year} {currentOffer.make} {currentOffer.model} {currentOffer.trim}
              </span>
            </>
          ) : currentCombo ? (
            <>
              <ComboThumbnails combo={currentCombo} />
              <span className="text-xs font-medium text-gray-800 flex-1 ml-1">Multiple offers</span>
            </>
          ) : null}
          <ChevronDown size={13} className="text-gray-400 shrink-0" />
        </button>

        {open && (
          <div className="absolute top-full mt-1 left-0 z-30 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 min-w-full">
            {/* Backgrounds by Template */}
            <button
              onClick={() => { onChange("backgrounds"); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition text-left ${viewMode === "backgrounds" ? "bg-[var(--brand-accent)/8]" : ""}`}
            >
              <div className="w-14 h-9 shrink-0 flex items-center justify-center">
                <imgIcon size={16} className="text-[var(--brand-accent)]"  />
              </div>
              <span className={`text-xs ${viewMode === "backgrounds" ? "font-semibold text-[var(--brand-accent)]" : "font-medium text-gray-800"}`}>
                Backgrounds by Template
              </span>
            </button>

            {/* Data row entries — only when using data rows (pharma project) */}
            {usesDataRows && dataRows.length > 0 && (
              <>
                <div className="border-t border-gray-100 my-1" />
                {dataRows.map((row, ri) => (
                  <button
                    key={row.id}
                    onClick={() => { onChange(row.id); setOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition text-left ${viewMode === row.id ? "bg-[var(--brand-accent)/8]" : ""}`}
                  >
                    <div className="w-14 h-9 shrink-0 flex items-center justify-center bg-[var(--brand-accent)/8] rounded">
                      <span className="text-sm font-bold text-[var(--brand-accent)]">{ri + 1}</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className={`text-xs truncate ${viewMode === row.id ? "font-semibold text-[var(--brand-accent)]" : "font-medium text-gray-800"}`}>
                        {Object.values(row.data).find(Boolean) || `Row ${ri + 1}`}
                      </span>
                      {Object.values(row.data).filter(Boolean).length > 0 && (
                        <span className="text-[10px] text-gray-400 truncate">
                          Row {ri + 1}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </>
            )}

            {/* Single offer rows — only when there are single-product templates */}
            {!usesDataRows && singleTemplates.length > 0 && (
              <>
                <div className="border-t border-gray-100 my-1" />
                {offers.map((offer) => (
                  <button
                    key={offer.id}
                    onClick={() => { onChange(offer.id); setOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition text-left ${viewMode === offer.id ? "bg-[var(--brand-accent)/8]" : ""}`}
                  >
                    <div className="relative w-14 h-9 shrink-0">
                      <img src={offer.image} alt={offer.model} className="absolute inset-0 w-full h-full object-contain"  />
                    </div>
                    <span className={`text-xs truncate ${viewMode === offer.id ? "font-semibold text-[var(--brand-accent)]" : "font-medium text-gray-800"}`}>
                      {offer.year} {offer.make} {offer.model} {offer.trim}
                    </span>
                  </button>
                ))}
              </>
            )}

            {/* Combination rows — only when there are multi-product templates (automotive) */}
            {!usesDataRows && multiTemplates.length > 0 && (
              <>
                <div className="border-t border-gray-100 my-1" />
                {combinations.map((combo) => (
                  <button
                    key={combo.id}
                    onClick={() => { onChange(combo.id); setOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition text-left ${viewMode === combo.id ? "bg-[var(--brand-accent)/8]" : ""}`}
                  >
                    <div className="w-14 h-9 shrink-0 flex items-center">
                      <div className="relative flex items-center">
                        {getComboThumbnailOffers(combo).slice(0, 3).map((o, i) => (
                          <div
                            key={o.id}
                            className="absolute w-8 h-8 rounded border border-white bg-white shadow-sm overflow-hidden"
                            style={{ left: i * 12, zIndex: 3 - i }}
                          >
                            <img src={o.image} alt={o.model} className="absolute inset-0 w-full h-full object-contain"  />
                          </div>
                        ))}
                      </div>
                    </div>
                    <span className={`text-xs ${viewMode === combo.id ? "font-semibold text-[var(--brand-accent)]" : "font-medium text-gray-800"}`}>
                      Multiple offers
                    </span>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Next */}
      <button
        onClick={next}
        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 transition text-gray-500"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

// ─── Simple View: per-template background card ────────────────────────────────

// ─── Figma "Themes&Logos Items" card ─────────────────────────────────────────
// Matches the Figma component exactly:
//   • 40×40 template wireframe thumbnail
//   • Size label (11px) + background count (10px muted)
//   • Horizontal wrapping carousel: [+ Add slot w/ dropdown] [90×90 bg thumbnails]
// ─────────────────────────────────────────────────────────────────────────────
function TemplateBackgroundCard({
  template,
  onOpenDialog,
}: {
  template: import("@projects/lib/mock-data").Template;
  onOpenDialog: (folder?: "recents" | "background-collections") => void;
}) {
  const { getBackgroundsForTemplate, excludeBackgroundFromTemplate, addBackgrounds } = useProjectStore();
  const bgs = getBackgroundsForTemplate(template.id);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    addBackgrounds([{
      id: `upload-${template.id}-${Date.now()}`,
      name: file.name.replace(/\.[^.]+$/, ""),
      type: "Background",
      sizes: 1,
      folder: "Uploads",
      color: "#888888",
      thumbnail: url,
      images: { [template.id]: url },
    }]);
    setMenuOpen(false);
    e.target.value = "";
  }

  function handleRemoveAll() {
    bgs.forEach((bg) => excludeBackgroundFromTemplate(template.id, bg.id));
    setMenuOpen(false);
  }

  // Scale wireframe to fit the 40×40 header thumbnail
  const thumbScale = Math.min(40 / template.width, 40 / template.height);

  return (
    <div className="bg-white rounded-xl p-2 flex flex-col gap-1">

      {/* ── Header: template thumbnail + labels ── */}
      <div className="flex items-center gap-1 pl-1 h-10">
        <div className="w-10 h-10 shrink-0 overflow-hidden rounded-md bg-gray-50 flex items-center justify-center">
          <TemplateWireframe templateId={template.id} scale={thumbScale} />
        </div>
        <div className="flex flex-col justify-center ml-1 gap-0.5">
          <p className="text-[11px] leading-[18px] text-gray-900 font-normal whitespace-nowrap">
            {template.width} × {template.height}
          </p>
          <p className="text-[10px] leading-[10px] text-gray-400 font-normal whitespace-nowrap">
            {bgs.length} background{bgs.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* ── Carousel: Add slot + background thumbnails ── */}
      <div className="flex flex-wrap gap-1 p-1">

        {/* Add slot — triggers the same contextual dropdown menu */}
        <div ref={menuRef} className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-[90px] h-[90px] border border-dashed border-[var(--brand-accent)] rounded-[4px] bg-white
                       flex flex-col items-center justify-center gap-1.5
                       hover:bg-[var(--brand-accent)/8] transition"
          >
            <Plus size={22} className="text-[var(--brand-accent)]" />
            <span className="text-sm font-medium text-[var(--brand-accent)]">Add</span>
          </button>

          {menuOpen && (
            <div className="absolute top-full mt-2 left-0 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-30 min-w-[220px]">
              <button
                onClick={() => { onOpenDialog("recents"); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-left"
              >
                <FileImage size={16} className="text-gray-400 shrink-0" />
                Background from Portal
              </button>
              <button
                onClick={() => { onOpenDialog("background-collections"); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-left"
              >
                <Share2 size={16} className="text-gray-400 shrink-0" />
                Collection from Portal
              </button>
              <button
                onClick={() => { fileInputRef.current?.click(); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-left"
              >
                <Upload size={16} className="text-gray-400 shrink-0" />
                Upload
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={handleRemoveAll}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 text-left"
              >
                <X size={16} className="text-gray-400 shrink-0" />
                Remove All
              </button>
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </div>

        {/* Background thumbnails — 90×90 square, object-contain to preserve proportions */}
        {bgs.map((bg) => {
          const src = resolveTemplateImage(bg, template.id);
          if (!src) return null;
          return (
            <div
              key={bg.id}
              title={bg.name}
              className="relative w-[90px] h-[90px] shrink-0 rounded-[4px] overflow-hidden
                         bg-gray-100 border border-black/[0.12] group/thumb
                         hover:border-[var(--brand-accent)] hover:border-[3px] transition-all"
            >
              <img
                src={src}
                alt={bg.name}
                className="absolute inset-0 w-full h-full object-contain"
               />
              {/* Hover overlay: remove action */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100
                              transition-opacity flex items-center justify-center">
                <button
                  onClick={() => excludeBackgroundFromTemplate(template.id, bg.id)}
                  className="w-8 h-8 rounded-full bg-white flex items-center justify-center
                             hover:bg-gray-100 transition shadow"
                >
                  <Trash2 size={14} className="text-gray-700" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FineTuneSwitch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleMouseEnter() {
    tooltipTimer.current = setTimeout(() => setShowTooltip(true), 300);
  }
  function handleMouseLeave() {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    setShowTooltip(false);
  }

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className="flex items-center gap-3 bg-white rounded-full pl-3 pr-2 py-[3px] select-none cursor-pointer"
      >
        <span className="text-[13px] font-medium leading-[22px]" style={{ color: "#1f1d25" }}>Fine Tune</span>
        <span
          className={`relative inline-flex h-[18px] w-8 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${
            value ? "bg-[var(--brand-accent)]" : "bg-gray-200"
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform duration-200 ${
              value ? "translate-x-[14px]" : "translate-x-0"
            }`}
          />
        </span>
      </button>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap shadow-lg pointer-events-none">
          {value ? "Back to Simple Mode" : "Edit backgrounds by offer and template"}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

