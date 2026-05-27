// ─── AngleCard ────────────────────────────────────────────────────────────────
// One of the 6 angle slots in AnglesSource.
//
// Default:  image + chip label
// Hover:    image + border + 2 floating action buttons (elevation/2) + chip
//           • Eye    → opens AnglePreviewModal (via onPreview callback)
//           • Pencil → edit action (reserved)
// Hero:     First angle in drag-reorder order — shows star badge.
//           Hover reveals tooltip that slides in from bottom (450ms) explaining
//           Hero role and drag-to-reorder.
// Drag:     HTML5 drag — visual drop-target highlight while dragging over.

import { useState } from 'react';
import { Eye, Pencil } from 'lucide-react';

// elevation/2 from Figma
const ELEV2 = 'shadow-[0px_1px_5px_0px_rgba(0,0,0,0.12),0px_2px_2px_0px_rgba(0,0,0,0.14),0px_3px_1px_-2px_rgba(0,0,0,0.2)]';

interface AngleCardProps {
  label: string;
  src: string | null;
  defaultSrc: string;
  /** Source/cutout image — passed up to modal via AnglesSource */
  sourceSrc?: string | null;
  /** Called when card body or Eye button is clicked */
  onPreview?: () => void;
  /**
   * When true, shows a pencil indicator on the label chip signalling that
   * this angle has a previous version (was individually re-generated via Edit).
   */
  hasPreviousVersion?: boolean;
  /** When true this is the Hero angle — shows star in chip + hero tooltip on chip */
  isHero?: boolean;
  /** When true, render with reduced opacity (being dragged) */
  isGhost?: boolean;
  /** Drag callbacks from AnglesSource */
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  /** Visual highlight when another card is dragged over this slot */
  isDragOver?: boolean;
}

export function AngleCard({
  label,
  src,
  defaultSrc,
  onPreview,
  hasPreviousVersion = false,
  isHero = false,
  isGhost = false,
  draggable = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragOver = false,
}: AngleCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    /* ── Card wrapper — drives group-hover ── */
    <div
      className={[
        'flex flex-col items-center gap-[4px] cursor-grab active:cursor-grabbing group/angle select-none transition-opacity duration-150',
        isGhost ? 'opacity-40 scale-95' : 'opacity-100',
      ].join(' ')}
      style={{ width: 90 }}
      onClick={() => onPreview?.()}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      {/* ── Image container ── */}
      <div className={[
        'relative w-full h-[90px] rounded-[8px] bg-[#f4f5f6] overflow-visible shrink-0',
        'border transition-colors',
        isDragOver
          ? 'border-[#473bab] ring-2 ring-[#473bab]/30 scale-[1.04]'
          : 'border-transparent group-hover/angle:border-[rgba(0,0,0,0.12)]',
        'transition-all duration-150',
      ].join(' ')}>

        <div className="absolute inset-0 rounded-[8px] overflow-hidden">
          <img
            src={src ?? defaultSrc}
            alt={label}
            className="w-full h-full object-cover"
          />
        </div>

        {/* ── Actions holder — visible on hover ── */}
        <div className="absolute inset-0 flex flex-wrap gap-[4px] items-start justify-end p-[4px] opacity-0 group-hover/angle:opacity-100 transition-opacity rounded-[8px] overflow-hidden">

          {/* Eye — open preview modal */}
          <button
            onClick={e => { e.stopPropagation(); onPreview?.(); }}
            title="Preview image"
            className={`bg-white p-[5px] rounded-full flex items-center justify-center shrink-0 ${ELEV2} hover:bg-[rgba(17,16,20,0.04)] transition-colors`}
          >
            <Eye size={14} className="text-[rgba(17,16,20,0.72)]" />
          </button>

          {/* Pencil — edit (reserved) */}
          <button
            onClick={e => e.stopPropagation()}
            title="Edit image"
            className={`bg-white p-[5px] rounded-full flex items-center justify-center shrink-0 ${ELEV2} hover:bg-[rgba(17,16,20,0.04)] transition-colors`}
          >
            <Pencil size={14} className="text-[rgba(17,16,20,0.72)]" />
          </button>
        </div>
      </div>

      {/* ── Label chip — Figma: h-[24px] rounded-[8px] ── */}
      {/* relative + overflow-visible to allow tooltip to escape */}
      <div
        className={[
          'relative h-[24px] rounded-[8px] bg-[rgba(17,16,20,0.04)] flex items-center justify-center gap-[3px] px-[6px] shrink-0 overflow-visible',
          (hasPreviousVersion || isHero) ? 'min-w-[48px]' : 'w-[48px]',
        ].join(' ')}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Slide-up tooltip — anchored to chip */}
        <div
          className="absolute left-1/2 z-30 pointer-events-none"
          style={{
            bottom: 'calc(100% + 6px)',
            transform: `translateX(-50%) translateY(${hovered ? '0px' : '8px'})`,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 450ms ease, transform 450ms ease',
          }}
        >
          <div
            className="bg-[#1f1d25]/90 backdrop-blur-[2px] text-white rounded-[6px] px-[10px] py-[6px] whitespace-nowrap"
            style={{
              fontFamily: "'Roboto', sans-serif",
              fontSize: '11px',
              fontWeight: 500,
              lineHeight: '1.5',
              letterSpacing: '0.15px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.28)',
            }}
          >
            {isHero ? (
              <span className="flex items-center gap-[5px]">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="#f9c74f" aria-hidden="true">
                  <path d="M6 0.5l1.545 3.13 3.455.502-2.5 2.436.59 3.44L6 8.38 2.91 9.998l.59-3.44-2.5-2.43 3.455-.503L6 0.5z" />
                </svg>
                Hero angle · drag to reorder
              </span>
            ) : (
              'Drag to reorder'
            )}
          </div>
          {/* Tiny caret */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              bottom: '-4px',
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '4px solid rgba(31,29,37,0.9)',
            }}
          />
        </div>

        {isHero && (
          <svg width="9" height="9" viewBox="0 0 12 12" fill="currentColor" className="text-[#686576] shrink-0">
            <path d="M6 0.5l1.545 3.13 3.455.502-2.5 2.436.59 3.44L6 8.38 2.91 9.998l.59-3.44-2.5-2.43 3.455-.503L6 0.5z" />
          </svg>
        )}
        {hasPreviousVersion && (
          <Pencil size={9} className="text-[#473bab] shrink-0" />
        )}
        <span className="font-['Roboto',sans-serif] font-normal text-[11px] leading-[18px] tracking-[0.16px] text-[#1f1d25] whitespace-nowrap">
          {label}
        </span>
      </div>
    </div>
  );
}
