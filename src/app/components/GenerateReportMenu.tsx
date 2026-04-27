import { useState } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { Download, Share2 } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface GenerateReportMenuProps {
  onClose: () => void;
  onSelect: (item: string) => void;
  onShare: (reportName: string) => void;
}

const REPORT_ITEMS = [
  'Fund Utilization Report',
  'Fund Allocation Report',
  'Fund Usage Report',
  'Claim Submission Report',
  'Pre-approval Summary Report',
  'Payment Processing Report',
];

export function GenerateReportMenu({ onClose, onSelect, onShare }: GenerateReportMenuProps) {
  const { t } = useTranslation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <TooltipPrimitive.Provider delayDuration={450}>
      <div
        className="absolute top-full left-0 mt-1 w-[260px] bg-white rounded-xl shadow-xl border border-[rgba(0,0,0,0.10)] py-1.5 z-50 overflow-hidden"
        style={{ animation: 'menuIn 0.14s ease both' }}
      >
        <style>{`
          @keyframes menuIn {
            from { opacity: 0; transform: scale(0.97) translateY(-4px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>
        {REPORT_ITEMS.map((item) => (
          <div
            key={item}
            onMouseEnter={() => setHoveredItem(item)}
            onMouseLeave={() => setHoveredItem(null)}
            className="relative flex items-center px-4 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => {
              onSelect(item);
              onClose();
            }}
          >
            <span className="flex-1 text-[13px] text-[#1f1d25] tracking-[0.15px] leading-[1.5] pr-2">
              {t(item)}
            </span>

            {/* Action icons — fade in on hover */}
            <div
              className="flex items-center gap-1 shrink-0 transition-opacity duration-200"
              style={{
                opacity: hoveredItem === item ? 1 : 0,
                pointerEvents: hoveredItem === item ? 'auto' : 'none',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Download PDF */}
              <TooltipPrimitive.Root>
                <TooltipPrimitive.Trigger asChild>
                  <button
                    onClick={() => { onSelect(item); onClose(); }}
                    className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-200 text-[#686576] hover:text-[#1f1d25] transition-colors"
                  >
                    <Download size={14} />
                  </button>
                </TooltipPrimitive.Trigger>
                <TooltipPrimitive.Portal>
                  <TooltipPrimitive.Content
                    side="top"
                    sideOffset={6}
                    className="z-[400] px-2.5 py-1.5 rounded-md text-[11px] font-medium tracking-[0.3px] bg-[#1f1d25] text-white shadow-lg"
                  >
                    Download PDF
                    <TooltipPrimitive.Arrow className="fill-[#1f1d25]" />
                  </TooltipPrimitive.Content>
                </TooltipPrimitive.Portal>
              </TooltipPrimitive.Root>

              {/* Share */}
              <TooltipPrimitive.Root>
                <TooltipPrimitive.Trigger asChild>
                  <button
                    onClick={() => onShare(item)}
                    className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-200 text-[#686576] hover:text-[var(--brand-accent)] transition-colors"
                  >
                    <Share2 size={14} />
                  </button>
                </TooltipPrimitive.Trigger>
                <TooltipPrimitive.Portal>
                  <TooltipPrimitive.Content
                    side="top"
                    sideOffset={6}
                    className="z-[400] px-2.5 py-1.5 rounded-md text-[11px] font-medium tracking-[0.3px] bg-[#1f1d25] text-white shadow-lg"
                  >
                    Share
                    <TooltipPrimitive.Arrow className="fill-[#1f1d25]" />
                  </TooltipPrimitive.Content>
                </TooltipPrimitive.Portal>
              </TooltipPrimitive.Root>
            </div>
          </div>
        ))}
      </div>
    </TooltipPrimitive.Provider>
  );
}
