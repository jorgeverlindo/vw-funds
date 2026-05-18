import { useState, useRef, useEffect, useMemo } from 'react';
import { DateRange } from 'react-day-picker';
import { Search, MoreVertical, Plus, Settings2, Trash2, MoreHorizontal } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { DateRangeInput } from './DateRangeInput';
import { DateRangePicker } from './DateRangePicker';
import { FilterSelect } from './FilterSelect';
import { StatusChip, SeverityChip } from './StatusChip';
import { cn } from '../../lib/utils';
import type { WCMItem } from '../../data/types/compliance';

// Re-export so existing importers continue to work without changes
export type { WCMItem };

// ─── Mock Data ────────────────────────────────────────────────────────────────

// [FV] source field added — distributed mix of Web Monitoring (automated crawler) and Manually Added (OEM-logged)
export const WCM_DATA: readonly WCMItem[] = [
  { id: 'WCM-24091', detectedOn: 'Jan 28, 2026', dealership: 'Jack Daniels Volkswagen',       violationType: 'Missing legal disclaimer (APR)',              source: 'Web Monitoring',  url: 'jackdanielsvw.com/lease-offers',   severity: 'High',   status: 'Open' },
  { id: 'WCM-24092', detectedOn: 'Jan 27, 2026', dealership: 'Emich Volkswagen',               violationType: 'Incorrect monthly payment advertised',         source: 'Manually Added',  url: 'emichvw.com/id4-deals',            severity: 'Medium', status: 'In Review' },
  { id: 'WCM-24101', detectedOn: 'Jan 27, 2026', dealership: 'Jack Daniels Volkswagen',       violationType: 'Expired incentive promoted on landing page',  source: 'Web Monitoring',  url: 'jackdanielsvw.com/atlas-specials', severity: 'Medium', status: 'In Review' },
  { id: 'WCM-24093', detectedOn: 'Jan 26, 2026', dealership: 'Volkswagen of Downtown LA',      violationType: 'Expired offer still promoted',                 source: 'Web Monitoring',  url: 'vwdtla.com/specials',              severity: 'High',   status: 'Penalty Applied' },
  { id: 'WCM-24094', detectedOn: 'Jan 25, 2026', dealership: 'Jim Ellis Volkswagen',           violationType: 'Incorrect OEM logo usage',                    source: 'Manually Added',  url: 'jimellisvw.com',                   severity: 'Low',    status: 'Resolved' },
  { id: 'WCM-24095', detectedOn: 'Jan 25, 2026', dealership: 'Hendrick Volkswagen Frisco',     violationType: 'SEM bidding on restricted keywords',          source: 'Web Monitoring',  url: 'hendrickvwfrisco.com/search',      severity: 'Medium', status: 'Open' },
  { id: 'WCM-24102', detectedOn: 'Jan 24, 2026', dealership: 'Jack Daniels Volkswagen',       violationType: 'SEM bidding on restricted brand keywords',    source: 'Manually Added',  url: 'jackdanielsvw.com/search',         severity: 'Low',    status: 'Resolved' },
  { id: 'WCM-24096', detectedOn: 'Jan 24, 2026', dealership: 'Volkswagen of Union',            violationType: 'Incentive not OEM-approved',                  source: 'Web Monitoring',  url: 'vwunion.com/taos',                 severity: 'Medium', status: 'In Review' },
  { id: 'WCM-24097', detectedOn: 'Jan 23, 2026', dealership: 'Palisades Volkswagen',           violationType: 'Unauthorized creative modification',          source: 'Manually Added',  url: 'palisadesvw.com',                  severity: 'High',   status: 'Open' },
  { id: 'WCM-24103', detectedOn: 'Jan 22, 2026', dealership: 'Jack Daniels Volkswagen',       violationType: 'Unapproved trade-in offer messaging',         source: 'Web Monitoring',  url: 'jackdanielsvw.com/trade-in',       severity: 'Medium', status: 'Open' },
  { id: 'WCM-24098', detectedOn: 'Jan 22, 2026', dealership: 'Trend Motors Volkswagen',        violationType: 'Missing offer expiration date',               source: 'Web Monitoring',  url: 'trendmotorsvw.com',                severity: 'Low',    status: 'Open' },
  { id: 'WCM-24099', detectedOn: 'Jan 21, 2026', dealership: 'Open Road Volkswagen Manhattan', violationType: 'SEO misuse of trademarked terms',             source: 'Manually Added',  url: 'openroadvw.com/seo',               severity: 'Medium', status: 'In Review' },
  { id: 'WCM-24100', detectedOn: 'Jan 20, 2026', dealership: 'Douglas Volkswagen',             violationType: 'Non-compliant landing page (offer mismatch)', source: 'Web Monitoring',  url: 'douglasvw.com/atlas',              severity: 'High',   status: 'Open' },
];

