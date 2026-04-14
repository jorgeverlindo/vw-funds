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
};
