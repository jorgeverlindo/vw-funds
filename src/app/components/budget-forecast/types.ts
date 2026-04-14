export type RangeOption = "3m" | "6m" | "12m";

export interface ContractData {
  id: string;
  value: string;
  expiryDate: string; // ISO format or just string like "1/15/2026"
  numericValue: number; // For calculations if needed, though prompt says explicit values
  startDate: string; // To calculate bar start
}

export interface KpiData {
  available: string;
  expiring: string;
  mediaCost: string;
  hardCost: string;
}

export interface MonthData {
  month: string; // "Jan '26"
  year: number;
  monthIndex: number; // 0-11
}
