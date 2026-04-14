import { 
  Search, 
  Folder, 
  ChevronDown, 
  ListFilter, 
  LayoutGrid, 
  List,
  X, 
  Download, 
  FileCheck, 
  Wand2, 
  Pencil, 
  Copy, 
  Trash2,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActionButton } from '../ActionButton';

interface PortalHeaderProps {
  selectionCount: number;
  onClearSelection: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  folderName?: string;
  onPreApproval: () => void;
}

export function PortalHeader({
  selectionCount,
  onClearSelection,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  folderName = "Jack Daniels Volkswagen - January Offers Specials",
  onPreApproval
}: PortalHeaderProps) {
  const isSelectionMode = selectionCount > 0;

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-[rgba(0,0,0,0.12)] bg-white h-[72px] shrink-0">
      {/* Left Side: Navigation / Selection & Search */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        
        {/* Navigation - Always visible */}
        <div className="flex items-center gap-2 text-[#111014]">
          <button className="flex items-center gap-1 p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
            <Folder className="w-5 h-5 text-[#111014]/56" strokeWidth={1.5} />
            <ChevronDown className="w-5 h-5 text-[#111014]/56" strokeWidth={1.5} />
          </button>
        </div>

        <button className="p-1 text-[#111014] hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
          <ListFilter className="w-5 h-5 text-[#111014]/56" strokeWidth={1.5} />
        </button>

        <h1 className="text-[16px] font-medium text-[#1f1d25] truncate">
          {folderName}
        </h1>

        {/* Selection Actions Wrapper (Gray Pill) - Only visible when selecting */}
        {isSelectionMode && (
          <div className="flex items-center bg-[#F0F2F4] rounded-[40px] pl-1 pr-2 py-[3px] gap-4 animate-in fade-in slide-in-from-left-2 duration-200 ml-2">
             
             {/* Close & Count */}
             <div className="flex items-center gap-1">
                <button 
                  onClick={onClearSelection}
                  className="p-1 hover:bg-white rounded-full transition-colors text-[#111014]/56 hover:text-[#111014] cursor-pointer"
                >
                   <X className="w-5 h-5" strokeWidth={1.5} />
                </button>
                <div className="flex items-baseline gap-1 text-[11px] text-[#1f1d25] px-1 font-normal select-none">
                   <span>{selectionCount}</span>
                   <span>selected</span>
                </div>
             </div>

             {/* Actions Group */}
             <div className="flex items-center gap-2">
                {/* Download */}
                <SelectionButton icon={<Download className="w-[18px] h-[18px]" strokeWidth={1.5} />} label="Download" />
                
                {/* Pre-approval */}
                <SelectionButton 
                  icon={<FileCheck className="w-[18px] h-[18px]" strokeWidth={1.5} />} 
                  label="Pre-approval" 
                  onClick={onPreApproval}
                />

                {/* Icons */}
                <SelectionActionIcon icon={<Wand2 className="w-5 h-5" strokeWidth={1.5} />} tooltip="AI Enhance" />
                <SelectionActionIcon icon={<Pencil className="w-5 h-5" strokeWidth={1.5} />} tooltip="Edit" />
                <SelectionActionIcon icon={<Copy className="w-5 h-5" strokeWidth={1.5} />} tooltip="Duplicate" />
                <SelectionActionIcon icon={<Trash2 className="w-5 h-5" strokeWidth={1.5} />} tooltip="Delete" />
             </div>
          </div>
        )}

        {/* Search Bar - Always visible, pushed after selection if active */}
        <div className="relative ml-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#111014]/56" strokeWidth={1.5} />
          <input 
            type="text" 
            placeholder="Find below" 
            className="pl-10 pr-4 h-[34px] w-[200px] bg-[#f9fafa] border border-[rgba(0,0,0,0.12)] rounded-[20px] text-sm text-[#9c99a9] focus:outline-none focus:border-[#473bab] transition-colors placeholder:text-[#9c99a9]"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Right Side: View Toggle */}
      <div className="flex items-center gap-4 shrink-0 ml-4">
        <button 
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-[#111014]/56 hover:text-[#1f1d25] cursor-pointer"
          onClick={() => onViewModeChange(viewMode === 'grid' ? 'list' : 'grid')}
        >
          {viewMode === 'grid' ? (
             <LayoutGrid className="w-5 h-5" strokeWidth={1.5} />
          ) : (
             <List className="w-5 h-5" strokeWidth={1.5} />
          )}
        </button>
      </div>
    </div>
  );
}

function SelectionButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-[10px] py-[4px] rounded-[100px] border border-[rgba(99,86,225,0.5)] transition-colors cursor-pointer",
        "bg-transparent text-[#473bab] hover:bg-[#F2F1FF] active:bg-[#E0DFFF]"
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span className="text-[13px] font-medium leading-[22px] tracking-[0.46px] whitespace-nowrap">{label}</span>
    </button>
  );
}

function SelectionActionIcon({ icon, tooltip }: { icon: React.ReactNode, tooltip: string }) {
  return (
    <button 
      title={tooltip}
      className="p-[5px] text-[#111014]/56 hover:text-[#1f1d25] hover:bg-black/5 rounded-full transition-colors cursor-pointer"
    >
      {icon}
    </button>
  );
}
