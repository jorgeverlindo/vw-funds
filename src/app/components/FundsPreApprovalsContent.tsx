import { useState, useRef, useEffect, useMemo } from 'react';
import { DateRange } from 'react-day-picker';
import { Search, Plus, MoreVertical } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { useWorkflow, WORKFLOW_DEALER, WORKFLOW_CAMPAIGN, WORKFLOW_PA_ID, type PreApprovalWorkflowStatus, type ArchivedCycle } from '../contexts/WorkflowContext';
import { DateRangeInput } from './DateRangeInput';
import { DateRangePicker } from './DateRangePicker';
import { FilterSelect } from './FilterSelect';
import { ActionButton } from './ActionButton';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { StatusChip } from './StatusChip';

// People portraits — Figma source of truth
import imgFabioVeloso from 'figma:asset/175d81a7864ae50d37ddf9a160e546af1d2a8ee8.png';
import imgZakFlaten from 'figma:asset/48ea8970f6d4b2ca434cf82051473b99fc39b3d9.png';
import imgJennyEckart from 'figma:asset/d484fabc75bc7296e02313bb481ed79708e6e083.png';
import imgRyanLedger from 'figma:asset/770d9bb001df989daf31ad74015dfc377b65a73d.png';
import imgGarrySchwietert from 'figma:asset/547c86f89f339b487e6c680775e87c8222c8c564.png';
import imgMalloryManning from 'figma:asset/f0494d5017440bdc302141d9ab01c7c81e4a339a.png';

// --- Types ---
export interface PreApproval {
  id: string;
  date: Date;
  dealershipCode: string;
  dealershipName: string;
  dealershipCity: string;
  status: 'Pending' | 'Approved' | 'Revision Requested' | 'In Review';
  timeInPreApproval: number;
  submittedBy: {
    name: string;
    avatarUrl: string;
  };
  mediaType: string;
  details: string;
  lastUpdated: Date;
  submittedAt: Date;
  initiativeType: string;
  claimsCount: number;
  contactEmail: string;
  description: string;
  documents: Array<{
    name: string;
    size: string;
    type: string;
  }>;
}

// --- Constants ---
const AVATARS = [
  imgFabioVeloso,
  imgZakFlaten,
  imgJennyEckart,
  imgRyanLedger,
  imgGarrySchwietert,
  imgMalloryManning
];

