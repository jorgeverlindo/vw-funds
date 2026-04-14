import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { InteractiveAnnotation } from '../pre-approval/InteractiveAnnotation';
import { AnnotationItem } from '../pre-approval/ScrollerAnnotations';

interface ProjectsRevisionWrapperProps {
  assets: string[];
  onAutocorrect: (index: number) => void;
  annotations: AnnotationItem[];
  activeId: string | null;
  onPinClick: (id: string | null) => void;
}

export function ProjectsRevisionWrapper({ 
  assets, 
  onAutocorrect,
  annotations,
  activeId,
  onPinClick
}: ProjectsRevisionWrapperProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 4;
  const totalPages = Math.ceil(assets.length / itemsPerPage);

  const startIndex = currentPage * itemsPerPage;
  const currentAssets = assets.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="flex flex-col h-full bg-[#f0f2f4] relative">
       {/* Content */}
       <div className="flex-1 overflow-auto p-8 flex items-center justify-center">
          <div className="bg-white p-8 min-h-[600px] w-full max-w-[800px] relative flex flex-col transition-transform duration-200 origin-center">
             {/* Header Text (Specific to Projects if needed, keeping generic for now) */}
             <div className="mb-6 shrink-0">
                 <p className="text-[9px] font-medium text-black uppercase tracking-[0.14px] font-['Roboto',sans-serif]">
                    Display – 2025 – VW Batch 1 Still Ads
                 </p>
             </div>

             {/* Grid */}
             <div className="grid grid-cols-2 gap-8 flex-1 content-start">
                {currentAssets.map((asset, localIdx) => {
                   const globalIdx = startIndex + localIdx;
                   // Show annotations on the first asset for now
                   const showAnnotations = globalIdx === 0;

                   return (
                   <div key={globalIdx} className="relative group aspect-square bg-gray-50 border border-gray-100 p-2 flex items-center justify-center">
                      <ImageWithFallback 
                        src={asset} 
                        className="max-w-full max-h-full object-contain"
                        alt={`Ad ${globalIdx}`}
                      />
                      
                      {/* Contextual Annotation Pins */}
                      {showAnnotations && (
                        <div className="absolute inset-0 z-10" style={{ overflow: 'visible' }}>
                        {annotations.map((pin) => (
                            <div key={pin.id} className="contents">
                                <InteractiveAnnotation 
                                  {...pin}
                                  isOpen={activeId === pin.id}
                                  onToggle={() => onPinClick(activeId === pin.id ? null : pin.id)}
                                  delay={0}
                                />
                            </div>
                          ))}
                        </div>
                      )}
                   </div>
                   );
                })}
             </div>
          </div>
       </div>

       {/* Pagination Arrows (Floating outside the white page) */}
       {totalPages > 1 && (
         <>
            <button 
               onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
               disabled={currentPage === 0}
               className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white rounded-full shadow-lg disabled:opacity-30 hover:bg-gray-50 transition-colors z-20 cursor-pointer"
            >
               <ChevronLeft className="w-6 h-6 text-[#111014]" strokeWidth={1.5} />
            </button>
            <button 
               onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
               disabled={currentPage === totalPages - 1}
               className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white rounded-full shadow-lg disabled:opacity-30 hover:bg-gray-50 transition-colors z-20 cursor-pointer"
            >
               <ChevronRight className="w-6 h-6 text-[#111014]" strokeWidth={1.5} />
            </button>
         </>
       )}
    </div>
  );
}
