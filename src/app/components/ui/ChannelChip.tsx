"use client";

/**
 * ChannelChip — AV3 Design System
 *
 * Spec (node 13619-171056):
 *   outer  → border-radius: 8px, height: 24px, bg: #F0F2F4, no border
 *   icon   → 20×20px white pill (rounded-[100px], p-[2px]) — same for all platforms
 *   text   → 11px Roboto Regular, #1f1d25, letter-spacing: 0.16px
 *   close  → 16×16px, rounded-full, opacity 0.26 idle / 0.6 hover
 *
 * All platforms use the same outer shape — the visual difference between
 * Google PMax and others comes from the icon itself, not the chip radius.
 */

import React from "react";
import { X } from "lucide-react";

const R = { fontFamily: "'Roboto', sans-serif" };

export interface ChannelChipProps {
  /** Platform display label, e.g. "Google PMax" */
  label: string;
  /** Icon URL (svg or png) — shown in a white pill container */
  icon?: string;
  /** If provided, renders a remove (×) button */
  onRemove?: () => void;
  /** Extra class names on the outer chip span */
  className?: string;
}

export function ChannelChip({ label, icon, onRemove, className = "" }: ChannelChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-[3px] h-[24px] px-[4px] rounded-[8px] bg-[#F0F2F4] text-[11px] text-[#1f1d25] select-none ${className}`}
      style={{ ...R, letterSpacing: "0.16px", lineHeight: "18px" }}
    >
      {/* Icon in white pill container */}
      {icon && (
        <span className="w-[20px] h-[20px] rounded-[100px] bg-white flex items-center justify-center shrink-0 p-[2px]">
          <img src={icon} alt="" className="w-full h-full object-contain" />
        </span>
      )}

      {/* Label */}
      <span className="px-[2px] whitespace-nowrap">{label}</span>

      {/* Remove button */}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="w-[16px] h-[16px] rounded-full flex items-center justify-center cursor-pointer transition-opacity"
          style={{ opacity: 0.26 }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.6")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "0.26")}
        >
          <X size={10} strokeWidth={2} />
        </button>
      )}
    </span>
  );
}
