export interface ComplianceConfig {
  /** VW = true — Notification Letter itself counts as an infraction on record */
  notificationIsInfraction: boolean;
  /** Days the dealer has to submit an appeal after the Notification Letter is issued */
  appealWindowDays: number;
  /** Days between re-monitoring check-ins */
  reMonitoringCadenceDays: number;
  /** Consecutive clean months before the penalty counter resets */
  counterResetMonths: number;
  /**
   * Months withheld per notification step (index = notificationNumber - 1).
   * 0 = Warning (no financial impact).
   * VW = [0, 1, 3, 6, 2] → total cumulatively 12 months at step 5.
   */
  penaltyLadder: number[];
}

export interface ClientConfig {
  clientId: string;
  brandName: string;
  shortName: string;
  primaryColor: string;
  accentColor: string;
  fundCodePrefix: string;
  preApprovalCodePrefix: string;
  fundTypes: string[];
  userLabel: { dealer: string; oem: string };
  /** Compliance lifecycle config. null = feature disabled for this client. */
  complianceConfig?: ComplianceConfig | null;
}
