// ─── NotificationsTray ────────────────────────────────────────────────────────
// Sliding right-side panel listing @mention / reply notifications for the
// current user. Uses CommentsContext via useCommentsRequired().
//
// Layout:
//   ┌──────────────────────────┐
//   │ Header (title + actions) │
//   ├──────────────────────────┤
//   │ Scrollable notif list    │ ← NotifRow list, newest on top
//   └──────────────────────────┘

import React from "react";
import { motion, AnimatePresence } from "motion/react";

import { useCommentsRequired, getUserById } from "./CommentsContext";
import { formatTimestamp } from "./utils";
import type { NotifItem } from "./types";

// ── Icons ─────────────────────────────────────────────────────────────────────

export function BellIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CheckAllIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12l5 5 8-8" />
      <path d="M9 12l5 5 8-8" />
    </svg>
  );
}

// ── Action label helpers ──────────────────────────────────────────────────────

const ACTION_LABEL: Record<string, string> = {
  mentioned_you:   "mentioned you",
  replied_to_you:  "replied to you",
  commented:       "commented",
  pinned:          "pinned a comment",
  assigned_you:    "assigned you",
};

// ── Actor Avatar ──────────────────────────────────────────────────────────────

function ActorAvatar({ actorId }: { actorId: string }) {
  const user = getUserById(actorId);
  if (!user) {
    return (
      <div className="w-7 h-7 rounded-full bg-[rgba(0,0,0,0.12)] flex items-center justify-center shrink-0 text-[10px] font-semibold text-[#686576]">
        ?
      </div>
    );
  }
  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        className="w-7 h-7 rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-semibold text-white"
      style={{ background: user.color }}
    >
      {user.initials}
    </div>
  );
}

// ── Single notification row ───────────────────────────────────────────────────

interface NotifRowProps {
  notif: NotifItem;
  onRead: (id: string) => void;
  onOpenComments: () => void;
}

function NotifRow({ notif, onRead, onOpenComments }: NotifRowProps) {
  const actor = getUserById(notif.actorId);
  const actorName = actor?.name.split(" ")[0] ?? "Someone";
  const actionLabel = ACTION_LABEL[notif.action] ?? notif.action;

  const handleClick = () => {
    if (!notif.isRead) onRead(notif.id);
    onOpenComments();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={[
        "w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-lg transition-colors cursor-pointer group",
        notif.isRead
          ? "hover:bg-[rgba(0,0,0,0.04)]"
          : "bg-[rgba(71,59,171,0.05)] hover:bg-[rgba(71,59,171,0.09)]",
      ].join(" ")}
    >
      {/* Unread dot */}
      <div className="flex items-center justify-center w-2 shrink-0 mt-[9px]">
        {!notif.isRead && (
          <div className="w-1.5 h-1.5 rounded-full bg-[#473bab]" />
        )}
      </div>

      {/* Avatar */}
      <ActorAvatar actorId={notif.actorId} />

      {/* Text block */}
      <div className="flex-1 min-w-0">
        <p className="text-[12px] leading-[1.4] text-[#1f1d25]">
          <span className="font-semibold">{actorName}</span>
          {" "}
          <span className="text-[#686576]">{actionLabel}</span>
        </p>
        {notif.preview && (
          <p className="text-[11px] text-[#9c99a9] mt-0.5 line-clamp-2 leading-[1.4]">
            {notif.preview}
          </p>
        )}
        <p className="text-[10px] text-[#b8b6c0] mt-1">
          {formatTimestamp(notif.timestamp)}
        </p>
      </div>
    </button>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-3 py-12 px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-[rgba(71,59,171,0.08)] flex items-center justify-center text-[#473bab]">
        <BellIcon size={22} />
      </div>
      <p className="text-[13px] text-[#686576] leading-relaxed">
        No notifications yet. Mention someone with @name to notify them.
      </p>
    </div>
  );
}

// ── NotificationsTray ─────────────────────────────────────────────────────────

export function NotificationsTray() {
  const ctx = useCommentsRequired();

  const {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    isNotifOpen,
    closeNotif,
    openPanel,
  } = ctx;

  // Only show notifications addressed to the current user
  const myNotifs = notifications.filter(
    (n) => n.recipientId === ctx.currentUser.id,
  );

  const handleOpenComments = () => {
    closeNotif();
    openPanel();
  };

  return (
    <AnimatePresence>
      {isNotifOpen && (
        <motion.div
          key="notifs-tray-wrapper"
          initial={{ width: 0 }} animate={{ width: 400 }} exit={{ width: 0 }}
          transition={{ duration: 0.45, ease: [0.0, 0.0, 0.2, 1] }}
          className="flex-none h-full overflow-hidden"
        >
        <motion.aside
          key="notifs-tray"
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.0, 0.0, 0.2, 1] }}
          style={{ willChange: "transform" }}
          className="flex flex-col flex-none h-full w-[400px] overflow-hidden bg-white rounded-2xl shadow-sm border border-[rgba(0,0,0,0.04)]"
          aria-label="Notifications tray"
        >
          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8e7ef] shrink-0 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[#686576] shrink-0">
                <BellIcon size={16} />
              </span>
              <h2 className="text-[15px] font-semibold text-[#1f1d25] leading-tight shrink-0">
                Notifications
              </h2>
              {unreadCount > 0 && (
                <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold bg-[#473bab] text-white shrink-0">
                  {unreadCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Mark all read */}
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  title="Mark all as read"
                  aria-label="Mark all as read"
                  className="flex items-center justify-center w-7 h-7 rounded-md text-[#686576] hover:bg-[rgba(0,0,0,0.06)] hover:text-[#1f1d25] transition-colors"
                >
                  <CheckAllIcon />
                </button>
              )}
              {/* Close */}
              <button
                type="button"
                onClick={closeNotif}
                aria-label="Close notifications"
                className="flex items-center justify-center w-7 h-7 rounded-md text-[#686576] hover:bg-[rgba(0,0,0,0.06)] hover:text-[#1f1d25] transition-colors"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* ── List (scrollable) ────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-0.5">
            {myNotifs.length === 0 ? (
              <EmptyState />
            ) : (
              myNotifs.map((notif) => (
                <NotifRow
                  key={notif.id}
                  notif={notif}
                  onRead={markRead}
                  onOpenComments={handleOpenComments}
                />
              ))
            )}
          </div>
        </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
