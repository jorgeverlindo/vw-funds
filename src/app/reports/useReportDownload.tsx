import { useState, useRef, useEffect, useCallback, createElement } from 'react';
import { createPortal } from 'react-dom';
import { REPORT_MAP, downloadReport } from './index';

interface UseReportDownloadReturn {
  triggerDownload:    (reportName: string) => void;
  renderContainer:    React.ReactNode;
  isDownloading:      boolean;
  downloadingReport:  string | null;
}

/**
 * Hook that handles off-screen rendering + html2pdf for report downloads.
 *
 * Design notes:
 *  - Container is position:fixed left:-9999px — off-screen but fully visible to
 *    html2canvas (visibility:hidden would cause blank PDFs).
 *  - We use setTimeout(200) instead of rAF so React 18 concurrent-mode has time
 *    to commit the portal into the DOM before html2canvas scans it.
 *  - Container element lives in state (not a ref) so renderContainer recomputes
 *    correctly when downloadingReport changes.
 */
export function useReportDownload(): UseReportDownloadReturn {
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);
  const [isDownloading,     setIsDownloading]     = useState(false);
  const [container,         setContainer]         = useState<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Create the off-screen container once on mount.
  // NO visibility:hidden — html2canvas must be able to "see" the content.
  useEffect(() => {
    const div = document.createElement('div');
    div.style.cssText = [
      'position:fixed',
      'left:-9999px',
      'top:0',
      'width:820px',
      'background:#ffffff',
      'pointer-events:none',
    ].join(';');
    document.body.appendChild(div);
    setContainer(div);
    return () => {
      document.body.removeChild(div);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  // Once downloadingReport + container are both set, wait 200 ms so React
  // finishes committing the portal, then invoke html2pdf.
  useEffect(() => {
    if (!downloadingReport || !container) return;

    timerRef.current = setTimeout(async () => {
      try {
        await downloadReport(downloadingReport, container);
      } catch (err) {
        console.error('[useReportDownload] PDF generation failed:', err);
      } finally {
        setDownloadingReport(null);
        setIsDownloading(false);
      }
    }, 200);

    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, [downloadingReport, container]);

  const triggerDownload = useCallback((reportName: string) => {
    if (isDownloading) return;
    if (!REPORT_MAP[reportName]) {
      console.warn(`[useReportDownload] Unknown report: "${reportName}"`);
      return;
    }
    setIsDownloading(true);
    setDownloadingReport(reportName);
  }, [isDownloading]);

  const renderContainer =
    container && downloadingReport
      ? createPortal(createElement(REPORT_MAP[downloadingReport].component), container)
      : null;

  return { triggerDownload, renderContainer, isDownloading, downloadingReport };
}
