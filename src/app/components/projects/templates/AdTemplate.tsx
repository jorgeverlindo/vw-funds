"use client";

import { CSSProperties, ReactNode, useState, useEffect, createContext, useContext } from "react";
import { sampleImageUrl, deriveAdaptiveColors } from "@/app/utils/adaptiveColor";
import { zoneConfigs, isKeyMessageTextLayout, isPharmaZoneConfig } from "@projects/lib/template-zone-configs";
import type { TemplateZoneConfig, SingleProductTextLayout, MultiProductTextLayout, KeyMessageTextLayout } from "@projects/lib/template-zone-configs";
import { useProjectStoreSafe } from "@projects/lib/project-store";
import { brandKits } from "@projects/lib/mock-data";
import type { BackgroundCollection } from "@projects/logos-backgrounds/BackgroundCollectionCard";
import type { PharmaZoneConfig } from "@projects/lib/template-zone-configs";

// ─── Types ────────────────────────────────────────────────────────────────────

type LayerMode = "full" | "bg-car" | "car" | "ui";

interface AdTemplateCtxValue {
  forExport: boolean;
  layerMode: LayerMode;
  /** null = brand kit has no logo for this slot → render nothing */
  primaryLogoSrc: string | null;
  /** null = brand kit has no logo for this slot → render nothing */
  eventLogoSrc: string | null;
}

const FALLBACK_PRIMARY = "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071648/vw-funds/public/brand-kits/honda/primary-square-positive.png";
const FALLBACK_EVENT   = "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071647/vw-funds/public/brand-kits/honda/event-square-positive.png";

const AdTemplateCtx = createContext<AdTemplateCtxValue>({
  forExport: false,
  layerMode: "full",
  primaryLogoSrc: FALLBACK_PRIMARY,
  eventLogoSrc: FALLBACK_EVENT,
});

interface Offer {
  id?: string;
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
  id?: string;
  color: string;
  images?: Record<string, string>;
  isLifestyle?: boolean;
}

interface AdTemplateProps {
  templateId: string;
  offer?: Offer;
  offers?: (Offer | undefined)[];
  background: Background;
  scale?: number;
  cta?: string;
  dealerName?: string;
  /** Lease label override — e.g. "LEASE · 2025 HONDA". Defaults to "Lease for" */
  leaseLabel?: string;
  /** Single-line fine print — e.g. "36 months | $3,999 due at signing". Falls back to two-line term+due when empty */
  finePrint?: string;
  blank?: boolean;
  forExport?: boolean;
  layerMode?: LayerMode;
  /** Override zone config — used by the zone editor for live preview */
  zoneConfig?: TemplateZoneConfig;
  /** Manually-filled fields for templates like the key-message layout */
  customFields?: Record<string, string>;
  /** Project ID — used to resolve the active brand kit logos from the store */
  projectId?: string;
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const TEXT    = "var(--brand-text)";
const BTN     = "var(--brand)";
const BTN_TXT = "var(--brand-foreground)";

// ─── Shared helpers ───────────────────────────────────────────────────────────

function abs(left: number, top: number, extras?: CSSProperties): CSSProperties {
  return { position: "absolute", left, top, ...extras };
}

// ─── Car image normalization via canvas bounds detection ──────────────────────

interface ImageBounds {
  minX: number; minY: number; maxX: number; maxY: number;
  naturalWidth: number; naturalHeight: number;
}

const boundsCache = new Map<string, ImageBounds>();
const boundsPromises = new Map<string, Promise<ImageBounds>>();

function analyzeImageBounds(src: string): Promise<ImageBounds> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const SCALE = 0.25;
      const w = Math.max(1, Math.round(img.naturalWidth * SCALE));
      const h = Math.max(1, Math.round(img.naturalHeight * SCALE));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      let minX = w, minY = h, maxX = 0, maxY = 0, found = false;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (data[(y * w + x) * 4 + 3] > 20) {
            found = true;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (!found) {
        resolve({ minX: 0, minY: 0, maxX: 1, maxY: 1, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
        return;
      }
      resolve({
        minX: minX / w, minY: minY / h,
        maxX: (maxX + 1) / w, maxY: (maxY + 1) / h,
        naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight,
      });
    };
    img.onerror = () => resolve({ minX: 0, minY: 0, maxX: 1, maxY: 1, naturalWidth: 1, naturalHeight: 1 });
    img.src = src;
  });
}

function getImageBounds(src: string): Promise<ImageBounds> {
  let p = boundsPromises.get(src);
  if (!p) {
    p = analyzeImageBounds(src);
    boundsPromises.set(src, p);
    p.then((b) => boundsCache.set(src, b));
  }
  return p;
}

function CarImage({ offer, style }: { offer: Offer; style: CSSProperties }) {
  const containerW = style.width as number;
  const containerH = style.height as number;
  const [bounds, setBounds] = useState<ImageBounds | null>(() => boundsCache.get(offer.image) ?? null);

  useEffect(() => {
    const cached = boundsCache.get(offer.image);
    if (cached) { setBounds(cached); return; }
    getImageBounds(offer.image).then(setBounds);
  }, [offer.image]);

  const containerStyle: CSSProperties = { position: "absolute", ...style, overflow: "hidden" };

  if (!bounds) {
    return (
      <div style={containerStyle}>
        <img
          src={offer.image}
          alt={`${offer.make} ${offer.model}`}
          style={{ objectFit: "contain", objectPosition: "center bottom" }}
         className="absolute inset-0 w-full h-full" />
      </div>
    );
  }

  const carNatW = (bounds.maxX - bounds.minX) * bounds.naturalWidth;
  const carNatH = (bounds.maxY - bounds.minY) * bounds.naturalHeight;
  const s = Math.min(containerW / carNatW, containerH / carNatH);
  const imgW = bounds.naturalWidth * s;
  const imgH = bounds.naturalHeight * s;
  const imgLeft = (containerW - carNatW * s) / 2 - bounds.minX * imgW;
  const imgTop = containerH - bounds.maxY * imgH;

  return (
    <div style={containerStyle}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={offer.image}
        alt={`${offer.make} ${offer.model}`}
        style={{ position: "absolute", width: imgW, height: "auto", left: imgLeft, top: imgTop }}
      />
    </div>
  );
}

