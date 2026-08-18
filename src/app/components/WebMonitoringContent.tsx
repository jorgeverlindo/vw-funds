import { useState, useRef, useEffect, useMemo } from 'react';
import { DateRange } from 'react-day-picker';
import { Search, MoreVertical, Plus, Settings2, X } from 'lucide-react';
import { ComplianceRowMenu, type ComplianceRowMenuAnchor } from './ComplianceRowMenu';
import { useTranslation } from '../contexts/LanguageContext';
import { DateRangeInput } from './DateRangeInput';
import { DateRangePicker } from './DateRangePicker';
import { FilterSelect } from './FilterSelect';
import { StatusChip, SeverityChip } from './StatusChip';
import { cn } from '../../lib/utils';
import type { WCMItem } from '../../data/types/compliance';
import { useCompliance } from '../contexts/ComplianceContext';
import jackDanielsComplianceImg from '../../../guidelines/Infractions/jack-daniels-compliance2.png';

// Re-export so existing importers continue to work without changes
export type { WCMItem };

// ─── Mock Data ────────────────────────────────────────────────────────────────

// [FV] source field added — distributed mix of Web Monitoring (automated crawler) and Manually Added (OEM-logged)
export const WCM_DATA: readonly WCMItem[] = [
  { id: 'WCM-24091', detectedOn: 'Jan 28, 2026', dealership: 'Jack Daniels Volkswagen',       violationType: 'Missing legal disclaimer (APR)',              source: 'Web Monitoring',  url: 'jackdanielsvw.com/lease-offers',   severity: 'High',   status: 'Open',        channel: 'website' },
  { id: 'WCM-24092', detectedOn: 'Jan 27, 2026', dealership: 'Emich Volkswagen',               violationType: 'Incorrect monthly payment advertised',         source: 'Manually Added',  url: 'emichvw.com/id4-deals',            severity: 'Medium', status: 'In Review',   channel: 'website', reportedBy: 'Jenny Eckhart' },
  { id: 'WCM-24101', detectedOn: 'Jan 27, 2026', dealership: 'Jack Daniels Volkswagen',       violationType: 'Expired incentive promoted on landing page',  source: 'Web Monitoring',  url: 'jackdanielsvw.com/atlas-specials', severity: 'Medium', status: 'In Review',   channel: 'website' },
  { id: 'WCM-24093', detectedOn: 'Jan 26, 2026', dealership: 'Volkswagen of Downtown LA',      violationType: 'Expired offer still promoted',                 source: 'Web Monitoring',  url: 'vwdtla.com/specials',              severity: 'High',   status: 'Penalty Applied', channel: 'website' },
  { id: 'WCM-24094', detectedOn: 'Jan 25, 2026', dealership: 'Jim Ellis Volkswagen',           violationType: 'Incorrect OEM logo usage',                    source: 'Manually Added',  url: 'jimellisvw.com',                   severity: 'Low',    status: 'Resolved',    channel: 'website', reportedBy: 'Jenny Eckhart' },
  { id: 'WCM-24095', detectedOn: 'Jan 25, 2026', dealership: 'Hendrick Volkswagen Frisco',     violationType: 'SEM bidding on restricted keywords',          source: 'Web Monitoring',  url: 'hendrickvwfrisco.com/search',      severity: 'Medium', status: 'Open',        channel: 'website' },
  { id: 'WCM-24102', detectedOn: 'Jan 24, 2026', dealership: 'Jack Daniels Volkswagen',       violationType: 'SEM bidding on restricted brand keywords',    source: 'Manually Added',  url: 'jackdanielsvw.com/search',         severity: 'Low',    status: 'Resolved',    channel: 'website', reportedBy: 'Jenny Eckhart' },
  { id: 'WCM-24096', detectedOn: 'Jan 24, 2026', dealership: 'Volkswagen of Union',            violationType: 'Incentive not OEM-approved',                  source: 'Web Monitoring',  url: 'vwunion.com/taos',                 severity: 'Medium', status: 'In Review',   channel: 'website' },
  { id: 'WCM-24097', detectedOn: 'Jan 23, 2026', dealership: 'Palisades Volkswagen',           violationType: 'Unauthorized creative modification',          source: 'Manually Added',  url: 'palisadesvw.com',                  severity: 'High',   status: 'Open',        channel: 'website', reportedBy: 'Jenny Eckhart' },
  { id: 'WCM-24103', detectedOn: 'Jan 22, 2026', dealership: 'Jack Daniels Volkswagen',       violationType: 'Unapproved trade-in offer messaging',         source: 'Web Monitoring',  url: 'jackdanielsvw.com/trade-in',       severity: 'Medium', status: 'Open',        channel: 'website' },
  { id: 'WCM-24098', detectedOn: 'Jan 22, 2026', dealership: 'Trend Motors Volkswagen',        violationType: 'Missing offer expiration date',               source: 'Web Monitoring',  url: 'trendmotorsvw.com',                severity: 'Low',    status: 'Open',        channel: 'website' },
  { id: 'WCM-24099', detectedOn: 'Jan 21, 2026', dealership: 'Open Road Volkswagen Manhattan', violationType: 'SEO misuse of trademarked terms',             source: 'Manually Added',  url: 'openroadvw.com/seo',               severity: 'Medium', status: 'In Review',   channel: 'website', reportedBy: 'Jenny Eckhart' },
  { id: 'WCM-24100', detectedOn: 'Jan 20, 2026', dealership: 'Douglas Volkswagen',             violationType: 'Non-compliant landing page (offer mismatch)', source: 'Web Monitoring',  url: 'douglasvw.com/atlas',              severity: 'High',   status: 'Open',        channel: 'website' },

  // ── DMP Lifecycle demo rows (Emich + others) ─────────────────────────────────
  // DETECTED — crawler flagged, no action taken yet
  {
    id: 'WCM-24110', detectedOn: 'Feb 3, 2026', dealership: 'Emich Volkswagen',
    violationType: 'DBA name oversize on co-op digital ad',
    source: 'Web Monitoring', url: 'emichvw.com/coop-ads', severity: 'High',
    status: 'Open', channel: 'website',
    lifecycleStatus: 'DETECTED',
  },
  // IN_REVIEW — OEM opened the case; mock pins let the user confirm/reject findings
  {
    id: 'WCM-24111', detectedOn: 'Feb 1, 2026', dealership: 'Emich Volkswagen',
    violationType: 'Incorrect APR disclosure on lease offer',
    source: 'Web Monitoring', url: 'emichvw.com/id4-lease', severity: 'High',
    status: 'In Review', channel: 'website',
    lifecycleStatus: 'IN_REVIEW',
    pins: [
      { title: 'Rule 3B — DBA Name Oversize', description: 'Dealer name rendered at 120% of allowed proportion relative to VW wordmark.', x: 30, y: 25, direction: 'bottom-right', category: 'A', ruleNumber: '3B', findingStatus: 'pending' },
      { title: 'Rule 5A — Missing APR', description: 'Monthly payment promoted without the required APR disclosure footnote.', x: 68, y: 60, direction: 'bottom-left', category: 'A', ruleNumber: '5A', findingStatus: 'pending' },
    ],
  },
  // NOTIFIED — 3rd notification letter, penalty ladder step 2 (3 months withheld)
  {
    id: 'WCM-24112', detectedOn: 'Jan 10, 2026', dealership: 'Emich Volkswagen',
    violationType: 'Non-compliant price disclosure on SEM landing page',
    source: 'Web Monitoring', url: 'emichvw.com/sem-landing', severity: 'High',
    status: 'Open', channel: 'website',
    lifecycleStatus: 'NOTIFIED',
    caseCategory: 'A',
    notificationNumber: 3,
    notifiedAt: '2026-01-15T10:00:00Z',
    appealDeadline: '2026-02-14T10:00:00Z',
    penaltyStep: 2,
    lifecycleHistory: [
      { id: 'lce-001', timestampISO: '2026-01-10T09:00:00Z', actor: 'Jenny Eckhart', actorRole: 'oem', type: 'DETECTED', label: 'Infraction detected by web crawler' },
      { id: 'lce-002', timestampISO: '2026-01-12T11:30:00Z', actor: 'Jenny Eckhart', actorRole: 'oem', type: 'IN_REVIEW', label: 'Case opened for review' },
      { id: 'lce-003', timestampISO: '2026-01-15T10:00:00Z', actor: 'Jenny Eckhart', actorRole: 'oem', type: 'NOTIFIED', label: 'Notification Letter #3 issued' },
    ],
  },
  // REMEDIATION_PENDING — appeal denied, dealer must fix before re-monitoring
  {
    id: 'WCM-24113', detectedOn: 'Dec 15, 2025', dealership: 'Emich Volkswagen',
    violationType: 'Unauthorized trade-in incentive messaging',
    source: 'Web Monitoring', url: 'emichvw.com/trade-in', severity: 'Medium',
    status: 'In Review', channel: 'website',
    lifecycleStatus: 'REMEDIATION_PENDING',
    caseCategory: 'B',
    notificationNumber: 2,
    notifiedAt: '2025-12-20T10:00:00Z',
    appealStatus: 'denied',
    appealSubmittedAt: '2025-12-28T14:00:00Z',
    penaltyStep: 1,
    lifecycleHistory: [
      { id: 'lce-010', timestampISO: '2025-12-15T09:00:00Z', actor: 'Jenny Eckhart', actorRole: 'oem', type: 'DETECTED', label: 'Infraction detected by web crawler' },
      { id: 'lce-011', timestampISO: '2025-12-20T10:00:00Z', actor: 'Jenny Eckhart', actorRole: 'oem', type: 'NOTIFIED', label: 'Notification Letter #2 issued' },
      { id: 'lce-012', timestampISO: '2025-12-28T14:00:00Z', actor: 'Katelyn Gray', actorRole: 'dealer', type: 'APPEAL_SUBMITTED', label: 'Appeal submitted by dealer' },
      { id: 'lce-013', timestampISO: '2026-01-05T11:00:00Z', actor: 'Jenny Eckhart', actorRole: 'oem', type: 'APPEAL_DENIED', label: 'Appeal denied by OEM' },
    ],
  },
  // NOTIFIED #4 — Emich near maximum; awardsIneligible, 6 months withheld, one step from final penalty
  {
    id: 'SCN-JD2601', detectedOn: 'Aug 18, 2026', createdAtISO: '2026-08-18T23:59:00Z', dealership: 'Jack Daniels Volkswagen',
    violationType: "'Starting at' prices on 11 out-of-stock models — Rule 6A bona fide offer; Rule 6E trim not disclosed",
    source: 'Web Monitoring', url: 'jackdanielsvolkswagen.com/new-inventory', severity: 'High',
    status: 'Open', channel: 'website',
    lifecycleStatus: 'NOTIFIED',
    caseCategory: 'B',
    notificationNumber: 4,
    notifiedAt: '2026-05-15T10:00:00Z',
    appealDeadline: '2026-06-14T10:00:00Z',
    penaltyStep: 3,
    penaltyStartMonth: '2026-07',
    awardsIneligible: true,
    screenshotDataUrl: jackDanielsComplianceImg,
    comments: `1. [CAT-B-6A] Rule 6A — Bona Fide Offer Required — All 11 model cards display "Starting at" prices alongside an "Out of Stock" badge: Arteon $50,433; Atlas $44,343; Atlas Cross Sport $37,483; Golf GTI $37,073; Golf R $51,938; ID. Buzz $55,253; ID.4 $41,778; Jetta $26,478; Jetta GLI $36,228; Taos $29,183; Tiguan $33,488. Disclosing out-of-stock status does not cure the violation — the rule requires the offer to be on a vehicle currently available for sale.\n2. [CAT-B-6E] Rule 6E — 'Starting At' Requires Trim Disclosure — None of the 11 "Starting at" price cards disclose the trim level. The rule explicitly requires model name, year, and trim to be clearly disclosed alongside any "starting at" price.`,
    pins: [
      {
        title: "Rule 6A — Bona Fide Offer Required",
        description: "11 model cards show 'Starting at' prices with Out of Stock badges. A bona fide offer must be on a vehicle available for sale — out-of-stock disclosure does not cure the violation.",
        x: 28, y: 60, direction: 'top-right' as const, category: 'B', ruleNumber: '6A',
      },
      {
        title: "Rule 6E — 'Starting At' Must Disclose Trim",
        description: "None of the 11 'Starting at' prices include the required trim level. Model name, year, and trim must all be clearly stated.",
        x: 68, y: 65, direction: 'top-left' as const, category: 'B', ruleNumber: '6E',
      },
    ],
    lifecycleHistory: [
      { id: 'lce-jd01', timestampISO: '2025-08-05T08:30:00Z', actor: 'OEM', actorRole: 'oem', type: 'DETECTED', label: 'Infraction detected by web crawler' },
      { id: 'lce-jd02', timestampISO: '2025-08-07T11:00:00Z', actor: 'OEM', actorRole: 'oem', type: 'IN_REVIEW', label: 'Case opened for review' },
      { id: 'lce-jd03', timestampISO: '2025-08-12T10:00:00Z', actor: 'OEM', actorRole: 'oem', type: 'NOTIFIED', label: 'Notification Letter #1 issued — Warning, no financial impact' },
      { id: 'lce-jd04', timestampISO: '2025-08-20T09:15:00Z', actor: 'Sarah Mitchell', actorRole: 'dealer', type: 'APPEAL_SUBMITTED', label: 'Appeal submitted by dealer' },
      { id: 'lce-jd05', timestampISO: '2025-09-02T14:00:00Z', actor: 'OEM', actorRole: 'oem', type: 'APPEAL_DENIED', label: 'Appeal denied by OEM' },
      { id: 'lce-jd06', timestampISO: '2025-10-12T10:00:00Z', actor: 'OEM', actorRole: 'oem', type: 'ESCALATED', label: 'Penalty assigned — Notification Letter #2 issued (1 month withheld)' },
      { id: 'lce-jd07', timestampISO: '2025-10-20T16:00:00Z', actor: 'Sarah Mitchell', actorRole: 'dealer', type: 'APPEAL_SUBMITTED', label: 'Appeal submitted by dealer' },
      { id: 'lce-jd08', timestampISO: '2025-11-03T11:00:00Z', actor: 'OEM', actorRole: 'oem', type: 'APPEAL_DENIED', label: 'Appeal denied by OEM' },
      { id: 'lce-jd09', timestampISO: '2026-01-22T10:00:00Z', actor: 'OEM', actorRole: 'oem', type: 'ESCALATED', label: 'Penalty assigned — Notification Letter #3 issued (3 months withheld)' },
      { id: 'lce-jd10', timestampISO: '2026-02-01T09:00:00Z', actor: 'Sarah Mitchell', actorRole: 'dealer', type: 'APPEAL_SUBMITTED', label: 'Appeal submitted by dealer' },
      { id: 'lce-jd11', timestampISO: '2026-02-14T15:30:00Z', actor: 'OEM', actorRole: 'oem', type: 'APPEAL_DENIED', label: 'Appeal denied by OEM' },
      { id: 'lce-jd12', timestampISO: '2026-05-15T10:00:00Z', actor: 'OEM', actorRole: 'oem', type: 'ESCALATED', label: 'Penalty assigned — Notification Letter #4 issued (6 months withheld, Awards ineligible)' },
    ],
  },
  // CURED — successful remediation, case closed
  {
    id: 'WCM-24114', detectedOn: 'Nov 20, 2025', dealership: 'Jim Ellis Volkswagen',
    violationType: 'Expired incentive still active on landing page',
    source: 'Web Monitoring', url: 'jimellisvw.com/specials', severity: 'Medium',
    status: 'Resolved', channel: 'website',
    lifecycleStatus: 'CURED',
    caseCategory: 'B',
    notificationNumber: 1,
    penaltyStep: 0,
  },
  // DISMISSED — findings not substantiated after OEM review
  {
    id: 'WCM-24115', detectedOn: 'Nov 10, 2025', dealership: 'Hendrick Volkswagen Frisco',
    violationType: 'Suspected unauthorized creative modification',
    source: 'Web Monitoring', url: 'hendrickvwfrisco.com/creative', severity: 'Low',
    status: 'Resolved', channel: 'website',
    lifecycleStatus: 'DISMISSED',
  },
];

