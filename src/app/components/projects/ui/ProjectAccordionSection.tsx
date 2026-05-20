/**
 * ProjectAccordionSection — Project detail accordion row.
 *
 * Mirrors the Figma component from ❖ AV3 - Projects Components.
 * Three states:
 *   • null   — count is undefined → no chevron, emptyContent always visible
 *   • closed — count defined, collapsed → ChevronRight, header only
 *   • open   — count defined, expanded  → ChevronDown, animated content
 */

import { useState } from "react";
import { ChevronRight, ChevronDown, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface ProjectAccordionSectionProps {
  /** Section label e.g. "Offers", "Templates" */
  title: string;
  /** Item count shown as "(N)". Omit to use the null/empty state (no chevron). */
  count?: number;
  /** Chips / action buttons placed in the header's right slot. */
  statusSlot?: React.ReactNode;
  /** Fires when "Details ↗" is clicked. Only rendered when count is defined. */
  onDetails?: () => void;
  /** Content rendered below the header when in null/empty state (always visible). */
  emptyContent?: React.ReactNode;
  /** Content revealed inside the open accordion (count must be defined). */
  children?: React.ReactNode;
  /** Start expanded (only relevant when count is defined). */
  defaultExpanded?: boolean;
  /** Avatar/button slot for the task owner, shown in the header's right area. */
  ownerSlot?: React.ReactNode;
  /** Controlled expanded state — when provided, overrides internal state. */
  expanded?: boolean;
  /** Called when the section is toggled (controlled mode). */
  onExpandedChange?: (v: boolean) => void;
}

export function ProjectAccordionSection({
  title,
  count,
  statusSlot,
  onDetails,
  emptyContent,
  children,
  defaultExpanded = false,
  expanded: controlledExpanded,
  onExpandedChange,
  ownerSlot,
}: ProjectAccordionSectionProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isNullState = count === undefined;
  const isInteractive = !isNullState;

  // Controlled vs uncontrolled
  const expanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const toggle = () => {
    const next = !expanded;
    if (controlledExpanded === undefined) setInternalExpanded(next);
    onExpandedChange?.(next);
  };

  return (
    <div className="rounded-xl bg-[#F4F5F6] overflow-hidden">

      {/* ── Header row ──────────────────────────────────────────────────── */}
      <div
        role={isInteractive ? "button" : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        onClick={isInteractive ? toggle : undefined}
        onKeyDown={isInteractive
          ? (e) => { if (e.key === "Enter" || e.key === " ") toggle(); }
          : undefined
        }
        className={[
          "flex items-center gap-2.5 px-5 py-[11px] min-h-[44px] select-none",
          isInteractive ? "cursor-pointer hover:bg-[#ECEDF0] active:bg-[#E4E5E9] transition-colors" : "",
        ].join(" ")}
      >
        {/* Chevron — only shown when not null state */}
        {isInteractive && (
          <span className="shrink-0 text-gray-400 flex items-center">
            {expanded
              ? <ChevronDown size={16} strokeWidth={2} />
              : <ChevronRight size={16} strokeWidth={2} />
            }
          </span>
        )}

        {/* Title + count + inline status badge */}
        <div className={`flex items-center gap-1.5 flex-1 min-w-0 ${isNullState ? "pl-0" : ""}`}>
          <span className="text-[14px] font-semibold text-[#1f1d25] leading-tight">{title}</span>
          {isInteractive && count !== undefined && (
            <span className="text-[13px] text-[#9C99A9] font-normal">({count})</span>
          )}
          {statusSlot && isInteractive && (
            <div className="flex items-center shrink-0" onClick={(e) => e.stopPropagation()}>
              {statusSlot}
            </div>
          )}
        </div>

        {/* Details ↗ link */}
        {onDetails && isInteractive && (
          <button
            onClick={(e) => { e.stopPropagation(); onDetails(); }}
            className="flex items-center gap-1 text-[12px] text-[#686576] hover:text-[#1f1d25] shrink-0 transition-colors font-normal cursor-pointer"
          >
            <ExternalLink size={13} strokeWidth={1.75} />
            Details
          </button>
        )}

        {/* Task owner avatar — always visible so users can assign even on empty sections */}
        {ownerSlot && (
          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            {ownerSlot}
          </div>
        )}
      </div>

      {/* ── Null/empty state content (always visible) ───────────────────── */}
      {isNullState && emptyContent && (
        <div className="px-5 pb-4 -mt-0.5">
          {emptyContent}
        </div>
      )}

      {/* ── Expandable content (animated) ───────────────────────────────── */}
      {isInteractive && (
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="section-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              style={{ overflow: "hidden" }}
            >
              <div className="px-4 pb-4 pt-1">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
