// ─── ChatBubble ───────────────────────────────────────────────────────────────
// Renders a single top-level comment card including:
//   • Author avatar (initials + color)
//   • Author name, timestamp, "edited" badge
//   • Rich-text message body
//   • Entity mention chip (optional)
//   • Pin indicator
//   • Inline reply list (collapsed / expanded)
//   • Reply composer trigger
//   • ⋯ context menu (edit / delete / pin)
//
// Props follow CommentData + context callbacks to keep this component pure.

import React, { useCallback, useState } from "react";
import { motion } from "motion/react";

import type { Attachment, CommentData, CommentUser, Reply } from "./types";
import { formatTimestamp } from "./utils";
import { RichTextRenderer } from "./RichTextRenderer";
import { CommentComposer } from "./CommentComposer";
import { CommentMenu } from "./CommentMenu";
import type { CommentMenuAction } from "./CommentMenu";

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ user, size = 28 }: { user: CommentUser; size?: number }) {
  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        width={size}
        height={size}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="flex-shrink-0 flex items-center justify-center rounded-full text-white font-medium select-none"
      style={{
        width: size,
        height: size,
        backgroundColor: user.color || "#bcbbc2",
        fontSize: size * 0.38,
      }}
      aria-label={user.name}
    >
      {user.initials}
    </span>
  );
}

// ── ReplyRow ──────────────────────────────────────────────────────────────────

interface ReplyRowProps {
  reply: Reply;
  author: CommentUser | undefined;
  currentUserId: string;
  onEdit: (replyId: string, newHtml: string) => void;
  onDelete: (replyId: string) => void;
}

