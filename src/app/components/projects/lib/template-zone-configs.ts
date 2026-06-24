import rawConfigs from "./template-zone-configs.json";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductSlot {
  l: number;
  top: number;
  w: number;
  h: number;
}

export interface LogoPosition {
  l: number;
  top: number;
  size: number;
}

export interface BgZone {
  l: number;
  top: number;
  w: number;
  h: number;
}

export interface TextElement {
  l: number;
  top: number;
  fontSize: number;
  w?: number;
  h?: number;
  textAlign?: "left" | "center" | "right";
}

/** Text layout for single-product templates */
export interface SingleProductTextLayout {
  dealerName?: TextElement;
  /** Year + make + model + trim line — omit to hide */
  title?: TextElement;
  leaseLabel: TextElement;
  price: TextElement;
  /** Legacy: two-line term/due display — used when finePrint is absent */
  termLabel?: TextElement;
  dueLabel?: TextElement;
  /** Single-line fine print replacing termLabel + dueLabel */
  finePrint?: TextElement;
  cta: TextElement;
  disclaimer?: TextElement;
}

/** Text layout for multi-product (3-up) templates — positions are per-slot offsets */
export interface MultiProductTextLayout {
  titleLeft: number;
  titleTop: number;
  titleFontSize: number;
  trimLeft: number;
  trimTop: number;
  trimFontSize: number;
  priceLeft: number;
  priceTop: number;
  priceFontSize: number;
  ctaLeft: number;
  ctaTop: number;
  ctaH: number;
  ctaFontSize: number;
  ctaPadding: number;
  disclaimer: TextElement;
}

/**
 * Text layout for "key message" multi-product templates.
 * keyMessage and year are manually filled in the Styles step.
 * modelLine is auto-composed from the 3 slot offers.
 */
export interface KeyMessageTextLayout {
  /** Manually filled — large headline */
  keyMessage: TextElement;
  /** Manually filled — model year string, e.g. "2026" */
  year: TextElement;
  /** Auto: "{model#1}, {model#2} and {model#3}" — from slot offers */
  modelLine: TextElement;
  /** CTA pill button */
  cta: TextElement;
  /** Static disclaimer */
  disclaimer: TextElement;
}

export type TextLayout = SingleProductTextLayout | MultiProductTextLayout | KeyMessageTextLayout;

export interface TemplateZoneConfig {
  canvasW: number;
  canvasH: number;
  bgZone: BgZone;
  productSlots: ProductSlot[];
  logoP: LogoPosition;
  logoE: LogoPosition;
  textLayout: TextLayout;
  /** When true, all text renders dark (#1f1d25) instead of white — use for light/bright backgrounds */
  darkText?: boolean;
}

// ─── Pharma template types ────────────────────────────────────────────────────

/** Text layout for pharma (ISI-split) templates */
export interface PharmaTextLayout {
  kind: "pharma";
  /** Large headline variable, e.g. "{key_message_1}" */
  keyMessage: TextElement;
  /** Small body variable, e.g. "{footnote_1}" */
  footnote: TextElement;
  /** Legal reference text in the ISI zone */
  isiRef: TextElement;
}

/** Logo zone with independent width + height (pharma logos are not square) */
export interface PharmaLogoZone {
  l: number;
  top: number;
  w: number;
  h: number;
}

/** ISI zone — either at the bottom (vertical layouts) or on the right (horizontal) */
export interface IsiZone {
  l: number;
  top: number;
  w: number;
  h: number;
}

export interface PharmaCTAZone {
  l: number;
  top: number;
  w: number;
  h: number;
  fontSize: number;
}

export interface PharmaZoneConfig {
  kind: "pharma";
  canvasW: number;
  canvasH: number;
  bgZone: BgZone;
  logoZone: PharmaLogoZone;
  isiZone: IsiZone;
  textLayout: PharmaTextLayout;
  ctaZone: PharmaCTAZone;
}

export type AnyZoneConfig = TemplateZoneConfig | PharmaZoneConfig;
export type ZoneConfigMap = Record<string, AnyZoneConfig>;

export function isPharmaZoneConfig(cfg: AnyZoneConfig): cfg is PharmaZoneConfig {
  return (cfg as PharmaZoneConfig).kind === "pharma";
}

// ─── Pharma zone configs (Spiriva) ────────────────────────────────────────────

