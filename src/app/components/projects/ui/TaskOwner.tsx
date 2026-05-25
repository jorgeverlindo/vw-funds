/**
 * TaskOwner — Per-section task owner avatar.
 * Hover shows tooltip. Click opens owner-picker dropdown.
 *
 * Both the tooltip and the dropdown are portalled into document.body
 * so they escape any parent overflow:hidden (e.g. the accordion wrapper).
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, UserCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PROJECT_OWNERS } from "../CreateProjectDialog";
import { AvatarInitials } from "../../ui/AvatarInitials";

type Owner = typeof PROJECT_OWNERS[number];

interface Coords { top: number; left: number; right: number; bottom: number; width: number; height: number; }

export function TaskOwner({
  ownerId,
  onChange,
}: {
  ownerId?: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen]       = useState(false);
  const [hovered, setHovered] = useState(false);
  const [coords, setCoords]   = useState<Coords | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const owner: Owner | undefined = PROJECT_OWNERS.find((o) => o.id === ownerId);

  /** Recalculate button position for portal children */
  const measureBtn = useCallback(() => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setCoords({ top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height });
  }, []);

  const handleMouseEnter = () => { measureBtn(); setHovered(true); };
  const handleMouseLeave = () => setHovered(false);
  const handleClick      = () => { measureBtn(); setOpen((v) => !v); setHovered(false); };

  // Close on scroll/resize
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => { window.removeEventListener("scroll", close, true); window.removeEventListener("resize", close); };
  }, [open]);

  // Tooltip position: right-aligned with the button, above it, caret points down
  const tooltipStyle = coords ? {
    position: "fixed" as const,
    bottom: window.innerHeight - coords.top + 6,
    right:  window.innerWidth  - coords.right,
    zIndex: 9999,
  } : {};

  // Dropdown position: right-aligned below the button
  const dropdownStyle = coords ? {
    position: "fixed" as const,
    top:   coords.bottom + 6,
    right: window.innerWidth - coords.right,
    zIndex: 9999,
  } : {};

  return (
    <div className="relative">
      {/* Avatar button */}
      <button
        ref={btnRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center shrink-0 cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-[var(--brand-accent)] transition-all"
        aria-label="Change task owner"
      >
        {owner ? (
          owner.avatar ? (
            <img src={owner.avatar} alt={owner.name} className="w-full h-full object-cover" />
          ) : (
            <AvatarInitials initials={owner.initials} size={24} bgColor={owner.color} />
          )
        ) : (
          <div className="w-6 h-6 rounded-full bg-[#E8E7EF] flex items-center justify-center">
            <UserCircle size={14} className="text-[#9C99A9]" />
          </div>
        )}
      </button>

      {/* ── Tooltip — portalled ───────────────────────────────────────── */}
      {createPortal(
        <AnimatePresence>
          {hovered && !open && coords && (
            <motion.div
              key="task-owner-tooltip"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              style={{ ...tooltipStyle }}
              className="whitespace-nowrap text-[11px] font-medium text-white bg-[#1f1d25] rounded-lg px-2.5 py-1.5 pointer-events-none shadow-md"
            >
              Click to change task owner
              {/* Caret pointing down toward the avatar */}
              <span className="absolute bottom-[-7px] right-2 border-4 border-transparent border-t-[#1f1d25]" />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ── Dropdown — portalled ──────────────────────────────────────── */}
      {createPortal(
        <AnimatePresence>
          {open && coords && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => setOpen(false)} />
              <motion.div
                key="task-owner-dropdown"
                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.95 }}
                transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                style={dropdownStyle}
                className="bg-white rounded-xl shadow-xl border border-[rgba(0,0,0,0.1)] py-1 min-w-[192px]"
              >
                <p className="px-3 pt-1.5 pb-1 text-[11px] font-medium text-[#9C99A9] uppercase tracking-wider">
                  Task Owner
                </p>
                {PROJECT_OWNERS.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => { onChange(o.id); setOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#1f1d25] hover:bg-[#F4F5F6] cursor-pointer transition-colors"
                  >
                    {o.avatar ? (
                      <img src={o.avatar} alt={o.name} className="w-5 h-5 rounded-full object-cover shrink-0" />
                    ) : (
                      <AvatarInitials initials={o.initials} size={20} bgColor={o.color} />
                    )}
                    <span className="flex-1 text-left">{o.name}</span>
                    {o.id === ownerId && (
                      <Check size={13} className="text-[var(--brand-accent)] shrink-0" />
                    )}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
