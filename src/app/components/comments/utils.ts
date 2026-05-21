// ─── Comments — utilities ─────────────────────────────────────────────────────

import DOMPurify from "dompurify";

// ── HTML sanitization ─────────────────────────────────────────────────────────

/** Allowed tags for comment rich text. */
const ALLOWED_TAGS = ["b", "strong", "i", "em", "u", "s", "strike", "a", "br", "p", "ul", "ol", "li", "span"];
const ALLOWED_ATTR = ["href", "target", "rel", "class", "data-mention-id"];

/**
 * Sanitize HTML coming from contentEditable before storing or rendering.
 * Strips all potentially dangerous tags/attributes while keeping formatting.
 */
export function sanitizeHtml(html: string): string {
  try {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      FORCE_BODY: false,
    });
  } catch {
    // DOMPurify unavailable (edge case) — strip all tags as fallback
    return html.replace(/<[^>]*>/g, "");
  }
}

export function htmlToPlainTextSafe(html: string): string {
  try {
    return htmlToPlainText(html);
  } catch {
    return html.replace(/<[^>]*>/g, "").slice(0, 80);
  }
}

/**
 * Strip all HTML tags and return plain text.
 * Used for notification previews and accessible labels.
 */
export function htmlToPlainText(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return div.textContent ?? div.innerText ?? "";
}

// ── ID generation ─────────────────────────────────────────────────────────────

/** Generate a simple collision-resistant ID (not crypto-grade — prototype only). */
export function genId(prefix = "c"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── Timestamp formatting ──────────────────────────────────────────────────────

const MINUTE = 60_000;
const HOUR   = 3_600_000;
const DAY    = 86_400_000;

/**
 * Returns a human-readable relative timestamp.
 * < 1 min → "just now"
 * < 1 hour → "Xm ago"
 * < 24 hours → "Xh ago"
 * < 7 days → "Mon", "Tue", …
 * otherwise → "May 20"
 */
export function formatTimestamp(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < MINUTE)       return "just now";
  if (diff < HOUR)         return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY)          return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 7 * DAY) {
    return new Date(ts).toLocaleDateString("en-US", { weekday: "short" });
  }
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Mention parsing ───────────────────────────────────────────────────────────

/**
 * Extract all @mentioned user IDs from sanitized HTML.
 * Mentions are stored as <span data-mention-id="userId">@Name</span>.
 */
export function extractMentionIds(html: string): string[] {
  const div = document.createElement("div");
  div.innerHTML = html;
  const spans = Array.from(div.querySelectorAll("[data-mention-id]"));
  return spans.map(s => s.getAttribute("data-mention-id")!).filter(Boolean);
}

// ── localStorage helpers ──────────────────────────────────────────────────────

export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded or private browsing — fail silently
  }
}
