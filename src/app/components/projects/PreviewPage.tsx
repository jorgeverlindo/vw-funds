
import { useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, SlidersHorizontal, ChevronDown, Eye, Trash2, Pencil, Download, Sparkles, RotateCcw, Plus, PanelLeft } from "lucide-react";
import { useSidebar } from "@projects/lib/sidebar-context";
import { SelectBackgroundDialog } from "@projects/logos-backgrounds/SelectBackgroundDialog";
import type { BackgroundCollection } from "@projects/logos-backgrounds/BackgroundCollectionCard";
import { createRoot } from "react-dom/client";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { AdTemplate } from "@projects/templates/AdTemplate";
import { OfferSlotThumbnail, KeyMessageInlineInputs } from "@projects/logos-backgrounds/CombinationAccordion";
import { getProjectOffers, getProjectTemplates, getProjectById, offerLibrary } from "@projects/lib/mock-data";
import type { Offer } from "@projects/lib/mock-data";
import { useProjectStore } from "@projects/lib/project-store";
import { matchesLifestyle, matchesMultiLifestyle } from "@projects/lib/lifestyle-data";
import { thumbnailScale } from "@projects/lib/thumbnail-scale";
import { optimizeImageWithReplicate } from "@projects/lib/api-client";


interface PadInfo {
  paddedUrl: string;
  origW: number;
  origH: number;
  padTop: number;
  padLeft: number;
  paddedW: number;
  paddedH: number;
}

/**
 * If the image aspect ratio is outside the 9:16–16:9 range that AI models
 * handle well (e.g. a 4:1 banner), letterbox it to 16:9 or 9:16 so Flux
 * doesn't distort the car when processing. Otherwise returns the image as-is.
 */
function letterboxForAI(dataUrl: string): Promise<PadInfo> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const origW = img.naturalWidth || img.width;
      const origH = img.naturalHeight || img.height;
      const ratio = origW / origH;
      const MAX_RATIO = 16 / 9; // ≈ 1.778
      const MIN_RATIO = 9 / 16; // ≈ 0.5625

      let paddedW = origW;
      let paddedH = origH;
      let padTop = 0;
      let padLeft = 0;

      if (ratio > MAX_RATIO) {
        // Too wide (e.g. 4:1 banner) → add top+bottom padding to reach 16:9
        paddedH = Math.round(origW / MAX_RATIO);
        padTop = Math.round((paddedH - origH) / 2);
      } else if (ratio < MIN_RATIO) {
        // Too tall → add left+right padding to reach 9:16
        paddedW = Math.round(origH * MIN_RATIO);
        padLeft = Math.round((paddedW - origW) / 2);
      }

      const canvas = document.createElement("canvas");
      canvas.width = paddedW;
      canvas.height = paddedH;
      const ctx = canvas.getContext("2d")!;

      if (padTop > 0) {
        // Horizontal banner — fill top and bottom strips by stretching the
        // top/bottom edge rows of the original image. This gives Flux a
        // plausible background to blend rather than hard black borders, which
        // would cause it to recompose the scene and potentially move the car.
        // Top strip: stretch the top 1px row of the original image
        ctx.drawImage(img, 0, 0, origW, 1, 0, 0, paddedW, padTop);
        // Bottom strip: stretch the bottom 1px row of the original image
        ctx.drawImage(img, 0, origH - 1, origW, 1, 0, padTop + origH, paddedW, paddedH - padTop - origH);
      } else if (padLeft > 0) {
        // Vertical banner — fill left and right strips by stretching edge columns
        ctx.drawImage(img, 0, 0, 1, origH, 0, 0, padLeft, paddedH);
        ctx.drawImage(img, origW - 1, 0, 1, origH, padLeft + origW, 0, paddedW - padLeft - origW, paddedH);
      }

      // Draw the original image on top of the filled padding
      ctx.drawImage(img, padLeft, padTop, origW, origH);

      resolve({
        paddedUrl: canvas.toDataURL("image/png"),
        origW, origH,
        padTop, padLeft,
        paddedW, paddedH,
      });
    };
    img.onerror = () => {
      const i = new window.Image();
      i.src = dataUrl;
      resolve({ paddedUrl: dataUrl, origW: 1, origH: 1, padTop: 0, padLeft: 0, paddedW: 1, paddedH: 1 });
    };
    img.src = dataUrl;
  });
}

/**
 * Compress a data URL to JPEG at the given quality, capped at maxDim on the
 * longest side. Keeps the payload well under Vercel's 4.5 MB request limit.
 */
