export interface VinRecord {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  color: string;
}

export interface VinFilters {
  // ── Multi-select (new) ───────────────────────────────────────────────────────
  // Each field accepts an array of selected values.  When an array is present
  // AND non-empty it takes precedence over the legacy single-value field.
  years?:  (number | string)[];
  makes?:  string[];
  models?: string[];
  trims?:  string[];
  colors?: string[];
  // ── Legacy single-select (kept for backward compatibility) ───────────────────
  year?:  number | string;
  make?:  string;
  model?: string;
  trim?:  string;
  color?: string;
}

export interface PromptEntry {
  id: string;
  category: 'outdoor' | 'oem' | 'racing' | 'adventure' | 'lifestyle' | 'fx';
  title: string;
  description: string;
  prompt: string;
}

// ─── YMMTC / Vehicle Groups ───────────────────────────────────────────────────

/** Fixed set of 6 angle identifiers — order matches Figma (3/4 L, Front, 3/4 R, Right, Rear, Left) */
export type AngleKey = '34l' | 'front' | '34r' | 'right' | 'rear' | 'left';

/**
 * One vehicle / color variant assigned to an AI Config.
 * `angles` holds optional image-src overrides per angle; null → use default placeholder.
 */
export interface VehicleGroup {
  id: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  color: string;
  vin: string;
  source: string;
  thumbnail: string;
  status: 'Active' | 'Inactive';
  /** Generated images (with AI background) — shown in "Generated Image" tab */
  angles: Record<AngleKey, string | null>;
  /** Source cutout images (no background) — shown in "Source" tab of preview modal */
  sourceAngles?: Record<AngleKey, string | null>;
  /**
   * Previous version of each angle image (before last individual edit).
   * Populated when an angle has been re-generated via the Edit flow.
   * Enables the "Previous Version" tab in AnglePreviewModal.
   */
  previousAngles?: Record<AngleKey, string | null>;
  /**
   * Custom display order for the 6 angles — set when user drag-reorders in the
   * DataGrid accordion.  First item is the Hero angle shown in the editor.
   * When absent, falls back to canonical order: 34l, front, 34r, right, left, rear.
   */
  angleOrder?: AngleKey[];
}

// ─────────────────────────────────────────────────────────────────────────────

export interface AIConfigState {
  configName: string;
  backgroundFile: File | null;
  backgroundUrl: string | null;
  vinFilters: VinFilters;
  selectedVin: string | null;
  aiModel: string;
  imageType: string;
  prompt: string;
  productPosition: { x: number; y: number; width: number };
  overlayEnabled: boolean;
  currentAngleIndex: number;
  multiAngleEnabled: boolean;
  viewMode: 'single' | 'grid';
  autoRenderEnabled: boolean;
}
