import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface AnnotationBubbleProps {
  number: number;
  category: string;
  title: string;
  description: string;
  onClose?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function AnnotationBubble({
  number,
  category,
  title,
  description,
  onClose,
  className,
  style
}: AnnotationBubbleProps) {
  return (
    <motion.div
      layoutId={`pin-${number}`}
      className={cn(
        "absolute z-50 flex min-w-[240px] max-w-[280px] flex-col overflow-hidden rounded-xl bg-white shadow-[0px_4px_24px_rgba(0,0,0,0.12),0px_0px_1px_rgba(0,0,0,0.2)]",
        className
      )}
      style={style}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={(e) => {
        e.stopPropagation(); 
        onClose?.(); // Click to collapse
      }}
    >
      <div className="flex flex-row p-2 gap-2 items-start">
        {/* Left Side: Cypher Block */}
        <div className="flex flex-col gap-[2px] items-end shrink-0 w-[41px]">
           {/* Small Pin Replica */}
           <div className="flex h-4 w-4 items-center justify-center bg-[#EF5350] p-[4px] rounded-bl-[12px] rounded-br-[12px] rounded-tr-[12px] relative shadow-sm">
              <div className="absolute inset-0 border border-white pointer-events-none rounded-bl-[12px] rounded-br-[12px] rounded-tr-[12px]" />
              <span className="text-[10px] font-normal leading-[10px] text-white font-['Roboto']">{number}</span>
           </div>
           
           {/* Category Block */}
           <div className="bg-[#EF5350] flex items-center p-[4px] rounded-bl-[6px] rounded-br-[6px] rounded-tl-[6px]">
              <div className="flex flex-col items-end">
                 <div className="flex h-4 items-center">
                    <span className="text-[14px] font-medium text-white font-['Roboto']">{category.replace('CATA', '').trim()}</span>
                 </div>
                 <div className="flex h-3 items-center justify-center w-full">
                    <span className="text-[11px] font-normal text-white font-['Roboto']">CATA</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Side: Content */}
        <div className="flex flex-col gap-1.5 pt-0.5">
          <h4 className="text-[11px] font-bold text-[#1F1D25] leading-tight font-['Roboto']">
            {title}
          </h4>
          <p className="text-[10px] text-[#1F1D25] leading-tight font-['Roboto']">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
