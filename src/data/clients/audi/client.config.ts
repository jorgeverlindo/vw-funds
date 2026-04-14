import { ClientConfig } from '../../types/client';

export const audiConfig: ClientConfig = {
  clientId: 'audi',
  brandName: 'Audi',
  shortName: 'Audi',
  primaryColor: '#BB0A14',
  accentColor: '#6050E0',
  fundCodePrefix: 'AFC',
  preApprovalCodePrefix: 'AFA',
  fundTypes: ['AoA - Media Costs', 'AoA - Hard Costs', 'AoA - Events'],
  userLabel: { dealer: 'Dealer', oem: 'AoA' },
};
