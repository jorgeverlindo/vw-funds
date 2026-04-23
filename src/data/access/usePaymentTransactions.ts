import { useMemo } from 'react';
import { useClient } from '../../app/contexts/ClientContext';
import { useFilters } from '../../app/contexts/FilterContext';
import { useWorkflow, WORKFLOW_DEALER } from '../../app/contexts/WorkflowContext';
import { CLAIMS_MOCK_DATA } from '../../app/components/FundsClaimsContent';
import audiTransactions from '../clients/audi/payment-transactions.json';
import { Claim } from '../../app/components/ClaimsPanel';
import { ClaimStatus } from '../../app/components/StatusChip';
import { PaymentTransaction, PaymentRow } from '../types/overview';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(d: Date): string {
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatPaidShort(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${d.getFullYear()}`;
}

// Deterministic 0-based "days to pay" for a claim — keeps the demo stable.
function paymentLagDays(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return 3 + (h % 9); // 3–11 days
}

// Maps claim status to payment row status for the Payment Status table.
function paymentStatusFor(s: ClaimStatus): 'Paid out' | 'Pending' | 'Finished' {
  if (s === 'Approved' || s === 'Paid') return 'Paid out';
  return 'Pending';
}

function claimToPaymentRow(c: Claim): PaymentRow {
  const submitted = c.date;
  const isPaid = c.status === 'Approved' || c.status === 'Paid';
  const paidDate = isPaid
    ? new Date(submitted.getTime() + paymentLagDays(c.id) * 86400000)
    : null;
  return {
    id:       c.id,
    date:     formatDate(submitted),
    amount:   '$' + c.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    datePaid: paidDate ? formatPaidShort(paidDate) : '—',
    status:   paymentStatusFor(c.status),
  };
}

// Parses "MM/DD/YYYY" back to a Date for sorting; "—" returns null.
function parsePaid(p: string): Date | null {
  if (p === '—') return null;
  const [mm, dd, yyyy] = p.split('/').map(Number);
  return new Date(yyyy, mm - 1, dd);
}

export function usePaymentTransactions() {
  const { client } = useClient();
  const { filters } = useFilters();
  const { workflow } = useWorkflow();

  const rows = useMemo((): PaymentRow[] => {
    // Audi still reads from static JSON (no demo claims wired up)
    if (client.clientId !== 'vw') {
      const raw = audiTransactions as PaymentTransaction[];
      return raw
        .filter(r => {
          const [ry, rm] = r.month.split('-').map(Number);
          const rowDate = new Date(ry, rm - 1, 1);
          if (rowDate < filters.dateFrom || rowDate > filters.dateTo) return false;
          if (filters.area           && r.area           !== filters.area)           return false;
          if (filters.dealershipCode && r.dealershipCode !== filters.dealershipCode) return false;
          return true;
        })
        .sort((a, b) => (b.paidDate ?? '').localeCompare(a.paidDate ?? ''))
        .map(r => ({
          id:       r.id,
          date:     formatDate(new Date(r.submitDate)),
          amount:   '$' + r.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          datePaid: r.paidDate ? formatPaidShort(new Date(r.paidDate)) : '—',
          status:   r.status,
        }));
    }

    // VW path — mirror the Claims tab (mock claims + active workflow + archived cycles).
    // Dealer filter still applies; date range is intentionally ignored so the table
    // stays in sync with what the Claims tab shows regardless of the Overview range.
    const filteredMock = CLAIMS_MOCK_DATA.filter(c => {
      if (filters.dealershipCode && c.dealershipCode !== filters.dealershipCode) return false;
      return true;
    });

    const all: PaymentRow[] = filteredMock.map(claimToPaymentRow);

    // Active workflow claim — included once the dealer has created a claim
    const wfClaim = workflow.claim;
    if (wfClaim.status !== null) {
      const passesDealerFilter =
        !filters.dealershipCode || filters.dealershipCode === WORKFLOW_DEALER.code;
      if (passesDealerFilter) {
        const submitted = wfClaim.submittedAt ? new Date(wfClaim.submittedAt) : new Date();
        const isPaid = wfClaim.status === 'Paid';
        const paidDate = isPaid ? new Date() : null;
        all.unshift({
          id:       wfClaim.id,
          date:     formatDate(submitted),
          amount:   '$' + workflow.preApproval.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          datePaid: paidDate ? formatPaidShort(paidDate) : '—',
          status:   isPaid ? 'Paid out' : 'Pending',
        });
      }
    }

    // Archived cycles — each completed PA → Claim cycle shows up too
    workflow.archivedCycles.forEach(cycle => {
      const cl = cycle.claim;
      const passesDealerFilter =
        !filters.dealershipCode || filters.dealershipCode === WORKFLOW_DEALER.code;
      if (!passesDealerFilter) return;
      const submitted = cl.submittedAt ? new Date(cl.submittedAt) : new Date(cycle.archivedAt);
      const isPaid = cl.status === 'Paid';
      const paidDate = isPaid ? new Date(cycle.archivedAt) : null;
      all.push({
        id:       cl.id,
        date:     formatDate(submitted),
        amount:   '$' + cycle.preApproval.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        datePaid: paidDate ? formatPaidShort(paidDate) : '—',
        status:   isPaid ? 'Paid out' : 'Pending',
      });
    });

    // Sort by datePaid desc (rows without a paid date drop to the bottom)
    return all.sort((a, b) => {
      const ap = parsePaid(a.datePaid);
      const bp = parsePaid(b.datePaid);
      if (ap && bp) return bp.getTime() - ap.getTime();
      if (ap && !bp) return -1;
      if (!ap && bp) return 1;
      return 0;
    });
  }, [filters, workflow.claim, workflow.preApproval, workflow.archivedCycles, client.clientId]);

  return { rows };
}
