// ─── Number formatters ────────────────────────────────────────────────────────

export function fmtUSD(n: number, compact = false): string {
  if (compact) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  }
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export function fmtPct(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

export function fmtDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function fmtMonthLabel(ym: string): string {
  const [y, m] = ym.split('-');
  return new Date(+y, +m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

// ─── SVG donut path computation ───────────────────────────────────────────────

function toRad(deg: number) { return (deg * Math.PI) / 180; }

/** Returns SVG path string for a pie/donut sector (cx, cy = center, r = radius). */
export function arcPath(
  cx: number, cy: number, r: number,
  startAngle: number, endAngle: number,
): string {
  const x1 = cx + r * Math.cos(toRad(startAngle - 90));
  const y1 = cy + r * Math.sin(toRad(startAngle - 90));
  const x2 = cx + r * Math.cos(toRad(endAngle - 90));
  const y2 = cy + r * Math.sin(toRad(endAngle - 90));
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
}

/** Build an array of {path, color} from value slices. */
export function buildDonutSlices(
  slices: { value: number; color: string }[],
  cx = 120, cy = 120, r = 80,
): { path: string; color: string }[] {
  const total = slices.reduce((s, v) => s + v.value, 0);
  let cursor = 0;
  return slices.map(({ value, color }) => {
    const startAngle = cursor;
    const sweep = (value / total) * 360;
    const endAngle = cursor + sweep;
    cursor = endAngle;
    return { path: arcPath(cx, cy, r, startAngle, endAngle), color };
  });
}

// ─── Generic groupBy + sum ────────────────────────────────────────────────────

export function groupSum<T extends Record<string, unknown>>(
  rows: T[],
  key: keyof T,
  fields: (keyof T)[],
): Record<string, Record<keyof T, number>> {
  const result: Record<string, Record<keyof T, number>> = {};
  for (const row of rows) {
    const k = String(row[key]);
    if (!result[k]) {
      result[k] = {} as Record<keyof T, number>;
      for (const f of fields) result[k][f] = 0;
    }
    for (const f of fields) result[k][f] = (result[k][f] ?? 0) + (Number(row[f]) || 0);
  }
  return result;
}

/** Returns sorted entries (desc) from a groupSum result by a given field. */
export function sortedEntries<T>(
  grouped: Record<string, Record<string, number>>,
  sortField: string,
  limit?: number,
): [string, Record<string, number>][] {
  const entries = Object.entries(grouped).sort((a, b) => b[1][sortField] - a[1][sortField]);
  return limit ? entries.slice(0, limit) : entries;
}

/** Normalize a dealer name from code for display (format: "Jim Ellis VW") */
export const DEALER_NAMES: Record<string, string> = {
  '402165': 'Open Road VW',
  '408252': 'Jim Ellis VW Chamblee',
  '405193': 'Rick Case VW Weston',
  '412847': 'Hendrick VW Frisco',
  '409331': 'Jack Daniels VW',
  '406782': 'VW of Downtown Chicago',
  '403921': 'Palisades VW',
  '410654': 'VW of Coconut Creek',
  '407438': 'Emich VW',
  '413259': 'Luther Westside VW',
  '404815': 'Armstrong VW Manhattan',
  '411037': 'Trend Motors VW',
  '408923': 'Douglas VW',
  '405672': 'Jim Ellis VW Chamblee',
};

export function dealerName(code: string): string {
  return DEALER_NAMES[code] ?? `Dealer ${code}`;
}

// ─── Inline bar width (for table rows) ───────────────────────────────────────
export function barWidth(value: number, max: number, maxPx = 120): number {
  return max > 0 ? Math.round((value / max) * maxPx) : 0;
}
