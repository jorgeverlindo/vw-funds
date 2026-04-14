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
import { useFilters } from '../contexts/FilterContext';
import { useDealerships } from '../../data/access/useDealerships';

export function FundsOverviewOEMContent() {
  const { filters, setArea, setDateRange, resetFilters } = useFilters();
  const { areas } = useDealerships();
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
    if (range?.from && range?.to) setDateRange(range.from, range.to);
    setIsDatePickerOpen(false);
  };

  const handleDateReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetFilters();
  };

  const dateRangeForInput: DateRange = { from: filters.dateFrom, to: filters.dateTo };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-3">
          <GenerateReportSplitButton />
        </div>
        <div className="content-stretch flex gap-3 items-end justify-end overflow-visible relative shrink-0 z-40">
          {/* OEM: Area filter only — no individual dealer filter */}
          <FilterSelect
            label="Area"
            value={filters.area}
            options={areas.map(a => ({ value: a === 'All Areas' ? null : a, label: a }))}
            onChange={setArea}
          />
          <div className="relative" ref={datePickerRef}>
            <DateRangeInput
              startDate={filters.dateFrom}
              endDate={filters.dateTo}
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              onReset={handleDateReset}
            />
            {isDatePickerOpen && (
              <DateRangePicker
                initialRange={dateRangeForInput}
                onApply={handleDateApply}
                onCancel={() => setIsDatePickerOpen(false)}
              />
            )}
          </div>
        </div>
      </div>

      <div className="content-center flex flex-1 flex-wrap gap-3.5 items-center min-h-px min-w-px relative">
        <BalanceMetricsGroup />
        <ClaimsMetricsGroup />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <AccruedFundsRooftopCard />
        <AccruedFundsRegionCard />
        <SubmittedClaimsRooftopCard />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FundsPieCard />
        <FundUtilizationDonutCard />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SubmissionPhaseStackedBarCard variant="oem" />
        <LongestPaymentTimeCard />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SpendBreakdownStackedBarCard />
        <PreApprovalsPieCard />
      </div>
    </div>
  );
}