function compressForApi(dataUrl: string, maxDim = 1400, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;
      if (Math.max(w, h) > maxDim) {
        const scale = maxDim / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * After Flux returns a result matching the padded aspect ratio, crop back to
 * the original content area, then scale to the exact template pixel dimensions.
 */
function cropAndResizeResult(
  dataUrl: string,
  pad: PadInfo,
  targetW: number,
  targetH: number,
): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      // Flux may return at a different resolution but same ratio — compute scale
      const scaleX = img.naturalWidth  / pad.paddedW;
      const scaleY = img.naturalHeight / pad.paddedH;

      const sx = pad.padLeft * scaleX;
      const sy = pad.padTop  * scaleY;
      const sw = pad.origW   * scaleX;
      const sh = pad.origH   * scaleY;

      const canvas = document.createElement("canvas");
      canvas.width  = targetW;
      canvas.height = targetH;
      // Crop the content area out, then scale to exact template dimensions
      canvas.getContext("2d")!.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);

      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function waitForImages(container: HTMLElement): Promise<void> {
  const imgs = Array.from(container.querySelectorAll("img"));
  return Promise.all(
    imgs.map((img) => new Promise<void>((resolve) => {
      if (img.complete) { resolve(); return; }
      img.onload = () => resolve();
      img.onerror = () => resolve();
    }))
  ).then(() => undefined);
}

export function PreviewPage({ projectId, onNavigateTo }: { projectId: string; onNavigateTo: (page: string) => void }) {
  const id = projectId;
  const project = getProjectById(id);
  const { toggleSidebar, sidebarOpen } = useSidebar();
  const allOffers = getProjectOffers(id);
  const templates = getProjectTemplates(id);
  const singleTemplates = templates.filter((t) => t.products === 1);
  const multiTemplates = templates.filter((t) => t.products > 1);
  const [zoom, setZoom] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [optimizing, setOptimizing] = useState<Set<string>>(new Set());
  const [addBgOpen, setAddBgOpen] = useState(false);
  const { backgrounds, addBackgrounds, getBackgroundsForTemplate, getBackgroundsForOfferTemplate, excludeBackgroundFromOfferTemplate, clearExclusionsForBackground, aiResults, setAiResult, clearAiResult, combinations, setCombinationOfferAtSlot, reEvaluateMultiLifestyleForCombo, deletedOfferIds, addedOfferIds, customTemplateFields } = useProjectStore();
  const extraOffers = (addedOfferIds[id] ?? [])
    .map((aid) => offerLibrary.find((o) => o.id === aid))
    .filter((o): o is Offer => !!o);
  const offers = [...allOffers, ...extraOffers].filter((o) => !deletedOfferIds.has(o.id));
  const [lightbox, setLightbox] = useState<{ offer?: typeof offers[0]; offers?: (typeof offers[0] | undefined)[]; template: typeof templates[0]; bg: BackgroundCollection; aiResult?: string } | null>(null);

  function getComboSlotOffers(combo: { id: string; offerIds: string[] }) {
    const slotCount = multiTemplates[0]?.products ?? 3;
    return Array.from({ length: slotCount }, (_, i) => {
      const id = combo.offerIds[i];
      if (id === undefined) return offers[i];   // never set → default
      if (id === "") return undefined;           // explicitly cleared → empty
      return offers.find((o) => o.id === id);   // explicitly chosen
    });
  }

  function handleAddBackgrounds(collections: BackgroundCollection[]) {
    addBackgrounds(collections);

    // Mirror the same lifestyle exclusion logic as the Styles page (global add path).
    clearExclusionsForBackground(collections.map((c) => c.id));

    // Single-vehicle lifestyle: exclude from non-matching offers + all multi-product combos
    collections.filter((c) => c.isLifestyle && c.vehicleTag && !c.vehicleTags?.length).forEach((bg) => {
      offers.forEach((offer) => {
        if (!matchesLifestyle(bg, offer.model, offer.trim)) {
          templates.forEach((tpl) => {
            excludeBackgroundFromOfferTemplate(offer.id, tpl.id, bg.id);
          });
        }
      });
      combinations.forEach((combo) => {
        multiTemplates.forEach((tpl) => {
          excludeBackgroundFromOfferTemplate(combo.id, tpl.id, bg.id);
        });
      });
    });

    // Multi-vehicle lifestyle: exclude from all single-offer contexts + non-matching combos
    collections.filter((c) => c.isLifestyle && c.vehicleTags?.length).forEach((bg) => {
      offers.forEach((offer) => {
        singleTemplates.forEach((tpl) => {
          excludeBackgroundFromOfferTemplate(offer.id, tpl.id, bg.id);
        });
      });
      combinations.forEach((combo) => {
        const slotCount = multiTemplates[0]?.products ?? 3;
        const comboVehicleFilters = Array.from({ length: slotCount }, (_, i) => {
          const slotId = combo.offerIds[i] ?? offers[i]?.id;
          const offer = offers.find((o) => o.id === slotId);
          return offer ? `${offer.model} ${offer.trim}` : null;
        }).filter(Boolean) as string[];
        if (!matchesMultiLifestyle(bg, comboVehicleFilters)) {
          multiTemplates.forEach((tpl) => {
            excludeBackgroundFromOfferTemplate(combo.id, tpl.id, bg.id);
          });
        }
      });
    });

    setAddBgOpen(false);
  }

  function handleZoomIn() { setZoom((z) => Math.min(z + 0.25, 2)); }
  function handleZoomOut() { setZoom((z) => Math.max(z - 0.25, 0.25)); }

  async function handleOptimize(
    offerId: string,
    templateId: string,
    bgId: string,
    offer: typeof offers[0] | undefined,
    bg: ReturnType<typeof getBackgroundsForTemplate>[0],
    template: typeof templates[0],
  ) {
    const key = `${offerId}_${templateId}_${bgId}`;
    setOptimizing((prev) => new Set(prev).add(key));

    try {
      // Render bg+car off-screen, wrapped in a hard-clipping div at exact
      // template dimensions. Any part of the car placeholder that extends
      // outside the banner bounds is discarded before sending to Flux.
      if (import.meta.env.DEV) console.log("[Optimize] Rendering off-screen for", key);
      const container = document.createElement("div");
      container.style.cssText = "position:fixed;left:0;top:0;z-index:9999;opacity:0.001;pointer-events:none;";
      document.body.appendChild(container);

      const root = createRoot(container);
      // Clipping wrapper ensures the captured image is exactly template.width × template.height
      root.render(
        <div style={{ width: template.width, height: template.height, overflow: "hidden", position: "relative" }}>
          <AdTemplate
            templateId={template.id}
            offer={offer}
            background={bg}
            scale={1}
            forExport
            layerMode="bg-car"
          />
        </div>
      );

      await new Promise<void>((r) => setTimeout(r, 50));
      container.querySelectorAll("img").forEach((img) => {
        img.crossOrigin = "anonymous";
        if (img.getAttribute("loading") === "lazy") {
          img.setAttribute("loading", "eager");
          const src = img.src; img.src = ""; img.src = src;
        }
      });
      await waitForImages(container);
      await new Promise<void>((r) => setTimeout(r, 400));

      if (import.meta.env.DEV) console.log("[Optimize] Capturing PNG via toPng...");
      // Capture the clipping wrapper (first child), not the AdTemplate root
      const el = container.firstElementChild as HTMLElement;
      const imageDataUrl = await toPng(el, { pixelRatio: 1, skipFonts: true, cacheBust: true });
      if (import.meta.env.DEV) console.log("[Optimize] toPng done, raw size:", Math.round(imageDataUrl.length / 1024), "KB");

      root.unmount();
      document.body.removeChild(container);

      // Letterbox extreme aspect ratios (e.g. 4:1 banners) to 16:9 so Flux
      // processes at a ratio it handles well, without distorting the car.
      const pad = await letterboxForAI(imageDataUrl);

      // Compress to JPEG (max 1400px, 85% quality) to stay under Vercel's
      // 4.5 MB request body limit. Full-res PNG of a 2000×500 can exceed it.
      if (import.meta.env.DEV) console.log("[Optimize] Compressing for API...");
      const compressed = await compressForApi(pad.paddedUrl);
      if (import.meta.env.DEV) console.log("[Optimize] Compressed size:", Math.round(compressed.length / 1024), "KB");

      // Send to Replicate via browser-side client
      if (import.meta.env.DEV) console.log("[Optimize] Sending to Replicate...");
      const result = await optimizeImageWithReplicate(compressed);
      if (import.meta.env.DEV) console.log("[Optimize] Replicate result received, cropping...");

      // Crop back to original content area, then scale to exact template dimensions.
      // Stored image is always templateW×templateH so objectFit:cover never zooms.
      const resized = await cropAndResizeResult(result, pad, template.width, template.height);
      setAiResult(key, resized);
      if (import.meta.env.DEV) console.log("[Optimize] Done!");
    } catch (err) {
      console.error("[Optimize] Failed:", err);
    } finally {
      setOptimizing((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  async function handleOptimizeAllOffer(offer: typeof offers[0]) {
    const jobs = singleTemplates.flatMap((template) =>
      getBackgroundsForOfferTemplate(offer.id, template.id).map((bg) => ({ template, bg }))
    );
    await Promise.all(
      jobs.map(({ template, bg }) =>
        handleOptimize(offer.id, template.id, bg.id, offer, bg, template)
      )
    );
  }

  async function handleOptimizeAll(combo: { id: string; offerIds: string[] }, slotOffers: (typeof offers[0] | undefined)[]) {
    // Fire all jobs in parallel for this combination across every template × background
    const jobs = multiTemplates.flatMap((template) =>
      getBackgroundsForOfferTemplate(combo.id, template.id).map((bg) => ({
        template,
        bg,
      }))
    );
    await Promise.all(
      jobs.map(({ template, bg }) =>
        handleOptimize(combo.id, template.id, bg.id, slotOffers[0], bg, template)
      )
    );
  }

  async function exportAllAssets() {
    setExporting(true);
    setExportProgress(0);

    const jobs: Array<{ offer?: typeof offers[0]; offers?: (typeof offers[0] | undefined)[]; template: typeof templates[0]; bg: ReturnType<typeof getBackgroundsForTemplate>[0] }> = [];
    // Single-product offers
    for (const offer of offers) {
      for (const template of singleTemplates) {
        for (const bg of getBackgroundsForOfferTemplate(offer.id, template.id)) {
          jobs.push({ offer, offers: [offer], template, bg });
        }
      }
    }
    // Multi-product combinations
    for (const combo of combinations) {
      const slotOffers = getComboSlotOffers(combo);
      for (const template of multiTemplates) {
        for (const bg of getBackgroundsForOfferTemplate(combo.id, template.id)) {
          jobs.push({ offer: slotOffers[0], offers: slotOffers, template, bg });
        }
      }
    }

    if (jobs.length === 0) { setExporting(false); return; }

    const zip = new JSZip();
    // Keep in viewport but invisible so lazy images load
    const offscreen = document.createElement("div");
    offscreen.style.cssText = "position:fixed;left:0;top:0;z-index:9999;opacity:0.001;pointer-events:none;";
    document.body.appendChild(offscreen);

    try {
      for (let i = 0; i < jobs.length; i++) {
        const { offer, template, bg } = jobs[i];
        const container = document.createElement("div");
        offscreen.appendChild(container);

        const root = createRoot(container);
        const aiKey = `${offer?.id ?? ""}_${template.id}_${bg.id}`;
        const aiResult = aiResults.get(aiKey);

        if (aiResult) {
          // AI composite: Flux bg+car result + UI layer on top
          root.render(
            <div style={{ position: "relative", width: template.width, height: template.height, overflow: "hidden" }}>
              <img
                src={aiResult}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div style={{ position: "absolute", inset: 0 }}>
                <AdTemplate
                  templateId={template.id}
                  offer={offer}
                  offers={jobs[i].offers}
                  background={bg}
                  scale={1}
                  dealerName={project.dealerName}
                  cta={project.ctaText || "Shop Now"}
                  leaseLabel={project.leaseLabel || undefined}
                  finePrint={project.finePrint || undefined}
                  forExport
                  layerMode="ui"
                />
              </div>
            </div>
          );
        } else {
          root.render(
            <AdTemplate
              templateId={template.id}
              offer={offer}
              offers={jobs[i].offers}
              background={bg}
              scale={1}
              dealerName={project.dealerName}
              cta={project.ctaText || "Shop Now"}
              leaseLabel={project.leaseLabel || undefined}
              finePrint={project.finePrint || undefined}
              forExport
            />
          );
        }

        // Let React commit
        await new Promise<void>((r) => setTimeout(r, 50));

        // Force any lazy images to load eagerly
        container.querySelectorAll("img").forEach((img) => {
          if (img.getAttribute("loading") === "lazy") {
            img.setAttribute("loading", "eager");
            const src = img.src;
            img.src = "";
            img.src = src;
          }
        });

        await waitForImages(container);
        // Extra wait for CarImage bounds/canvas
        await new Promise<void>((r) => setTimeout(r, 400));

        const el = container.firstElementChild as HTMLElement;
        let png: string;
        try {
          png = await Promise.race([
            toPng(el, { pixelRatio: 1, skipFonts: true, cacheBust: true }),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error("toPng timeout")), 15000)),
          ]);
        } catch (err) {
          if (import.meta.env.DEV) console.warn(`Export failed for job ${i}:`, err);
          root.unmount();
          offscreen.removeChild(container);
          setExportProgress(Math.round(((i + 1) / jobs.length) * 100));
          continue;
        }

        const folder = offer
          ? `${offer.year}_${offer.make}_${offer.model}_${offer.trim}`.replace(/\s+/g, "_")
          : "Multiple_Offers";
        const file = `${template.id}_${(bg.name || bg.id).replace(/\s+/g, "_")}.png`;
        zip.file(`${folder}/${file}`, png.split(",")[1], { base64: true });

        root.unmount();
        offscreen.removeChild(container);
        setExportProgress(Math.round(((i + 1) / jobs.length) * 100));
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "assets.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      document.body.removeChild(offscreen);
      setExporting(false);
      setExportProgress(0);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white">
        <button
          onClick={toggleSidebar}
          title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${sidebarOpen ? "text-[var(--brand-accent)] bg-[var(--brand-accent)/8]" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}
        >
          <PanelLeft size={15} />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Preview</h1>

        <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 cursor-pointer hover:bg-gray-50 ml-2">
          Group by Offer
          <ChevronDown size={13} className="text-gray-400 ml-1" />
        </div>

        {/* Add Background */}
        <button
          onClick={() => setAddBgOpen(true)}
          className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-white bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] px-3 py-1.5 rounded-full transition"
        >
          <Plus size={13} />
          Add Background
        </button>

        {/* Zoom controls + Export */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-xs text-gray-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={handleZoomIn}
            className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition"
          >
            <ZoomIn size={14} />
          </button>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          <button
            onClick={exportAllAssets}
            disabled={exporting || backgrounds.length === 0}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 rounded-full transition"
          >
            <Download size={13} />
            {exporting ? `${exportProgress}%` : "Export"}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto bg-gray-100">
        {backgrounds.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
            </svg>
            <p className="text-sm">No backgrounds added yet.</p>
            <button onClick={() => onNavigateTo('logos-backgrounds')} className="text-sm font-medium text-[var(--brand-accent)] hover:text-[var(--brand-accent-hover)]">
              Go to Styles →
            </button>
          </div>
        ) : (
          <div
            className="px-8 py-6 origin-top-left"
            style={{
              transform: zoom !== 1 ? `scale(${zoom})` : undefined,
              transformOrigin: "top left",
              minWidth: "max-content",
            }}
          >
            {/* ── Single-product offers ── */}
            {singleTemplates.length > 0 && offers.map((offer) => {
              const hasAssets = singleTemplates.some(
                (t) => getBackgroundsForOfferTemplate(offer.id, t.id).length > 0
              );
              if (!hasAssets) return null;
              // Derive optimize-all state for this offer
              const offerAllKeys = singleTemplates.flatMap((t) =>
                getBackgroundsForOfferTemplate(offer.id, t.id).map((bg) => `${offer.id}_${t.id}_${bg.id}`)
              );
              const isOfferOptimizing = offerAllKeys.some((k) => optimizing.has(k));
              const offerHasAny = offerAllKeys.length > 0;
              const offerAllDone = offerAllKeys.every((k) => aiResults.has(k));

              return (
                <div key={offer.id} className="mb-12">
                  {/* Offer header */}
                  <div className="flex items-center gap-3 mb-5">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 accent-[#473bab]" />
                    <div className="relative w-10 h-7">
                      <img src={offer.image} alt={offer.model} className="absolute inset-0 w-full h-full object-contain"  />
                    </div>
                    <h2 className="text-sm font-semibold text-gray-900">
                      {offer.year} {offer.make} {offer.model} {offer.trim}
                    </h2>
                    <SlidersHorizontal size={14} className="text-gray-400" />

                    {/* Optimize all button */}
                    {offerHasAny && (
                      isOfferOptimizing ? (
                        <div className="flex items-center gap-1.5 border border-[var(--brand-accent)/20] bg-[var(--brand-accent)/8] rounded-full px-3 py-1.5 text-xs font-medium text-[var(--brand-accent)] ml-1">
                          <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          Optimizing…
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOptimizeAllOffer(offer)}
                          className="flex items-center gap-1.5 border border-[var(--brand-accent)/20] bg-[var(--brand-accent)/8] hover:bg-[var(--brand-accent)]/10 rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--brand-accent)] transition ml-1"
                        >
                          <Sparkles size={12} />
                          {offerAllDone ? "Re-optimize all" : "Optimize all"}
                        </button>
                      )
                    )}
                  </div>
                  {/* Templates */}
                  <div className="space-y-5">
                    {singleTemplates.map((template) => {
                      const bgs = getBackgroundsForOfferTemplate(offer.id, template.id);
                      if (bgs.length === 0) return null;
                      const scale = thumbnailScale(template.width, template.height);
                      const scaledW = Math.round(template.width * scale);
                      const scaledH = Math.round(template.height * scale);
                      // Per-template optimize-all state
                      const tplKeys = bgs.map((bg) => `${offer.id}_${template.id}_${bg.id}`);
                      const isTplOptimizing = tplKeys.some((k) => optimizing.has(k));
                      const tplAllDone = tplKeys.every((k) => aiResults.has(k));
                      return (
                        <div key={template.id} className="group/tpl">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-xs font-medium text-gray-500">{template.name}</p>
                            {isTplOptimizing ? (
                              <div className="flex items-center gap-1 text-xs font-medium text-[var(--brand-accent)] opacity-0 group-hover/tpl:opacity-100 transition-opacity">
                                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                Optimizing…
                              </div>
                            ) : (
                              <button
                                onClick={() => Promise.all(bgs.map((bg) => handleOptimize(offer.id, template.id, bg.id, offer, bg, template)))}
                                className="flex items-center gap-1 text-xs font-semibold text-[var(--brand-accent)] hover:text-[var(--brand-accent-hover)] opacity-0 group-hover/tpl:opacity-100 transition-opacity"
                              >
                                <Sparkles size={11} />
                                {tplAllDone ? "Re-optimize all" : "Optimize all"}
                              </button>
                            )}
                          </div>
                          <div className="flex items-start gap-3">
                            {bgs.map((bg) => {
                              const aiKey = `${offer.id}_${template.id}_${bg.id}`;
                              const aiResult = aiResults.get(aiKey);
                              const isOptimizing = optimizing.has(aiKey);
                              return (
                                <div key={bg.id} className="relative group overflow-hidden shrink-0">
                                  {aiResult ? (
                                    <div style={{ width: scaledW, height: scaledH, position: "relative", overflow: "hidden" }}>
                                      <img src={aiResult} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                                      <div style={{ position: "absolute", inset: 0 }}>
                                        <AdTemplate projectId={id} templateId={template.id} offer={offer} background={bg} scale={scale} dealerName={project.dealerName} cta={project.ctaText || "Shop Now"} leaseLabel={project.leaseLabel || undefined} finePrint={project.finePrint || undefined} layerMode="ui" />
                                      </div>
                                    </div>
                                  ) : (
                                    <AdTemplate projectId={id} templateId={template.id} offer={offer} background={bg} scale={scale} dealerName={project.dealerName} cta={project.ctaText || "Shop Now"} leaseLabel={project.leaseLabel || undefined} finePrint={project.finePrint || undefined} />
                                  )}
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-10">
                                    <div className="flex items-center gap-2">
                                      <button onClick={() => setLightbox({ offer, offers: [offer], template, bg, aiResult })} className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition shadow">
                                        <Eye size={14} className="text-gray-700" />
                                      </button>
                                      <button onClick={() => excludeBackgroundFromOfferTemplate(offer.id, template.id, bg.id)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition shadow">
                                        <Trash2 size={14} className="text-gray-700" />
                                      </button>
                                      <button className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition shadow">
                                        <Pencil size={14} className="text-gray-700" />
                                      </button>
                                    </div>
                                    {isOptimizing ? (
                                      <div className="flex items-center gap-1.5 bg-white/90 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700">
                                        <svg className="animate-spin w-3.5 h-3.5 text-[var(--brand-accent)]" viewBox="0 0 24 24" fill="none">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                        Optimizing…
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <button onClick={() => handleOptimize(offer.id, template.id, bg.id, offer, bg, template)} className="flex items-center gap-1 bg-white/90 hover:bg-white rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--brand-accent)] transition shadow">
                                          <Sparkles size={12} />
                                          {aiResult ? "Re-optimize" : "Optimize"}
                                        </button>
                                        {aiResult && (
                                          <button onClick={() => clearAiResult(aiKey)} className="flex items-center gap-1 bg-white/90 hover:bg-white rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 transition shadow">
                                            <RotateCcw size={12} />
                                            Reset
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* ── Multi-product combinations ── */}
            {multiTemplates.length > 0 && combinations.map((combo) => {
              const slotOffers = getComboSlotOffers(combo);
              const hasAssets = multiTemplates.some(
                (t) => getBackgroundsForOfferTemplate(combo.id, t.id).length > 0
              );
              if (!hasAssets) return null;
              // Derive optimize-all state for this combo
              const comboAllKeys = multiTemplates.flatMap((t) =>
                getBackgroundsForOfferTemplate(combo.id, t.id).map((bg) => `${combo.id}_${t.id}_${bg.id}`)
              );
              const isComboOptimizing = comboAllKeys.some((k) => optimizing.has(k));
              const comboHasAny = comboAllKeys.length > 0;
              const comboAllDone = comboAllKeys.every((k) => aiResults.has(k));

              return (
                <div key={combo.id} className="mb-12">
                  {/* Combination header — offer slot thumbnails + Optimize all */}
                  <div className="flex items-center gap-3 mb-5">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 accent-[#473bab]" />
                    <div className="flex items-center gap-1">
                      {slotOffers.map((offer, i) => (
                        <OfferSlotThumbnail
                          key={i}
                          slotIndex={i}
                          offer={offer}
                          allOffers={offers}
                          onSelect={(offerId) => {
                            setCombinationOfferAtSlot(combo.id, i, offerId);
                            reEvaluateMultiLifestyleForCombo(
                              combo.id, i, offerId, offers,
                              multiTemplates.map((t) => t.id),
                              multiTemplates[0]?.products ?? 3
                            );
                          }}
                        />
                      ))}
                    </div>
                    <h2 className="text-sm font-semibold text-gray-900">Multiple offers</h2>
                    <SlidersHorizontal size={14} className="text-gray-400" />

                    {/* Optimize all button */}
                    {comboHasAny && (
                      isComboOptimizing ? (
                        <div className="flex items-center gap-1.5 border border-[var(--brand-accent)/20] bg-[var(--brand-accent)/8] rounded-full px-3 py-1.5 text-xs font-medium text-[var(--brand-accent)] ml-1">
                          <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          Optimizing…
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOptimizeAll(combo, slotOffers)}
                          className="flex items-center gap-1.5 border border-[var(--brand-accent)/20] bg-[var(--brand-accent)/8] hover:bg-[var(--brand-accent)]/10 rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--brand-accent)] transition ml-1"
                        >
                          <Sparkles size={12} />
                          {comboAllDone ? "Re-optimize all" : "Optimize all"}
                        </button>
                      )
                    )}
                  </div>
                  {/* Templates */}
                  <div className="space-y-5">
                    {multiTemplates.map((template) => {
                      const bgs = getBackgroundsForOfferTemplate(combo.id, template.id);
                      if (bgs.length === 0) return null;
                      const scale = thumbnailScale(template.width, template.height);
                      const scaledW = Math.round(template.width * scale);
                      const scaledH = Math.round(template.height * scale);
                      // Per-template optimize-all state
                      const tplKeys = bgs.map((bg) => `${combo.id}_${template.id}_${bg.id}`);
                      const isTplOptimizing = tplKeys.some((k) => optimizing.has(k));
                      const tplAllDone = tplKeys.every((k) => aiResults.has(k));
                      return (
                        <div key={template.id} className="group/tpl">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-xs font-medium text-gray-500">{template.name}</p>
                            {isTplOptimizing ? (
                              <div className="flex items-center gap-1 text-xs font-medium text-[var(--brand-accent)] opacity-0 group-hover/tpl:opacity-100 transition-opacity">
                                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                Optimizing…
                              </div>
                            ) : (
                              <button
                                onClick={() => Promise.all(bgs.map((bg) => handleOptimize(combo.id, template.id, bg.id, slotOffers[0], bg, template)))}
                                className="flex items-center gap-1 text-xs font-semibold text-[var(--brand-accent)] hover:text-[var(--brand-accent-hover)] opacity-0 group-hover/tpl:opacity-100 transition-opacity"
                              >
                                <Sparkles size={11} />
                                {tplAllDone ? "Re-optimize all" : "Optimize all"}
                              </button>
                            )}
                          </div>
                          <KeyMessageInlineInputs templateId={template.id} white />
                          <div className="flex items-start gap-3">
                            {bgs.map((bg) => {
                              const aiKey = `${combo.id}_${template.id}_${bg.id}`;
                              const aiResult = aiResults.get(aiKey);
                              const isOptimizing = optimizing.has(aiKey);
                              return (
                                <div key={bg.id} className="relative group overflow-hidden shrink-0">
                                  {aiResult ? (
                                    <div style={{ width: scaledW, height: scaledH, position: "relative", overflow: "hidden" }}>
                                      <img src={aiResult} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                                      <div style={{ position: "absolute", inset: 0 }}>
                                        <AdTemplate projectId={id} templateId={template.id} offer={slotOffers[0]} offers={slotOffers} background={bg} scale={scale} dealerName={project.dealerName} cta={project.ctaText || "Shop Now"} leaseLabel={project.leaseLabel || undefined} finePrint={project.finePrint || undefined} layerMode="ui" customFields={customTemplateFields[template.id]} />
                                      </div>
                                    </div>
                                  ) : (
                                    <AdTemplate projectId={id} templateId={template.id} offer={slotOffers[0]} offers={slotOffers} background={bg} scale={scale} dealerName={project.dealerName} cta={project.ctaText || "Shop Now"} leaseLabel={project.leaseLabel || undefined} finePrint={project.finePrint || undefined} customFields={customTemplateFields[template.id]} />
                                  )}
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-10">
                                    <div className="flex items-center gap-2">
                                      <button onClick={() => setLightbox({ offer: slotOffers[0], offers: slotOffers, template, bg, aiResult })} className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition shadow">
                                        <Eye size={14} className="text-gray-700" />
                                      </button>
                                      <button onClick={() => excludeBackgroundFromOfferTemplate(combo.id, template.id, bg.id)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition shadow">
                                        <Trash2 size={14} className="text-gray-700" />
                                      </button>
                                      <button className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition shadow">
                                        <Pencil size={14} className="text-gray-700" />
                                      </button>
                                    </div>
                                    {isOptimizing ? (
                                      <div className="flex items-center gap-1.5 bg-white/90 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700">
                                        <svg className="animate-spin w-3.5 h-3.5 text-[var(--brand-accent)]" viewBox="0 0 24 24" fill="none">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                        Optimizing…
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <button onClick={() => handleOptimize(combo.id, template.id, bg.id, slotOffers[0], bg, template)} className="flex items-center gap-1 bg-white/90 hover:bg-white rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--brand-accent)] transition shadow">
                                          <Sparkles size={12} />
                                          {aiResult ? "Re-optimize" : "Optimize"}
                                        </button>
                                        {aiResult && (
                                          <button onClick={() => clearAiResult(aiKey)} className="flex items-center gap-1 bg-white/90 hover:bg-white rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 transition shadow">
                                            <RotateCcw size={12} />
                                            Reset
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <SelectBackgroundDialog
        open={addBgOpen}
        onClose={() => setAddBgOpen(false)}
        onAdd={handleAddBackgrounds}
      />

      {/* Footer nav */}
      <div className="flex items-center justify-between px-6 py-3 bg-white">
        <button
          onClick={() => onNavigateTo('logos-backgrounds')}
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--brand-accent)] border border-[var(--brand-accent)/30] rounded-full px-4 py-1.5 hover:bg-[var(--brand-accent)/5] transition"
        >
          <ChevronLeft size={14} />
          Styles
        </button>
        {(() => {
          const singleAssets = singleTemplates.reduce(
            (sum, t) => sum + offers.reduce((oSum, o) => oSum + getBackgroundsForOfferTemplate(o.id, t.id).length, 0),
            0
          );
          const multiAssets = multiTemplates.reduce(
            (sum, t) => sum + combinations.reduce((cSum, c) => cSum + getBackgroundsForOfferTemplate(c.id, t.id).length, 0),
            0
          );
          const totalAssets = singleAssets + multiAssets;
          return (
            <button className="flex items-center gap-2 text-sm font-semibold text-white bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] px-5 py-2 rounded-full transition">
              Generate Assets
              {totalAssets > 0 && (
                <span className="flex items-center justify-center bg-white text-[var(--brand-accent)] text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5">
                  {totalAssets}
                </span>
              )}
              <ChevronRight size={14} />
            </button>
          );
        })()}
      </div>

      {/* Lightbox */}
      {lightbox && (() => {
        const { offer, offers: lbOffers, template, bg, aiResult: lbAiResult } = lightbox;
        const maxW = 1200, maxH = 720;
        const scale = Math.min(maxW / template.width, maxH / template.height);
        const scaledW = Math.round(template.width * scale);
        const scaledH = Math.round(template.height * scale);
        return (
          <div
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-8"
            onClick={() => setLightbox(null)}
          >
            <div onClick={(e) => e.stopPropagation()} style={{ width: scaledW, height: scaledH, position: "relative", overflow: "hidden" }}>
              {lbAiResult ? (
                <>
                  <img src={lbAiResult} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", inset: 0 }}>
                    <AdTemplate projectId={id} templateId={template.id} offer={offer} offers={lbOffers} background={bg} scale={scale} dealerName={project.dealerName} cta={project.ctaText || "Shop Now"} leaseLabel={project.leaseLabel || undefined} finePrint={project.finePrint || undefined} layerMode="ui" />
                  </div>
                </>
              ) : (
                <AdTemplate projectId={id} templateId={template.id} offer={offer} offers={lbOffers} background={bg} scale={scale} dealerName={project.dealerName} cta={project.ctaText || "Shop Now"} leaseLabel={project.leaseLabel || undefined} finePrint={project.finePrint || undefined} />
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
