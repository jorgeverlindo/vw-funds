// [FV] novo arquivo — Overview metrics group for compliance infractions, mirrors ClaimsMetricsGroup
import { useMemo } from 'react';
import { MetricCard } from './MetricCard';
import { useTranslation } from '../contexts/LanguageContext';
import { WCM_DATA, type WCMItem } from './WebMonitoringContent';

const fmt = (n: number) => n.toLocaleString('en-US');

interface ComplianceMetricsGroupProps {
  // [FV] live data so counts mirror what the user sees in the Compliance tab
  userAddedInfractions?: WCMItem[];
  caseSolutions?: Record<string, { solved?: boolean }>;
  // when set, only rows belonging to this dealership OR reported by `reportedByFilter` count (dealer view)
  dealershipFilter?: string;
  reportedByFilter?: string;
  // [FV] click any metric card to navigate to the Compliance tab
  onNavigateToCompliance?: () => void;
}

const PENDING_STATUSES = new Set(['Pending', 'Solution Submitted', 'In Review', 'Revision Requested']);

export function ComplianceMetricsGroup({
  userAddedInfractions = [],
  caseSolutions = {},
  dealershipFilter,
  reportedByFilter,
  onNavigateToCompliance, // [FV]
}: ComplianceMetricsGroupProps) {
  const { t } = useTranslation();

  const { open, pending, solvedYTD } = useMemo(() => {
    // Combined dataset (same as the Compliance tab table)
    const all: WCMItem[] = [...userAddedInfractions, ...WCM_DATA];

    // Apply dealer-view filter when present
    const visible = dealershipFilter
      ? all.filter(i => i.dealership === dealershipFilter || (!!reportedByFilter && i.reportedBy === reportedByFilter))
      : all;

    let openCount = 0, pendingCount = 0, solvedCount = 0;
    for (const item of visible) {
      const sol = caseSolutions[item.id];
      const effective = sol?.solved ? 'Solved' : sol ? 'Solution Submitted' : item.status;
      if (effective === 'Open') openCount++;
      else if (PENDING_STATUSES.has(effective)) pendingCount++;
      else if (effective === 'Solved' || effective === 'Resolved') solvedCount++;
    }
    return { open: openCount, pending: pendingCount, solvedYTD: solvedCount };
  }, [userAddedInfractions, caseSolutions, dealershipFilter, reportedByFilter]);

  return (
    <div className="bg-[#F0F2F4] flex-1 min-h-px min-w-px relative rounded-xl">
      <div className="content-stretch flex flex-col items-start p-2 relative w-full">
        <p className="font-['Roboto'] font-medium leading-6 relative shrink-0 text-[#1f1d25] text-sm tracking-[0.17px] mb-2 px-1">
          {t('Compliance Infractions')}
        </p>
        <div className="content-center flex flex-wrap gap-2 items-center relative shrink-0 w-full">
          <MetricCard label="Open"           value={fmt(open)}     onClick={onNavigateToCompliance} />
          <MetricCard label="Pending Review" value={fmt(pending)}  onClick={onNavigateToCompliance} />
          <MetricCard label="Solved YTD"     value={fmt(solvedYTD)} onClick={onNavigateToCompliance} />
        </div>
      </div>
    </div>
  );
}
