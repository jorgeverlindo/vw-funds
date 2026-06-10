"use client";

import React, { useState } from "react";
import { ChevronDown, Check, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "../../ui/dropdown-menu";

// ─── Confirmed chip ────────────────────────────────────────────────────────────
export function ConfirmedChip({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-[6px] px-[10px] py-[5px] rounded-full"
      style={{ background: "rgba(35,150,90,0.08)", border: "1px solid rgba(35,150,90,0.18)", color: "#1e7a48" }}>
      <div className="w-[16px] h-[16px] rounded-full flex items-center justify-center shrink-0"
        style={{ background: "#2e9c5e" }}>
        <Check size={9} color="white" strokeWidth={3} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.17px" }}>
        {label}
      </span>
    </div>
  );
}

// ─── Shared custom select (replaces native <select>) ─────────────────────────

/** Standard select — shows current value, opens custom dropdown menu. */
export function AgentSelect({
  value, onChange, options, placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  const label = options.find(o => o.value === value)?.label ?? placeholder ?? "Select";
  const menuCls = "z-[500] bg-white rounded-xl shadow-xl border border-[rgba(0,0,0,0.1)] p-1 animate-in fade-in-0 zoom-in-95 min-w-[var(--radix-dropdown-menu-trigger-width)]";
  const itemCls = "flex items-center gap-2 px-[10px] py-[6px] rounded-lg text-[12px] text-[var(--ink)] cursor-pointer outline-none select-none data-[highlighted]:bg-[#f5f4f8]";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="w-full flex items-center px-[10px] py-[7px] rounded-[8px] text-[12px] border border-[rgba(0,0,0,0.12)] bg-[#fafafb] outline-none transition-all hover:border-[#b0b0b5] focus:border-[var(--brand-accent)] focus:ring-1 focus:ring-[rgba(71,59,171,0.15)] cursor-pointer text-left"
        >
          <span className="flex-1 truncate" style={{ color: value ? "var(--ink)" : "var(--ink-tertiary)" }}>{label}</span>
          <ChevronDown size={10} className="shrink-0 text-[var(--ink-tertiary)] ml-1" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className={menuCls} sideOffset={4} align="start">
        {options.map(o => (
          <DropdownMenuItem key={o.value} className={itemCls} onClick={() => onChange(o.value)}>
            <span className="flex-1">{o.label}</span>
            {o.value === value && <Check size={11} strokeWidth={2.5} className="text-[var(--brand-accent)] shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** "Add another" variant — dashed border, purple text, Plus icon trigger. */
export function AgentAddSelect({
  onAdd, options, placeholder,
}: {
  onAdd: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  if (options.length === 0) return null;
  const menuCls = "z-[500] bg-white rounded-xl shadow-xl border border-[rgba(0,0,0,0.1)] p-1 animate-in fade-in-0 zoom-in-95 min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[240px] overflow-y-auto";
  const itemCls = "flex items-center gap-2 px-[10px] py-[6px] rounded-lg text-[11.5px] text-[var(--ink)] cursor-pointer outline-none select-none data-[highlighted]:bg-[#f5f4f8]";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="w-full flex items-center gap-[6px] px-[10px] py-[6px] mt-[2px] rounded-[8px] text-[11px] text-[var(--brand-accent)] border border-dashed border-[rgba(71,59,171,0.35)] bg-transparent cursor-pointer hover:bg-[rgba(71,59,171,0.04)] transition-colors"
        >
          <Plus size={10} className="shrink-0" />
          <span className="flex-1 text-left">{placeholder ?? "+ Add another…"}</span>
          <ChevronDown size={9} className="shrink-0 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className={menuCls} sideOffset={4} align="start">
        {options.map(o => (
          <DropdownMenuItem key={o.value} className={itemCls} onClick={() => onAdd(o.value)}>
            {o.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── "Why these?" expandable rationale box — accordion animation ──────────────
// ─── Why Accordion trigger button ─────────────────────────────────────────────
// Matches Figma "Why Accordion" — Default state: pill button, 13px Roboto Medium
// Expanded state: card bg #fafaff, border 1px #6356e1, radius 14px
function WhyTrigger({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center cursor-pointer hover:opacity-75 transition-opacity"
      style={{ gap: 8, padding: "4px 5px 0 16px", borderRadius: 100 }}
    >
      {/* ⓘ circle-info icon — stroke rgb(71,59,171) sw 1.5 */}
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="9" cy="9" r="7" stroke="#473BAB" strokeWidth="1.5"/>
        <path d="M9 8.5v4" stroke="#473BAB" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="9" cy="6.5" r="0.8" fill="#473BAB"/>
      </svg>
      {/* Label — 13px Roboto Medium, brand, ls 0.46px, lh 22px */}
      <span style={{
        fontSize: 13, fontWeight: 500, color: "#473BAB",
        letterSpacing: "0.46px", lineHeight: "22px",
      }}>
        Why these?
      </span>
      {/* Chevron right — rotates to down when open, stroke brand sw 1.5 */}
      <motion.svg
        width="18" height="18" viewBox="0 0 18 18" fill="none"
        animate={{ rotate: open ? 90 : 0 }}
        transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <path d="M7 6.5l3.5 3-3.5 3" stroke="#473BAB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </motion.svg>
    </button>
  );
}

export function WhyThese({ content }: { content: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-[6px]">
      {/* Collapsed — just the trigger button */}
      {!open && <WhyTrigger open={false} onClick={() => setOpen(true)} />}

      {/* Expanded — card wrapping trigger + content */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="why-card"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ overflow: "hidden" }}
          >
            {/* Wrappas — bg #fafaff, border 1px #6356e1, radius 14 */}
            <div style={{
              background: "rgb(250,250,255)",
              border: "1px solid #6356e1",
              borderRadius: 14,
              paddingTop: 8, paddingRight: 16, paddingBottom: 16, paddingLeft: 0,
            }}>
              <WhyTrigger open={true} onClick={() => setOpen(false)} />
              {/* Text content — paddingLeft 17, gap 8, 12px Roboto Regular ink, lh 143%, ls 0.17px */}
              <div style={{ paddingLeft: 17, paddingTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                {content}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
