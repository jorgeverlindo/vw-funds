"use client";

import { useState, useCallback } from "react";
import { X, Save, Check, AlertCircle, RotateCcw } from "lucide-react";
import { AdTemplate } from "@projects/templates/AdTemplate";
import { TemplateWireframe } from "@projects/templates/TemplateWireframe";
import { zoneConfigs, isSingleProductTextLayout, isKeyMessageTextLayout, isPharmaZoneConfig } from "@projects/lib/template-zone-configs";
import type { TemplateZoneConfig, ProductSlot, LogoPosition, TextElement, SingleProductTextLayout, MultiProductTextLayout, KeyMessageTextLayout } from "@projects/lib/template-zone-configs";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Offer {
  year: string;
  make: string;
  model: string;
  trim: string;
  image: string;
  monthlyPayment: number;
  term: number;
  totalDueAtSigning: number;
}

interface Background {
  color: string;
  images?: Record<string, string>;
}

interface TemplateZoneEditorProps {
  templateId: string;
  templateName: string;
  previewOffer?: Offer;
  previewBackground?: Background;
  onClose: () => void;
}

type SaveState = "idle" | "saving" | "saved" | "error";

// ─── Number input field ───────────────────────────────────────────────────────

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-[var(--brand-accent)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--brand-accent)]/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    </label>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-2 mt-4 first:mt-0">
      {children}
    </p>
  );
}

// ─── Product slot editor ──────────────────────────────────────────────────────

function SlotEditor({
  index,
  slot,
  onChange,
}: {
  index: number;
  slot: ProductSlot;
  onChange: (s: ProductSlot) => void;
}) {
  function set(key: keyof ProductSlot, v: number) {
    onChange({ ...slot, [key]: v });
  }
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-2">
      <p className="text-[11px] font-semibold text-[var(--brand-accent)]">Product Slot {index + 1}</p>
      <div className="grid grid-cols-2 gap-2">
        <NumField label="Left (l)" value={slot.l} onChange={(v) => set("l", v)} />
        <NumField label="Top" value={slot.top} onChange={(v) => set("top", v)} />
        <NumField label="Width (w)" value={slot.w} onChange={(v) => set("w", v)} />
        <NumField label="Height (h)" value={slot.h} onChange={(v) => set("h", v)} />
      </div>
    </div>
  );
}

// ─── Logo editor ─────────────────────────────────────────────────────────────

function LogoEditor({
  label,
  logo,
  onChange,
}: {
  label: string;
  logo: LogoPosition;
  onChange: (l: LogoPosition) => void;
}) {
  function set(key: keyof LogoPosition, v: number) {
    onChange({ ...logo, [key]: v });
  }
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-2">
      <p className="text-[11px] font-semibold text-purple-600">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        <NumField label="Left (l)" value={logo.l} onChange={(v) => set("l", v)} />
        <NumField label="Top" value={logo.top} onChange={(v) => set("top", v)} />
        <NumField label="Size" value={logo.size} onChange={(v) => set("size", v)} />
      </div>
    </div>
  );
}

// ─── Text element editor ──────────────────────────────────────────────────────

