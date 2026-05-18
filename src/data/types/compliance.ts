// [FV] Compliance domain types — extracted from WebMonitoringContent.tsx and AppContent.tsx
// so they can be shared across contexts without circular imports.

// ─── WCMItem ─────────────────────────────────────────────────────────────────
// Represents a single web-monitoring compliance infraction row.

export interface WCMItem {
  id: string;
  detectedOn: string;
  dealership: string;
  violationType: string;
  // [FV] how this infraction was detected — automated crawler vs. manually logged by an OEM user
  source: 'Web Monitoring' | 'Manually Added';
  url: string;
  severity: string;
  status: string;
  // [FV] only set when an OEM manually creates an infraction via the Add Infraction flow
  comments?: string;
  screenshotDataUrl?: string;
  // [FV] dealer name when the infraction was reported by a dealership (visible only to OEM)
  reportedBy?: string;
  // ISO timestamp set at creation time — used to sort notifications by recency
  createdAtISO?: string;
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
