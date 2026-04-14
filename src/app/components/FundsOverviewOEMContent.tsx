import { useState, useRef, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { GenerateReportSplitButton } from './GenerateReportSplitButton';
import { FilterSelect } from './FilterSelect';
import { DateRangeInput } from './DateRangeInput';
import { DateRangePicker } from './DateRangePicker';
import { BalanceMetricsGroup } from './BalanceMetricsGroup';
import { ClaimsMetricsGroup } from './ClaimsMetricsGroup';
import { 
  AccruedFundsRooftopCard, 
  AccruedFundsRegionCard, 
  SubmittedClaimsRooftopCard,
  LongestPaymentTimeCard 
} from './FundsOverviewOEMCharts';
import { FundsPieCard } from './FundsPieCard';
import { FundUtilizationDonutCard } from './FundUtilizationDonutCard';
import { SubmissionPhaseStackedBarCard } from './SubmissionPhaseStackedBarCard';
import { SpendBreakdownStackedBarCard } from './SpendBreakdownStackedBarCard';
import { PreApprovalsPieCard } from './PreApprovalsPieCard';

interface FundsOverviewOEMContentProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

const defaultDateRange: DateRange = {
  from: new Date(2025, 0, 1),
  to: new Date(2025, 11, 31),
};

export function FundsOverviewOEMContent({ dateRange, onDateRangeChange }: FundsOverviewOEMContentProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateApply = (range: DateRange | undefined) => {
    onDateRangeChange(range);
    setIsDatePickerOpen(false);
  };

  const handleDateReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDateRangeChange(defaultDateRange);
  };
  
  return (
    <div className="space-y-4">
      {/* Filters and Generate Report Button */}
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-3">
          <GenerateReportSplitButton />
        </div>

        <div className="content-stretch flex gap-3 items-end justify-end overflow-visible relative shrink-0 z-40">
          <FilterSelect label="Area" value="All Areas" />
          <FilterSelect label="Dealership" value="All Dealerships" />
          
          {/* Date Range Picker Container */}
          <div className="relative" ref={datePickerRef}>
            <DateRangeInput 
              startDate={dateRange?.from} 
              endDate={dateRange?.to} 
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              onReset={handleDateReset}
            />
            
            {isDatePickerOpen && (
              <DateRangePicker 
                initialRange={dateRange} 
                onApply={handleDateApply} 
                onCancel={() => setIsDatePickerOpen(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* (2) KPI Band: Balance + Claims metrics (OEM Variant) */}
      <div className="content-center flex flex-1 flex-wrap gap-3.5 items-center min-h-px min-w-px relative">
        <BalanceMetricsGroup variant="oem" />
        <ClaimsMetricsGroup variant="oem" />
      </div>

      {/* (3) Row: 3 OEM Specific Charts */}
      <div className="grid grid-cols-3 gap-4">
        <AccruedFundsRooftopCard />
        <AccruedFundsRegionCard />
        <SubmittedClaimsRooftopCard />
      </div>

      {/* (4) Row: Funds + Fund Utilization (50/50) */}
      <div className="grid grid-cols-2 gap-4">
        <FundsPieCard variant="oem" />
        <FundUtilizationDonutCard variant="oem" />
      </div>

      {/* (5) Row: Submission Phase | Longest Payment Time (50/50) */}
      <div className="grid grid-cols-2 gap-4">
        <SubmissionPhaseStackedBarCard variant="oem" />
        <LongestPaymentTimeCard />
      </div>

      {/* (6) Row: Spend | Pre-Approvals (50/50) */}
      <div className="grid grid-cols-2 gap-4">
        <SpendBreakdownStackedBarCard variant="oem" />
        <PreApprovalsPieCard variant="oem" />
      </div>
    </div>
  );
}