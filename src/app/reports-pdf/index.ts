/**
 * @react-pdf/renderer PDF generator — react-pdf imports are LAZY (inside downloadReport).
 *
 * @react-pdf/renderer registers a custom React reconciler at module-init time.
 * If it is statically imported at the top level, Vite's HMR module graph causes a
 * ReferenceError ("renderContainer is not defined") that crashes the component tree
 * before any button click. Keeping react-pdf imports inside the async function
 * avoids the issue entirely and also keeps the initial JS bundle lighter.
 */
import { createElement } from 'react';

/** Keys kept as a plain object so useReportDownload can validate names synchronously. */
export const REPORT_MAP: Record<string, { filename: string }> = {
  'Fund Utilization Report':     { filename: 'vw-fund-utilization-report.pdf' },
  'Fund Allocation Report':      { filename: 'vw-fund-allocation-report.pdf' },
  'Fund Usage Report':           { filename: 'vw-fund-usage-report.pdf' },
  'Claim Submission Report':     { filename: 'vw-claim-submission-report.pdf' },
  'Pre-approval Summary Report': { filename: 'vw-preapproval-summary-report.pdf' },
  'Payment Processing Report':   { filename: 'vw-payment-processing-report.pdf' },
};

/** Lazy loaders — each returns the named export that is a react-pdf Document component. */
const LOADERS: Record<string, () => Promise<React.ComponentType>> = {
  'Fund Utilization Report':     () => import('./generators/FundUtilizationReport').then(m => m.FundUtilizationReport),
  'Fund Allocation Report':      () => import('./generators/FundAllocationReport').then(m => m.FundAllocationReport),
  'Fund Usage Report':           () => import('./generators/FundUsageReport').then(m => m.FundUsageReport),
  'Claim Submission Report':     () => import('./generators/ClaimSubmissionReport').then(m => m.ClaimSubmissionReport),
  'Pre-approval Summary Report': () => import('./generators/PreApprovalSummaryReport').then(m => m.PreApprovalSummaryReport),
  'Payment Processing Report':   () => import('./generators/PaymentProcessingReport').then(m => m.PaymentProcessingReport),
};

export async function downloadReport(reportName: string): Promise<void> {
  const entry = REPORT_MAP[reportName];
  if (!entry) throw new Error(`Unknown report: "${reportName}"`);

  // 1. Load fonts first — must be registered before pdf() is called.
  //    fonts.ts statically imports @react-pdf/renderer, so it also initialises the renderer.
  await import('./fonts');

  // 2. Load renderer + specific generator in parallel (renderer already cached from step 1).
  const [{ pdf }, Component] = await Promise.all([
    import('@react-pdf/renderer').then(m => ({ pdf: m.pdf })),
    LOADERS[reportName](),
  ]);

  const blob = await pdf(createElement(Component)).toBlob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = entry.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
