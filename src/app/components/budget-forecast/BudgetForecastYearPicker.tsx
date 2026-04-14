import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface BudgetForecastYearPickerProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
}

export const BudgetForecastYearPicker: React.FC<BudgetForecastYearPickerProps> = ({
  selectedYear,
  onYearChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const years = [2026, 2025, 2024, 2023];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="flex items-center gap-4 relative" ref={dropdownRef}>
      <button 
        onClick={() => onYearChange(selectedYear - 1)}
        className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
      >
        <ChevronLeftIcon />
      </button>
      
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-xl font-bold text-gray-900 px-2 py-1 rounded hover:bg-gray-50 transition-colors"
        >
          {selectedYear}
        </button>

        {isOpen && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
            {years.map((year) => (
              <button
                key={year}
                onClick={() => {
                  onYearChange(year);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  selectedYear === year ? 'text-[#6356e1] font-medium' : 'text-gray-700'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        )}
      </div>

      <button 
        onClick={() => onYearChange(selectedYear + 1)}
        className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
      >
        <ChevronRightIcon />
      </button>
    </div>
  );
};