function PrimaryLogo({ size }: { size: number }) {
  const { forExport, primaryLogoSrc } = useContext(AdTemplateCtx);
  if (!primaryLogoSrc) return <div style={{ width: size, height: size }} />;
  return (
    <div style={{ width: size, height: size, position: "relative", display: "block" }}>
      {forExport
        ? <img src={primaryLogoSrc} alt="Primary Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        : <img src={primaryLogoSrc} alt="Primary Logo" style={{ objectFit: "contain" }}  className="absolute inset-0 w-full h-full" />}
    </div>
  );
}

function EventLogo({ size }: { size: number }) {
  const { forExport, eventLogoSrc } = useContext(AdTemplateCtx);
  if (!eventLogoSrc) return <div style={{ width: size, height: size }} />;
  return (
    <div style={{ width: size, height: size, position: "relative", display: "block" }}>
      {forExport
        ? <img src={eventLogoSrc} alt="Event Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        : <img src={eventLogoSrc} alt="Event Logo" style={{ objectFit: "contain" }}  className="absolute inset-0 w-full h-full" />}
    </div>
  );
}

function CTAButton({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{
      position: "absolute",
      background: BTN,
      color: BTN_TXT,
      borderRadius: 100,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 500,
      textTransform: "uppercase" as const,
      letterSpacing: "0.46px",
      whiteSpace: "nowrap" as const,
      ...style,
    }}>
      {children}
    </div>
  );
}

function BG({ image, color, width, height }: { image?: string; color: string; width: number; height: number }) {
  const { forExport } = useContext(AdTemplateCtx);
  if (image) {
    return (
      <div style={{ position: "absolute", inset: 0, width, height }}>
        {forExport
          ? <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <img src={image} alt="" sizes={`${width}px`} style={{ objectFit: "cover" }}  className="absolute inset-0 w-full h-full" />}
      </div>
    );
  }
  return (
    <div style={{
      position: "absolute", inset: 0,
      background: `linear-gradient(135deg, ${color}66, ${color}ee)`,
      width, height,
    }} />
  );
}

// ─── Layout props ─────────────────────────────────────────────────────────────

interface LayoutProps {
  offer?: Offer;
  offers?: (Offer | undefined)[];
  background: Background;
  cta: string;
  dealerName?: string;
  leaseLabel?: string;
  finePrint?: string;
  blank?: boolean;
  cfg: TemplateZoneConfig;
}

// ─── Single-product helper ────────────────────────────────────────────────────

function SingleProductUI({ o, tl, cta, blank, dealerName, leaseLabel, finePrint }: {
  o: Offer | undefined;
  tl: SingleProductTextLayout;
  cta: string;
  blank?: boolean;
  dealerName?: string;
  leaseLabel?: string;
  finePrint?: string;
}) {
  if (blank || !o) return null;
  return (
    <>
      {tl.dealerName && dealerName && (
        <p style={abs(tl.dealerName.l, tl.dealerName.top, { fontSize: tl.dealerName.fontSize, fontWeight: 700, color: TEXT, margin: 0, width: tl.dealerName.w, letterSpacing: "0.17px" })}>
          {dealerName}
        </p>
      )}
      {tl.title && (
        <p style={abs(tl.title.l, tl.title.top, { fontSize: tl.title.fontSize, fontWeight: 400, color: TEXT, lineHeight: "143%", letterSpacing: "0.17px", margin: 0 })}>
          {o.year} {o.make} {o.model} {o.trim}
        </p>
      )}
      <p style={abs(tl.leaseLabel.l, tl.leaseLabel.top, { fontSize: tl.leaseLabel.fontSize, fontWeight: 400, color: TEXT, margin: 0, letterSpacing: "0.25px" })}>
        {leaseLabel || "Lease for"}
      </p>
      <p style={abs(tl.price.l, tl.price.top, { fontSize: tl.price.fontSize, fontWeight: 700, color: TEXT, lineHeight: "143%", letterSpacing: "0.17px", margin: 0 })}>
        ${o.monthlyPayment}/mo.
      </p>
      {tl.finePrint ? (
        <p style={abs(tl.finePrint.l, tl.finePrint.top, { fontSize: tl.finePrint.fontSize, fontWeight: 400, color: TEXT, margin: 0, width: tl.finePrint.w, letterSpacing: "0.25px" })}>
          {finePrint || `${o.term} months  |  $${o.totalDueAtSigning.toLocaleString()} due at signing`}
        </p>
      ) : (
        <>
          {tl.termLabel && (
            <p style={abs(tl.termLabel.l, tl.termLabel.top, { fontSize: tl.termLabel.fontSize, fontWeight: 400, color: TEXT, margin: 0, letterSpacing: "0.25px" })}>
              for {o.term} months.
            </p>
          )}
          {tl.dueLabel && (
            <p style={abs(tl.dueLabel.l, tl.dueLabel.top, { fontSize: tl.dueLabel.fontSize, fontWeight: 400, color: TEXT, margin: 0, letterSpacing: "0.25px" })}>
              ${o.totalDueAtSigning.toLocaleString()} due at signing
            </p>
          )}
        </>
      )}
      <CTAButton style={{ left: tl.cta.l, top: tl.cta.top, minWidth: tl.cta.w, height: tl.cta.h, fontSize: tl.cta.fontSize, paddingLeft: (tl.cta.h ?? tl.cta.fontSize * 2) * 0.5, paddingRight: (tl.cta.h ?? tl.cta.fontSize * 2) * 0.5 }}>
        {cta}
      </CTAButton>
      {tl.disclaimer && (
        <p style={abs(tl.disclaimer.l, tl.disclaimer.top, { fontSize: tl.disclaimer.fontSize, fontWeight: 400, color: TEXT, margin: 0, width: tl.disclaimer.w, textAlign: tl.disclaimer.textAlign ?? "left" })}>
          Photos for illustration purposes only.
        </p>
      )}
    </>
  );
}

// ─── Layout: Website 2000×500 ─────────────────────────────────────────────────

function Layout2000x500({ offer, background, cta, blank, cfg, dealerName, leaseLabel, finePrint }: LayoutProps) {
  const { layerMode: lm } = useContext(AdTemplateCtx);
  const slot = cfg.productSlots[0];
  const tl = cfg.textLayout as SingleProductTextLayout;
  return (
    <div style={{ position: "relative", width: 2000, height: 500, overflow: "hidden" }}>
      {lm !== "ui" && lm !== "car" && <BG image={background.images?.["website-2000x500"]} color={background.color} width={2000} height={500} />}
      {lm !== "ui" && offer && !background.isLifestyle && <CarImage offer={offer} style={{ left: slot.l, top: slot.top, width: slot.w, height: slot.h }} />}
      {lm !== "bg-car" && lm !== "car" && <div style={abs(cfg.logoP.l, cfg.logoP.top)}><PrimaryLogo size={cfg.logoP.size} /></div>}
      {lm !== "bg-car" && lm !== "car" && cfg.logoE.size > 0 && <div style={abs(cfg.logoE.l, cfg.logoE.top)}><EventLogo size={cfg.logoE.size} /></div>}
      {lm !== "bg-car" && lm !== "car" && <SingleProductUI o={offer} tl={tl} cta={cta} blank={blank} dealerName={dealerName} leaseLabel={leaseLabel} finePrint={finePrint} />}
    </div>
  );
}

// ─── Layout: Display 970×250 ──────────────────────────────────────────────────

function Layout970x250({ offer, background, cta, blank, cfg, dealerName, leaseLabel, finePrint }: LayoutProps) {
  const { layerMode: lm } = useContext(AdTemplateCtx);
  const slot = cfg.productSlots[0];
  const tl = cfg.textLayout as SingleProductTextLayout;
  return (
    <div style={{ position: "relative", width: 970, height: 250, overflow: "hidden" }}>
      {lm !== "ui" && lm !== "car" && <BG image={background.images?.["display-970x250"]} color={background.color} width={970} height={250} />}
      {lm !== "ui" && offer && !background.isLifestyle && <CarImage offer={offer} style={{ left: slot.l, top: slot.top, width: slot.w, height: slot.h }} />}
      {lm !== "bg-car" && lm !== "car" && <div style={abs(cfg.logoP.l, cfg.logoP.top)}><PrimaryLogo size={cfg.logoP.size} /></div>}
      {lm !== "bg-car" && lm !== "car" && cfg.logoE.size > 0 && <div style={abs(cfg.logoE.l, cfg.logoE.top)}><EventLogo size={cfg.logoE.size} /></div>}
      {lm !== "bg-car" && lm !== "car" && <SingleProductUI o={offer} tl={tl} cta={cta} blank={blank} dealerName={dealerName} leaseLabel={leaseLabel} finePrint={finePrint} />}
    </div>
  );
}

// ─── Layout: Display 300×250 ──────────────────────────────────────────────────

function Layout300x250({ offer, background, cta, blank, cfg, dealerName, leaseLabel, finePrint }: LayoutProps) {
  const { layerMode: lm } = useContext(AdTemplateCtx);
  const slot = cfg.productSlots[0];
  const tl = cfg.textLayout as SingleProductTextLayout;
  return (
    <div style={{ position: "relative", width: 300, height: 250, overflow: "hidden" }}>
      {lm !== "ui" && lm !== "car" && <BG image={background.images?.["display-300x250"]} color={background.color} width={300} height={250} />}
      {lm !== "ui" && offer && !background.isLifestyle && <CarImage offer={offer} style={{ left: slot.l, top: slot.top, width: slot.w, height: slot.h }} />}
      {lm !== "bg-car" && lm !== "car" && <div style={abs(cfg.logoP.l, cfg.logoP.top)}><PrimaryLogo size={cfg.logoP.size} /></div>}
      {lm !== "bg-car" && lm !== "car" && cfg.logoE.size > 0 && <div style={abs(cfg.logoE.l, cfg.logoE.top)}><EventLogo size={cfg.logoE.size} /></div>}
      {lm !== "bg-car" && lm !== "car" && <SingleProductUI o={offer} tl={tl} cta={cta} blank={blank} dealerName={dealerName} leaseLabel={leaseLabel} finePrint={finePrint} />}
    </div>
  );
}

// ─── Layout: Social 1080×1080 ─────────────────────────────────────────────────

function Layout1080x1080({ offer, background, cta, blank, cfg, dealerName, leaseLabel, finePrint }: LayoutProps) {
  const { layerMode: lm } = useContext(AdTemplateCtx);
  const slot = cfg.productSlots[0];
  const tl = cfg.textLayout as SingleProductTextLayout;
  return (
    <div style={{ position: "relative", width: 1080, height: 1080, overflow: "hidden" }}>
      {lm !== "ui" && lm !== "car" && <BG image={background.images?.["social-1080x1080"]} color={background.color} width={1080} height={1080} />}
      {lm !== "ui" && offer && !background.isLifestyle && <CarImage offer={offer} style={{ left: slot.l, top: slot.top, width: slot.w, height: slot.h }} />}
      {lm !== "bg-car" && lm !== "car" && <div style={abs(cfg.logoP.l, cfg.logoP.top)}><PrimaryLogo size={cfg.logoP.size} /></div>}
      {lm !== "bg-car" && lm !== "car" && cfg.logoE.size > 0 && <div style={abs(cfg.logoE.l, cfg.logoE.top)}><EventLogo size={cfg.logoE.size} /></div>}
      {lm !== "bg-car" && lm !== "car" && <SingleProductUI o={offer} tl={tl} cta={cta} blank={blank} dealerName={dealerName} leaseLabel={leaseLabel} finePrint={finePrint} />}
    </div>
  );
}

// ─── Layout: Website 600×450 ─────────────────────────────────────────────────

function Layout600x450({ offer, background, cta, blank, cfg, dealerName, leaseLabel, finePrint }: LayoutProps) {
  const { layerMode: lm } = useContext(AdTemplateCtx);
  const slot = cfg.productSlots[0];
  const tl = cfg.textLayout as SingleProductTextLayout;
  return (
    <div style={{ position: "relative", width: 600, height: 450, overflow: "hidden" }}>
      {lm !== "ui" && lm !== "car" && <BG image={background.images?.["website-600x450"]} color={background.color} width={600} height={450} />}
      {lm !== "ui" && offer && !background.isLifestyle && <CarImage offer={offer} style={{ left: slot.l, top: slot.top, width: slot.w, height: slot.h }} />}
      {lm !== "bg-car" && lm !== "car" && <div style={abs(cfg.logoP.l, cfg.logoP.top)}><PrimaryLogo size={cfg.logoP.size} /></div>}
      {lm !== "bg-car" && lm !== "car" && cfg.logoE.size > 0 && <div style={abs(cfg.logoE.l, cfg.logoE.top)}><EventLogo size={cfg.logoE.size} /></div>}
      {lm !== "bg-car" && lm !== "car" && <SingleProductUI o={offer} tl={tl} cta={cta} blank={blank} dealerName={dealerName} leaseLabel={leaseLabel} finePrint={finePrint} />}
    </div>
  );
}

// ─── Layout: Website 600×1067 ─────────────────────────────────────────────────

function Layout600x1067({ offer, background, cta, dealerName, leaseLabel, finePrint, blank, cfg }: LayoutProps) {
  const o = offer ?? null;
  const { layerMode: lm } = useContext(AdTemplateCtx);
  const slot = cfg.productSlots[0];
  const tl = cfg.textLayout as SingleProductTextLayout;
  return (
    <div style={{ position: "relative", width: 600, height: 1067, overflow: "hidden" }}>
      {lm !== "ui" && lm !== "car" && <BG image={background.images?.["website-600x1067"]} color={background.color} width={600} height={1067} />}
      {lm !== "ui" && o && !background.isLifestyle && <CarImage offer={o} style={{ left: slot.l, top: slot.top, width: slot.w, height: slot.h }} />}
      {lm !== "bg-car" && lm !== "car" && <div style={abs(cfg.logoP.l, cfg.logoP.top)}><PrimaryLogo size={cfg.logoP.size} /></div>}
      {lm !== "bg-car" && lm !== "car" && cfg.logoE.size > 0 && <div style={abs(cfg.logoE.l, cfg.logoE.top)}><EventLogo size={cfg.logoE.size} /></div>}
      {lm !== "bg-car" && lm !== "car" && <SingleProductUI o={o ?? undefined} tl={tl} cta={cta} blank={blank} dealerName={dealerName} leaseLabel={leaseLabel} finePrint={finePrint} />}
    </div>
  );
}

// ─── Layout: Event 1920×200 ───────────────────────────────────────────────────

function Layout1920x200({ offer, background, cta, blank, cfg, dealerName, leaseLabel, finePrint }: LayoutProps) {
  const { layerMode: lm } = useContext(AdTemplateCtx);
  const slot = cfg.productSlots[0];
  const tl = cfg.textLayout as SingleProductTextLayout;
  return (
    <div style={{ position: "relative", width: 1920, height: 200, overflow: "hidden" }}>
      {lm !== "ui" && lm !== "car" && <BG image={background.images?.["event-1920x200"] ?? background.images?.["display-970x250"]} color={background.color} width={1920} height={200} />}
      {lm !== "ui" && offer && !background.isLifestyle && <CarImage offer={offer} style={{ left: slot.l, top: slot.top, width: slot.w, height: slot.h }} />}
      {lm !== "bg-car" && lm !== "car" && <div style={abs(cfg.logoP.l, cfg.logoP.top)}><PrimaryLogo size={cfg.logoP.size} /></div>}
      {lm !== "bg-car" && lm !== "car" && <SingleProductUI o={offer} tl={tl} cta={cta} blank={blank} dealerName={dealerName} leaseLabel={leaseLabel} finePrint={finePrint} />}
    </div>
  );
}

// ─── Layout: Display 728×90 ───────────────────────────────────────────────────

function Layout728x90({ offer, background, cta, blank, cfg, dealerName, leaseLabel, finePrint }: LayoutProps) {
  const { layerMode: lm } = useContext(AdTemplateCtx);
  const slot = cfg.productSlots[0];
  const tl = cfg.textLayout as SingleProductTextLayout;
  return (
    <div style={{ position: "relative", width: 728, height: 90, overflow: "hidden" }}>
      {lm !== "ui" && lm !== "car" && <BG image={background.images?.["display-728x90"] ?? background.images?.["display-970x250"]} color={background.color} width={728} height={90} />}
      {lm !== "ui" && offer && !background.isLifestyle && <CarImage offer={offer} style={{ left: slot.l, top: slot.top, width: slot.w, height: slot.h }} />}
      {lm !== "bg-car" && lm !== "car" && <div style={abs(cfg.logoP.l, cfg.logoP.top)}><PrimaryLogo size={cfg.logoP.size} /></div>}
      {lm !== "bg-car" && lm !== "car" && <SingleProductUI o={offer} tl={tl} cta={cta} blank={blank} dealerName={dealerName} leaseLabel={leaseLabel} finePrint={finePrint} />}
    </div>
  );
}

// ─── Layout: Display 300×600 ─────────────────────────────────────────────────

function Layout300x600({ offer, background, cta, blank, cfg, dealerName, leaseLabel, finePrint }: LayoutProps) {
  const { layerMode: lm } = useContext(AdTemplateCtx);
  const slot = cfg.productSlots[0];
  const tl = cfg.textLayout as SingleProductTextLayout;
  return (
    <div style={{ position: "relative", width: 300, height: 600, overflow: "hidden" }}>
      {lm !== "ui" && lm !== "car" && <BG image={background.images?.["display-300x600"] ?? background.images?.["website-600x1067"]} color={background.color} width={300} height={600} />}
      {lm !== "ui" && offer && !background.isLifestyle && <CarImage offer={offer} style={{ left: slot.l, top: slot.top, width: slot.w, height: slot.h }} />}
      {lm !== "bg-car" && lm !== "car" && <div style={abs(cfg.logoP.l, cfg.logoP.top)}><PrimaryLogo size={cfg.logoP.size} /></div>}
      {lm !== "bg-car" && lm !== "car" && <SingleProductUI o={offer} tl={tl} cta={cta} blank={blank} dealerName={dealerName} leaseLabel={leaseLabel} finePrint={finePrint} />}
    </div>
  );
}

// ─── Layout: Display 160×600 ─────────────────────────────────────────────────

function Layout160x600({ offer, background, cta, blank, cfg, dealerName, leaseLabel, finePrint }: LayoutProps) {
  const { layerMode: lm } = useContext(AdTemplateCtx);
  const slot = cfg.productSlots[0];
  const tl = cfg.textLayout as SingleProductTextLayout;
  return (
    <div style={{ position: "relative", width: 160, height: 600, overflow: "hidden" }}>
      {lm !== "ui" && lm !== "car" && <BG image={background.images?.["display-160x600"] ?? background.images?.["website-600x1067"]} color={background.color} width={160} height={600} />}
      {lm !== "ui" && offer && !background.isLifestyle && <CarImage offer={offer} style={{ left: slot.l, top: slot.top, width: slot.w, height: slot.h }} />}
      {lm !== "bg-car" && lm !== "car" && <div style={abs(cfg.logoP.l, cfg.logoP.top)}><PrimaryLogo size={cfg.logoP.size} /></div>}
      {lm !== "bg-car" && lm !== "car" && <SingleProductUI o={offer} tl={tl} cta={cta} blank={blank} dealerName={dealerName} leaseLabel={leaseLabel} finePrint={finePrint} />}
    </div>
  );
}

// ─── Layout: Event 1900×776 ───────────────────────────────────────────────────

function Layout1900x776({ offer, background, cta, blank, cfg, dealerName, leaseLabel, finePrint }: LayoutProps) {
  const { layerMode: lm } = useContext(AdTemplateCtx);
  const slot = cfg.productSlots[0];
  const tl = cfg.textLayout as SingleProductTextLayout;
  return (
    <div style={{ position: "relative", width: 1900, height: 776, overflow: "hidden" }}>
      {lm !== "ui" && lm !== "car" && <BG image={background.images?.["event-1900x776"] ?? background.images?.["website-2000x500"]} color={background.color} width={1900} height={776} />}
      {lm !== "ui" && offer && !background.isLifestyle && <CarImage offer={offer} style={{ left: slot.l, top: slot.top, width: slot.w, height: slot.h }} />}
      {lm !== "bg-car" && lm !== "car" && <div style={abs(cfg.logoP.l, cfg.logoP.top)}><PrimaryLogo size={cfg.logoP.size} /></div>}
      {lm !== "bg-car" && lm !== "car" && <SingleProductUI o={offer} tl={tl} cta={cta} blank={blank} dealerName={dealerName} leaseLabel={leaseLabel} finePrint={finePrint} />}
    </div>
  );
}

// ─── Layout: Website 1969×1080 — 3-product ───────────────────────────────────

function Layout1969x1080_3prod({ offers, background, cta, blank, cfg }: LayoutProps) {
  const { layerMode: lm } = useContext(AdTemplateCtx);
  const tl = cfg.textLayout as MultiProductTextLayout;
  const bgImage = background.images?.["website-1969x1080-3prod"]
    ?? background.images?.["website-2000x500"];
  const slotOffers: (Offer | undefined)[] = Array.from({ length: cfg.productSlots.length }, (_, i) =>
    offers?.[i]
  );
  return (
    <div style={{ position: "relative", width: 1969, height: 1080, overflow: "hidden" }}>
      {lm !== "ui" && lm !== "car" && <BG image={bgImage} color={background.color} width={1969} height={1080} />}
      {lm !== "ui" && !background.isLifestyle && cfg.productSlots.map((slot, i) =>
        slotOffers[i] && <CarImage key={i} offer={slotOffers[i]!} style={{ left: slot.l, top: slot.top, width: slot.w, height: slot.h }} />
      )}
      {lm !== "bg-car" && lm !== "car" && <div style={abs(cfg.logoP.l, cfg.logoP.top)}><PrimaryLogo size={cfg.logoP.size} /></div>}
      {lm !== "bg-car" && lm !== "car" && <div style={abs(cfg.logoE.l, cfg.logoE.top)}><EventLogo size={cfg.logoE.size} /></div>}
      {lm !== "bg-car" && lm !== "car" && !blank && (
        <>
          {cfg.productSlots.map((slot, i) => {
            const o = slotOffers[i];
            if (!o) return null;
            return (
              <div key={i}>
                <p style={abs(slot.l + tl.titleLeft, tl.titleTop, { fontSize: tl.titleFontSize, fontWeight: 700, color: TEXT, margin: 0, width: slot.w, textAlign: "center" })}>
                  {o.year} {o.make} {o.model}
                </p>
                <p style={abs(slot.l + tl.trimLeft, tl.trimTop, { fontSize: tl.trimFontSize, fontWeight: 400, color: TEXT, margin: 0, width: slot.w, textAlign: "center" })}>
                  {o.trim}
                </p>
                <p style={abs(slot.l + tl.priceLeft, tl.priceTop, { fontSize: tl.priceFontSize, fontWeight: 700, color: TEXT, margin: 0, width: slot.w, textAlign: "center" })}>
                  ${o.monthlyPayment}/mo.
                </p>
                <div style={{ position: "absolute", left: slot.l + tl.ctaLeft, top: tl.ctaTop, width: slot.w, display: "flex", justifyContent: "center" }}>
                  <CTAButton style={{ position: "relative", fontSize: tl.ctaFontSize, paddingLeft: tl.ctaPadding, paddingRight: tl.ctaPadding, height: tl.ctaH }}>
                    {cta}
                  </CTAButton>
                </div>
              </div>
            );
          })}
          <p style={abs(tl.disclaimer.l, tl.disclaimer.top, { fontSize: tl.disclaimer.fontSize, color: TEXT, margin: 0 })}>
            Photos for illustration purposes only.
          </p>
        </>
      )}
    </div>
  );
}

// ─── Layout: Social 1080×1080 — 3-product ────────────────────────────────────

function Layout1080x1080_3prod({ offers, background, cta, blank, cfg }: LayoutProps) {
  const { layerMode: lm } = useContext(AdTemplateCtx);
  const tl = cfg.textLayout as MultiProductTextLayout;
  const bgImage = background.images?.["social-1080x1080-3prod"]
    ?? background.images?.["social-1080x1080"];
  const slotOffers: (Offer | undefined)[] = Array.from({ length: cfg.productSlots.length }, (_, i) =>
    offers?.[i]
  );
  return (
    <div style={{ position: "relative", width: 1080, height: 1080, overflow: "hidden" }}>
      {lm !== "ui" && lm !== "car" && <BG image={bgImage} color={background.color} width={1080} height={1080} />}
      {lm !== "ui" && !background.isLifestyle && cfg.productSlots.map((slot, i) =>
        slotOffers[i] && <CarImage key={i} offer={slotOffers[i]!} style={{ left: slot.l, top: slot.top, width: slot.w, height: slot.h }} />
      )}
      {lm !== "bg-car" && lm !== "car" && <div style={abs(cfg.logoP.l, cfg.logoP.top)}><PrimaryLogo size={cfg.logoP.size} /></div>}
      {lm !== "bg-car" && lm !== "car" && <div style={abs(cfg.logoE.l, cfg.logoE.top)}><EventLogo size={cfg.logoE.size} /></div>}
      {lm !== "bg-car" && lm !== "car" && !blank && (
        <>
          {cfg.productSlots.map((slot, i) => {
            const o = slotOffers[i];
            if (!o) return null;
            return (
              <div key={i}>
                <p style={abs(slot.l + tl.titleLeft, tl.titleTop, { fontSize: tl.titleFontSize, fontWeight: 700, color: TEXT, margin: 0, width: slot.w, textAlign: "center" })}>
                  {o.year} {o.make} {o.model}
                </p>
                <p style={abs(slot.l + tl.trimLeft, tl.trimTop, { fontSize: tl.trimFontSize, fontWeight: 400, color: TEXT, margin: 0, width: slot.w, textAlign: "center" })}>
                  {o.trim}
                </p>
                <p style={abs(slot.l + tl.priceLeft, tl.priceTop, { fontSize: tl.priceFontSize, fontWeight: 700, color: TEXT, margin: 0, width: slot.w, textAlign: "center" })}>
                  ${o.monthlyPayment}/mo.
                </p>
                <div style={{ position: "absolute", left: slot.l + tl.ctaLeft, top: tl.ctaTop, width: slot.w, display: "flex", justifyContent: "center" }}>
                  <CTAButton style={{ position: "relative", fontSize: tl.ctaFontSize, paddingLeft: tl.ctaPadding, paddingRight: tl.ctaPadding, height: tl.ctaH }}>
                    {cta}
                  </CTAButton>
                </div>
              </div>
            );
          })}
          <p style={abs(tl.disclaimer.l, tl.disclaimer.top, { fontSize: tl.disclaimer.fontSize, color: TEXT, margin: 0 })}>
            Photos for illustration purposes only.
          </p>
        </>
      )}
    </div>
  );
}

// ─── Layout: Social 1080×1080 — Key Message ──────────────────────────────────

function Layout1080x1080_keymsg({ offers, background, cta, blank, cfg, customFields }: LayoutProps & { customFields?: Record<string, string> }) {
  const { layerMode: lm } = useContext(AdTemplateCtx);
  const tl = cfg.textLayout as KeyMessageTextLayout;
  const bgImage = background.images?.["social-1080x1080-keymsg"]
    ?? background.images?.["social-1080x1080"];
  const slotOffers: (Offer | undefined)[] = Array.from({ length: cfg.productSlots.length }, (_, i) => offers?.[i]);

  // Build model line from slots
  const modelNames = slotOffers
    .filter(Boolean)
    .map((o) => o!.model);
  const modelLine = modelNames.length === 3
    ? `${modelNames[0]}, ${modelNames[1]} and ${modelNames[2]}`
    : modelNames.join(", ");

  const keyMessage = customFields?.keyMessage ?? "{key message}";
  const year = customFields?.year ?? "{year}";

  return (
    <div style={{ position: "relative", width: 1080, height: 1080, overflow: "hidden" }}>
      {lm !== "ui" && lm !== "car" && <BG image={bgImage} color={background.color} width={1080} height={1080} />}
      {lm !== "ui" && !background.isLifestyle && cfg.productSlots.map((slot, i) =>
        slotOffers[i] && <CarImage key={i} offer={slotOffers[i]!} style={{ left: slot.l, top: slot.top, width: slot.w, height: slot.h }} />
      )}
      {lm !== "bg-car" && lm !== "car" && <div style={abs(cfg.logoP.l, cfg.logoP.top)}><PrimaryLogo size={cfg.logoP.size} /></div>}
      {lm !== "bg-car" && lm !== "car" && <div style={abs(cfg.logoE.l, cfg.logoE.top)}><EventLogo size={cfg.logoE.size} /></div>}
      {lm !== "bg-car" && lm !== "car" && !blank && (
        <>
          {/* Key message — manually filled */}
          <p style={abs(tl.keyMessage.l, tl.keyMessage.top, { fontSize: tl.keyMessage.fontSize, fontWeight: 700, color: TEXT, margin: 0, width: tl.keyMessage.w, lineHeight: "143%", letterSpacing: "0.17px" })}>
            {keyMessage}
          </p>
          {/* Year — manually filled */}
          <p style={abs(tl.year.l, tl.year.top, { fontSize: tl.year.fontSize, fontWeight: 400, color: TEXT, margin: 0, lineHeight: "143%", letterSpacing: "0.17px" })}>
            {year}
          </p>
          {/* Model line — auto from offers */}
          <p style={abs(tl.modelLine.l, tl.modelLine.top, { fontSize: tl.modelLine.fontSize, fontWeight: 400, color: TEXT, margin: 0, lineHeight: "143%", letterSpacing: "0.17px" })}>
            {modelLine}
          </p>
          {/* CTA */}
          <CTAButton style={{ left: tl.cta.l, top: tl.cta.top, minWidth: tl.cta.w, height: tl.cta.h, fontSize: tl.cta.fontSize, paddingLeft: (tl.cta.h ?? tl.cta.fontSize * 2) * 0.5, paddingRight: (tl.cta.h ?? tl.cta.fontSize * 2) * 0.5 }}>
            {cta}
          </CTAButton>
          {/* Disclaimer */}
          <p style={abs(tl.disclaimer.l, tl.disclaimer.top, { fontSize: tl.disclaimer.fontSize, fontWeight: 400, color: TEXT, margin: 0, width: tl.disclaimer.w })}>
            Photos for illustration purposes only.
          </p>
        </>
      )}
    </div>
  );
}

// ─── Layout registry ──────────────────────────────────────────────────────────

const LAYOUTS: Record<string, { width: number; height: number; Component: React.FC<LayoutProps & { customFields?: Record<string, string> }> }> = {
  "website-2000x500":          { width: 2000, height: 500,  Component: Layout2000x500          },
  "display-970x250":           { width: 970,  height: 250,  Component: Layout970x250           },
  "display-300x250":           { width: 300,  height: 250,  Component: Layout300x250           },
  "social-1080x1080":          { width: 1080, height: 1080, Component: Layout1080x1080         },
  "website-600x450":           { width: 600,  height: 450,  Component: Layout600x450           },
  "website-600x1067":          { width: 600,  height: 1067, Component: Layout600x1067          },
  "event-1920x200":            { width: 1920, height: 200,  Component: Layout1920x200          },
  "display-728x90":            { width: 728,  height: 90,   Component: Layout728x90            },
  "display-300x600":           { width: 300,  height: 600,  Component: Layout300x600           },
  "display-160x600":           { width: 160,  height: 600,  Component: Layout160x600           },
  "event-1900x776":            { width: 1900, height: 776,  Component: Layout1900x776          },
  "website-1969x1080-3prod":   { width: 1969, height: 1080, Component: Layout1969x1080_3prod   },
  "social-1080x1080-3prod":    { width: 1080, height: 1080, Component: Layout1080x1080_3prod   },
  "social-1080x1080-keymsg":   { width: 1080, height: 1080, Component: Layout1080x1080_keymsg  },
};

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Resolve the active [textColor, btnColor] pair for a given brand.
 * Priority: stored override → brand kit default → hardcoded fallback.
 */
export function resolveColors(
  make: string,
  activeColors: Record<string, Record<string, [string, string]>>,
  projectId: string,
): [string, string] {
  const stored = projectId ? activeColors[projectId]?.[make] : undefined;
  if (stored && stored.length === 2) return stored;
  const kit = brandKits.find((k) => k.oem === make);
  if (kit && kit.colors.length >= 2) return [kit.colors[0], kit.colors[1]] as [string, string];
  return ["#000000", "#CC0000"];
}

/** Resolve the active logo image URL for a given brand + slot type from the store. */
export function resolveLogoSrc(
  make: string,
  slotType: string,
  activeBrandKitIds: Record<string, Record<string, string>>,
  activeLogoIds: Record<string, Record<string, Record<string, string>>>,
  projectId: string,
): string | undefined {
  const kitId = activeBrandKitIds[projectId]?.[make];
  const kit = brandKits.find((k) => k.id === kitId) ?? brandKits.find((k) => k.oem === make);
  if (!kit) return undefined;
  const logoId = activeLogoIds[projectId]?.[make]?.[slotType];
  if (logoId && (logoId.startsWith("data:") || logoId.startsWith("blob:"))) return logoId;
  const candidates = kit.logos.filter((l) => l.id.startsWith(slotType + "-"));
  const logo =
    candidates.find((l) => l.id === logoId) ??
    candidates.find((l) => l.id === slotType + "-positive") ??
    candidates[0];
  return logo?.image;
}

export function AdTemplate({
  templateId,
  offer,
  offers,
  background,
  scale = 1,
  cta = "Shop Now",
  dealerName = "Honda of Anywhere",
  leaseLabel,
  finePrint,
  blank = false,
  forExport = false,
  layerMode = "full",
  zoneConfig,
  customFields,
  projectId,
}: AdTemplateProps) {
  const layout = LAYOUTS[templateId];
  if (!layout) return null;

  const rawCfg = zoneConfig ?? zoneConfigs[templateId];
  if (!rawCfg || isPharmaZoneConfig(rawCfg)) return null;
  const cfg: TemplateZoneConfig = rawCfg;

  const { width, height, Component } = layout;

  // Resolve logo srcs from the project store when a projectId is provided.
  // When projectId+store are available we trust the kit — if no logo exists for a
  // slot the result is null (slot renders empty). The Honda fallbacks only apply
  // when there is no project context at all (e.g. standalone / export renders).
  const store = useProjectStoreSafe();

  // Adaptive text color: sample the background image to pick white, near-black,
  // or a darkened harmonized hue based on the background luminance.
  const bgImageUrl =
    background.images?.[templateId] ??
    background.images?.["social-1080x1080"] ??
    background.images?.["website-2000x500"] ??
    Object.values(background.images ?? {})[0];

  const [adTextColor, setAdTextColor] = useState<string | null>(null);
  useEffect(() => {
    if (!bgImageUrl) { setAdTextColor(null); return; }
    let cancelled = false;
    setAdTextColor(null);
    sampleImageUrl(bgImageUrl).then((sample) => {
      if (!cancelled && sample) setAdTextColor(deriveAdaptiveColors(sample).primary);
    });
    return () => { cancelled = true; };
  }, [bgImageUrl]);

  const offerMake = offer?.make ?? offers?.find(Boolean)?.make ?? "";
  const offerId = offer?.id ?? "";
  const otKey = offerId && templateId ? `${offerId}::${templateId}` : "";

  let primaryLogoSrc: string | null =
    projectId && store
      ? (resolveLogoSrc(offerMake, "primary-square", store.activeBrandKitIds, store.activeLogoIds, projectId) ?? null)
      : FALLBACK_PRIMARY;
  let eventLogoSrc: string | null =
    projectId && store
      ? (resolveLogoSrc(offerMake, "event-square", store.activeBrandKitIds, store.activeLogoIds, projectId) ?? null)
      : FALLBACK_EVENT;

  // Apply per-template logo overrides (template-level scope — above offer, below offerTemplate)
  if (projectId && store && templateId) {
    const tplOverride = (store as any).templateLogoIds?.[projectId]?.[templateId]?.[offerMake];
    if (tplOverride?.["primary-square"]) primaryLogoSrc = tplOverride["primary-square"];
    if (tplOverride?.["event-square"]) eventLogoSrc = tplOverride["event-square"];
  }
  // Apply per-background+make logo overrides (sits above offer-level, below offerTemplate)
  if (projectId && store && background?.id) {
    const bgOverride = (store as any).backgroundMakeLogoIds?.[projectId]?.[background.id]?.[offerMake];
    if (bgOverride?.["primary-square"]) primaryLogoSrc = bgOverride["primary-square"];
    if (bgOverride?.["event-square"]) eventLogoSrc = bgOverride["event-square"];
  }
  // Apply per-offer logo overrides (offer-level scope)
  if (projectId && store && offerId) {
    const offerOverride = store.offerLogoIds[projectId]?.[offerId]?.[offerMake];
    if (offerOverride?.["primary-square"]) primaryLogoSrc = offerOverride["primary-square"];
    if (offerOverride?.["event-square"]) eventLogoSrc = offerOverride["event-square"];
  }
  // Apply per-offer+template logo overrides (finest scope — wins over offer-level)
  if (projectId && store && otKey) {
    const otOverride = store.offerTemplateLogoIds[projectId]?.[otKey]?.[offerMake];
    if (otOverride?.["primary-square"]) primaryLogoSrc = otOverride["primary-square"];
    if (otOverride?.["event-square"]) eventLogoSrc = otOverride["event-square"];
  }

  // Resolve brand colors — applies to ALL renders (with or without projectId).
  // When projectId+store are present, stored overrides take priority.
  // Priority: per-offer+template → per-offer → project-level (brand kit) → default.
  let [textColor, btnColor] = resolveColors(
    offerMake,
    store?.activeColors ?? {},
    projectId ?? "",
  );

  if (projectId && store && templateId) {
    const tplColorOverride = (store as any).templateColors?.[projectId]?.[templateId]?.[offerMake];
    if (tplColorOverride) [textColor, btnColor] = tplColorOverride;
  }
  if (projectId && store && background?.id) {
    const bgColorOverride = (store as any).backgroundMakeColors?.[projectId]?.[background.id]?.[offerMake];
    if (bgColorOverride) [textColor, btnColor] = bgColorOverride;
  }
  if (projectId && store && offerId) {
    const offerColorOverride = store.offerColors[projectId]?.[offerId]?.[offerMake];
    if (offerColorOverride) [textColor, btnColor] = offerColorOverride;
  }
  if (projectId && store && otKey) {
    const otColorOverride = store.offerTemplateColors[projectId]?.[otKey]?.[offerMake];
    if (otColorOverride) [textColor, btnColor] = otColorOverride;
  }

  return (
    <AdTemplateCtx.Provider value={{ forExport, layerMode, primaryLogoSrc, eventLogoSrc }}>
      <div style={{
        width: Math.round(width * scale),
        height: Math.round(height * scale),
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
        "--brand-text": adTextColor ?? textColor,
        "--brand": btnColor,
        "--brand-foreground": "#ffffff",
      } as React.CSSProperties}>
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width,
          height,
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          transformOrigin: "top left",
        }}>
          <Component offer={offer} offers={offers} background={background} cta={cta} dealerName={dealerName} leaseLabel={leaseLabel} finePrint={finePrint} blank={blank} cfg={cfg} customFields={customFields} />
        </div>
      </div>
    </AdTemplateCtx.Provider>
  );
}

