// [FV] Compliance domain types — extracted from WebMonitoringContent.tsx and AppContent.tsx
// so they can be shared across contexts without circular imports.

// ─── WCMLifecycleStatus ───────────────────────────────────────────────────────
// Official VW DMP lifecycle states. Use these values in lifecycleStatus — NOT in
// the legacy `status` field (kept for backward compat with existing static rows).

export type WCMLifecycleStatus =
  | 'DETECTED'
  | 'IN_REVIEW'
  | 'NOTIFIED'
  | 'REMEDIATION_PENDING'
  | 'RE_MONITORING'
  | 'DISMISSED'
  | 'CURED'
  | 'APPEAL_GRANTED'
  | 'APPEAL_DENIED'
  | 'ESCALATED';

// ─── LifecycleEvent ───────────────────────────────────────────────────────────
// A single entry in the Case timeline — every state transition is recorded.

export interface LifecycleEvent {
  id: string;
  timestampISO: string;
  actor: string;           // display name of the user who triggered the event
  actorRole: 'oem' | 'dealer';
  type: WCMLifecycleStatus | 'APPEAL_SUBMITTED' | 'FINDING_UPDATED' | 'NOTE_ADDED' | 'SOLUTION_SUBMITTED';
  label: string;           // human-readable description shown in timeline
}

// ─── StoredPin ────────────────────────────────────────────────────────────────
// Annotation pin returned by Claude Vision for scan-generated items.
// x/y are % of the screenshot's original dimensions (0–100).

export interface StoredPin {
  title: string;
  description: string;
  x: number;
  y: number;
  direction: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  category: 'A' | 'B';  // DMP category per VW Guidelines
  ruleNumber: string;    // e.g. "3B" extracted from ruleCode "CAT-A-3B"
  // canonical: findingStatus — per-Finding confirmation state for the IN_REVIEW step
  findingStatus?: 'confirmed' | 'rejected' | 'pending';
}

// ─── WCMItem ─────────────────────────────────────────────────────────────────
// Represents a single web-monitoring compliance Case (VW DMP terminology).
// Legacy `status` field kept for backward compat with static WCM_DATA rows.
// New lifecycle uses `lifecycleStatus` (WCMLifecycleStatus union) — the UI
// prefers lifecycleStatus when present and falls back to status.

export interface WCMItem {
  id: string;
  detectedOn: string;
  dealership: string;
  violationType: string;
  // [FV] how this infraction was detected — automated crawler vs. manually logged by an OEM user
  source: 'Web Monitoring' | 'Manually Added';
  url: string;
  severity: string;
  // legacy status string — kept for backward compat. Prefer lifecycleStatus for new items.
  status: string;
  // [FV] only set when an OEM manually creates an infraction via the Add Infraction flow
  comments?: string;
  screenshotDataUrl?: string;
  // SHA-256 hash of the screenshot — used to fetch from server cache by hash
  // Preferred over screenshotDataUrl (avoids stale client-side storage issues)
  screenshotHash?: string;
  // [FV] dealer name when the infraction was reported by a dealership (visible only to OEM)
  reportedBy?: string;
  // ISO timestamp set at creation time — used to sort notifications by recency
  createdAtISO?: string;
  // [FV] annotation pins set by Claude Vision for scan items; drives InteractiveAnnotation
  pins?: StoredPin[];
  // channel where the violation was detected
  channel?: 'website' | 'metaAds';

  // ── VW DMP Lifecycle fields (all optional — absent on legacy static rows) ──

  // Official lifecycle state. Preferred over `status` when present.
  lifecycleStatus?: WCMLifecycleStatus;

  // Derived case category: 'A' if any confirmed finding is Cat-A, else 'B'.
  // Set when Notification Letter is issued. Do NOT store if no letter issued.
  caseCategory?: 'A' | 'B';

  // How many Notification Letters have been issued for this dealership (penalty counter).
  // canonical: notificationNumber — VW DMP "Notification 1–5"
  notificationNumber?: number;

  // ISO timestamp when the Notification Letter was issued.
  notifiedAt?: string;

  // ISO timestamp deadline for the dealer to submit an appeal (notifiedAt + appealWindowDays).
  appealDeadline?: string;

  // canonical: appealStatus — tracks dealer's appeal submission + OEM decision.
  appealStatus?: 'submitted' | 'granted' | 'denied' | null;

  // ISO timestamp when the dealer submitted an appeal.
  appealSubmittedAt?: string;

  // canonical: penaltyStep — 0-based index into complianceConfig.penaltyLadder.
  penaltyStep?: number;

  // ISO string of the month (YYYY-MM) when withholding begins, if applicable.
  penaltyStartMonth?: string;

  // Whether the dealer is ineligible for VW Awards this year.
  awardsIneligible?: boolean;

  // ISO timestamp of the most recent re-monitoring check-in.
  lastReMonitoredAt?: string;

  // Chronological log of lifecycle transitions shown in the timeline.
  lifecycleHistory?: LifecycleEvent[];
}

// ─── CaseSolution ─────────────────────────────────────────────────────────────
// Submitted by a dealer in response to an infraction; stored in ComplianceContext.

export interface CaseSolution {
  screenshotDataUrl: string;
  comment: string;
  submittedBy: string;
  submittedAtISO: string;
  solved?: boolean;
  solvedAtISO?: string;
}

// ─── WCMComment ───────────────────────────────────────────────────────────────
// A single message in the OEM ↔ dealer discussion thread on a compliance case.

export interface WCMComment {
  id: string;
  author: string;
  role: 'oem' | 'dealer';
  text: string;
  timestampISO: string;
}
