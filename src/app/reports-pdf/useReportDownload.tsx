import { useState, useCallback } from 'react';
import { REPORT_MAP, generateReport } from './index';
import type { MonitorState } from '../components/ActivityMonitor';

interface UseReportDownloadReturn {
  triggerDownload:   (reportName: string) => void;
  isDownloading:     boolean;
  downloadingReport: string | null;
  monitor:           MonitorState | null;
  closeMonitor:      () => void;
}

export function useReportDownload(): UseReportDownloadReturn {
  const [monitor, setMonitor] = useState<MonitorState | null>(null);

  const isDownloading     = monitor?.stage === 'preparing';
  const downloadingReport = isDownloading ? monitor?.reportName ?? null : null;

  const closeMonitor = useCallback(() => {
    setMonitor(prev => {
      if (prev?.blobUrl) URL.revokeObjectURL(prev.blobUrl);
      return null;
    });
  }, []);

  const triggerDownload = useCallback((reportName: string) => {
    if (isDownloading) return;
    if (!REPORT_MAP[reportName]) {
      console.warn(`[useReportDownload] Unknown report: "${reportName}"`);
      return;
    }

    // Revoke any previous blob URL
    setMonitor(prev => {
      if (prev?.blobUrl) URL.revokeObjectURL(prev.blobUrl);
      return {
        stage:       'preparing',
        reportName,
        displayName: `${reportName}.pdf`,
        blobUrl:     null,
      };
    });

    generateReport(reportName)
      .then(({ url }) => {
        setMonitor(prev => prev ? { ...prev, stage: 'complete', blobUrl: url } : null);
      })
      .catch(err => {
        console.error('[useReportDownload] PDF failed:', err);
        setMonitor(prev => prev ? { ...prev, stage: 'error' } : null);
      });
  }, [isDownloading]);

  return { triggerDownload, isDownloading, downloadingReport, monitor, closeMonitor };
}
