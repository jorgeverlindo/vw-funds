"use client";

import { useState, useRef, useEffect } from "react";

import { ChevronDown, ChevronRight, Trash2, Eye, Pencil, RotateCcw } from "lucide-react";
import { SubsectionActions, TipButton } from "./SubsectionActions";
import { LogoPicker } from "./LogoPicker";
import { BackgroundCollection } from "./BackgroundCollectionCard";
import type { Template } from "@projects/lib/mock-data";
import { brandKits } from "@projects/lib/mock-data";
import { AdTemplate, resolveLogoSrc, resolveColors } from "@projects/templates/AdTemplate";
import { TemplateWireframe } from "@projects/templates/TemplateWireframe";
import { TemplateZoneEditor } from "@projects/templates/TemplateZoneEditor";
import { useProjectStore } from "@projects/lib/project-store";
import { thumbnailScale } from "@projects/lib/thumbnail-scale";
import { getSquareThumbnail } from "@projects/lib/bg-thumbnail";

interface Offer {
  id: string;
  year: string;
  make: string;
  model: string;
  trim: string;
  image: string;
  monthlyPayment: number;
  term: number;
  totalDueAtSigning: number;
}

interface OfferAccordionProps {
  offer: Offer;
  backgrounds: BackgroundCollection[];
  templates: Template[];
  open: boolean;
  onToggle: () => void;
  onDelete: (templateId: string) => void;
  onAddBackground: (templateId: string) => void;
  onAddAll: () => void;
  projectId: string;
}

// ─── BrandLogoMini ────────────────────────────────────────────────────────────
// Small logo badge in the accordion header — resolves from the active brand kit.

function BrandLogoMini({ make, slotType, projectId }: { make: string; slotType: string; projectId: string }) {
  const { activeBrandKitIds, activeLogoIds } = useProjectStore();
  const src = resolveLogoSrc(make, slotType, activeBrandKitIds, activeLogoIds, projectId);
  if (!src) return <div className="w-8 h-8" />;
  return (
    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center overflow-hidden relative">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={slotType} style={{ width: "100%", height: "100%", objectFit: "contain", padding: "2px" }} />
    </div>
  );
}

// ─── StyleOverrideButtons ─────────────────────────────────────────────────────
// Icon buttons shown on hover of accordion header / subsection rows.
// Scope = "offer" → writes to offerLogoIds / offerColors
// Scope = "offerTemplate" → writes to offerTemplateLogoIds / offerTemplateColors

type OverrideScope = "offer" | "offerTemplate" | "template" | "backgroundMake";

interface StyleOverrideButtonsProps {
  make: string;
  offerId?: string;      // not needed for template/backgroundMake scope
  templateId?: string;   // required for offerTemplate and template scopes
  bgId?: string;         // required for backgroundMake scope
  scope: OverrideScope;
  projectId: string;
  slotTypes: string[];   // e.g. ["primary-square", "event-square"]
}

// ─── Shared color-picker popover (defined at module level to avoid remount) ───

interface OverrideColorPickerProps {
  label: string;
  currentColor: string;
  hasOverride?: boolean;
  onChangeColor: (hex: string) => void;
  onRevert?: () => void;
  onClose: () => void;
}

function OverrideColorPicker({ label, currentColor, hasOverride, onChangeColor, onRevert, onClose }: OverrideColorPickerProps) {
  const [hexInput, setHexInput] = useState(currentColor.replace("#", ""));
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  function handleHex(raw: string) {
    setHexInput(raw);
    const clean = raw.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
    if (clean.length === 6) onChangeColor("#" + clean);
  }

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 top-full mt-1 left-0 bg-white border border-gray-200 rounded-xl shadow-xl p-3 flex flex-col gap-2 min-w-[160px]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
        {hasOverride && onRevert && (
          <TipButton
            tip="Revert Overrides"
            onClick={() => { onRevert(); onClose(); }}
            className="w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition"
          >
            <RotateCcw size={11} />
          </TipButton>
        )}
      </div>
      <input
        type="color"
        value={"#" + hexInput.replace(/[^0-9a-fA-F]/g, "").slice(0, 6).padEnd(6, "0")}
        onChange={(e) => { const h = e.target.value.replace("#", ""); setHexInput(h); onChangeColor(e.target.value); }}
        className="w-full h-8 rounded cursor-pointer border border-gray-200"
      />
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-400">#</span>
        <input
          type="text"
          maxLength={6}
          value={hexInput}
          onChange={(e) => handleHex(e.target.value)}
          className="flex-1 text-xs font-mono border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[var(--brand-accent)]"
          placeholder="000000"
        />
      </div>
    </div>
  );
}

