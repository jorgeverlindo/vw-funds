import { cn } from '@/lib/utils';
import { AnnotationItem } from './ScrollerAnnotations';
import { CheckboxOEM } from '@/app/components/ui/CheckboxOEM';

// Re-export AnnotationItem for convenience
export type { AnnotationItem } from './ScrollerAnnotations';

interface ScrollerAnnotationsOEMProps {
  annotations: AnnotationItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  checkedIds: Set<string>;
  onToggleCheck: (id: string, checked: boolean) => void;
  className?: string;
}

export function ScrollerAnnotationsOEM({
  annotations,
  activeId,
  onSelect,
  checkedIds,
  onToggleCheck,
  className,
}: ScrollerAnnotationsOEMProps) {
  return (
    <div className={cn("relative h-full flex flex-col w-[240px] overflow-hidden rounded-bl-[12px] rounded-tl-[12px] bg-white", className)}>
       <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 20px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.3);
        }
      `}</style>
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar">
        {annotations.map((item) => (
          <div
            key={item.id}
            className={cn(
              "relative rounded-[12px] shrink-0 w-full transition-all group border border-transparent",
              activeId === item.id ? "ring-2 ring-[#473BAB] ring-offset-1" : "hover:bg-gray-50 border-gray-100"
            )}
          >
             {/* Card Content - Click to select/activate pin */}
             <div 
               className="flex flex-col gap-3 p-3 cursor-pointer"
               onClick={() => onSelect(item.id)}
             >
                <div className="flex gap-[10px] items-start w-full">
                  {/* Left Side: Cypher Block */}
                  <div className="flex flex-col gap-[2px] items-end shrink-0 w-[41px]">
                     {/* Small Pin Replica */}
                     <div className="flex h-4 w-4 items-center justify-center bg-[#EF5350] p-[4px] rounded-bl-[12px] rounded-tl-[12px] rounded-tr-[12px] relative shadow-sm">
                        <div className="absolute inset-0 border border-white pointer-events-none rounded-bl-[12px] rounded-tl-[12px] rounded-tr-[12px]" />
                        <span className="text-[10px] font-normal leading-[10px] text-white font-['Roboto']">{item.number}</span>
                     </div>
                     
                     {/* Category Block */}
                     <div className="bg-[#EF5350] flex items-center p-[4px] rounded-bl-[6px] rounded-br-[6px] rounded-tl-[6px]">
                        <div className="flex flex-col items-end">
                           <div className="flex h-4 items-center">
                              <span className="text-[14px] font-medium text-white font-['Roboto']">{item.category.replace('CATA', '').trim()}</span>
                           </div>
                           <div className="flex h-3 items-center justify-center w-full">
                              <span className="text-[11px] font-normal text-white font-['Roboto']">CATA</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Right Side: Text Content */}
                  <div className="flex flex-col gap-1.5 pt-0.5 min-w-0">
                    <h4 className="text-[11px] font-bold text-[#1F1D25] leading-tight font-['Roboto'] break-words">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-[#1F1D25] leading-tight font-['Roboto'] break-words">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Checkbox Area */}
                <div className="flex items-center gap-2 pl-[51px]" onClick={(e) => e.stopPropagation()}>
                    <CheckboxOEM 
                      id={`check-${item.id}`}
                      checked={checkedIds.has(item.id)}
                      onCheckedChange={(checked) => onToggleCheck(item.id, checked === true)}
                    />
                    <label htmlFor={`check-${item.id}`} className="text-[12px] text-[#1F1D25] cursor-pointer select-none">
                      Include
                    </label>
                </div>
             </div>
          </div>
        ))}
      </div>

      {/* Scrim */}
      <div className="absolute bottom-0 left-0 w-full h-[28px] bg-gradient-to-b from-transparent to-white pointer-events-none" />
    </div>
  );
}
