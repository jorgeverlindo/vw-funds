// ─── CommentsSidePanel ────────────────────────────────────────────────────────
// The sliding right-side panel that houses the full comments thread for a
// project. Uses CommentsContext via useCommentsRequired().
//
// Layout:
//   ┌──────────────────────┐
//   │ Header (title + close)│
//   ├──────────────────────┤
//   │ Scrollable thread    │ ← ChatBubble list, newest on top
//   ├──────────────────────┤
//   │ Composer             │ ← new top-level comment
//   └──────────────────────┘

import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

import { useCommentsRequired, getUserById } from "./CommentsContext";
import { ChatBubble } from "./ChatBubble";
import { CommentComposer } from "./CommentComposer";
import type { Attachment } from "./types";

// ── Close icon ────────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

// ── ChatIcon ──────────────────────────────────────────────────────────────────

export function ChatIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-3 py-12 px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-[rgba(71,59,171,0.08)] flex items-center justify-center text-[#473bab]">
        <ChatIcon size={22} />
      </div>
      <p className="text-[13px] text-[#686576] leading-relaxed">
        No comments yet. Be the first to add one!
      </p>
    </div>
  );
}

// ── CommentsSidePanel ─────────────────────────────────────────────────────────

export function CommentsSidePanel() {
  const ctx = useCommentsRequired();
  const scrollRef = useRef<HTMLDivElement>(null);
  const commentRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const {
    comments,
    currentUser,
    isPanelOpen,
    closePanel,
    addComment,
    editComment,
    deleteComment,
    pinComment,
    addReply,
    editReply,
    deleteReply,
    pendingEntity,
    clearPendingEntity,
    highlightedCommentId,
  } = ctx;

  useEffect(() => {
    if (!highlightedCommentId) return;
    const el = commentRefs.current.get(highlightedCommentId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightedCommentId]);

  // Entity type → readable label
  const ENTITY_TYPE_LABEL: Record<string, string> = {
    offer: "Offer",
    template: "Template",
    background: "Background",
    preview: "Preview",
    vehicle: "VIN",
  };

  const totalCount = comments.reduce((sum, c) => sum + 1 + c.replies.length, 0);

  const handleNewComment = (html: string, attachments?: Attachment[]) => {
    addComment({
      message: html,
      replies: [],
      attachments: attachments ?? [],
      ...(pendingEntity ? { entityMention: pendingEntity } : {}),
    });
    clearPendingEntity();
    // Scroll to top (newest comment appears there)
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  return (
    <AnimatePresence>
      {isPanelOpen && (
        /* Outer: animates width so MainPane (flex-1) expands/shrinks in concert */
        <motion.div
          key="comments-panel-wrapper"
          initial={{ width: 0 }}
          animate={{ width: 400 }}
          exit={{ width: 0 }}
          transition={{ duration: 0.45, ease: [0.0, 0.0, 0.2, 1] }}
          className="flex-none h-full overflow-hidden"
        >
        <motion.aside
          key="comments-panel"
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.0, 0.0, 0.2, 1] }}
          style={{ willChange: "transform" }}
          className="flex flex-col flex-none h-full w-[400px] overflow-hidden bg-white rounded-2xl shadow-sm border border-[rgba(0,0,0,0.04)]"
          aria-label="Comments panel"
        >
          {/* ── Header ────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8e7ef] shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[#686576]">
                <ChatIcon size={16} />
              </span>
              <h2 className="text-[15px] font-semibold text-[#1f1d25] leading-tight">
                Comments
              </h2>
              {totalCount > 0 && (
                <span className="text-[12px] text-[#9c99a9]">
                  ({totalCount})
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={closePanel}
              aria-label="Close comments"
              className="flex items-center justify-center w-7 h-7 rounded-md text-[#686576] hover:bg-[rgba(0,0,0,0.06)] hover:text-[#1f1d25] transition-colors"
            >
              <CloseIcon />
            </button>
          </div>

          {/* ── Thread (scrollable) ────────────────────────────────────────── */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2"
          >
            {comments.length === 0 ? (
              <EmptyState />
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  ref={(el) => {
                    if (el) commentRefs.current.set(comment.id, el);
                    else commentRefs.current.delete(comment.id);
                  }}
                >
                  <ChatBubble
                    comment={comment}
                    getUserById={getUserById}
                    currentUserId={currentUser.id}
                    onEdit={(id, html) => editComment(id, html)}
                    onDelete={(id) => deleteComment(id)}
                    onPin={(id, pinned) => pinComment(id, pinned)}
                    onAddReply={(commentId, html, attachments) =>
                      addReply(commentId, { message: html, replies: [], attachments: attachments ?? [] })
                    }
                    onEditReply={(commentId, replyId, html) =>
                      editReply(commentId, replyId, html)
                    }
                    onDeleteReply={(commentId, replyId) =>
                      deleteReply(commentId, replyId)
                    }
                    isRover={comment.id === highlightedCommentId}
                  />
                </div>
              ))
            )}
          </div>

          {/* ── Composer ──────────────────────────────────────────────────── */}
          <div className="shrink-0 px-3 pb-3 pt-2 border-t border-[#e8e7ef]">
            {/* Entity banner — shown when a card triggered the panel */}
            {pendingEntity && (
              <div className="flex items-center justify-between gap-2 mb-2 px-2.5 py-1.5 rounded-lg bg-[rgba(71,59,171,0.06)] border border-[rgba(71,59,171,0.15)]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#473bab" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  <span className="text-[11px] text-[#686576] flex-shrink-0">
                    {ENTITY_TYPE_LABEL[pendingEntity.type] ?? pendingEntity.type}:
                  </span>
                  <span className="text-[11px] text-[#473bab] font-medium truncate">
                    {pendingEntity.label}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={clearPendingEntity}
                  aria-label="Remove entity reference"
                  className="flex-shrink-0 text-[#9c99a9] hover:text-[#686576] transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            )}
            <CommentComposer
              onSubmit={handleNewComment}
              placeholder={`Comment as ${currentUser.name.split(" ")[0]}…`}
            />
          </div>
        </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
