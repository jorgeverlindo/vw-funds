import { useState, useMemo } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Search, X } from "lucide-react";
import { COMPONENT_REGISTRY, CATEGORIES, type ComponentEntry } from "./registry";

// ─── Props ──────────────────────────────────────────────────────────────────

interface ComponentLibraryDialogProps {
  open: boolean;
  onClose: () => void;
}

// ─── Category icon map ───────────────────────────────────────────────────────

function CategoryIcon({ category }: { category: string }) {
  switch (category) {
    case "Primitives":
      return (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
        </svg>
      );
    case "Navigation":
      return (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
        </svg>
      );
    case "Charts & Data":
      return (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      );
    case "Comments":
      return (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
      );
    case "Workflow":
      return (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "Forms & Controls":
      return (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
        </svg>
      );
    case "Inventory":
      return (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      );
    case "Portal":
      return (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      );
    default:
      return (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      );
  }
}

// ─── Usage snippet block ─────────────────────────────────────────────────────

function UsageBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="relative group">
      <pre className="bg-[#1f1d25] text-[#e8e6f4] text-[11.5px] leading-[1.7] rounded-xl p-4 overflow-x-auto font-mono whitespace-pre-wrap">
        {code}
      </pre>
      <button
        onClick={copy}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 hover:bg-white/20 rounded-md px-2 py-1 text-[10px] text-white/70 font-medium"
      >
        {copied ? "✓ Copied" : "Copy"}
      </button>
    </div>
  );
}

// ─── Preview wrapper ─────────────────────────────────────────────────────────

function PreviewArea({ component }: { component: ComponentEntry }) {
  return (
    <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#f9f8fd] p-6 min-h-[160px] flex items-center justify-center overflow-hidden">
      <div className="w-full">
        {component.preview}
      </div>
    </div>
  );
}

// ─── Detail panel ────────────────────────────────────────────────────────────