// ─── Status mapping: WCM status → StatusChip variant ─────────────────────────
// Open → 'Open', In Review → 'In Review', Resolved → 'Approved', Penalty Applied → 'Penalty Applied'
export function wcmStatusToChipStatus(status: string): string {
  switch (status) {
    // Legacy status strings (static WCM_DATA rows)
    case 'Open':            return 'Open';
    case 'In Review':       return 'In Review';
    case 'Resolved':        return 'Approved';
    case 'Penalty Applied': return 'Penalty Applied';
    // DMP Lifecycle statuses (WCMLifecycleStatus)
    case 'DETECTED':            return 'Detected';
    case 'IN_REVIEW':           return 'In Review';
    case 'NOTIFIED':            return 'Notified';
    case 'REMEDIATION_PENDING': return 'Remediation Pending';
    case 'RE_MONITORING':       return 'Re-Monitoring';
    case 'DISMISSED':           return 'Dismissed';
    case 'CURED':               return 'Cured';
    case 'APPEAL_GRANTED':      return 'Appeal Granted';
    case 'APPEAL_DENIED':       return 'Appeal Denied';
    case 'ESCALATED':           return 'Penalty Assigned';
    default:                    return status;
  }
}


// ─── Default date range (mirrors FundsPreApprovalsContent) ────────────────────
const DEFAULT_DATE_RANGE: DateRange = {
  from: new Date(2025, 0, 1),
  to:   new Date(2025, 11, 31),
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface WebMonitoringContentProps {
  selectedId: string | null;
  onSelectItem: (id: string) => void;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  // [FV] dealer-view scoping — when set, only rows for this dealership are shown
  dealershipFilter?: string;
  // [FV] also include rows the dealer reported about OTHER dealerships
  reportedByFilter?: string;
  // [FV] início — OEM Add Infraction flow
  userAddedInfractions?: WCMItem[];
  onAddInfraction?: () => void;
  userType?: 'dealer' | 'dealer-singular' | 'dealer-emich' | 'oem';
  // OEM Web Monitoring configuration modal
  onOpenWebMonitoringConfig?: () => void;
  // [FV] caseSolutions overrides row status — submitted -> Solution Submitted, solved -> Solved
  caseSolutions?: Record<string, { solved?: boolean }>;
  // [FV] right-click delete — IDs to hide from the table + handler called by the context menu
  deletedInfractionIds?: Set<string>;
  onDeleteInfraction?: (id: string) => void;
  onReopenInfraction?: (id: string) => void;
  onDuplicateInfraction?: (id: string) => void;
  onResetInfraction?: (id: string) => void;
  // [FV] fim
}

// ─── Column definitions ───────────────────────────────────────────────────────
const COLUMNS = [
  { label: 'Detected On',    minWidth: 'min-w-[120px]' },
  { label: 'ID',             minWidth: 'min-w-[100px]' },
  { label: 'Dealership',     minWidth: 'min-w-[212px]' },
  { label: 'Violation Type', minWidth: 'min-w-[264px]' },
  { label: 'Severity',       minWidth: 'min-w-[140px]' },
  { label: 'Source',         minWidth: 'min-w-[150px]' }, // [FV]
  { label: 'Channel',        minWidth: 'min-w-[130px]' },
  { label: 'Status',         minWidth: 'min-w-[160px]' },
  { label: 'Added By',       minWidth: 'min-w-[180px]' }, // [FV] dealer reporter name (when applicable)
  { label: 'Website / URL',  minWidth: 'min-w-[208px]' },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────
export function WebMonitoringContent({
  selectedId,
  onSelectItem,
  dateRange,
  onDateRangeChange,
  dealershipFilter, // [FV]
  reportedByFilter, // [FV]
  userAddedInfractions, // [FV]
  onAddInfraction, // [FV]
  onOpenWebMonitoringConfig, // [FV]
  caseSolutions, // [FV]
  deletedInfractionIds, // [FV]
  onDeleteInfraction, // [FV]
  onReopenInfraction,
  onDuplicateInfraction,
  onResetInfraction,
  userType = 'oem',
}: WebMonitoringContentProps) {
  const { t } = useTranslation();
  const { getEffectiveItem } = useCompliance();
  const [searchQuery, setSearchQuery]       = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Close date picker on outside click — same pattern as FundsPreApprovalsContent
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // [FV] início — combine user-added rows (pinned at top) with the static dataset.
  // Static WCM_DATA rows are passed through getEffectiveItem to merge any lifecycle
  // state changes that were applied via ComplianceContext.staticOverrides.
  const sourceData = useMemo<readonly WCMItem[]>(
    () => [...(userAddedInfractions ?? []), ...WCM_DATA.map(getEffectiveItem)],
    [userAddedInfractions, getEffectiveItem],
  );
  // [FV] fim

  // Filter data
  const filteredData = useMemo(() => {
    return sourceData.filter((item) => {
      // [FV] right-click delete — hide rows the user has removed
      if (deletedInfractionIds?.has(item.id)) return false;
      // [FV] início — dealer-view subselection: own dealership rows + rows the dealer reported about others
      if (dealershipFilter) {
        const isOwn = item.dealership === dealershipFilter;
        const isMyReport = !!reportedByFilter && item.reportedBy === reportedByFilter;
        if (!isOwn && !isMyReport) return false;
        // [FV] hide pending cross-dealer reports from the target dealership until OEM accepts (status → 'Open')
        if (isOwn && !!item.reportedBy && item.status === 'Pending') return false;
      }
      // [FV] fim
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.id.toLowerCase().includes(q) ||
          item.dealership.toLowerCase().includes(q) ||
          item.violationType.toLowerCase().includes(q) ||
          item.url.toLowerCase().includes(q) ||
          item.severity.toLowerCase().includes(q) ||
          item.status.toLowerCase().includes(q)
        );
      }
      return true;
    }).sort((a, b) => {
      // Pinned rows always appear first, in order
      const PINNED = ['SCN-JD2601', 'SCN-07E610'];
      const ai = PINNED.indexOf(a.id);
      const bi = PINNED.indexOf(b.id);
      if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      // Remaining rows: newest detectedOn first
      const da = new Date(a.detectedOn).getTime();
      const db = new Date(b.detectedOn).getTime();
      if (db !== da) return db - da;
      // Same date: latest createdAtISO wins
      const ca = a.createdAtISO ? new Date(a.createdAtISO).getTime() : 0;
      const cb = b.createdAtISO ? new Date(b.createdAtISO).getTime() : 0;
      return cb - ca;
    });
  }, [searchQuery, dealershipFilter, reportedByFilter, sourceData, deletedInfractionIds /* [FV] */]);

  // [FV] início — kebab menu state (portal, same pattern as VehiclesMenu)
  const [openMenu, setOpenMenu] = useState<{ id: string; status: string; anchor: ComplianceRowMenuAnchor } | null>(null);
  useEffect(() => {
    if (!openMenu) return;
    const close = () => setOpenMenu(null);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('scroll', close, true);
    };
  }, [openMenu]);
  // [FV] fim

  return (
    <div className="flex flex-col h-full relative overflow-hidden">

      {/* Controls Row — same layout/className as FundsPreApprovalsContent */}
      <div className="flex-none flex items-end justify-between p-[24px] m-[0px]">
        <div className="flex items-center gap-3">
          {/* [FV] início — Add Infraction (filled) + Web Monitoring config (outlined) — OEM only */}
          {onAddInfraction && (
            <button
              type="button"
              onClick={onAddInfraction}
              className="flex items-center gap-2 px-4 h-10 bg-[#473BAB] hover:bg-[#3D3295] text-white rounded-full text-sm font-medium transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              {userType === 'oem' ? t('Add Infraction') : t('Report Infraction')}
            </button>
          )}
          {onOpenWebMonitoringConfig && (
            <button
              type="button"
              onClick={onOpenWebMonitoringConfig}
              className="flex items-center gap-2 px-4 h-10 border border-[#473BAB] text-[#473BAB] hover:bg-[rgba(71,59,171,0.06)] rounded-full text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              <Settings2 className="w-4 h-4" />
              {t('Web Monitoring')}
            </button>
          )}
          {/* [FV] fim */}

          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={t('Find below')}
              className="pl-10 pr-4 h-10 border border-gray-300 rounded-[20px] text-sm w-[280px] focus:outline-none focus:ring-1 focus:ring-[#6200EE] focus:border-[#6200EE] transition-all bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 z-30">
          <FilterSelect label="Area"        value="All Areas"        width="w-[110px]" />
          <FilterSelect label="Dealership"  value="All Dealerships"  width="w-[274px]" />

          {/* Date Range — same pattern as FundsPreApprovalsContent */}
          <div className="relative" ref={datePickerRef}>
            <DateRangeInput
              startDate={dateRange?.from}
              endDate={dateRange?.to}
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              onReset={(e) => {
                e.stopPropagation();
                onDateRangeChange?.(DEFAULT_DATE_RANGE);
              }}
            />
            {isDatePickerOpen && (
              <DateRangePicker
                initialRange={dateRange}
                onApply={(range) => {
                  onDateRangeChange?.(range);
                  setIsDatePickerOpen(false);
                }}
                onCancel={() => setIsDatePickerOpen(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Table Section — same structure as FundsPreApprovalsContent */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-white border-t border-gray-200">
        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
          <table className="min-w-full text-left border-collapse">
            <thead className="bg-white sticky top-0 z-10 shadow-[0_1px_0_rgba(0,0,0,0.06)]">
              <tr>
                {COLUMNS.map((col) => (
                  <th
                    key={col.label}
                    className={`px-4 py-3 text-xs font-medium text-[#686576] tracking-[0.17px] border-b border-[rgba(0,0,0,0.12)] whitespace-nowrap ${col.minWidth}`}
                  >
                    {t(col.label)}
                  </th>
                ))}
                {/* Sticky kebab column header — zero-width, sticks to right */}
                {(onDeleteInfraction || onReopenInfraction || onDuplicateInfraction || onResetInfraction) && (
                  <th className="sticky right-0 z-[3] bg-white border-b border-[rgba(0,0,0,0.12)] p-0" style={{ width: 0, minWidth: 0 }} />
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(0,0,0,0.08)]">
              {filteredData.map((row) => {
                const isSelected = selectedId === row.id;
                return (
                  <tr
                    key={row.id}
                    onClick={() => onSelectItem(row.id)}
                    className={cn(
                      'group cursor-pointer transition-colors relative',
                      isSelected
                        ? 'bg-[rgba(71,59,171,0.04)] border-l-2 border-[#473BAB]'
                        : 'bg-white hover:bg-gray-50',
                    )}
                  >
                    {/* Detected On — 120px, text-xs text-[#686576] */}
                    <td className="px-4 py-3.5 text-xs text-[#686576] whitespace-nowrap">
                      {row.detectedOn}
                    </td>

                    {/* ID — 100px, text-xs font-medium text-[#1f1d25] */}
                    <td className="px-4 py-3.5 text-xs font-medium text-[#1f1d25] whitespace-nowrap">
                      {row.id}
                    </td>

                    {/* Dealership — 212px, text-xs text-[#1f1d25] */}
                    <td className="px-4 py-3.5 text-xs text-[#1f1d25] whitespace-nowrap">
                      {row.dealership}
                    </td>

                    {/* Violation Type — 264px, text-xs text-[#1f1d25] */}
                    <td className="px-4 py-3.5 text-xs text-[#1f1d25] max-w-[264px]">
                      <div className="line-clamp-2 leading-[1.4]" title={row.violationType}>
                        {row.violationType}
                      </div>
                    </td>

                    {/* Severity — SeverityChip */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <SeverityChip severity={row.severity} />
                    </td>

                    {/* [FV] Source — small chip distinguishing automated vs. manual */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border',
                          row.source === 'Manually Added'
                            ? 'bg-[rgba(71,59,171,0.08)] border-[rgba(71,59,171,0.24)] text-[#473BAB]'
                            : 'bg-[rgba(0,0,0,0.04)] border-[rgba(0,0,0,0.12)] text-[#1f1d25]/70',
                        )}
                      >
                        {t(row.source)}
                      </span>
                    </td>

                    {/* Channel */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {row.channel === 'metaAds' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border bg-[rgba(24,119,242,0.08)] border-[rgba(24,119,242,0.24)] text-[#1877F2]">
                          Meta Ads
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border bg-[rgba(0,0,0,0.04)] border-[rgba(0,0,0,0.12)] text-[#1f1d25]/70">
                          Website
                        </span>
                      )}
                    </td>

                    {/* Status — StatusChip */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {/* [FV] solutions take precedence; appeal pending adds an amber indicator */}
                      <StatusChip status={(() => {
                        // "Solution Submitted" chip yields once OEM takes a lifecycle action post-submission
                        const POST_SOLUTION_STATUSES = ['CURED', 'DISMISSED', 'RE_MONITORING', 'ESCALATED'];
                        const oemActed = POST_SOLUTION_STATUSES.includes(row.lifecycleStatus ?? '');
                        if (caseSolutions?.[row.id] && !oemActed) return 'Solution Submitted';
                        if (row.appealStatus === 'submitted') return 'Appeal Pending';
                        return wcmStatusToChipStatus(row.lifecycleStatus ?? row.status);
                      })()} />
                    </td>

                    {/* [FV] Added By — reporter name. Hidden from the *target* dealer's view: when the
                        current dealer is looking at an infraction reported AGAINST their dealership, the
                        reporter's identity stays anonymous. */}
                    <td className="px-4 py-3.5 text-xs text-[#1f1d25] whitespace-nowrap">
                      {(() => {
                        const hideForTargetDealer = !!dealershipFilter && row.dealership === dealershipFilter && !!row.reportedBy;
                        return row.reportedBy && !hideForTargetDealer
                          ? row.reportedBy
                          : <span className="text-[#9C99A9]">—</span>;
                      })()}
                    </td>

                    {/* Website / URL — 208px max, truncated with tooltip */}
                    <td className="px-4 py-3.5 text-xs max-w-[208px]">
                      <a
                        href={/* [FV] avoid double https:// when stored URL already has a protocol */
                          /^https?:\/\//i.test(row.url) ? row.url : `https://${row.url}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title={row.url}
                        className="block truncate text-[#473BAB] hover:underline"
                      >
                        {row.url}
                      </a>
                    </td>

                    {/* Sticky kebab overlay — sticks to right edge of visible pane (same pattern as VehicleInventoryGrid) */}
                    {(onDeleteInfraction || onReopenInfraction || onDuplicateInfraction || onResetInfraction) && (() => {
                      const hoverBg = isSelected
                        ? 'rgba(71,59,171,0.06)'
                        : 'rgba(249,250,251,1)';
                      return (
                        <td className="sticky right-0 z-[2] p-0 border-0" style={{ width: 0, minWidth: 0 }}>
                          <div className="invisible group-hover:visible absolute right-0 top-0 bottom-0 flex items-center pointer-events-none">
                            {/* Gradient fade */}
                            <div
                              className="h-full w-[60px] flex-none"
                              style={{ background: `linear-gradient(to right, transparent, ${hoverBg})` }}
                            />
                            {/* Solid bg + button */}
                            <div
                              className="h-full flex items-center pr-2 flex-none pointer-events-auto"
                              style={{ backgroundColor: hoverBg }}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (openMenu?.id === row.id) { setOpenMenu(null); return; }
                                  const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                                  setOpenMenu({
                                    id: row.id,
                                    status: row.status,
                                    anchor: { top: rect.bottom + 4, right: window.innerWidth - rect.right },
                                  });
                                }}
                                className="w-8 h-8 flex items-center justify-center text-[rgba(17,16,20,0.56)] bg-white hover:bg-[rgba(255,255,255,0.92)] transition-colors cursor-pointer"
                                style={{ borderRadius: 200 }}
                              >
                                {openMenu?.id === row.id ? <X size={16} /> : <MoreVertical size={16} />}
                              </button>
                            </div>
                          </div>
                        </td>
                      );
                    })()}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredData.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-sm">
              {t('No violations found matching your criteria.')}
            </div>
          )}
        </div>
      </div>

      {/* [FV] kebab portal menu — same pattern as VehiclesMenu */}
      {openMenu && (
        <ComplianceRowMenu
          anchor={openMenu.anchor}
          status={openMenu.status}
          canDelete={!!onDeleteInfraction}
          canReopen={!!onReopenInfraction}
          canDuplicate={!!onDuplicateInfraction}
          canReset={!!onResetInfraction}
          onDelete={() => { onDeleteInfraction!(openMenu.id); setOpenMenu(null); }}
          onReopen={() => { onReopenInfraction!(openMenu.id); setOpenMenu(null); }}
          onDuplicate={() => { onDuplicateInfraction!(openMenu.id); setOpenMenu(null); }}
          onReset={() => { onResetInfraction!(openMenu.id); setOpenMenu(null); }}
          onClose={() => setOpenMenu(null)}
        />
      )}
    </div>
  );
}