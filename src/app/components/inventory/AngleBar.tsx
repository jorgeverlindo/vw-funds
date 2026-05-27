import { LayoutGrid, Square, SlidersHorizontal } from 'lucide-react';
import { cn } from '../../../lib/utils';

export const ANGLES = [
  { id: '34-l',  label: '3/4 L' },
  { id: 'front', label: 'Front' },
  { id: '34-r',  label: '3/4 R' },
  { id: 'right', label: 'Right' },
  { id: 'left',  label: 'Left'  },
  { id: 'rear',  label: 'Rear'  },
] as const;

/* Small 14×14 ATV avatar icon — matches Figma chip-av spec */
function ChipAv({ active }: { active: boolean }) {
  return (
    <span className="w-[14px] h-[14px] rounded-full shrink-0 flex items-center justify-center" style={{ flexShrink: 0 }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="6.5" fill={active ? 'rgba(71,59,171,0.18)' : 'rgba(156,153,169,0.18)'}/>
        <path d="M4 8.2L4.8 6h4.4l.8 2.2v1H4v-1z" fill={active ? '#473bab' : '#686476'} opacity="0.9"/>
        <circle cx="5.2" cy="9.7" r="0.65" fill={active ? '#473bab' : '#686476'}/>
        <circle cx="8.8" cy="9.7" r="0.65" fill={active ? '#473bab' : '#686476'}/>
        <rect x="5.5" y="4.8" width="3" height="1.2" rx="0.4" fill={active ? '#473bab' : '#686476'} opacity="0.55"/>
      </svg>
    </span>
  );
}

interface AngleBarProps {
  currentIndex: number;
  onSetAngle: (index: number) => void;
  multiAngleEnabled: boolean;
  onToggleMultiAngle: () => void;
  viewMode: 'single' | 'grid';
  onSetViewMode: (mode: 'single' | 'grid') => void;
}

export function AngleBar({
  currentIndex,
  onSetAngle,
  multiAngleEnabled,
  onToggleMultiAngle,
  viewMode,
  onSetViewMode,
}: AngleBarProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-t border-border bg-white shrink-0">
      {/* Enable Angles checkbox */}
      <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
        <input
          type="checkbox"
          checked={multiAngleEnabled}
          onChange={onToggleMultiAngle}
          className="w-[14px] h-[14px] accent-[#473bab] cursor-pointer"
        />
        <span className="text-[11px] text-[#374151] font-['Roboto'] whitespace-nowrap select-none">
          Enable Angles
        </span>
      </label>

      {/* Chips — matches HTML .mchip spec */}
      <div className="flex gap-1 flex-1 overflow-x-auto no-scrollbar" style={{ marginLeft: '4px' }}>
        {ANGLES.map((angle, i) => {
          const isActive = i === currentIndex;
          return (
            <button
              key={angle.id}
              onClick={() => onSetAngle(i)}
              disabled={!multiAngleEnabled}
              className={cn(
                "inline-flex items-center gap-1.5 h-6 px-2.5 border-none cursor-pointer whitespace-nowrap transition-colors disabled:opacity-40 shrink-0",
                "text-[12px] font-medium font-['Roboto'] tracking-[0.1px]",
                isActive
                  ? 'text-[#1f1d25]'
                  : 'text-[#374151] hover:bg-black/[0.04]',
              )}
              style={{
                borderRadius: '6px',
                background: isActive ? 'rgba(17,16,20,0.08)' : 'transparent',
              }}
            >
              <ChipAv active={isActive} />
              <span>{angle.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sliders icon */}
      <button className="p-1 rounded hover:bg-[#f3f3f5] transition-colors text-[#686476] shrink-0">
        <SlidersHorizontal size={14} />
      </button>

      {/* Single/Grid view toggle */}
      <button
        onClick={() => onSetViewMode(viewMode === 'single' ? 'grid' : 'single')}
        className="p-1 rounded hover:bg-[#f3f3f5] transition-colors text-[#686476] shrink-0"
        title={viewMode === 'single' ? 'Grid view' : 'Single view'}
      >
        {viewMode === 'single' ? <LayoutGrid size={14} /> : <Square size={14} />}
      </button>
    </div>
  );
}