function ReplyRow({ reply, author, currentUserId, onEdit, onDelete }: ReplyRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const handleMenuAction = useCallback(
    (action: CommentMenuAction) => {
      if (action === "edit") setEditing(true);
      if (action === "delete") onDelete(reply.id);
    },
    [onDelete, reply.id],
  );

  const handleEditSubmit = useCallback(
    (html: string) => {
      onEdit(reply.id, html);
      setEditing(false);
    },
    [onEdit, reply.id],
  );

  const isOwn = reply.authorId === currentUserId;
  const authorName = author?.name ?? "Unknown";

  return (
    <div className="flex gap-2 items-start pt-2 group/reply">
      {/* Avatar */}
      <Avatar user={author ?? { id: reply.authorId, name: "?", initials: "?", color: "#bcbbc2", email: "" }} size={24} />

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[12px] font-semibold text-[#686576] truncate">
            {authorName}
          </span>
          <span className="text-[11px] text-[#9c99a9]">
            {formatTimestamp(reply.timestamp)}
            {reply.isEdited && <span className="ml-1">(edited)</span>}
          </span>
        </div>

        {/* Body or edit composer */}
        {editing ? (
          <CommentComposer
            onSubmit={handleEditSubmit}
            onCancelReply={() => setEditing(false)}
            placeholder="Edit reply…"
            autoFocus
            className="mt-1"
          />
        ) : (
          <>
            <RichTextRenderer html={reply.message} className="mt-0.5 text-[12px]" />
            {reply.attachments && reply.attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {reply.attachments.map(att => (
                  att.thumbnailUrl ? (
                    <img
                      key={att.id}
                      src={att.thumbnailUrl}
                      alt={att.name}
                      className="w-12 h-12 rounded-lg object-cover border border-[rgba(0,0,0,0.08)]"
                      title={att.name}
                    />
                  ) : (
                    <div key={att.id} className="flex items-center gap-1 px-2 py-1 rounded-md bg-[rgba(0,0,0,0.05)] text-[11px] text-[#686576]">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                      <span className="max-w-[100px] truncate">{att.name}</span>
                    </div>
                  )
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ⋯ menu trigger — visible on hover */}
      {isOwn && !editing && (
        <div className="relative opacity-0 group-hover/reply:opacity-100 transition-opacity flex-shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((p) => !p)}
            aria-label="Reply options"
            className="flex items-center justify-center w-5 h-5 rounded hover:bg-[rgba(0,0,0,0.06)] text-[#686576]"
          >
            <DotsIcon size={14} />
          </button>
          <CommentMenu
            isOpen={menuOpen}
            showPin={false}
            isOwn={isOwn}
            onAction={handleMenuAction}
            onClose={() => setMenuOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

// ── DotsIcon ──────────────────────────────────────────────────────────────────

function DotsIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
    </svg>
  );
}

// ── PinIcon ───────────────────────────────────────────────────────────────────

function PinBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] text-[#473bab] font-medium bg-[rgba(71,59,171,0.08)] px-1.5 py-0.5 rounded-full"
      aria-label="Pinned"
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="17" x2="12" y2="22"/>
        <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z"/>
      </svg>
      Pinned
    </span>
  );
}

// ── Main ChatBubble ───────────────────────────────────────────────────────────

interface ChatBubbleProps {
  comment: CommentData;
  getUserById: (id: string) => CommentUser | undefined;
  currentUserId: string;
  onEdit: (commentId: string, html: string) => void;
  onDelete: (commentId: string) => void;
  onPin: (commentId: string, pinned: boolean) => void;
  onAddReply: (commentId: string, html: string, attachments?: Attachment[]) => void;
  onEditReply: (commentId: string, replyId: string, html: string) => void;
  onDeleteReply: (commentId: string, replyId: string) => void;
  isRover?: boolean;
}

export function ChatBubble({
  comment,
  getUserById,
  currentUserId,
  onEdit,
  onDelete,
  onPin,
  onAddReply,
  onEditReply,
  onDeleteReply,
  isRover,
}: ChatBubbleProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replying, setReplying] = useState(false);

  const author = getUserById(comment.authorId);
  const authorName = author?.name ?? "Unknown";
  const isOwn = comment.authorId === currentUserId;

  const handleMenuAction = useCallback(
    (action: CommentMenuAction) => {
      if (action === "edit") setEditing(true);
      if (action === "delete") onDelete(comment.id);
      if (action === "pin") onPin(comment.id, true);
      if (action === "unpin") onPin(comment.id, false);
    },
    [comment.id, onDelete, onPin],
  );

  const handleEditSubmit = useCallback(
    (html: string) => {
      onEdit(comment.id, html);
      setEditing(false);
    },
    [comment.id, onEdit],
  );

  const handleReplySubmit = useCallback(
    (html: string, attachments?: Attachment[]) => {
      onAddReply(comment.id, html, attachments);
      setReplying(false);
      setShowReplies(true);
    },
    [comment.id, onAddReply],
  );

  const replyCount = comment.replies.length;

  return (
    <motion.div
      className={[
        "group bg-white rounded-2xl border border-[#e8e7ef] shadow-[0px_2px_2px_0px_rgba(0,0,0,0.08)]",
        "flex flex-col gap-2 p-3",
        comment.isPinned ? "ring-1 ring-[rgba(71,59,171,0.3)]" : "",
        isRover ? "ring-2 ring-[#473bab] border-[#473bab] bg-[rgba(71,59,171,0.04)]" : "",
      ].join(" ")}
      {...(isRover ? {
        initial: { boxShadow: "0 0 0 6px rgba(71,59,171,0.25)" },
        animate: { boxShadow: "0 0 0 0px rgba(71,59,171,0)" },
        transition: { duration: 4, ease: "easeOut" },
      } : {})}
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-2">
        {/* Avatar */}
        <Avatar user={author ?? { id: comment.authorId, name: "?", initials: "?", color: "#bcbbc2", email: "" }} size={28} />

        {/* Name + timestamp + badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-[#686576] truncate">
              {authorName}
            </span>
            {comment.isPinned && <PinBadge />}
            {comment.module && (
              <span className="text-[10px] text-[#9c99a9] bg-[rgba(0,0,0,0.04)] px-1.5 py-0.5 rounded-full">
                {comment.module}
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#9c99a9] mt-0.5">
            {formatTimestamp(comment.timestamp)}
            {comment.isEdited && <span className="ml-1">(edited)</span>}
          </div>
        </div>

        {/* ⋯ button — visible on hover */}
        <div className="relative opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((p) => !p)}
            aria-label="Comment options"
            className="flex items-center justify-center w-6 h-6 rounded hover:bg-[rgba(0,0,0,0.06)] text-[#686576]"
          >
            <DotsIcon size={16} />
          </button>
          <CommentMenu
            isOpen={menuOpen}
            isPinned={comment.isPinned}
            showPin={true}
            isOwn={isOwn}
            onAction={handleMenuAction}
            onClose={() => setMenuOpen(false)}
          />
        </div>
      </div>

      {/* ── Entity mention chip ────────────────────────────────────────────── */}
      {comment.entityMention && (
        <div className="flex items-center gap-1.5 text-[11px] text-[#686576]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          <span className="text-[#473bab] font-medium">{comment.entityMention.label}</span>
          <span className="text-[#bcbbc2]">({comment.entityMention.type})</span>
        </div>
      )}

      {/* ── Message body or edit composer ─────────────────────────────────── */}
      {editing ? (
        <CommentComposer
          onSubmit={handleEditSubmit}
          onCancelReply={() => setEditing(false)}
          placeholder="Edit comment…"
          autoFocus
        />
      ) : (
        <>
          <RichTextRenderer html={comment.message} />
          {comment.attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {comment.attachments.map(att => (
                att.thumbnailUrl ? (
                  <img
                    key={att.id}
                    src={att.thumbnailUrl}
                    alt={att.name}
                    className="w-12 h-12 rounded-lg object-cover border border-[rgba(0,0,0,0.08)]"
                    title={att.name}
                  />
                ) : (
                  <div key={att.id} className="flex items-center gap-1 px-2 py-1 rounded-md bg-[rgba(0,0,0,0.05)] text-[11px] text-[#686576]">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                    <span className="max-w-[100px] truncate">{att.name}</span>
                  </div>
                )
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Footer: reply count + reply button ────────────────────────────── */}
      {!editing && (
        <div className="flex items-center gap-3 pt-0.5">
          {replyCount > 0 && (
            <button
              type="button"
              onClick={() => setShowReplies((p) => !p)}
              className="text-[12px] text-[#473bab] hover:underline"
            >
              {showReplies ? "Hide" : `${replyCount} ${replyCount === 1 ? "reply" : "replies"}`}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setReplying((p) => !p);
              setShowReplies(true);
            }}
            className="text-[12px] text-[#686576] hover:text-[#473bab] transition-colors"
          >
            Reply
          </button>
        </div>
      )}

      {/* ── Replies ───────────────────────────────────────────────────────── */}
      {showReplies && replyCount > 0 && (
        <div className="border-t border-[#f0eef8] pt-2 flex flex-col divide-y divide-[#f0eef8]">
          {comment.replies.map((reply) => (
            <ReplyRow
              key={reply.id}
              reply={reply}
              author={getUserById(reply.authorId)}
              currentUserId={currentUserId}
              onEdit={(replyId, html) => onEditReply(comment.id, replyId, html)}
              onDelete={(replyId) => onDeleteReply(comment.id, replyId)}
            />
          ))}
        </div>
      )}

      {/* ── Reply composer ────────────────────────────────────────────────── */}
      {replying && !editing && (
        <div className="border-t border-[#f0eef8] pt-2">
          <CommentComposer
            onSubmit={handleReplySubmit}
            replyToName={authorName}
            onCancelReply={() => setReplying(false)}
            placeholder={`Reply to ${authorName}…`}
            autoFocus
          />
        </div>
      )}
    </motion.div>
  );
}
