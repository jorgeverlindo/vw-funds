import { useState, useRef, useEffect } from 'react';
import { GenerateReportMenu } from './GenerateReportMenu';
import { ShareReportModal } from './ShareReportModal';
import { useReportDownload } from '../reports-pdf/useReportDownload';
import { useTranslation } from '../contexts/LanguageContext';

export function GenerateReportSplitButton() {
  const { t } = useTranslation();
  const [isOpen,       setIsOpen]       = useState(false);
  const [shareReport,  setShareReport]  = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { triggerDownload, isDownloading, downloadingReport } = useReportDownload();

  // Close menu once a download finishes (isDownloading flips false)
  const prevDownloading = useRef(false);
  useEffect(() => {
    if (prevDownloading.current && !isDownloading) {
      setIsOpen(false);
    }
    prevDownloading.current = isDownloading;
  }, [isDownloading]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Don't close while the share modal OR a download is in progress
      if (shareReport !== null || isDownloading) return;
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [shareReport, isDownloading]);

  const handlePrimaryClick = () => {
    setIsOpen(v => !v);
  };

  return (
    <>
      <div className="relative inline-block" ref={containerRef}>
        <div className="flex items-stretch rounded-full border border-[rgba(99,86,225,0.5)] overflow-hidden bg-white hover:bg-[#F9FAFA] transition-colors h-10">
          {/* Left Segment: Primary Action */}
          <button
            onClick={handlePrimaryClick}
            className="px-4 flex items-center justify-center font-['Roboto'] font-medium text-[13px] text-[#473bab] tracking-[0.46px] hover:bg-purple-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#473bab] focus:ring-opacity-50"
          >
            {t('Generate Report')}
          </button>

          {/* Divider */}
          <div className="w-[1px] bg-[#6356E1] opacity-50 my-[1px]" />

          {/* Right Segment: Dropdown Trigger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-2 flex items-center justify-center text-[#473bab] hover:bg-purple-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#473bab] focus:ring-opacity-50"
            aria-expanded={isOpen}
            aria-haspopup="true"
          >
            <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5.5 8l4.5 4.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </button>
        </div>

        {/* Dropdown Menu — stays open while a download is in progress so the
            spinner is visible and the user has feedback */}
        {isOpen && (
          <GenerateReportMenu
            onClose={() => setIsOpen(false)}
            onSelect={(_item) => {}}
            onShare={(report) => {
              setShareReport(report);
              setIsOpen(false);
            }}
            onDownload={(report) => {
              // Don't close the menu here — keep it open to show the spinner
              triggerDownload(report);
            }}
            downloadingReport={downloadingReport}
          />
        )}
      </div>

      {/* Share modal — lives outside the menu so portal clicks don't trigger close */}
      <ShareReportModal
        isOpen={shareReport !== null}
        reportName={shareReport ?? ''}
        onClose={() => setShareReport(null)}
      />
    </>
  );
}
