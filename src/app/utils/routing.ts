/**
 * URL routing utilities shared across the app.
 *
 * TAB_SLUGS  — maps internal tab id → URL segment (e.g. 'pre-approvals' → 'Pre-Approvals')
 * SLUG_TO_TAB — reverse map (URL segment → internal id), used when parsing the address bar
 * buildUrl    — constructs an absolute pathname for a given role, client, and tab
 */

export type UserType = 'dealer' | 'dealer-singular' | 'dealer-emich' | 'oem';

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

export function buildUrl(role: UserType, clientId: string, tabId: string): string {
  const slug = TAB_SLUGS[tabId] ?? tabId;
  if (role === 'oem') {
    if (clientId === 'vw')       return `/OEM/${slug}`;
    if (clientId === 'ride-now') return `/Ride-Now/OEM/${slug}`;
    return `/Audi/OEM/${slug}`;
  }
  const brand = clientId === 'audi' ? 'Audi' : clientId === 'ride-now' ? 'Ride-Now' : 'Volkswagen';
  if (role === 'dealer-singular') return `/${brand}/dealership-singular/${slug}`;
  if (role === 'dealer-emich')    return `/${brand}/dealership-emich/${slug}`; // [FV]
  return `/${brand}/dealership/${slug}`;
}
