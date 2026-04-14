import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export type PinDirection = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface AnnotationPinProps {
  number: number;
  direction?: PinDirection;
  onClick?: () => void;
  className?: string;
  delay?: number;
}

export function AnnotationPin({
  number,
  direction = 'top-left',
  onClick,
  className,
  delay = 0
}: AnnotationPinProps) {
  
  // Radius logic based on imports:
  // top-left pointing (Annotation): rounded-bl-12 rounded-br-12 rounded-tr-12 (tl is sharp)
  // top-right pointing (Annotation1): rounded-bl-12 rounded-br-12 rounded-tl-12 (tr is sharp)
  // bottom-left pointing (Annotation2): rounded-br-12 rounded-tl-12 rounded-tr-12 (bl is sharp)
  // bottom-right pointing (Annotation3): rounded-bl-12 rounded-tl-12 rounded-tr-12 (br is sharp)

  const radiusClasses = {
    'top-left': 'rounded-bl-[12px] rounded-br-[12px] rounded-tr-[12px] rounded-tl-none',
    'top-right': 'rounded-bl-[12px] rounded-br-[12px] rounded-tl-[12px] rounded-tr-none',
    'bottom-left': 'rounded-br-[12px] rounded-tl-[12px] rounded-tr-[12px] rounded-bl-none',
    'bottom-right': 'rounded-bl-[12px] rounded-tl-[12px] rounded-tr-[12px] rounded-br-none',
  };

  return (
    <motion.button
      layoutId={`pin-${number}`}
      initial={{ opacity: 0, scale: 0, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: delay 
      }}
      className={cn(
        "group relative flex items-center justify-center cursor-pointer focus:outline-none",
        className
      )}
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className={cn(
        "flex h-4 w-4 items-center justify-center bg-[#EF5350] p-[4px] shadow-sm relative",
        radiusClasses[direction]
      )}>
        {/* Inner Border */}
        <div className={cn(
          "absolute inset-0 border border-white pointer-events-none",
          radiusClasses[direction]
        )} />
        
        {/* Number */}
        <span className="text-[10px] font-normal leading-[10px] text-white font-['Roboto']">
          {number}
        </span>
      </div>
    </motion.button>
  );
}
