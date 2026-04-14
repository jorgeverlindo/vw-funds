import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

export type PinDirection = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface InteractiveAnnotationProps {
  id: string;
  number: number;
  category: string;
  title: string;
  description: string;
  x: number;
  y: number;
  isOpen: boolean;
  onToggle: () => void;
  direction?: PinDirection;
  delay?: number;
  showCategory?: boolean; // defaults to true — set false to hide the red category badge
}

export function InteractiveAnnotation({
  number,
  category,
  title,
  description,
  x,
  y,
  isOpen,
  onToggle,
  direction = 'top-left', // Default direction
  delay = 0,
  showCategory = true
}: InteractiveAnnotationProps) {

  // Pin Radius Logic
  // Closed State: Uses 'direction' prop (default top-left means sharp top-left corner).
  // Open State: Matches Figma Bubble design (Sharp Bottom-Right to merge with Category).
  
  const getClosedRadius = (dir: string) => {
      switch(dir) {
          case 'top-right': return "rounded-bl-[12px] rounded-br-[12px] rounded-tl-[12px] rounded-tr-none";
          case 'bottom-left': return "rounded-br-[12px] rounded-tl-[12px] rounded-tr-[12px] rounded-bl-none";
          case 'bottom-right': return "rounded-bl-[12px] rounded-tl-[12px] rounded-tr-[12px] rounded-br-none";
          case 'top-left': 
          default: return "rounded-bl-[12px] rounded-br-[12px] rounded-tr-[12px] rounded-tl-none";
      }
  };

  const openRadiusClass = "rounded-bl-[12px] rounded-tl-[12px] rounded-tr-[12px] rounded-br-none";
  const closedRadiusClass = getClosedRadius(direction);
  
  // Transition Config: 450ms, smooth ease-in-out
  const transitionConfig = {
      duration: 0.45,
      ease: "easeInOut"
  };

  return (
    <div
      className="absolute"
      style={{ 
          left: `${x}%`, 
          top: `${y}%`, 
          overflow: 'visible',
          // Apply z-index to the root to ensure proper stacking against siblings.
          zIndex: isOpen ? 3000 : 1000 
      }}
    >
        {/* 
            Wrapper Motion Div:
            - Handles the "Move 20px" animation relative to the anchor point.
            - When Open: translates 20px, 20px.
            - When Closed: translates 0, 0.
        */}
      <motion.div
        layout
        initial={false}
        animate={{ 
            x: isOpen ? 20 : 0, 
            y: isOpen ? 20 : 0
        }}
        transition={transitionConfig}
        className="relative flex items-start justify-start"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        {/* 
            The Bubble Card Container 
            - Expands from Pin size to Bubble size.
            - Fixed Width [231px] when open to match Figma.
        */}
        <motion.div
           layout
           className={cn(
             "relative overflow-hidden cursor-pointer flex items-start",
             isOpen 
                ? "bg-white p-[8px] gap-[7px] rounded-[12px] w-[231px] shadow-[0px_1px_10px_0px_rgba(0,0,0,0.12),0px_4px_5px_0px_rgba(0,0,0,0.14),0px_2px_4px_-1px_rgba(0,0,0,0.2)]" 
                : "bg-transparent p-0 gap-0 shadow-none rounded-none w-auto"
           )}
           style={{ originX: 0, originY: 0 }} // Anchor top-left so it grows right/down
           transition={transitionConfig}
        >
            
            {/* Left Column: Pin + Category */}
            <motion.div layout className="flex flex-col gap-[2px] items-end shrink-0 relative z-20 w-[41px]">
                
                {/* The Pin */}
                <motion.div 
                    className={cn(
                        "flex flex-col items-center justify-center relative shrink-0 size-[16px] bg-[#ef5350] shadow-sm transition-all",
                        isOpen ? openRadiusClass : closedRadiusClass
                    )}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ 
                        ...transitionConfig,
                        delay: isOpen ? 0 : delay // Initial appearance delay
                    }}
                >
                    {/* Inner Border */}
                    <div className={cn(
                        "absolute border border-solid border-white inset-0 pointer-events-none transition-all", 
                        isOpen ? openRadiusClass : closedRadiusClass
                    )} />
                    <span className="text-[10px] text-white font-['Roboto'] font-normal leading-[10px]">{number}</span>
                </motion.div>

                {/* Category Label */}
                {showCategory && (
                <AnimatePresence mode="popLayout">
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: -5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: -5 }}
                            transition={{ duration: 0.2, delay: 0.1 }} // Delayed entrance
                            className="bg-[#ef5350] flex items-center p-[4px] rounded-bl-[6px] rounded-br-[6px] rounded-tl-[6px] shrink-0 w-full"
                        >
                            <div className="flex flex-col items-end w-full">
                                <div className="flex items-center">
                                    <span className="text-[14px] font-medium text-white font-['Roboto'] leading-[1.57] tracking-[0.1px]">
                                        {category.replace('CATA', '').trim()}
                                    </span>
                                </div>
                                <div className="flex flex-col items-center justify-center w-full">
                                    <span className="text-[11px] font-normal text-white font-['Roboto'] leading-[1.66] tracking-[0.4px]">CATA</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                )}

            </motion.div>

            {/* Right Column: Title + Description */}
            <AnimatePresence mode="popLayout">
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.25, delay: 0.15 }} // Sequencing
                        className="flex flex-col gap-[6px] items-start justify-center flex-1 min-w-0"
                    >
                        <div className="w-full text-start">
                            <p className="font-['Roboto'] font-bold text-[#1f1d25] text-[10px] leading-[1.2] w-full break-words">
                                {title}
                            </p>
                        </div>
                        <div className="w-full text-start">
                            <p className="font-['Roboto'] font-normal text-[#1f1d25] text-[10px] leading-[1.2] w-full mb-0 break-words">
                                {description}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </motion.div>
      </motion.div>
    </div>
  );
}