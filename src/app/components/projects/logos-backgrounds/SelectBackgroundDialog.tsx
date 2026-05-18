"use client";

import { useState, useEffect } from "react";
import {
  X, Search, Plus, MoreHorizontal, Clock, Trash2,
  ChevronRight, ChevronDown, Folder, LayoutGrid,
} from "lucide-react";
import { backgroundCollections, templates } from "@projects/lib/mock-data";
import { matchesLifestyle, matchesMultiLifestyle } from "@projects/lib/lifestyle-data";
import { BackgroundCollectionCard, BackgroundCollection } from "./BackgroundCollectionCard";
import { CardViewVertical } from "@projects/ui/CardViewVertical";

interface SelectBackgroundDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (collections: BackgroundCollection[]) => void;
  /** Which folder to open on. null = show all (offer/template context). */
  initialFolder?: "recents" | "background-collections" | null;
  /** Pre-select a size filter chip when the dialog opens. null = "All Sizes". */
  initialSizeFilter?: string | null;
  /** Single-offer context: model+trim string (e.g. "CR-V TrailSport AWD") */
  vehicleFilter?: string;
  /** Combo context: array of model+trim strings for each slot */
  vehicleFilters?: string[];
}

export function SelectBackgroundDialog({
  open,
  onClose,
  onAdd,
  initialFolder = null,
  initialSizeFilter = null,
  vehicleFilter,
  vehicleFilters,
}: SelectBackgroundDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeFolder, setActiveFolder] = useState<"recents" | "background-collections" | null>(initialFolder ?? null);

  useEffect(() => {
    if (open) {
      setSelectedIds(new Set());
      setActiveFolder(initialFolder ?? null);
    }
  }, [open, initialFolder]);

  if (!open) return null;

  // ── Filtering ──────────────────────────────────────────────────────────────
  const allLifestyle = backgroundCollections.filter((c) => c.isLifestyle);
  const allRegular   = backgroundCollections.filter((c) => !c.isLifestyle);

  const isComboContext      = !!(vehicleFilters?.length);
  const isSingleOfferContext = vehicleFilter !== undefined;

  const lifestyleVisible = allLifestyle.filter((c) => {
    const isMultiVehicle = !!(c.vehicleTags?.length);
    if (isComboContext) {
      if (!isMultiVehicle) return false;
      return matchesMultiLifestyle(c, vehicleFilters!);
    }
    if (isSingleOfferContext) {
      if (isMultiVehicle) return false;
      return matchesLifestyle(c, vehicleFilter!);
    }
    return true;
  });
  const regularVisible = allRegular;
  const totalVisible   = lifestyleVisible.length + regularVisible.length;

  function toggleSelect(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  function handleAdd() {
    const selected = [...lifestyleVisible, ...regularVisible].filter((c) => selectedIds.has(c.id));
    onAdd(selected);
    onClose();
    setSelectedIds(new Set());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-[50px] py-[50px]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full h-full flex flex-col overflow-hidden">

        {/* ── Dialog header ── */}
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Select Background</h2>
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
              <FolderItem icon={<Clock size={13} />} label="Recents" active={activeFolder === "recents" || activeFolder === null} onClick={() => setActiveFolder("recents")} />
              <FolderItem icon={<FolderIcon />} label="Background Collections" active={activeFolder === "background-collections"} onClick={() => setActiveFolder("background-collections")} />
              <FolderGroup label="Brand Kits" icon={<BrandKitIcon />} />

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
                <FolderItem icon={<FolderIcon />} label="Easter special backgrounds" count={45}  indent />
                <FolderItem icon={<FolderIcon />} label="Lifestyle images Audi"    count={53}  indent />
                <FolderItem icon={<FolderIcon />} label="Bob's Sandbox"            count={98}  indent />
                <FolderItem icon={<SubFolderIcon />} label="Autobahn Motorcars"   count={45}  indent />
                <FolderItem icon={<SubFolderIcon />} label="Budds' Imported Cars" count={154} indent />
                <FolderItem icon={<SubFolderIcon />} label="Cole European"        count={45}  indent />
                <FolderItem icon={<SubFolderIcon />} label="Coventry Lane Land Rover" count={53} indent />
                <FolderItem icon={<SubFolderIcon />} label="Coventry North Land Rover - Coventry North Jaguar" count={123} indent />
                <FolderGroup label="Decarie Motors - Decarie Motors, Inc." count={98} indent />
                <FolderItem icon={<SubFolderIcon />} label="DeNooyer Jaguar" count={121} indent />
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
                {activeFolder === "background-collections" ? "Background Collections" : "Recents"}
              </span>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-2 px-5 py-2">
              <button className="text-gray-400 hover:text-gray-600 transition">
                <Folder size={15} />
              </button>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 flex items-center justify-center bg-[var(--brand-accent)] text-white text-[10px] font-semibold rounded-full">1</span>
                <span className="text-sm font-semibold text-gray-900">
                  {activeFolder === "background-collections" ? "Background Collections" : "Recents"}
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
                  className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-full w-52 focus:outline-none focus:ring-1 focus:ring-[var(--brand-accent)]"
                />
              </div>
            </div>

            {/* Filter bar */}
            <div className="flex items-center gap-2 px-5 py-2 border-b border-gray-100">
              <span className="text-xs text-gray-500">Filtering by</span>
              <span className="flex items-center gap-1 text-xs text-gray-700 bg-white border border-gray-200 rounded-full px-2.5 py-0.5">
                background
                <button className="text-gray-400 hover:text-gray-600 transition ml-0.5"><X size={10} /></button>
              </span>
              <button className="text-xs text-[var(--brand-accent)] font-semibold hover:text-[var(--brand-accent-hover)] transition">Clear Filters</button>
              <span className="ml-auto text-xs text-gray-400">{totalVisible} / {backgroundCollections.length} Items</span>
              <button className="text-gray-400 hover:text-gray-600 transition ml-1"><LayoutGrid size={14} /></button>
            </div>

            {/* Info bar — only shown in Recents */}
            {activeFolder !== "background-collections" && (
              <div className="flex items-center gap-2 px-5 py-2 bg-blue-50 border-b border-blue-100">
                <div className="w-4 h-4 rounded-full border border-blue-400 flex items-center justify-center shrink-0">
                  <span className="text-[9px] text-blue-500 font-bold leading-none">i</span>
                </div>
                <span className="text-xs text-blue-700">You're viewing recent assets across all folders.</span>
                <button className="text-xs text-blue-700 font-semibold hover:text-blue-900 transition ml-0.5">Show folders</button>
              </div>
            )}

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-5">
              {(() => {
                const showLifestyle = activeFolder !== "background-collections";
                const showRegular   = activeFolder !== "recents";
                const visibleItems  = [
                  ...(showLifestyle ? lifestyleVisible : []),
                  ...(showRegular   ? regularVisible   : []),
                ];

                if (visibleItems.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                      <p className="text-sm font-medium">No items in this folder</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    {/* Lifestyle Images — shown in Recents or All */}
                    {showLifestyle && lifestyleVisible.length > 0 && (
                      <div>
                        {showRegular && regularVisible.length > 0 && (
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-xs font-semibold text-violet-700">Lifestyle Images</span>
                            {vehicleFilter && (
                              <span className="text-[10px] bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-medium">{vehicleFilter}</span>
                            )}
                            {isComboContext && vehicleFilters!.map((vf, i) => (
                              <span key={i} className="text-[10px] bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-medium">{vf}</span>
                            ))}
                            <div className="flex-1 h-px bg-violet-100" />
                          </div>
                        )}
                        <CardViewVertical>
                          {lifestyleVisible.map((collection) => (
                            <BackgroundCollectionCard
                              key={collection.id}
                              collection={collection}
                              selected={selectedIds.has(collection.id)}
                              onSelect={toggleSelect}
                            />
                          ))}
                        </CardViewVertical>
                      </div>
                    )}

                    {/* Background Collections — shown in Background Collections or All */}
                    {showRegular && regularVisible.length > 0 && (
                      <div>
                        {showLifestyle && lifestyleVisible.length > 0 && (
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-xs font-semibold text-gray-500">Background Collections</span>
                            <div className="flex-1 h-px bg-gray-100" />
                          </div>
                        )}
                        <CardViewVertical>
                          {regularVisible.map((collection) => (
                            <BackgroundCollectionCard
                              key={collection.id}
                              collection={collection}
                              selected={selectedIds.has(collection.id)}
                              onSelect={toggleSelect}
                            />
                          ))}
                        </CardViewVertical>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100">
              <button
                onClick={onClose}
                className="text-sm font-medium text-gray-700 border border-gray-300 rounded-full px-5 py-2 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={selectedIds.size === 0}
                className="text-sm font-semibold text-white bg-[var(--brand-accent)] rounded-full px-6 py-2 hover:bg-[var(--brand-accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FolderItem({
  icon,
  label,
  count,
  active = false,
  indent = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  active?: boolean;
  indent?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
        active ? "bg-[var(--brand-accent)/8] text-[var(--brand-accent)] font-medium" : "text-gray-600 hover:bg-gray-50"
      } ${indent ? "pl-7" : ""}`}
    >
      <span className="shrink-0 text-[var(--brand-accent)]/60">{icon}</span>
      <span className="flex-1 truncate text-[11.5px]">{label}</span>
      {count !== undefined && (
        <span className="text-[10px] text-gray-400 shrink-0">({count})</span>
      )}
    </div>
  );
}

function FolderGroup({
  label,
  count,
  expanded = false,
  indent = false,
  icon,
  children,
}: {
  label: string;
  count?: number;
  expanded?: boolean;
  indent?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <div className={`flex items-center gap-2 px-2 py-1.5 text-gray-600 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors ${indent ? "pl-7" : ""}`}>
        {expanded
          ? <ChevronDown size={12} className="text-gray-400 shrink-0" />
          : <ChevronRight size={12} className="text-gray-400 shrink-0" />}
        <span className="shrink-0 text-gray-400">{icon ?? <FolderIcon />}</span>
        <span className="flex-1 text-[11.5px] truncate">{label}</span>
        {count !== undefined && <span className="text-[10px] text-gray-400 shrink-0">({count})</span>}
      </div>
      {expanded && children && <div>{children}</div>}
    </div>
  );
}

function FolderIcon() {
  return <Folder size={13} className="text-[var(--brand-accent)]/60" />;
}

// Alias — kept for readability, same visual
const SubFolderIcon = FolderIcon;

function BrandKitIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" />
    </svg>
  );
}
