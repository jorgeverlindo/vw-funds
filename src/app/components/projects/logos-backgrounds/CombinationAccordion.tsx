"use client";

import { useState, useRef, useEffect } from "react";

import { ChevronDown, ChevronRight, Eye, Trash2, Pencil, X, Plus } from "lucide-react";
import { AdTemplate, resolveLogoSrc } from "@projects/templates/AdTemplate";
import { TemplateWireframe } from "@projects/templates/TemplateWireframe";
import { TemplateZoneEditor } from "@projects/templates/TemplateZoneEditor";
import { SubsectionActions } from "./SubsectionActions";
import { BackgroundCollection } from "./BackgroundCollectionCard";
import { useProjectStore } from "@projects/lib/project-store";
import { thumbnailScale } from "@projects/lib/thumbnail-scale";
import { getSquareThumbnail } from "@projects/lib/bg-thumbnail";
import { zoneConfigs, isKeyMessageTextLayout, isPharmaZoneConfig } from "@projects/lib/template-zone-configs";

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface Template {
  id: string;
  name: string;
  format: string;
  width: number;
  height: number;
  brand: string;
  products: number;
}

interface CombinationAccordionProps {
  combinationId: string;
  templates: Template[];
  allOffers: Offer[];
  slotOfferIds: string[];
  onSetSlotOffer: (slotIndex: number, offerId: string) => void;
  open: boolean;
  onToggle: () => void;
  onAddBackground: (templateId: string) => void;
  onAddAll: () => void;
  onDelete?: () => void;
  projectId: string;
}

export const COMBINATION_ID = "__combination__";

// ─── SlotPicker ───────────────────────────────────────────────────────────────

