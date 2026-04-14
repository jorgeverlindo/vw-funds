import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingBubbleOEMProps {
  isVisible: boolean;
  onDismiss: () => void;
  onIncludeAll: () => void;
  className?: string;
  style?: React.CSSProperties;
}

function TitleAndIcon() {
  return (
    <div className="flex gap-[10px] items-center justify-start w-full">
      <div className="bg-[#fafaff] flex items-center justify-center p-[6px] rounded-full shrink-0 size-[28px]">
         <Sparkles className="text-[#473BAB] size-4 fill-current" />
      </div>
      <p className="font-bold text-[16px] text-white tracking-[0.15px] font-['Roboto']">
        AI Compliance Assistant
      </p>
    </div>
  );
}

export function OnboardingBubbleOEM({ isVisible, onDismiss, onIncludeAll, className, style }: OnboardingBubbleOEMProps) {
  if (!isVisible) return null;

  return (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn("absolute z-50", className)}
        style={style}
    >
        <div className="bg-[#473bab] flex flex-col gap-[12px] items-start justify-center p-[16px] relative z-[2000] rounded-br-[16px] rounded-tl-[16px] rounded-tr-[16px] shadow-lg max-w-[320px]">
          {/* Border overlay */}
          <div aria-hidden="true" className="absolute border border-[#acabff] inset-0 pointer-events-none rounded-br-[16px] rounded-tl-[16px] rounded-tr-[16px]" />
          
          <TitleAndIcon />
          
          <p className="font-normal text-[12px] text-white tracking-[0.17px] leading-[1.43] font-['Roboto']">
            Agent has found 4 issues on the submitted assets. Click "Include All" to add them to your review.
          </p>
          
          {/* Actions */}
          <div className="flex gap-[8px] items-center self-end mt-1 relative z-10">
               {/* Skip (Dismiss) */}
               <button 
                  onClick={onDismiss}
                  className="px-3 py-1.5 rounded-full text-white/90 hover:bg-white/10 active:bg-white/20 transition-colors text-[13px] font-medium tracking-[0.46px] border border-[#6356E1]/50"
               >
                 Skip
               </button>

               {/* Include All */}
               <button 
                  onClick={onIncludeAll}
                  className="px-3 py-1.5 bg-white text-[#473bab] rounded-full hover:bg-gray-50 active:bg-gray-100 transition-colors text-[13px] font-medium tracking-[0.46px]"
               >
                 Include All
               </button>
          </div>
        
        </div>
    </motion.div>
  );
}
