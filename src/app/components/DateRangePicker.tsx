import { format } from 'date-fns';
import { frCA } from 'date-fns/locale';
import { DateRange, DayPicker } from 'react-day-picker';
import {
  startOfWeek, endOfWeek, subWeeks, subDays,
  startOfMonth, endOfMonth, addMonths
} from 'date-fns';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface DateRangePickerProps {
  initialRange: DateRange | undefined;
  onApply: (range: DateRange | undefined) => void;
  onCancel: () => void;
}

export function DateRangePicker({ initialRange, onApply, onCancel }: DateRangePickerProps) {
  const { t, language } = useTranslation();
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(initialRange);

  const dateLocale = language === 'fr' ? frCA : undefined;
  const fmtDate = (d: Date) => format(d, 'MMM d', { locale: dateLocale });

  // Helper to safely format range
  const formattedRange = selectedRange?.from && selectedRange?.to
    ? `${fmtDate(selectedRange.from)} - ${fmtDate(selectedRange.to)}`
    : selectedRange?.from
      ? `${fmtDate(selectedRange.from)} - ${t('Select End')}`
      : t('Select Range');

  // Presets
  const handlePreset = (preset: string) => {
    const today = new Date();
    let newRange: DateRange | undefined;

    switch (preset) {
      case 'This Week':
        newRange = { from: startOfWeek(today), to: endOfWeek(today) };
        break;
      case 'Last Week':
        const lastWeek = subWeeks(today, 1);
        newRange = { from: startOfWeek(lastWeek), to: endOfWeek(lastWeek) };
        break;
      case 'Last 7 Days':
        newRange = { from: subDays(today, 7), to: today };
        break;
      case 'Current Month':
        newRange = { from: startOfMonth(today), to: endOfMonth(today) };
        break;
      case 'Next Month':
        const nextMonth = addMonths(today, 1);
        newRange = { from: startOfMonth(nextMonth), to: endOfMonth(nextMonth) };
        break;
      case 'Reset':
        newRange = initialRange; // Or default? Prompt says "Reset preset sets draft to default range"
        break;
    }
    setSelectedRange(newRange);
  };

  const presets = ['This Week', 'Last Week', 'Last 7 Days', 'Current Month', 'Next Month', 'Reset'] as const;

  return (
    <div className="absolute top-full right-0 mt-2 z-50 bg-white rounded-lg shadow-xl border border-[rgba(0,0,0,0.12)] p-6 w-[600px] animate-in fade-in zoom-in-95 duration-200">
      {/* Title */}
      <div className="text-[10px] font-medium text-[#686576] uppercase tracking-wider mb-2">
        {t('SELECT DATE RANGE')}
      </div>

      {/* Large Range Display */}
      <div className="text-[32px] font-normal text-[#1f1d25] mb-8">
        {formattedRange}
      </div>

      <div className="flex gap-8">
        {/* Presets Column */}
        <div className="flex flex-col gap-2 w-[140px] shrink-0">
          {presets.map((preset) => (
            <button
              key={preset}
              onClick={() => handlePreset(preset)}
              className="px-4 py-2 text-[13px] text-[#473bab] font-medium border border-[#A8A8F8] rounded-full hover:bg-purple-50 transition-colors text-left"
            >
              {t(preset)}
            </button>
          ))}
        </div>

        {/* Calendar */}
        <div className="flex-1">
          <style>{`
            .rdp { --rdp-cell-size: 40px; margin: 0; }
            .rdp-day_selected:not([disabled]), .rdp-day_selected:focus:not([disabled]), .rdp-day_selected:active:not([disabled]), .rdp-day_selected:hover:not([disabled]) { 
              background-color: #6356E1; 
              color: white;
            }
            .rdp-day_range_middle {
              background-color: #EBE9FE !important;
              color: #1f1d25 !important;
            }
            .rdp-day_range_start {
               border-radius: 50% 0 0 50% !important;
            }
             .rdp-day_range_end {
               border-radius: 0 50% 50% 0 !important;
            }
            .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
              background-color: #f3f4f6;
            }
          `}</style>
          <DayPicker
            mode="range"
            selected={selectedRange}
            onSelect={setSelectedRange}
            showOutsideDays
            locale={dateLocale}
            components={{
              IconLeft: () => <ChevronLeft className="w-4 h-4" />,
              IconRight: () => <ChevronRight className="w-4 h-4" />,
            }}
            classNames={{
              caption: "flex justify-between items-center mb-4 px-2",
              caption_label: "text-base font-medium text-[#1f1d25]",
              nav: "flex items-center gap-1",
              nav_button: "p-1 hover:bg-gray-100 rounded-full",
              head_cell: "text-[11px] font-medium text-[#686576] w-10 h-10",
              cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-[#EBE9FE] first:[&:has([aria-selected])]:rounded-l-full last:[&:has([aria-selected])]:rounded-r-full focus-within:relative focus-within:z-20",
              day: "w-10 h-10 p-0 font-normal aria-selected:opacity-100 rounded-full hover:bg-gray-100",
              day_range_start: "day-range-start",
              day_range_end: "day-range-end",
              day_selected: "bg-[#6356E1] text-white hover:bg-[#6356E1] hover:text-white focus:bg-[#6356E1] focus:text-white",
              day_today: "bg-gray-100 text-accent-foreground",
              day_outside: "text-gray-300 opacity-50",
              day_disabled: "text-gray-300 opacity-50",
              day_hidden: "invisible",
            }}
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end gap-4 mt-8 pt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-[14px] font-medium text-[#473bab] hover:bg-purple-50 rounded transition-colors"
        >
          {t('Cancel')}
        </button>
        <button
          onClick={() => onApply(selectedRange)}
          className="px-4 py-2 text-[14px] font-medium text-[#473bab] hover:bg-purple-50 rounded transition-colors"
        >
          {t('Ok')}
        </button>
      </div>
    </div>
  );
}
