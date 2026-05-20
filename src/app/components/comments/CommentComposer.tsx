// ─── CommentComposer ─────────────────────────────────────────────────────────
// contentEditable composer with:
//   • Rich text formatting via FormattingToolbar
//   • @mention autocomplete via MentionOverlay
//   • Send on Ctrl/Cmd+Enter (or via the send button)
//   • Optional "Reply to" banner when replyTo is supplied
//
// Mention chips are inserted as:
//   <span data-mention-id="{userId}" contenteditable="false">@Name</span>
//
// The parent receives sanitized HTML via onSubmit(html).

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { COMMENT_USERS } from "./constants";
import type { CommentUser } from "./types";
import { sanitizeHtml } from "./utils";
import { FormattingToolbar } from "./FormattingToolbar";
import { MentionOverlay } from "./MentionOverlay";

// ── helpers ───────────────────────────────────────────────────────────────────

/** Insert a node at the current caret position inside a contentEditable. */
function insertNodeAtCaret(node: Node): void {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  range.deleteContents();
  range.insertNode(node);
  // Move caret after the inserted node
  range.setStartAfter(node);
  range.setEndAfter(node);
  sel.removeAllRanges();
  sel.addRange(range);
}

/** Build a mention chip element */
function buildMentionChip(user: CommentUser): DocumentFragment {
  const frag = document.createDocumentFragment();
  const chip = document.createElement("span");
  chip.setAttribute("data-mention-id", user.id);
  chip.setAttribute("contenteditable", "false");
  chip.className = "mention-chip"; // styled via RichTextRenderer's Tailwind modifiers
  chip.textContent = `@${user.name}`;
  frag.appendChild(chip);
  // Trailing space so the cursor lands outside the chip
  frag.appendChild(document.createTextNode(" "));
  return frag;
}

// ── component ────────────────────────────────────────────────────────────────

interface CommentComposerProps {
  /** Called with sanitized HTML when the user submits */
  onSubmit: (html: string) => void;
  /** If set, shows a "Replying to …" banner */
  replyToName?: string;
  onCancelReply?: () => void;
  /** Placeholder text */
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export function CommentComposer({
  onSubmit,
  replyToName,
  onCancelReply,
  placeholder = "Add a comment…",
  autoFocus = false,
  className = "",
}: CommentComposerProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  // Mention state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null); // null = closed

  // ── focus on mount if requested ──────────────────────────────────────────
  useEffect(() => {
    if (autoFocus && editorRef.current) {
      editorRef.current.focus();
    }
  }, [autoFocus]);

  // ── formatting via execCommand ───────────────────────────────────────────
  const handleFormat = useCallback((command: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false);
  }, []);

  // ── detect @mention trigger ───────────────────────────────────────────────
  const detectMention = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      setMentionQuery(null);
      return;
    }
    const range = sel.getRangeAt(0);
    // Grab all text from the start of the node to the caret
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(editorRef.current!);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    const text = preCaretRange.toString();
    const atIdx = text.lastIndexOf("@");
    if (atIdx === -1) {
      setMentionQuery(null);
      return;
    }
    const afterAt = text.slice(atIdx + 1);
    // Only show overlay if the text after @ has no spaces (still typing a name)
    if (afterAt.includes(" ") || afterAt.length > 30) {
      setMentionQuery(null);
      return;
    }
    setMentionQuery(afterAt);
  }, []);

  // ── keydown: Ctrl/Cmd+Enter → submit; Escape → dismiss mention ──────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
        return;
      }
      if (e.key === "Escape" && mentionQuery !== null) {
        setMentionQuery(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mentionQuery],
  );

  // ── input: track empty state & mention query ─────────────────────────────
  const handleInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const text = el.innerText.trim();
    setIsEmpty(text === "" || el.innerHTML === "<br>");
    detectMention();
  }, [detectMention]);

  // ── insert a mention chip ────────────────────────────────────────────────
  const handleMentionSelect = useCallback(
    (user: CommentUser) => {
      const el = editorRef.current;
      if (!el) return;
      el.focus();

      // Delete the "@query" text we've typed so far
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const queryLen = (mentionQuery?.length ?? 0) + 1; // +1 for "@"
        range.setStart(range.endContainer, Math.max(0, range.endOffset - queryLen));
        range.deleteContents();
      }

      insertNodeAtCaret(buildMentionChip(user));
      setMentionQuery(null);

      // Re-evaluate empty state
      const text = el.innerText.trim();
      setIsEmpty(text === "");
    },
    [mentionQuery],
  );

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const raw = el.innerHTML;
    const clean = sanitizeHtml(raw);
    const text = el.innerText.trim();
    if (!text) return;

    onSubmit(clean);

    // Reset editor
    el.innerHTML = "";
    setIsEmpty(true);
    setMentionQuery(null);
  }, [onSubmit]);

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Reply-to banner */}
      {replyToName && (
        <div className="flex items-center justify-between px-3 py-1.5 mb-1 rounded-lg bg-[rgba(71,59,171,0.06)] text-[12px] text-[#473bab]">
          <span>Replying to <strong>{replyToName}</strong></span>
          {onCancelReply && (
            <button
              type="button"
              onClick={onCancelReply}
              className="ml-2 text-[#686576] hover:text-[#1f1d25] leading-none"
              aria-label="Cancel reply"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Outer box */}
      <div className="relative flex flex-col rounded-xl border border-[#e8e7ef] bg-white focus-within:border-[#473bab] focus-within:ring-1 focus-within:ring-[rgba(71,59,171,0.2)] transition-all">
        {/* contentEditable */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={placeholder}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={detectMention}
          className={[
            "min-h-[60px] max-h-40 overflow-y-auto px-3 pt-2.5 pb-1 text-[13px] leading-[1.5] text-[#1f1d25]",
            "outline-none resize-none",
            // Placeholder via CSS :empty
            "empty:before:content-[attr(aria-label)] empty:before:text-[#9c99a9] empty:before:pointer-events-none",
            // Mention chips rendered inside
            "[&_[data-mention-id]]:text-[#473bab] [&_[data-mention-id]]:font-medium",
          ].join(" ")}
        />

        {/* Toolbar + send row */}
        <div className="flex items-center justify-between px-2 pb-2 pt-0.5">
          <FormattingToolbar onFormat={handleFormat} />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isEmpty}
            aria-label="Send comment"
            className={[
              "flex items-center justify-center w-7 h-7 rounded-full transition-colors",
              isEmpty
                ? "text-[#cac9cf] cursor-not-allowed"
                : "bg-[#473bab] text-white hover:bg-[#382f8f]",
            ].join(" ")}
          >
            {/* Paper-plane icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>

        {/* Mention overlay — floats above the composer */}
        {mentionQuery !== null && (
          <MentionOverlay
            query={mentionQuery}
            users={COMMENT_USERS}
            onSelect={handleMentionSelect}
            onDismiss={() => setMentionQuery(null)}
          />
        )}
      </div>
    </div>
  );
}
