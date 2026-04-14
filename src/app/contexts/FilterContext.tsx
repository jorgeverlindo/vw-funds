import { createContext, useContext, useState, ReactNode } from 'react';
import { FilterState } from '../../data/types/common';

const defaultFilters: FilterState = {
  area: null,
  dealershipCode: null,
  dateFrom: new Date(2025, 0, 1),
  dateTo: new Date(2025, 11, 31),
};

interface FilterContextValue {
  filters: FilterState;
  setArea: (area: string | null) => void;
  setDealership: (code: string | null) => void;
  setDateRange: (from: Date, to: Date) => void;
  resetFilters: () => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  return (
    <FilterContext.Provider value={{
      filters,
      setArea: (area) => setFilters(f => ({ ...f, area, dealershipCode: null })),
      setDealership: (code) => setFilters(f => ({ ...f, dealershipCode: code })),
      setDateRange: (from, to) => setFilters(f => ({ ...f, dateFrom: from, dateTo: to })),
      resetFilters: () => setFilters(defaultFilters),
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
