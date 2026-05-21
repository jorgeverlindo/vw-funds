// ─── FormattingToolbar ────────────────────────────────────────────────────────
// Renders the B / I / U / S / OL / UL / @ / 📎 toolbar for the comment composer.
// Uses document.execCommand (deprecated but widely supported; migrate to
// Selection API in a future pass if needed).

import React from "react";

interface ToolbarButtonProps {
  title: string;
  command?: string;
  children: React.ReactNode;
  onFormat?: (command: string) => void;
  onClick?: () => void;
}

function ToolbarButton({ title, command, children, onFormat, onClick }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={(e) => {
        // Prevent blur before execCommand
        e.preventDefault();
        if (onClick) {
          onClick();
        } else if (command && onFormat) {
          onFormat(command);
        }
      }}
      className={[
        "flex items-center justify-center w-7 h-7 rounded",
        "text-[#686576] hover:bg-[rgba(0,0,0,0.06)] hover:text-[#1f1d25]",
        "transition-colors duration-100 select-none",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

interface FormattingToolbarProps {
  /** Called with the execCommand string to apply to the focused contentEditable */
  onFormat: (command: string) => void;
  /** Called when @ button is clicked */
  onMentionTrigger: () => void;
  /** Called when attachment button is clicked */
  onAttach: () => void;
  className?: string;
}

export function FormattingToolbar({ onFormat, onMentionTrigger, onAttach, className = "" }: FormattingToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Text formatting"
      className={`flex items-center gap-0.5 ${className}`}
    >
      {/* Mention */}
      <ToolbarButton title="Mention (@)" onClick={onMentionTrigger}>
        <span className="font-medium text-[13px] leading-none">@</span>
      </ToolbarButton>

      {/* Attach */}
      <ToolbarButton title="Attach file" onClick={onAttach}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
        </svg>
      </ToolbarButton>

      {/* Divider */}
      <div className="w-px h-4 bg-[#e8e7ef] mx-1" />

      {/* Bold */}
      <ToolbarButton title="Bold (⌘B)" command="bold" onFormat={onFormat}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
          <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
        </svg>
      </ToolbarButton>

      {/* Italic */}
      <ToolbarButton title="Italic (⌘I)" command="italic" onFormat={onFormat}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="4" x2="10" y2="4"/>
          <line x1="14" y1="20" x2="5" y2="20"/>
          <line x1="15" y1="4" x2="9" y2="20"/>
        </svg>
      </ToolbarButton>

      {/* Underline */}
      <ToolbarButton title="Underline (⌘U)" command="underline" onFormat={onFormat}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/>
          <line x1="4" y1="21" x2="20" y2="21"/>
        </svg>
      </ToolbarButton>

      {/* Strikethrough */}
      <ToolbarButton title="Strikethrough (⌘⇧X)" command="strikeThrough" onFormat={onFormat}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"/>
          <path d="M16 6C16 6 14.5 4 12 4C9.5 4 7 5.5 7 8C7 10.5 10 11 12 12"/>
          <path d="M8 18C8 18 9.5 20 12 20C14.5 20 17 18.5 17 16C17 13.5 14 13 12 12"/>
        </svg>
      </ToolbarButton>

      {/* Divider */}
      <div className="w-px h-4 bg-[#e8e7ef] mx-1" />

      {/* Ordered list */}
      <ToolbarButton title="Ordered list (⌘⇧7)" command="insertOrderedList" onFormat={onFormat}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="10" y1="6" x2="21" y2="6"/>
          <line x1="10" y1="12" x2="21" y2="12"/>
          <line x1="10" y1="18" x2="21" y2="18"/>
          <path d="M4 6h1v4"/>
          <path d="M4 10h2"/>
          <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>
        </svg>
      </ToolbarButton>

      {/* Unordered list */}
      <ToolbarButton title="Unordered list (⌘⇧8)" command="insertUnorderedList" onFormat={onFormat}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="9" y1="6" x2="20" y2="6"/>
          <line x1="9" y1="12" x2="20" y2="12"/>
          <line x1="9" y1="18" x2="20" y2="18"/>
          <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none"/>
          <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none"/>
          <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none"/>
        </svg>
      </ToolbarButton>
    </div>
  );
}
