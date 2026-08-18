import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

export type PinDirection = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface InteractiveAnnotationProps {
  id: string;
  number: number;
  category: string;
  ruleNumber?: string; // e.g. "3B" from rule code CAT-A-3B
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
  ruleNumber,
  title,
  description,
  x,
  y,
  isOpen,
  onToggle,
  direction = 'top-left',
  delay = 0,
  showCategory = true
}: InteractiveAnnotationProps) {

  // When the pin is in the right half of the container (x > 50%), the bubble must
  // anchor from its right edge so it never overflows the screenshot boundary.
  const expandsLeft = x > 50;

  // Closed pin shape: the sharp corner points toward where the bubble will appear.
  // Internal layout is always [pin | text] left-to-right, so no direction mirroring needed.
  const getClosedRadius = (dir: string) => {
      switch(dir) {
          case 'top-right': return "rounded-bl-[12px] rounded-br-[12px] rounded-tl-[12px] rounded-tr-none";
          case 'bottom-left': return "rounded-br-[12px] rounded-tl-[12px] rounded-tr-[12px] rounded-bl-none";
          case 'bottom-right': return "rounded-bl-[12px] rounded-tl-[12px] rounded-tr-[12px] rounded-br-none";
          case 'top-left':
          default: return "rounded-bl-[12px] rounded-br-[12px] rounded-tr-[12px] rounded-tl-none";
      }
  };

  // Open state: pin is always on the left, text always on the right.
  // Sharp corner is always bottom-right (connecting pin to the badge below it,
  // with text column to the right).
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
          // When expandsLeft anchor by the RIGHT edge so the bubble never overflows right.
          // right: (100 - x)% places the div's right edge at x% of the container.
          ...(expandsLeft ? { right: `${100 - x}%` } : { left: `${x}%` }),
          top: `${y}%`,
          overflow: 'visible',
          zIndex: isOpen ? 30 : 10
      }}
    >
      <motion.div
        layout
        initial={false}
        animate={{
            x: isOpen ? (expandsLeft ? -20 : 20) : 0,
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
            Bubble Card Container — internal layout is always [pin column | text column].
            The card anchors from the right edge when expandsLeft (via originX: 1),
            so it floats left without reversing the internal order.
        */}
        <motion.div
           layout
           className={cn(
             "relative overflow-hidden cursor-pointer flex items-start",
             isOpen
                ? "bg-white p-[24px] gap-[7px] rounded-[12px] w-[300px] shadow-[0px_1px_10px_0px_rgba(0,0,0,0.12),0px_4px_5px_0px_rgba(0,0,0,0.14),0px_2px_4px_-1px_rgba(0,0,0,0.2)]"
                : "bg-transparent p-0 gap-0 shadow-none rounded-none w-auto"
           )}
           style={{ originX: expandsLeft ? 1 : 0, originY: 0 }}
           transition={transitionConfig}
        >

            {/* Left Column: Pin + Category — always on the left */}
            <motion.div layout className="flex flex-col gap-[2px] items-end shrink-0 relative z-20 w-auto">

                {/* The Pin */}
                <motion.div
                    className={cn(
                        "flex flex-col items-center justify-center relative shrink-0 size-[24px] bg-[#ef5350] transition-all",
                        !isOpen && "shadow-[0px_1px_10px_0px_rgba(0,0,0,0.12),0px_4px_5px_0px_rgba(0,0,0,0.14),0px_2px_4px_-1px_rgba(0,0,0,0.2)]",
                        isOpen ? openRadiusClass : closedRadiusClass
                    )}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                        ...transitionConfig,
                        delay: isOpen ? 0 : delay
                    }}
                >
                    {/* Inner Border */}
                    <div className={cn(
                        "absolute border border-solid border-white inset-0 pointer-events-none transition-all",
                        isOpen ? openRadiusClass : closedRadiusClass
                    )} />
                    <span className="text-[14px] text-white font-['Roboto'] font-normal leading-[14px]">{number}</span>
                </motion.div>

                {/* Category Label */}
                {showCategory && (
                <AnimatePresence mode="popLayout">
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: -5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: -5 }}
                            transition={{ duration: 0.2, delay: 0.1 }}
                            className="bg-[#ef5350] flex items-center p-[4px] shrink-0 w-auto rounded-bl-[6px] rounded-br-[6px] rounded-tl-[6px]"
                        >
                            <div className="flex flex-col items-end w-auto">
                                {ruleNumber && (
                                  <div className="flex items-center">
                                    <span className="text-[14px] font-medium text-white font-['Roboto'] leading-[1.57] tracking-[0.1px]">
                                        {ruleNumber}
                                    </span>
                                  </div>
                                )}
                                <div className="flex flex-col items-center justify-center w-auto">
                                    <span className="text-[14px] font-normal text-white font-['Roboto'] leading-[1.66] tracking-[0.4px]">Cat. {category}</span>
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
                        transition={{ duration: 0.25, delay: 0.15 }}
                        className="flex flex-col gap-[6px] items-start justify-center flex-1 min-w-0"
                    >
                        <div className="w-full text-start">
                            <p className="font-['Roboto'] font-bold text-[#1f1d25] text-[14px] leading-[1.2] w-full break-words">
                                {title}
                            </p>
                        </div>
                        <div className="w-full text-start">
                            <p className="font-['Roboto'] font-normal text-[#1f1d25] text-[14px] leading-[1.2] w-full mb-0 break-words">
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
