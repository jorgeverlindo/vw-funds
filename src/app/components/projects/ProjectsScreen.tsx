import { useState } from 'react';
import { PortalCard, PortalItem } from '../portal/PortalCard';
import { ProjectsHeader } from './ProjectsHeader';
import { ProjectsPreApprovalDrawer } from './ProjectsPreApprovalDrawer';

// Mock Assets (reusing generic names or placeholders as I don't have the specific asset hashes for the grid items in the prompt snippet)
import imgCardImage from "figma:asset/5b760d55d2388a38009c20fbc7474decb0d7b3fe.png";
import imgCardImage1 from "figma:asset/f925b175d9f45ba629bdedc9c27563c3216090ba.png";
import imgCardImage2 from "figma:asset/dcd4a062f63eda60d1f2ae0b47f935693f998f44.png";
import imgCardImage3 from "figma:asset/5eea4d176adc209f09fc2413a05a7c2e774e3435.png";
import imgCardImage4 from "figma:asset/96b55a391e69153cce3364990bde189c536e6e6a.png";
import imgCardImage5 from "figma:asset/e1a3a291c3dea7272c982b7cd90b97e9d310f2d2.png";
import imgCardImage6 from "figma:asset/e67775d65913cad5ff67c8c775bb9fcaee7b8d74.png";
import imgCardImage7 from "figma:asset/804a9d226f2fde3e441fc252051a11745dfbb986.png";

const PROJECT_ITEMS: PortalItem[] = [
  { 
    id: '1', 
    title: 'New 2026 VW Tiguan S', 
    type: 'PNG', 
    dimensions: '1080 x 1080', 
    imageSrc: imgCardImage 
  },
  { 
    id: '2', 
    title: 'New 2026 VW Tiguan S', 
    type: 'MP4', 
    dimensions: '1280 x 720', 
    imageSrc: imgCardImage1
  },
  { 
    id: '3', 
    title: 'New 2026 VW Tiguan S', 
    type: 'MP4', 
    dimensions: '1280 x 720', 
    imageSrc: imgCardImage2
  },
  { 
    id: '4', 
    title: 'New 2026 VW Tiguan S', 
    type: 'PNG', 
    dimensions: '1080 x 1080', 
    imageSrc: imgCardImage3
  },
  { 
    id: '5', 
    title: 'Load up, Go Further', 
    type: 'PNG', 
    dimensions: '1080 x 1080', 
    imageSrc: imgCardImage4
  },
  { 
    id: '6', 
    title: 'Defender in its Purest Form', 
    type: 'PNG', 
    dimensions: '1080 x 1080', 
    imageSrc: imgCardImage5
  },
  { 
    id: '7', 
    title: 'The Most Versatile 7 Seat SUV', 
    type: 'PNG', 
    dimensions: '1080 x 1080', 
    imageSrc: imgCardImage6
  },
  { 
    id: '8', 
    title: 'Approved Certified Pre-Owned', 
    type: 'PNG', 
    dimensions: '1080 x 1080', 
    imageSrc: imgCardImage7
  },
];

export function ProjectsScreen() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Filter items based on search
  const filteredItems = PROJECT_ITEMS.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedAssets = PROJECT_ITEMS
    .filter(item => selectedIds.has(item.id))
    .map(item => item.imageSrc);

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Breadcrumbs - Specific to Projects */}
      <div className="flex-none px-6 pt-4 pb-0">
         <div className="flex items-center gap-1 mb-2">
            <span className="text-[11px] text-[#686576] font-normal tracking-[0.4px]">Projects</span>
            <svg className="w-3.5 h-3.5 text-[#686576]" fill="currentColor" viewBox="0 0 14 14">
               <path d="M5.5 3.5L9 7l-3.5 3.5" />
            </svg>
            <span className="text-[11px] text-[#686576] font-normal tracking-[0.4px]">January Offers - Specials</span>
            <svg className="w-3.5 h-3.5 text-[#686576]" fill="currentColor" viewBox="0 0 14 14">
               <path d="M5.5 3.5L9 7l-3.5 3.5" />
            </svg>
            <span className="text-[11px] text-[#1f1d25] font-medium tracking-[0.4px]">Assets</span>
         </div>
      </div>

      <div className="px-6">
        <ProjectsHeader 
          selectionCount={selectedIds.size}
          onClearSelection={clearSelection}
          onPreApproval={() => setIsDrawerOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        
        {/* Filtering by chips (Static for now as per design) */}
        <div className="flex items-center gap-2 py-3 text-[11px] text-[#686576] tracking-[0.4px]">
           <span>Filtering by</span>
           <div className="flex items-center gap-1 px-2 py-0.5 bg-[#f0f2f4] rounded-full">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m-8-8h16" strokeWidth={2}/></svg>
              <span>Dimension</span>
           </div>
           <div className="flex items-center gap-1 px-2 py-0.5 bg-[#f0f2f4] rounded-full">
              <span>January Offers - Specials</span>
              <svg className="w-3 h-3 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2}/></svg>
           </div>
           <button className="text-[#473bab] font-medium ml-1">Clear Filters</button>
           
           <div className="ml-auto flex items-center gap-2">
              <span>{filteredItems.length} Items</span>
              <div className="flex items-center gap-1">
                 {/* Grid/List Toggle Icons */}
                 <svg className="w-4 h-4 text-[#1f1d25]" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z"/></svg>
              </div>
           </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6">
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-10">
            {filteredItems.map((item) => (
              <PortalCard 
                key={item.id}
                item={item}
                selected={selectedIds.has(item.id)}
                onSelect={() => toggleSelection(item.id)}
              />
            ))}
         </div>
      </div>

      <ProjectsPreApprovalDrawer 
        open={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        assets={selectedAssets}
      />
    </div>
  );
}