// --- Mock Data Construction (Exported) ---
export const MOCK_DATA: PreApproval[] = [
  {
    id: 'MFA386592',
    date: new Date(2026, 0, 6),
    dealershipCode: '408253',
    dealershipName: 'Rick Case Volkswagen Weston',
    dealershipCity: 'Weston',
    status: 'Pending',
    timeInPreApproval: 13,
    submittedBy: { name: 'Fabio Veloso', avatarUrl: AVATARS[0] },
    mediaType: 'Display/Internet Banners',
    details: 'Display Feb2025',
    lastUpdated: new Date(2026, 0, 3),
    submittedAt: new Date(2025, 1, 4),
    initiativeType: 'Pre-Approval',
    claimsCount: 1,
    contactEmail: 'complianceteam@teamvelocitymarketing.com',
    description: 'Display Feb2025',
    documents: [{ name: 'VolkswagenofDowntownChicago_59568_Feb2025_display.pdf', size: '90.96 kB', type: 'PDF' }]
  },
  {
    id: 'MFA386593',
    date: new Date(2026, 0, 3),
    dealershipCode: '408254',
    dealershipName: 'Gunther Volkswagen of Coconut Creek',
    dealershipCity: 'Coconut Creek',
    status: 'Pending',
    timeInPreApproval: 12,
    submittedBy: { name: 'Zak Flaten', avatarUrl: AVATARS[1] },
    mediaType: 'Search SEM',
    details: 'search feb2025',
    lastUpdated: new Date(2026, 0, 2),
    submittedAt: new Date(2025, 1, 3),
    initiativeType: 'Pre-Approval',
    claimsCount: 1,
    contactEmail: 'complianceteam@teamvelocitymarketing.com',
    description: 'Search SEM Campaign for February',
    documents: []
  },
  {
    id: 'MFA386594',
    date: new Date(2025, 11, 21),
    dealershipCode: '408255',
    dealershipName: 'Emich Volkswagen',
    dealershipCity: 'Denver',
    status: 'Approved',
    timeInPreApproval: 11,
    submittedBy: { name: 'Jenny Eckart', avatarUrl: AVATARS[2] },
    mediaType: 'Search SEM',
    details: 'KELLY MARCH RADIO',
    lastUpdated: new Date(2025, 11, 20),
    submittedAt: new Date(2025, 11, 10),
    initiativeType: 'Pre-Approval',
    claimsCount: 2,
    contactEmail: 'complianceteam@teamvelocitymarketing.com',
    description: 'Radio campaign for Kelly March event.',
    documents: []
  },
  {
    id: 'MFA386595',
    date: new Date(2025, 11, 16),
    dealershipCode: '408256',
    dealershipName: 'Jim Ellis Volkswagen of Chamblee',
    dealershipCity: 'Chamblee',
    status: 'Approved',
    timeInPreApproval: 9,
    submittedBy: { name: 'Ryan Ledger', avatarUrl: AVATARS[3] },
    mediaType: 'Search SEM',
    details: 'ott-march-2025',
    lastUpdated: new Date(2025, 11, 15),
    submittedAt: new Date(2025, 11, 1),
    initiativeType: 'Pre-Approval',
    claimsCount: 1,
    contactEmail: 'complianceteam@teamvelocitymarketing.com',
    description: 'OTT Campaign March 2025',
    documents: []
  },
  {
    id: 'MFA386596',
    date: new Date(2025, 11, 2),
    dealershipCode: '408257',
    dealershipName: 'Hendrick Volkswagen Frisco',
    dealershipCity: 'Frisco',
    status: 'Approved',
    timeInPreApproval: 9,
    submittedBy: { name: 'Garry Schwietert', avatarUrl: AVATARS[4] },
    mediaType: 'Search SEM',
    details: 'Facebook Feb2025',
    lastUpdated: new Date(2025, 10, 30),
    submittedAt: new Date(2025, 10, 25),
    initiativeType: 'Pre-Approval',
    claimsCount: 1,
    contactEmail: 'complianceteam@teamvelocitymarketing.com',
    description: 'Facebook social media campaign.',
    documents: []
  },
  {
    id: 'MFA386599',
    date: new Date(2025, 10, 2),
    dealershipCode: '408258',
    dealershipName: 'Volkswagen Clear Lake',
    dealershipCity: 'Webster',
    status: 'Revision Requested',
    timeInPreApproval: 5,
    submittedBy: { name: 'Mallory Manning', avatarUrl: AVATARS[5] },
    mediaType: 'Search SEM',
    details: 'search feb2025',
    lastUpdated: new Date(2025, 10, 1),
    submittedAt: new Date(2025, 10, 1),
    initiativeType: 'Pre-Approval',
    claimsCount: 1,
    contactEmail: 'complianceteam@teamvelocitymarketing.com',
    description: 'Revision requested due to image quality.',
    documents: []
  },
  {
    id: 'MFA386600',
    date: new Date(2025, 10, 1),
    dealershipCode: '408259',
    dealershipName: 'Luther Westside Volkswagen',
    dealershipCity: 'St. Louis Park',
    status: 'Pending',
    timeInPreApproval: 4,
    submittedBy: { name: 'Fabio Veloso', avatarUrl: AVATARS[0] },
    mediaType: 'Display/Internet Banners',
    details: 'These are the different variations for the ads for the Taos on San Juan, Puerto Rico.',
    lastUpdated: new Date(2025, 9, 30),
    submittedAt: new Date(2025, 9, 28),
    initiativeType: 'Pre-Approval',
    claimsCount: 3,
    contactEmail: 'complianceteam@teamvelocitymarketing.com',
    description: 'Taos San Juan campaign variations.',
    documents: []
  },
  {
    id: 'MFA386601',
    date: new Date(2025, 9, 28),
    dealershipCode: '408260',
    dealershipName: 'Lindsay Volkswagen of Dulles',
    dealershipCity: 'Sterling',
    status: 'Approved',
    timeInPreApproval: 2,
    submittedBy: { name: 'Zak Flaten', avatarUrl: AVATARS[1] },
    mediaType: 'Display',
    details: 'Más viajes con más espacio 🧑‍🧑‍🧒‍🧒🚘\n¡Estrena tu Taos 2024 a 2.90% APR a 60 meses!\nAplica a unidades Taos 2024. Sujeto a aprobación de crédito. Ciertas restricciones aplican. Unidades no necesariamente igual a las ilustradas. Más detalles en el concesionario.',
    lastUpdated: new Date(2025, 9, 28),
    submittedAt: new Date(2025, 9, 26),
    initiativeType: 'Pre-Approval',
    claimsCount: 1,
    contactEmail: 'complianceteam@teamvelocitymarketing.com',
    description: 'Spanish language campaign for Taos.',
    documents: []
  },
  {
    id: 'MFA386602',
    date: new Date(2025, 9, 25),
    dealershipCode: '408261',
    dealershipName: 'Bommarito Volkswagen of Hazelwood',
    dealershipCity: 'Hazelwood',
    status: 'Approved',
    timeInPreApproval: 1,
    submittedBy: { name: 'Jenny Eckart', avatarUrl: AVATARS[2] },
    mediaType: 'CRM',
    details: 'These are the details for the offer:\nOffer of 2.90% APR at 60 months applies to Taos 2024 units. Subject to credit approval. Certain restrictions apply. Units not necessarily the same as illustrated. See dealer for details.',
    lastUpdated: new Date(2025, 9, 24),
    submittedAt: new Date(2025, 9, 24),
    initiativeType: 'Pre-Approval',
    claimsCount: 1,
    contactEmail: 'complianceteam@teamvelocitymarketing.com',
    description: 'Taos 2024 Offer Details',
    documents: []
  },
  {
    id: 'MFA386603',
    date: new Date(2025, 9, 22),
    dealershipCode: '408262',
    dealershipName: 'Bill Jacobs Volkswagen',
    dealershipCity: 'Naperville',
    status: 'Pending',
    timeInPreApproval: 0,
    submittedBy: { name: 'Ryan Ledger', avatarUrl: AVATARS[3] },
    mediaType: 'Search SEM',
    details: 'Display Feb2025',
    lastUpdated: new Date(2025, 9, 22),
    submittedAt: new Date(2025, 9, 22),
    initiativeType: 'Pre-Approval',
    claimsCount: 1,
    contactEmail: 'complianceteam@teamvelocitymarketing.com',
    description: 'New Display campaign',
    documents: []
  }
];

