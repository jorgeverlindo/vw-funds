"use client";

import React, { CSSProperties } from "react";
import { zoneConfigs, visibleSlotBounds, isSingleProductTextLayout, isKeyMessageTextLayout, isPharmaZoneConfig } from "@projects/lib/template-zone-configs";
import type { TemplateZoneConfig, PharmaZoneConfig, SingleProductTextLayout, MultiProductTextLayout, KeyMessageTextLayout, PharmaTextLayout, TextElement } from "@projects/lib/template-zone-configs";

// ─── Design tokens (mirrors AdTemplate) ──────────────────────────────────────

const TEXT_COLOR    = "#1e293b";   // dark slate — stands in for var(--brand-text)
const BTN_COLOR     = "#6366f1";   // indigo — stands in for var(--brand)
const BTN_TXT_COLOR = "#ffffff";

// ─── Zone colors (for structural zones only) ──────────────────────────────────

const ZONE_COLORS = {
  "logo-primary": { border: "#7c3aed", chip: "#7c3aed", label: "Logo\nPrimary" },
  "event-logo":   { border: "#1d4ed8", chip: "#2563eb", label: "Event\nLogo"   },
  "background":   { border: "#1d4ed8", chip: "#16a34a", label: "Background\nImage" },
  "product":      { border: "#2563eb", chip: "#3b82f6", label: "Product"       },
} as const;

type StructuralZoneType = keyof typeof ZONE_COLORS;

// ─── Structural zone box (background / product / logo) ────────────────────────

function StructuralZone({ t, l, top, w, h, fs }: { t: StructuralZoneType; l: number; top: number; w: number; h: number; fs: number }) {
  const { border, chip, label } = ZONE_COLORS[t];
  return (
    <div style={{ position: "absolute", left: l, top, width: w, height: h, border: `3px dashed ${border}`, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ background: chip, color: "#fff", fontSize: fs, fontWeight: 700, padding: "4px 10px", borderRadius: 8, textAlign: "center", whiteSpace: "pre", lineHeight: 1.3 }}>{label}</span>
    </div>
  );
}

// ─── Text variable rendering ──────────────────────────────────────────────────

/**
 * Renders a text element exactly as it appears in the real ad — same position,
 * font-size and weight — but with the variable name in {curly braces}.
 * When `active` (field expanded in editor), a dashed orange outline highlights it.
 */
function TextVar({
  el,
  text,
  weight = 400,
  active,
  extraStyle,
}: {
  el: TextElement;
  text: string;
  weight?: number;
  active?: boolean;
  extraStyle?: CSSProperties;
}) {
  const style: CSSProperties = {
    position: "absolute",
    left: el.l,
    top: el.top,
    fontSize: el.fontSize,
    fontWeight: weight,
    color: TEXT_COLOR,
    margin: 0,
    lineHeight: "143%",
    letterSpacing: "0.17px",
    whiteSpace: "nowrap",
    // Editor highlight
    outline: active ? "2px dashed #ea580c" : undefined,
    outlineOffset: active ? 4 : undefined,
    borderRadius: active ? 3 : undefined,
    ...extraStyle,
  };
  return <p style={style}>{text}</p>;
}

/** CTA button — same shape as the real ad, with `{cta}` as label. */
function CTAVar({
  el,
  active,
}: {
  el: TextElement;
  active?: boolean;
}) {
  return (
    <div style={{
      position: "absolute",
      left: el.l,
      top: el.top,
      width: el.w ?? 100,
      height: el.h ?? Math.round(el.fontSize * 2),
      background: BTN_COLOR,
      color: BTN_TXT_COLOR,
      borderRadius: 100,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 500,
      fontSize: el.fontSize,
      textTransform: "uppercase",
      letterSpacing: "0.46px",
      whiteSpace: "nowrap",
      outline: active ? "2px dashed #ea580c" : undefined,
      outlineOffset: active ? 4 : undefined,
    }}>
      {"{cta}"}
    </div>
  );
}

// ─── Single-product text overlay ──────────────────────────────────────────────

