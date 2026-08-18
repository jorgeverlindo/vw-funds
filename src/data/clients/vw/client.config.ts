import { ClientConfig } from '../../types/client';

export const vwConfig: ClientConfig = {
  clientId: 'vw',
  brandName: 'Volkswagen',
  shortName: 'VW',
  primaryColor: '#001E50',
  accentColor: '#6050E0',
  fundCodePrefix: 'MFC',
  preApprovalCodePrefix: 'MFA',
  fundTypes: ['DMF - Media Costs', 'DMF - Hard Costs', 'DMP - Hard Costs'],
  userLabel: { dealer: 'Dealer', oem: 'OEM' },
  complianceConfig: {
    notificationIsInfraction: true,
    appealWindowDays: 30,
    reMonitoringCadenceDays: 10,
    counterResetMonths: 6,
    penaltyLadder: [0, 1, 3, 6, 2],
  },
};
