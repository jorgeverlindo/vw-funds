import { useState, useRef, useEffect, useMemo } from 'react';
import { DateRange } from 'react-day-picker';
import { Search, MoreVertical, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { DateRangeInput } from './DateRangeInput';
import { DateRangePicker } from './DateRangePicker';
import { FilterSelect } from './FilterSelect';
import { ActionButton } from './ActionButton';
import { StatusChip } from './StatusChip';

// --- Types ---
export interface FundCase {
  id: string;
  date: Date;
  dealershipName: string;
  type: 'Compliance' | 'Audit' | 'Dispute';
  status: 'Open' | 'Resolved' | 'Escalated';
  priority: 'High' | 'Medium' | 'Low';
  assignedTo: string;
  lastActivity: Date;
  description: string;
}

// --- Mock Data ---
export const CASES_MOCK_DATA: FundCase[] = [
  {
    id: 'CS-9921',
    date: new Date(2026, 0, 15),
    dealershipName: 'Rick Case Volkswagen Weston',
    type: 'Compliance',
    status: 'Open',
    priority: 'High',
    assignedTo: 'Compliance Team A',
    lastActivity: new Date(2026, 0, 20),
    description: 'Missing signature on media invoice for MFA386592.'
  },
  {
    id: 'CS-9922',
    date: new Date(2026, 0, 10),
    dealershipName: 'Gunther Volkswagen of Coconut Creek',
    type: 'Audit',
    status: 'Resolved',
    priority: 'Medium',
    assignedTo: 'Audit Team',
    lastActivity: new Date(2026, 0, 12),
    description: 'Quarterly audit review for Q4 2025.'
  },
  {
    id: 'CS-9923',
    date: new Date(2026, 0, 5),
    dealershipName: 'Emich Volkswagen',
    type: 'Dispute',
    status: 'Escalated',
    priority: 'High',
    assignedTo: 'Finance Director',
    lastActivity: new Date(2026, 0, 21),
    description: 'Reimbursement rate dispute for campaign Radio-March.'
  }
];

const DEFAULT_DATE_RANGE: DateRange = {
  from: new Date(2025, 0, 1),
  to: new Date(2025, 11, 31),
};

export interface FundsCasesContentProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

export function FundsCasesContent({
  dateRange,
  onDateRangeChange,
}: FundsCasesContentProps) {
  const { t } = useTranslation();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredData = useMemo(() => {
    return CASES_MOCK_DATA.filter((item) => {
      if (dateRange?.from && item.date < dateRange.from) return false;
      if (dateRange?.to && item.date > dateRange.to) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.id.toLowerCase().includes(query) ||
          item.dealershipName.toLowerCase().includes(query) ||
          item.status.toLowerCase().includes(query) ||
          item.type.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [dateRange, searchQuery]);

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Controls Row */}
      <div className="flex-none flex items-end justify-between pb-[16px] pt-[0px] px-[20px] py-[0px] mx-[3px] my-[24px] pr-[20px] pl-[20px]">
        <div className="flex items-center gap-3">
            <ActionButton label={t('New Case')} onClick={() => {}} />

          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
             </div>
             <input
               type="text"
               placeholder={t('Search cases')}
               className="pl-10 pr-4 h-10 border border-gray-300 rounded-[20px] text-sm w-[280px] focus:outline-none focus:ring-1 focus:ring-[#6200EE] focus:border-[#6200EE] transition-all bg-white"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
          </div>
        </div>

        <div className="flex items-center gap-3 z-30">
          <FilterSelect label="Case Type" value="All Types" width="w-[130px]" />
          <FilterSelect label="Priority" value="All Priorities" width="w-[130px]" />
          
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
                    { label: 'Case ID', width: 'min-w-[120px]' },
                    { label: 'Date Opened', width: 'min-w-[140px]' },
                    { label: 'Dealership', width: 'min-w-[300px]' },
                    { label: 'Type', width: 'min-w-[140px]' },
                    { label: 'Priority', width: 'min-w-[120px]' },
                    { label: 'Status', width: 'min-w-[140px]' },
                    { label: 'Assigned To', width: 'min-w-[180px]' },
                    { label: 'Last Activity', width: 'min-w-[140px]' },
                  ].map((col) => (
                    <th key={col.label} className={`px-4 py-3 text-xs font-medium text-[#686576] tracking-[0.17px] border-b border-[rgba(0,0,0,0.12)] whitespace-nowrap ${col.width}`}>
                      {t(col.label)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(0,0,0,0.08)]">
                {filteredData.map((row) => (
                  <tr key={row.id} className="group hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="px-4 py-3.5 text-xs font-medium text-[#473BAB] whitespace-nowrap">
                      {row.id}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[#1f1d25] whitespace-nowrap">
                      {row.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[#1f1d25] whitespace-nowrap">
                      {row.dealershipName}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[#1f1d25] whitespace-nowrap">
                      {row.type}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <PriorityBadge priority={row.priority} />
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                       <StatusChip status={row.status === 'Open' ? 'Pending' : row.status === 'Resolved' ? 'Approved' : 'Revision Requested'} />
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[#1f1d25] whitespace-nowrap">
                      {row.assignedTo}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[#1f1d25] whitespace-nowrap relative">
                      {Math.round((new Date().getTime() - row.lastActivity.getTime()) / (1000 * 3600 * 24))} days ago
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100">
                         <button className="p-1 rounded-full hover:bg-black/5 text-[#1f1d25]/60">
                            <MoreVertical className="w-4 h-4" />
                         </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: 'High' | 'Medium' | 'Low' }) {
  const styles = {
    High: "text-[#D2323F] bg-[#FDE8E8]",
    Medium: "text-[#EF6C00] bg-[#FFF3E0]",
    Low: "text-[#0288D1] bg-[#E1F5FE]"
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${styles[priority]}`}>
      {priority}
    </span>
  );
}
