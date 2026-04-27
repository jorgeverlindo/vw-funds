import { useState, useRef, useEffect, useCallback, createElement } from 'react';
import { createPortal } from 'react-dom';
import { REPORT_MAP, downloadReport } from './index';

interface UseReportDownloadReturn {
  /** Call this to kick off a PDF download for the named report. */
  triggerDownload: (reportName: string) => void;
  /** Render this somewhere in your JSX tree — it mounts the hidden render container. */
  renderContainer: React.ReactNode;
  /** True while the download is in progress. */
  isDownloading: boolean;
  /** The report currently being downloaded (null when idle). */
  downloadingReport: string | null;
}

/**
 * Hook that handles off-screen rendering + html2pdf for report downloads.
 *
 * Usage:
 *   const { triggerDownload, renderContainer } = useReportDownload();
 *   // include `renderContainer` anywhere in your JSX (it's invisible)
 *   // call triggerDownload('Fund Utilization Report') on button click
 */
export function useReportDownload(): UseReportDownloadReturn {
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  // Keep the container element in state so renderContainer re-computes correctly
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  // Create the hidden off-screen container once on mount
  useEffect(() => {
    const div = document.createElement('div');
    div.style.cssText = [
      'position:fixed',
      'left:-9999px',
      'top:0',
      'width:820px',
      'background:white',
      'z-index:-1',
      'pointer-events:none',
      'visibility:hidden',
    ].join(';');
    document.body.appendChild(div);
    setContainer(div);
    return () => {
      document.body.removeChild(div);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Once the report component has flushed into the container, fire html2pdf
  useEffect(() => {
    if (!downloadingReport || !container) return;

    // rAF gives React one frame to commit the render into the container
    rafRef.current = requestAnimationFrame(async () => {
      try {
        await downloadReport(downloadingReport, container);
      } catch (err) {
        console.error('[useReportDownload] PDF generation failed:', err);
      } finally {
        setDownloadingReport(null);
        setIsDownloading(false);
      }
    });

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
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

  // Portal renders the active report component into the off-screen container
  const renderContainer =
    container && downloadingReport
      ? createPortal(
          createElement(REPORT_MAP[downloadingReport].component),
          container,
        )
      : null;

  return { triggerDownload, renderContainer, isDownloading, downloadingReport };
}
