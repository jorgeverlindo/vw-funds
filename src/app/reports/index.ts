export { FundUtilizationReport }   from './generators/FundUtilizationReport';
export { FundAllocationReport }    from './generators/FundAllocationReport';
export { FundUsageReport }         from './generators/FundUsageReport';
export { ClaimSubmissionReport }   from './generators/ClaimSubmissionReport';
export { PreApprovalSummaryReport } from './generators/PreApprovalSummaryReport';
export { PaymentProcessingReport } from './generators/PaymentProcessingReport';

import { FundUtilizationReport }    from './generators/FundUtilizationReport';
import { FundAllocationReport }     from './generators/FundAllocationReport';
import { FundUsageReport }          from './generators/FundUsageReport';
import { ClaimSubmissionReport }    from './generators/ClaimSubmissionReport';
import { PreApprovalSummaryReport } from './generators/PreApprovalSummaryReport';
import { PaymentProcessingReport }  from './generators/PaymentProcessingReport';

import type { ComponentType } from 'react';

/** Maps the display name used in the menu to the generator component + filename. */
export const REPORT_MAP: Record<string, { component: ComponentType; filename: string }> = {
  'Fund Utilization Report':    { component: FundUtilizationReport,    filename: 'vw-fund-utilization-report.pdf' },
  'Fund Allocation Report':     { component: FundAllocationReport,     filename: 'vw-fund-allocation-report.pdf' },
  'Fund Usage Report':          { component: FundUsageReport,          filename: 'vw-fund-usage-report.pdf' },
  'Claim Submission Report':    { component: ClaimSubmissionReport,    filename: 'vw-claim-submission-report.pdf' },
  'Pre-approval Summary Report':{ component: PreApprovalSummaryReport, filename: 'vw-preapproval-summary-report.pdf' },
  'Payment Processing Report':  { component: PaymentProcessingReport,  filename: 'vw-payment-processing-report.pdf' },
};

const PAGE_W = 820;
const PAGE_H = 1100;
const SCALE  = 2; // retina capture — sliced back to PAGE dimensions when added to jsPDF

/**
 * Renders a report DOM element to PDF and triggers a browser download.
 *
 * Implementation notes:
 *   - html2pdf.js 0.14.0 has a breaking change where opt.jsPDF must be a
 *     pre-constructed jsPDF instance (it calls .context2d directly on it).
 *     Passing a plain config object silently throws and no PDF is generated.
 *   - We bypass html2pdf entirely and use html2canvas + jsPDF directly,
 *     which gives full control over multi-page slicing.
 *   - Each report page is 820 × 1100 px. We capture the full tall element
 *     at SCALE=2, then slice it into 1100px chunks for each PDF page.
 */
export async function downloadReport(reportName: string, element: HTMLElement): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const filename = REPORT_MAP[reportName]?.filename ?? 'report.pdf';

  // Wait for fonts loaded in this document before capturing
  await document.fonts.ready;

  const canvas = await html2canvas(element, {
    scale:       SCALE,
    useCORS:     true,
    allowTaint:  true,
    backgroundColor: '#ffffff',
    logging:     false,
    width:       PAGE_W,
    windowWidth: PAGE_W,
  });

  const pdf = new jsPDF({ unit: 'px', format: [PAGE_W, PAGE_H], orientation: 'portrait' });

  // Slice the tall canvas into PAGE_H chunks, one per PDF page
  const canvasPageH = PAGE_H * SCALE;
  const totalPages  = Math.ceil(canvas.height / canvasPageH);

  for (let i = 0; i < totalPages; i++) {
    if (i > 0) pdf.addPage([PAGE_W, PAGE_H], 'portrait');

    const slice = document.createElement('canvas');
    slice.width  = canvas.width;
    slice.height = canvasPageH;
    const ctx = slice.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, -(i * canvasPageH));

    pdf.addImage(slice.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, PAGE_W, PAGE_H);
  }

  pdf.save(filename);
}
