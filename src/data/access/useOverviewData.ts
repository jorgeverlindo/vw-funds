import { useMemo } from 'react';
import { useClient } from '../../app/contexts/ClientContext';
import { useFilters } from '../../app/contexts/FilterContext';
import vwOverview from '../clients/vw/overview.json';
import audiOverview from '../clients/audi/overview.json';
import {
  OverviewRecord, OverviewKPIs, MonthlyChartRow,
  RooftopChartRow, RegionChartRow, SpendCategory,
  FundSplit, FundSplitViews,
} from '../types/overview';
import vwDealerships from '../clients/vw/dealerships.json';
import audiDealerships from '../clients/audi/dealerships.json';

const OVERVIEW_MAP: Record<string, OverviewRecord[]> = {
  vw: vwOverview as OverviewRecord[],
  audi: audiOverview as OverviewRecord[],
};

const DEALERSHIP_NAMES: Record<string, Record<string, string>> = {
  vw: Object.fromEntries((vwDealerships as { code: string; name: string }[]).map(d => [d.code, d.name])),
  audi: Object.fromEntries((audiDealerships as { code: string; name: string }[]).map(d => [d.code, d.name])),
};

// Maps fundType → spend category
const FUND_TO_SPEND: Record<string, { category: string; color: string }> = {
  // VW fund types
  'DMF - Media Costs': { category: 'MEDIA - OTHER', color: '#A8A8F8' },
  'DMP - Hard Costs':  { category: 'MEDIA - CPO',   color: '#6050E0' },
  'DMF - Hard Costs':  { category: 'HARD',           color: 'rgba(247, 134, 100, 0.9)' },
  // Audi fund types
  'AoA - Media Costs': { category: 'MEDIA',          color: '#BB0A14' },
  'AoA - Hard Costs':  { category: 'HARD',           color: 'rgba(187, 10, 20, 0.6)' },
  'AoA - Events':      { category: 'EVENTS',         color: '#888888' },
};

// Fund type colors for pie chart
const FUND_COLORS: Record<string, string> = {
  // VW fund types
  'DMF - Media Costs': '#6050E0',
  'DMF - Hard Costs':  'rgba(247, 134, 100, 0.9)',
  'DMP - Hard Costs':  '#51B994',
  // Audi fund types
  'AoA - Media Costs': '#BB0A14',
  'AoA - Hard Costs':  'rgba(187, 10, 20, 0.6)',
  'AoA - Events':      '#888888',
};

// Region colors
const REGION_COLORS: Record<string, string> = {
  Northeast:     '#6050E0',
  Southeast:     '#FF7F50',
  Midwest:       '#51B994',
  West:          '#2196F3',
  'South Central': '#FFC107',
};

function computeFundSplits(
  byType: Record<string, { accrued: number; available: number; approved: number; pending: number; expiring: number }>
): FundSplitViews {
  const compute = (key: 'accrued' | 'available' | 'approved' | 'pending' | 'expiring'): FundSplit[] => {
    const entries = Object.entries(byType);
    const total = entries.reduce((s, [, v]) => s + v[key], 0) || 1;
    return entries.map(([name, vals]) => ({
      name,
      value: vals[key],
      percent: Math.round((vals[key] / total) * 10000) / 100,
      color: FUND_COLORS[name] ?? '#6050E0',
    }));
  };
  return {
    funds: compute('accrued'),
    available: compute('available'),
    approved: compute('approved'),
    pending: compute('pending'),
    expiring: compute('expiring'),
  };
}

