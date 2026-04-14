import { ChevronDown, Search, Filter, Trash2, MoreVertical, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import imgAvatarMaiteEspinoHelloconstellationCom from "figma:asset/9d29793ede36f16f96173ad4142b4b20f0ce143c.png";
import imgImage5 from "figma:asset/5c481f2179514558d72678b54e35d31616ec1847.png";
import svgPaths from '@/imports/svg-ivfty4ek16.ts';

interface ProjectsHeaderProps {
  selectionCount: number;
  onClearSelection: () => void;
  onPreApproval: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function ProjectsHeader({
  selectionCount,
  onClearSelection,
  onPreApproval,
  searchQuery,
  onSearchChange
}: ProjectsHeaderProps) {
  const hasSelection = selectionCount > 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-transparent">
      {/* Left Section */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Filters Icon */}
        <button className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors relative">
          <svg className="w-5 h-5 opacity-50" fill="none" viewBox="0 0 20 20" stroke="currentColor">
            <path d={svgPaths.p20af0680} strokeLinecap="round" strokeWidth="1.5" />
          </svg>
          {/* Badge if needed */}
          <div className="absolute -top-[2px] -right-[7px] bg-[#473bab] text-white text-[10px] font-medium px-1.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center">
            1
          </div>
        </button>

        {/* Page Title */}
        <div className="flex items-center gap-2 h-[34px] px-2">
          <h1 className="text-[16px] font-medium text-[#1f1d25] tracking-[0.15px]">Assets</h1>
        </div>

        {/* Action Buttons Area */}
        {hasSelection ? (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
             {/* Selection Count Pill */}
             <div className="bg-[#f0f2f4] rounded-full flex items-center pl-1 pr-2 py-1 gap-1 h-[34px]">
                 <button 
                   onClick={onClearSelection}
                   className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/5"
                 >
                   <svg className="w-5 h-5 opacity-50" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                     <path d={svgPaths.p208a4880} strokeLinecap="round" strokeWidth="1.5" />
                   </svg>
                 </button>
                 <span className="text-[11px] text-[#1f1d25] tracking-[0.4px]">
                    {selectionCount} selected
                 </span>
             </div>

             {/* Pre-Approval Button */}
             <button 
               onClick={onPreApproval}
               className="relative group rounded-full"
             >
                <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-[rgba(99,86,225,0.5)] bg-white hover:bg-[#f0f2f4] transition-colors h-[34px]">
                   <svg className="w-4 h-4 text-[#473bab]" fill="none" viewBox="0 0 18 18">
                      <path d={svgPaths.pb2448db} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                   </svg>
                   <span className="text-[13px] font-medium text-[#473bab] tracking-[0.46px]">Pre-Approval</span>
                </div>
             </button>

             {/* Trash Button */}
             <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5 opacity-50" fill="none" viewBox="0 0 20 20">
                   <path d={svgPaths.p1702c200} fill="currentColor" />
                </svg>
             </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
             {/* Default Actions if any (e.g. Enhance Images from screenshot) */}
             <button className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#473bab] text-[#473bab] hover:bg-[#473bab]/5 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                   <path d="M12 4v16m-8-8h16" strokeLinecap="round" strokeLinejoin="round"/> 
                   {/* Placeholder icon for Enhance */}
                </svg>
                <span className="text-[13px] font-medium">Enhance Images</span>
             </button>
          </div>
        )}
        
        {/* More Actions (Always visible) */}
        <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
           <svg className="w-5 h-5 opacity-50" fill="none" viewBox="0 0 20 20">
              <path d={svgPaths.p24b71d80} fill="currentColor" />
           </svg>
        </button>

        {/* Search Bar */}
        <div className="relative bg-[#f9fafa] rounded-[20px] h-[34px] w-[200px] border border-[rgba(0,0,0,0.12)] flex items-center px-2">
           <svg className="w-6 h-6 opacity-50 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path d={svgPaths.p103c0600} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
           </svg>
           <input 
             type="text"
             placeholder="Find below"
             value={searchQuery}
             onChange={(e) => onSearchChange(e.target.value)}
             className="bg-transparent border-none outline-none text-[14px] text-[#1f1d25] placeholder-[#9c99a9] w-full h-full"
           />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
         <span className="text-[11px] text-[#1f1d25] tracking-[0.4px]">
           Dec 1, 2025 - Dec 31, 2025
         </span>
         
         {/* Owner Avatar */}
         <div className="flex items-center gap-1">
            <div className="w-6 h-6 rounded-full overflow-hidden relative">
               <img src={imgAvatarMaiteEspinoHelloconstellationCom} className="w-full h-full object-cover" alt="User" />
            </div>
            <span className="text-[11px] text-[#686576] tracking-[0.4px]">Maite Espino</span>
         </div>

         {/* Status */}
         <div className="flex items-center gap-1 px-2 py-1 bg-[rgba(2,136,209,0.08)] rounded-lg">
            <div className="w-3.5 h-3.5 flex items-center justify-center text-[#03A9F4]">
               <svg viewBox="0 0 14 14" fill="none" className="w-full h-full">
                  <path d={svgPaths.pad63200} stroke="currentColor" />
                  <path d={svgPaths.p1b804300} stroke="currentColor" strokeLinecap="round" />
                  <path d={svgPaths.p2b1f980} stroke="currentColor" strokeLinecap="round" />
                  <path d={svgPaths.p36fb3500} stroke="currentColor" strokeLinecap="round" />
               </svg>
            </div>
            <span className="text-[11px] text-[#014361] tracking-[0.4px]">In Progress</span>
         </div>
      </div>
    </div>
  );
}
