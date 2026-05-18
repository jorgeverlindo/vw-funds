"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil, MoreHorizontal, Trash2 } from "lucide-react";
import { TemplateWireframe } from "@projects/templates/TemplateWireframe";
import { TemplateZoneEditor } from "@projects/templates/TemplateZoneEditor";
import { AssetCard } from "@projects/ui/AssetCard";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "../../ui/dropdown-menu";

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

export function TemplateCard({ template, selected = false, onSelect, onDelete }: TemplateCardProps) {
  const [editorOpen, setEditorOpen] = useState(false);

  return (
    <>
      <AssetCard
        selected={selected}
        onSelect={(checked) => onSelect?.(template.id, checked)}
        menuButton={
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
