/**
 * safeStorage — safe wrappers around localStorage that fail gracefully
 * in SSR environments, Jest, and when storage quota is exceeded.
 */

const isClient = typeof window !== "undefined";

export const safeStorage = {
  get(key: string): string | null {
    if (!isClient) return null;
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key: string, value: string): void {
    if (!isClient) return;
    try { localStorage.setItem(key, value); } catch { /* quota exceeded */ }
  },
  remove(key: string): void {
    if (!isClient) return;
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  },
};
