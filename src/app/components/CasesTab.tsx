import { useState, useMemo, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { DateRange } from 'react-day-picker';
import { FilterSelect } from './FilterSelect';
import { DateRangeInput } from './DateRangeInput';
import { DateRangePicker } from './DateRangePicker';
import { ActionButton } from './ActionButton';
import { StatusChip } from './StatusChip';
import { cn } from '../../lib/utils';
import { TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/table';

export interface Case {
  id: string;
  date: Date;
  status: 'Approved' | 'Pending' | 'Revision Requested';
  dealership: string;
  type: string;
  lastUpdated: string;
}

const CASES_DATA: Case[] = [
  { id: 'MFC539881', date: new Date(2025, 0, 2), status: 'Approved', dealership: '408252 - Jack Daniels Volkswagen (Paramus)', type: 'CRM AUGUST', lastUpdated: '3 days ago' },
  { id: 'MFC539881', date: new Date(2025, 0, 2), status: 'Pending', dealership: '423063 - Armstrong Volkswagen of Gladstone (Gladstone)', type: 'CRM AUGUST', lastUpdated: '3 days ago' },
  { id: 'MFC539881', date: new Date(2025, 0, 2), status: 'Revision Requested', dealership: '408252 - Jack Daniels Volkswagen (Paramus)', type: 'CRM AUGUST', lastUpdated: '3 days ago' },
  { id: 'MFC539881', date: new Date(2025, 0, 2), status: 'Approved', dealership: '409210 - Paramount Volkswagen of Hickory (Hickory)', type: 'CRM AUGUST', lastUpdated: '3 days ago' },
  { id: 'MFC539881', date: new Date(2025, 0, 2), status: 'Approved', dealership: '402165 - Volkswagen of Downtown Chicago (Chicago)', type: 'CRM AUGUST', lastUpdated: '3 days ago' },
  { id: 'MFC539881', date: new Date(2025, 0, 2), status: 'Approved', dealership: '423063 - Armstrong Volkswagen of Gladstone (Gladstone)', type: 'CRM AUGUST', lastUpdated: '3 days ago' },
  { id: 'MFC539881', date: new Date(2025, 0, 2), status: 'Pending', dealership: '408252 - Jack Daniels Volkswagen (Paramus)', type: 'CRM AUGUST', lastUpdated: '3 days ago' },
  { id: 'MFC539881', date: new Date(2025, 0, 2), status: 'Approved', dealership: '408252 - Jack Daniels Volkswagen (Paramus)', type: 'CRM AUGUST', lastUpdated: '3 days ago' },
  { id: 'MFC539881', date: new Date(2025, 0, 2), status: 'Pending', dealership: '423063 - Armstrong Volkswagen of Gladstone (Gladstone)', type: 'CRM AUGUST', lastUpdated: '3 days ago' },
  { id: 'MFC539881', date: new Date(2025, 0, 2), status: 'Revision Requested', dealership: '408252 - Jack Daniels Volkswagen (Paramus)', type: 'CRM AUGUST', lastUpdated: '3 days ago' },
  { id: 'MFC539881', date: new Date(2025, 0, 2), status: 'Approved', dealership: '409210 - Paramount Volkswagen of Hickory (Hickory)', type: 'CRM AUGUST', lastUpdated: '3 days ago' },
  { id: 'MFC539881', date: new Date(2025, 0, 2), status: 'Approved', dealership: '402165 - Volkswagen of Downtown Chicago (Chicago)', type: 'CRM AUGUST', lastUpdated: '3 days ago' },
  { id: 'MFC539881', date: new Date(2025, 0, 2), status: 'Pending', dealership: '408252 - Jack Daniels Volkswagen (Paramus)', type: 'CRM AUGUST', lastUpdated: '3 days ago' },
  { id: 'MFC539881', date: new Date(2025, 0, 2), status: 'Revision Requested', dealership: '408252 - Jack Daniels Volkswagen (Paramus)', type: 'CRM AUGUST', lastUpdated: '3 days ago' },
];

export function CasesTab({
  dateRange: propDateRange,
  onDateRangeChange: propOnDateRangeChange
}: {
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
}) {
  const { t } = useTranslation();
  const [internalDateRange, setInternalDateRange] = useState<DateRange | undefined>({
    from: new Date(2025, 0, 1),
    to: new Date(2025, 11, 31),
  });

  const dateRange = propDateRange || internalDateRange;
  const setDateRange = propOnDateRangeChange || setInternalDateRange;

  const [searchQuery, setSearchQuery] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

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
    return CASES_DATA.filter((item) => {
      if (dateRange?.from && item.date < dateRange.from) return false;
      if (dateRange?.to && item.date > dateRange.to) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.id.toLowerCase().includes(q) ||
          item.dealership.toLowerCase().includes(q) ||
          item.status.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [dateRange, searchQuery]);

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-white">
      {/* Controls Row */}
      <div className="flex-none flex items-end justify-between p-6">
        <div className="flex items-center gap-3">
          <ActionButton label={t('New Case')} onClick={() => {}} />
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
          <FilterSelect label="Area" value="All Areas" width="w-[110px]" />
          <FilterSelect label="Dealership" value="All Dealerships" width="w-[274px]" />
          
          <div className="relative" ref={datePickerRef}>
             <DateRangeInput 
               startDate={dateRange?.from} 
               endDate={dateRange?.to} 
               onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
               onReset={(e) => {
                 e.stopPropagation();
                 setDateRange({ from: new Date(2025, 0, 1), to: new Date(2025, 11, 31) });
               }}
             />
             {isDatePickerOpen && (
               <DateRangePicker 
                 initialRange={dateRange} 
                 onApply={(range) => {
                   setDateRange(range);
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
            {/* Using raw table element to avoid Shadcn Table's overflow wrapper which breaks sticky header in this specific layout structure */}
            <table className="min-w-full text-left border-collapse">
              <TableHeader className="bg-white sticky top-0 z-10 shadow-[0_1px_0_rgba(0,0,0,0.06)]">
                <TableRow className="hover:bg-transparent border-none">
                  {[
                    { label: 'Date', width: 'w-[120px]' },
                    { label: 'ID', width: 'w-[100px]' },
                    { label: 'Status', width: 'w-[160px]' },
                    { label: 'Dealership', width: 'w-[400px]' },
                    { label: 'Type', width: 'w-[150px]' },
                    { label: 'Last Updated', width: 'w-[130px]' },
                  ].map((col) => (
                    <TableHead
                      key={col.label}
                      className={`px-4 py-3 text-xs font-medium text-[#686576] tracking-[0.17px] border-b border-[rgba(0,0,0,0.12)] whitespace-nowrap h-auto ${col.width}`}
                    >
                      {t(col.label)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-[rgba(0,0,0,0.08)]">
                {filteredData.map((row, index) => {
                  const isSelected = selectedCaseId === `${row.id}-${index}`;
                  return (
                    <TableRow 
                      key={`${row.id}-${index}`}
                      onClick={() => setSelectedCaseId(isSelected ? null : `${row.id}-${index}`)}
                      className={cn(
                        "group cursor-pointer transition-colors relative border-b-0",
                        isSelected ? "bg-[#F2F1FF] hover:bg-[#F2F1FF]" : "bg-white hover:bg-gray-50"
                      )}
                      data-state={isSelected ? 'selected' : undefined}
                    >
                      <TableCell className="px-4 py-3.5 text-xs text-[#1f1d25] whitespace-nowrap">
                        {row.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-xs text-[#1f1d25] whitespace-nowrap font-medium">
                        {row.id}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 whitespace-nowrap">
                        <StatusChip status={row.status} />
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-xs text-[#1f1d25] truncate max-w-[400px]" title={row.dealership}>
                        {row.dealership}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-xs text-[#1f1d25] whitespace-nowrap">
                        {row.type}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-xs text-[#1f1d25] whitespace-nowrap">
                        {row.lastUpdated}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </table>
         </div>
      </div>
    </div>
  );
}
