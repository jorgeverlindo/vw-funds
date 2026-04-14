import { useState, useRef, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { GenerateReportSplitButton } from './GenerateReportSplitButton';
import { FilterSelect } from './FilterSelect';
import { DateRangeInput } from './DateRangeInput';
import { DateRangePicker } from './DateRangePicker';
import { BalanceMetricsGroup } from './BalanceMetricsGroup';
import { ClaimsMetricsGroup } from './ClaimsMetricsGroup';
import { PaymentStatusTableCard } from './PaymentStatusTableCard';
import { FundsPieCard } from './FundsPieCard';
import { FundUtilizationDonutCard } from './FundUtilizationDonutCard';
import { SubmissionPhaseStackedBarCard } from './SubmissionPhaseStackedBarCard';
import { TimeInClaimPhaseBarCard } from './TimeInClaimPhaseBarCard';
import { TimeInPaymentPhaseBarCard } from './TimeInPaymentPhaseBarCard';
import { AccrualsSubmittedDifferenceCard } from './AccrualsSubmittedDifferenceCard';
import { SpendBreakdownStackedBarCard } from './SpendBreakdownStackedBarCard';
import { PreApprovalsPieCard } from './PreApprovalsPieCard';
import { BudgetForecastCard } from './BudgetForecastCard';

interface FundsOverviewContentProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

const defaultDateRange: DateRange = {
  from: new Date(2025, 0, 1),
  to: new Date(2025, 11, 31),
};

export function FundsOverviewContent({ dateRange, onDateRangeChange }: FundsOverviewContentProps) {
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

      {/* (2) KPI Band: Balance + Claims metrics */}
      <div className="content-center flex flex-1 flex-wrap gap-3.5 items-center min-h-px min-w-px relative">
        <BalanceMetricsGroup />
        <ClaimsMetricsGroup />
      </div>

      {/* (3) Row: Payment Status | Funds | Fund Utilization */}
      <div className="grid grid-cols-3 gap-4">
        <PaymentStatusTableCard />
        <FundsPieCard />
        <FundUtilizationDonutCard />
      </div>

      {/* (4) Row: Submission Phase | Time in Claim | Time in Payment */}
      <div className="grid grid-cols-3 gap-4">
        <SubmissionPhaseStackedBarCard />
        <TimeInClaimPhaseBarCard />
        <TimeInPaymentPhaseBarCard />
      </div>

      {/* (5) Full width: Accruals / Submitted */}
      <AccrualsSubmittedDifferenceCard />

      {/* (6) Row: Spend | Pre-Approvals */}
      <div className="grid grid-cols-2 gap-4">
        <SpendBreakdownStackedBarCard />
        <PreApprovalsPieCard />
      </div>

      {/* (7) Bottom full-width: Budget Forecast */}
      <BudgetForecastCard />
    </div>
  );
}
