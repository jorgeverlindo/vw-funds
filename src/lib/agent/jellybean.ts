// ─── Canonical jellybean helpers (server / Node.js only) ─────────────────────
// Algorithm helpers (jbNorm, jbModelMatch, jbTrimScore) are re-exported from
// jellybean-algo.ts which is browser-safe. This file adds the catalog-dependent
// helpers (jbListColors, jbResolve) that use createRequire and must stay server-side.

import { createRequire } from "module";
import type { JBEntry } from "./types.js";

import { jbNorm, jbModelMatch, jbTrimScore } from "./jellybean-algo.js";
export { jbNorm, jbModelMatch, jbTrimScore };

const _require = createRequire(import.meta.url);
const JB = _require("../../data/jellybeans/jellybean-catalog.json") as JBEntry[];

/** Returns all available color families for a model (optionally filtered by year). */
export function jbListColors(model: string, year?: string): string[] {
  const y = year ? parseInt(year) : undefined;
  const families = [...new Set(
    JB.filter(e => jbModelMatch(e.model, model) && (!y || e.year === y))
      .map(e => e.colorFamily)
      .filter(f => f !== "other"),
  )];
  return families.sort();
}

/** Resolves the best jellybean URL + id for the given model/color/year/trim. */
export function jbResolve(
  model: string,
  colorFamily: string,
  year?: string,
  trim?: string,
): { url: string; id: string } | null {
  const y = year ? parseInt(year) : undefined;
  const candidates = JB.filter(e =>
    jbModelMatch(e.model, model) &&
    e.colorFamily === colorFamily &&
    (!y || e.year === y),
  );
  if (!candidates.length) return null;
  const scored = candidates.map(e => ({ e, score: trim ? jbTrimScore(e.trim, trim) : 0 }));
  scored.sort((a, b) => b.score - a.score);
  return { url: scored[0].e.s3Url, id: scored[0].e.id };
}