const DEFAULT_DATE_RANGE: DateRange = {
  from: new Date(2025, 0, 1),
  to: new Date(2025, 11, 31),
};

export interface FundsPreApprovalsContentProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  selectedPreApprovalId: string | null;
  onSelectPreApproval: (id: string | null) => void;
}

import { PreApprovalDrawer } from './pre-approval/PreApprovalDrawer';

// Maps workflow-specific status to PreApproval.status for list display
function mapWorkflowPAStatus(s: PreApprovalWorkflowStatus): PreApproval['status'] {
  switch (s) {
    case 'Approved':           return 'Approved';
    case 'Revision Requested': return 'Revision Requested';
    case 'In Review':          return 'In Review';
    case 'Resubmitted':        return 'In Review';
    default:                   return 'Pending'; // Draft, Submitted
  }
}

/** Build a displayable PreApproval row from an archived cycle snapshot */
function archivedCycleToPA(cycle: ArchivedCycle): PreApproval {
  const pa = cycle.preApproval;
  return {
    id: pa.id,
    date: new Date(cycle.archivedAt),
    dealershipCode: WORKFLOW_DEALER.code,
    dealershipName: WORKFLOW_DEALER.name,
    dealershipCity:  WORKFLOW_DEALER.city,
    status: mapWorkflowPAStatus(pa.status),
    timeInPreApproval: 0,
    submittedBy: { name: WORKFLOW_DEALER.contact, avatarUrl: AVATARS[5] },
    mediaType: WORKFLOW_CAMPAIGN.mediaType,
    details: 'March 2026 Digital Ad Campaign — Display, Facebook, Search, Video',
    lastUpdated: new Date(cycle.archivedAt),
    submittedAt: pa.submittedAt ? new Date(pa.submittedAt) : new Date(cycle.archivedAt),
    initiativeType: WORKFLOW_CAMPAIGN.initiativeType,
    claimsCount: pa.claimsCount,
    contactEmail: WORKFLOW_DEALER.email,
    description: WORKFLOW_CAMPAIGN.description,
    documents: pa.documents,
  };
}