// ─── Status mapping: WCM status → StatusChip variant ─────────────────────────
// Open → 'Open', In Review → 'In Review', Resolved → 'Approved', Penalty Applied → 'Penalty Applied'
export function wcmStatusToChipStatus(status: string): string {
  switch (status) {
    case 'Open':            return 'Open';
    case 'In Review':       return 'In Review';
    case 'Resolved':        return 'Approved';
    case 'Penalty Applied': return 'Penalty Applied';
    default:                return status;
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
  // [FV] fim
}

// ─── Column definitions ───────────────────────────────────────────────────────
const COLUMNS = [
  { label: 'Detected On',    minWidth: 'min-w-[120px]' },
  { label: 'ID',             minWidth: 'min-w-[100px]' },
  { label: 'Dealership',     minWidth: 'min-w-[212px]' },
  { label: 'Violation Type', minWidth: 'min-w-[264px]' },
  { label: 'Source',         minWidth: 'min-w-[150px]' }, // [FV]
  { label: 'Added By',       minWidth: 'min-w-[180px]' }, // [FV] dealer reporter name (when applicable)
  { label: 'Website / URL',  minWidth: 'min-w-[210px]' },
  { label: 'Severity',       minWidth: 'min-w-[140px]' },
  { label: 'Status',         minWidth: 'min-w-[160px]' },
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
  userType = 'oem',
}: WebMonitoringContentProps) {
  const { t } = useTranslation();
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

  // [FV] início — combine user-added rows (pinned at top) with the static dataset
  const sourceData = useMemo<readonly WCMItem[]>(
    () => [...(userAddedInfractions ?? []), ...WCM_DATA],
    [userAddedInfractions],
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
    });
  }, [searchQuery, dealershipFilter, reportedByFilter, sourceData, deletedInfractionIds /* [FV] */]);

  // [FV] início — right-click context menu state
  const [contextMenu, setContextMenu] = useState<{ id: string; status: string; x: number; y: number } | null>(null);
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [contextMenu]);
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
      <div className="flex-1 flex flex-col min-w-0 bg-white border-t border-gray-200">
        <div className="flex-1 overflow-auto custom-scrollbar">
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
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(0,0,0,0.08)]">
              {filteredData.map((row) => {
                const isSelected = selectedId === row.id;
                return (
                  <tr
                    key={row.id}
                    onClick={() => onSelectItem(row.id)}
                    onContextMenu={(onDeleteInfraction || onReopenInfraction) ? (e) => {
                      e.preventDefault();
                      setContextMenu({ id: row.id, status: row.status, x: e.clientX, y: e.clientY });
                    } : undefined /* [FV] */}
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
                      <div className="truncate" title={row.violationType}>
                        {row.violationType}
                      </div>
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

                    {/* Website / URL — 210px, text-xs text-[#473BAB] hover:underline */}
                    <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                      <a
                        href={/* [FV] avoid double https:// when stored URL already has a protocol */
                          /^https?:\/\//i.test(row.url) ? row.url : `https://${row.url}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[#473BAB] hover:underline"
                      >
                        {row.url}
                      </a>
                    </td>

                    {/* Severity — SeverityChip */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <SeverityChip severity={row.severity} />
                    </td>

                    {/* Status — StatusChip with mapping + MoreVertical on hover */}
                    <td className="px-4 py-3.5 whitespace-nowrap pr-10 relative">
                      {/* [FV] solutions take precedence over the row's own status */}
                      <StatusChip status={
                        caseSolutions?.[row.id]?.solved
                          ? 'Solved'
                          : caseSolutions?.[row.id]
                            ? 'Solution Submitted'
                            : wcmStatusToChipStatus(row.status)
                      } />

                      {/* More Actions — visible on hover or when selected, same as FundsPreApprovalsContent */}
                      <div
                        className={cn(
                          'absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity',
                          isSelected && 'opacity-100',
                        )}
                      >
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded-full hover:bg-black/5 text-[#1f1d25]/60"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
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

      {/* [FV] right-click context menu */}
      {contextMenu && (onDeleteInfraction || (onReopenInfraction && contextMenu.status === 'Resolved')) && (
        <div
          className="fixed z-50 min-w-[180px] bg-white rounded-lg shadow-lg border border-black/10 py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {onReopenInfraction && contextMenu.status === 'Resolved' && (
            <button
              type="button"
              onClick={() => { onReopenInfraction(contextMenu.id); setContextMenu(null); }}
              className="w-full text-left px-3 py-2 text-sm text-[#014361] hover:bg-[#E1F5FE] flex items-center gap-2"
            >
              <div className="w-4 h-4 flex items-center justify-center rounded-full border border-[#03A9F4] text-[#03A9F4]">
                <MoreHorizontal className="w-2.5 h-2.5" />
              </div>
              Reopen infraction
            </button>
          )}
          {onDeleteInfraction && (
            <button
              type="button"
              onClick={() => { onDeleteInfraction(contextMenu.id); setContextMenu(null); }}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete infraction
            </button>
          )}
        </div>
      )}
    </div>
  );
}