// ─── StyleOverrideButtons component ──────────────────────────────────────────

export function StyleOverrideButtons({ make, offerId = "", templateId, bgId, scope, projectId, slotTypes }: StyleOverrideButtonsProps) {
  const store = useProjectStore();
  const { activeBrandKitIds, activeLogoIds, activeColors } = store;

  // Effective current colors — always walk the FULL chain regardless of scope.
  // Priority (most specific wins): offerTemplate > offer > backgroundMake > template > project-level.
  // Scope only controls what gets WRITTEN; reading always reflects the complete resolution.
  const [effectiveTextColor, effectiveBtnColor] = (() => {
    if (offerId && templateId) {
      const ot = store.offerTemplateColors[projectId]?.[`${offerId}::${templateId}`]?.[make];
      if (ot) return ot;
    }
    if (offerId) {
      const o = store.offerColors[projectId]?.[offerId]?.[make];
      if (o) return o;
    }
    if (bgId) {
      const bg = store.backgroundMakeColors[projectId]?.[bgId]?.[make];
      if (bg) return bg;
    }
    if (templateId) {
      const t = store.templateColors[projectId]?.[templateId]?.[make];
      if (t) return t;
    }
    return resolveColors(make, activeColors, projectId);
  })();

  // Effective logo for a slot type — same full-chain reading.
  function getEffectiveLogo(slotType: string): string | undefined {
    if (offerId && templateId) {
      const ot = store.offerTemplateLogoIds[projectId]?.[`${offerId}::${templateId}`]?.[make]?.[slotType];
      if (ot) return ot;
    }
    if (offerId) {
      const o = store.offerLogoIds[projectId]?.[offerId]?.[make]?.[slotType];
      if (o) return o;
    }
    if (bgId) {
      const bg = store.backgroundMakeLogoIds[projectId]?.[bgId]?.[make]?.[slotType];
      if (bg) return bg;
    }
    if (templateId) {
      const t = store.templateLogoIds[projectId]?.[templateId]?.[make]?.[slotType];
      if (t) return t;
    }
    return resolveLogoSrc(make, slotType, activeBrandKitIds, activeLogoIds, projectId);
  }

  type OpenPicker = { type: "logo"; slotType: string } | { type: "color"; colorIdx: 0 | 1 } | null;
  const [openPicker, setOpenPicker] = useState<OpenPicker>(null);

  function applyLogoOverride(slotType: string, logoId: string) {
    if (scope === "offerTemplate" && offerId && templateId) {
      store.setOfferTemplateLogoId(projectId, offerId, templateId, make, slotType, logoId);
    } else if (scope === "template" && templateId) {
      store.setTemplateLogoId(projectId, templateId, make, slotType, logoId);
    } else if (scope === "backgroundMake" && bgId) {
      store.setBackgroundMakeLogoId(projectId, bgId, make, slotType, logoId);
    } else {
      store.setOfferLogoId(projectId, offerId, make, slotType, logoId);
    }
  }

  function applyColorOverride(idx: 0 | 1, color: string) {
    // Ensure the OTHER color index is initialized with its current effective value,
    // so setting idx=0 never silently resets idx=1 to #000000 (and vice versa).
    const otherIdx = (1 - idx) as 0 | 1;
    const otherColor = idx === 0 ? effectiveBtnColor : effectiveTextColor;

    if (scope === "offerTemplate" && offerId && templateId) {
      const key = `${offerId}::${templateId}`;
      if (!store.offerTemplateColors[projectId]?.[key]?.[make]) {
        store.setOfferTemplateColor(projectId, offerId, templateId, make, otherIdx, otherColor);
      }
      store.setOfferTemplateColor(projectId, offerId, templateId, make, idx, color);
    } else if (scope === "template" && templateId) {
      if (!store.templateColors[projectId]?.[templateId]?.[make]) {
        store.setTemplateColor(projectId, templateId, make, otherIdx, otherColor);
      }
      store.setTemplateColor(projectId, templateId, make, idx, color);
    } else if (scope === "backgroundMake" && bgId) {
      if (!store.backgroundMakeColors[projectId]?.[bgId]?.[make]) {
        store.setBackgroundMakeColor(projectId, bgId, make, otherIdx, otherColor);
      }
      store.setBackgroundMakeColor(projectId, bgId, make, idx, color);
    } else {
      if (!store.offerColors[projectId]?.[offerId]?.[make]) {
        store.setOfferColor(projectId, offerId, make, otherIdx, otherColor);
      }
      store.setOfferColor(projectId, offerId, make, idx, color);
    }
  }

  // Whether there's an active color override for this scope
  const hasColorOverride =
    scope === "offerTemplate" && offerId && templateId
      ? !!store.offerTemplateColors[projectId]?.[`${offerId}::${templateId}`]?.[make]
      : scope === "template" && templateId
        ? !!store.templateColors[projectId]?.[templateId]?.[make]
        : scope === "backgroundMake" && bgId
          ? !!store.backgroundMakeColors[projectId]?.[bgId]?.[make]
          : !!store.offerColors[projectId]?.[offerId]?.[make];

  function revertColorOverride() {
    if (scope === "offerTemplate" && offerId && templateId) {
      store.clearOfferTemplateColorOverrides(projectId, offerId, templateId, make);
    } else if (scope === "template" && templateId) {
      store.clearTemplateColorOverrides(projectId, templateId, make);
    } else if (scope === "backgroundMake" && bgId) {
      store.clearBackgroundMakeColorOverrides(projectId, bgId, make);
    } else {
      store.clearOfferColorOverrides(projectId, offerId, make);
    }
  }

  // Lookup active logo ID for a slot — full chain, same priority as getEffectiveLogo.
  function getActiveLogoId(slotType: string): string | undefined {
    if (offerId && templateId) {
      const ot = store.offerTemplateLogoIds[projectId]?.[`${offerId}::${templateId}`]?.[make]?.[slotType];
      if (ot) return ot;
    }
    if (offerId) {
      const o = store.offerLogoIds[projectId]?.[offerId]?.[make]?.[slotType];
      if (o) return o;
    }
    if (bgId) {
      const bg = store.backgroundMakeLogoIds[projectId]?.[bgId]?.[make]?.[slotType];
      if (bg) return bg;
    }
    if (templateId) {
      const t = store.templateLogoIds[projectId]?.[templateId]?.[make]?.[slotType];
      if (t) return t;
    }
    return activeLogoIds[projectId]?.[make]?.[slotType];
  }

  return (
    <div
      className={`flex items-center gap-1 ml-1 transition-opacity ${openPicker !== null ? "opacity-100" : "opacity-0 group-hover/row:opacity-100"}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Logo buttons — one per slot type */}
      {slotTypes.map((slotType) => {
        const logoSrc = getEffectiveLogo(slotType);
        const isOpen = openPicker?.type === "logo" && openPicker.slotType === slotType;
        const label = slotType.startsWith("primary") ? "Swap logo for this group" : "Swap event logo for this group";
        return (
          <div key={slotType} className="relative">
            <TipButton
              tip={label}
              onClick={() => setOpenPicker(isOpen ? null : { type: "logo", slotType })}
              className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:border-[var(--brand-accent)]/60 transition shadow text-gray-700"
            >
              {logoSrc
                ? /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={logoSrc} alt={slotType} className="w-5 h-5 object-contain" />
                : <span className="text-[8px] text-gray-400">?</span>
              }
            </TipButton>
            {isOpen && (
              <LogoPicker
                make={make}
                slotType={slotType}
                selectedLogoId={getActiveLogoId(slotType)}
                onSelectLogo={(logoId) => {
                  const kit = brandKits.find((k) => k.oem === make);
                  const logo = kit?.logos.find((l) => l.id === logoId);
                  applyLogoOverride(slotType, logo?.image ?? logoId);
                }}
                onUpload={(dataUrl) => applyLogoOverride(slotType, dataUrl)}
                onRevert={() => {
                  if (scope === "offerTemplate" && offerId && templateId) {
                    store.clearOfferTemplateLogoOverrides(projectId, offerId, templateId, make);
                  } else if (scope === "template" && templateId) {
                    store.clearTemplateLogoOverrides(projectId, templateId, make);
                  } else if (scope === "backgroundMake" && bgId) {
                    store.clearBackgroundMakeLogoOverrides(projectId, bgId, make);
                  } else {
                    store.clearOfferLogoOverrides(projectId, offerId, make);
                  }
                }}
                onClose={() => setOpenPicker(null)}
              />
            )}
          </div>
        );
      })}

      {/* Text color swatch */}
      <div className="relative">
        <TipButton
          tip="Swap text color for this group"
          onClick={() => setOpenPicker(openPicker?.type === "color" && openPicker.colorIdx === 0 ? null : { type: "color", colorIdx: 0 })}
          className="w-8 h-8 rounded-full border-2 border-white shadow transition-transform hover:scale-110"
          style={{ backgroundColor: effectiveTextColor }}
        />
        {openPicker?.type === "color" && openPicker.colorIdx === 0 && (
          <OverrideColorPicker
            label="Text Color"
            currentColor={effectiveTextColor}
            hasOverride={hasColorOverride}
            onChangeColor={(hex) => applyColorOverride(0, hex)}
            onRevert={revertColorOverride}
            onClose={() => setOpenPicker(null)}
          />
        )}
      </div>

      {/* Button background color swatch */}
      <div className="relative">
        <TipButton
          tip="Swap button color for this group"
          onClick={() => setOpenPicker(openPicker?.type === "color" && openPicker.colorIdx === 1 ? null : { type: "color", colorIdx: 1 })}
          className="w-8 h-8 rounded-full border-2 border-white shadow transition-transform hover:scale-110"
          style={{ backgroundColor: effectiveBtnColor }}
        />
        {openPicker?.type === "color" && openPicker.colorIdx === 1 && (
          <OverrideColorPicker
            label="Button Color"
            currentColor={effectiveBtnColor}
            hasOverride={hasColorOverride}
            onChangeColor={(hex) => applyColorOverride(1, hex)}
            onRevert={revertColorOverride}
            onClose={() => setOpenPicker(null)}
          />
        )}
      </div>
    </div>
  );
}

// ─── TemplateThumbnailRow ─────────────────────────────────────────────────────

function TemplateThumbnailRow({ templateId, templateWidth, templateHeight, templateName, offer, projectId }: {
  templateId: string;
  templateWidth: number;
  templateHeight: number;
  templateName: string;
  offer: Offer;
  projectId: string;
}) {
  const { getBackgroundsForOfferTemplate, excludeBackgroundFromOfferTemplate } = useProjectStore();
  const [lightbox, setLightbox] = useState<BackgroundCollection | null>(null);
  const [editorBg, setEditorBg] = useState<BackgroundCollection | null>(null);
  const scale = thumbnailScale(templateWidth, templateHeight);
  const bgs = getBackgroundsForOfferTemplate(offer.id, templateId);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {bgs.map((bg) => (
          <div key={bg.id} className="relative shrink-0 group">
            <div className="overflow-hidden isolate">
              <AdTemplate projectId={projectId} templateId={templateId} offer={offer} background={bg} scale={scale} />
            </div>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
              <button onClick={() => setLightbox(bg)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition shadow">
                <Eye size={14} className="text-gray-700" />
              </button>
              <button onClick={() => excludeBackgroundFromOfferTemplate(offer.id, templateId, bg.id)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition shadow">
                <Trash2 size={14} className="text-gray-700" />
              </button>
              <button onClick={() => setEditorBg(bg)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition shadow">
                <Pencil size={14} className="text-gray-700" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-8"
          onClick={() => setLightbox(null)}
        >
          <div onClick={e => e.stopPropagation()}>
            <AdTemplate
              projectId={projectId}
              templateId={templateId}
              offer={offer}
              background={lightbox}
              scale={Math.min(1200 / templateWidth, 720 / templateHeight)}
            />
          </div>
        </div>
      )}

      {/* Zone editor — opened from an asset, so it has real offer + bg context */}
      {editorBg && (
        <TemplateZoneEditor
          templateId={templateId}
          templateName={templateName}
          previewOffer={offer}
          previewBackground={editorBg}
          onClose={() => setEditorBg(null)}
        />
      )}
    </>
  );
}

export function OfferAccordion({ offer, backgrounds, templates, open, onToggle, onDelete, onAddBackground, onAddAll, projectId }: OfferAccordionProps) {
  const {
    getBackgroundsForOfferTemplate,
    getBackgroundsForTemplate,
    includeBackgroundForOfferTemplate,
    excludeBackgroundFromOfferTemplate,
  } = useProjectStore();

  // Deduplicated backgrounds actually used for this offer (union across all templates)
  const activeBackgrounds = [...new Map(
    templates.flatMap((t) => getBackgroundsForOfferTemplate(offer.id, t.id)).map((bg) => [bg.id, bg])
  ).values()];

  // ── Per-template helpers (subsection level) ───────────────────────────────
  function hasRemovedBackgrounds(templateId: string): boolean {
    return getBackgroundsForOfferTemplate(offer.id, templateId).length < getBackgroundsForTemplate(templateId).length;
  }

  function restoreTemplate(templateId: string) {
    getBackgroundsForTemplate(templateId).forEach((bg) => {
      includeBackgroundForOfferTemplate(offer.id, templateId, bg.id);
    });
  }

  // ── Offer-level helpers (header level) ────────────────────────────────────
  function hasAnyRemovedBackgrounds(): boolean {
    return templates.some((t) => hasRemovedBackgrounds(t.id));
  }

  function deleteAllForOffer() {
    templates.forEach((t) => {
      getBackgroundsForOfferTemplate(offer.id, t.id).forEach((bg) => {
        excludeBackgroundFromOfferTemplate(offer.id, t.id, bg.id);
      });
    });
  }

  function restoreAllForOffer() {
    templates.forEach((t) => {
      getBackgroundsForTemplate(t.id).forEach((bg) => {
        includeBackgroundForOfferTemplate(offer.id, t.id, bg.id);
      });
    });
  }

  const fullName = `${offer.year} ${offer.make} ${offer.model} ${offer.trim}`;
  const totalAssets = templates.reduce((sum, t) => sum + getBackgroundsForOfferTemplate(offer.id, t.id).length, 0);

  // Which slot types does this offer's templates use?
  const slotTypes = [...new Set(templates.flatMap((t) => (t as Template & { logoSlots?: string[] }).logoSlots ?? []))];

  return (
    <div className="rounded-lg bg-white">
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onToggle()}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group/row rounded-lg"
      >
        {open ? (
          <ChevronDown size={15} className="text-gray-400 shrink-0" />
        ) : (
          <ChevronRight size={15} className="text-gray-400 shrink-0" />
        )}

        {/* Car image from offer data */}
        <div className="relative w-14 h-10 shrink-0">
          <img
            src={offer.image}
            alt={fullName}
            className="absolute inset-0 w-full h-full object-contain"
           />
        </div>

        {/* Name + available */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center">
            <p className="text-sm font-semibold text-gray-900 truncate">{fullName}</p>
            <SubsectionActions
              onDelete={deleteAllForOffer}
              onAddBackground={onAddAll}
              deleteTip="Delete all assets under this Offer"
              editTip="Edit all assets under this Offer"
              onRestore={hasAnyRemovedBackgrounds() ? restoreAllForOffer : undefined}
              restoreTip="Use all backgrounds added for this Offer"
            />
            {/* Style override buttons — inline after action buttons, visible on hover */}
            {slotTypes.length > 0 && (
              <StyleOverrideButtons
                make={offer.make}
                offerId={offer.id}
                scope="offer"
                projectId={projectId}
                slotTypes={slotTypes}
              />
            )}
          </div>
          <p className="text-xs text-gray-400">{templates.length} templates · {totalAssets} asset{totalAssets !== 1 ? "s" : ""}</p>
        </div>

        {/* Right: background thumbnails + active brand kit logos */}
        <div className="flex items-center gap-2 shrink-0">
          {!open && activeBackgrounds.length > 0 && (
            <div className="relative flex items-center">
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

          {slotTypes.map((slotType) => {
            const [title, subtitle] = slotType.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1));
            return (
              <div key={slotType} className="flex items-center gap-1.5">
                <BrandLogoMini make={offer.make} slotType={slotType} projectId={projectId} />
                {open && (
                  <div>
                    <p className="text-[9px] text-gray-900 font-medium leading-tight">{title}</p>
                    <p className="text-[9px] text-gray-400 leading-tight">{subtitle}</p>
                  </div>
                )}
              </div>
            );
          })}

        </div>
      </div>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-gray-100 rounded-b-lg overflow-visible">
          {templates.map((template, idx) => (
            <div
              key={template.id}
              className={`px-4 py-3 group/row hover:bg-gray-50 transition-colors rounded-b-lg ${idx < templates.length - 1 ? "border-b border-gray-50" : ""}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 shrink-0 flex items-center justify-center overflow-hidden">
                  <TemplateWireframe
                    templateId={template.id}
                    scale={Math.min(40 / template.width, 40 / template.height)}
                  />
                </div>
                <span className="text-xs font-medium text-gray-700">{template.name}</span>
                <SubsectionActions
                  onDelete={() => onDelete(template.id)}
                  onAddBackground={() => onAddBackground(template.id)}
                  onRestore={hasRemovedBackgrounds(template.id) ? () => restoreTemplate(template.id) : undefined}
                  restoreTip="Add back removed backgrounds"
                />
                {/* Per-offer+template style override buttons */}
                {slotTypes.length > 0 && (
                  <StyleOverrideButtons
                    make={offer.make}
                    offerId={offer.id}
                    templateId={template.id}
                    scope="offerTemplate"
                    projectId={projectId}
                    slotTypes={slotTypes}
                  />
                )}
              </div>
              <TemplateThumbnailRow
                templateId={template.id}
                templateWidth={template.width}
                templateHeight={template.height}
                templateName={template.name}
                offer={offer}
                projectId={projectId}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
