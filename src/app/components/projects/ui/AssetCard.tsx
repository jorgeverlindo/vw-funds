"use client";

import { ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";

interface AssetCardProps {
  /** Whether this card is currently selected */
  selected?: boolean;
  /** Called when the checkbox is toggled (receives new boolean value) */
  onSelect?: (checked: boolean) => void;
  /**
   * Content rendered inside the thumbnail shell.
   * The shell already provides: square aspect-ratio, bg-[#f0f2f4],
   * rounded-xl, overflow-hidden, and the ring stroke.
   * Pass an element that fills the available space.
   */
  preview: ReactNode;
  /** Content rendered in the text area below the thumbnail */
  footer: ReactNode;
  /** Extra class names forwarded to the outer wrapper */
  className?: string;
  /** Called when the card is clicked (checkbox / menu clicks are swallowed) */
  onClick?: () => void;
  /**
   * Replaces the default ⋯ button rendered on the thumbnail's top-right.
   * Pass `null` to hide it entirely.
   */
  menuButton?: ReactNode | null;
}

/**
 * Shared card shell — Card Vertical variant from the Constellation Design System.
 *
 * Anatomy (matches Figma "Card & Row / Card Vertical"):
 *
 *   ┌────────────────────────────────────────┐  ← rounded-xl, gray bg
 *   │              thumbnail                 │    1 px inset ring (default)
 *   │   image / wireframe fills edge-to-edge │    2 px indigo ring (selected)
 *   │                                        │
 *   │  [☑ checkbox TL]       [⋯ menu TR]    │
 *   └────────────────────────────────────────┘
 *   title                              [⋮ / edit]  ← pt-2 pb-3, zero horizontal pad
 *   subtitle
 *   [chip] [chip]
 *   📁 folder
 *
 * The outer wrapper has NO background and NO stroke — the card shape is
 * defined entirely by the thumbnail shell.
 * The selection ring wraps the thumbnail ONLY (not the text section).
 */
export function AssetCard({
  selected = false,
  onSelect,
  preview,
  footer,
  className = "",
  onClick,
  menuButton,
}: AssetCardProps) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer w-full min-w-[240px] max-w-[300px] ${className}`}
    >
      {/* ── Thumbnail shell ── */}
      <div
        className={`relative aspect-square rounded-xl overflow-hidden bg-[#f0f2f4] transition-shadow ${
          selected
            ? "ring-2 ring-inset ring-[var(--brand-accent)]"
            : "ring-1 ring-inset ring-black/[0.07]"
        }`}
      >
        {/* Image / wireframe */}
        {preview}

        {/* Checkbox overlay — top-left */}
        <div
          className="absolute top-2.5 left-2.5 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(!selected);
          }}
        >
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              selected
                ? "bg-[var(--brand-accent)] border-[var(--brand-accent)]"
                : "bg-white/90 border-gray-300"
            }`}
          >
            {selected && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path
                  d="M1 4l3 3 5-5"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Menu button overlay — top-right */}
        {menuButton !== null && (
          <div
            className="absolute top-2 right-2 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {menuButton ?? (
              <button className="flex items-center justify-center w-6 h-6 rounded-md bg-white/80 hover:bg-white text-gray-500 hover:text-gray-700 transition-colors">
                <MoreHorizontal size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Text area ──
          Figma spec: padding-top 8px, padding-bottom 12px, horizontal 0
          Text aligns flush with the thumbnail edges. */}
      <div className="pt-2 pb-3">{footer}</div>
    </div>
  );
}
