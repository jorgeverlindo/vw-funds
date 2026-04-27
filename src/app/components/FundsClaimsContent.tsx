import { useState, useMemo } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { DateRange } from 'react-day-picker';
import { motion, AnimatePresence } from 'motion/react';
import { DateRangeInput } from './DateRangeInput';
import { DateRangePicker } from './DateRangePicker';
import { FilterSelect } from './FilterSelect';
import { BudgetForecastCard } from './BudgetForecastCard';
import { ClaimsSubmittedBans } from './ClaimsSubmittedBans';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { StatusChip, ClaimStatus } from './StatusChip';
import { Claim, Strike } from './ClaimsPanel';
import { cn } from '../../lib/utils';
import { ActionButton } from './ActionButton';
import { useWorkflow, WORKFLOW_DEALER, WORKFLOW_CAMPAIGN, type ClaimWorkflowStatus, type ArchivedCycle } from '../contexts/WorkflowContext';
import { useFilters } from '../contexts/FilterContext';
import { useOverviewData } from '../../data/access/useOverviewData';

// People portraits — Figma source of truth
import imgFabioVeloso from 'figma:asset/175d81a7864ae50d37ddf9a160e546af1d2a8ee8.png';
import imgZakFlaten from 'figma:asset/48ea8970f6d4b2ca434cf82051473b99fc39b3d9.png';
import imgJennyEckart from 'figma:asset/d484fabc75bc7296e02313bb481ed79708e6e083.png';
import imgRyanLedger from 'figma:asset/770d9bb001df989daf31ad74015dfc377b65a73d.png';
import imgGarrySchwietert from 'figma:asset/547c86f89f339b487e6c680775e87c8222c8c564.png';
import imgMalloryManning from 'figma:asset/f0494d5017440bdc302141d9ab01c7c81e4a339a.png';

// --- Static Aggregate Data (Source of Truth) ---
const MONTH_AGGREGATES = [
  { key: 'Jan 2025', accrual: '$64,236.90', submission: '$52,358.70', difference: '$11,877.30', paid: '$52,236.80 (72%)', pending: '$12,524.80 (28%)', diffColor: 'text-gray-900' },
  { key: 'Feb 2025', accrual: '$34,781.00', submission: '$50,390.09', difference: '($15,609.09)', paid: '$52,236.80 (72%)', pending: '$12,524.80 (28%)', diffColor: 'text-red-600' },
  { key: 'Mar 2025', accrual: '$29,773.00', submission: '$56,260.03', difference: '($26,487.03)', paid: '$52,236.80 (72%)', pending: '$12,524.80 (28%)', diffColor: 'text-red-600' },
  { key: 'Apr 2025', accrual: '$33,368.00', submission: '$57,554.00', difference: '($24,186.00)', paid: '$52,236.80 (72%)', pending: '$12,524.80 (28%)', diffColor: 'text-red-600' },
  { key: 'May 2025', accrual: '$17,052.00', submission: '$49,663.93', difference: '($32,611.93)', paid: '$52,236.80 (72%)', pending: '$12,524.80 (28%)', diffColor: 'text-red-600' },
  { key: 'Jun 2025', accrual: '$34,359.00', submission: '$51,260.89', difference: '($16,901.89)', paid: '$52,236.80 (72%)', pending: '$12,524.80 (28%)', diffColor: 'text-red-600' },
  { key: 'Jul 2025', accrual: '$46,211.00', submission: '$53,449.57', difference: '($7,238.57)', paid: '$52,236.80 (72%)', pending: '$12,524.80 (28%)', diffColor: 'text-red-600' },
  { key: 'Aug 2025', accrual: '$56,217.00', submission: '$65,598.84', difference: '($9,381.84)', paid: '$52,236.80 (72%)', pending: '$12,524.80 (28%)', diffColor: 'text-red-600' },
  { key: 'Sep 2025', accrual: '$59,509.00', submission: '-', difference: '-', paid: '$52,236.80 (72%)', pending: '$12,524.80 (28%)', diffColor: 'text-gray-900' },
  { key: 'Oct 2025', accrual: '$57,444.00', submission: '-', difference: '-', paid: '$52,236.80 (72%)', pending: '$12,524.80 (28%)', diffColor: 'text-gray-900' },
  { key: 'Nov 2025', accrual: '$37,496.00', submission: '-', difference: '-', paid: '$52,236.80 (72%)', pending: '$12,524.80 (28%)', diffColor: 'text-gray-900' },
  { key: 'Dec 2025', accrual: '-', submission: '-', difference: '-', paid: '$52,236.80 (72%)', pending: '$12,524.80 (28%)', diffColor: 'text-gray-900' },
  { key: 'Jan 2026', accrual: '-', submission: '-', difference: '-', paid: '$52,236.80 (72%)', pending: '$12,524.80 (28%)', diffColor: 'text-gray-900' },
];

