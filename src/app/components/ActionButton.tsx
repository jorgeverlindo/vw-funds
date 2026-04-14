import { cn } from "../../lib/utils";

const svgPath = "M9 5.0625V9M9 9V12.9375M9 9H5.0625M9 9H12.9375";

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export function ActionButton({ label, className, ...props }: ActionButtonProps) {
  return (
    <button 
      className={cn(
        "bg-[#473bab] h-10 flex items-center justify-center overflow-hidden px-4 rounded-[100px] shrink-0 transition-colors hover:bg-[#3d329b] cursor-pointer",
        className
      )}
      {...props}
    >
      <div className="flex gap-[8px] items-center justify-center relative shrink-0">
        <div className="h-[18px] relative shrink-0 w-[16px]">
          <div className="absolute left-[calc(50%-1px)] size-[18px] top-1/2 translate-x-[-50%] translate-y-[-50%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
              <g>
                <path d={svgPath} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
              </g>
            </svg>
          </div>
        </div>
        <p className="capitalize font-medium leading-[22px] text-[13px] text-white tracking-[0.46px] font-['Roboto']">
          {label}
        </p>
      </div>
    </button>
  );
}