export function useOverviewData() {
  const { client } = useClient();
  const { filters } = useFilters();
  const raw = OVERVIEW_MAP[client.clientId] ?? [];
  const dealerNames = DEALERSHIP_NAMES[client.clientId] ?? {};

  const filtered = useMemo(() => {
    return raw.filter(row => {
      const [ry, rm] = row.month.split('-').map(Number);
      const rowDate = new Date(ry, rm - 1, 1);
      if (rowDate < filters.dateFrom || rowDate > filters.dateTo) return false;
      if (filters.area && row.area !== filters.area) return false;
      if (filters.dealershipCode && row.dealershipCode !== filters.dealershipCode) return false;
      return true;
    });
  }, [raw, filters]);

  const kpis = useMemo((): OverviewKPIs => {
    if (filtered.length === 0) {
      return {
        currentBalance: 0, availableFunds: 0, projEOYBalance: 0,
        expiringThisMonth: 0, approvedYTD: 0, avgSubmissionsPerMonth: 0,
        pendingInReview: 0, accrualsYTD: 0, submittedYTD: 0,
        avgAccrualPerMonth: 0, avgSubmittedPerMonth: 0, preApprovalsTotal: 0,
      };
    }
    const months = new Set(filtered.map(r => r.month)).size || 1;
    const lastMonth = Array.from(new Set(filtered.map(r => r.month))).sort().at(-1) ?? '';

    const accrualsYTD    = filtered.reduce((s, r) => s + r.accrued, 0);
    const submittedYTD   = filtered.reduce((s, r) => s + r.submitted, 0);
    const approvedYTD    = filtered.reduce((s, r) => s + r.approved, 0);
    const paidYTD        = filtered.reduce((s, r) => s + r.paid, 0);
    const pendingInReview = filtered.reduce((s, r) => s + r.pending, 0);
    const expiringThisMonth = filtered
      .filter(r => r.month === lastMonth)
      .reduce((s, r) => s + r.expiringThisMonth, 0);
    const preApprovalsTotal = filtered.reduce((s, r) => s + r.preApprovalsCount, 0);

    return {
      currentBalance:        accrualsYTD - paidYTD,
      availableFunds:        accrualsYTD - submittedYTD,
      projEOYBalance:        Math.round((accrualsYTD - submittedYTD) * 0.14),
      expiringThisMonth,
      approvedYTD,
      avgSubmissionsPerMonth: Math.round(submittedYTD / months),
      pendingInReview,
      accrualsYTD,
      submittedYTD,
      avgAccrualPerMonth:    Math.round(accrualsYTD / months),
      avgSubmittedPerMonth:  Math.round(submittedYTD / months),
      preApprovalsTotal,
    };
  }, [filtered]);

  const monthlyChart = useMemo((): MonthlyChartRow[] => {
    const byMonth: Record<string, { accrued: number; submitted: number }> = {};
    filtered.forEach(row => {
      if (!byMonth[row.month]) byMonth[row.month] = { accrued: 0, submitted: 0 };
      byMonth[row.month].accrued   += row.accrued;
      byMonth[row.month].submitted += row.submitted;
    });
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, vals]) => ({
        month: new Date(month + '-01').toLocaleString('en-US', { month: 'short', year: '2-digit' }),
        accruals:   vals.accrued,
        submitted:  vals.submitted,
        difference: vals.accrued - vals.submitted,
      }));
  }, [filtered]);

  const rooftopChart = useMemo((): RooftopChartRow[] => {
    const byDealer: Record<string, number> = {};
    filtered.forEach(row => {
      byDealer[row.dealershipCode] = (byDealer[row.dealershipCode] ?? 0) + row.accrued;
    });
    return Object.entries(byDealer)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([code, value]) => ({ name: dealerNames[code] ?? code, value }));
  }, [filtered, dealerNames]);

  const claimsRooftopChart = useMemo((): RooftopChartRow[] => {
    const byDealer: Record<string, number> = {};
    filtered.forEach(row => {
      byDealer[row.dealershipCode] = (byDealer[row.dealershipCode] ?? 0) + row.claimsCount;
    });
    return Object.entries(byDealer)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([code, value]) => ({ name: dealerNames[code] ?? code, value }));
  }, [filtered, dealerNames]);

  const regionChart = useMemo((): RegionChartRow[] => {
    const byRegion: Record<string, number> = {};
    filtered.forEach(row => {
      byRegion[row.area] = (byRegion[row.area] ?? 0) + row.accrued;
    });
    return Object.entries(byRegion)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value, color: REGION_COLORS[name] ?? '#9CA3AF' }));
  }, [filtered]);

  const fundSplitViews = useMemo((): FundSplitViews => {
    const byType: Record<string, { accrued: number; available: number; approved: number; pending: number; expiring: number }> = {};
    filtered.forEach(row => {
      if (!byType[row.fundType]) byType[row.fundType] = { accrued: 0, available: 0, approved: 0, pending: 0, expiring: 0 };
      byType[row.fundType].accrued   += row.accrued;
      byType[row.fundType].available += Math.max(0, row.accrued - row.submitted);
      byType[row.fundType].approved  += row.approved;
      byType[row.fundType].pending   += row.pending;
      byType[row.fundType].expiring  += row.expiringThisMonth;
    });
    return computeFundSplits(byType);
  }, [filtered]);

  const utilizationData = useMemo(() => {
    const reimbursed = filtered.reduce((s, r) => s + r.paid, 0);
    const available  = filtered.reduce((s, r) => s + Math.max(0, r.accrued - r.submitted), 0);
    const total = reimbursed + available || 1;
    return {
      available,
      reimbursed,
      total,
      availablePercent:  Math.round((available  / total) * 10000) / 100,
      reimbursedPercent: Math.round((reimbursed / total) * 10000) / 100,
    };
  }, [filtered]);

  const spendBreakdown = useMemo((): SpendCategory[] => {
    const byCategory: Record<string, { value: number; color: string }> = {};
    filtered.forEach(row => {
      const mapping = FUND_TO_SPEND[row.fundType];
      if (!mapping) return;
      if (!byCategory[mapping.category]) byCategory[mapping.category] = { value: 0, color: mapping.color };
      byCategory[mapping.category].value += row.accrued;
    });
    const total = Object.values(byCategory).reduce((s, v) => s + v.value, 0) || 1;
    return Object.entries(byCategory).map(([category, { value, color }]) => ({
      category,
      value,
      percent: Math.round((value / total) * 10000) / 100,
      color,
    }));
  }, [filtered]);

  // Pre-approval status breakdown using fixed ratios (derived from industry norms)
  const preApprovalStats = useMemo(() => {
    const total = kpis.preApprovalsTotal;
    return [
      { name: 'Approved',           value: Math.round(total * 0.86),   percent: 86.01, color: '#51B994' },
      { name: 'Declined',           value: Math.round(total * 0.12),   percent: 11.56, color: 'rgba(247, 134, 100, 0.9)' },
      { name: 'Revision Requested', value: Math.round(total * 0.012),  percent: 1.19,  color: '#2F2673' },
      { name: 'Pending',            value: Math.round(total * 0.008),  percent: 0.29,  color: '#A8A8F8' },
    ];
  }, [kpis.preApprovalsTotal]);

  return {
    kpis,
    monthlyChart,
    rooftopChart,
    claimsRooftopChart,
    regionChart,
    fundSplitViews,
    utilizationData,
    spendBreakdown,
    preApprovalStats,
  };
}
