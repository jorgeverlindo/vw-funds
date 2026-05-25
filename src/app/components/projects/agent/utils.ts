import { STORAGE_KEYS } from "../../../constants/storageKeys";

// ─── Thread model (minimal — full type lives in ProjectAgentPane.tsx) ──────────
// We re-export only what utils needs. The full Message union is in ProjectAgentPane.
// To avoid a circular dep we accept `messages: unknown[]` and cast internally.

// ─── Thread persistence ────────────────────────────────────────────────────────
export interface AgentThread {
  id: string;
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: any[];
  createdAt: number;
  updatedAt: number;
}

export function loadAgentThreads(): AgentThread[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AGENT_THREADS);
    return raw ? (JSON.parse(raw) as AgentThread[]) : [];
  } catch { return []; }
}

export function saveAgentThreads(threads: AgentThread[]) {
  try { localStorage.setItem(STORAGE_KEYS.AGENT_THREADS, JSON.stringify(threads)); } catch {}
}

export function getThreadTitle(msgs: { type: string; role: string; content?: string }[]): string {
  const first = msgs.find(m => m.type === "text" && m.role === "user");
  if (!first || !first.content) return "New conversation";
  const t = first.content.trim();
  return t.length > 46 ? t.slice(0, 46) + "…" : t;
}

export function groupThreadsByDate(threads: AgentThread[]): { label: string; items: AgentThread[] }[] {
  const today     = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo   = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
  const groups: Record<string, AgentThread[]> = { Today: [], Yesterday: [], "This week": [], Older: [] };
  for (const t of threads) {
    const d = new Date(t.updatedAt);
    if      (d >= today)     groups.Today.push(t);
    else if (d >= yesterday) groups.Yesterday.push(t);
    else if (d >= weekAgo)   groups["This week"].push(t);
    else                     groups.Older.push(t);
  }
  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items: items.sort((a, b) => b.updatedAt - a.updatedAt) }));
}

// ─── File helpers ─────────────────────────────────────────────────────────────

/** Read a File as a base64 string (no data-URL prefix) */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Parse an Excel file to a readable text representation using xlsx */
export async function parseExcelToText(file: File): Promise<string> {
  try {
    const xlsx = await import("xlsx");
    const buf = await file.arrayBuffer();
    const wb = xlsx.read(buf, { type: "array" });
    const lines: string[] = [`[Excel file: ${file.name}]`];
    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const csv = xlsx.utils.sheet_to_csv(ws);
      if (csv.trim()) lines.push(`\nSheet: ${sheetName}\n${csv}`);
    }
    return lines.join("\n");
  } catch {
    return `[Excel file: ${file.name} — could not parse]`;
  }
}

// ─── Name deduplication helper ─────────────────────────────────────────────────
export function deduplicateName(desired: string, existing: string[]): string {
  const norm = (s: string) => s.trim().toLowerCase();
  const set = new Set(existing.map(norm));
  if (!set.has(norm(desired))) return desired;
  let i = 1;
  while (set.has(norm(`${desired} ${i}`))) i++;
  return `${desired} ${i}`;
}
