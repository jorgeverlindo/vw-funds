import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, BarChart2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from '../contexts/LanguageContext';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type RangeOption = '3m' | '6m' | '12m';

interface Contract {
  id: string;
  value: number;
  formattedValue: string;
  expiresAt: string;
  expiresDate: Date;
  mediaCost: number;
  hardCost: number;
  mediaCostFormatted: string;
  hardCostFormatted: string;
}

// --- Data ---
const CONTRACTS: Contract[] = [
  { id: '1', value: 59445.21, formattedValue: '$59,445.21', expiresAt: '1/15/2026', expiresDate: new Date(2026, 0, 15), mediaCost: 35000, hardCost: 24445.21, mediaCostFormatted: '$35k', hardCostFormatted: '$24k' },
  { id: '2', value: 45594.42, formattedValue: '$45,594.42', expiresAt: '2/15/2026', expiresDate: new Date(2026, 1, 15), mediaCost: 30000, hardCost: 15594.42, mediaCostFormatted: '$30k', hardCostFormatted: '$16k' },
  { id: '3', value: 48176.61, formattedValue: '$48,176.61', expiresAt: '3/15/2026', expiresDate: new Date(2026, 2, 15), mediaCost: 28000, hardCost: 20176.61, mediaCostFormatted: '$28k', hardCostFormatted: '$20k' },
  { id: '4', value: 74168.52, formattedValue: '$74,168.52', expiresAt: '4/15/2026', expiresDate: new Date(2026, 3, 15), mediaCost: 44000, hardCost: 30168.52, mediaCostFormatted: '$44k', hardCostFormatted: '$30k' },
  { id: '5', value: 34024.30, formattedValue: '$34,024.30', expiresAt: '5/15/2026', expiresDate: new Date(2026, 4, 15), mediaCost: 20000, hardCost: 14024.30, mediaCostFormatted: '$20k', hardCostFormatted: '$14k' },
  { id: '6', value: 79658.16, formattedValue: '$79,658.16', expiresAt: '6/15/2026', expiresDate: new Date(2026, 5, 15), mediaCost: 47000, hardCost: 32658.16, mediaCostFormatted: '$47k', hardCostFormatted: '$33k' },
  { id: '7', value: 75249.97, formattedValue: '$75,249.97', expiresAt: '7/15/2026', expiresDate: new Date(2026, 6, 15), mediaCost: 45000, hardCost: 30249.97, mediaCostFormatted: '$45k', hardCostFormatted: '$30k' },
  { id: '8', value: 59445.21, formattedValue: '$59,445.21', expiresAt: '8/15/2026', expiresDate: new Date(2026, 7, 15), mediaCost: 35000, hardCost: 24445.21, mediaCostFormatted: '$35k', hardCostFormatted: '$24k' },
];

const KPI_DATA_MAP = {
  '3m': {
    available: '$475,759.98',
    expiring: '$153,215.54',
    mediaCost: '$101,121.23',
    hardCost: '$52,094.04',
    subtitle: '3 months'
  },
  '6m': {
    available: '$475,759.98',
    expiring: '$341,065.27',
    mediaCost: '$225,102.64',
    hardCost: '$62,146.34',
    subtitle: '6 months'
  },
  '12m': {
    available: '$475,759.98',
    expiring: '$475,759.98',
    mediaCost: '$313,802.94',
    hardCost: '$161,956.04',
    subtitle: '12 months'
  }
};

const MONTHS = [
  "Jan ’26", "Feb ’26", "Mar ’26", "Apr ’26", "May ’26", "Jun ’26",
  "Jul ’26", "Aug ’26", "Sep ’26", "Oct ’26", "Nov ’26", "Dec ’26"
];

// --- Icons ---
function CheckIconCircle() {
  return (
    <svg className="w-full h-full" viewBox="0 0 14 14" fill="none">
       <g clipPath="url(#clip0_check)">
         <path d="M8.75 5.54167L6.125 8.75L4.95833 7.58333M12.5417 7C12.5417 10.0606 10.0606 12.5417 7 12.5417C3.93942 12.5417 1.45833 10.0606 1.45833 7C1.45833 3.93942 3.93942 1.45833 7 1.45833C10.0606 1.45833 12.5417 3.93942 12.5417 7Z" stroke="#4CAF50" strokeLinecap="round" strokeLinejoin="round" />
       </g>
       <defs>
         <clipPath id="clip0_check">
           <rect width="14" height="14" fill="white"/>
         </clipPath>
       </defs>
    </svg>
  );
}

