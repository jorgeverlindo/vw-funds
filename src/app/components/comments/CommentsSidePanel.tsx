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

import React, { useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

import { useCommentsRequired, getUserById } from "./CommentsContext";
import { ChatBubble } from "./ChatBubble";
import { CommentComposer } from "./CommentComposer";

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
  } = ctx;

  const handleNewComment = (html: string) => {
    addComment({ message: html, replies: [], attachments: [] });
    // Scroll to top (newest comment appears there)
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  return (
    <AnimatePresence>
      {isPanelOpen && (
        <motion.aside
          key="comments-panel"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          className="flex flex-col h-full overflow-hidden border-l border-[#e8e7ef] bg-white shrink-0"
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
              {comments.length > 0 && (
                <span className="text-[12px] text-[#9c99a9]">
                  ({comments.length})
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
                <ChatBubble
                  key={comment.id}
                  comment={comment}
                  getUserById={getUserById}
                  currentUserId={currentUser.id}
                  onEdit={(id, html) => editComment(id, html)}
                  onDelete={(id) => deleteComment(id)}
                  onPin={(id, pinned) => pinComment(id, pinned)}
                  onAddReply={(commentId, html) =>
                    addReply(commentId, { message: html, replies: [], attachments: [] })
                  }
                  onEditReply={(commentId, replyId, html) =>
                    editReply(commentId, replyId, html)
                  }
                  onDeleteReply={(commentId, replyId) =>
                    deleteReply(commentId, replyId)
                  }
                />
              ))
            )}
          </div>

          {/* ── Composer ──────────────────────────────────────────────────── */}
          <div className="shrink-0 px-3 pb-3 pt-2 border-t border-[#e8e7ef]">
            <CommentComposer
              onSubmit={handleNewComment}
              placeholder={`Comment as ${currentUser.name.split(" ")[0]}…`}
            />
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
