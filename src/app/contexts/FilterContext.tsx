import { createContext, useContext, useState, ReactNode } from 'react';
import { FilterState } from '../../data/types/common';

function getDefaultDateRange() {
  const today = new Date();
  const from = new Date(today.getFullYear() - 1, today.getMonth(), 1);
return { dateFrom: from, dateTo: today };
}

const defaultFilters: FilterState = {
  area: null,
  dealershipCode: null,
  ...getDefaultDateRange(),
};

interface FilterContextValue {
  filters: FilterState;
  setArea: (area: string | null) => void;
  setDealership: (code: string | null) => void;
  setDateRange: (from: Date, to: Date) => void;
  resetFilters: () => void;
  /** Lock to a single dealer — hides selectors and pins dealershipCode */
  lockDealership: (code: string) => void;
  /** Unlock — restores free selection */
  unlockDealership: () => void;
  /** True while locked to a single dealer (dealer-singular mode) */
  isLockedDealership: boolean;
}

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [isLockedDealership, setIsLockedDealership] = useState(false);

  return (
    <FilterContext.Provider value={{
      filters,
      // Blocked while locked so the UI can't override the pinned dealer
      setArea:    (area) => { if (isLockedDealership) return; setFilters(f => ({ ...f, area, dealershipCode: null })); },
      setDealership: (code) => { if (isLockedDealership) return; setFilters(f => ({ ...f, dealershipCode: code })); },
      setDateRange: (from, to) => setFilters(f => ({ ...f, dateFrom: from, dateTo: to })),
      resetFilters: () => { setIsLockedDealership(false); setFilters(defaultFilters); },
      lockDealership: (code) => {
        setIsLockedDealership(true);
        setFilters(f => ({ ...f, area: null, dealershipCode: code }));
      },
      unlockDealership: () => {
        setIsLockedDealership(false);
        setFilters(f => ({ ...f, area: null, dealershipCode: null }));
      },
      isLockedDealership,
    }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used inside FilterProvider');
  return ctx;
}
