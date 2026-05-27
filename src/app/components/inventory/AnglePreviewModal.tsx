// ─── AnglePreviewModal ────────────────────────────────────────────────────────
// Preview modal for a single angle image.
// Two tabs (Figma node 3522:47813 / 3522:47940):
//   • Generated Image — AI-generated photo with background (full-bleed)
//   • Source          — clean vehicle cutout on white
//
// Header right side: angle chip + vehicle name + × close button
// Keyboard: Escape closes; ← / → navigates between angles
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../../lib/utils';

type ModalTab = 'generated' | 'previous' | 'source';

interface AnglePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Short angle label shown as chip, e.g. "3/4 L" */
  angleLabel: string;
  /** Vehicle name displayed in header, e.g. "TW200T" */
  vehicleName: string;
  /** AI-generated image (with background) */
  generatedSrc: string | null;
  /** Source cutout image (no background) */
  sourceSrc: string | null;
  /**
   * Previous version of this angle (before last individual edit).
   * When provided, a "Previous Version" tab is shown between Generated and Source.
   */
  previousSrc?: string | null;
  /** Fallback placeholder shown when generatedSrc is null */
  defaultSrc: string;
  /** Initial active tab */
  defaultTab?: ModalTab;
  /** Navigate to previous angle */
  onPrev?: () => void;
  /** Navigate to next angle */
  onNext?: () => void;
}

export function AnglePreviewModal({
  isOpen,
  onClose,
  angleLabel,
  vehicleName,
  generatedSrc,
  sourceSrc,
  previousSrc = null,
  defaultSrc,
  defaultTab = 'generated',
  onPrev,
  onNext,
}: AnglePreviewModalProps) {
  const [tab, setTab] = useState<ModalTab>(defaultTab);

  // Keyboard: Escape closes, ← / → navigates between angles
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape')     { onClose(); }
      if (e.key === 'ArrowLeft')  { onPrev?.(); }
      if (e.key === 'ArrowRight') { onNext?.(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose, onPrev, onNext]);

  // Reset to defaultTab whenever the modal (re-)opens
  useEffect(() => {
    if (isOpen) setTab(defaultTab);
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  const hasGenerated  = !!generatedSrc;
  const hasSource     = !!sourceSrc;
  const hasPrevious   = !!previousSrc;

  // Build the visible tab list:
  //   • Generated Image — always visible
  //   • Previous Version — conditional: only shown after an angle has been individually edited
  //   • Source           — always visible (vehicle cutout on white)
  const visibleTabs: Array<{ id: ModalTab; label: string }> = [
    { id: 'generated', label: 'Generated Image' },
    ...(hasPrevious ? [{ id: 'previous' as ModalTab, label: 'Previous Version' }] : []),
    { id: 'source', label: 'Source' },
  ];

  return (
    // ── Backdrop ──
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* ── Modal card — Figma: 739×(header+image) ── */}
      <div className="bg-white rounded-[12px] overflow-hidden flex flex-col shadow-[0px_8px_32px_rgba(0,0,0,0.24)] w-[739px] max-w-[95vw]">

        {/* ── Header ── */}
        <div className="flex-none flex items-center h-[52px] px-[16px] border-b border-[rgba(0,0,0,0.12)]">

          {/* Left: tabs */}
          <div className="flex items-end h-full mr-auto">
            {visibleTabs.map(({ id: t, label }) => {
              const isActive = tab === t;
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "h-full px-[4px] mr-[16px] text-[14px] font-['Roboto',sans-serif] font-normal tracking-[0.15px] border-b-2 transition-colors whitespace-nowrap",
                    isActive
                      ? 'text-[#473bab] border-[#473bab]'
                      : 'text-[rgba(17,16,20,0.38)] border-transparent hover:text-[rgba(17,16,20,0.56)]',
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Right: angle chip + vehicle name + close */}
          <div className="flex items-center gap-[8px] shrink-0">

            {/* Angle chip — Figma: dark neutral pill */}
            <span className="inline-flex items-center h-[24px] px-[8px] rounded-[8px] bg-[rgba(17,16,20,0.08)]">
              <span className="font-['Roboto',sans-serif] font-normal text-[11px] leading-[18px] tracking-[0.16px] text-[#1f1d25] whitespace-nowrap">
                {angleLabel}
              </span>
            </span>

            {/* Vehicle name */}
            <span className="font-['Roboto',sans-serif] font-medium text-[14px] leading-[1.5] tracking-[0.15px] text-[#1f1d25] whitespace-nowrap">
              {vehicleName}
            </span>

            {/* Close button */}
            <button
              onClick={onClose}
              className="size-[30px] rounded-full flex items-center justify-center text-[rgba(17,16,20,0.56)] hover:bg-[rgba(17,16,20,0.06)] transition-colors shrink-0"
              aria-label="Close preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Image area ── */}
        <div className="relative" style={{ aspectRatio: '739 / 480' }}>
          {tab === 'generated' ? (
            // Full-bleed — matches Figma Default variant (image fills card)
            <img
              src={hasGenerated ? generatedSrc! : defaultSrc}
              alt={`${angleLabel} generated`}
              className="w-full h-full object-cover"
            />
          ) : tab === 'previous' ? (
            // Previous version — full-bleed like generated
            <img
              src={previousSrc!}
              alt={`${angleLabel} previous version`}
              className="w-full h-full object-cover"
            />
          ) : (
            // Source cutout — white bg, centered with breathing room
            <div className="w-full h-full flex items-center justify-center bg-white">
              {hasSource ? (
                <img
                  src={sourceSrc!}
                  alt={`${angleLabel} source`}
                  className="max-h-full max-w-full object-contain p-[32px]"
                />
              ) : (
                <div className="flex flex-col items-center gap-[8px] text-[rgba(17,16,20,0.38)]">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                  <span className="font-['Roboto',sans-serif] text-[13px]">No source image available</span>
                </div>
              )}
            </div>
          )}

          {/* ── Prev / Next nav arrows — overlay on image ── */}
          {onPrev && (
            <button
              onClick={e => { e.stopPropagation(); onPrev(); }}
              aria-label="Previous angle"
              className="absolute left-[12px] top-1/2 -translate-y-1/2 size-[36px] rounded-full bg-white/80 backdrop-blur-[2px] flex items-center justify-center text-[rgba(17,16,20,0.72)] shadow-[0px_2px_8px_rgba(0,0,0,0.16)] hover:bg-white transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          {onNext && (
            <button
              onClick={e => { e.stopPropagation(); onNext(); }}
              aria-label="Next angle"
              className="absolute right-[12px] top-1/2 -translate-y-1/2 size-[36px] rounded-full bg-white/80 backdrop-blur-[2px] flex items-center justify-center text-[rgba(17,16,20,0.72)] shadow-[0px_2px_8px_rgba(0,0,0,0.16)] hover:bg-white transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
