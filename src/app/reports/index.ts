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

/**
 * Renders a report DOM element to PDF and triggers a browser download.
 * `element` must already be present in the document (can be off-screen).
 */
export async function downloadReport(reportName: string, element: HTMLElement): Promise<void> {
  // Dynamic import keeps html2pdf out of the initial bundle
  const html2pdf = (await import('html2pdf.js')).default;

  const entry = REPORT_MAP[reportName];
  const filename = entry?.filename ?? 'report.pdf';

  await html2pdf()
    .set({
      margin:      0,
      filename,
      image:       { type: 'jpeg', quality: 0.96 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF:       { unit: 'px', format: [820, 1100], orientation: 'portrait', hotfixes: ['px_scaling'] },
    })
    .from(element)
    .save();
}