// --- Mock Data ---
const AVATARS = [
  imgFabioVeloso,
  imgZakFlaten,
  imgJennyEckart,
  imgRyanLedger,
  imgGarrySchwietert,
  imgMalloryManning
];

const createClaim = (id: string, date: Date, amount: number, status: ClaimStatus | 'Revision Requested', daysClaim: number, daysPay: number, dealCode: string, dealName: string, dealCity: string, fund: string, avatarIdx: number, name: string): Claim => ({
  id,
  date,
  amount,
  status: status as ClaimStatus,
  timeInClaim: daysClaim,
  timeInPayment: daysPay,
  dealershipCode: dealCode,
  dealershipName: dealName,
  dealershipCity: dealCity,
  fund,
  submittedBy: { name, avatarUrl: AVATARS[avatarIdx] }, 
  type: 'CRM AUGUST',
  lastUpdated: '3 days ago',
  details: `Claim details for ${id}. This claim covers marketing expenses for the CRM campaign.`
});

export const CLAIMS_MOCK_DATA: Claim[] = [
  createClaim('MFC539881', new Date(2026, 0, 25), 4070.05, 'Approved',          6,  6, '408252', 'Jack Daniels Volkswagen (Paramus)',     'Paramus',  'DMP - Hard Costs', 0, 'Fabio Veloso'),
  createClaim('MFC540978', new Date(2026, 0, 22), 3069.56, 'Pending',           8, 22, '423063', 'Armstrong Volkswagen of Gladstone',     'Gladstone','DMP - Hard Costs', 1, 'Zak Flaten'),
  {
    ...createClaim('MFC540989', new Date(2026, 0, 21), 3114.47, 'At risk', 9, 7, '408252', 'Jack Daniels Volkswagen (Paramus)', 'Paramus', 'DMP - Hard Costs', 2, 'Jenny Eckart'),
    underlyingStatus: 'Pending' as ClaimStatus,
    violationSummary: 'Dealer is At Risk due to 2 recent violations: missing APR disclaimer and incorrect logo usage.',
    strikes: [
      { level: 1, type: 'Incentive / Legal Violation', date: 'Jan 10, 2026', description: 'Missing APR disclaimer in lease ad.' } as Strike,
      { level: 2, type: 'Brand Misuse',                date: 'Jan 18, 2026', description: 'Incorrect Volkswagen logo usage and non-approved typography.' } as Strike,
    ],
  },
  createClaim('MFC540992', new Date(2026, 0, 21), 2268.56, 'Approved',          6,  7, '409210', 'Paramount Volkswagen of Hickory',       'Hickory',  'DMP - Hard Costs', 3, 'Ryan Ledger'),
  createClaim('MFC541000', new Date(2026, 0, 19), 2269.56, 'Approved',         10,  4, '402165', 'Volkswagen of Downtown Chicago',        'Chicago',  'DMP - Hard Costs', 4, 'Garry Schwietert'),
  createClaim('MFC539882', new Date(2026, 0, 18), 4070.05, 'Approved',          5,  4, '408252', 'Jack Daniels Volkswagen (Paramus)',     'Paramus',  'DMP - Hard Costs', 5, 'Mallory Manning'),
  createClaim('MFC540979', new Date(2026, 0, 18), 3069.56, 'Revision Requested',6,  3, '402165', 'Volkswagen of Downtown Chicago',        'Chicago',  'DMP - Hard Costs', 0, 'Fabio Veloso'),
  createClaim('MFC540990', new Date(2026, 0, 15), 3114.47, 'In Review',         4,  7, '402165', 'Volkswagen of Downtown Chicago',        'Chicago',  'DMP - Hard Costs', 1, 'Zak Flaten'),
  createClaim('MFC539883', new Date(2026, 0, 9),  4070.05, 'Approved',          8,  7, '408253', 'Jack Daniels Volkswagen (Paramus)',     'Paramus',  'DMP - Hard Costs', 2, 'Jenny Eckart'),
  createClaim('MFC540980', new Date(2026, 0, 9),  3069.56, 'Pending',           8,  8, '423063', 'Armstrong Volkswagen of Gladstone',     'Gladstone','DMP - Hard Costs', 3, 'Ryan Ledger'),
  createClaim('MFC540991', new Date(2026, 0, 8),  3114.47, 'Pending',          10,  3, '408252', 'Jack Daniels Volkswagen (Paramus)',     'Paramus',  'DMP - Hard Costs', 4, 'Garry Schwietert'),
  createClaim('MFC540993', new Date(2026, 0, 7),  2268.56, 'Approved',         10,  6, '409210', 'Paramount Volkswagen of Hickory',       'Hickory',  'DMP - Hard Costs', 5, 'Mallory Manning'),
  createClaim('MFC541001', new Date(2026, 0, 4),  2269.56, 'Approved',          4,  3, '402165', 'Volkswagen of Downtown Chicago',        'Chicago',  'DMP - Hard Costs', 0, 'Fabio Veloso'),
  createClaim('MFC539884', new Date(2026, 0, 4),  4070.05, 'Approved',          5,  4, '408252', 'Jack Daniels Volkswagen (Paramus)',     'Paramus',  'DMP - Hard Costs', 1, 'Zak Flaten'),
  createClaim('MFC540981', new Date(2026, 0, 3),  3069.56, 'Revision Requested',6,  7, '402165', 'Volkswagen of Downtown Chicago',        'Chicago',  'DMP - Hard Costs', 2, 'Jenny Eckart'),
  createClaim('MFC540994', new Date(2026, 0, 2),  3114.47, 'In Review',        10,  7, '402165', 'Volkswagen of Downtown Chicago',        'Chicago',  'DMP - Hard Costs', 3, 'Ryan Ledger'),
  createClaim('MFC550001', new Date(2025, 1, 15), 5500.00, 'Approved',          5,  5, '408252', 'Jack Daniels Volkswagen (Paramus)',     'Paramus',  'DMP - Hard Costs', 4, 'Garry Schwietert'),
  createClaim('MFC560001', new Date(2025, 2, 20), 6200.00, 'Approved',          4,  3, '402165', 'Volkswagen of Downtown Chicago',        'Chicago',  'DMP - Hard Costs', 5, 'Mallory Manning'),
  // ── Volkswagen Any Town (12345) claims ───────────────────────────────────
  // April 2026 — mix of statuses (newest first within month)
  createClaim('MFC560010', new Date(2026, 3, 27), 2850.00, 'Pending',            2,  0, '12345', 'Volkswagen Any Town', 'Any Town', 'DMF - Media Costs', 5, 'Mallory Manning'),
  createClaim('MFC560011', new Date(2026, 3, 25), 1780.00, 'In Review',          4,  0, '12345', 'Volkswagen Any Town', 'Any Town', 'DMF - Hard Costs',  5, 'Mallory Manning'),
  createClaim('MFC560012', new Date(2026, 3, 22), 3420.00, 'Approved',           7,  3, '12345', 'Volkswagen Any Town', 'Any Town', 'DMP - Hard Costs',  5, 'Mallory Manning'),
  createClaim('MFC560013', new Date(2026, 3, 20), 2100.00, 'Pending',            9,  0, '12345', 'Volkswagen Any Town', 'Any Town', 'DMF - Media Costs', 5, 'Mallory Manning'),
  createClaim('MFC560014', new Date(2026, 3, 18), 4150.00, 'In Review',         11,  0, '12345', 'Volkswagen Any Town', 'Any Town', 'DMF - Media Costs', 5, 'Mallory Manning'),
  createClaim('MFC560015', new Date(2026, 3, 15), 1890.00, 'Approved',          14,  4, '12345', 'Volkswagen Any Town', 'Any Town', 'DMF - Hard Costs',  5, 'Mallory Manning'),
  createClaim('MFC560016', new Date(2026, 3, 12), 3670.00, 'Ready for Payment', 17,  5, '12345', 'Volkswagen Any Town', 'Any Town', 'DMP - Hard Costs',  5, 'Mallory Manning'),
  createClaim('MFC560017', new Date(2026, 3, 8),  2240.00, 'Revision Requested',21,  0, '12345', 'Volkswagen Any Town', 'Any Town', 'DMF - Media Costs', 5, 'Mallory Manning'),
  // Feb 2026
  createClaim('MFC541010', new Date(2026, 1, 18), 4250.00, 'Approved',           5,  4, '12345', 'Volkswagen Any Town', 'Any Town', 'DMF - Media Costs', 5, 'Mallory Manning'),
  // Jan 2026 — old enough to be fully paid
  createClaim('MFC541013', new Date(2026, 0, 10), 3780.00, 'Paid',              16, 14, '12345', 'Volkswagen Any Town', 'Any Town', 'DMP - Hard Costs',  5, 'Mallory Manning'),
  createClaim('MFC541012', new Date(2026, 0, 22), 2190.00, 'Approved',          14, 12, '12345', 'Volkswagen Any Town', 'Any Town', 'DMF - Hard Costs',  5, 'Mallory Manning'),
  // Dec 2025
  createClaim('MFC541011', new Date(2025, 11, 15),2800.00, 'Approved',           8,  5, '12345', 'Volkswagen Any Town', 'Any Town', 'DMF - Media Costs', 5, 'Mallory Manning'),
  // Nov 2025
  createClaim('MFC541014', new Date(2025, 10, 20),3100.00, 'Approved',           6,  4, '12345', 'Volkswagen Any Town', 'Any Town', 'DMF - Media Costs', 5, 'Mallory Manning'),
  // Oct 2025
  createClaim('MFC541015', new Date(2025, 9, 12), 1950.00, 'Approved',           5,  6, '12345', 'Volkswagen Any Town', 'Any Town', 'DMF - Hard Costs',  5, 'Mallory Manning'),
  // Sep 2025
  createClaim('MFC541016', new Date(2025, 8, 8),  4600.00, 'Approved',           4,  3, '12345', 'Volkswagen Any Town', 'Any Town', 'DMP - Hard Costs',  5, 'Mallory Manning'),
];