const pharmaZoneConfigs: Record<string, PharmaZoneConfig> = {
  "spiriva-300x600": {
    kind: "pharma",
    canvasW: 300, canvasH: 600,
    bgZone:   { l: 0,  top: 0,   w: 300, h: 405 },
    logoZone: { l: 30, top: 25,  w: 110, h: 80  },
    isiZone:  { l: 0,  top: 405, w: 300, h: 195 },
    textLayout: {
      kind: "pharma",
      keyMessage: { l: 22, top: 119, fontSize: 16, w: 185 },
      footnote:   { l: 22, top: 231, fontSize: 10, w: 250 },
      isiRef:     { l: 22, top: 431, fontSize:  8, w: 256 },
    },
    ctaZone: { l: 22, top: 330, w: 110, h: 30, fontSize: 10 },
  },
  "spiriva-160x600": {
    kind: "pharma",
    canvasW: 160, canvasH: 600,
    bgZone:   { l: 0,  top: 0,   w: 160, h: 405 },
    logoZone: { l: 26, top: 25,  w: 108, h: 79  },
    isiZone:  { l: 0,  top: 405, w: 160, h: 195 },
    textLayout: {
      kind: "pharma",
      keyMessage: { l: 22, top: 119, fontSize: 11, w: 120 },
      footnote:   { l: 25, top: 231, fontSize:  8, w: 115 },
      isiRef:     { l: 22, top: 431, fontSize:  7, w: 116 },
    },
    ctaZone: { l: 20, top: 330, w: 100, h: 28, fontSize: 9 },
  },
  "spiriva-300x250": {
    kind: "pharma",
    canvasW: 300, canvasH: 250,
    bgZone:   { l: 0,  top: 0,   w: 300, h: 159 },
    logoZone: { l: 30, top: 25,  w: 74,  h: 54  },
    isiZone:  { l: 0,  top: 159, w: 300, h: 91  },
    textLayout: {
      kind: "pharma",
      keyMessage: { l: 30, top: 87,  fontSize: 14, w: 127 },
      footnote:   { l: 30, top: 117, fontSize:  9, w: 200 },
      isiRef:     { l: 22, top: 181, fontSize:  7, w: 256 },
    },
    ctaZone: { l: 170, top: 117, w: 110, h: 30, fontSize: 10 },
  },
  "spiriva-728x90": {
    kind: "pharma",
    canvasW: 728, canvasH: 90,
    bgZone:   { l: 0,   top: 0, w: 490, h: 90 },
    logoZone: { l: 20,  top: 19, w: 74, h: 54 },
    isiZone:  { l: 490, top: 0, w: 238, h: 90 },
    textLayout: {
      kind: "pharma",
      keyMessage: { l: 117, top: 17, fontSize: 14, w: 200 },
      footnote:   { l: 117, top: 47, fontSize:  8, w: 250 },
      isiRef:     { l: 493, top: 13, fontSize:  8, w: 220 },
    },
    ctaZone: { l: 365, top: 30, w: 110, h: 30, fontSize: 10 },
  },
  "spiriva-320x50": {
    kind: "pharma",
    canvasW: 320, canvasH: 50,
    bgZone:   { l: 0,   top: 0, w: 215, h: 50 },
    logoZone: { l: 17,  top: 14, w: 30, h: 22 },
    isiZone:  { l: 215, top: 0, w: 105, h: 50 },
    textLayout: {
      kind: "pharma",
      keyMessage: { l: 65,  top: 11, fontSize: 9, w: 100 },
      footnote:   { l: 65,  top: 23, fontSize: 7, w: 103 },
      isiRef:     { l: 218, top:  5, fontSize: 6, w:  90 },
    },
    ctaZone: { l: 150, top: 16, w: 58, h: 18, fontSize: 6 },
  },
  "spiriva-300x50": {
    kind: "pharma",
    canvasW: 300, canvasH: 50,
    bgZone:   { l: 0,   top: 0, w: 200, h: 50 },
    logoZone: { l: 17,  top: 14, w: 30, h: 22 },
    isiZone:  { l: 200, top: 0, w: 100, h: 50 },
    textLayout: {
      kind: "pharma",
      keyMessage: { l: 65,  top: 11, fontSize: 9, w: 90 },
      footnote:   { l: 65,  top: 23, fontSize: 7, w: 90 },
      isiRef:     { l: 203, top:  5, fontSize: 6, w: 85 },
    },
    ctaZone: { l: 140, top: 16, w: 55, h: 18, fontSize: 6 },
  },
};

// ─── Typed map ────────────────────────────────────────────────────────────────

export const zoneConfigs: ZoneConfigMap = {
  ...(rawConfigs as Record<string, TemplateZoneConfig>),
  ...pharmaZoneConfigs,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getZoneConfig(templateId: string): AnyZoneConfig | null {
  return zoneConfigs[templateId] ?? null;
}

/** Returns the visible (clamped-to-canvas) bounding box of a product slot */
export function visibleSlotBounds(
  slot: ProductSlot,
  canvasW: number,
  canvasH: number
): { l: number; top: number; w: number; h: number } {
  const vl = Math.max(0, slot.l);
  const vt = Math.max(0, slot.top);
  const vr = Math.min(canvasW, slot.l + slot.w);
  const vb = Math.min(canvasH, slot.top + slot.h);
  return { l: vl, top: vt, w: Math.max(0, vr - vl), h: Math.max(0, vb - vt) };
}

/** Discriminate between single-product and multi-product text layouts */
export function isSingleProductTextLayout(tl: TextLayout): tl is SingleProductTextLayout {
  return "price" in tl;
}

/** Discriminate key-message layout (has `keyMessage` field) */
export function isKeyMessageTextLayout(tl: TextLayout): tl is KeyMessageTextLayout {
  return "keyMessage" in tl;
}
