import { useState, useMemo } from "react";
import {
  Search, PanelLeft, ChevronRight, ChevronLeft,
  MoreVertical, Folder, Globe, Sparkles, Edit3, Check,
} from "lucide-react";
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
  };
  bgId: string | null;
}

interface AdShell {
  id: string;
  assets: GeneratedAsset[];
  templateId: string;
  templateName: string;
  width: number;
  height: number;
  platform: string;
  bgId: string | null;
  bgNum: number;
  name: string;
}

// ─── Build shells from generatedAssets ───────────────────────────────────────
// Group by template × background → one shell per combination

function buildShells(assets: GeneratedAsset[]): AdShell[] {
  const map = new Map<string, GeneratedAsset[]>();
  assets.forEach(a => {
    const key = `${a.template.id}__${a.bgId ?? "none"}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  });

  // Track bg order per template for the bgNum label
  const bgCounters = new Map<string, Map<string, number>>();

  return Array.from(map.entries()).map(([id, shellAssets]) => {
    const first = shellAssets[0];
    const tmpl = templateLibrary.find(t => t.id === first.template.id) ?? first.template;
    const w = (tmpl as any).width ?? 0;
    const h = (tmpl as any).height ?? 0;

    if (!bgCounters.has(first.template.id)) bgCounters.set(first.template.id, new Map());
    const bgMap = bgCounters.get(first.template.id)!;
    const bgKey = first.bgId ?? "none";
    if (!bgMap.has(bgKey)) bgMap.set(bgKey, bgMap.size + 1);
    const bgNum = bgMap.get(bgKey)!;

    const dims = w && h ? `${w}x${h}` : "Ad";
    const platform = (tmpl as any).platform ?? first.template.platform ?? "Web";

    return {
      id,
      assets: shellAssets,
      templateId: first.template.id,
      templateName: (tmpl as any).name ?? first.template.name ?? first.template.id,
      width: w,
      height: h,
      platform,
      bgId: first.bgId,
      bgNum,
      name: `${(tmpl as any).name ?? first.template.id}_BG_${bgNum}`,
    };
  });
}

// ─── Asset layer — car photo letterboxed to template aspect ──────────────────

function AssetLayer({
  asset,
  width,
  height,
}: {
  asset: GeneratedAsset;
  width: number;
  height: number;
}) {
  const isWide = !height || !width || width >= height;
  const innerW = isWide ? "100%" : `${(width / height) * 100}%`;
  const innerH = !isWide ? "100%" : `${(height / width) * 100}%`;

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div style={{ width: innerW, height: innerH, position: "relative", flexShrink: 0 }}>
        {asset.offer.image ? (
          <img
            src={asset.offer.image}
            alt={asset.offer.model}
            className="absolute inset-0 w-full h-full object-contain"
          />
        ) : (
          <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-[10px] text-gray-400 font-medium">
            AD
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Ad Shell card ────────────────────────────────────────────────────────────

function AdShellCard({
  shell,
  selected,
  onSelect,
}: {
  shell: AdShell;
  selected: boolean;
  onSelect: (checked: boolean) => void;
}) {
  const [hover, setHover] = useState(false);
  const { assets, width, height, name, platform, templateName } = shell;
  const hiddenCount = Math.max(0, assets.length - 4);

  return (
    <div
      className="flex flex-col cursor-default"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* ── Thumbnail ─────────────────────────────────── */}
      <div
        className="relative rounded-lg overflow-hidden transition-all"
        style={{
          aspectRatio: "1 / 1",
          background: "#f0f2f4",
          border: `${hover || selected ? 2 : 1}px solid ${hover || selected ? "#473bab" : "#e7e7e9"}`,
        }}
      >
        {/* Default: stacked rotated layers */}
        {!hover && (
          <>
            {assets[2] && (
              <div className="absolute inset-6 opacity-40" style={{ transform: "rotate(-5deg)" }}>
                <AssetLayer asset={assets[2]} width={width} height={height} />
              </div>
            )}
            {assets[1] && (
              <div className="absolute inset-6 opacity-40" style={{ transform: "rotate(5deg)" }}>
                <AssetLayer asset={assets[1]} width={width} height={height} />
              </div>
            )}
            {assets[0] && (
              <div className="absolute inset-6">
                <AssetLayer asset={assets[0]} width={width} height={height} />
              </div>
            )}
          </>
        )}

        {/* Hover: 2×2 grid */}
        {hover && (() => {
          const hPct = width && height ? (height / width) * 100 : 56;
          return (
            <div className="absolute inset-0 p-4">
              <div className="w-full h-full flex flex-col gap-1">
                {/* Row 1 */}
                <div className="flex-1 flex gap-1 min-h-0">
                  {[0, 1].map(i => (
                    <div key={i} className="flex-1 flex items-center justify-center overflow-hidden rounded min-w-0">
                      {assets[i] && (
                        <div style={{ width: "100%", height: `${hPct}%`, position: "relative", flexShrink: 0 }}>
                          <AssetLayer asset={assets[i]} width={width} height={height} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {/* Row 2 */}
                <div className="flex-1 flex gap-1 min-h-0">
                  <div className="flex-1 flex items-center justify-center overflow-hidden rounded min-w-0">
                    {assets[2] && (
                      <div style={{ width: "100%", height: `${hPct}%`, position: "relative", flexShrink: 0 }}>
                        <AssetLayer asset={assets[2]} width={width} height={height} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex items-center justify-center overflow-hidden rounded min-w-0 relative">
                    {assets[3] && (
                      <div style={{ width: "100%", height: `${hPct}%`, position: "relative", flexShrink: 0 }}>
                        <AssetLayer asset={assets[3]} width={width} height={height} />
                      </div>
                    )}
                    {hiddenCount > 0 && (
                      <>
                        <div className="absolute inset-0 bg-black/45 z-10 rounded" />
                        <span className="absolute inset-0 flex items-center justify-center z-20 text-white text-2xl font-light">
                          +{hiddenCount}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Auto Generated badge — top right */}
        <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EBF5FB]">
            <Sparkles size={11} className="text-[#0277BD]" />
            <span className="text-[10px] font-medium text-[#0277BD] whitespace-nowrap tracking-wide">
              Auto Generated
            </span>
          </div>
          {shell.assets.length > 1 && (
            <div className="bg-black/60 text-white rounded-full px-2 py-0.5 text-[10px] font-mono whitespace-nowrap">
              {shell.assets.length} offers
            </div>
          )}
        </div>

        {/* Platform circle — bottom left */}
        <div className="absolute bottom-2 left-2 z-10">
          <div className="w-7 h-7 rounded-full bg-white shadow flex items-center justify-center">
            <Globe size={14} className="text-gray-600" />
          </div>
        </div>

        {/* Edit button — bottom right on hover */}
        <div
          className="absolute bottom-2 right-2 z-10 transition-opacity"
          style={{ opacity: hover ? 1 : 0, pointerEvents: hover ? "auto" : "none" }}
        >
          <button className="flex items-center gap-1.5 bg-[#473bab] text-white rounded-full px-3 py-1 text-[12px] font-medium shadow-md hover:bg-[#3b30a0] transition whitespace-nowrap">
            <Edit3 size={12} />
            Edit Ad Shell
          </button>
        </div>

        {/* Checkbox — top left, visible on hover or selected */}
        <div
          className="absolute top-2 left-2 z-10 transition-opacity"
          style={{ opacity: hover || selected ? 1 : 0 }}
        >
          <button
            onClick={e => { e.stopPropagation(); onSelect(!selected); }}
            className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${
              selected
                ? "bg-[#473bab] border-[#473bab]"
                : "bg-white border-gray-400 hover:border-[#473bab]"
            }`}
          >
            {selected && <Check size={11} className="text-white" strokeWidth={3} />}
          </button>
        </div>
      </div>

      {/* ── Info below thumbnail ─────────────────────── */}
      <div className="pt-2 pb-1">
        <div className="flex items-start gap-1">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-gray-900 leading-snug truncate">{name}</p>
            <p className="text-[11px] text-[#686576] mt-0.5 tracking-wide">
              Ad Shell&nbsp;|&nbsp;{platform}&nbsp;|&nbsp;
              {width && height ? `${width}×${height}` : templateName}
            </p>
          </div>
          <button className="shrink-0 mt-0.5 p-1 rounded hover:bg-gray-100 text-gray-500 transition">
            <MoreVertical size={15} />
          </button>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <Folder size={12} className="text-[#686576] shrink-0" />
          <span className="text-[11px] text-[#686576] truncate">{templateName}</span>
        </div>
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const shells = useMemo(() => buildShells(generatedAssets), [generatedAssets]);

  const filtered = useMemo(() =>
    shells.filter(s => s.name.toLowerCase().includes(query.toLowerCase()) || s.platform.toLowerCase().includes(query.toLowerCase())),
    [shells, query]
  );

  function toggleSelect(id: string, checked: boolean) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

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
        {shells.length > 0 && (
          <span className="text-xs text-gray-400 ml-1">{filtered.length} Items</span>
        )}
        <div className="ml-auto flex items-center gap-3">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Find below"
              className="pl-7 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-full text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[var(--brand-accent)]"
            />
          </div>
          <button className="text-gray-500 hover:text-gray-700 transition">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 bg-[#f0f2f4]">
        {filtered.length === 0 ? (
          <div
            className="bg-white rounded-lg mx-auto flex flex-col items-center justify-center py-16 gap-4 text-center"
            style={{ maxWidth: 480 }}
          >
            <div className="text-gray-300">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-medium text-gray-800">
                {query ? "No Ad Shells match your search." : "No Ad Shells Added yet."}
              </p>
              {!query && (
                <p className="text-[13px] text-gray-500 mt-1">
                  Ad Shells are created automatically once Assets are generated.
                </p>
              )}
            </div>
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
            {filtered.map(shell => (
              <AdShellCard
                key={shell.id}
                shell={shell}
                selected={selectedIds.has(shell.id)}
                onSelect={checked => toggleSelect(shell.id, checked)}
              />
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
