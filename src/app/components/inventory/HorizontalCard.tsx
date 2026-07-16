// ─── HorizontalCard ───────────────────────────────────────────────────────────
// 320×90px source-image card used inside the Source Images drawer.
// Figma: node 4074:486222 "Card & Row"
//
// Layout:
//   Left  90×90 — image thumbnail (bg #f0f2f4) with radio selector overlay
//   Right 230px — content area (p-12px): filename text + source/date + kebab

import type { SourceImageSource } from '../../../data/inventory/sourceImages';

interface HorizontalCardProps {
  src: string | null;
  filename: string;
  source: SourceImageSource;
  /** Display string e.g. "2025-08-15 14:23" */
  date: string;
  isActive: boolean;
  onActivate: () => void;
  onDelete?: () => void;
}

export function HorizontalCard({
  src,
  filename,
  source,
  date,
  isActive,
  onActivate,
  onDelete,
}: HorizontalCardProps) {
  return (
    <div
      className="shrink-0 flex overflow-hidden bg-white"
      style={{
        width: 320,
        height: 90,
        borderRadius: 12,
        border: '1px solid rgba(0,0,0,0.12)',
      }}
    >
      {/* ── Left: image area with radio button overlay ── */}
      <div
        className="relative shrink-0 overflow-hidden"
        style={{ width: 90, height: 90, background: '#f0f2f4' }}
      >
        {src ? (
          <img
            src={src}
            alt={filename}
            className="w-full h-full object-cover object-center"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              viewBox="0 0 40 28" fill="none"
              className="w-3/5 text-[rgba(17,16,20,0.18)]"
            >
              <path
                d="M6 18l4-8h20l4 8v5H6v-5z"
                stroke="currentColor" strokeWidth="1.2"
                fill="currentColor" fillOpacity="0.3"
              />
            </svg>
          </div>
        )}

        {/* Radio button — top-left corner */}
        <button
          onClick={e => { e.stopPropagation(); onActivate(); }}
          aria-label={isActive ? 'Active source' : 'Set as active source'}
          className="absolute top-[8px] left-[8px] w-[16px] h-[16px] rounded-full bg-white/90 flex items-center justify-center transition-colors"
          style={{
            border: `2px solid ${isActive ? '#473bab' : 'rgba(0,0,0,0.38)'}`,
          }}
        >
          {isActive && (
            <div
              className="w-[8px] h-[8px] rounded-full"
              style={{ background: '#473bab' }}
            />
          )}
        </button>
      </div>

      {/* ── Right: content area ── */}
      <div
        className="flex items-center"
        style={{ width: 230, height: 90 }}
      >
        <div
          className="flex flex-col justify-between h-[76px] flex-1 min-w-0"
          style={{ padding: 12 }}
        >
          {/* Filename */}
          <span
            className="font-['Roboto',sans-serif] font-normal text-[12px] leading-[1.43] tracking-[0.17px] text-[#1f1d25] overflow-hidden"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
            title={filename}
          >
            {filename}
          </span>

          {/* Source · date */}
          <span className="font-['Roboto',sans-serif] text-[11px] leading-[1.66] tracking-[0.4px] text-[rgba(17,16,20,0.56)] whitespace-nowrap truncate">
            {source} | {date}
          </span>
        </div>

        {/* Kebab button — bottom-aligned in content area */}
        <div className="shrink-0 flex items-end self-end pb-[12px] pr-[12px]">
          <button
            onClick={e => { e.stopPropagation(); onDelete?.(); }}
            aria-label="More options"
            className="w-[20px] h-[20px] flex items-center justify-center text-[rgba(17,16,20,0.56)] hover:text-[#1f1d25] transition-colors rounded-full hover:bg-[rgba(0,0,0,0.06)]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
