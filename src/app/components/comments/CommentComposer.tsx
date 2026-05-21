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
import type { Attachment, CommentUser } from "./types";
import { sanitizeHtml } from "./utils";
import { FormattingToolbar } from "./FormattingToolbar";
import { MentionOverlay } from "./MentionOverlay";

// ── helpers ───────────────────────────────────────────────────────────────────

/** Convert a File to a base64 data URL. */
function fileToDataUrl(f: File): Promise<string> {
  return new Promise(resolve => {
    const r = new FileReader();
    r.onload = e => resolve(e.target!.result as string);
    r.readAsDataURL(f);
  });
}

/**
 * Insert a mention chip + trailing space at the caret, then move the cursor
 * right after the space so the user can type immediately without overwriting the chip.
 */
function insertMentionAtCaret(user: CommentUser): void {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  // Build the non-editable chip
  const chip = document.createElement("span");
  chip.setAttribute("data-mention-id", user.id);
  chip.setAttribute("contenteditable", "false");
  chip.className = "mention-chip";
  chip.textContent = `@${user.name}`;

  // Trailing plain-text space
  const space = document.createTextNode(" ");

  // 1. Insert chip at caret
  const range = sel.getRangeAt(0);
  range.insertNode(chip);

  // 2. Insert space immediately after the chip
  const afterChip = document.createRange();
  afterChip.setStartAfter(chip);
  afterChip.collapse(true);
  afterChip.insertNode(space);

  // 3. Place cursor after the space — ready for continued typing, chip not selected
  const finalRange = document.createRange();
  finalRange.setStartAfter(space);
  finalRange.collapse(true);
  sel.removeAllRanges();
  sel.addRange(finalRange);
}

// ── component ────────────────────────────────────────────────────────────────

interface CommentComposerProps {
  /** Called with sanitized HTML (and optional attachments) when the user submits */
  onSubmit: (html: string, attachments?: Attachment[]) => void;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [attachments, setAttachments] = useState<{ id: string; name: string; file: File; previewUrl: string | null }[]>([]);

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

  // ── mention trigger via @ button ──────────────────────────────────────────
  const handleMentionTrigger = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    // Insert @ at caret
    document.execCommand('insertText', false, '@');
    detectMention();
  }, [detectMention]);

  // ── attachment handlers ───────────────────────────────────────────────────
  const handleAttach = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) {
      const newItems = files.map(file => ({
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
        file,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      }));
      setAttachments(prev => [...prev, ...newItems]);
    }
    e.target.value = '';
  }, []);

  // ── keydown: Ctrl/Cmd+Enter → submit; Escape → dismiss mention ──────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        void handleSubmit();
        return;
      }
      if (e.key === "Escape" && mentionQuery !== null) {
        setMentionQuery(null);
      }
      // Cmd+Shift+7 → ordered list
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === '7') {
        e.preventDefault();
        document.execCommand('insertOrderedList', false);
        return;
      }
      // Cmd+Shift+8 → unordered list
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === '8') {
        e.preventDefault();
        document.execCommand('insertUnorderedList', false);
        return;
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
    // "<br>" and "\n" are both "empty" states browsers insert into contentEditable
    setIsEmpty(text === "" || text === "\n" || el.innerHTML === "<br>");
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

      insertMentionAtCaret(user);
      setMentionQuery(null);

      // Re-evaluate empty state
      const text = el.innerText.trim();
      setIsEmpty(text === "");
    },
    [mentionQuery],
  );

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const el = editorRef.current;
    if (!el) return;
    const raw = el.innerHTML;
    const clean = sanitizeHtml(raw);
    const text = el.innerText.trim();
    if (!text) return;

    // Build persisted Attachment[]
    const attachmentData: Attachment[] = await Promise.all(
      attachments.map(async (a) => {
        if (a.file.type.startsWith("image/")) {
          const dataUrl = await fileToDataUrl(a.file);
          return { id: a.id, name: a.name, thumbnailUrl: dataUrl };
        }
        return { id: a.id, name: a.name };
      })
    );

    onSubmit(clean, attachmentData.length > 0 ? attachmentData : undefined);

    // Revoke object URLs before clearing
    attachments.forEach(a => { if (a.previewUrl) URL.revokeObjectURL(a.previewUrl); });

    // Reset editor
    el.innerHTML = "";
    setIsEmpty(true);
    setMentionQuery(null);
    setAttachments([]);
  }, [onSubmit, attachments]);

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
            // List styles (overrides Tailwind preflight reset)
            "[&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:ml-1",
          ].join(" ")}
        />

        {/* Attachment preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-3 pb-1">
            {attachments.map((att, i) => (
              att.previewUrl ? (
                <div key={att.id} className="relative group/att">
                  <img
                    src={att.previewUrl}
                    alt={att.name}
                    className="w-10 h-10 rounded-lg object-cover border border-[rgba(0,0,0,0.1)]"
                    title={att.name}
                  />
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      URL.revokeObjectURL(att.previewUrl!);
                      setAttachments(prev => prev.filter((_, j) => j !== i));
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[rgba(0,0,0,0.5)] text-white text-[10px] flex items-center justify-center opacity-0 group-hover/att:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div key={att.id} className="flex items-center gap-1 px-2 py-1 rounded-md bg-[rgba(0,0,0,0.05)] text-[11px] text-[#686576]">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                  </svg>
                  <span className="max-w-[120px] truncate">{att.name}</span>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); setAttachments(prev => prev.filter((_, j) => j !== i)); }}
                    className="text-[#9c99a9] hover:text-[#686576]"
                  >
                    ×
                  </button>
                </div>
              )
            ))}
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Toolbar + send row */}
        <div className="flex items-center justify-between px-2 pb-2 pt-0.5">
          <FormattingToolbar onFormat={handleFormat} onMentionTrigger={handleMentionTrigger} onAttach={handleAttach} />

          <button
            type="button"
            onClick={() => void handleSubmit()}
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
