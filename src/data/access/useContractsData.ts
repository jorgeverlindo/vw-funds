import { useMemo } from 'react';
import { useClient } from '../../app/contexts/ClientContext';
import { useFilters } from '../../app/contexts/FilterContext';
import { useOverviewData } from './useOverviewData';
import vwContracts from '../clients/vw/contracts.json';
import audiContracts from '../clients/audi/contracts.json';
import { ContractRecord, ContractForDisplay, ContractKPIs, RangeOption } from '../types/overview';

const CONTRACT_MAP: Record<string, ContractRecord[]> = {
  vw:   vwContracts   as ContractRecord[],
  audi: audiContracts as ContractRecord[],
};

const fmt = (n: number) => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });

export function useContractsData() {
  const { client } = useClient();
  const { filters } = useFilters();
  const { kpis, spendBreakdown } = useOverviewData();
  const raw = CONTRACT_MAP[client.clientId] ?? [];

  const filtered = useMemo(() =>
    raw.filter(r => {
      // null dealershipCode / area means "applies to all"
      if (r.dealershipCode !== null && filters.dealershipCode && r.dealershipCode !== filters.dealershipCode) return false;
      if (r.area           !== null && filters.area           && r.area           !== filters.area)           return false;
      return true;
    }),
    [raw, filters.area, filters.dealershipCode],
  );

  const contracts = useMemo((): ContractForDisplay[] =>
    filtered.map(r => {
      const d = new Date(r.expiresDate);
      return {
        id:                  r.id,
        value:               r.value,
        formattedValue:      '$' + r.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        expiresAt:           `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`,
        expiresDate:         d,
        mediaCost:           r.mediaCost,
        hardCost:            r.hardCost,
        mediaCostFormatted:  '$' + (r.mediaCost / 1000).toFixed(0) + 'k',
        hardCostFormatted:   '$' + (r.hardCost  / 1000).toFixed(0) + 'k',
      };
    }),
    [filtered],
  );

  // KPI bans: Available + Expiring from useOverviewData (fully filter-reactive).
  // Media/Hard costs from spendBreakdown, scaled per range.
  const mediaSpend = useMemo(() =>
    spendBreakdown.filter(s => s.category.startsWith('MEDIA')).reduce((sum, s) => sum + s.value, 0),
    [spendBreakdown],
  );

  const hardSpend = useMemo(() =>
    spendBreakdown.find(s => s.category === 'HARD')?.value ?? 0,
    [spendBreakdown],
  );

  const contractKpis = useMemo((): Record<RangeOption, ContractKPIs> => ({
    '3m': {
      available: fmt(kpis.availableFunds),
      expiring:  fmt(kpis.expiringThisMonth * 3),
      mediaCost: fmt(mediaSpend * 0.25),
      hardCost:  fmt(hardSpend  * 0.25),
      subtitle:  '3 months',
    },
    '6m': {
      available: fmt(kpis.availableFunds),
      expiring:  fmt(kpis.expiringThisMonth * 6),
      mediaCost: fmt(mediaSpend * 0.5),
      hardCost:  fmt(hardSpend  * 0.5),
      subtitle:  '6 months',
    },
    '12m': {
      available: fmt(kpis.availableFunds),
      expiring:  fmt(kpis.expiringThisMonth * 12),
      mediaCost: fmt(mediaSpend),
      hardCost:  fmt(hardSpend),
      subtitle:  '12 months',
    },
  }), [kpis, mediaSpend, hardSpend]);

  return { contracts, kpis: contractKpis };
}
