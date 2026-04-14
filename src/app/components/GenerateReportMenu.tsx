import { useTranslation } from '../contexts/LanguageContext';

interface GenerateReportMenuProps {
  onClose: () => void;
  onSelect: (item: string) => void;
}

const REPORT_ITEMS = [
  'Fund Utilization Report',
  'Fund Allocation Report',
  'Fund Usage Report',
  'Claim Submission Report',
  'Pre-approval Summary Report',
  'Payment Processing Report',
];

export function GenerateReportMenu({ onClose, onSelect }: GenerateReportMenuProps) {
  const { t } = useTranslation();
  return (
    <div 
      className="absolute top-full left-0 mt-1 w-[240px] bg-white rounded-md shadow-lg border border-[rgba(0,0,0,0.12)] py-2 z-50 animate-in fade-in zoom-in-95 duration-200"
    >
      {REPORT_ITEMS.map((item) => (
        <button
          key={item}
          onClick={() => {
            onSelect(item);
            onClose();
          }}
          className="w-full text-left px-4 py-2 text-[14px] text-[#1f1d25] hover:bg-gray-50 transition-colors tracking-[0.15px] leading-[1.5]"
        >
          {t(item)}
        </button>
      ))}
    </div>
  );
}
