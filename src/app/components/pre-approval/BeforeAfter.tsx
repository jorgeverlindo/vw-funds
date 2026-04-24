import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import svgPaths from "@/imports/svg-xcn0jfelp2";
import { cn } from "@/lib/utils";

import imgOriginal1 from "figma:asset/6c90c9a4d0d01ef433bdc2c63e4e4788a218a046.png";
import imgEnhanced1 from "figma:asset/f925b175d9f45ba629bdedc9c27563c3216090ba.png";
// Next ad images - using provided asset dcd4a... for both for now or finding another
import imgNextAd from "figma:asset/dcd4a062f63eda60d1f2ae0b47f935693f998f44.png";

import { InteractiveAnnotation } from "./InteractiveAnnotation";

interface AnnotationItem {
  id: string;
  number: number;
  category: string;
  title: string;
  description: string;
  x: number;
  y: number;
}

interface Creative {
    id: number;
    original: string;
    enhanced: string;
    annotations: AnnotationItem[];
}

const CREATIVES: Creative[] = [
    {
        id: 1,
        original: imgOriginal1,
        enhanced: imgEnhanced1,
        annotations: [
            {
              id: '1',
              number: 1,
              category: '3A',
              title: 'Background Colors',
              description: 'Must adhere to Primary & Secondary brand color palettes.',
              x: 20,
              y: 30
            },
            {
              id: '2',
              number: 2,
              category: '1D',
              title: 'Font Types',
              description: 'Volkswagen approved fonts must be used.',
              x: 45,
              y: 15
            }
        ]
    },
    {
        id: 2,
        original: imgNextAd,
        enhanced: imgNextAd, // In a real app these would be different
        annotations: [
            {
              id: 'n1',
              number: 1,
              category: '2D',
              title: 'Logo Placement',
              description: 'Logo must be placed in the top right corner.',
              x: 80,
              y: 10
            }
        ]
    }
];

interface BeforeAfterProps {
  isVisible: boolean;
  onAccept: () => void;
  onCancel: () => void;
  annotations?: AnnotationItem[]; // Keep for legacy but we'll use internal state
  className?: string;
}

function InsertHtmlCodeBrackets() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="insert-html,code, brackets">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="insert-html,code, brackets">
          <path d={svgPaths.p14e76d80} id="vector" stroke="var(--stroke-0, #473BAB)" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
}

function Scrub() {
  return (
    <div className="bg-white content-stretch flex items-center justify-center p-[8px] relative rounded-[72px] shrink-0 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] cursor-grab active:cursor-grabbing" data-name="Scrub">
      <div aria-hidden="true" className="absolute border-2 border-[#473bab] border-solid inset-0 pointer-events-none rounded-[72px]" />
      <InsertHtmlCodeBrackets />
    </div>
  );
}

function ChevronLeft() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="chevron-left">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="chevron-left">
          <path d={svgPaths.p13228100} id="vector" stroke="var(--stroke-0, #686576)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function ChevronRight() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="chevron-right">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="chevron-right">
          <path d={svgPaths.p151a0480} id="vector" stroke="var(--stroke-0, #686576)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function IconCheck() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14.25 4.5L6.75 12L3.75 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