function TextElementEditor({
  fieldKey,
  label,
  el,
  onChange,
  showWH,
  active,
  onToggle,
}: {
  fieldKey: string;
  label: string;
  el: TextElement;
  onChange: (e: TextElement) => void;
  showWH?: boolean;
  active?: boolean;
  onToggle: (key: string, open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);

  function toggle() {
    const next = !open;
    setOpen(next);
    onToggle(fieldKey, next);
  }

  function set(key: keyof TextElement, v: number) {
    onChange({ ...el, [key]: v });
  }

  return (
    <div className={`rounded-lg border transition-colors ${active ? "border-orange-300 bg-orange-50" : "border-gray-100 bg-gray-50"}`}>
      <button
        onClick={toggle}
        className={`w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold transition-colors ${active ? "text-orange-700" : "text-teal-700"}`}
      >
        <span className="flex items-center gap-1.5">
          {/* orange dot when active */}
          {active && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />}
          {label}
        </span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <NumField label="Left (l)" value={el.l} onChange={(v) => set("l", v)} />
            <NumField label="Top" value={el.top} onChange={(v) => set("top", v)} />
            <NumField label="Font size" value={el.fontSize} onChange={(v) => set("fontSize", v)} />
          </div>
          {showWH && (
            <div className="grid grid-cols-2 gap-2">
              <NumField label="Width (w)" value={el.w ?? 0} onChange={(v) => set("w", v)} />
              <NumField label="Height (h)" value={el.h ?? 0} onChange={(v) => set("h", v)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Single-product text layout editor ───────────────────────────────────────

function SingleTextLayoutEditor({
  tl,
  onChange,
  activeField,
  onFieldToggle,
}: {
  tl: SingleProductTextLayout;
  onChange: (tl: SingleProductTextLayout) => void;
  activeField: string | null;
  onFieldToggle: (key: string, open: boolean) => void;
}) {
  function setEl(field: keyof SingleProductTextLayout, el: TextElement) {
    onChange({ ...tl, [field]: el });
  }
  return (
    <div className="space-y-2">
      {tl.dealerName && (
        <TextElementEditor fieldKey="dealerName" label="Dealer Name" el={tl.dealerName}
          onChange={(el) => setEl("dealerName", el)}
          active={activeField === "dealerName"} onToggle={onFieldToggle} />
      )}
      <TextElementEditor fieldKey="title" label="Title" el={tl.title}
        onChange={(el) => setEl("title", el)}
        active={activeField === "title"} onToggle={onFieldToggle} />
      <TextElementEditor fieldKey="leaseLabel" label="Lease Label" el={tl.leaseLabel}
        onChange={(el) => setEl("leaseLabel", el)}
        active={activeField === "leaseLabel"} onToggle={onFieldToggle} />
      <TextElementEditor fieldKey="price" label="Price" el={tl.price}
        onChange={(el) => setEl("price", el)}
        active={activeField === "price"} onToggle={onFieldToggle} />
      <TextElementEditor fieldKey="termLabel" label="Term Label" el={tl.termLabel}
        onChange={(el) => setEl("termLabel", el)}
        active={activeField === "termLabel"} onToggle={onFieldToggle} />
      <TextElementEditor fieldKey="dueLabel" label="Due Label" el={tl.dueLabel}
        onChange={(el) => setEl("dueLabel", el)}
        active={activeField === "dueLabel"} onToggle={onFieldToggle} />
      <TextElementEditor fieldKey="cta" label="CTA Button" el={tl.cta}
        onChange={(el) => setEl("cta", el)} showWH
        active={activeField === "cta"} onToggle={onFieldToggle} />
      <TextElementEditor fieldKey="disclaimer" label="Disclaimer" el={tl.disclaimer}
        onChange={(el) => setEl("disclaimer", el)} showWH
        active={activeField === "disclaimer"} onToggle={onFieldToggle} />
    </div>
  );
}

// ─── Multi-product text layout editor ────────────────────────────────────────

function MultiNumEditor({
  fieldKey,
  label,
  children,
  active,
  onToggle,
}: {
  fieldKey: string;
  label: string;
  children: React.ReactNode;
  active?: boolean;
  onToggle: (key: string, open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  function toggle() {
    const next = !open;
    setOpen(next);
    onToggle(fieldKey, next);
  }
  return (
    <div className={`rounded-lg border transition-colors ${active ? "border-orange-300 bg-orange-50" : "border-gray-100 bg-gray-50"}`}>
      <button
        onClick={toggle}
        className={`w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold transition-colors ${active ? "text-orange-700" : "text-teal-700"}`}
      >
        <span className="flex items-center gap-1.5">
          {active && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />}
          {label}
        </span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="px-3 pb-3 space-y-2">{children}</div>}
    </div>
  );
}

function MultiTextLayoutEditor({
  tl,
  onChange,
  activeField,
  onFieldToggle,
}: {
  tl: MultiProductTextLayout;
  onChange: (tl: MultiProductTextLayout) => void;
  activeField: string | null;
  onFieldToggle: (key: string, open: boolean) => void;
}) {
  function set(key: keyof MultiProductTextLayout, v: number) {
    onChange({ ...tl, [key]: v });
  }
  function setDisclaimer(el: TextElement) {
    onChange({ ...tl, disclaimer: el });
  }
  return (
    <div className="space-y-2">
      <MultiNumEditor fieldKey="title" label="Title" active={activeField === "title"} onToggle={onFieldToggle}>
        <div className="grid grid-cols-3 gap-2">
          <NumField label="Left" value={tl.titleLeft} onChange={(v) => set("titleLeft", v)} />
          <NumField label="Top" value={tl.titleTop} onChange={(v) => set("titleTop", v)} />
          <NumField label="Font size" value={tl.titleFontSize} onChange={(v) => set("titleFontSize", v)} />
        </div>
      </MultiNumEditor>

      <MultiNumEditor fieldKey="trim" label="Trim" active={activeField === "trim"} onToggle={onFieldToggle}>
        <div className="grid grid-cols-3 gap-2">
          <NumField label="Left" value={tl.trimLeft} onChange={(v) => set("trimLeft", v)} />
          <NumField label="Top" value={tl.trimTop} onChange={(v) => set("trimTop", v)} />
          <NumField label="Font size" value={tl.trimFontSize} onChange={(v) => set("trimFontSize", v)} />
        </div>
      </MultiNumEditor>

      <MultiNumEditor fieldKey="price" label="Price" active={activeField === "price"} onToggle={onFieldToggle}>
        <div className="grid grid-cols-3 gap-2">
          <NumField label="Left" value={tl.priceLeft} onChange={(v) => set("priceLeft", v)} />
          <NumField label="Top" value={tl.priceTop} onChange={(v) => set("priceTop", v)} />
          <NumField label="Font size" value={tl.priceFontSize} onChange={(v) => set("priceFontSize", v)} />
        </div>
      </MultiNumEditor>

      <MultiNumEditor fieldKey="cta" label="CTA Button" active={activeField === "cta"} onToggle={onFieldToggle}>
        <div className="grid grid-cols-3 gap-2">
          <NumField label="Left" value={tl.ctaLeft} onChange={(v) => set("ctaLeft", v)} />
          <NumField label="Top" value={tl.ctaTop} onChange={(v) => set("ctaTop", v)} />
          <NumField label="Height" value={tl.ctaH} onChange={(v) => set("ctaH", v)} />
          <NumField label="Font size" value={tl.ctaFontSize} onChange={(v) => set("ctaFontSize", v)} />
          <NumField label="Padding" value={tl.ctaPadding} onChange={(v) => set("ctaPadding", v)} />
        </div>
      </MultiNumEditor>

      <MultiNumEditor fieldKey="disclaimer" label="Disclaimer" active={activeField === "disclaimer"} onToggle={onFieldToggle}>
        <div className="grid grid-cols-3 gap-2">
          <NumField label="Left (l)" value={tl.disclaimer.l} onChange={(v) => setDisclaimer({ ...tl.disclaimer, l: v })} />
          <NumField label="Top" value={tl.disclaimer.top} onChange={(v) => setDisclaimer({ ...tl.disclaimer, top: v })} />
          <NumField label="Font size" value={tl.disclaimer.fontSize} onChange={(v) => setDisclaimer({ ...tl.disclaimer, fontSize: v })} />
        </div>
      </MultiNumEditor>
    </div>
  );
}

// ─── Key-message text layout editor ──────────────────────────────────────────

function KeyMessageTextLayoutEditor({
  tl,
  onChange,
  activeField,
  onFieldToggle,
}: {
  tl: KeyMessageTextLayout;
  onChange: (tl: KeyMessageTextLayout) => void;
  activeField: string | null;
  onFieldToggle: (key: string, open: boolean) => void;
}) {
  function setEl(field: keyof KeyMessageTextLayout, el: TextElement) {
    onChange({ ...tl, [field]: el });
  }
  return (
    <div className="space-y-2">
      <TextElementEditor fieldKey="keyMessage" label="Key Message  ✏️ manual" el={tl.keyMessage}
        onChange={(el) => setEl("keyMessage", el)} showWH
        active={activeField === "keyMessage"} onToggle={onFieldToggle} />
      <TextElementEditor fieldKey="year" label="Year  ✏️ manual" el={tl.year}
        onChange={(el) => setEl("year", el)}
        active={activeField === "year"} onToggle={onFieldToggle} />
      <TextElementEditor fieldKey="modelLine" label="Model Line  (auto)" el={tl.modelLine}
        onChange={(el) => setEl("modelLine", el)}
        active={activeField === "modelLine"} onToggle={onFieldToggle} />
      <TextElementEditor fieldKey="cta" label="CTA Button" el={tl.cta}
        onChange={(el) => setEl("cta", el)} showWH
        active={activeField === "cta"} onToggle={onFieldToggle} />
      <TextElementEditor fieldKey="disclaimer" label="Disclaimer" el={tl.disclaimer}
        onChange={(el) => setEl("disclaimer", el)} showWH
        active={activeField === "disclaimer"} onToggle={onFieldToggle} />
    </div>
  );
}

// ─── Main editor ──────────────────────────────────────────────────────────────

export function TemplateZoneEditor({
  templateId,
  templateName,
  previewOffer,
  previewBackground,
  onClose,
}: TemplateZoneEditorProps) {
  const original = zoneConfigs[templateId];
  // Pharma templates use a different renderer — zone editor not supported
  if (original && isPharmaZoneConfig(original)) return null;
  const [local, setLocal] = useState<TemplateZoneConfig>(
    original ? structuredClone(original as TemplateZoneConfig) : {
      canvasW: 0, canvasH: 0,
      bgZone: { l: 0, top: 0, w: 0, h: 0 },
      productSlots: [],
      logoP: { l: 0, top: 0, size: 0 },
      logoE: { l: 0, top: 0, size: 0 },
      textLayout: {
        title: { l: 0, top: 0, fontSize: 16 },
        leaseLabel: { l: 0, top: 0, fontSize: 12 },
        price: { l: 0, top: 0, fontSize: 32 },
        termLabel: { l: 0, top: 0, fontSize: 12 },
        dueLabel: { l: 0, top: 0, fontSize: 12 },
        cta: { l: 0, top: 0, fontSize: 14, w: 99, h: 40 },
        disclaimer: { l: 0, top: 0, fontSize: 10 },
      },
    }
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [activeTextField, setActiveTextField] = useState<string | null>(null);

  // ── Updaters ──────────────────────────────────────────────────────────────

  const setSlot = useCallback((index: number, slot: ProductSlot) => {
    setLocal((prev) => {
      const slots = [...prev.productSlots];
      slots[index] = slot;
      return { ...prev, productSlots: slots };
    });
  }, []);

  const setLogoP = useCallback((logo: LogoPosition) => {
    setLocal((prev) => ({ ...prev, logoP: logo }));
  }, []);

  const setLogoE = useCallback((logo: LogoPosition) => {
    setLocal((prev) => ({ ...prev, logoE: logo }));
  }, []);

  const handleFieldToggle = useCallback((key: string, open: boolean) => {
    setActiveTextField(open ? key : null);
  }, []);

  function handleReset() {
    if (original) setLocal(structuredClone(original as TemplateZoneConfig));
    setActiveTextField(null);
  }

  // ── Save to JSON via API ──────────────────────────────────────────────────

  async function handleSave() {
    setSaveState("saving");
    try {
      const res = await fetch("/api/template-zone-configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, config: local }),
      });
      if (!res.ok) throw new Error("Server error");
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  }

  // ── Preview scale ─────────────────────────────────────────────────────────

  const MAX_PREVIEW_W = 580;
  const MAX_PREVIEW_H = 440;
  const previewScale = Math.min(
    MAX_PREVIEW_W / local.canvasW,
    MAX_PREVIEW_H / local.canvasH,
    1
  );

  const dummyBg: Background = { color: "#e2e8f0" };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative ml-auto flex h-full w-full max-w-5xl bg-white shadow-2xl">

        {/* ── Left: controls ── */}
        <div className="flex w-72 shrink-0 flex-col border-r border-gray-100">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Zone Editor</p>
              <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[190px]">{templateName}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
              <X size={16} />
            </button>
          </div>

          {/* Fields */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            <SectionHeading>Product Slots</SectionHeading>
            {local.productSlots.map((slot, i) => (
              <SlotEditor key={i} index={i} slot={slot} onChange={(s) => setSlot(i, s)} />
            ))}

            <SectionHeading>Logos</SectionHeading>
            <LogoEditor label="Primary Logo" logo={local.logoP} onChange={setLogoP} />
            <LogoEditor label="Event Logo" logo={local.logoE} onChange={setLogoE} />

            <SectionHeading>Text Layout</SectionHeading>
            {isSingleProductTextLayout(local.textLayout) ? (
              <SingleTextLayoutEditor
                tl={local.textLayout}
                onChange={(tl) => setLocal((prev) => ({ ...prev, textLayout: tl }))}
                activeField={activeTextField}
                onFieldToggle={handleFieldToggle}
              />
            ) : isKeyMessageTextLayout(local.textLayout) ? (
              <KeyMessageTextLayoutEditor
                tl={local.textLayout}
                onChange={(tl) => setLocal((prev) => ({ ...prev, textLayout: tl }))}
                activeField={activeTextField}
                onFieldToggle={handleFieldToggle}
              />
            ) : (
              <MultiTextLayoutEditor
                tl={local.textLayout as MultiProductTextLayout}
                onChange={(tl) => setLocal((prev) => ({ ...prev, textLayout: tl }))}
                activeField={activeTextField}
                onFieldToggle={handleFieldToggle}
              />
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-4 py-3 flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition"
            >
              <RotateCcw size={12} />
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saveState === "saving"}
              className="ml-auto flex items-center gap-1.5 rounded-lg bg-[var(--brand-accent)] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[var(--brand-accent-hover)] disabled:opacity-60 transition"
            >
              {saveState === "saving" ? (
                <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
              ) : saveState === "saved" ? (
                <Check size={12} />
              ) : saveState === "error" ? (
                <AlertCircle size={12} />
              ) : (
                <Save size={12} />
              )}
              {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved!" : saveState === "error" ? "Error" : "Save"}
            </button>
          </div>
        </div>

        {/* ── Right: live preview ── */}
        <div className="flex flex-1 flex-col">
          {/* Preview header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
            <p className="text-xs font-medium text-gray-500">
              Live Preview · {local.canvasW}×{local.canvasH}
            </p>
            <p className="text-[11px] text-gray-400">
              {activeTextField
                ? <span className="text-orange-600 font-medium">Editing: {activeTextField}</span>
                : "Expand a text field to highlight it in the preview"
              }
            </p>
          </div>

          {/* Preview area */}
          <div className="flex flex-1 items-center justify-center overflow-auto bg-gray-50 p-8">
            <TemplateWireframe
              templateId={templateId}
              scale={previewScale}
              zoneConfig={local}
              showText
              activeField={activeTextField ?? undefined}
            />
          </div>

          {/* Hint */}
          <div className="border-t border-gray-100 px-5 py-2">
            <p className="text-[11px] text-gray-400">
              Orange zones = text variables · Blue = CTA button · Expand a field on the left to highlight it here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
