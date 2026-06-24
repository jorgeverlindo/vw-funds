// ─── Pure jellybean algorithm helpers (browser + server safe) ─────────────────
// No catalog import — safe to use in both browser and Node.js contexts.
// jbListColors / jbResolve (catalog-dependent) live in jellybean.ts (server only).

export function jbNorm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function jbModelMatch(a: string, b: string): boolean {
  return jbNorm(a) === jbNorm(b);
}

/** Scores how well catalogTrim matches queryTrim. Uses whitespace-split tokens (canonical). */
export function jbTrimScore(ct: string, qt: string): number {
  if (!qt) return 1;
  const c = jbNorm(ct), q = jbNorm(qt);
  if (c === q) return 3;
  if (c.startsWith(q) || q.startsWith(c)) return 2;
  const ctTokens = c.split(/\s+/);
  const qtTokens = q.split(/\s+/);
  const shared = qtTokens.filter(t => t.length > 1 && ctTokens.includes(t)).length;
  return shared > 0 ? shared : 0;
}
