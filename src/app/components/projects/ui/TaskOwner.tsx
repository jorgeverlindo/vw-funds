/**
 * TaskOwner — Per-section task owner avatar.
 * Hover shows tooltip. Click opens owner-picker dropdown.
 */

import { useState } from "react";
import { Check, UserCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PROJECT_OWNERS } from "../CreateProjectDialog";
import { AvatarInitials } from "../../ui/AvatarInitials";

type Owner = typeof PROJECT_OWNERS[number];

export function TaskOwner({
  ownerId,
  onChange,
}: {
  ownerId?: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  const owner: Owner | undefined = PROJECT_OWNERS.find((o) => o.id === ownerId);

  return (
    <div className="relative">
      {/* Avatar button */}
      <button
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => { setOpen((v) => !v); setHovered(false); }}
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

      {/* Tooltip */}
      <AnimatePresence>
        {hovered && !open && (
          <motion.div
            key="tooltip"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap text-[11px] font-medium text-white bg-[#1f1d25] rounded-lg px-2.5 py-1.5 pointer-events-none z-50 shadow-md"
            style={{ fontFamily: "'Roboto', sans-serif" }}
          >
            Click to change task owner
            {/* Caret */}
            <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1f1d25]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              key="dropdown"
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
              className="absolute right-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-xl border border-[rgba(0,0,0,0.1)] py-1 min-w-[192px]"
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
                  <span className="flex-1 text-left" style={{ fontFamily: "'Roboto', sans-serif" }}>{o.name}</span>
                  {o.id === ownerId && (
                    <Check size={13} className="text-[var(--brand-accent)] shrink-0" />
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