export function BeforeAfter({ 
  isVisible, 
  onAccept, 
  onCancel, 
  className, 
  image,
  // New props for external control
  onNext,
  onPrev,
  hasPrevious,
  hasNext,
  currentIndex,
  totalCount,
  annotations = []
}: BeforeAfterProps & { 
  image?: string;
  onNext?: () => void;
  onPrev?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  currentIndex?: number;
  totalCount?: number;
}) {
  const [internalIndex, setInternalIndex] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(50); // Percentage 0-100
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);
  
  // Use external props if provided (Portal Mode), otherwise internal (Legacy/Demo Mode)
  const isExternal = image !== undefined;
  
  const currentCreative = isExternal
    ? { id: 0, original: image!, enhanced: image!, annotations: annotations }
    : (CREATIVES[internalIndex] || CREATIVES[0]);
    
  const displayIndex = isExternal ? (currentIndex ?? 0) : internalIndex;
  const displayTotal = isExternal ? (totalCount ?? 1) : CREATIVES.length;
  
  const handleNext = () => {
    if (isExternal) {
        onNext?.();
    } else {
        setInternalIndex(prev => Math.min(CREATIVES.length - 1, prev + 1));
    }
  };

  const handlePrev = () => {
      if (isExternal) {
          onPrev?.();
      } else {
          setInternalIndex(prev => Math.max(0, prev - 1));
      }
  };
  
  const canGoNext = isExternal ? hasNext : internalIndex < CREATIVES.length - 1;
  const canGoPrev = isExternal ? hasPrevious : internalIndex > 0;

  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent drag
    isDragging.current = true;
    document.body.style.cursor = 'grabbing';
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.body.style.cursor = '';
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  };

  useEffect(() => {
    if (isVisible) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isVisible]);

  const animateSlider = (target: number) => {
      setSliderPosition(target);
  };

  const handleAcceptClick = () => {
      if (canGoNext) {
          // Advance index smoothly
          handleNext();
          setSliderPosition(50);
          setActiveAnnotationId(null);
      } else {
          // Last one, finish
          onAccept();
      }
  };

  if (!isVisible) return null;

  return (
    <div className={cn("absolute inset-0 z-[100] bg-[#f0f2f4] flex flex-col items-center pt-6 pb-4 px-4", className)}>
      
      {/* 1. Header: Pagination & Title */}
      <div className="flex flex-col items-center gap-1 mb-4 z-10 shrink-0">
         <div className="text-[9px] font-normal text-[#1f1d25] tracking-[0.4px]">
            {displayIndex + 1} / {displayTotal}
         </div>
         <h2 className="text-[16px] font-medium text-[#1f1d25] tracking-[0.15px]">Autocorrection</h2>
      </div>

      {/* 2. Main Content Area */}
      <div className="relative flex-1 w-full flex flex-col items-center justify-center min-h-0">
        
        {/* Navigation Arrows */}
        <button
            type="button"
            onClick={handlePrev}
            className="absolute left-0 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 z-20 top-1/2 -translate-y-1/2 cursor-pointer disabled:opacity-30"
            disabled={!canGoPrev}
        >
            <ChevronLeft />
        </button>

        <button
            type="button"
            onClick={handleNext}
            className="absolute right-0 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 z-20 top-1/2 -translate-y-1/2 cursor-pointer disabled:opacity-30"
            disabled={!canGoNext}
        >
            <ChevronRight />
        </button>

        {/* Image Comparison Container */}
        <div className="relative w-auto h-full max-h-[calc(100%-80px)] aspect-[575/575] flex flex-col items-center justify-center">
            
            {/* Top Chips (Original / Enhanced) */}
            <div className="absolute top-[-12px] left-0 z-30 transform -translate-y-full">
                <button
                    type="button"
                    onClick={() => animateSlider(0)}
                    className="bg-[#e3f2fd] text-[#01579b] px-3 py-1 rounded-[8px] text-[11px] font-normal tracking-[0.16px] hover:bg-[#bbdefb] transition-colors cursor-pointer"
                >
                    Original
                </button>
            </div>
            <div className="absolute top-[-12px] right-0 z-30 transform -translate-y-full">
                <button
                    type="button"
                    onClick={() => animateSlider(100)}
                    className="bg-[#e8f5e9] text-[#1b5e20] px-3 py-1 rounded-[8px] text-[11px] font-normal tracking-[0.16px] hover:bg-[#c8e6c9] transition-colors cursor-pointer"
                >
                    Enhanced
                </button>
            </div>

            {/* The Image Viewer */}
            <div 
                ref={containerRef}
                className="relative w-full h-full shadow-lg select-none overflow-visible bg-white"
            >
                {/* Bottom Layer: Original (Visible when slider is left) */}
                <motion.img 
                    key={`orig-${displayIndex}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    src={currentCreative.original} 
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none" 
                    alt="Original" 
                />

                {/* Top Layer: Enhanced (Clipped) */}
                <motion.div 
                    className="absolute inset-y-0 left-0 overflow-hidden"
                    initial={false}
                    animate={{ 
                        width: `${sliderPosition}%`,
                        opacity: showAnnotations ? 0 : 1 
                    }}
                    transition={isDragging.current ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
                >
                     <ImageWidthSync key={`sync-${displayIndex}`} containerRef={containerRef} src={currentCreative.enhanced} />
                </motion.div>

                {/* Slider Handle (Hidden when Annotations View is active) */}
                <motion.div 
                    className="absolute inset-y-0 w-0.5 z-40 flex items-center justify-center"
                    initial={false}
                    animate={{ 
                        left: `${sliderPosition}%`,
                        opacity: showAnnotations ? 0 : 1 
                    }}
                    transition={isDragging.current ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
                    style={{ pointerEvents: showAnnotations ? 'none' : 'auto' }}
                    onMouseDown={handleMouseDown}
                >
                    <div className="absolute inset-y-0 w-[2px] bg-white/50 cursor-grab active:cursor-grabbing hover:bg-white transition-colors" />
                    <Scrub />
                </motion.div>

                {/* Annotations Overlay */}
                <div className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
                    <AnimatePresence>
                        {showAnnotations && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="absolute inset-0"
                                style={{ overflow: 'visible' }}
                            >
                                {currentCreative.annotations.map((ann, index) => (
                                    <div key={`${displayIndex}-${ann.id}`} className="pointer-events-auto" style={{ overflow: 'visible' }}>
                                        <InteractiveAnnotation
                                            {...ann}
                                            isOpen={activeAnnotationId === ann.id}
                                            onToggle={() => setActiveAnnotationId(activeAnnotationId === ann.id ? null : ann.id)}
                                            delay={index * 0.1}
                                            direction="bottom-right"
                                        />
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </div>

            {/* View Annotations Chip */}
            <div className="absolute bottom-[-12px] left-1/2 transform -translate-x-1/2 translate-y-full z-30">
                <button
                    type="button"
                    onClick={() => setShowAnnotations(!showAnnotations)}
                    className={cn(
                        "px-3 py-1 rounded-[8px] text-[11px] font-normal tracking-[0.16px] transition-colors cursor-pointer",
                        showAnnotations ? "bg-[#e0e0e0] text-[#1f1d25]" : "bg-[rgba(17,16,20,0.04)] text-[#1f1d25] hover:bg-[rgba(17,16,20,0.08)]"
                    )}
                >
                    {showAnnotations ? "View Comparison" : "View Annotations"}
                </button>
            </div>

        </div>
      </div>

      {/* 3. Footer Actions */}
      <div className="mt-8 flex gap-4 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 rounded-full border border-transparent text-[#473bab] font-medium text-[13px] tracking-[0.46px] hover:bg-gray-50 transition-colors uppercase cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAcceptClick}
            className="px-6 py-2 rounded-full bg-[#473bab] text-white font-medium text-[13px] tracking-[0.46px] hover:bg-[#3d3293] transition-colors flex items-center gap-2 uppercase cursor-pointer"
          >
            <IconCheck />
            {canGoNext ? 'Accept & Next' : 'Accept'}
          </button>
      </div>
    </div>
  );
}

// Helper component to keep the clipped image width in sync with the container
function ImageWidthSync({ containerRef, src }: { containerRef: React.RefObject<HTMLDivElement>, src: string }) {
    const ref = useRef<HTMLImageElement>(null);
    const [dims, setDims] = useState({ w: 0, h: 0 });
    
    useEffect(() => {
        const updateWidth = () => {
            if (ref.current && containerRef.current) {
                setDims({
                    w: containerRef.current.offsetWidth,
                    h: containerRef.current.offsetHeight
                });
            }
        };
        
        updateWidth();
        const observer = new ResizeObserver(updateWidth);
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }
        window.addEventListener('resize', updateWidth);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', updateWidth);
        }
    }, [containerRef]);

    return (
        <motion.img 
            ref={ref}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            src={src} 
            className="absolute top-0 left-0 max-w-none object-contain pointer-events-none" 
            style={{ width: dims.w, height: dims.h }}
            alt="Sync" 
        />
    );
}
