import catalog from "./jellybean-catalog.json";
import { jbNorm, jbModelMatch, jbTrimScore } from "../../lib/agent/jellybean-algo.js";

export interface JellybeanEntry {
  id: string;
  year: number;
  make: string;
  model: string;
  modelSlug: string;
  trim: string;
  colorRaw: string;
  colorFamily: string;
  s3Url: string;
  cloudinaryUrl: string;
}

const CATALOG = catalog as JellybeanEntry[];

/**
 * Resolves the best jellybean URL for a given vehicle.
 * Falls back to the S3 URL if cloudinaryUrl would be the same path pattern.
 */
export function resolveJellybean(
  make: string,
  model: string,
  trim: string,
  year?: string | number,
  colorFamily?: string,
): string {
  const yearNum = year ? parseInt(String(year)) : undefined;

  const candidates = CATALOG.filter(e =>
    jbNorm(e.make) === jbNorm(make) && jbModelMatch(e.model, model),
  );

  if (candidates.length === 0) return "";

  // Score each candidate
  const scored = candidates.map(e => {
    let score = 0;
    if (yearNum && e.year === yearNum) score += 10;
    score += jbTrimScore(e.trim, trim);
    if (colorFamily && e.colorFamily === colorFamily) score += 5;
    return { e, score };
  });

  scored.sort((a, b) => b.score - a.score);
  // If a specific color was requested, only return a result if that color exists
  if (colorFamily) {
    const colorMatch = scored.find(s => s.e.colorFamily === colorFamily);
    return colorMatch ? colorMatch.e.s3Url : "";
  }
  return scored[0].e.s3Url;
}

/** Returns the JellybeanEntry for a given jellybean ID, or null. */
export function getJellybeanById(id: string): JellybeanEntry | null {
  return CATALOG.find(e => e.id === id) ?? null;
}

/** Returns all unique color families available for a given model (and optionally year). */
export function getColorFamilies(model: string, year?: string | number): string[] {
  const yearNum = year ? parseInt(String(year)) : undefined;
  const entries = CATALOG.filter(e =>
    jbModelMatch(e.model, model) &&
    (!yearNum || e.year === yearNum),
  );
  const families = [...new Set(entries.map(e => e.colorFamily))].filter(f => f !== "other");
  return families.sort();
}

/** Returns all jellybean entries matching model + color family (and optionally year + trim). */
export function getJellybeansByModelAndColor(
  model: string,
  colorFamily: string,
  year?: string | number,
  trim?: string,
): JellybeanEntry[] {
  const yearNum = year ? parseInt(String(year)) : undefined;
  return CATALOG.filter(e =>
    jbModelMatch(e.model, model) &&
    e.colorFamily === colorFamily &&
    (!yearNum || e.year === yearNum) &&
    (!trim || jbTrimScore(e.trim, trim) > 0),
  );
}

export default CATALOG;
