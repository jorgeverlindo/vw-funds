import { useState, useEffect, useRef } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  error?: boolean;
  openUpward?: boolean;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className,
  error,
  openUpward = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-10 pl-3 pr-10 bg-[#F9FAFA] border rounded-[4px] text-[13px] flex items-center cursor-pointer transition-all select-none",
          error ? "border-[#D2323F]" : "border-[#CAC9CF]",
          isOpen ? "ring-1 ring-[var(--brand-accent)] border-[var(--brand-accent)]" : "hover:border-[#B0B0B5]"
        )}
      >
        <span className={cn("truncate", !selectedOption && "text-[#686576]/60")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#111014]/40 pointer-events-none" />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: openUpward ? 4 : -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: openUpward ? 4 : -4 }}
            transition={{ duration: 0.12 }}
            className={cn(
              "absolute left-0 w-full bg-white rounded-lg shadow-lg border border-[rgba(0,0,0,0.12)] py-1 z-[200] max-h-[240px] overflow-y-auto custom-scrollbar",
              openUpward ? "bottom-full mb-1" : "top-full mt-1"
            )}
          >
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full text-left px-4 py-2 text-[13px] hover:bg-gray-50 transition-colors tracking-[0.15px] leading-[1.5] cursor-pointer",
                  value === option.value
                    ? "text-[var(--brand-accent)] font-medium bg-[var(--brand-accent)]/5"
                    : "text-[#1f1d25]"
                )}
              >
                {option.label}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
