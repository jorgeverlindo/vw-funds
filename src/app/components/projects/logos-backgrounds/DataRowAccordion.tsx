"use client";


import { ChevronDown, ChevronRight } from "lucide-react";
import { SubsectionActions } from "./SubsectionActions";
import type { BackgroundCollection } from "./BackgroundCollectionCard";
import type { Template } from "@projects/lib/mock-data";
import type { DataRow } from "@projects/lib/project-store";
import { useProjectStore } from "@projects/lib/project-store";
import { PharmaAdTemplate } from "@projects/templates/AdTemplate";
import { thumbnailScale } from "@projects/lib/thumbnail-scale";
import { getSquareThumbnail } from "@projects/lib/bg-thumbnail";

interface DataRowAccordionProps {
  row: DataRow;
  rowIndex: number;
  backgrounds: BackgroundCollection[];
  templates: Template[];
  open: boolean;
  onToggle: () => void;
  onAddBackground: (templateId: string) => void;
  onAddAll: () => void;
  /** Project ID — forwarded to PharmaAdTemplate for logo resolution */
  projectId: string;
  /** OEM / make key used to resolve the brand kit (e.g. "Spiriva") */
  make: string;
}

export function DataRowAccordion({
  row,
  rowIndex,
  backgrounds,
  templates,
  open,
  onToggle,
  onAddBackground,
  onAddAll,
  projectId,
  make,
}: DataRowAccordionProps) {
  const {
    getBackgroundsForOfferTemplate,
    excludeBackgroundFromOfferTemplate,
    includeBackgroundForOfferTemplate,
  } = useProjectStore();

  // Label: first non-empty data value, fallback to "Row N"
  const firstValue = Object.values(row.data).find((v) => v.trim() !== "");
  const label = firstValue ?? `Row ${rowIndex + 1}`;

  // All backgrounds assigned to this row across all templates (deduplicated)
  const activeBgs = [
    ...new Map(
      templates.flatMap((t) => getBackgroundsForOfferTemplate(row.id, t.id)).map((bg) => [bg.id, bg])
    ).values(),
  ];

  const total = templates.reduce(
    (sum, t) => sum + getBackgroundsForOfferTemplate(row.id, t.id).length,
    0
  );

  function deleteAll() {
    templates.forEach((t) =>
      getBackgroundsForOfferTemplate(row.id, t.id).forEach((bg) =>
        excludeBackgroundFromOfferTemplate(row.id, t.id, bg.id)
      )
    );
  }

  return (
    <div className="rounded-lg bg-white">
      {/* ── Header ── */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onToggle()}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer rounded-lg group/row"
      >
        {open
          ? <ChevronDown size={15} className="text-gray-400 shrink-0" />
          : <ChevronRight size={15} className="text-gray-400 shrink-0" />}

        {/* Row number badge — mirrors the template mini-preview spot */}
        <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-[var(--brand-accent)/8] rounded-lg">
          <span className="text-sm font-bold text-[var(--brand-accent)]">{rowIndex + 1}</span>
        </div>

        {/* Title + subtitle */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center">
            <p className="text-sm font-semibold text-gray-900 truncate">{label}</p>
            <SubsectionActions
              onDelete={deleteAll}
              onAddBackground={onAddAll}
              deleteTip="Delete all backgrounds for this row"
              editTip="Edit all assets for this row"
            />
          </div>
          <p className="text-xs text-gray-400">
            Row {rowIndex + 1} · {templates.length} template{templates.length !== 1 ? "s" : ""} · {total} asset{total !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Background thumbnails strip — same as TemplateGroupAccordion */}
        {!open && activeBgs.length > 0 && (
          <div className="relative flex items-center shrink-0">
            <span className="absolute -top-2 -right-1 z-10 w-5 h-5 flex items-center justify-center bg-[var(--brand-accent)] text-white text-[10px] font-bold rounded-full">
              {activeBgs.length}
            </span>
            <div className="flex gap-0.5">
              {activeBgs.slice(0, 4).map((bg) => (
                <div key={bg.id} className="w-[38px] h-[26px] rounded border border-gray-200 shrink-0 overflow-hidden relative">
                  <img src={getSquareThumbnail(bg)} alt={bg.name} className="absolute inset-0 w-full h-full object-cover"  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      {open && (
        <div className="border-t border-gray-100">
          {templates.map((template, ti) => {
            const bgs = getBackgroundsForOfferTemplate(row.id, template.id);
            const scale = thumbnailScale(template.width, template.height);

            return (
              <div
                key={template.id}
                className={`px-4 py-3 group/row ${ti < templates.length - 1 ? "border-b border-gray-50" : ""}`}
              >
                {/* Sub-row header */}
                <div className="flex items-center gap-2 mb-2">
                  {/* Template mini-preview — scaled to 32px */}
                  <div className="w-8 h-8 shrink-0 flex items-center justify-center overflow-hidden">
                    <PharmaAdTemplate
                      templateId={template.id}
                      background={{ id: "__placeholder__", name: "", type: "", sizes: 0, folder: "", color: "#ddd", thumbnail: "", images: {} }}
                      scale={Math.min(32 / template.width, 32 / template.height)}
                      projectId={projectId}
                      make={make}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700">{template.name}</span>
                  <span className="text-[10px] text-gray-400">{template.width}×{template.height}</span>
                  <SubsectionActions
                    onDelete={() =>
                      bgs.forEach((bg) => excludeBackgroundFromOfferTemplate(row.id, template.id, bg.id))
                    }
                    onAddBackground={() => onAddBackground(template.id)}
                    deleteTip="Remove all backgrounds for this row × template"
                    editTip="Edit assets for this row × template"
                    onRestore={
                      bgs.length < backgrounds.length
                        ? () =>
                            backgrounds.forEach((bg) =>
                              includeBackgroundForOfferTemplate(row.id, template.id, bg.id)
                            )
                        : undefined
                    }
                    restoreTip="Restore removed backgrounds"
                  />
                </div>

                {/* Backgrounds grid */}
                <div className="flex flex-wrap gap-2">
                  {bgs.map((bg) => (
                    <div key={bg.id} className="relative shrink-0 group/thumb rounded overflow-hidden">
                      <PharmaAdTemplate
                        templateId={template.id}
                        background={bg}
                        scale={scale}
                        projectId={projectId}
                        make={make}
                        dataFields={row.data}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center gap-1.5 z-10 rounded">
                        <button
                          onClick={() => excludeBackgroundFromOfferTemplate(row.id, template.id, bg.id)}
                          className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition shadow"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
