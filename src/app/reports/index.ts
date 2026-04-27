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

/**
 * Renders a report component to PDF and triggers a browser download.
 *
 * Architecture:
 *   - Creates its own isolated off-screen container (position:absolute top:-99999px)
 *     so html2canvas sees a fully-laid-out element at x=0, y=negative.
 *   - Uses createRoot + flushSync for a guaranteed synchronous DOM commit —
 *     no timers, no async React reconciliation guesswork.
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
    root.unmount();
    if (document.body.contains(wrapper)) document.body.removeChild(wrapper);
  }
}
