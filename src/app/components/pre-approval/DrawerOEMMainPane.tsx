import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { ScrollerAnnotationsOEM, AnnotationItem } from './ScrollerAnnotationsOEM';
import { InteractiveAnnotation } from './InteractiveAnnotation';
import { OnboardingBubbleOEM } from './OnboardingBubbleOEM';
import { PreviewControlsZoom } from './PreviewControlsZoom';

// Import Portal Images
import imgCardImage from "figma:asset/5b760d55d2388a38009c20fbc7474decb0d7b3fe.png";
import imgCardImage1 from "figma:asset/f925b175d9f45ba629bdedc9c27563c3216090ba.png";
import imgCardImage2 from "figma:asset/dcd4a062f63eda60d1f2ae0b47f935693f998f44.png";

// Reusing OEM Annotations
const OEM_ANNOTATIONS: AnnotationItem[] = [
  {
    id: '1',
    number: 1,
    category: '3A CATA',
    title: 'Background Colors (if not using lifestyle vehicle photography)',
    description: 'Must adhere to Primary & Secondary brand color palettes. The background must not include any design elements',
    x: 20,
    y: 20 // Adjusted for vertical list of images
  },
  {
    id: '2',
    number: 2,
    category: '1D CATA',
    title: 'Font Types',
    description: 'Volkswagen approved fonts must be used across all assets.\n\n• VW Head Light\n• VW Head Regular\n• VW Head Bold\n• VW Head Extra Bold\n• VW Text',
    x: 45,
    y: 10
  },
  {
    id: '3',
    number: 3,
    category: '3A CATA',
    title: 'Logo Protection',
    description: 'The VW logo has a protected zone. Design elements or type must not intrude on this zone. The protected zone is equal to half of the logo diameter on all sides.',
    x: 70,
    y: 40
  },
  {
    id: '4',
    number: 4,
    category: '2D CATA',
    title: 'Assets may not contain graphics',
    description: '',
    x: 80,
    y: 60
  }
];

interface DrawerOEMMainPaneProps {
  checkedIds: Set<string>;
  onToggleCheck: (id: string, checked: boolean) => void;
  onIncludeAll: () => void;
}

export function DrawerOEMMainPane({ checkedIds, onToggleCheck, onIncludeAll }: DrawerOEMMainPaneProps) {
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);
  const [annotations] = useState<AnnotationItem[]>(OEM_ANNOTATIONS);
  const [showOnboarding, setShowOnboarding] = useState(true);

  return (
    <div className="flex h-full w-full gap-4 overflow-hidden relative">
            {/* Left Sidebar: Annotations List */}
            <div className="w-[240px] flex-none flex flex-col h-full relative z-20">
               <ScrollerAnnotationsOEM 
                 annotations={annotations} 
                 activeId={activeAnnotationId}
                 onSelect={setActiveAnnotationId}
                 checkedIds={checkedIds}
                 onToggleCheck={onToggleCheck}
                 className="h-full"
               />
               {/* Removed extra Include All button */}
            </div>

            {/* Center Canvas */}
            <div className="flex-1 relative flex flex-col items-center bg-transparent rounded-lg z-0 overflow-hidden">
               
               {/* Image Container - Scrollable Canvas */}
               <div className="flex-1 w-full overflow-y-auto custom-scrollbar relative p-8">
                   <div className="relative w-full max-w-[800px] mx-auto flex flex-col gap-8 pb-20">
                      {/* Image 1 */}
                      <div className="relative shadow-sm bg-white p-2">
                        <img src={imgCardImage} alt="Asset 1" className="w-full h-auto block" />
                      </div>
                      
                      {/* Image 2 */}
                      <div className="relative shadow-sm bg-white p-2">
                        <img src={imgCardImage1} alt="Asset 2" className="w-full h-auto block" />
                      </div>

                      {/* Image 3 */}
                      <div className="relative shadow-sm bg-white p-2">
                        <img src={imgCardImage2} alt="Asset 3" className="w-full h-auto block" />
                      </div>

                      {/* Pins Overlay - Absolute over the entire scrollable content area? 
                          Or fixed over the viewport? 
                          Usually pins are relative to the image. 
                          Since we have multiple images and hardcoded coordinates in % (0-100), 
                          placing them over the whole column is tricky. 
                          For this implementation, I will place the overlay over the entire column wrapper 
                          assuming the coordinates map to this tall area or just the first image area.
                          Given the constraints, I'll wrap the images in a relative div and put pins there.
                       */}
                       <div className="absolute inset-0 pointer-events-none">
                          <div className="relative w-full h-full pointer-events-auto">
                            {annotations.map((ann, index) => (
                               <InteractiveAnnotation
                                  key={ann.id}
                                  {...ann}
                                  isOpen={activeAnnotationId === ann.id}
                                  onToggle={() => setActiveAnnotationId(activeAnnotationId === ann.id ? null : ann.id)}
                                  delay={index * 0.15}
                                  direction="bottom-right"
                               />
                            ))}
                          </div>
                       </div>
                   </div>
               </div>
               
               {/* Onboarding Bubble - Variant */}
               <AnimatePresence>
                    {showOnboarding && (
                        <OnboardingBubbleOEM 
                            isVisible={true} 
                            onDismiss={() => setShowOnboarding(false)}
                            onIncludeAll={() => {
                                onIncludeAll();
                                setShowOnboarding(false);
                            }}
                            className="absolute left-4 top-4 z-[1005]" 
                        />
                    )}
               </AnimatePresence>

               {/* Zoom Control Bar */}
               <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[600px] z-10">
                   <PreviewControlsZoom 
                        onAutocorrect={() => {}}
                        onReset={() => {}}
                        onDelete={() => {}}
                        onZoomIn={() => {}}
                        onZoomOut={() => {}}
                   />
               </div>
            </div>
    </div>
  );
}

// Export the annotations so DrawerOEM can use them for the "Include All" logic
export { OEM_ANNOTATIONS };
