import { cn } from '@/lib/utils';

interface AnnotationCardProps {
  number: number;
  category: string;
  title: string;
  description: string;
  isActive?: boolean;
  onClick?: () => void;
}

export function AnnotationCard({
  number,
  category,
  title,
  description,
  isActive,
  onClick,
}: AnnotationCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex cursor-pointer gap-3 rounded-lg border border-transparent bg-white p-3 shadow-sm transition-all hover:border-[rgba(0,0,0,0.08)] hover:shadow-md",
        isActive && "ring-2 ring-[#473BAB] ring-offset-1"
      )}
    >
      {/* Left Column: Badges */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#D2323F] text-[10px] font-bold text-white">
          {number}
        </div>
        <div className="flex flex-col items-center rounded-[4px] bg-[#D2323F] px-1.5 py-0.5 text-[9px] font-bold leading-tight text-white">
          <span>{category}</span>
          <span className="text-[7px] opacity-90">CATA</span>
        </div>
      </div>

      {/* Right Column: Text */}
      <div className="flex flex-col gap-1 min-w-0">
        <h4 className="text-[13px] font-medium text-[#1F1D25] leading-tight line-clamp-2">
          {title}
        </h4>
        <p className="text-[11px] text-[#686576] leading-relaxed line-clamp-3">
          {description}
        </p>
      </div>
    </div>
  );
}
