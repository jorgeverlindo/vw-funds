import { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { motion } from 'motion/react';

// ─── SideSheet — Generic slot-based side panel ────────────────────────────────
//
// Usage:
//   <SideSheet isOpen={open} onClose={...} title="Client Settings">
//     {/* any nav content — e.g. <SideSheetNavItem> list */}
//   </SideSheet>
//
// Layout contract:
//   • Must be a direct child of a `flex` row container.
//   • Width animates 0 ↔ [user-set] px (450ms cubic-ease-out) and pushes sibling panes.
//   • Inner panel slides in/out (translateX) in sync with the width — same motion as AgentPane.
//   • Right edge is draggable to resize (200px–480px, no animation while dragging).
//   • Title style and close button are fixed — only `title` prop changes.
//   • `children` is the **slot** that varies per module.
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_WIDTH = 280;
const MIN_WIDTH      = 200;
const MAX_WIDTH      = 480;

/** Same easing used by AgentPane for a consistent system-wide panel feel. */
const PANEL_EASE = [0.0, 0.0, 0.2, 1] as const;
const PANEL_DURATION = 0.45;

interface SideSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Displayed in the header — e.g. "Client Settings", "Filters" */
  title: string;
  /** Nav content / any slot content */
  children: React.ReactNode;
}

export function SideSheet({ isOpen, onClose, title, children }: SideSheetProps) {
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  // True while the user is actively dragging — disables the open/close transition
  // so the resize feels instant and doesn't fight the animation.
  const isDragging = useRef(false);
  const [dragging, setDragging] = useState(false);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = true;
    setDragging(true);
    const startX     = e.clientX;
    const startWidth = panelWidth;

    const onMove = (ev: MouseEvent) => {
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + (ev.clientX - startX)));
      setPanelWidth(next);
    };
    const onUp = () => {
      isDragging.current = false;
      setDragging(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // While dragging, skip animation so resize is instant.
  const transition = dragging
    ? { duration: 0 }
    : { duration: PANEL_DURATION, ease: PANEL_EASE };

  return (
    // ── Outer wrapper: controls the space this panel occupies in the flex row.
    // Width animates 0 ↔ panelWidth — this is what "pushes" the main content pane.
    // initial={false} prevents the animation from running on first mount.
    <motion.div
      initial={false}
      animate={{
        width:       isOpen ? panelWidth : 0,
        marginRight: isOpen ? 16 : 0,
      }}
      transition={transition}
      className="flex-none h-full overflow-hidden relative"
    >

      {/* ── Inner panel: always panelWidth px wide; slides in/out in sync with the wrapper.
          Translates from -100% (off-screen left) to 0 when opening, and back when closing.
          Because the outer wrapper has overflow-hidden, nothing leaks outside. ── */}
      <motion.div
        initial={false}
        animate={{ x: isOpen ? '0%' : '-100%' }}
        transition={transition}
        className="h-full bg-white rounded-[16px] overflow-hidden flex flex-col shadow-sm border border-[rgba(0,0,0,0.04)]"
        style={{ width: panelWidth, willChange: 'transform' }}
      >

        {/* ── Header — Figma: min-h-[40px], px-[16px], pt-[12px], pb-[8px] ── */}
        <div className="flex-none flex items-center relative min-h-[40px] px-[16px] pt-[12px] pb-[8px]">
          {/* Title — Figma: Roboto Medium 16px #1f1d25 tracking 0.15px */}
          <h2 className="font-['Roboto',sans-serif] font-medium text-[16px] leading-[1.5] tracking-[0.15px] text-[#1f1d25] flex-1 pr-8">
            {title}
          </h2>

          {/* Close button — Figma: size-[30px] p-[5px] rounded-[100px], icon size-[20px] */}
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="absolute right-[10px] top-[12px] size-[30px] rounded-[100px] p-[5px] flex items-center justify-center text-[rgba(17,16,20,0.56)] hover:bg-[rgba(17,16,20,0.04)] transition-colors shrink-0"
          >
            <X className="size-[20px]" />
          </button>
        </div>

        {/* ── Divider ── */}
        <div className="flex-none h-px bg-[rgba(0,0,0,0.12)] mx-0" />

        {/* ── Content slot — scrollable, pb-[24px] per Figma ── */}
        <div className="flex-1 overflow-y-auto pb-[24px] px-[16px] pt-[4px]">
          {children}
        </div>

      </motion.div>

      {/* ── Resize handle — 6px hotspot on the right edge ── */}
      {isOpen && (
        <div
          onMouseDown={handleResizeMouseDown}
          className="absolute top-0 right-0 w-[6px] h-full cursor-col-resize group/rh z-10"
          title="Drag to resize"
        >
          {/* Visual 1px line — becomes purple on hover/drag */}
          <div className={[
            'absolute right-[2px] top-[12px] bottom-[12px] w-[2px] rounded-full transition-colors',
            dragging
              ? 'bg-[#6356e1]'
              : 'bg-transparent group-hover/rh:bg-[rgba(0,0,0,0.12)]',
          ].join(' ')} />
        </div>
      )}

    </motion.div>
  );
}