interface FundsClaimsContentProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  selectedClaimId: string | null;
  onSelectClaim: (id: string | null) => void;
  userType?: 'dealer' | 'dealer-singular' | 'oem';
}

// Maps workflow claim status to ClaimStatus for display
function mapWorkflowClaimStatus(s: ClaimWorkflowStatus): ClaimStatus {
  switch (s) {
    case 'Approved':          return 'Approved';
    case 'Ready for Payment': return 'Ready for Payment';
    case 'Paid':              return 'Paid';
    case 'Revision Requested': return 'Revision Requested';
    case 'In Review':         return 'In Review';
    case 'Resubmitted':       return 'In Review';
    default:                  return 'Pending'; // Draft, Submitted
  }
}

function formatDays(n: number): string {
  if (n <= 0) return 'just now';
  if (n === 1) return '1 day';
  return `${n} days`;
}

function parseAmount(s: string | undefined): number | null {
  if (!s || s === '-') return null;
  const negative = s.startsWith('(');
  const num = parseFloat(s.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return null;
  return negative ? -num : num;
}

function fmtUSD(n: number): string {
  return '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function stripPct(s: string | undefined): string {
  if (!s) return '-';
  return s.replace(/\s*\(\d+%\)/, '');
}

/** Build a displayable Claim row from an archived cycle snapshot */
function archivedCycleToClaimRow(cycle: ArchivedCycle): Claim {
  const cl = cycle.claim;
  return {
    id: cl.id,
    uid: cl.id,
    date: cl.submittedAt ? new Date(cl.submittedAt) : new Date(cycle.archivedAt),
    amount: cl.invoiceTotal,
    status: cl.status ? mapWorkflowClaimStatus(cl.status) : 'Paid',
    timeInClaim: 2,
    timeInPayment: 2,
    dealershipCode: WORKFLOW_DEALER.code,
    dealershipName: WORKFLOW_DEALER.name,
    dealershipCity: WORKFLOW_DEALER.city,
    fund: 'DMF - Media Costs',
    submittedBy: { name: WORKFLOW_DEALER.contact, avatarUrl: imgMalloryManning },
    type: WORKFLOW_CAMPAIGN.initiativeType,
    lastUpdated: new Date(cycle.archivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    details: WORKFLOW_CAMPAIGN.description,
  };
}

export function FundsClaimsContent({
  dateRange,
  onDateRangeChange,
  selectedClaimId,
  onSelectClaim,
  userType = 'dealer'
}: FundsClaimsContentProps) {
  const { t } = useTranslation();
  const { workflow } = useWorkflow();
  const { filters: filterCtx, isLockedDealership } = useFilters();
  const { monthlyChart } = useOverviewData();

  // Build month-key → accrual map from filtered overview data (used in dealer-singular mode)
  const overviewAccruals = useMemo(() => {
    const map = new Map<string, number>();
    monthlyChart.forEach(row => {
      // row.month = "Jan 25" → convert to "Jan 2025"
      const [mon, yr] = row.month.split(' ');
      const fullYear = parseInt(yr) + 2000;
      map.set(`${mon} ${fullYear}`, row.accruals);
    });
    return map;
  }, [monthlyChart]);

  // Archived cycle rows — newest first
  const archivedClaimRows = useMemo(
    () => [...workflow.archivedCycles].reverse().map(archivedCycleToClaimRow),
    [workflow.archivedCycles],
  );

  const [activeFilter, setActiveFilter] = useState<ClaimStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>(() => ({
    'Jan 2026': true,
    [new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' })]: true,
  }));
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Build workflow claim item as soon as claim is created (any status, including Draft)
  const workflowClaim: Claim | null = workflow.claim.status !== null
    ? {
        id: workflow.claim.id,
        uid: workflow.claim.id,
        date: new Date(),
        amount: workflow.claim.invoiceTotal || WORKFLOW_CAMPAIGN.totalAmount,
        status: mapWorkflowClaimStatus(workflow.claim.status),
        timeInClaim: workflow.claim.submittedAt
          ? Math.round((Date.now() - new Date(workflow.claim.submittedAt).getTime()) / 86_400_000)
          : 0,
        timeInPayment: workflow.claim.status === 'Paid' ? 2 : 0,
        dealershipCode: WORKFLOW_DEALER.code,
        dealershipName: WORKFLOW_DEALER.name,
        dealershipCity: WORKFLOW_DEALER.city,
        fund: 'DMF - Media Costs',
        submittedBy: { name: WORKFLOW_DEALER.contact, avatarUrl: imgMalloryManning },
        type: WORKFLOW_CAMPAIGN.initiativeType,
        lastUpdated: 'just now',
        details: WORKFLOW_CAMPAIGN.description,
      }
    : null;

  // Filter mock claims — full filter including date range
  const filteredData = useMemo(() => {
    return CLAIMS_MOCK_DATA.filter(item => {
      // In dealer-singular mode only show records belonging to the locked dealer
      if (isLockedDealership && filterCtx.dealershipCode && item.dealershipCode !== filterCtx.dealershipCode) return false;
      if (dateRange?.from && item.date < dateRange.from) return false;
      if (dateRange?.to && item.date > dateRange.to) return false;
      if (activeFilter && item.status !== activeFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.id.toLowerCase().includes(q) ||
          item.dealershipName.toLowerCase().includes(q) ||
          item.status.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [dateRange, activeFilter, searchQuery, isLockedDealership, filterCtx.dealershipCode]);

  // Filter archived claims — respects status/search, bypasses date range
  const filteredArchivedRows = useMemo(() => {
    return archivedClaimRows.filter(cl => {
      if (activeFilter && cl.status !== activeFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return cl.id.toLowerCase().includes(q) || cl.dealershipName.toLowerCase().includes(q) || cl.status.toLowerCase().includes(q);
      }
      return true;
    });
  }, [archivedClaimRows, activeFilter, searchQuery]);

  // Workflow claim visibility — respects status/search, bypasses date range
  const workflowClaimVisible = useMemo(() => {
    if (!workflowClaim) return false;
    if (activeFilter && workflowClaim.status !== activeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        workflowClaim.id.toLowerCase().includes(q) ||
        workflowClaim.dealershipName.toLowerCase().includes(q) ||
        workflowClaim.status.toLowerCase().includes(q)
      );
    }
    return true;
  }, [workflowClaim, activeFilter, searchQuery]);

  // Stats for BANs
  const statsData = useMemo(() => {
    const baseList = CLAIMS_MOCK_DATA.filter(item => {
       if (dateRange?.from && item.date < dateRange.from) return false;
       if (dateRange?.to && item.date > dateRange.to) return false;
       if (searchQuery) {
         const q = searchQuery.toLowerCase();
         return item.id.toLowerCase().includes(q) || item.dealershipName.toLowerCase().includes(q);
       }
       return true;
    });

    return baseList.reduce((acc, curr) => {
      if (curr.status === 'Approved') {
        acc.counts.approved++;
        acc.amounts.approved += curr.amount;
      } else if (curr.status === 'Pending') {
        acc.counts.pending++;
        acc.amounts.pending += curr.amount;
      } else if (['In Review', 'Revision Requested'].includes(curr.status)) {
        acc.counts.inReview++;
        acc.amounts.inReview += curr.amount;
      }
      return acc;
    }, {
      counts: { approved: 0, pending: 0, inReview: 0 },
      amounts: { approved: 0, pending: 0, inReview: 0 }
    });
  }, [dateRange, searchQuery]);

  // Group all claims (workflow + archived + mock) by month, newest first within each group
  const groupedData = useMemo(() => {
    const all: Claim[] = [
      ...(workflowClaimVisible && workflowClaim ? [workflowClaim] : []),
      ...filteredArchivedRows,
      ...filteredData,
    ].sort((a, b) => b.date.getTime() - a.date.getTime());
    const groups: Record<string, Claim[]> = {};
    all.forEach(claim => {
      const key = claim.date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(claim);
    });
    return groups;
  }, [workflowClaim, workflowClaimVisible, filteredArchivedRows, filteredData]);

  // All month keys to render: union of MONTH_AGGREGATES + claim months, sorted newest first
  const allMonthKeys = useMemo(() => {
    const aggregateKeys = MONTH_AGGREGATES.map(m => m.key);
    const claimKeys = Object.keys(groupedData);
    const union = [...new Set([...claimKeys, ...aggregateKeys])];
    return union.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [groupedData]);

  const toggleMonth = (month: string) => {
    setExpandedMonths(prev => ({ ...prev, [month]: !prev[month] }));
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto custom-scrollbar relative">
      <div className="p-6 space-y-6">
        
        {/* Top Controls - Responsive Wrap */}
        <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
               {/* Button label fixed */}
               <ActionButton label={t('New Claim')} />
               
               {/* Search closer to button */}
               <div className="flex items-center gap-3 bg-white rounded-[20px] border border-gray-300 px-3 h-10 w-[280px]">
                  <Search className="h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('Find below')}
                    className="flex-1 bg-transparent text-sm focus:outline-none h-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <FilterSelect label="Area" value="All Areas" width="w-[110px]" />
              <FilterSelect label="Dealership" value="All Dealerships" width="w-[274px]" />
              <div className="relative">
                 <DateRangeInput 
                   startDate={dateRange?.from} 
                   endDate={dateRange?.to} 
                   onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                   onReset={(e) => {
                     e.stopPropagation();
                     onDateRangeChange({ from: new Date(2025, 0, 1), to: new Date(2026, 11, 31) });
                   }}
                 />
                 {isDatePickerOpen && (
                   <DateRangePicker 
                     initialRange={dateRange} 
                     onApply={(range) => {
                       onDateRangeChange(range);
                       setIsDatePickerOpen(false);
                     }} 
                     onCancel={() => setIsDatePickerOpen(false)}
                   />
                 )}
              </div>
            </div>
        </div>

        {/* 1. Budget Forecast - Variant Clean (Dealer Only) */}
        {userType === 'dealer' && (
          <div className="mb-8">
            <BudgetForecastCard variant="clean" />
          </div>
        )}

        {/* 2. Claims Submitted BANs */}
        <ClaimsSubmittedBans 
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={statsData.counts}
          amounts={statsData.amounts}
        />

        {/* 3. Grouped Table */}
        <div className="bg-white rounded-xl border border-[rgba(0,0,0,0.12)] overflow-hidden shadow-sm">
           {/* Table Header - Primary (Month Aggregates) */}
           <div className="overflow-x-auto">
             <div className="min-w-[1200px]">
               {/* Primary Header */}
               <div className="flex items-center bg-white border-b border-gray-200 h-12 px-4 sticky top-0 z-10">
                  <div className="w-[220px] text-[12px] font-medium text-[#1f1d25] pl-8">{t('Month')}</div>
                  <div className="w-[120px] text-[12px] font-medium text-[#1f1d25]">{t('Accrual')}</div>
                  <div className="w-[120px] text-[12px] font-medium text-[#1f1d25]">{t('Submission')}</div>
                  <div className="w-[120px] text-[12px] font-medium text-[#1f1d25]">{t('Difference')}</div>
                  <div className="w-[140px] text-[12px] font-medium text-[#1f1d25]">{t('Paid')}</div>
                  <div className="w-[140px] text-[12px] font-medium text-[#1f1d25]">{t('Pending')}</div>
               </div>

               {/* Unified accordion — workflow + archived + mock claims, grouped by month */}
               {allMonthKeys.map(monthKey => {
                  const monthData = MONTH_AGGREGATES.find(m => m.key === monthKey);
                  const claims = groupedData[monthKey] || [];
                  const isExpanded = expandedMonths[monthKey];

                  // Compute aggregates from actual claim rows when present
                  const computedSubmissionNum = claims.length > 0
                    ? claims.reduce((sum, c) => sum + c.amount, 0)
                    : null;
                  // In dealer-singular mode use per-dealer overview accruals; otherwise use static table
                  const accrualNum = isLockedDealership
                    ? (overviewAccruals.get(monthKey) ?? null)
                    : parseAmount(monthData?.accrual);
                  const submissionNum = computedSubmissionNum ?? parseAmount(monthData?.submission);
                  const differenceNum = (accrualNum !== null && submissionNum !== null)
                    ? accrualNum - submissionNum
                    : null;

                  const accrualDisplay = accrualNum !== null ? fmtUSD(accrualNum) : '-';
                  const submissionDisplay = submissionNum !== null ? fmtUSD(submissionNum) : '-';
                  const differenceDisplay = differenceNum !== null
                    ? differenceNum < 0 ? `(${fmtUSD(differenceNum)})` : fmtUSD(differenceNum)
                    : '-';
                  const differenceColor = differenceNum !== null && differenceNum < 0 ? 'text-red-600' : 'text-gray-900';
                  // Paid/Pending static values are multi-dealer aggregates — hide in dealer-singular mode
                  const paidDisplay    = isLockedDealership ? '-' : stripPct(monthData?.paid);
                  const pendingDisplay = isLockedDealership ? '-' : stripPct(monthData?.pending);

                  return (
                    <div key={monthKey} className="group-container">
                      <div
                        onClick={() => toggleMonth(monthKey)}
                        className="flex items-center bg-white border-b border-gray-200 h-14 px-4 cursor-pointer hover:bg-gray-50 transition-colors select-none"
                      >
                        <div className="flex items-center gap-2 w-[220px]">
                          <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
                            <ChevronDown className="w-5 h-5 text-gray-500/80" />
                          </div>
                          <span className="text-[14px] font-medium text-[#1f1d25] tracking-[0.17px]">{monthKey}</span>
                        </div>
                        <div className="flex items-center text-[12px] text-[#1f1d25] gap-0">
                          <div className={`w-[120px] font-normal ${accrualNum !== null ? '' : 'text-[#686576]'}`}>{accrualDisplay}</div>
                          <div className={`w-[120px] font-normal ${submissionNum !== null ? '' : 'text-[#686576]'}`}>{submissionDisplay}</div>
                          <div className={`w-[120px] font-normal ${differenceNum !== null ? differenceColor : 'text-[#686576]'}`}>{differenceDisplay}</div>
                          <div className={`w-[140px] font-normal ${monthData?.paid ? '' : 'text-[#686576]'}`}>{paidDisplay}</div>
                          <div className={`w-[140px] font-normal ${monthData?.pending ? '' : 'text-[#686576]'}`}>{pendingDisplay}</div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && claims.length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden bg-[#F9FAFA] border-b border-gray-100"
                          >
                            <div className="flex items-center h-10 px-4 border-b border-gray-200/50 bg-[#F9FAFA]">
                              <div className="w-[120px] pl-4 text-[11px] font-medium text-gray-500">{t('Date')}</div>
                              <div className="w-[100px] text-[11px] font-medium text-gray-500">{t('ID')}</div>
                              <div className="w-[100px] text-[11px] font-medium text-gray-500">{t('Amount')}</div>
                              <div className="w-[160px] text-[11px] font-medium text-gray-500">{t('Status')}</div>
                              <div className="w-[100px] text-[11px] font-medium text-gray-500">{t('Time in claim')}</div>
                              <div className="w-[120px] text-[11px] font-medium text-gray-500">{t('Time in payment')}</div>
                              <div className="flex-1 min-w-[200px] text-[11px] font-medium text-gray-500">{t('Dealership')}</div>
                              <div className="w-[140px] text-[11px] font-medium text-gray-500">{t('Fund')}</div>
                              <div className="w-[160px] text-[11px] font-medium text-gray-500">{t('Submitted by')}</div>
                            </div>
                            {claims.map(claim => (
                              <div
                                key={`${claim.id}-${claim.date.getTime()}`}
                                onClick={() => onSelectClaim(claim.id)}
                                className={cn(
                                  "flex items-center h-[52px] border-b border-gray-100 last:border-0 transition-colors cursor-pointer px-4",
                                  selectedClaimId === claim.id ? "bg-[#F2F1FF]" : "bg-[#F9FAFA] hover:bg-gray-100"
                                )}
                              >
                                <div className="w-[120px] pl-4 text-[12px] text-[#1f1d25]">
                                  {claim.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                                <div className="w-[100px] text-[12px] text-[#1f1d25] font-medium">{claim.id}</div>
                                <div className="w-[100px] text-[12px] text-[#1f1d25]">${claim.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                <div className="w-[160px] pr-2">
                                  <StatusChip
                                    status={
                                      claim.status === 'At risk' && userType !== 'oem'
                                        ? (claim.underlyingStatus ?? 'Pending')
                                        : claim.status
                                    }
                                  />
                                </div>
                                <div className="w-[100px] text-[12px] text-[#1f1d25]">{formatDays(claim.timeInClaim)}</div>
                                <div className="w-[120px] text-[12px] text-[#1f1d25]">{formatDays(claim.timeInPayment)}</div>
                                <div className="flex-1 min-w-[200px] text-[12px] text-[#1f1d25] truncate pr-4" title={`${claim.dealershipCode} - ${claim.dealershipName} (${claim.dealershipCity})`}>
                                  {claim.dealershipCode} - {claim.dealershipName}
                                </div>
                                <div className="w-[140px] text-[12px] text-[#1f1d25]">{claim.fund}</div>
                                <div className="w-[160px] flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden shrink-0">
                                    <ImageWithFallback src={claim.submittedBy.avatarUrl} alt={claim.submittedBy.name} className="w-full h-full object-cover" />
                                  </div>
                                  <span className="text-[12px] text-[#1f1d25] truncate">{claim.submittedBy.name}</span>
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
               })}

             </div>
           </div>
        </div>
      </div>
    </div>
  );
}