import rawClaims from '../../../data/clients/vw/claim-phase-timings.json';
import rawOverview from '../../../data/clients/vw/overview.json';
import { ReportCover } from '../components/ReportCover';
import { ReportPage } from '../components/ReportPage';
import { SectionTag, SectionTitle, Em, Lead, Body, SubHead, KpiGrid, ForecastTable, StatStrip, Callout, Divider, BarChartSvg, Legend, EndMarker } from '../components/Primitives';
import { fmtUSD, fmtPct, groupSum, sortedEntries, dealerName, barWidth } from '../utils';
import { C } from '../tokens';

const TITLE = 'VW Claim Submission Report';
const PERIOD = "Apr '25 — Apr '26";

export function ClaimSubmissionReport() {
  const n = rawClaims.length;

  // ── Phase averages ──────────────────────────────────────────────────────────
  const avgP1 = rawClaims.reduce((s, c) => s + c.phase1Days, 0) / n;
  const avgP2 = rawClaims.reduce((s, c) => s + c.phase2Days, 0) / n;
  const avgP3 = rawClaims.reduce((s, c) => s + c.phase3Days, 0) / n;
  const avgTotal = avgP1 + avgP2 + avgP3;

  // ── Total claims from overview ──────────────────────────────────────────────
  const totalClaimsCount = rawOverview.reduce((s, r) => s + r.claimsCount, 0);

  // ── By dealer — top 12 ─────────────────────────────────────────────────────
  const byDealer: Record<string, { count: number; p1: number; p2: number; p3: number }> = {};
  for (const c of rawClaims) {
    if (!byDealer[c.dealershipCode]) byDealer[c.dealershipCode] = { count: 0, p1: 0, p2: 0, p3: 0 };
    byDealer[c.dealershipCode].count++;
    byDealer[c.dealershipCode].p1 += c.phase1Days;
    byDealer[c.dealershipCode].p2 += c.phase2Days;
    byDealer[c.dealershipCode].p3 += c.phase3Days;
  }

  const dealerRows = Object.entries(byDealer)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 12)
    .map(([code, v]) => {
      const avgDays = (v.p1 + v.p2 + v.p3) / v.count;
      return { code, count: v.count, avgDays };
    });

  const maxCount = dealerRows[0]?.count ?? 1;
  const forecastRows = dealerRows.map(r => ({
    id:       r.code,
    label:    dealerName(r.code),
    amount:   `${r.avgDays.toFixed(1)}d avg`,
    barWidth: barWidth(r.count, maxCount, 140),
  }));

  // ── Monthly claim count ─────────────────────────────────────────────────────
  const monthMap: Record<string, number> = {};
  for (const c of rawClaims) {
    monthMap[c.month] = (monthMap[c.month] ?? 0) + 1;
  }
  const months = Object.keys(monthMap).sort().slice(-10);
  const monthLabels = months.map(m => {
    const [, mo] = m.split('-');
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+mo - 1];
  });
  const countVals = months.map(m => monthMap[m] ?? 0);

  // ── By area ─────────────────────────────────────────────────────────────────
  const areaMap = groupSum(rawClaims as Record<string, unknown>[], 'area', ['phase1Days', 'phase2Days', 'phase3Days']);
  const areaCounts: Record<string, number> = {};
  for (const c of rawClaims) {
    areaCounts[c.area] = (areaCounts[c.area] ?? 0) + 1;
  }
  const areaTop3 = Object.entries(areaCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const statItems = areaTop3.map(([area, count]) => ({ num: String(count), label: area }));

  return (
    <div>
      <ReportCover
        title={['Claim', 'Submission', 'report.']}
        subtitle="A detailed view of claim volume, phase-by-phase processing timelines, and dealer-level submission performance across the Volkswagen network."
        docTag="AI · Submission Report"
      />

      {/* Page 1 — KPIs */}
      <ReportPage reportTitle={TITLE} period={PERIOD} pageNum={2}>
        <SectionTag num="01" label="Submission Overview" />
        <SectionTitle>Processing time across <Em>every phase</Em>.</SectionTitle>

        <Lead>
          Your VW network processed <strong style={{ color: C.text }}>{n} claims</strong> across the reporting window, with an average total cycle of{' '}
          <strong style={{ color: C.text }}>{avgTotal.toFixed(1)} days</strong> from submission to payment. Phase 1 (submission to pre-approval) is the longest at{' '}
          <strong style={{ color: C.text }}>{avgP1.toFixed(1)} days</strong>.
        </Lead>

        <KpiGrid items={[
          { label: 'Claims Processed',    value: String(n),              delta: 'In timing dataset',        accent: true },
          { label: 'Avg Phase 1 (Submit → Pre-Approval)', value: `${avgP1.toFixed(1)}d`, delta: 'Submission to pre-approval' },
          { label: 'Avg Phase 2 (Pre-App → Final)',       value: `${avgP2.toFixed(1)}d`, delta: 'Pre-approval to final' },
          { label: 'Avg Phase 3 (Final → Payment)',       value: `${avgP3.toFixed(1)}d`, delta: 'Final approval to payment' },
        ]} />

        <Divider />

        <SubHead style={{ marginTop: 0 }}>What the phases mean</SubHead>
        <Body style={{ maxWidth: '620px' }}>
          Phase 1 captures the time from when a dealer submits a claim until it clears pre-approval review. Phase 2 covers the internal final approval step. Phase 3 is the payment lag — from approval decision to funds hitting the dealer's account.
          The biggest lever for reducing total cycle time is <strong style={{ color: C.text }}>Phase 1</strong>, which accounts for <strong style={{ color: C.text }}>{fmtPct((avgP1 / avgTotal) * 100)}</strong> of total cycle time.
        </Body>
      </ReportPage>

      {/* Page 2 — By dealer table + monthly chart */}
      <ReportPage reportTitle={TITLE} period={PERIOD} pageNum={3}>
        <SectionTag num="02" label="By Dealership" />
        <SectionTitle>Which rooftops <Em>submit most</Em>.</SectionTitle>

        <Body style={{ maxWidth: '640px' }}>
          Bar widths represent claim volume. Average days shown includes all three processing phases.
        </Body>

        <ForecastTable
          headers={['Dealer Code', 'Volume (relative bar)', 'Avg Cycle']}
          rows={forecastRows}
        />

        <Divider />

        <SubHead style={{ marginTop: 0 }}>Monthly submission volume</SubHead>
        <BarChartSvg
          labels={monthLabels}
          series={[{ label: 'Claims', values: countVals }]}
          width={668}
          height={120}
        />
        <Legend items={[{ color: C.purple, label: 'Claims submitted per month' }]} />
      </ReportPage>

      {/* Page 3 — Regional + callout */}
      <ReportPage reportTitle={TITLE} period={PERIOD} pageNum={4}>
        <SectionTag num="03" label="Regional Activity" />
        <SectionTitle>Where <Em>claim volume</Em> concentrates.</SectionTitle>

        <Body>Top 3 regions by claim count:</Body>
        <StatStrip items={statItems} />

        <Callout label="Phase 1 is your biggest lever">
          With Phase 1 averaging {avgP1.toFixed(1)} days — {fmtPct((avgP1 / avgTotal) * 100)} of total cycle time — even a 3-day improvement in pre-approval processing would reduce the average claim cycle by over {fmtPct((3 / avgTotal) * 100)}.
          Focus pre-approval resources on the top-volume dealerships first for the highest systemic impact.
        </Callout>

        <EndMarker />
      </ReportPage>
    </div>
  );
}
