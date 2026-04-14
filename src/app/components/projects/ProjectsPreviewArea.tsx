import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectsRevisionWrapper } from './ProjectsRevisionWrapper';
import { BeforeAfter } from '../pre-approval/BeforeAfter';
import { ScrollerAnnotations, AnnotationItem } from '../pre-approval/ScrollerAnnotations';
import { PreviewControlsZoom } from '../pre-approval/PreviewControlsZoom';
import { OnboardingBubble } from '../pre-approval/OnboardingBubble';

// Mock Annotation Items for the sidebar
const MOCK_ANNOTATIONS: AnnotationItem[] = [
  { id: '1', number: 1, category: '3A CATA', title: 'Background Colors', description: 'Must adhere to Primary & Secondary brand color palettes.', x: 20, y: 30, direction: 'top-left' },
  { id: '2', number: 2, category: '1D CATA', title: 'Font Types', description: 'Volkswagen approved fonts must be used.', x: 60, y: 40, direction: 'top-right' },
  { id: '3', number: 3, category: '3A CATA', title: 'Legal Disclaimer', description: 'Add appropriate legal disclaimer as defined by policy.', x: 30, y: 70, direction: 'bottom-left' },
  { id: '4', number: 4, category: '2D CATA', title: 'No Graphics', description: 'Assets may not contain graphics.', x: 80, y: 80, direction: 'bottom-right' },
  { id: '5', number: 5, category: '2D CATA', title: 'Logo Placement', description: 'Logos must respect the protected area defined in the brand guidelines.', x: 10, y: 10, direction: 'top-left' },
];

export function ProjectsPreviewArea({ assets }: { assets: string[] }) {
  const [mode, setMode] = useState<'grid' | 'review'>('grid');
  const [reviewIndex, setReviewIndex] = useState(0);
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Zoom/Pan State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleAutocorrect = (index?: number) => {
     if (typeof index === 'number') setReviewIndex(index);
     setMode('review');
     setZoom(1);
     setPan({ x: 0, y: 0 });
  };

  const handleAccept = () => {
     if (reviewIndex < assets.length - 1) {
        setReviewIndex(prev => prev + 1);
        // Keep view
     } else {
        setMode('grid');
        setIsSuccess(true);
        setActiveAnnotationId(null);
     }
  };

  const handleCancel = () => {
     setMode('grid');
     setZoom(1);
     setPan({ x: 0, y: 0 });
  };
  
  const handleNext = () => {
     if (reviewIndex < assets.length - 1) setReviewIndex(prev => prev + 1);
  };
  
  const handlePrev = () => {
     if (reviewIndex > 0) setReviewIndex(prev => prev - 1);
  };

  // Zoom Controls
  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.5));
  const handleReset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  return (
    <div className="flex w-full h-full bg-[#f0f2f4] overflow-hidden p-4 gap-4">
       {/* Left Sidebar: ScrollerAnnotations (Hidden in review mode) */}
       {mode === 'grid' && (
           <div className="w-[200px] flex-none flex flex-col h-full relative z-20">
              <ScrollerAnnotations 
                 annotations={isSuccess ? [] : MOCK_ANNOTATIONS}
                 activeId={activeAnnotationId}
                 onSelect={setActiveAnnotationId}
              />
              {isSuccess && (
                  <div className="absolute top-0 left-0 w-full p-4 bg-[#f0f2f4] z-30">
                     <div className="bg-[#e8f5e9] text-[#1b5e20] px-3 py-1.5 rounded-full text-[11px] font-medium flex items-center justify-center gap-1.5 w-full">
                         <div className="w-1.5 h-1.5 rounded-full bg-[#1b5e20]" />
                         No visual issues
                     </div>
                  </div>
              )}
           </div>
       )}

       {/* Main Content Area */}
       <div className="flex-1 relative flex flex-col min-w-0">
          
          {/* Canvas */}
          <div className="flex-1 overflow-hidden relative bg-[#f0f2f4]">
             <AnimatePresence mode="wait">
                {mode === 'grid' ? (
                   <motion.div 
                      key="grid"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full h-full"
                   >
                      <div className="w-full h-full overflow-hidden relative cursor-grab active:cursor-grabbing">
                        <motion.div
                           ref={containerRef}
                           className="w-full h-full flex items-center justify-center"
                           drag
                           dragMomentum={false}
                           onDragEnd={(_, info) => {
                               setPan(p => ({ x: p.x + info.offset.x, y: p.y + info.offset.y }));
                           }}
                           style={{ x: pan.x, y: pan.y, scale: zoom }}
                        >
                           {/* The Revision Wrapper (The Page) */}
                           <div className="pointer-events-auto" 
                                onPointerDown={(e) => e.stopPropagation()} // Stop drag when interacting with page content
                           >
                               <ProjectsRevisionWrapper 
                                  assets={assets} 
                                  onAutocorrect={handleAutocorrect}
                                  annotations={isSuccess ? [] : MOCK_ANNOTATIONS}
                                  activeId={activeAnnotationId}
                                  onPinClick={setActiveAnnotationId}
                               />
                           </div>
                        </motion.div>
                      </div>
                   </motion.div>
                ) : (
                   /* Review Mode (BeforeAfter is now an overlay outside the zoomed canvas) */
                   <motion.div 
                      key="review-placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full h-full"
                   />
                )}
             </AnimatePresence>

             {/* Onboarding Bubble (Overlay) - Show in Grid mode */}
             {mode === 'grid' && showOnboarding && (
                 <OnboardingBubble 
                    isVisible={true}
                    onSkip={() => setShowOnboarding(false)}
                    onAutocorrect={() => handleAutocorrect(0)}
                    className="absolute left-0 top-16 z-[1005]"
                 />
             )}
             
             {/* BeforeAfter Overlay (Fixed Position, No Scroll) */}
             <AnimatePresence>
                {mode === 'review' && (
                   <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-[50]"
                   >
                        <BeforeAfter 
                           isVisible={true}
                           image={assets[reviewIndex]}
                           onAccept={handleAccept}
                           onCancel={handleCancel}
                           className="!relative !inset-auto !w-full !h-full"
                           // Navigation Props
                           onNext={handleNext}
                           onPrev={handlePrev}
                           hasPrevious={reviewIndex > 0}
                           hasNext={reviewIndex < assets.length - 1}
                           currentIndex={reviewIndex}
                           totalCount={assets.length}
                           // Pass mock annotations adapted for single view if needed
                           annotations={[
                             ...MOCK_ANNOTATIONS.slice(0, 2).map(a => ({...a, x: 20, y: 30})),
                             ...MOCK_ANNOTATIONS.slice(2, 3).map(a => ({...a, x: 60, y: 40}))
                           ]} 
                        />
                   </motion.div>
                )}
             </AnimatePresence>
          </div>

          {/* Bottom Controls - Shared for both modes */}
          <div className="absolute bottom-4 left-4 right-4 z-40 flex justify-center pointer-events-none">
             <div className="w-full max-w-[600px] pointer-events-auto">
                <PreviewControlsZoom 
                   onZoomIn={handleZoomIn}
                   onZoomOut={handleZoomOut}
                   onReset={handleReset}
                   onAutocorrect={() => handleAutocorrect(reviewIndex)}
                   onRotate={() => {}}
                   onDelete={() => {}}
                   onEditSource={() => {}}
                />
             </div>
          </div>
       </div>
    </div>
  );
}