function ComponentDetail({ component }: { component: ComponentEntry }) {
  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h2 className="text-[18px] font-semibold text-[#1f1d25] leading-tight">
            {component.name}
          </h2>
          <span className="text-[11px] bg-[rgba(71,59,171,0.08)] text-[#473bab] font-medium px-2 py-0.5 rounded-md">
            {component.category}
          </span>
        </div>
        <p className="text-[11.5px] text-[#9c99a9] font-mono">{component.path}</p>
      </div>

      {/* Description */}
      <p className="text-[13.5px] text-[#3d3b47] leading-relaxed">
        {component.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {component.tags.map((tag) => (
          <span
            key={tag}
            className="text-[11px] bg-[#f0eff4] text-[#686576] px-2 py-0.5 rounded-md"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Preview */}
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#9c99a9]">Preview</p>
        <PreviewArea component={component} />
      </div>

      {/* Usage */}
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#9c99a9]">Usage</p>
        <UsageBlock code={component.usage} />
      </div>
    </div>
  );
}

// ─── Main dialog ─────────────────────────────────────────────────────────────

export function ComponentLibraryDialog({ open, onClose }: ComponentLibraryDialogProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>(COMPONENT_REGISTRY[0]?.id ?? "");

  // Filtered list
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return COMPONENT_REGISTRY.filter((c) => {
      if (activeCategory && c.category !== activeCategory) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.path.toLowerCase().includes(q) ||
        c.tags.some((t) => t.includes(q))
      );
    });
  }, [search, activeCategory]);

  // Reset selection when filter removes the current entry
  const selected =
    COMPONENT_REGISTRY.find((c) => c.id === selectedId) ??
    filtered[0] ??
    null;

  // Category counts for the sidebar badges
  const categoryCounts = useMemo(() => {
    const q = search.toLowerCase().trim();
    const counts: Record<string, number> = {};
    COMPONENT_REGISTRY.forEach((c) => {
      if (
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.path.toLowerCase().includes(q) ||
        c.tags.some((t) => t.includes(q))
      ) {
        counts[c.category] = (counts[c.category] ?? 0) + 1;
      }
    });
    return counts;
  }, [search]);

  const totalVisible = Object.values(categoryCounts).reduce((a, b) => a + b, 0);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200" />

        {/* Content */}
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-[201] translate-x-[-50%] translate-y-[-50%] w-[90vw] max-w-[1100px] h-[85vh] max-h-[720px] bg-white rounded-2xl shadow-2xl flex overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200"
          aria-describedby={undefined}
        >

          {/* ── Left sidebar ─────────────────────────────────────────────── */}
          <div className="w-[220px] shrink-0 flex flex-col bg-[#f9f8fd] border-r border-[rgba(0,0,0,0.07)]">

            {/* Header */}
            <div className="px-4 pt-5 pb-4 border-b border-[rgba(0,0,0,0.07)]">
              <DialogPrimitive.Title className="text-[14px] font-semibold text-[#1f1d25] mb-1 flex items-center gap-2">
                <svg className="w-4 h-4 text-[#473bab]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
                Component Library
              </DialogPrimitive.Title>
              <p className="text-[11px] text-[#9c99a9]">
                {COMPONENT_REGISTRY.length} components
              </p>
            </div>

            {/* Search */}
            <div className="px-3 py-3 border-b border-[rgba(0,0,0,0.07)]">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9c99a9]" />
                <input
                  type="text"
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 h-8 bg-white border border-[rgba(0,0,0,0.1)] rounded-lg text-[12.5px] text-[#1f1d25] placeholder:text-[#9c99a9] focus:outline-none focus:border-[#473bab] transition-colors"
                />
              </div>
            </div>

            {/* Category list */}
            <div className="flex-1 overflow-y-auto py-2 px-2">
              {/* All */}
              <button
                onClick={() => setActiveCategory(null)}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-[12.5px] transition-colors text-left ${
                  activeCategory === null
                    ? "bg-[rgba(71,59,171,0.1)] text-[#473bab] font-medium"
                    : "text-[#686576] hover:bg-[rgba(0,0,0,0.04)]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  All Components
                </span>
                <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-md ${
                  activeCategory === null ? "bg-[rgba(71,59,171,0.15)] text-[#473bab]" : "bg-[rgba(0,0,0,0.06)] text-[#9c99a9]"
                }`}>
                  {totalVisible}
                </span>
              </button>

              {/* Per-category */}
              {CATEGORIES.map((cat) => {
                const count = categoryCounts[cat] ?? 0;
                if (count === 0) return null;
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-[12.5px] transition-colors text-left ${
                      isActive
                        ? "bg-[rgba(71,59,171,0.1)] text-[#473bab] font-medium"
                        : "text-[#686576] hover:bg-[rgba(0,0,0,0.04)]"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <CategoryIcon category={cat} />
                      {cat}
                    </span>
                    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-md ${
                      isActive ? "bg-[rgba(71,59,171,0.15)] text-[#473bab]" : "bg-[rgba(0,0,0,0.06)] text-[#9c99a9]"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Center: component list ────────────────────────────────────── */}
          <div className="w-[220px] shrink-0 flex flex-col border-r border-[rgba(0,0,0,0.07)] overflow-hidden">
            <div className="px-3 py-3 border-b border-[rgba(0,0,0,0.07)]">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#9c99a9]">
                {activeCategory ?? "All"} · {filtered.length}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto py-1.5 px-2">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-[12px] text-[#9c99a9]">No components found</div>
              ) : (
                filtered.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full flex flex-col gap-0.5 px-2.5 py-2.5 rounded-lg text-left transition-colors ${
                      selected?.id === c.id
                        ? "bg-[rgba(71,59,171,0.08)] text-[#473bab]"
                        : "text-[#1f1d25] hover:bg-[rgba(0,0,0,0.04)]"
                    }`}
                  >
                    <span className="text-[12.5px] font-medium leading-tight">{c.name}</span>
                    <span className={`text-[11px] truncate ${selected?.id === c.id ? "text-[#473bab]/60" : "text-[#9c99a9]"}`}>
                      {c.category}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* ── Right: component detail ───────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto">
            {selected ? (
              <div className="p-7">
                <ComponentDetail component={selected} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-[13px] text-[#9c99a9]">
                Select a component
              </div>
            )}
          </div>

          {/* Close button */}
          <DialogPrimitive.Close
            className="absolute top-4 right-4 p-1.5 rounded-lg text-[#9c99a9] hover:text-[#1f1d25] hover:bg-[rgba(0,0,0,0.06)] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