function SingleProductTextOverlay({
  tl,
  canvasW,
  activeField,
}: {
  tl: SingleProductTextLayout;
  canvasW: number;
  activeField?: string;
}) {
  return (
    <>
      {tl.dealerName && (
        <TextVar el={tl.dealerName} text="{dealerName}" weight={400}
          active={activeField === "dealerName"}
          extraStyle={{ width: "100%", textAlign: "center" }} />
      )}
      {tl.title && (
        <TextVar el={tl.title} text="{year} {make} {model} {trim}" weight={400}
          active={activeField === "title"} />
      )}
      <TextVar el={tl.leaseLabel} text="Lease for" weight={400}
        active={activeField === "leaseLabel"} extraStyle={{ letterSpacing: "0.25px", lineHeight: "normal" }} />
      <TextVar el={tl.price} text="{monthlyPayment}/mo." weight={700}
        active={activeField === "price"} />
      {tl.finePrint && (
        <TextVar el={tl.finePrint} text="{term} months  |  {totalDue} due at signing" weight={400}
          active={activeField === "finePrint"} extraStyle={{ letterSpacing: "0.25px", lineHeight: "normal", whiteSpace: "normal", width: tl.finePrint.w }} />
      )}
      {tl.termLabel && (
        <TextVar el={tl.termLabel} text="for {term} months." weight={400}
          active={activeField === "termLabel"} extraStyle={{ letterSpacing: "0.25px", lineHeight: "normal" }} />
      )}
      {tl.dueLabel && (
        <TextVar el={tl.dueLabel} text="{totalDue} due at signing" weight={400}
          active={activeField === "dueLabel"} extraStyle={{ letterSpacing: "0.25px", lineHeight: "normal" }} />
      )}
      <CTAVar el={tl.cta} active={activeField === "cta"} />
      {tl.disclaimer && (
        <TextVar el={tl.disclaimer} text="Photos for illustration purposes only." weight={400}
          active={activeField === "disclaimer"}
          extraStyle={{ width: tl.disclaimer.w, fontSize: tl.disclaimer.fontSize, textAlign: tl.disclaimer.textAlign ?? "left", whiteSpace: "normal" }} />
      )}
    </>
  );
}

// ─── Multi-product text overlay ───────────────────────────────────────────────

function MultiProductTextOverlay({
  tl,
  productSlots,
  activeField,
}: {
  tl: MultiProductTextLayout;
  productSlots: TemplateZoneConfig["productSlots"];
  activeField?: string;
}) {
  return (
    <>
      {productSlots.map((slot, i) => (
        <React.Fragment key={i}>
          {/* title */}
          <p style={{
            position: "absolute",
            left: slot.l + tl.titleLeft,
            top: tl.titleTop,
            fontSize: tl.titleFontSize,
            fontWeight: 700,
            color: TEXT_COLOR,
            margin: 0,
            width: slot.w,
            textAlign: "center",
            outline: activeField === "title" ? "2px dashed #ea580c" : undefined,
            outlineOffset: activeField === "title" ? 4 : undefined,
          }}>
            {"{year} {make} {model}"}
          </p>

          {/* trim */}
          <p style={{
            position: "absolute",
            left: slot.l + tl.trimLeft,
            top: tl.trimTop,
            fontSize: tl.trimFontSize,
            fontWeight: 400,
            color: TEXT_COLOR,
            margin: 0,
            width: slot.w,
            textAlign: "center",
            outline: activeField === "trim" ? "2px dashed #ea580c" : undefined,
            outlineOffset: activeField === "trim" ? 4 : undefined,
          }}>
            {"{trim}"}
          </p>

          {/* price */}
          <p style={{
            position: "absolute",
            left: slot.l + tl.priceLeft,
            top: tl.priceTop,
            fontSize: tl.priceFontSize,
            fontWeight: 700,
            color: TEXT_COLOR,
            margin: 0,
            width: slot.w,
            textAlign: "center",
            outline: activeField === "price" ? "2px dashed #ea580c" : undefined,
            outlineOffset: activeField === "price" ? 4 : undefined,
          }}>
            {"{monthlyPayment}/mo."}
          </p>

          {/* cta */}
          <div style={{
            position: "absolute",
            left: slot.l + tl.ctaLeft,
            top: tl.ctaTop,
            width: slot.w,
            display: "flex",
            justifyContent: "center",
          }}>
            <div style={{
              background: BTN_COLOR,
              color: BTN_TXT_COLOR,
              borderRadius: 100,
              height: tl.ctaH,
              paddingLeft: tl.ctaPadding,
              paddingRight: tl.ctaPadding,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: tl.ctaFontSize,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.46px",
              whiteSpace: "nowrap",
              outline: activeField === "cta" ? "2px dashed #ea580c" : undefined,
              outlineOffset: activeField === "cta" ? 4 : undefined,
            }}>
              {"{cta}"}
            </div>
          </div>
        </React.Fragment>
      ))}

      {/* shared disclaimer */}
      <p style={{
        position: "absolute",
        left: tl.disclaimer.l,
        top: tl.disclaimer.top,
        fontSize: tl.disclaimer.fontSize,
        color: TEXT_COLOR,
        margin: 0,
        outline: activeField === "disclaimer" ? "2px dashed #ea580c" : undefined,
        outlineOffset: activeField === "disclaimer" ? 4 : undefined,
      }}>
        Photos for illustration purposes only.
      </p>
    </>
  );
}

