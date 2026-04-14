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
}
