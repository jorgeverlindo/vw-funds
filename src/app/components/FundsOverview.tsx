import { FilterSelect } from '@/app/components/FilterSelect';
import { BalanceMetricsGroup } from '@/app/components/BalanceMetricsGroup';
import { ClaimsMetricsGroup } from '@/app/components/ClaimsMetricsGroup';
import { PaymentStatusTableCard } from '@/app/components/PaymentStatusTableCard';
import { FundsPieCard } from '@/app/components/FundsPieCard';
import { FundUtilizationDonutCard } from '@/app/components/FundUtilizationDonutCard';
import { SubmissionPhaseStackedBarCard } from '@/app/components/SubmissionPhaseStackedBarCard';
import { TimeInClaimPhaseBarCard } from '@/app/components/TimeInClaimPhaseBarCard';
import { TimeInPaymentPhaseBarCard } from '@/app/components/TimeInPaymentPhaseBarCard';
import { AccrualsSubmittedDifferenceCard } from '@/app/components/AccrualsSubmittedDifferenceCard';
import { SpendBreakdownStackedBarCard } from '@/app/components/SpendBreakdownStackedBarCard';
import { PreApprovalsPieCard } from '@/app/components/PreApprovalsPieCard';
import { BudgetForecastCard } from '@/app/components/BudgetForecastCard';
import { GenerateReportSplitButton } from '@/app/components/GenerateReportSplitButton';
import { DateRangeInput } from '@/app/components/DateRangeInput';
import { DateRangePicker } from '@/app/components/DateRangePicker';
import { DateRange } from 'react-day-picker';
import { useState, useRef, useEffect } from 'react';

const defaultDateRange: DateRange = {
  from: new Date(2025, 0, 1),
  to: new Date(2025, 11, 31),
};

export function FundsOverview() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultDateRange);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Close date picker on outside click
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
    setDateRange(range);
    setIsDatePickerOpen(false);
  };

  const handleDateReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDateRange(defaultDateRange);
  };

  return (
    <div className="p-6 space-y-4">
      {/* Filters and Generate Report Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GenerateReportSplitButton />
        </div>

        <div className="content-stretch flex gap-3 items-start justify-end overflow-visible relative shrink-0 z-40">
          <FilterSelect label="Area" value="All Areas" width="w-[110px]" />
          <FilterSelect label="Dealership" value="All Dealerships" width="w-[274px]" />
          
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
