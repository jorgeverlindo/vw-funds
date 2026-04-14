import { useMemo } from 'react';
import { useClient } from '../../app/contexts/ClientContext';
import { useFilters } from '../../app/contexts/FilterContext';
import vwPhases from '../clients/vw/claim-phase-timings.json';
import audiPhases from '../clients/audi/claim-phase-timings.json';
import vwDealerships from '../clients/vw/dealerships.json';
import audiDealerships from '../clients/audi/dealerships.json';
import { ClaimPhaseRecord, DealershipRecord } from '../types/overview';

const PHASE_MAP: Record<string, ClaimPhaseRecord[]> = {
  vw: vwPhases as ClaimPhaseRecord[],
  audi: audiPhases as ClaimPhaseRecord[],
};

const DEALER_NAMES: Record<string, Record<string, string>> = {
  vw:   Object.fromEntries((vwDealerships   as DealershipRecord[]).map(d => [d.code, d.name])),
  audi: Object.fromEntries((audiDealerships as DealershipRecord[]).map(d => [d.code, d.name])),
};

export function useClaimPhaseData() {
  const { client } = useClient();
  const { filters } = useFilters();
  const raw        = PHASE_MAP[client.clientId] ?? [];
  const dealerNames = DEALER_NAMES[client.clientId] ?? {};

  const filtered = useMemo(() =>
    raw.filter(r => {
      const [ry, rm] = r.month.split('-').map(Number);
      const rowDate = new Date(ry, rm - 1, 1);
      if (rowDate < filters.dateFrom || rowDate > filters.dateTo) return false;
      if (filters.area           && r.area           !== filters.area)           return false;
      if (filters.dealershipCode && r.dealershipCode !== filters.dealershipCode) return false;
      return true;
    }),
    [raw, filters],
  );

  // claim phase = phase2Days (Pre-Approval → Final Approval)
  const claimTimings = useMemo(() =>
    [...filtered]
      .map(r => ({ id: r.claimId, days: r.phase2Days }))
      .sort((a, b) => b.days - a.days),
    [filtered],
  );

  // payment phase = phase3Days (Final Approval → Payment)
  const paymentTimings = useMemo(() =>
    [...filtered]
      .map(r => ({ id: r.claimId, days: r.phase3Days }))
      .sort((a, b) => b.days - a.days),
    [filtered],
  );

  const claimAverage = useMemo(() => {
    if (filtered.length === 0) return 0;
    const sum = filtered.reduce((s, r) => s + r.phase2Days, 0);
    return Math.round((sum / filtered.length) * 10) / 10;
  }, [filtered]);

  const paymentAverage = useMemo(() => {
    if (filtered.length === 0) return 0;
    const sum = filtered.reduce((s, r) => s + r.phase3Days, 0);
    return Math.round((sum / filtered.length) * 10) / 10;
  }, [filtered]);

  // Per-dealer averages for SubmissionPhaseStackedBarCard + LongestPaymentTimeCard
  const submissionPhases = useMemo(() => {
    const byDealer: Record<string, { p1: number; p2: number; p3: number; count: number }> = {};
    filtered.forEach(r => {
      if (!byDealer[r.dealershipCode]) byDealer[r.dealershipCode] = { p1: 0, p2: 0, p3: 0, count: 0 };
      byDealer[r.dealershipCode].p1    += r.phase1Days;
      byDealer[r.dealershipCode].p2    += r.phase2Days;
      byDealer[r.dealershipCode].p3    += r.phase3Days;
      byDealer[r.dealershipCode].count += 1;
    });

    const rows = Object.entries(byDealer)
      .map(([code, v]) => ({
        name:                           dealerNames[code] ?? code,
        'Submission → Pre-Approval':    Math.round(v.p1 / v.count),
        'Pre-Approval → Final Approval': Math.round(v.p2 / v.count),
        'Final Approval → Payment':     Math.round(v.p3 / v.count),
      }))
      .sort((a, b) =>
        (b['Submission → Pre-Approval'] + b['Pre-Approval → Final Approval'] + b['Final Approval → Payment']) -
        (a['Submission → Pre-Approval'] + a['Pre-Approval → Final Approval'] + a['Final Approval → Payment'])
      );

    if (rows.length === 0) return [];

    const avg = (key: 'Submission → Pre-Approval' | 'Pre-Approval → Final Approval' | 'Final Approval → Payment') =>
      Math.round(rows.reduce((s, r) => s + r[key], 0) / rows.length);

    const benchmark = {
      name:                           'Benchmark',
      'Submission → Pre-Approval':    avg('Submission → Pre-Approval'),
      'Pre-Approval → Final Approval': avg('Pre-Approval → Final Approval'),
      'Final Approval → Payment':     avg('Final Approval → Payment'),
    };

    return [...rows, benchmark];
  }, [filtered, dealerNames]);

  return { claimTimings, paymentTimings, claimAverage, paymentAverage, submissionPhases };
}
