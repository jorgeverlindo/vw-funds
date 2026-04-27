import { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface SingleDatePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export function SingleDatePicker({
  value,
  onChange,
  placeholder = 'Select date…',
  className,
  error,
}: SingleDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      {/* Trigger */}
      <div
        onClick={() => setIsOpen(v => !v)}
        className={cn(
          'w-full h-10 pl-3 pr-10 bg-[#F9FAFA] border rounded-[4px] text-[13px] flex items-center cursor-pointer transition-all select-none',
          error ? 'border-[#D2323F]' : 'border-[#CAC9CF]',
          isOpen
            ? 'ring-1 ring-[var(--brand-accent)] border-[var(--brand-accent)]'
            : 'hover:border-[#B0B0B5]',
        )}
      >
        <span className={cn('truncate', !value && 'text-[#686576]/60')}>
          {value ? format(value, 'MMM d, yyyy') : placeholder}
        </span>
        <CalendarDays
          size={15}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#111014]/40 pointer-events-none"
        />
      </div>

      {/* Calendar — opens upward */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-full left-0 mb-1 bg-white rounded-xl shadow-xl border border-[rgba(0,0,0,0.12)] p-3 z-[200]"
          >
            <DayPicker
              mode="single"
              selected={value}
              onSelect={(day) => {
                onChange(day);
                setIsOpen(false);
              }}
              components={{
                IconLeft: () => <ChevronLeft className="w-3.5 h-3.5" />,
                IconRight: () => <ChevronRight className="w-3.5 h-3.5" />,
              }}
              classNames={{
                months: 'flex',
                month: 'space-y-2',
                caption: 'flex justify-between items-center mb-2 px-1',
                caption_label: 'text-[13px] font-medium text-[#1f1d25]',
                nav: 'flex items-center gap-1',
                nav_button: 'p-1 hover:bg-gray-100 rounded-full transition-colors',
                nav_button_previous: '',
                nav_button_next: '',
                table: 'w-full border-collapse',
                head_row: 'flex',
                head_cell: 'text-[10px] font-medium text-[#686576] w-9 h-7 text-center',
                row: 'flex w-full',
                cell: 'text-center p-0 relative',
                day: 'w-9 h-9 p-0 font-normal text-[12px] rounded-full hover:bg-gray-100 transition-colors cursor-pointer',
                day_selected:
                  'bg-[var(--brand-accent)] text-white hover:bg-[var(--brand-accent)] hover:text-white focus:bg-[var(--brand-accent)] focus:text-white',
                day_today: 'bg-gray-100 font-semibold',
                day_outside: 'text-gray-300 opacity-50',
                day_disabled: 'text-gray-300 opacity-50 cursor-default',
                day_hidden: 'invisible',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