// ─── Key-message text overlay ─────────────────────────────────────────────────

function KeyMessageTextOverlay({
  tl,
  activeField,
  customFields,
}: {
  tl: KeyMessageTextLayout;
  activeField?: string;
  customFields?: Record<string, string>;
}) {
  const keyMessage = customFields?.keyMessage ?? "{key message}";
  const year = customFields?.year ?? "{year}";

  return (
    <>
      <TextVar el={tl.keyMessage} text={keyMessage} weight={700}
        active={activeField === "keyMessage"}
        extraStyle={{ width: tl.keyMessage.w, whiteSpace: "normal" }} />
      <TextVar el={tl.year} text={year} weight={400}
        active={activeField === "year"} />
      <TextVar el={tl.modelLine} text="{model#1}, {model#2} and {model#3}" weight={400}
        active={activeField === "modelLine"} />
      <CTAVar el={tl.cta} active={activeField === "cta"} />
      <TextVar el={tl.disclaimer} text="Photos for illustration purposes only." weight={400}
        active={activeField === "disclaimer"}
        extraStyle={{ width: tl.disclaimer.w, whiteSpace: "normal" }} />
    </>
  );
}

// ─── Pharma wireframe ─────────────────────────────────────────────────────────

const ISI_COLOR   = "#2563eb";  // blue border for ISI zone
const LOGO_PH_COLOR = "#7c3aed"; // purple fill for logo placeholder (Spiriva brand)
const PHARMA_TEXT_COLOR = "#1e293b";

function PharmaTextOverlay({
  tl,
  activeField,
}: {
  tl: PharmaTextLayout;
  activeField?: string;
}) {
  const varStyle = (field: string, el: TextElement): CSSProperties => ({
    position: "absolute",
    left: el.l,
    top: el.top,
    fontSize: el.fontSize,
    fontWeight: field === "keyMessage" ? 700 : 400,
    color: PHARMA_TEXT_COLOR,
    lineHeight: "1.3",
    whiteSpace: "nowrap",
    outline: activeField === field ? "2px dashed #ea580c" : undefined,
    outlineOffset: activeField === field ? 3 : undefined,
    borderRadius: activeField === field ? 2 : undefined,
    width: el.w,
    overflow: "hidden",
  });

  return (
    <>
      <p style={varStyle("keyMessage", tl.keyMessage)}>{"{key_message_1}"}</p>
      <p style={varStyle("footnote",   tl.footnote)}>  {"{footnote_1}"}</p>
      <p style={varStyle("isiRef",     tl.isiRef)}>    {"{ISI Reference}"}</p>
    </>
  );
}

