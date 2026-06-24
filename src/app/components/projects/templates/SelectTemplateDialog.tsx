"use client";

import { useState, useEffect } from "react";
import {
  X, Search, Plus, MoreHorizontal,
  ChevronRight, ChevronDown, Folder, LayoutGrid, Clock,
} from "lucide-react";
import { templateLibrary } from "@projects/lib/mock-data";
import type { Template } from "@projects/lib/mock-data";
import { TemplateCard } from "@projects/templates/TemplateCard";
import { CardViewVertical } from "@projects/ui/CardViewVertical";

// ─── Folder types ─────────────────────────────────────────────────────────────

type ActiveFolder = "recents" | "templates" | null;

// ─── Template grouping ────────────────────────────────────────────────────────

const TEMPLATE_GROUPS = [
  {
    id: "single",
    label: "Single Product",
    filter: (t: Template) => t.products === 1,
  },
  {
    id: "multi",
    label: "Multi Product",
    filter: (t: Template) =>
      t.products > 1 && !t.name.toLowerCase().includes("key"),
  },
  {
    id: "keymessage",
    label: "Key Message",
    filter: (t: Template) =>
      t.products > 1 && t.name.toLowerCase().includes("key"),
  },
  {
    id: "pharma",
    label: "Pharma",
    filter: (t: Template) => t.products === 0,
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface SelectTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (templates: Template[]) => void;
  /** IDs already in the project — shown as pre-checked and visually distinct. */
  existingTemplateIds?: Set<string>;
}

// ─── Dialog ───────────────────────────────────────────────────────────────────

export function SelectTemplateDialog({
  open,
  onClose,
  onAdd,
  existingTemplateIds = new Set(),
}: SelectTemplateDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeFolder, setActiveFolder] = useState<ActiveFolder>("templates");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (open) {
      setSelectedIds(new Set());
      setActiveFolder("templates");
      setQuery("");
    }
  }, [open]);

  if (!open) return null;

  // ── Filtering ──────────────────────────────────────────────────────────────

  const visibleTemplates = templateLibrary.filter((t) => {
    if ((t as any).hidden) return false;
    const matchesQuery =
      !query.trim() ||
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.format.toLowerCase().includes(query.toLowerCase()) ||
      t.brand.toLowerCase().includes(query.toLowerCase());
    return matchesQuery;
  });

  function toggleSelect(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  function handleAdd() {
    const selected = templateLibrary.filter(
      (t) => selectedIds.has(t.id) && !existingTemplateIds.has(t.id)
    );
    onAdd(selected);
    onClose();
    setSelectedIds(new Set());
  }

  const newCount = [...selectedIds].filter((id) => !existingTemplateIds.has(id)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-[50px] py-[50px]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full h-full flex flex-col overflow-hidden">

        {/* ── Dialog header ── */}
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Select Template</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={18} />
          </button>
        </div>

        {/* ── Two-panel body ── */}
        <div className="flex flex-1 min-h-0 border-t border-gray-100">

          {/* ── Left: Folder tree ── */}
          <div className="w-[280px] border-r border-gray-100 flex flex-col shrink-0">

            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-semibold text-gray-800">Folders</span>
              <button className="text-gray-400 hover:text-gray-600 transition"><X size={13} /></button>
            </div>

            {/* Search + Add */}
            <div className="flex items-center gap-2 px-3 pb-3">
              <div className="relative flex-1">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  placeholder="Find folder"
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-[var(--brand-accent)]"
                />
              </div>
              <button className="w-7 h-7 flex items-center justify-center bg-[var(--brand-accent)] text-white rounded-full hover:bg-[var(--brand-accent-hover)] transition shrink-0">
                <Plus size={14} />
              </button>
            </div>

            {/* Folder list */}
            <div className="flex-1 overflow-y-auto px-2 py-1 text-xs space-y-0.5">
              <FolderItem
                icon={<Clock size={13} />}
                label="Recents"
                active={activeFolder === "recents"}
                onClick={() => setActiveFolder("recents")}
              />
              <FolderItem
                icon={<FolderIcon />}
                label="Background Collections"
                active={false}
                onClick={() => {}}
              />
              <FolderItem
                icon={<BrandKitIcon />}
                label="Brand Kits"
                active={false}
                onClick={() => {}}
              />
              <FolderItem
                icon={<TemplatesIcon />}
                label="Templates"
                count={templateLibrary.length}
                active={activeFolder === "templates" || activeFolder === null}
                onClick={() => setActiveFolder("templates")}
              />

              <div className="my-1 border-t border-gray-100" />

              <FolderGroup label="Constellation Motors" count={506} expanded>
                <FolderItem icon={<SubFolderIcon />} label="Assets"      count={19}   indent />
                <FolderItem icon={<SubFolderIcon />} label="Components"  count={271}  indent />
                <FolderItem icon={<SubFolderIcon />} label="Jellybeans"  count={1229} indent />
                <FolderItem icon={<SubFolderIcon />} label="Templates"   count={2}    indent />
              </FolderGroup>

              <FolderGroup label="Constellation Internal" count={506} expanded>
                <FolderItem icon={<SubFolderIcon />} label="Backgrounds"          count={55}  indent />
                <FolderItem icon={<SubFolderIcon />} label="Components"           count={26}  indent />
                <FolderItem icon={<SubFolderIcon />} label="Templates"            count={32}  indent />
                <FolderItem icon={<SubFolderIcon />} label="Uploads"              count={56}  indent />
                <FolderItem icon={<FolderIcon />} label="Copy of Components"       count={271} indent />
                <FolderItem icon={<FolderIcon />} label="Easter special"           count={45}  indent />
                <FolderItem icon={<SubFolderIcon />} label="Autobahn Motorcars"   count={45}  indent />
                <FolderItem icon={<SubFolderIcon />} label="Budds' Imported Cars" count={154} indent />
                <FolderItem icon={<SubFolderIcon />} label="Cole European"        count={45}  indent />
              </FolderGroup>
            </div>
          </div>

          {/* ── Right: Content ── */}
          <div className="flex-1 flex flex-col min-w-0">

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 px-5 pt-3 pb-1">
              <span className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer">Portal</span>
              <ChevronRight size={11} className="text-gray-300" />
              <span className="text-xs text-gray-600 font-medium">
                {activeFolder === "recents" ? "Recents" : "Templates"}
              </span>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-2 px-5 py-2">
              <button className="text-gray-400 hover:text-gray-600 transition">
                <Folder size={15} />
              </button>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 flex items-center justify-center bg-[var(--brand-accent)] text-white text-[10px] font-semibold rounded-full">
                  {activeFolder === "recents" ? "↺" : "4"}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {activeFolder === "recents" ? "Recents" : "Templates"}
                </span>
              </div>
              <button className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[var(--brand-accent)] px-3 py-1.5 rounded-full hover:bg-[var(--brand-accent-hover)] transition ml-1">
                <Plus size={12} />
                New
              </button>
              <button className="text-gray-400 hover:text-gray-600 transition">
                <MoreHorizontal size={15} />
              </button>
              <div className="relative ml-auto">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  placeholder="Find below"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-full w-52 focus:outline-none focus:ring-1 focus:ring-[var(--brand-accent)]"
                />
              </div>
            </div>

            {/* Filter bar */}
            <div className="flex items-center gap-2 px-5 py-2 border-b border-gray-100">
              <span className="text-xs text-gray-500">Filtering by</span>
              <span className="flex items-center gap-1 text-xs text-gray-700 bg-white border border-gray-200 rounded-full px-2.5 py-0.5">
                template
                <button className="text-gray-400 hover:text-gray-600 transition ml-0.5"><X size={10} /></button>
              </span>
              <button className="text-xs text-[var(--brand-accent)] font-semibold hover:text-[var(--brand-accent-hover)] transition">Clear Filters</button>
              <span className="ml-auto text-xs text-gray-400">{visibleTemplates.length} / {templateLibrary.length} Items</span>
              <button className="text-gray-400 hover:text-gray-600 transition ml-1"><LayoutGrid size={14} /></button>
            </div>

            {/* Grid — grouped by template type */}
            <div className="flex-1 overflow-y-auto p-5">
              {visibleTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                  <p className="text-sm font-medium">No templates found</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {TEMPLATE_GROUPS.map((group) => {
                    const groupTemplates = visibleTemplates.filter(group.filter);
                    if (groupTemplates.length === 0) return null;
                    return (
                      <div key={group.id}>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-xs font-semibold text-gray-500">{group.label}</span>
                          <div className="flex-1 h-px bg-gray-100" />
                          <span className="text-xs text-gray-400">{groupTemplates.length}</span>
                        </div>
                        <CardViewVertical>
                          {groupTemplates.map((template) => (
                            <div key={template.id} className="relative">
                              {existingTemplateIds.has(template.id) && (
                                <div className="absolute top-2 right-2 z-10 bg-[var(--brand-accent)] text-white text-[10px] font-semibold px-1.5 py-[3px] rounded leading-none">
                                  Added
                                </div>
                              )}
                              <TemplateCard
                                template={template}
                                selected={selectedIds.has(template.id) || existingTemplateIds.has(template.id)}
                                onSelect={(id, checked) => {
                                  if (existingTemplateIds.has(id)) return;
                                  toggleSelect(id, checked);
                                }}
                              />
                            </div>
                          ))}
                        </CardViewVertical>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 shrink-0">
              {selectedIds.size > 0 && (
                <span className="text-xs text-gray-500 mr-auto">
                  {newCount} template{newCount !== 1 ? "s" : ""} selected
                </span>
              )}
              <button
                onClick={onClose}
                className="text-sm font-medium text-gray-700 border border-gray-300 rounded-full px-5 py-2 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={newCount === 0}
                className="text-sm font-semibold text-white bg-[var(--brand-accent)] rounded-full px-5 py-2 hover:bg-[var(--brand-accent-hover)] transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {newCount > 0 ? `Add ${newCount} Template${newCount !== 1 ? "s" : ""}` : "Add"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Folder item ──────────────────────────────────────────────────────────────

function FolderItem({
  icon, label, count, active = false, indent = false, onClick,
}: {
  icon: React.ReactNode; label: string; count?: number;
  active?: boolean; indent?: boolean; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors select-none ${
        active ? "bg-[var(--brand-accent)/8] text-[var(--brand-accent)] font-medium" : "text-gray-600 hover:bg-gray-50"
      } ${indent ? "pl-7" : ""}`}
    >
      <span className="shrink-0 text-[var(--brand-accent)]/60">{icon}</span>
      <span className="flex-1 truncate text-[11.5px]">{label}</span>
      {count !== undefined && <span className="text-[10px] text-gray-400 shrink-0">({count})</span>}
    </div>
  );
}

// ─── Folder group ─────────────────────────────────────────────────────────────

function FolderGroup({
  label, count, expanded: defaultExpanded = false, indent = false, children,
}: {
  label: string; count?: number; expanded?: boolean; indent?: boolean; children?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <div className={indent ? "pl-5" : ""}>
      <div
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 px-2 py-1.5 text-gray-600 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors select-none"
      >
        {expanded
          ? <ChevronDown size={12} className="text-gray-400 shrink-0" />
          : <ChevronRight size={12} className="text-gray-400 shrink-0" />}
        <span className="text-[11.5px] font-medium text-gray-700 truncate flex-1">{label}</span>
        {count !== undefined && <span className="text-[10px] text-gray-400 shrink-0">({count})</span>}
      </div>
      {expanded && <div>{children}</div>}
    </div>
  );
}

// ─── Icons (match SelectBackgroundDialog style) ───────────────────────────────

function FolderIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 4.5A1.5 1.5 0 013.5 3H6l1.5 2H13a1.5 1.5 0 011.5 1.5v6A1.5 1.5 0 0113 14H3.5A1.5 1.5 0 012 12.5v-8z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function SubFolderIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 4.5A1.5 1.5 0 013.5 3H6l1.5 2H13a1.5 1.5 0 011.5 1.5v6A1.5 1.5 0 0113 14H3.5A1.5 1.5 0 012 12.5v-8z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" opacity="0.5" />
    </svg>
  );
}

function BrandKitIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="8" r="2" fill="currentColor" />
    </svg>
  );
}

function TemplatesIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 5.5h12M6 5.5V14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
