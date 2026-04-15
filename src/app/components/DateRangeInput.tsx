import { format } from 'date-fns';
import { frCA } from 'date-fns/locale';
import { useTranslation } from '../contexts/LanguageContext';

interface DateRangeInputProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onClick: () => void;
  onReset: (e: React.MouseEvent) => void;
}

export function DateRangeInput({ startDate, endDate, onClick, onReset }: DateRangeInputProps) {
  const { t, language } = useTranslation();
  const dateLocale = language === 'fr' ? frCA : undefined;
  const fmtDate = (d: Date) => format(d, 'MMM d, yyyy', { locale: dateLocale });

  const displayText = startDate && endDate
    ? `${fmtDate(startDate)} - ${fmtDate(endDate)}`
    : t('Select Date Range');

  return (
    <div className="flex flex-col items-start relative w-fit">
      <div className="text-[#686576] text-xs font-normal mb-1 tracking-[0.15px] whitespace-nowrap">{t('Date Range')}</div>
      <div 
        onClick={onClick}
        className="group relative min-w-max bg-[#f9fafa] border border-[#cac9cf] rounded h-10 flex items-center px-2 pr-10 cursor-pointer hover:border-[#6356E1] transition-colors gap-2"
      >
        <div className="flex items-center gap-2 px-1 py-0.5 bg-[rgba(17,16,20,0.04)] rounded text-[11px] text-[#1f1d25] tracking-[0.16px]">
          <span className="whitespace-nowrap">{displayText}</span>
          
          {/* Reset 'X' Button */}
          <div 
            role="button"
            tabIndex={0}
            onClick={onReset}
            className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-black/10 transition-colors cursor-pointer z-10"
          >
            <svg className="size-3 opacity-25" fill="none" viewBox="0 0 16 16" stroke="currentColor">
              <path d="M4 4l8 8M12 4l-8 8" strokeWidth={2} strokeLinecap="round" />
            </svg>
          </div>
        </div>
        
        {/* Calendar Icon - Absolute Right */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-black/56">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
      </div>
    </div>
  );
}
