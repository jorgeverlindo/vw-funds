import { useState } from 'react';
import { PortalCard, PortalItem } from './PortalCard';
import { PortalHeader } from './PortalHeader';
import { PortalPreApprovalDrawer } from './PortalPreApprovalDrawer';

// Mock Assets
import imgCardImage from "figma:asset/5b760d55d2388a38009c20fbc7474decb0d7b3fe.png";
import imgCardImage1 from "figma:asset/f925b175d9f45ba629bdedc9c27563c3216090ba.png";
import imgCardImage2 from "figma:asset/dcd4a062f63eda60d1f2ae0b47f935693f998f44.png";
import imgCardImage3 from "figma:asset/5eea4d176adc209f09fc2413a05a7c2e774e3435.png";
import imgCardImage4 from "figma:asset/96b55a391e69153cce3364990bde189c536e6e6a.png";
import imgCardImage5 from "figma:asset/e1a3a291c3dea7272c982b7cd90b97e9d310f2d2.png";
import imgCardImage6 from "figma:asset/e67775d65913cad5ff67c8c775bb9fcaee7b8d74.png";
import imgCardImage7 from "figma:asset/804a9d226f2fde3e441fc252051a11745dfbb986.png";

const MOCK_ITEMS: PortalItem[] = [
  { 
    id: '1', 
    title: 'VW Batch 1 Still Ads', 
    type: 'PNG', 
    dimensions: '1080 x 1080', 
    imageSrc: imgCardImage // Tiguan S
  },
  { 
    id: '2', 
    title: 'VW Batch 1 Still Ads 2', 
    type: 'MP4', 
    dimensions: '1280 x 720', 
    imageSrc: imgCardImage1 // ID.4
  },
  { 
    id: '3', 
    title: '3_STILL_111925_Autohaus Lancaster VW_25_Nov Offers_Tao', 
    type: 'MP4', 
    dimensions: '1280 x 720', 
    imageSrc: imgCardImage2 // Atlas
  },
  { 
    id: '4', 
    title: 'NBCU-VW_121225_Norm-Reeves-Volkswagen_APR-or-Bonus_2026_Tiguan', 
    type: 'PNG', 
    dimensions: '1080 x 1080', 
    imageSrc: imgCardImage3 // Jetta
  },
  { 
    id: '5', 
    title: '4_M0_111425_Larry_H. Miller_VW_Avondale_25_Taos_APR_Deal', 
    type: 'PNG', 
    dimensions: '1080 x 1080', 
    imageSrc: imgCardImage4 // Blue Taos
  },
  { 
    id: '6', 
    title: '1_MT_081325_Volkswagen_25_.mp4', 
    type: 'PNG', 
    dimensions: '1080 x 1080', 
    imageSrc: imgCardImage5 // Red Atlas trunk
  },
  { 
    id: '7', 
    title: '1_VID_060225_Volkswagen_25_Tiguan_P MAX_1920x1080', 
    type: 'PNG', 
    dimensions: '1080 x 1080', 
    imageSrc: imgCardImage6 // Green Taos
  },
  { 
    id: '8', 
    title: '1_MT_012925_Volkswagen_25_CPO_1080 x1080.mp4', 
    type: 'PNG', 
    dimensions: '1080 x 1080', 
    imageSrc: imgCardImage7 // CPO
  },
];

interface PortalContentProps {
  onPreApproval?: () => void;
}

export function PortalContent({ onPreApproval }: PortalContentProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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
  const filteredItems = MOCK_ITEMS.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedAssets = MOCK_ITEMS
    .filter(item => selectedIds.has(item.id))
    .map(item => item.imageSrc);

  return (
    <div className="flex flex-col h-full bg-white relative">
      <PortalHeader 
        selectionCount={selectedIds.size}
        onClearSelection={clearSelection}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onPreApproval={() => setIsDrawerOpen(true)}
      />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
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

      <PortalPreApprovalDrawer 
        open={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        assets={selectedAssets}
      />
    </div>
  );
}
