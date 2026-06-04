/**
 * URL routing utilities shared across the app.
 *
 * TAB_SLUGS  — maps internal tab id → URL segment (e.g. 'pre-approvals' → 'Pre-Approvals')
 * SLUG_TO_TAB — reverse map (URL segment → internal id), used when parsing the address bar
 * buildUrl    — constructs an absolute pathname for a given role, client, and tab
 */

export type UserType = 'dealer' | 'dealer-singular' | 'dealer-emich' | 'dealer-ridenow' | 'oem';

export const TAB_SLUGS: Record<string, string> = {
  'overview':       'Overview',
  'pre-approvals':  'Pre-Approvals',
  'claims':         'Claims',
  'cases':          'Cases',
  'planner':        'Planner',
  'guidelines':     'Guidelines',
  'web-monitoring': 'Web-Monitoring',
  // App sections — treated as top-level tab slugs for URL routing
  'projects':        'Projects',
  'portal':          'Portal',
  // App sections — treated as top-level tab slugs for URL routing
  'inventory':        'Inventory',
  // Client settings — Ride Now only
  'client-settings': 'Client-Settings',
};

export const SLUG_TO_TAB: Record<string, string> = Object.fromEntries(
  Object.entries(TAB_SLUGS).map(([k, v]) => [v, k]),
);

// ─── VIN detail URL helpers ──────────────────────────────────────────────────

/**
 * Builds the URL slug for a VIN detail page.
 * Format: Make-Model-Trim-Color-VIN (spaces → hyphens, special chars stripped)
 * Example: Yamaha-Raptor-700R-SE-Acid-Green-JY4AM03RNRA019034
 */
export function buildVinSlug(
  make: string,
  model: string,
  trim: string,
  color: string,
  vin: string,
): string {
  return [make, model, trim, color, vin]
    .join(' ')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Extracts the raw VIN (17-char alphanumeric) from the end of a VIN slug.
 * Returns null if no valid VIN is found.
 */
export function extractVinFromSlug(slug: string): string | null {
  // VINs are 17 uppercase alphanumeric chars (no I/O/Q) at the end of the slug
  const match = slug.toUpperCase().match(/[A-HJ-NPR-Z0-9]{17}$/);
  return match ? match[0] : null;
}

export function buildUrl(role: UserType, clientId: string, tabId: string): string {
  const slug = TAB_SLUGS[tabId] ?? tabId;
  if (role === 'oem') {
    if (clientId === 'vw')       return `/OEM/${slug}`;
    if (clientId === 'ride-now') return `/Ride-Now/OEM/${slug}`;
    return `/Audi/OEM/${slug}`;
  }
  const brand = clientId === 'audi' ? 'Audi' : clientId === 'ride-now' ? 'Ride-Now' : 'Volkswagen';
  if (role === 'dealer-singular')  return `/${brand}/dealership-singular/${slug}`;
  if (role === 'dealer-emich')     return `/${brand}/dealership-emich/${slug}`; // [FV]
  if (role === 'dealer-ridenow')   return `/${brand}/dealership-singular/${slug}`; // [FV] RideNow Powersports Weatherford
  return `/${brand}/dealership/${slug}`;
}
