import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';

export { FundUtilizationReport }    from './generators/FundUtilizationReport';
export { FundAllocationReport }     from './generators/FundAllocationReport';
export { FundUsageReport }          from './generators/FundUsageReport';
export { ClaimSubmissionReport }    from './generators/ClaimSubmissionReport';
export { PreApprovalSummaryReport } from './generators/PreApprovalSummaryReport';
export { PaymentProcessingReport }  from './generators/PaymentProcessingReport';

import { FundUtilizationReport }    from './generators/FundUtilizationReport';
import { FundAllocationReport }     from './generators/FundAllocationReport';
import { FundUsageReport }          from './generators/FundUsageReport';
import { ClaimSubmissionReport }    from './generators/ClaimSubmissionReport';
import { PreApprovalSummaryReport } from './generators/PreApprovalSummaryReport';
import { PaymentProcessingReport }  from './generators/PaymentProcessingReport';

import type { ComponentType } from 'react';

/** Maps the display name used in the menu to the generator component + filename. */
export const REPORT_MAP: Record<string, { component: ComponentType; filename: string }> = {
  'Fund Utilization Report':     { component: FundUtilizationReport,    filename: 'vw-fund-utilization-report.pdf' },
  'Fund Allocation Report':      { component: FundAllocationReport,     filename: 'vw-fund-allocation-report.pdf' },
  'Fund Usage Report':           { component: FundUsageReport,          filename: 'vw-fund-usage-report.pdf' },
  'Claim Submission Report':     { component: ClaimSubmissionReport,    filename: 'vw-claim-submission-report.pdf' },
  'Pre-approval Summary Report': { component: PreApprovalSummaryReport, filename: 'vw-preapproval-summary-report.pdf' },
  'Payment Processing Report':   { component: PaymentProcessingReport,  filename: 'vw-payment-processing-report.pdf' },
};

const PAGE_W = 820;
const PAGE_H = 1100;
const SCALE  = 2;

// Regex that matches any oklch() token — used to sanitise computed styles.
const OKLCH_RE = /oklch\([^)]*\)/g;

/**
 * Replaces every oklch() occurrence in a CSS value string with a safe
 * rgba(0,0,0,0) fallback.  Called only when the string actually contains
 * "oklch" so hot-path callers can short-circuit cheaply.
 */
function stripOklch(v: string): string {
  return v.replace(OKLCH_RE, 'rgba(0,0,0,0)');
}

/**
 * Wraps window.getComputedStyle so that every property access (both
 * element["color"] style and getPropertyValue("color") style) returns a
 * value that html2canvas 1.4.x can parse.
 *
 * Tailwind v4 emits oklch() for ALL CSS colors — including custom
 * properties, SVG fill/stroke, box-shadow, outline-color, etc. — and
 * html2canvas 1.4.x throws an Error on any oklch() token it encounters
 * while building its internal style map.  onclone-based inline-style
 * overrides only fix properties we explicitly enumerate; this proxy is a
 * catch-all that intercepts every possible property access.
 *
 * The patch is installed immediately before html2canvas() is called and
 * removed in the finally block so it never leaks outside this function.
 */
function patchGetComputedStyle(): () => void {
  const orig = window.getComputedStyle;

  (window as unknown as Record<string, unknown>).getComputedStyle =
    function patchedGCS(el: Element, pseudo?: string | null) {
      const cs = orig.call(window, el, pseudo);
      return new Proxy(cs, {
        get(t: CSSStyleDeclaration, p: string | symbol) {
          // Intercept getPropertyValue() calls (html2canvas uses both access patterns)
          if (p === 'getPropertyValue') {
            return (name: string) => {
              const v = t.getPropertyValue(name);
              return typeof v === 'string' && v.includes('oklch') ? stripOklch(v) : v;
            };
          }
          const v = (t as Record<string | symbol, unknown>)[p];
          if (typeof v === 'string' && v.includes('oklch')) return stripOklch(v);
          if (typeof v === 'function') return v.bind(t);
          return v;
        },
      });
    };

  // Return a restore function
  return () => { (window as unknown as Record<string, unknown>).getComputedStyle = orig; };
}

/**
 * Renders a report component to PDF and triggers a browser download.
 *
 * Architecture:
 *   - Creates its own isolated off-screen container (position:absolute top:-99999px)
 *     so html2canvas sees a fully-laid-out element at x=0, y=negative.
 *   - Uses createRoot + flushSync for a guaranteed synchronous DOM commit —
 *     no timers, no async React reconciliation guesswork.
 *   - Monkey-patches window.getComputedStyle for the duration of the html2canvas
 *     call to neutralise oklch() values that html2canvas 1.4.x cannot parse.
 *   - html2canvas + jsPDF are dynamically imported (lazy chunks).
 *   - After capture the container is unmounted and removed.
 */
export async function downloadReport(reportName: string): Promise<void> {
  const entry = REPORT_MAP[reportName];
  if (!entry) throw new Error(`Unknown report: "${reportName}"`);

  // ── 1. Create an off-screen container ──────────────────────────────────────
  //   position:absolute at top:-99999px keeps it out of view but gives
  //   html2canvas a normal document-relative x=0, so no negative-offset canvas.
  const wrapper = document.createElement('div');
  wrapper.style.cssText = [
    'position:absolute',
    'top:-99999px',
    'left:0',
    'width:820px',
    'background:#ffffff',
    'pointer-events:none',
    'overflow:visible',
  ].join(';');
  document.body.appendChild(wrapper);

  const root = createRoot(wrapper);
  let restoreGCS: (() => void) | null = null;

  try {
    // ── 2. Render synchronously ─────────────────────────────────────────────
    //   flushSync commits the full React tree to the DOM before the next line
    //   executes — no timers needed.
    flushSync(() => {
      root.render(createElement(entry.component));
    });

    // ── 3. Wait for fonts ───────────────────────────────────────────────────
    await document.fonts.ready;

    // ── 4. Capture ──────────────────────────────────────────────────────────
    const { default: html2canvas } = await import('html2canvas');

    // Install the getComputedStyle patch RIGHT before calling html2canvas so
    // it is active for the entire synchronous parse phase inside html2canvas.
    restoreGCS = patchGetComputedStyle();

    const canvas = await html2canvas(wrapper, {
      scale:           SCALE,
      useCORS:         true,
      allowTaint:      true,
      backgroundColor: '#ffffff',
      logging:         false,
      width:           PAGE_W,
      windowWidth:     PAGE_W,
      scrollX:         0,
      scrollY:         0,
    });

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error('html2canvas returned an empty canvas — report may not have rendered.');
    }

    // ── 5. Build PDF (one slice per 1100 px page) ───────────────────────────
    const { jsPDF } = await import('jspdf');
    const pdf        = new jsPDF({ unit: 'px', format: [PAGE_W, PAGE_H], orientation: 'portrait' });
    const canvasPageH = PAGE_H * SCALE;
    const totalPages  = Math.ceil(canvas.height / canvasPageH);

    for (let i = 0; i < totalPages; i++) {
      if (i > 0) pdf.addPage();

      const slice  = document.createElement('canvas');
      slice.width  = canvas.width;
      slice.height = canvasPageH;
      const ctx    = slice.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, -(i * canvasPageH));

      pdf.addImage(slice.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, PAGE_W, PAGE_H);
    }

    pdf.save(entry.filename);

  } finally {
    // ── 6. Always clean up ──────────────────────────────────────────────────
    restoreGCS?.();   // un-patch getComputedStyle before anything else touches the DOM
    root.unmount();
    if (document.body.contains(wrapper)) document.body.removeChild(wrapper);
  }
}
