import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AnnotationItem {
  id: string;
  number: number;
  category: string;
  title: string;
  description: string;
  x: number;
  y: number;
  direction?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Seconds — shown as MM:SS when provided */
  timestamp?: number;
  /** Whether this annotation is included in the compliance report */
  included?: boolean;
}

interface ScrollerAnnotationsProps {
  annotations: AnnotationItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  className?: string;
  /** Called when the Include checkbox is toggled (video annotations) */
  onToggleInclude?: (id: string) => void;
  /** Called when the Delete button is clicked (video annotations) */
  onDelete?: (id: string) => void;
  /** Empty-state message override */
  emptyMessage?: string;
}

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function ScrollerAnnotations({
  annotations,
  activeId,
  onSelect,
  className,
  onToggleInclude,
  onDelete,
  emptyMessage,
}: ScrollerAnnotationsProps) {
  return (
    <div className={cn("relative h-full flex flex-col w-[200px] overflow-hidden rounded-bl-[12px] rounded-tl-[12px] bg-white", className)}>
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
        {annotations.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 pb-8">
            <div className="w-10 h-10 rounded-full bg-[#E8F5E9] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 10L8 14L16 6" stroke="#43A047" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="text-center">
              {emptyMessage
                ? <p className="text-[12px] font-semibold text-[#1F1D25]">{emptyMessage}</p>
                : <>
                    <p className="text-[12px] font-semibold text-[#1F1D25]">No Issues Found</p>
                    <p className="text-[10px] text-[#686576] mt-1 leading-relaxed">All brand guidelines<br/>have been accepted.</p>
                  </>
              }
            </div>
          </div>
        )}
        {annotations.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={cn(
              "relative rounded-[12px] shrink-0 w-full transition-all cursor-pointer group",
              activeId === item.id ? "ring-2 ring-[#473BAB] ring-offset-1" : "hover:bg-gray-50"
            )}
          >
            {/* Border for inactive state if needed, but design shows clean bg */}
            <div className="flex gap-[7px] items-start p-[8px] relative w-full">
              
              {/* Left Side: Cypher Block */}
              <div className="flex flex-col gap-[2px] items-end shrink-0 w-[41px]">
                 {/* Small Pin Replica - Static for list */}
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

              {/* Right Side: Content */}
              <div className="flex flex-col gap-1.5 pt-0.5 min-w-0 flex-1">
                <h4 className="text-[11px] font-bold text-[#1F1D25] leading-tight font-['Roboto'] break-words">
                  {item.title}
                </h4>
                <p className="text-[10px] text-[#1F1D25] leading-tight font-['Roboto'] break-words">
                  {item.description}
                </p>
              </div>
            </div>

            {/* Include checkbox + timestamp + delete — shown only for video annotations */}
            {(onToggleInclude || onDelete) && (
              <div
                className="flex items-center justify-between border-t border-[rgba(0,0,0,0.08)] pt-[4px] mt-1 mx-[8px] mb-[4px]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-1.5">
                  {onToggleInclude && (
                    <button
                      onClick={() => onToggleInclude(item.id)}
                      className="flex items-center gap-1 text-[10px] font-bold text-[#1F1D25] font-['Roboto'] hover:text-[#473bab] transition-colors cursor-pointer"
                    >
                      <div className={cn(
                        'w-[14px] h-[14px] rounded-[3px] border flex items-center justify-center transition-colors',
                        item.included
                          ? 'bg-[#473bab] border-[#473bab]'
                          : 'bg-white border-[rgba(0,0,0,0.38)]'
                      )}>
                        {item.included && (
                          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                            <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      Include
                    </button>
                  )}
                  {item.timestamp !== undefined && (
                    <span className="text-[9px] text-[#9C99A9] font-['Roboto'] ml-1">
                      {fmtTime(item.timestamp)}
                    </span>
                  )}
                </div>
                {onDelete && (
                  <button
                    onClick={() => onDelete(item.id)}
                    className="p-0.5 text-[#9C99A9] hover:text-[#D2323F] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Scrim */}
      <div className="absolute bottom-0 left-0 w-full h-[28px] bg-gradient-to-b from-transparent to-white pointer-events-none" />
    </div>
  );
}
