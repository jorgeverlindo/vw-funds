export interface OverviewRecord {
  month: string;           // "2025-01" ISO
  dealershipCode: string;  // joins to dealerships.json
  area: string;            // denormalized from dealership for fast filtering
  fundType: string;        // "DMF - Media Costs" | "DMF - Hard Costs" | "DMP - Hard Costs"
  accrued: number;
  submitted: number;
  approved: number;
  paid: number;
  pending: number;
  expiringThisMonth: number;
  preApprovalsCount: number;
  claimsCount: number;
}

export interface DealershipRecord {
  code: string;
  name: string;
  city: string;
  state: string;
  area: string;
  region: string;
  active: boolean;
}

export interface FundSplit {
  name: string;
  value: number;
  percent: number;
  color: string;
}

export interface MonthlyChartRow {
  month: string;
  accruals: number;
  submitted: number;
  difference: number;
}

export interface RooftopChartRow {
  name: string;
  value: number;
}

export interface RegionChartRow {
  name: string;
  value: number;
  color: string;
}

export interface SpendCategory {
  category: string;
  value: number;
  percent: number;
  color: string;
}

export interface OverviewKPIs {
  currentBalance: number;
  availableFunds: number;
  projEOYBalance: number;
  expiringThisMonth: number;
  approvedYTD: number;
  avgSubmissionsPerMonth: number;
  pendingInReview: number;
  accrualsYTD: number;
  submittedYTD: number;
  avgAccrualPerMonth: number;
  avgSubmittedPerMonth: number;
  preApprovalsTotal: number;
}

export interface FundSplitViews {
  funds: FundSplit[];
  available: FundSplit[];
  approved: FundSplit[];
  pending: FundSplit[];
  expiring: FundSplit[];
}

// --- Claim phase timings ---
export interface ClaimPhaseRecord {
  claimId: string;
  dealershipCode: string;
  area: string;
  month: string;
  phase1Days: number;
  phase2Days: number;
  phase3Days: number;
}

// --- Payment transactions ---
export interface PaymentTransaction {
  id: string;
  dealershipCode: string;
  area: string;
  month: string;
  submitDate: string;
  paidDate: string | null;
  amount: number;
  status: 'Paid out' | 'Pending' | 'Finished';
}

export interface PaymentRow {
  date: string;
  amount: string;
  datePaid: string;
  status: 'Paid out' | 'Pending' | 'Finished';
}

// --- Contracts ---
export interface ContractRecord {
  id: string;
  dealershipCode: string | null;
  area: string | null;
  value: number;
  mediaCost: number;
  hardCost: number;
  startDate: string;
  expiresDate: string;
}

export interface ContractForDisplay {
  id: string;
  value: number;
  formattedValue: string;
  expiresAt: string;
  expiresDate: Date;
  mediaCost: number;
  hardCost: number;
  mediaCostFormatted: string;
  hardCostFormatted: string;
}

export interface ContractKPIs {
  available: string;
  expiring: string;
  mediaCost: string;
  hardCost: string;
  subtitle: string;
}

export type RangeOption = '3m' | '6m' | '12m';
