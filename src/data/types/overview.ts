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
