import { useState, useMemo } from "react";
import {
  Search, Plus, MoreVertical, Globe, Layers,
  ChevronDown, Check, Trash2, PanelLeft,
} from "lucide-react";
import { useSidebar } from "@projects/lib/sidebar-context";
import { getProjectById } from "@projects/lib/mock-data";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "../ui/dropdown-menu";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeneratedAsset {
  key: string;
  offer: { id: string; year: string; make: string; model: string; trim: string; image?: string };
  template: { id: string; name: string; format?: string; width: number; height: number };
  bgId: string | null;
}

interface AdShell {
  id: string;
  name: string;
  platform: string;
  folder: string;
  assetKeys: string[];
}

// ─── Platform options ─────────────────────────────────────────────────────────

const PLATFORM_OPTIONS = [
  { id: "web",       label: "Website",       icon: <Globe size={12} /> },
  { id: "facebook",  label: "Facebook",      icon: <Globe size={12} /> },
  { id: "instagram", label: "Instagram",     icon: <Globe size={12} /> },
  { id: "google",    label: "Google",        icon: <Globe size={12} /> },
];

// ─── AdShell card ─────────────────────────────────────────────────────────────

function AdShellCard({
  shell,
  assets,
  isEditing,
  onClick,
  onDelete,
}: {
  shell: AdShell;
  assets: GeneratedAsset[];
  isEditing: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const preview = assets.slice(0, 4);
  const extra   = assets.length - 4;

  return (
    <div
      className="group relative flex flex-col gap-2 cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {/* Thumbnail stack / grid */}
      <div
        className="relative rounded-xl overflow-hidden bg-[#F4F5F6] transition-all"
        style={{
          width: 200,
          height: 150,
          outline: isEditing || hovered ? "2px solid var(--brand-accent)" : "2px solid transparent",
          outlineOffset: 1,
        }}
      >
        {assets.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[var(--ink-tertiary)]">
            <Layers size={24} strokeWidth={1.5} />
            <span className="text-[11px]">No assets</span>
          </div>
        ) : hovered && preview.length > 1 ? (
          /* 2×2 grid on hover */
          <div className="grid grid-cols-2 w-full h-full">
            {preview.map((a, i) => (
              <div key={a.key} className="relative bg-[#ecedf0] overflow-hidden">
                {a.offer.image ? (
                  <img src={a.offer.image} alt={a.offer.model} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-[var(--ink-tertiary)]">
                    {a.template.name.slice(0, 6)}
                  </div>
                )}
                {i === 3 && extra > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="text-white text-[13px] font-semibold">+{extra}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Stacked cards default */
          <>
            {[2, 1, 0].map((idx) => {
              const a = assets[idx];
              if (!a) return null;
              const rot = idx === 2 ? -5 : idx === 1 ? 5 : 0;
              const op  = idx === 0 ? 1 : 0.45;
              return (
                <div
                  key={a.key}
                  className="absolute inset-[16px] rounded-lg overflow-hidden bg-[#dddce0]"
                  style={{ transform: `rotate(${rot}deg)`, opacity: op, zIndex: idx + 1 }}
                >
                  {a.offer.image ? (
                    <img src={a.offer.image} alt={a.offer.model} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-[var(--ink-tertiary)]">
                      {a.template.name.slice(0, 8)}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* Platform badge */}
        <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] text-[var(--ink-secondary)] shadow-sm">
          <Globe size={10} />
          {PLATFORM_OPTIONS.find(p => p.id === shell.platform)?.label ?? shell.platform}
        </div>

        {/* Count badge */}
        <div className="absolute top-2 right-2 z-10 bg-black/50 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">
          {assets.length}
        </div>
      </div>

      {/* Footer: name + menu */}
      <div className="flex items-center justify-between px-0.5">
        <span className="text-[12px] font-medium text-[var(--ink)] truncate max-w-[160px]">{shell.name}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
            <button className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded hover:bg-[#F0EFF5] transition cursor-pointer">
              <MoreVertical size={13} className="text-[var(--ink-secondary)]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
              <Trash2 size={13} className="mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ─── Shell edit panel ─────────────────────────────────────────────────────────

function ShellEditPanel({
  shell,
  assets,
  onUpdate,
  onClose,
}: {
  shell: AdShell;
  assets: GeneratedAsset[];
  onUpdate: (patch: Partial<AdShell>) => void;
  onClose: () => void;
}) {
  const [name, setName]         = useState(shell.name);
  const [platform, setPlatform] = useState(shell.platform);
  const [folder, setFolder]     = useState(shell.folder);
  const [showPlatform, setShowPlatform] = useState(false);

  return (
    <div
      className="flex flex-col h-full border-l border-[var(--border)] bg-white shrink-0"
      style={{ width: 300 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <span className="text-[13px] font-semibold text-[var(--ink)]">Edit Ad Shell</span>
        <button onClick={onClose} className="text-[var(--ink-tertiary)] hover:text-[var(--ink)] transition cursor-pointer text-[18px] leading-none">×</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-[var(--ink-secondary)] uppercase tracking-wide">Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 text-[13px] rounded-lg border border-[var(--border)] bg-white text-[var(--ink)] focus:outline-none focus:border-[var(--brand-accent)] transition"
          />
        </div>

        {/* Platform */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-[var(--ink-secondary)] uppercase tracking-wide">Platform</label>
          <div className="relative">
            <button
              onClick={() => setShowPlatform(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2 text-[13px] rounded-lg border border-[var(--border)] bg-white text-[var(--ink)] cursor-pointer"
            >
              <span>{PLATFORM_OPTIONS.find(p => p.id === platform)?.label ?? platform}</span>
              <ChevronDown size={13} />
            </button>
            {showPlatform && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[var(--border)] rounded-lg shadow-md z-10 overflow-hidden">
                {PLATFORM_OPTIONS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setPlatform(p.id); setShowPlatform(false); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-[13px] hover:bg-[#F4F5F6] transition cursor-pointer"
                  >
                    {p.label}
                    {platform === p.id && <Check size={13} className="text-[var(--brand-accent)]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Folder */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-[var(--ink-secondary)] uppercase tracking-wide">Folder</label>
          <input
            value={folder}
            onChange={e => setFolder(e.target.value)}
            placeholder="e.g. May Campaign"
            className="w-full px-3 py-2 text-[13px] rounded-lg border border-[var(--border)] bg-white text-[var(--ink)] placeholder:text-[var(--ink-tertiary)] focus:outline-none focus:border-[var(--brand-accent)] transition"
          />
        </div>

        {/* Assets preview */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-medium text-[var(--ink-secondary)] uppercase tracking-wide">
            Assets ({assets.length})
          </label>
          <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
            {assets.length === 0 ? (
              <p className="text-[12px] text-[var(--ink-tertiary)]">No assets in this shell.</p>
            ) : assets.map(a => (
              <div key={a.key} className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-[#F4F5F6]">
                <div className="w-8 h-6 rounded bg-[#dddce0] overflow-hidden shrink-0">
                  {a.offer.image && <img src={a.offer.image} alt="" className="w-full h-full object-cover" />}
                </div>
                <span className="text-[11px] text-[var(--ink)] truncate flex-1">
                  {a.offer.year} {a.offer.make} {a.offer.model} — {a.template.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-2 px-4 py-3 border-t border-[var(--border)]">
        <button
          onClick={onClose}
          className="flex-1 py-2 rounded-full text-[13px] font-medium text-[var(--ink-secondary)] border border-[#CAC9CF] hover:bg-gray-50 transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={() => { onUpdate({ name, platform, folder }); onClose(); }}
          className="flex-1 py-2 rounded-full text-[13px] font-semibold text-white cursor-pointer transition"
          style={{ background: "linear-gradient(99deg, var(--brand-accent) 0%, var(--brand-mid) 100%)" }}
        >
          Save
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AdShellsPage({
  projectId,
  projectName,
  generatedAssets,
  onClose,
}: {
  projectId: string;
  projectName: string;
  generatedAssets: GeneratedAsset[];
  onClose: () => void;
}) {
  const { toggleSidebar, sidebarOpen } = useSidebar();
  const project = getProjectById(projectId);
  const [query, setQuery]               = useState("");
  const [editingShellId, setEditingShellId] = useState<string | null>(null);

  // Auto-generate shells from assets grouped by template
  const [shells, setShells] = useState<AdShell[]>(() => {
    const map = new Map<string, string[]>();
    generatedAssets.forEach(a => {
      const key = a.template.id;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a.key);
    });
    return Array.from(map.entries()).map(([templateId, assetKeys], i) => {
      const tmpl = generatedAssets.find(a => a.template.id === templateId)?.template;
      return {
        id: `shell-${templateId}`,
        name: tmpl?.name ?? `Ad Shell ${i + 1}`,
        platform: "web",
        folder: projectName,
        assetKeys,
      };
    });
  });

  const filtered = useMemo(() =>
    shells.filter(s => s.name.toLowerCase().includes(query.toLowerCase())),
    [shells, query]
  );

  const editingShell = shells.find(s => s.id === editingShellId) ?? null;
  const shellAssets  = (shell: AdShell) => generatedAssets.filter(a => shell.assetKeys.includes(a.key));

  function addShell() {
    const id = `shell-${Date.now()}`;
    setShells(prev => [...prev, { id, name: `Ad Shell ${prev.length + 1}`, platform: "web", folder: projectName, assetKeys: [] }]);
    setEditingShellId(id);
  }

  function updateShell(id: string, patch: Partial<AdShell>) {
    setShells(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  }

  function deleteShell(id: string) {
    setShells(prev => prev.filter(s => s.id !== id));
    if (editingShellId === id) setEditingShellId(null);
  }

  return (
    <div className="flex flex-row h-full overflow-hidden">
      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--border)] shrink-0">
          <button
            onClick={toggleSidebar}
            className={`w-7 h-7 flex items-center justify-center rounded-md transition shrink-0 cursor-pointer ${sidebarOpen ? "text-[var(--brand-accent)] bg-[rgba(71,59,171,0.08)]" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}
          >
            <PanelLeft size={16} />
          </button>
          <div className="flex-1 flex items-center gap-2 bg-[#F4F5F6] rounded-lg px-3 py-1.5">
            <Search size={13} className="text-[var(--ink-tertiary)] shrink-0" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search ad shells…"
              className="bg-transparent text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-tertiary)] outline-none flex-1"
            />
          </div>
          <button
            onClick={addShell}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium text-white cursor-pointer shrink-0 transition"
            style={{ background: "linear-gradient(99deg, var(--brand-accent) 0%, var(--brand-mid) 100%)" }}
          >
            <Plus size={13} strokeWidth={2.5} />
            Create Ad Shell
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgba(71,59,171,0.08), rgba(99,86,225,0.05))" }}>
                <Layers size={24} className="text-[var(--brand-accent)]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[var(--ink)] mb-1">No ad shells yet</p>
                <p className="text-[12px] text-[var(--ink-secondary)] max-w-[260px] leading-relaxed">
                  {generatedAssets.length === 0
                    ? "Generate assets in the Preview section first, then create ad shells to organize them."
                    : "Click \"Create Ad Shell\" to group your generated assets for specific platforms."}
                </p>
              </div>
              {generatedAssets.length > 0 && (
                <button
                  onClick={addShell}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium text-white cursor-pointer transition"
                  style={{ background: "linear-gradient(99deg, var(--brand-accent) 0%, var(--brand-mid) 100%)" }}
                >
                  <Plus size={13} strokeWidth={2.5} />
                  Create Ad Shell
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-6">
              {filtered.map(shell => (
                <AdShellCard
                  key={shell.id}
                  shell={shell}
                  assets={shellAssets(shell)}
                  isEditing={editingShellId === shell.id}
                  onClick={() => setEditingShellId(prev => prev === shell.id ? null : shell.id)}
                  onDelete={() => deleteShell(shell.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit panel */}
      {editingShell && (
        <ShellEditPanel
          shell={editingShell}
          assets={shellAssets(editingShell)}
          onUpdate={(patch) => updateShell(editingShell.id, patch)}
          onClose={() => setEditingShellId(null)}
        />
      )}
    </div>
  );
}
