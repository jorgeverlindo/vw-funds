// ─── MentionOverlay ──────────────────────────────────────────────────────────
// Floating dropdown that appears when the user types "@" in the composer.
// Filters COMMENT_USERS by the partial query and lets the parent insert a
// mention chip into the contentEditable.

import React, { useEffect, useRef, useState } from "react";
import type { CommentUser } from "./types";

interface MentionOverlayProps {
  query: string;
  users: CommentUser[];
  onSelect: (user: CommentUser) => void;
  onDismiss: () => void;
}

function UserRow({
  user,
  isActive,
  onClick,
}: {
  user: CommentUser;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault(); // don't blur the composer
        onClick();
      }}
      className={[
        "flex items-center gap-3 w-full px-3 py-2 text-left transition-colors",
        isActive ? "bg-[rgba(71,59,171,0.08)]" : "hover:bg-[rgba(0,0,0,0.04)]",
      ].join(" ")}
    >
      {/* Avatar */}
      <span
        className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full text-white text-[10px] font-medium select-none"
        style={{ backgroundColor: user.color || "#bcbbc2" }}
        aria-hidden="true"
      >
        {user.initials}
      </span>

      {/* Name + email */}
      <span className="flex flex-col min-w-0">
        <span className="text-[13px] text-[#1f1d25] leading-tight truncate font-medium">
          {user.name}
        </span>
        {user.email && (
          <span className="text-[11px] text-[#686576] leading-tight truncate">
            {user.email}
          </span>
        )}
      </span>
    </button>
  );
}

export function MentionOverlay({ query, users, onSelect, onDismiss }: MentionOverlayProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email?.toLowerCase().includes(query.toLowerCase()),
  );

  // Reset active index whenever the filter results change
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Keyboard navigation wired through the parent composer via a global keydown
  // listener attached here so we don't steal events from the contentEditable.
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (filtered.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        onSelect(filtered[activeIndex]);
      } else if (e.key === "Escape") {
        onDismiss();
      }
    };

    window.addEventListener("keydown", handleKey, { capture: true });
    return () => window.removeEventListener("keydown", handleKey, { capture: true });
  }, [filtered, activeIndex, onSelect, onDismiss]);

  if (filtered.length === 0) return null;

  return (
    <div
      role="listbox"
      aria-label="Mention users"
      className={[
        "absolute z-50 bottom-full mb-1 left-0 w-64",
        "bg-white rounded-xl overflow-hidden",
        "shadow-[0px_3px_14px_2px_rgba(0,0,0,0.12),0px_8px_10px_1px_rgba(0,0,0,0.14),0px_5px_5px_-3px_rgba(0,0,0,0.2)]",
        "max-h-48 overflow-y-auto",
      ].join(" ")}
    >
      <div className="py-1">
        {filtered.map((user, idx) => (
          <UserRow
            key={user.id}
            user={user}
            isActive={idx === activeIndex}
            onClick={() => onSelect(user)}
          />
        ))}
      </div>
    </div>
  );
}
