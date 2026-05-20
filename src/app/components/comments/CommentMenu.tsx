// ─── CommentMenu ─────────────────────────────────────────────────────────────
// Context menu triggered from the ⋯ button on a comment or reply.
// Items: Edit · Delete · Pin (only on top-level comments)

import React, { useEffect, useRef } from "react";

export type CommentMenuAction = "edit" | "delete" | "pin" | "unpin";

interface MenuItem {
  action: CommentMenuAction;
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
}

interface CommentMenuProps {
  isOpen: boolean;
  isPinned?: boolean;
  showPin?: boolean; // false for replies
  isOwn?: boolean;   // only own comments can be edited/deleted
  onAction: (action: CommentMenuAction) => void;
  onClose: () => void;
}

// ── Icons (inline micro-SVGs) ─────────────────────────────────────────────────

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/>
      <path d="M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="17" x2="12" y2="22"/>
      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z"/>
    </svg>
  );
}

// ── component ─────────────────────────────────────────────────────────────────

export function CommentMenu({
  isOpen,
  isPinned = false,
  showPin = true,
  isOwn = true,
  onAction,
  onClose,
}: CommentMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick, true);
    return () => document.removeEventListener("mousedown", handleClick, true);
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const items: MenuItem[] = [
    ...(isOwn
      ? [
          { action: "edit" as CommentMenuAction, label: "Edit", icon: <PencilIcon /> },
          { action: "delete" as CommentMenuAction, label: "Delete", icon: <TrashIcon />, danger: true },
        ]
      : []),
    ...(showPin
      ? [
          {
            action: (isPinned ? "unpin" : "pin") as CommentMenuAction,
            label: isPinned ? "Unpin" : "Pin",
            icon: <PinIcon />,
          },
        ]
      : []),
  ];

  if (items.length === 0) return null;

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Comment actions"
      className={[
        "absolute right-0 top-6 z-50 min-w-[140px]",
        "bg-white rounded-md overflow-hidden",
        "shadow-[0px_3px_14px_2px_rgba(0,0,0,0.12),0px_8px_10px_1px_rgba(0,0,0,0.14),0px_5px_5px_-3px_rgba(0,0,0,0.2)]",
        "py-1",
      ].join(" ")}
    >
      {items.map(({ action, label, icon, danger }) => (
        <button
          key={action}
          role="menuitem"
          type="button"
          onClick={() => {
            onAction(action);
            onClose();
          }}
          className={[
            "flex items-center gap-3 w-full px-4 py-2 text-left text-[14px]",
            "transition-colors hover:bg-[rgba(0,0,0,0.04)]",
            danger ? "text-[#c62828]" : "text-[#1f1d25]",
          ].join(" ")}
        >
          <span className={`opacity-56 ${danger ? "text-[#c62828]" : "text-[rgba(17,16,20,0.56)]"}`}>
            {icon}
          </span>
          {label}
        </button>
      ))}
    </div>
  );
}
