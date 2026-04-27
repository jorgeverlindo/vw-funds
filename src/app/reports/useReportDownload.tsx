import { useState, useCallback } from 'react';
import { REPORT_MAP, downloadReport } from './index';

interface UseReportDownloadReturn {
  triggerDownload:   (reportName: string) => void;
  isDownloading:     boolean;
  downloadingReport: string | null;
}

/**
 * Hook that manages download state and delegates rendering + PDF generation
 * to `downloadReport`, which owns its own off-screen container lifecycle.
 */
export function useReportDownload(): UseReportDownloadReturn {
  const [isDownloading,     setIsDownloading]     = useState(false);
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);

  const triggerDownload = useCallback((reportName: string) => {
    if (isDownloading) return;
    if (!REPORT_MAP[reportName]) {
      console.warn(`[useReportDownload] Unknown report: "${reportName}"`);
      return;
    }

    setIsDownloading(true);
    setDownloadingReport(reportName);

    downloadReport(reportName)
      .catch(err => console.error('[useReportDownload] PDF failed:', err))
      .finally(() => {
        setIsDownloading(false);
        setDownloadingReport(null);
      });
  }, [isDownloading]);

  return { triggerDownload, isDownloading, downloadingReport };
}