// --- Subcomponents ---

const BudgetForecastRangeTabs = ({ selectedRange, onChange }: { selectedRange: RangeOption, onChange: (r: RangeOption) => void }) => {
  return (
    <div className="flex items-center gap-1 bg-transparent">
      {(['3 Months', '6 Months', '12 Months'] as const).map((label) => {
        const value = label === '3 Months' ? '3m' : label === '6 Months' ? '6m' : '12m';
        const isActive = selectedRange === value;
        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border cursor-pointer",
              isActive 
                ? "bg-[#6356e1] text-white border-[#6356e1]" 
                : "bg-transparent text-[#6356e1] border-[#E0E0E0] hover:bg-gray-50"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

const MetricBan = ({ label, value, legendColor }: { label: string, value: string, legendColor?: string }) => {
  return (
    <div className="flex flex-col items-start p-3 border border-gray-200 rounded-lg min-w-[120px]">
      <div className="flex items-center gap-1 mb-1">
        {legendColor && <div className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: legendColor }} />}
        <span className="text-[11px] text-gray-500 font-normal leading-tight">{label}</span>
      </div>
      <span className="text-[14px] text-gray-800 font-normal leading-tight">{value}</span>
    </div>
  );
};

const BudgetForecastYearPicker = ({ selectedYear, onChange, subtitle }: { selectedYear: number, onChange: (y: number) => void, subtitle: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const years = [2026, 2025, 2024, 2023];
  
  return (
    <div className="relative">
      <div className="flex flex-col items-center">
        {/* Row with Chevrons and Year */}
        <div className="flex items-center gap-4 select-none relative z-10">
          <button 
            onClick={() => onChange(selectedYear - 1)}
            className="p-1 hover:bg-gray-100 rounded-full text-gray-500 cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          
          <div 
            className="text-[18px] font-medium text-[rgba(0,0,0,0.87)] text-center leading-[1.57] cursor-pointer"
            onClick={() => setIsOpen(!isOpen)}
          >
            {selectedYear}
          </div>

          <button 
            onClick={() => onChange(selectedYear + 1)}
            className="p-1 hover:bg-gray-100 rounded-full text-gray-500 cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Subtitle - Fixed height container to prevent reflow */}
        <div className="h-[20px] flex items-start justify-center mt-[-2px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={subtitle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-[12px] font-medium text-[rgba(0,0,0,0.87)] text-center leading-[1.57] whitespace-nowrap"
            >
              {subtitle}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Dropdown - Positioned relative to the whole component, centered horizontally */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div 
            className="absolute top-14 left-1/2 -translate-x-1/2 bg-white shadow-lg rounded-md border border-gray-100 py-1 z-20 w-24"
          >
            {years.map(y => (
              <div 
                key={y}
                onClick={() => { onChange(y); setIsOpen(false); }}
                className={cn(
                  "px-4 py-2 text-sm text-center cursor-pointer hover:bg-gray-50",
                  selectedYear === y ? "text-[#6356e1] font-medium" : "text-gray-700"
                )}
              >
                {y}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const BudgetForecastStatusChip = ({ value }: { value: string }) => {
  return (
    <div 
      className="flex items-center gap-1 pl-1.5 pr-2 py-0.5 rounded-[8px] bg-[#e8f5e9] border border-[#1b5e20] shadow-sm w-fit whitespace-nowrap"
      style={{ backgroundImage: "linear-gradient(90deg, rgb(232, 245, 233) 0%, rgb(232, 245, 233) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" }}
    >
      <div className="w-3.5 h-3.5 flex-shrink-0">
        <CheckIconCircle />
      </div>
      <span className="text-[11px] text-[#1b5e20] font-normal leading-[1.66] tracking-[0.4px] font-['Roboto']">
        {value}
      </span>
    </div>
  );
};

// --- Tooltip Component ---
const BudgetForecastTooltip = ({ month, monthIndex }: { month: string, monthIndex: number }) => {
  // Filter for contracts active in this month or future (simplification: not expired before this month)
  // Actually, "As months progress, one line disappears".
  // Let's assume the list is sorted by date.
  // We show contracts where expiresDate >= currentMonthDate
  
  const currentMonthDate = new Date(2026, monthIndex, 1);
  
  const relevantContracts = CONTRACTS.filter(c => {
    // Only show contracts that expire in this month or later
    return c.expiresDate >= currentMonthDate;
  });

  // Find max value for bar scaling (across ALL contracts to maintain relative scale)
  const maxValue = Math.max(...CONTRACTS.map(c => c.value));

  return (
    <div className="bg-white rounded-lg shadow-xl border border-gray-100 p-4 min-w-[320px] pointer-events-auto">
      <div className="flex flex-col gap-3">
         {/* Header */}
         <div>
            <div className="text-[14px] font-medium text-gray-900 tracking-[0.1px]">
               {month}
            </div>
            <div className="text-[11px] font-normal text-gray-500 tracking-[0.4px]">
               Total Available: $475,762.00
            </div>
         </div>
         
         {/* Legend */}
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
               <div className="w-2.5 h-2.5 rounded-[2px] bg-[#6356e1]" />
               <span className="text-[11px] text-gray-900 font-normal">Media Cost</span>
            </div>
             <div className="flex items-center gap-1.5">
               <div className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: 'rgba(247, 134, 100, 0.9)' }} />
               <span className="text-[11px] text-gray-900 font-normal">Hard Cost</span>
            </div>
         </div>

         {/* Rows */}
         <div className="flex flex-col gap-2 mt-1">
            {relevantContracts.map((contract) => {
               // Highlight logic: The contract expiring IN this month is red.
               // Check if expiry month matches current tooltip month
               const isExpiringThisMonth = contract.expiresDate.getMonth() === monthIndex;
               
               const textColor = isExpiringThisMonth ? 'text-[#f44336]' : 'text-gray-900';
               const labelColor = isExpiringThisMonth ? 'text-[#f44336]' : 'text-gray-500';

               // Width calculation
               const totalWidthPercent = (contract.value / maxValue) * 100;
               // Segment proportions
               const mediaPercent = (contract.mediaCost / contract.value) * 100;
               const hardPercent = (contract.hardCost / contract.value) * 100;

               return (
                  <div key={contract.id} className="flex items-center gap-3">
                     {/* Text Info */}
                     <div className="flex flex-col items-end min-w-[100px]">
                        <span className={cn("text-[11px] font-medium leading-tight", textColor)}>
                           {contract.formattedValue}
                        </span>
                        <span className={cn("text-[10px] leading-tight", labelColor)}>
                           Expires {contract.expiresAt}
                        </span>
                     </div>

                     {/* Stacked Bar */}
                     <div className="flex-1 h-[18px] flex items-center min-w-[120px]">
                        <div 
                           className="h-full flex rounded-[2px] overflow-hidden"
                           style={{ width: `${totalWidthPercent}%` }}
                        >
                           <div 
                              className="h-full bg-[#6356e1] flex items-center justify-center text-white text-[9px] font-medium"
                              style={{ width: `${mediaPercent}%` }}
                           >
                              {/* Only show label if wide enough? */}
                              {mediaPercent > 20 && contract.mediaCostFormatted}
                           </div>
                           <div 
                              className="h-full flex items-center justify-center text-white text-[9px] font-medium"
                              style={{ width: `${hardPercent}%`, backgroundColor: 'rgba(247, 134, 100, 0.9)' }}
                           >
                              {hardPercent > 20 && contract.hardCostFormatted}
                           </div>
                        </div>
                     </div>
                  </div>
               );
            })}
         </div>
      </div>
    </div>
  );
};


// --- Main Component ---

export function BudgetForecastCard({ variant = 'card' }: { variant?: 'card' | 'clean' | 'oem' }) {
  const [selectedRange, setSelectedRange] = useState<RangeOption>('12m');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  // Data Override for OEM
  const contracts = variant === 'oem' ? CONTRACTS.map(c => ({
    ...c,
    formattedValue: c.formattedValue.replace('$', '$10,'),
    value: c.value * 10,
    mediaCost: c.mediaCost * 10,
    hardCost: c.hardCost * 10,
  })) : CONTRACTS;

  const currentKpi = KPI_DATA_MAP[selectedRange];

  const kpiData = variant === 'oem' ? {
    available: '$47,575,998',
    expiring: '$4,757,599',
    mediaCost: '$31,380,294',
    hardCost: '$16,195,604',
    subtitle: currentKpi.subtitle // Pass subtitle to OEM as well? OEM override might need it.
  } : {
    available: currentKpi.available,
    expiring: currentKpi.expiring,
    mediaCost: currentKpi.mediaCost,
    hardCost: currentKpi.hardCost,
    subtitle: currentKpi.subtitle
  };

  // Range Logic
  const monthsToShow = selectedRange === '3m' ? 3 : selectedRange === '6m' ? 6 : 12;
  const visibleMonths = MONTHS.slice(0, monthsToShow);
  
  // Filter contracts based on visibility (Timeline Chart)
  // For the main chart, we show bars up to their expiry month.
  const visibleContracts = contracts.filter(contract => {
      const monthIndex = contract.expiresDate.getMonth();
      return monthIndex < monthsToShow;
  });

  // Grid columns style
  const gridColsStyle = {
    gridTemplateColumns: `repeat(${monthsToShow}, minmax(0, 1fr))`
  };

  return (
    <div className={cn(
      "w-full font-sans",
      variant === 'card' || variant === 'oem' ? "bg-white rounded-xl shadow-sm border border-gray-100 p-6" : "bg-transparent"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">Budget Forecast</h2>
          <BudgetForecastRangeTabs selectedRange={selectedRange} onChange={setSelectedRange} />
        </div>
        <div className="text-gray-400">
          <BarChart2 size={20} className="transform rotate-90" />
        </div>
      </div>

      {/* Controls & KPIs */}
      <div className="flex flex-wrap items-center gap-8 mb-8">
        <BudgetForecastYearPicker 
          selectedYear={selectedYear} 
          onChange={setSelectedYear} 
          subtitle={kpiData.subtitle}
        />
        <div className="flex items-center gap-3 w-full">
           <MetricBan label="Available" value={kpiData.available} />
           <MetricBan label="Expiring" value={kpiData.expiring} />
           <MetricBan label="Media Cost" value={kpiData.mediaCost} legendColor="#6356e1" />
           <MetricBan label="Hard Cost" value={kpiData.hardCost} legendColor="rgba(247, 134, 100, 0.9)" />
        </div>
      </div>

      {/* Timeline Container */}
      <div className="relative border-t border-gray-100">
        
        {/* Month Grid Headers & Hover Targets */}
        <div 
          className="grid w-full relative z-10" 
          style={gridColsStyle}
        >
          {visibleMonths.map((month, index) => (
             <div 
               key={month} 
               className="relative h-[380px] border-r border-gray-100 group transition-colors cursor-pointer hover:bg-[#6356e1]/5"
               onMouseEnter={() => setHoveredMonth(month)}
               onMouseLeave={() => setHoveredMonth(null)}
             >
                {/* Month Label */}
                <div className="p-3 text-[11px] text-gray-900 font-normal font-['Roboto'] tracking-[0.4px]">
                  {month}
                </div>
                
                {/* Scrubber Line (Vertical Dash) - Visible on hover */}
                {hoveredMonth === month && (
                   <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px border-l-2 border-dashed border-[#111014] opacity-56 h-full pointer-events-none z-10" />
                )}

                {/* Tooltip - Rendered when hovered */}
                {hoveredMonth === month && (
                  <div className="absolute top-[55px] left-[50%] z-50 transform translate-x-2 pointer-events-auto">
                     <BudgetForecastTooltip month={month} monthIndex={index} />
                  </div>
                )}
             </div>
          ))}
        </div>

        {/* Contract Rows (Absolute Underlay/Overlay) */}
        <div className="absolute top-[40px] left-0 w-full flex flex-col gap-[8px] pointer-events-none z-0">
          {visibleContracts.map((contract) => {
             const expiryMonthIndex = contract.expiresDate.getMonth();
             const durationInMonths = expiryMonthIndex + 1;
             
             // Width logic: (duration / monthsToShow) * 100%
             const widthPercent = (durationInMonths / monthsToShow) * 100;

             return (
               <div 
                 key={contract.id}
                 className="relative h-[40px] bg-[#e7e7e9]/75 rounded-r-[10px] border-l-0 origin-left transition-all duration-300 ease-out"
                 style={{ 
                   width: `${Math.min(widthPercent, 100)}%`,
                   maxWidth: '100%'
                 }}
               >
                 <div className="absolute right-0 top-1/2 -translate-y-1/2 pr-1 flex justify-end w-full">
                    <div className="mr-1">
                      <BudgetForecastStatusChip value={contract.formattedValue} />
                    </div>
                 </div>
               </div>
             );
          })}
        </div>

      </div>
    </div>
  );
}
