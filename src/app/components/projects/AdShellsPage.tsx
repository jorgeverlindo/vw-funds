import { useState, useMemo } from "react";
import { Search, PanelLeft, ChevronRight, ChevronLeft, MoreVertical, Trash2, Download } from "lucide-react";
import { useSidebar } from "@projects/lib/sidebar-context";
import { templateLibrary } from "@projects/lib/mock-data";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeneratedAsset {
  key: string;
  offer: {
    id: string;
    make: string;
    model: string;
    trim?: string;
    year?: number;
    image?: string;
    monthlyPayment?: number;
  };
  template: {
    id: string;
    name: string;
    width?: number;
    height?: number;
    platform?: string;
    thumbnail?: string;
  };
  bgId: string | null;
}

// ─── Asset card ───────────────────────────────────────────────────────────────

function AdShellCard({ asset }: { asset: GeneratedAsset }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const template = templateLibrary.find(t => t.id === asset.template.id) ?? asset.template;
  const dims = (template as any).width && (template as any).height
    ? `${(template as any).width}×${(template as any).height}`
    : null;

  return (
    <div className="group rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-sm transition-shadow">
      {/* Thumbnail */}
      <div className="relative bg-gray-100 h-36 flex items-center justify-center overflow-hidden">
        {asset.offer.image ? (
          <img
            src={asset.offer.image}
            alt={asset.offer.model}
            className="w-full h-full object-contain p-3"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-medium">
            AD
          </div>
        )}
        {(template as any).platform && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] font-medium text-gray-600 border border-gray-200">
            {(template as any).platform}
          </div>
        )}
        {dims && (
          <div className="absolute bottom-2 right-2 bg-black/60 text-white rounded px-1.5 py-0.5 text-[10px] font-mono">
            {dims}
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="w-6 h-6 rounded flex items-center justify-center bg-white/90 hover:bg-white text-gray-600 transition">
            <Download size={11} />
          </button>
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
              className="w-6 h-6 rounded flex items-center justify-center bg-white/90 hover:bg-white text-gray-600 transition"
            >
              <MoreVertical size={11} />
            </button>
            {menuOpen && (
              <div className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-30 min-w-[130px]">
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition"
                  onClick={() => setMenuOpen(false)}
                >
                  <Trash2 size={11} /> Remove
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="px-3 py-2.5">
        <p className="text-[12px] font-semibold text-gray-900 leading-tight truncate">
          {(template as any).name ?? asset.template.id}
        </p>
        <p className="text-[11px] text-gray-500 mt-0.5 truncate">
          {asset.offer.year ? `${asset.offer.year} ` : ""}{asset.offer.make} {asset.offer.model}
          {asset.offer.trim ? ` ${asset.offer.trim}` : ""}
        </p>
        {asset.offer.monthlyPayment && (
          <p className="text-[11px] text-[var(--brand-accent)] font-medium mt-1">
            ${asset.offer.monthlyPayment}/mo
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AdShellsPage({
  projectId,
  projectName,
  generatedAssets,
  onNavigateTo,
}: {
  projectId: string;
  projectName: string;
  generatedAssets: GeneratedAsset[];
  onNavigateTo: (page: string) => void;
}) {
  const { toggleSidebar, sidebarOpen } = useSidebar();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() =>
    generatedAssets.filter(a => {
      const q = query.toLowerCase();
      return (
        a.offer.model.toLowerCase().includes(q) ||
        a.offer.make.toLowerCase().includes(q) ||
        (a.template.name ?? a.template.id).toLowerCase().includes(q)
      );
    }),
    [generatedAssets, query]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white">
        <button
          onClick={toggleSidebar}
          title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
            sidebarOpen
              ? "text-[var(--brand-accent)] bg-[var(--brand-accent)/8]"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          }`}
        >
          <PanelLeft size={15} />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Ad Shells</h1>
        <span className="text-xs text-gray-400 ml-1">
          {generatedAssets.length} creative{generatedAssets.length !== 1 ? "s" : ""}
        </span>
        <div className="ml-auto flex items-center gap-3">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Find creatives…"
              className="pl-7 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-full text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[var(--brand-accent)]"
            />
          </div>
          <button className="text-gray-400 hover:text-gray-600 transition">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {filtered.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center py-12 gap-3">
            <div className="text-gray-300">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">
              {query
                ? "No creatives match your search."
                : "No ad shells yet. Generate assets in the Preview section first."}
            </p>
            {!query && (
              <button
                onClick={() => onNavigateTo("preview")}
                className="text-sm font-medium text-[var(--brand-accent)] hover:text-[var(--brand-accent-hover)]"
              >
                Go to Preview →
              </button>
            )}
          </div>
        ) : (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}
          >
            {filtered.map(asset => (
              <AdShellCard key={asset.key} asset={asset} />
            ))}
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-100">
        <button
          onClick={() => onNavigateTo("logos-backgrounds")}
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--brand-accent)] border border-[var(--brand-accent)/30] rounded-full px-4 py-1.5 hover:bg-[var(--brand-accent)/5] transition"
        >
          <ChevronLeft size={14} />
          Styles & Backgrounds
        </button>
        <button
          onClick={() => onNavigateTo("campaigns")}
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--brand-accent)] border border-[var(--brand-accent)/30] rounded-full px-4 py-1.5 hover:bg-[var(--brand-accent)/5] transition"
        >
          Campaigns
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
