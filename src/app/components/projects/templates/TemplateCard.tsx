"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Pencil, MoreHorizontal, Trash2, Eye, X } from "lucide-react";
import { TemplateWireframe } from "@projects/templates/TemplateWireframe";
import { TemplateZoneEditor } from "@projects/templates/TemplateZoneEditor";
import { AssetCard } from "@projects/ui/AssetCard";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "../../ui/dropdown-menu";
import { useComments } from "@comments";

interface Template {
  id: string;
  name: string;
  format: string;
  width: number;
  height: number;
  brand: string;
}

interface TemplateCardProps {
  template: Template;
  selected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
  onDelete?: () => void;
}

function TemplatePreview({
  templateId,
  width,
  height,
  onEdit,
}: {
  templateId: string;
  width: number;
  height: number;
  onEdit: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [side, setSide] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setSide(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Scale wireframe to fit inside the square with a small inset
  const inset = 24;
  const available = Math.max(0, side - inset);
  const scale = available > 0 ? Math.min(available / width, available / height) : 0;

  return (
    /*
     * AssetCard's thumbnail shell provides: bg-[#f0f2f4], rounded-[16px],
     * overflow-hidden. This div just fills that space and centers the wireframe.
     */
    <div
      ref={containerRef}
      className="w-full h-full absolute inset-0 flex items-center justify-center group/preview"
    >
      {scale > 0 && (
        <>
          <TemplateWireframe templateId={templateId} scale={scale} showText />
          {/* Edit overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity bg-black/20">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 shadow hover:bg-[#f0f2f4] transition"
            >
              <Pencil size={11} />
              Edit zones
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Template Preview Modal ────────────────────────────────────────────────────

function TemplatePreviewModal({
  template,
  onClose,
  onEditZones,
}: {
  template: Template;
  onClose: () => void;
  onEditZones: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      const padding = 48;
      const s = Math.min(
        (width  - padding) / template.width,
        (height - padding) / template.height,
      );
      setScale(Math.max(0, s));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [template.width, template.height]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <div className="relative bg-white rounded-[16px] shadow-2xl flex flex-col w-full max-w-[860px] max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E6F0] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-[8px] bg-[#f0f2f4] flex items-center justify-center shrink-0">
              <Eye size={14} className="text-[#686576]" />
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-medium text-[#1f1d25] truncate">{template.name}</p>
              <p className="text-[11px] text-[#9c99a9]">
                {template.format} · {template.width}×{template.height} · {template.brand}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer ml-4 shrink-0"
          >
            <X size={18} className="text-[#686576]" />
          </button>
        </div>

        {/* Preview area */}
        <div
          ref={containerRef}
          className="flex-1 flex items-center justify-center bg-[#f0f2f4] overflow-hidden"
          style={{ minHeight: 320 }}
        >
          {scale > 0 && (
            <TemplateWireframe templateId={template.id} scale={scale} showText />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E8E6F0] shrink-0 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-[7px] rounded-full text-[13px] font-medium text-[#686576] hover:bg-[#f0f2f4] transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => { onClose(); onEditZones(); }}
            className="flex items-center gap-2 px-4 py-[7px] rounded-full text-[13px] font-medium bg-[#473bab] hover:bg-[#392e8a] text-white transition-colors cursor-pointer shadow-sm"
          >
            <Pencil size={12} />
            Edit zones
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ─── Template Card ─────────────────────────────────────────────────────────────

export function TemplateCard({ template, selected = false, onSelect, onDelete }: TemplateCardProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const commentsCtx = useComments();

  return (
    <>
      <AssetCard
        selected={selected}
        onSelect={(checked) => onSelect?.(template.id, checked)}
        menuButton={
          <div className="flex items-center gap-1">
            {commentsCtx && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  commentsCtx.openPanelForEntity({ id: template.id, label: template.name, type: "template" });
                }}
                title="Comment on this template"
                className="flex items-center justify-center w-6 h-6 rounded-md bg-white/80 hover:bg-white text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </button>
            )}
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center w-6 h-6 rounded-md bg-white/80 hover:bg-white text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <MoreHorizontal size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="z-[300] bg-white rounded-xl shadow-xl border border-[rgba(0,0,0,0.12)] p-1 min-w-[180px] animate-in fade-in-0 zoom-in-95"
              align="end"
              sideOffset={4}
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-[#1f1d25] cursor-pointer outline-none focus:bg-gray-50 data-[highlighted]:bg-gray-50"
                onClick={(e) => { e.stopPropagation(); setPreviewOpen(true); }}
              >
                <Eye size={13} className="text-gray-400" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-[#1f1d25] cursor-pointer outline-none focus:bg-gray-50 data-[highlighted]:bg-gray-50"
                onClick={(e) => { e.stopPropagation(); setEditorOpen(true); }}
              >
                <Pencil size={13} className="text-gray-400" />
                Edit zones
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-[#D2323F] cursor-pointer outline-none focus:bg-red-50 data-[highlighted]:bg-red-50"
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                >
                  <Trash2 size={13} className="text-[#D2323F]" />
                  Remove from project
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        }
        preview={
          <TemplatePreview
            templateId={template.id}
            width={template.width}
            height={template.height}
            onEdit={() => setEditorOpen(true)}
          />
        }
        footer={
          <>
            <div className="flex items-start justify-between gap-1 min-w-0">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-gray-900 leading-snug truncate">
                  {template.name}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {template.format} · {template.width}×{template.height}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditorOpen(true);
                }}
                className="shrink-0 text-gray-300 hover:text-[var(--brand-accent)] transition mt-0.5"
                title="Edit zone layout"
              >
                <Pencil size={12} />
              </button>
            </div>
            <div className="mt-2">
              <span className="text-[11px] text-gray-600 bg-[#f0f2f4] px-2 py-[3px] rounded">
                {template.brand}
              </span>
            </div>
          </>
        }
      />

      {previewOpen && (
        <TemplatePreviewModal
          template={template}
          onClose={() => setPreviewOpen(false)}
          onEditZones={() => setEditorOpen(true)}
        />
      )}

      {editorOpen && (
        <TemplateZoneEditor
          templateId={template.id}
          templateName={template.name}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </>
  );
}
