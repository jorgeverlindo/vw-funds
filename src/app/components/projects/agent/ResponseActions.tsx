"use client";

import { useState } from "react";
import { Check, Copy, ThumbsUp, ThumbsDown, Pencil, Download, Share2 } from "lucide-react";
import { cn } from "../../../../lib/utils";

// ─── Response action bar ───────────────────────────────────────────────────────
export function ResponseActions({ text }: { text: string }) {
  const [liked,    setLiked]    = useState<boolean | null>(null);
  const [copied,   setCopied]   = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };
  const handleDownload = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "constellation-response.txt";
    a.click(); URL.revokeObjectURL(url);
  };
  const handleShare = () => {
    if (navigator.share) navigator.share({ text }).catch(() => {});
    else handleCopy();
  };

  const btn = "flex items-center justify-center w-[26px] h-[26px] rounded-full hover:bg-black/6 transition-colors cursor-pointer text-[var(--ink-tertiary)] hover:text-[var(--ink-secondary)]";

  return (
    <div className="flex items-center gap-[1px] mt-[6px] ml-[32px]">
      <button onClick={handleCopy} className={btn} title="Copy">
        {copied
          ? <Check size={12} className="text-[#2e9c5e]" strokeWidth={2.5} />
          : <Copy size={12} strokeWidth={1.7} />}
      </button>
      <button onClick={() => setLiked(liked === true ? null : true)} className={cn(btn, liked === true && "text-[var(--brand-accent)]")} title="Like">
        <ThumbsUp size={12} strokeWidth={1.7} />
      </button>
      <button onClick={() => setLiked(liked === false ? null : false)} className={cn(btn, liked === false && "text-[#dc2626]")} title="Dislike">
        <ThumbsDown size={12} strokeWidth={1.7} />
      </button>
      <button className={btn} title="Edit">
        <Pencil size={12} strokeWidth={1.7} />
      </button>
      <button onClick={handleDownload} className={btn} title="Download">
        <Download size={12} strokeWidth={1.7} />
      </button>
      <button onClick={handleShare} className={btn} title="Share">
        <Share2 size={12} strokeWidth={1.7} />
      </button>
    </div>
  );
}
