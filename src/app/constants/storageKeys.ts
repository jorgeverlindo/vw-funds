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

  /**
   * Inventory VIN config overrides — maps VIN string → applied AIConfig data.
   * Keyed by raw VIN (e.g. 'JY4AW10XPRA002567'), not internal record id.
   * Written by applyConfig; cleared per-VIN by removeConfig.
   */
  INVENTORY_CONFIG_OVERRIDES: 'constellation_inventory_config_overrides',

  /**
   * User-created Global AI Config records (created via NewGlobalAIConfigContent).
   * Stored as a JSON array; merged with the static AI_CONFIGS seed on read.
   */
  AI_CONFIGS_LIST: 'constellation_ai_configs_list',

  /**
   * Per-VIN AI Generation toggle overrides — maps record id → 'enabled' | 'disabled'.
   * Persisted so Disable/Enable survives page reload without touching the vehicleGroup.
   */
  AI_GENERATION_OVERRIDES: 'constellation_ai_generation_overrides',
} as const;

/** Password used by the PasswordGate component.
 *  Move to import.meta.env.VITE_ACCESS_PASSWORD for stricter security. */
export const ACCESS_PASSWORD = import.meta.env.VITE_ACCESS_PASSWORD ?? 'constellation2026';
