import type { ClientConfig } from '../../types/client';

export const rideNowConfig: ClientConfig = {
  clientId: 'ride-now',
  brandName: 'Ride Now',
  shortName: 'RN',
  primaryColor: '#0A1D3C',
  accentColor: '#E60012',
  fundCodePrefix: 'RNF',
  preApprovalCodePrefix: 'RNA',
  fundTypes: ['DMF - Media Costs', 'DMF - Hard Costs', 'DMP - Hard Costs'],
  userLabel: { dealer: 'Dealer', oem: 'OEM' },
};