export function SlotPicker({ slotIndex, offer, allOffers, onSelect }: {
  slotIndex: number;
  offer: Offer;
  allOffers: Offer[];
  onSelect: (offerId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative z-10" style={{ zIndex: open ? 50 : 10 - slotIndex }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="relative w-14 h-10 rounded-lg border-2 border-white bg-white shadow-sm overflow-hidden hover:border-[var(--brand-accent)]/60 transition"
        title={`Product ${slotIndex + 1}: ${offer.year} ${offer.make} ${offer.model}`}
      >
        <img src={offer.image} alt={offer.model} className="absolute inset-0 w-full h-full object-contain"  />
        <span className="absolute bottom-0 left-0 right-0 text-center text-[8px] font-bold text-white bg-[var(--brand-accent)] leading-tight py-0.5">
          P{slotIndex + 1}
        </span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 z-50">
          {allOffers.map((o) => (
            <button
              key={o.id}
              onClick={(e) => { e.stopPropagation(); onSelect(o.id); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition text-left ${o.id === offer.id ? "bg-[var(--brand-accent)/8]" : ""}`}
            >
              <div className="relative w-10 h-7 shrink-0">
                <img src={o.image} alt={o.model} className="absolute inset-0 w-full h-full object-contain"  />
              </div>
              <span className="text-xs font-medium text-gray-800 truncate">
                {o.year} {o.make} {o.model} {o.trim}
              </span>
              {o.id === offer.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--brand-accent)] shrink-0" />}
            </button>
          ))}
          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(allOffers[slotIndex]?.id ?? allOffers[0].id); setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition text-left"
            >
              <div className="w-10 h-7 shrink-0 flex items-center justify-center">
                <X size={14} className="text-gray-400" />
              </div>
              <span className="text-xs font-medium text-gray-500">Clear</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── KeyMessageInlineInputs ──────────────────────────────────────────────────
// Bare label + input fields for manually-filled key-message template fields.
// Reads/writes from the project store directly.

export function KeyMessageInlineInputs({ templateId, white }: { templateId: string; white?: boolean }) {
  const { customTemplateFields, setCustomTemplateField, fineTune } = useProjectStore();
  const cfg = zoneConfigs[templateId];
  if (!cfg || isPharmaZoneConfig(cfg) || !isKeyMessageTextLayout(cfg.textLayout)) return null;

  const fields = customTemplateFields[templateId] ?? {};
  const bg = white || !fineTune ? "bg-white" : "bg-gray-100";

  return (
    <div
      className={`inline-flex flex-wrap gap-3 mb-2 p-4 rounded-lg ${bg}`}
      onClick={(e) => e.stopPropagation()}
    >
      <label className="flex flex-col gap-0.5 w-[200px]">
        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Key Message</span>
        <input
          type="text"
          value={fields.keyMessage ?? ""}
          onChange={(e) => setCustomTemplateField(templateId, "keyMessage", e.target.value)}
          placeholder="e.g. Honda Spring Event"
          className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-[var(--brand-accent)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--brand-accent)]/30"
          onClick={(e) => e.stopPropagation()}
        />
      </label>
      <label className="flex flex-col gap-0.5 w-[200px]">
        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Year</span>
        <input
          type="text"
          value={fields.year ?? ""}
          onChange={(e) => setCustomTemplateField(templateId, "year", e.target.value)}
          placeholder="e.g. 2026"
          className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-[var(--brand-accent)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--brand-accent)]/30"
          onClick={(e) => e.stopPropagation()}
        />
      </label>
    </div>
  );
}

// ─── CombinationThumbnailRow ──────────────────────────────────────────────────

function CombinationThumbnailRow({ combinationId, templateId, templateName, templateWidth, templateHeight, slotOffers, projectId }: {
  combinationId: string;
  templateId: string;
  templateName: string;
  templateWidth: number;
  templateHeight: number;
  slotOffers: (Offer | undefined)[];
  projectId: string;
}) {
  const { getBackgroundsForOfferTemplate, excludeBackgroundFromOfferTemplate, customTemplateFields } = useProjectStore();
  const [lightbox, setLightbox] = useState<BackgroundCollection | null>(null);
  const [editorBg, setEditorBg] = useState<BackgroundCollection | null>(null);
  const scale = thumbnailScale(templateWidth, templateHeight);
  const bgs = getBackgroundsForOfferTemplate(combinationId, templateId);
  // Use first available offer as the required `offer` prop for AdTemplate (multi-product layouts ignore it)
  const primaryOffer = slotOffers.find(Boolean);
  const customFields = customTemplateFields[templateId];

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {bgs.map((bg) => (
          <div key={bg.id} className="relative shrink-0 group">
            <div className="overflow-hidden isolate">
              <AdTemplate
                projectId={projectId}
                templateId={templateId}
                offer={primaryOffer}
                offers={slotOffers}
                background={bg}
                scale={scale}
                customFields={customFields}
              />
            </div>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
              <button onClick={() => setLightbox(bg)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition shadow">
                <Eye size={14} className="text-gray-700" />
              </button>
              <button onClick={() => excludeBackgroundFromOfferTemplate(combinationId, templateId, bg.id)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition shadow">
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
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-8" onClick={() => setLightbox(null)}>
          <div onClick={e => e.stopPropagation()}>
            <AdTemplate
              projectId={projectId}
              templateId={templateId}
              offer={primaryOffer}
              offers={slotOffers}
              background={lightbox}
              scale={Math.min(1200 / templateWidth, 720 / templateHeight)}
              customFields={customFields}
            />
          </div>
        </div>
      )}

      {/* Zone editor */}
      {editorBg && (
        <TemplateZoneEditor
          templateId={templateId}
          templateName={templateName}
          previewOffer={primaryOffer}
          previewBackground={editorBg}
          onClose={() => setEditorBg(null)}
        />
      )}
    </>
  );
}

// ─── OfferSlotThumbnail ───────────────────────────────────────────────────────
// Car image (no border) + "Offer N" blue pill underneath; click opens picker

export function OfferSlotThumbnail({ slotIndex, offer, allOffers, onSelect }: {
  slotIndex: number;
  offer: Offer | undefined;
  allOffers: Offer[];
  onSelect: (offerId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative" style={{ zIndex: open ? 50 : 10 - slotIndex }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="flex flex-col items-center gap-0.5 hover:opacity-80 transition-opacity"
        title={offer ? `Offer ${slotIndex + 1}: ${offer.year} ${offer.make} ${offer.model}` : `Offer ${slotIndex + 1}: empty`}
      >
        {/* Car image or empty placeholder */}
        {offer ? (
          <div className="relative w-14 h-9">
            <img src={offer.image} alt={offer.model} className="absolute inset-0 w-full h-full object-contain"  />
          </div>
        ) : (
          <div className="w-14 h-9 rounded border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
            <Plus size={13} className="text-gray-400" />
          </div>
        )}
        {/* "Offer N" pill */}
        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold leading-none whitespace-nowrap ${
          offer ? "bg-[var(--brand-accent)] text-white" : "bg-gray-200 text-gray-500"
        }`}>
          Offer {slotIndex + 1}
        </span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 z-50">
          {allOffers.map((o) => (
            <button
              key={o.id}
              onClick={(e) => { e.stopPropagation(); onSelect(o.id); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition text-left ${o.id === offer?.id ? "bg-[var(--brand-accent)/8]" : ""}`}
            >
              <div className="relative w-10 h-7 shrink-0">
                <img src={o.image} alt={o.model} className="absolute inset-0 w-full h-full object-contain"  />
              </div>
              <span className="text-xs font-medium text-gray-800 truncate">
                {o.year} {o.make} {o.model} {o.trim}
              </span>
              {o.id === offer?.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--brand-accent)] shrink-0" />}
            </button>
          ))}
          {offer && (
            <div className="border-t border-gray-100 mt-1 pt-1">
              <button
                onClick={(e) => { e.stopPropagation(); onSelect(""); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition text-left"
              >
                <div className="w-10 h-7 shrink-0 flex items-center justify-center">
                  <X size={14} className="text-gray-400" />
                </div>
                <span className="text-xs font-medium text-gray-500">Leave empty</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── BrandLogoMini ────────────────────────────────────────────────────────────
// Small logo badge — resolves from the active brand kit for a given make+slot.

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

// ─── CombinationAccordion ─────────────────────────────────────────────────────

export function CombinationAccordion({
  combinationId,
  templates,
  allOffers,
  slotOfferIds,
  onSetSlotOffer,
  open,
  onToggle,
  onAddBackground,
  onAddAll,
  onDelete,
  projectId,
}: CombinationAccordionProps) {
  const { getBackgroundsForOfferTemplate, excludeBackgroundFromOfferTemplate, includeBackgroundForOfferTemplate, getBackgroundsForTemplate } = useProjectStore();
  const slotCount = templates[0]?.products ?? 3;

  // Deduplicated backgrounds actually used for this combination (union across all templates)
  const activeBackgrounds = [...new Map(
    templates.flatMap((t) => getBackgroundsForOfferTemplate(combinationId, t.id)).map((bg) => [bg.id, bg])
  ).values()];

  // undefined = never touched → default to first N offers
  // ""        = user explicitly cleared → keep empty
  const effectiveOfferIds = Array.from({ length: slotCount }, (_, i) => {
    const id = slotOfferIds[i];
    return id !== undefined ? id : (allOffers[i]?.id ?? "");
  });

  const effectiveOffers: (Offer | undefined)[] = effectiveOfferIds.map((id) =>
    id ? allOffers.find((o) => o.id === id) : undefined
  );

  // Total assets = sum of visible backgrounds across every template for this combination
  const totalAssets = templates.reduce(
    (sum, t) => sum + getBackgroundsForOfferTemplate(combinationId, t.id).length,
    0
  );

  return (
    <div className="rounded-lg bg-white">
      {/* Header */}
      <div
        role="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group/row rounded-lg"
      >
        {/* Chevron */}
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}

        {/* Slot thumbnails — Figma design: car image + "Offer N" pill, clickable to swap */}
        <div className="flex items-center gap-1">
          {effectiveOffers.map((offer, i) => (
            <OfferSlotThumbnail
              key={i}
              slotIndex={i}
              offer={offer}
              allOffers={allOffers}
              onSelect={(offerId) => onSetSlotOffer(i, offerId)}
            />
          ))}
        </div>

        {/* Label + optional delete */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1">
            <p className="text-sm font-semibold text-gray-900">Multiple offers</p>
            {onDelete && (
              <SubsectionActions
                onDelete={onDelete}
                deleteTip="Remove this combination"
              />
            )}
          </div>
          <p className="text-xs text-gray-400">
            {templates.length} template{templates.length !== 1 ? "s" : ""} · {totalAssets} asset{totalAssets !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Right: thumbnails → logos */}
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
          {[...new Set(templates.flatMap((t) => (t as Template & { logoSlots?: string[] }).logoSlots ?? []))].map((slotType) => {
            const make = effectiveOffers.find(Boolean)?.make ?? "";
            return <BrandLogoMini key={slotType} make={make} slotType={slotType} projectId={projectId} />;
          })}
        </div>
      </div>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-gray-100 rounded-b-lg overflow-visible">
          {templates.map((template, idx) => {
            const templateBgs = getBackgroundsForOfferTemplate(combinationId, template.id);
            const allTemplateBgs = getBackgroundsForTemplate(template.id);
            const hasRemoved = templateBgs.length < allTemplateBgs.length;
            return (
              <div key={template.id} className={`px-4 py-3 group/row ${idx < templates.length - 1 ? "border-b border-gray-50" : ""}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 shrink-0 flex items-center justify-center overflow-hidden">
                    <TemplateWireframe
                      templateId={template.id}
                      scale={Math.min(40 / template.width, 40 / template.height)}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700">{template.name}</span>
                  <SubsectionActions
                    onDelete={() =>
                      templateBgs.forEach((bg) =>
                        excludeBackgroundFromOfferTemplate(combinationId, template.id, bg.id)
                      )
                    }
                    deleteTip="Remove all backgrounds for this template"
                    onAddBackground={() => onAddBackground(template.id)}
                    onRestore={hasRemoved ? () =>
                      allTemplateBgs.forEach((bg) =>
                        includeBackgroundForOfferTemplate(combinationId, template.id, bg.id)
                      ) : undefined}
                    restoreTip="Restore removed backgrounds"
                  />
                </div>
                <KeyMessageInlineInputs templateId={template.id} />
                <CombinationThumbnailRow
                  combinationId={combinationId}
                  templateId={template.id}
                  templateName={template.name}
                  templateWidth={template.width}
                  templateHeight={template.height}
                  slotOffers={effectiveOffers}
                  projectId={projectId}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