function PharmaWireframe({
  cfg,
  showText,
  activeField,
}: {
  cfg: PharmaZoneConfig;
  showText?: boolean;
  activeField?: string;
}) {
  const { canvasW, canvasH, bgZone, logoZone, isiZone, textLayout } = cfg;

  return (
    <div style={{
      position: "relative",
      width: canvasW,
      height: canvasH,
      background: "#fafafa",
      border: "3px dashed #22c55e",
      boxSizing: "border-box",
      overflow: "hidden",
    }}>
      {/* Background zone */}
      <div style={{
        position: "absolute",
        left: bgZone.l,
        top: bgZone.top,
        width: bgZone.w,
        height: bgZone.h,
        background: "#d1d5db",
      }} />

      {/* ISI zone */}
      <div style={{
        position: "absolute",
        left: isiZone.l,
        top: isiZone.top,
        width: isiZone.w,
        height: isiZone.h,
        background: "#ffffff",
        border: `2px dashed ${ISI_COLOR}`,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <span style={{
          background: ISI_COLOR,
          color: "#fff",
          fontSize: Math.max(7, Math.round(Math.min(canvasW, canvasH) / 26)),
          fontWeight: 700,
          padding: "2px 6px",
          borderRadius: 4,
          textAlign: "center",
          whiteSpace: "pre",
          lineHeight: 1.3,
          opacity: showText ? 0 : 1,  // hide chip when showing text vars
        }}>ISI{"\n"}Ref</span>
      </div>

      {/* Logo placeholder */}
      <div style={{
        position: "absolute",
        left: logoZone.l,
        top: logoZone.top,
        width: logoZone.w,
        height: logoZone.h,
        background: LOGO_PH_COLOR,
        border: `2px dashed #5b21b6`,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 3,
      }}>
        <span style={{
          color: "#fff",
          fontSize: Math.max(6, Math.round(Math.min(logoZone.w, logoZone.h) / 5)),
          fontWeight: 700,
          textAlign: "center",
          whiteSpace: "pre",
          lineHeight: 1.2,
        }}>Logo{"\n"}Primary</span>
      </div>

      {/* Text overlays */}
      {showText && (
        <PharmaTextOverlay tl={textLayout} activeField={activeField} />
      )}
    </div>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

function Shell({ w, h, children }: { w: number; h: number; children: React.ReactNode }) {
  return (
    <div style={{ position: "relative", width: w, height: h, background: "#fafafa", border: "3px dashed #22c55e", boxSizing: "border-box", overflow: "hidden" }}>
      {children}
    </div>
  );
}

// ─── Config-driven wireframe ──────────────────────────────────────────────────

function ConfigWireframe({
  cfg,
  showText,
  activeField,
  customFields,
}: {
  cfg: TemplateZoneConfig;
  showText?: boolean;
  activeField?: string;
  customFields?: Record<string, string>;
}) {
  const { canvasW, canvasH, bgZone, productSlots, logoP, logoE, textLayout } = cfg;
  const fs = Math.max(8, Math.round(Math.min(canvasW, canvasH) / 22));

  let textOverlay: React.ReactNode = null;
  if (showText) {
    if (isSingleProductTextLayout(textLayout)) {
      textOverlay = <SingleProductTextOverlay tl={textLayout} canvasW={canvasW} activeField={activeField} />;
    } else if (isKeyMessageTextLayout(textLayout)) {
      textOverlay = <KeyMessageTextOverlay tl={textLayout} activeField={activeField} customFields={customFields} />;
    } else {
      textOverlay = <MultiProductTextOverlay tl={textLayout} productSlots={productSlots} activeField={activeField} />;
    }
  }

  return (
    <Shell w={canvasW} h={canvasH}>
      {/* Background zone */}
      <StructuralZone t="background" l={bgZone.l} top={bgZone.top} w={bgZone.w} h={bgZone.h} fs={fs} />

      {/* Product zones */}
      {productSlots.map((slot, i) => {
        const vis = visibleSlotBounds(slot, canvasW, canvasH);
        if (vis.w <= 0 || vis.h <= 0) return null;
        return <StructuralZone key={i} t="product" l={vis.l} top={vis.top} w={vis.w} h={vis.h} fs={fs} />;
      })}

      {/* Logo zones */}
      <StructuralZone t="logo-primary" l={logoP.l} top={logoP.top} w={logoP.size} h={logoP.size} fs={Math.max(7, fs - 4)} />
      <StructuralZone t="event-logo"   l={logoE.l} top={logoE.top} w={logoE.size} h={logoE.size} fs={Math.max(7, fs - 4)} />

      {textOverlay}
    </Shell>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function TextLegend() {
  const items: { color: string; label: string }[] = [
    { color: "#16a34a", label: "Background" },
    { color: "#3b82f6", label: "Product / Car" },
    { color: "#7c3aed", label: "Logo" },
    { color: BTN_COLOR, label: "CTA button" },
  ];
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 pt-2">
      {items.map(({ color, label }) => (
        <span key={label} className="flex items-center gap-1 text-[10px] text-gray-500">
          <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: "inline-block", flexShrink: 0 }} />
          {label}
        </span>
      ))}
      <span className="flex items-center gap-1 text-[10px] text-gray-500">
        <span style={{ width: 10, height: 10, borderRadius: 2, background: TEXT_COLOR, display: "inline-block", flexShrink: 0 }} />
        Text variables
      </span>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function TemplateWireframe({
  templateId,
  scale = 1,
  zoneConfig,
  showText = false,
  activeField,
  customFields,
}: {
  templateId: string;
  scale?: number;
  zoneConfig?: TemplateZoneConfig;
  showText?: boolean;
  activeField?: string;
  /** Live values for manually-filled fields (e.g. keyMessage, year) */
  customFields?: Record<string, string>;
}) {
  const cfg = zoneConfig ?? zoneConfigs[templateId];
  if (!cfg) return null;

  const { canvasW, canvasH } = cfg;

  return (
    <div style={{ width: Math.round(canvasW * scale), height: Math.round(canvasH * scale), position: "relative", overflow: "hidden", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: canvasW, height: canvasH, transform: scale !== 1 ? `scale(${scale})` : undefined, transformOrigin: "top left" }}>
        {isPharmaZoneConfig(cfg) ? (
          <PharmaWireframe cfg={cfg} showText={showText} activeField={activeField} />
        ) : (
          <ConfigWireframe cfg={cfg as TemplateZoneConfig} showText={showText} activeField={activeField} customFields={customFields} />
        )}
      </div>
    </div>
  );
}

export { TextLegend };
