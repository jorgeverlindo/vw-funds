import { useMemo } from 'react';
import { useClient } from '../../app/contexts/ClientContext';
import { useFilters } from '../../app/contexts/FilterContext';
import vwDealerships from '../clients/vw/dealerships.json';
import audiDealerships from '../clients/audi/dealerships.json';
import { DealershipRecord } from '../types/overview';

const DEALERSHIP_MAP: Record<string, DealershipRecord[]> = {
  vw: vwDealerships as DealershipRecord[],
  audi: audiDealerships as DealershipRecord[],
};

export interface DealershipOption {
  code: string | null;
  name: string;
}

export function useDealerships() {
  const { client } = useClient();
  const { filters } = useFilters();
  const all = DEALERSHIP_MAP[client.clientId] ?? [];

  const areas = useMemo(
    () => ['All Areas', ...Array.from(new Set(all.map(d => d.area))).sort()],
    [all]
  );

  const dealerships = useMemo<DealershipOption[]>(() => {
    const filtered = filters.area ? all.filter(d => d.area === filters.area) : all;
    return [
      { code: null, name: 'All Dealerships' },
      ...filtered.map(d => ({ code: d.code, name: d.name })),
    ];
  }, [all, filters.area]);

  return { areas, dealerships };
}
