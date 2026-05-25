/**
 * Central registry of all localStorage keys used by the app.
 * Update here when adding or renaming a key — never scatter raw strings.
 */

export const STORAGE_KEYS = {
  /** Password-gate auth token */
  ACCESS: 'constellation_access',

  /** Agent-created and edited projects */
  LOCAL_PROJECTS: 'constellation_local_projects',

  /** Per-project kanban status overrides */
  STATUS_OVERRIDES: 'constellation_status_overrides',

  /** User-defined offer library (custom offers created in the UI) */
  CUSTOM_OFFER_LIBRARY: 'constellation_custom_offer_library',

  /** Agent thread history per-project */
  AGENT_THREADS: 'constellation_agent_threads',

  /**
   * Per-project agent panel state (selected offers, templates, backgrounds).
   * Usage: `STORAGE_KEYS.PROJECT_STATE(projectId)`
   */
  PROJECT_STATE: (projectId: string) => `constellation_proj_state_${projectId}`,
} as const;

/** Password used by the PasswordGate component.
 *  Move to import.meta.env.VITE_ACCESS_PASSWORD for stricter security. */
export const ACCESS_PASSWORD = import.meta.env.VITE_ACCESS_PASSWORD ?? 'constellation2026';
