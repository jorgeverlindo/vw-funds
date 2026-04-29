import { motion } from "motion/react";
import svgPaths from "@/imports/svg-9u2cw5p4e3";
import { cn } from "@/lib/utils";

interface OnboardingBubbleProps {
  isVisible: boolean;
  onSkip: () => void;
  onAutocorrect?: () => void;
  hideAutocorrect?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

function SparklesSoft() {
  return (
    <div className="relative shrink-0 size-[15.273px]" data-name="sparkles-soft">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.2727 15.2727">
        <g id="sparkles-soft">
          <path d={svgPaths.p1f0e9a00} fill="var(--fill-0, #473BAB)" id="vector" stroke="var(--stroke-0, #6356E1)" strokeWidth="0.453704" />
        </g>
      </svg>
    </div>
  );
}

function Icon() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="<Icon>">
      <SparklesSoft />
    </div>
  );
}

function RecommendationIcon() {
  return (
    <div className="bg-[#fafaff] content-stretch flex items-center p-[6.364px] relative rounded-[63.636px] shrink-0 size-[28px]" data-name="Recommendation ICon">
      <Icon />
    </div>
  );
}

function TitleAndIcon() {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0 w-full" data-name="Tittle and Icon">
      <RecommendationIcon />
      <p className="css-4hzbpn flex-[1_0_0] font-['Roboto:Bold',sans-serif] font-bold leading-[1.75] min-h-px min-w-px relative text-[16px] text-white tracking-[0.15px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        AI Compliance Assistant
      </p>
    </div>
  );
}

interface ActionProps {
    onClick?: () => void;
}

function SkipButton({ onClick }: ActionProps) {
  return (
    <div 
        className="relative rounded-[100px] shrink-0 cursor-pointer group" 
        data-name="Action 2"
        onClick={onClick}
    >
      <div className="content-stretch flex flex-col items-center justify-center overflow-clip px-[10px] py-[4px] relative rounded-[inherit] transition-colors group-hover:bg-white/10 group-active:bg-white/20">
        <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0" data-name="Base">
            <p className="capitalize css-ew64yg font-['Roboto:Medium',sans-serif] font-medium leading-[22px] relative shrink-0 text-[13px] text-white tracking-[0.46px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                Skip
            </p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(99,86,225,0.5)] border-solid inset-0 pointer-events-none rounded-[100px]" />
    </div>
  );
}

function AutocorrectButton({ onClick }: ActionProps) {
  return (
    <div 
        className="bg-white content-stretch flex flex-col items-center justify-center overflow-clip px-[10px] py-[4px] relative rounded-[100px] shrink-0 cursor-pointer transition-colors hover:bg-gray-50 active:bg-gray-100" 
        data-name="Action 1"
        onClick={onClick}
    >
      <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0" data-name="Base">
        <p className="capitalize css-ew64yg font-['Roboto:Medium',sans-serif] font-medium leading-[22px] relative shrink-0 text-[#473bab] text-[13px] tracking-[0.46px]" style={{ fontVariationSettings: "'wdth' 100" }}>
            Autocorrect
        </p>
      </div>
    </div>
  );
}

function BubbleActions({ onSkip, onAutocorrect, hideAutocorrect }: { onSkip: () => void, onAutocorrect?: () => void, hideAutocorrect?: boolean }) {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Bubble Actions">
      <SkipButton onClick={onSkip} />
      {!hideAutocorrect && <AutocorrectButton onClick={onAutocorrect} />}
    </div>
  );
}

export function OnboardingBubble({ isVisible, onSkip, onAutocorrect, hideAutocorrect, className, style }: OnboardingBubbleProps) {
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
        <div className="bg-[#473bab] content-stretch flex flex-col gap-[10px] items-end justify-center p-[16px] relative z-[2000] rounded-br-[16px] rounded-tl-[16px] rounded-tr-[16px] shadow-lg max-w-[300px]" data-name="Wizard bubble">
        <div aria-hidden="true" className="absolute border border-[#acabff] border-solid inset-0 pointer-events-none rounded-br-[16px] rounded-tl-[16px] rounded-tr-[16px] shadow-[0px_1px_10px_0px_rgba(0,0,0,0.12),0px_4px_5px_0px_rgba(0,0,0,0.14),0px_2px_4px_-1px_rgba(0,0,0,0.2)]" />
        <TitleAndIcon />
        <p className="css-4hzbpn font-['Roboto:Regular',sans-serif] font-normal leading-[1.43] min-w-full relative shrink-0 text-[12px] text-white tracking-[0.17px]" style={{ fontVariationSettings: "'wdth' 100" }}>
            {`Brand guidelines issues were found in the assets you're submitting, please check below`}
        </p>
        <BubbleActions onSkip={onSkip} onAutocorrect={onAutocorrect} hideAutocorrect={hideAutocorrect} />
        </div>
    </motion.div>
  );
}
