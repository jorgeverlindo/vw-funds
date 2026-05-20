// ─── RichTextRenderer ────────────────────────────────────────────────────────
// Safely renders sanitized HTML from comments / replies.
// Mention spans (data-mention-id) are styled in brand purple.
// Never call dangerouslySetInnerHTML without DOMPurify — sanitizeHtml() handles it.

import React from "react";
import { sanitizeHtml } from "./utils";

interface RichTextRendererProps {
  html: string;
  className?: string;
}

export function RichTextRenderer({ html, className = "" }: RichTextRendererProps) {
  const clean = sanitizeHtml(html);
  return (
    <div
      className={[
        "text-[13px] leading-[1.5] text-[#1f1d25] break-words",
        // Mention chips: purple, slightly bold
        "[&_[data-mention-id]]:text-[#473bab] [&_[data-mention-id]]:font-medium [&_[data-mention-id]]:cursor-default",
        // Inline formatting
        "[&_strong]:font-semibold [&_b]:font-semibold",
        "[&_em]:italic [&_i]:italic",
        "[&_u]:underline",
        "[&_s]:line-through [&_strike]:line-through",
        "[&_a]:text-[#473bab] [&_a]:underline",
        "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1",
        "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1",
        "[&_p]:mb-0",
        className,
      ].join(" ")}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
