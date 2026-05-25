// ─── CommentsButton ───────────────────────────────────────────────────────────
// Canonical comments-panel toggle button.
// Works in any subtree that has a <CommentsProvider> ancestor.
// Renders nothing if no provider is present (safe to place anywhere).
//
// Features:
//   • Active / inactive styles driven by ctx.isPanelOpen
//   • Portal tooltip (escapes overflow:hidden) with "Comments C" label
//   • useLayoutEffect for flicker-free positioning
//   • Viewport clamping: tooltip + shortcut badge never overflow the screen edge
//   • Arrow always points at the button centre even when clamped

import React, {
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";

import { useComments } from "./CommentsContext";
import { ChatIcon } from "./CommentsSidePanel";

// ── Tooltip (private) ─────────────────────────────────────────────────────────

function CommentsTooltip({
  anchorRef,
  visible,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  visible: boolean;
}) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: -999, left: -999, arrowLeft: "50%" });

  useLayoutEffect(() => {
    if (!visible || !anchorRef.current || !tooltipRef.current) return;
    const r   = anchorRef.current.getBoundingClientRect();
    const cx  = r.left + r.width / 2;
    const top = r.bottom + 8;
    const tw  = tooltipRef.current.offsetWidth;
    const M   = 8; // minimum margin from viewport edges
    const raw = cx - tw / 2;
    const clamped = Math.max(M, Math.min(raw, window.innerWidth - tw - M));
    setPos({ top, left: clamped, arrowLeft: `${cx - clamped}px` });
  }, [visible, anchorRef]);

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            fontSize: 11,
            letterSpacing: "0.17px",
            lineHeight: "1.43",
            zIndex: 9999,
            pointerEvents: "none",
          }}
          className="px-[8px] py-[5px] bg-[#1f1d25] text-white rounded-[6px] whitespace-nowrap"
        >
          {/* Arrow — points up toward the button */}
          <div
            className="absolute bottom-full w-0 h-0 border-l-[4px] border-r-[4px] border-b-[4px] border-l-transparent border-r-transparent border-b-[#1f1d25]"
            style={{ left: pos.arrowLeft, transform: "translateX(-50%)" }}
          />
          <div className="flex items-center gap-[6px]">
            <span>Comments</span>
            <span className="text-[10px] text-white/60 font-medium bg-white/10 px-[4px] py-[1px] rounded-[3px] tracking-[0.5px]">
              C
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// ── CommentsButton (public) ───────────────────────────────────────────────────

export function CommentsButton() {
  const ctx = useComments();
  const ref = useRef<HTMLButtonElement>(null);
  const [tip, setTip] = useState(false);

  if (!ctx) return null;

  return (
    <>
      <button
        ref={ref}
        type="button"
        onClick={ctx.togglePanel}
        aria-label="Toggle comments panel"
        onMouseEnter={() => setTip(true)}
        onMouseLeave={() => setTip(false)}
        className={[
          "p-1.5 rounded-full transition-colors shrink-0 cursor-pointer",
          ctx.isPanelOpen
            ? "bg-[rgba(71,59,171,0.12)] text-[#473bab]"
            : "text-[#686576] hover:bg-black/5 hover:text-[#1f1d25]",
        ].join(" ")}
      >
        <ChatIcon size={20} />
      </button>
      <CommentsTooltip anchorRef={ref} visible={tip} />
    </>
  );
}