export function FundsPreApprovalsContent({
  dateRange,
  onDateRangeChange,
  searchQuery,
  onSearchQueryChange,
  selectedPreApprovalId,
  onSelectPreApproval
}: FundsPreApprovalsContentProps) {
  const { t } = useTranslation();
  const { workflow } = useWorkflow();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Build the live workflow pre-approval item from shared context
  const workflowPreApproval: PreApproval = {
    id: WORKFLOW_PA_ID,
    date: new Date(),   // always today — avoids UTC-offset display bug
    dealershipCode: WORKFLOW_DEALER.code,
    dealershipName: WORKFLOW_DEALER.name,
    dealershipCity: WORKFLOW_DEALER.city,
    status: mapWorkflowPAStatus(workflow.preApproval.status),
    timeInPreApproval: 1,
    submittedBy: { name: WORKFLOW_DEALER.contact, avatarUrl: AVATARS[5] },
    mediaType: WORKFLOW_CAMPAIGN.mediaType,
    details: 'March 2026 Digital Ad Campaign — Display, Facebook, Search, Video',
    lastUpdated: new Date(),
    submittedAt: new Date('2026-04-20'),
    initiativeType: WORKFLOW_CAMPAIGN.initiativeType,
    claimsCount: workflow.preApproval.claimsCount,
    contactEmail: WORKFLOW_DEALER.email,
    description: WORKFLOW_CAMPAIGN.description,
    documents: workflow.preApproval.documents,
  };
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

  // Filter Data — archived cycles + active workflow item are always pinned at top,
  // bypassing date filter. Mock items are filtered normally by date + search.
  const filteredData = useMemo(() => {
    const showActiveWorkflow = workflow.preApproval.status !== 'Draft';

    const filteredMock = MOCK_DATA.filter((item) => {
      if (dateRange?.from && item.date < dateRange.from) return false;
      if (dateRange?.to && item.date > dateRange.to) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.id.toLowerCase().includes(query) ||
          item.dealershipName.toLowerCase().includes(query) ||
          item.dealershipCode.toLowerCase().includes(query) ||
          item.status.toLowerCase().includes(query) ||
          item.submittedBy.name.toLowerCase().includes(query) ||
          item.mediaType.toLowerCase().includes(query) ||
          item.details.toLowerCase().includes(query)
        );
      }
      return true;
    });

    // Convert archived cycles to PA rows (newest first)
    const archivedRows = [...workflow.archivedCycles]
      .reverse()
      .map(archivedCycleToPA);

    // Filter archived + active rows by search query when present
    const filterRow = (row: PreApproval) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        row.id.toLowerCase().includes(q) ||
        row.dealershipName.toLowerCase().includes(q) ||
        row.dealershipCode.toLowerCase().includes(q) ||
        row.status.toLowerCase().includes(q) ||
        row.submittedBy.name.toLowerCase().includes(q) ||
        row.mediaType.toLowerCase().includes(q) ||
        row.details.toLowerCase().includes(q)
      );
    };

    const pinnedRows = [
      ...archivedRows.filter(filterRow),
      ...(showActiveWorkflow && filterRow(workflowPreApproval) ? [workflowPreApproval] : []),
    ];

    return [...pinnedRows, ...filteredMock];
  }, [dateRange, searchQuery, workflow.preApproval.status, workflow.preApproval.claimsCount, workflow.archivedCycles, workflowPreApproval]);

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Controls Row */}
      <div className="flex-none flex items-end justify-between p-[24px] m-[0px]">
        <div className="flex items-center gap-3">
          {/* New Pre-Approval Button - Fixed Styling */}
          <ActionButton label={t('New Pre-Approval')} onClick={() => setIsDrawerOpen(true)} />
          
          {/* Search Bar - Fixed Styling */}
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
             </div>
             <input
               type="text"
               placeholder={t('Find below')}
               className="pl-10 pr-4 h-10 border border-gray-300 rounded-[20px] text-sm w-[280px] focus:outline-none focus:ring-1 focus:ring-[#6200EE] focus:border-[#6200EE] transition-all bg-white"
               value={searchQuery}
               onChange={(e) => onSearchQueryChange(e.target.value)}
             />
          </div>
        </div>

        <div className="flex items-center gap-3 z-30">
          <FilterSelect label="Area" value="All Areas" width="w-[110px]" />
          <FilterSelect label="Dealership" value="All Dealerships" width="w-[274px]" />
          
          <div className="relative" ref={datePickerRef}>
             <DateRangeInput 
               startDate={dateRange?.from} 
               endDate={dateRange?.to} 
               onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
               onReset={(e) => {
                 e.stopPropagation();
                 onDateRangeChange(DEFAULT_DATE_RANGE);
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

      {/* Table Section */}
      <div className="flex-1 flex flex-col min-w-0 bg-white border-t border-gray-200">
         <div className="flex-1 overflow-auto custom-scrollbar">
           <table className="min-w-full text-left border-collapse">
             <thead className="bg-white sticky top-0 z-10 shadow-[0_1px_0_rgba(0,0,0,0.06)]">
               <tr>
                 {[
                   { label: 'Date', width: 'min-w-[120px]' },
                   { label: 'Dealership', width: 'min-w-[360px]' },
                   { label: 'ID', width: 'min-w-[120px]' },
                   { label: 'Status', width: 'min-w-[140px]' },
                   { label: 'Time in Pre-approval', width: 'min-w-[160px]' },
                   { label: 'Submitted by', width: 'min-w-[180px]' },
                   { label: 'Media Type', width: 'min-w-[180px]' },
                   { label: 'Details', width: 'min-w-[280px]' },
                   { label: 'Last Updated', width: 'min-w-[140px]' },
                 ].map((col) => (
                   <th key={col.label} className={`px-4 py-3 text-xs font-medium text-[#686576] tracking-[0.17px] border-b border-[rgba(0,0,0,0.12)] whitespace-nowrap ${col.width}`}>
                     {t(col.label)}
                   </th>
                 ))}
               </tr>
             </thead>
             <tbody className="divide-y divide-[rgba(0,0,0,0.08)]">
               {filteredData.map((row) => {
                 const isSelected = selectedPreApprovalId === row.id;
                 return (
                   <tr 
                     key={row.id}
                     onClick={() => onSelectPreApproval(isSelected ? null : row.id)}
                     className={`
                       group cursor-pointer transition-colors relative
                       ${isSelected ? 'bg-[#F2F1FF]' : 'bg-white hover:bg-gray-50'}
                     `}
                   >
                     <td className="px-4 py-3.5 text-xs text-[#1f1d25] whitespace-nowrap">
                       {row.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                     </td>
                     <td className="px-4 py-3.5 text-xs text-[#1f1d25] whitespace-nowrap">
                       {row.dealershipCode} - {row.dealershipName} ({row.dealershipCity})
                     </td>
                     <td className="px-4 py-3.5 text-xs text-[#1f1d25] whitespace-nowrap">
                       {row.id}
                     </td>
                     <td className="px-4 py-3.5 whitespace-nowrap">
                       <StatusChip status={row.status} />
                     </td>
                     <td className="px-4 py-3.5 text-xs text-[#1f1d25] whitespace-nowrap">
                       {row.timeInPreApproval} days
                     </td>
                     <td className="px-4 py-3.5 whitespace-nowrap">
                       <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 relative">
                           <ImageWithFallback 
                             src={row.submittedBy.avatarUrl} 
                             alt={row.submittedBy.name}
                             className="w-full h-full object-cover"
                           />
                         </div>
                         <span className="text-xs text-[#1f1d25]">{row.submittedBy.name}</span>
                       </div>
                     </td>
                     <td className="px-4 py-3.5 text-xs text-[#1f1d25] whitespace-nowrap">
                       {row.mediaType}
                     </td>
                     <td className="px-4 py-3.5 text-xs text-[#1f1d25] max-w-[280px]">
                       <div className="truncate" title={row.details}>
                         {row.details}
                       </div>
                     </td>
                     <td className="px-4 py-3.5 text-xs text-[#1f1d25] whitespace-nowrap pr-10 relative">
                       {(() => {
                         const days = Math.round((new Date().getTime() - row.lastUpdated.getTime()) / (1000 * 3600 * 24));
                         if (days <= 0) return 'just now';
                         if (days === 1) return '1 day ago';
                         return `${days} days ago`;
                       })()}
                       
                       {/* More Actions - Visible on Hover or Selected */}
                       <div className={`absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 ${isSelected ? 'opacity-100' : ''}`}>
                          <button className="p-1 rounded-full hover:bg-black/5 text-[#1f1d25]/60">
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
               {t('No pre-approvals found matching your criteria.')}
             </div>
           )}
         </div>
      </div>
      <PreApprovalDrawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </div>
  );
}