import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { RangeOption } from './types';
import { useTranslation } from '../../contexts/LanguageContext';

interface BudgetForecastRangeTabsProps {
  selectedRange: RangeOption;
  onRangeChange: (range: RangeOption) => void;
}

export const BudgetForecastRangeTabs: React.FC<BudgetForecastRangeTabsProps> = ({
  selectedRange,
  onRangeChange,
}) => {
  const { t } = useTranslation();
  const tabs: { label: string; value: RangeOption }[] = [
    { label: '3 Months', value: '3m' },
    { label: '6 Months', value: '6m' },
    { label: '12 Months', value: '12m' },
  ];

  return (
    <div className="flex items-center gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onRangeChange(tab.value)}
          className={twMerge(
            "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
            selectedRange === tab.value
              ? "bg-[#6356e1] text-white shadow-sm"
              : "bg-white text-[#6356e1] border border-[#6356e1]/20 hover:bg-[#6356e1]/5"
          )}
        >
          {t(tab.label)}
        </button>
      ))}
    </div>
  );
};