// ─── PharmaAdTemplate ─────────────────────────────────────────────────────────

interface PharmaAdTemplateProps {
  templateId: string;
  background: BackgroundCollection;
  scale?: number;
  /** Project ID — used to resolve the active brand kit / logo from the store */
  projectId?: string;
  /** OEM / make key used to look up the active brand kit (e.g. "Spiriva") */
  make?: string;
  /** Content from the data table row — keys: key_message_1, footnote_1, ISI Reference */
  dataFields?: Record<string, string>;
}

export function PharmaAdTemplate({
  templateId,
  background,
  scale = 1,
  projectId,
  make = "",
  dataFields = {},
}: PharmaAdTemplateProps) {
  const raw = zoneConfigs[templateId];
  if (!raw || !isPharmaZoneConfig(raw)) return null;
  const cfg = raw as PharmaZoneConfig;

  const store = useProjectStoreSafe();

  // Resolve logo from the active brand kit for this project + make
  const logoSrc: string | null =
    projectId && store && make
      ? (resolveLogoSrc(make, "primary-square", store.activeBrandKitIds, store.activeLogoIds, projectId) ?? null)
      : null;

  // Resolve the background image URL by matching dimensions (pharma BGs use a
  // `dimensions` array rather than template-id-keyed `images`).
  const bgImageUrl = (() => {
    if (background.images?.[templateId]) return background.images[templateId];
    const match = background.dimensions?.find(
      (d) => d.width === cfg.canvasW && d.height === cfg.canvasH
    );
    return match?.url ?? background.thumbnail;
  })();

  const { canvasW, canvasH, bgZone, logoZone, isiZone, textLayout, ctaZone } = cfg;
  const kmText  = dataFields["key_message_1"] ?? "";
  const fnText  = dataFields["footnote_1"]    ?? "";
  const isiText = dataFields["ISI Reference"] ?? "";
  const ctaText = dataFields["cta"]           ?? "";

  return (
    <div style={{
      width: Math.round(canvasW * scale),
      height: Math.round(canvasH * scale),
      position: "relative",
      overflow: "hidden",
      flexShrink: 0,
    }}>
      <div style={{
        position: "absolute",
        top: 0, left: 0,
        width: canvasW, height: canvasH,
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: "top left",
        backgroundColor: "#e8e8e8",
      }}>
        {/* Background photo zone */}
        <div style={{
          position: "absolute",
          left: bgZone.l, top: bgZone.top,
          width: bgZone.w, height: bgZone.h,
          overflow: "hidden",
          backgroundColor: background.color ?? "#ccc",
        }}>
          {bgImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bgImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          )}
        </div>

        {/* ISI zone — white panel */}
        <div style={{
          position: "absolute",
          left: isiZone.l, top: isiZone.top,
          width: isiZone.w, height: isiZone.h,
          backgroundColor: "#fff",
          overflow: "hidden",
        }}>
          {isiText && (
            <p style={{
              position: "absolute",
              left:  textLayout.isiRef.l - isiZone.l,
              top:   textLayout.isiRef.top - isiZone.top,
              width: textLayout.isiRef.w,
              fontSize: textLayout.isiRef.fontSize,
              lineHeight: 1.35,
              color: "#333",
              margin: 0,
              whiteSpace: "pre-wrap",
            }}>
              {isiText}
            </p>
          )}
        </div>

        {/* Brand logo */}
        {logoSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoSrc}
            alt="Logo"
            style={{
              position: "absolute",
              left: logoZone.l, top: logoZone.top,
              width: logoZone.w, height: logoZone.h,
              objectFit: "contain",
            }}
          />
        )}

        {/* Key message */}
        {kmText && (
          <p style={{
            position: "absolute",
            left:  textLayout.keyMessage.l,
            top:   textLayout.keyMessage.top,
            width: textLayout.keyMessage.w,
            fontSize: textLayout.keyMessage.fontSize,
            fontWeight: 600,
            color: "#fff",
            margin: 0,
            lineHeight: 1.3,
            whiteSpace: "pre-wrap",
          }}>
            {kmText}
          </p>
        )}

        {/* Footnote */}
        {fnText && (
          <p style={{
            position: "absolute",
            left:  textLayout.footnote.l,
            top:   textLayout.footnote.top,
            width: textLayout.footnote.w,
            fontSize: textLayout.footnote.fontSize,
            color: "rgba(255,255,255,0.9)",
            margin: 0,
            lineHeight: 1.3,
            whiteSpace: "pre-wrap",
          }}>
            {fnText}
          </p>
        )}

        {/* CTA button */}
        {ctaText && ctaZone && (
          <div style={{
            position: "absolute",
            left:   ctaZone.l,
            top:    ctaZone.top,
            width:  ctaZone.w,
            height: ctaZone.h,
            backgroundColor: "#1a9e8f",
            borderRadius: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <span style={{
              fontSize: ctaZone.fontSize,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}>
              {ctaText}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export type { AdTemplateProps, TemplateZoneConfig };
