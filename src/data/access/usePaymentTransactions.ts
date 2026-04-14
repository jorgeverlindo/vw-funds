import { useMemo } from 'react';
import { useClient } from '../../app/contexts/ClientContext';
import { useFilters } from '../../app/contexts/FilterContext';
import vwTransactions from '../clients/vw/payment-transactions.json';
import audiTransactions from '../clients/audi/payment-transactions.json';
import { PaymentTransaction, PaymentRow } from '../types/overview';

const TX_MAP: Record<string, PaymentTransaction[]> = {
  vw:   vwTransactions   as PaymentTransaction[],
  audi: audiTransactions as PaymentTransaction[],
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatSubmitDate(iso: string): string {
  const [, mm, dd] = iso.split('-');
  const month = MONTH_NAMES[parseInt(mm, 10) - 1];
  const day   = parseInt(dd, 10);
  const year  = iso.slice(0, 4);
  return `${month} ${day}, ${year}`;
}

function formatPaidDate(iso: string): string {
  const [year, mm, dd] = iso.split('-');
  return `${mm}/${dd}/${year}`;
}

export function usePaymentTransactions() {
  const { client } = useClient();
  const { filters } = useFilters();
  const raw = TX_MAP[client.clientId] ?? [];

  const rows = useMemo((): PaymentRow[] => {
    const filtered = raw.filter(r => {
      const [ry, rm] = r.month.split('-').map(Number);
      const rowDate = new Date(ry, rm - 1, 1);
      if (rowDate < filters.dateFrom || rowDate > filters.dateTo) return false;
      if (filters.area           && r.area           !== filters.area)           return false;
      if (filters.dealershipCode && r.dealershipCode !== filters.dealershipCode) return false;
      return true;
    });

    return filtered
      .sort((a, b) => b.submitDate.localeCompare(a.submitDate))
      .map(r => ({
        date:     formatSubmitDate(r.submitDate),
        amount:   '$' + r.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        datePaid: r.paidDate ? formatPaidDate(r.paidDate) : '—',
        status:   r.status,
      }));
  }, [raw, filters]);

  return { rows };
}
