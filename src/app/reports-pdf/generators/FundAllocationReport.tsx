import { Document } from '@react-pdf/renderer';
import rawContracts from '../../../data/clients/vw/contracts.json';
import rawOverview from '../../../data/clients/vw/overview.json';
import { ReportCover } from '../components/ReportCover';
import { ReportPage } from '../components/ReportPage';
import {
  SectionTag, SectionTitle, Em, Lead, Body, Bold, SubHead,
  KpiGrid, BreakdownTable, ForecastTable, Callout, TwoCol,
  DonutSvg, Divider, ClosingGrid, EndMarker,
} from '../components/Primitives';
import { fmtUSD, fmtPct, fmtDate, groupSum, barWidth } from '../../reports/utils';
import { C } from '../../reports/tokens';

const TITLE = 'VW Fund Allocation Report';
const PERIOD = "Apr '25 — Apr '26";

export function FundAllocationReport() {
  // ── Contract aggregations ───────────────────────────────────────────────────
  const totalValue  = rawContracts.reduce((s, c) => s + c.value, 0);
  const totalMedia  = rawContracts.reduce((s, c) => s + c.mediaCost, 0);
  const totalHard   = rawContracts.reduce((s, c) => s + c.hardCost, 0);
  const mediaPct    = (totalMedia / totalValue) * 100;
  const hardPct     = (totalHard / totalValue) * 100;

  // Fund type split from overview (accrued by fundType)
  const byFundType = groupSum(rawOverview, 'fundType', ['accrued', 'paid']);
  const fundEntries = Object.entries(byFundType).sort((a, b) => b[1].accrued - a[1].accrued);
  const totalAccrued = fundEntries.reduce((s, [, v]) => s + v.accrued, 0);

  const fundColors = [C.purple, C.coral, C.green];
  const donutSlices = fundEntries.map(([, v], i) => ({ value: v.accrued, color: fundColors[i % 3] }));

  // Forecast table rows from contracts
  const maxContractVal = Math.max(...rawContracts.map(c => c.value));
  const forecastRows = rawContracts.map(c => ({
    id:       c.id,
    label:    `${fmtDate(c.startDate)} — ${fmtDate(c.expiresDate)}`,
    amount:   fmtUSD(c.value),
    barWidth: barWidth(c.value, maxContractVal, 140),
  }));

  const breakdownRows = fundEntries.map(([type, v], i) => ({
    color:  fundColors[i % 3],
    name:   type,
    pct:    fmtPct((v.accrued / totalAccrued) * 100),
    amount: fmtUSD(v.accrued),
  }));

  return (
    <Document>
      <ReportCover
        title={['Fund', 'Allocation', 'report.']}
        subtitle="A breakdown of how co-op funds are distributed across contract types, cost categories, and fund programs for the Volkswagen network."
        docTag="AI · Allocation Report"
      />

      {/* Page 1 — KPIs + pie chart */}
      <ReportPage reportTitle={TITLE} period={PERIOD} pageNum={2}>
        <SectionTag num="01" label="Allocation Overview" />
        <SectionTitle>Where your <Em>budget is allocated</Em>.</SectionTitle>

        <Lead>
          Your fund pool is split across <Bold>{fundEntries.length} fund programs</Bold>, with a total contracted value of{' '}
          <Bold>{fmtUSD(totalValue)}</Bold>. Media costs account for{' '}
          <Bold>{fmtPct(mediaPct)}</Bold> of contracted budget, with hard costs covering the remaining <Bold>{fmtPct(hardPct)}</Bold>.
        </Lead>

        <KpiGrid items={[
          { label: 'Total Contracted',  value: fmtUSD(totalValue, true),   delta: `Across ${rawContracts.length} active contracts`, accent: true },
          { label: 'Media Costs',       value: fmtUSD(totalMedia, true),    delta: `${fmtPct(mediaPct)} of total budget` },
          { label: 'Hard Costs',        value: fmtUSD(totalHard, true),     delta: `${fmtPct(hardPct)} of total budget` },
          { label: 'Active Contracts',  value: String(rawContracts.length), delta: 'Concurrent programs' },
        ]} />

        <Divider />

        <TwoCol
          vizRight
          left={
            <>
              <SubHead style={{ marginTop: 0 }}>By fund type (accrued)</SubHead>
              <BreakdownTable rows={[
                ...breakdownRows,
                { name: 'Total Accrued', amount: fmtUSD(totalAccrued), total: true },
              ]} />
            </>
          }
          right={
            <DonutSvg
              slices={donutSlices}
              centerLabel="TOTAL"
              centerValue={fmtUSD(totalAccrued, true)}
            />
          }
        />
      </ReportPage>

      {/* Page 2 — Contract forecast table */}
      <ReportPage reportTitle={TITLE} period={PERIOD} pageNum={3}>
        <SectionTag num="02" label="Contract Timeline" />
        <SectionTitle>Active contracts and <Em>budget forecast</Em>.</SectionTitle>

        <Body style={{ marginBottom: 12 }}>
          The table below lists all active contracts, sorted by value. Bar widths are proportional to contracted value, giving a quick visual sense of relative allocation across the cycle.
        </Body>

        <ForecastTable
          headers={['Contract', 'Period (bar = relative value)', 'Value']}
          rows={forecastRows}
        />

        <Callout label="Media-heavy distribution">
          A media-dominant allocation ({fmtPct(mediaPct)}) is typical for active retail markets but concentrates risk against media-rate volatility. If you anticipate a pullback in paid media, rebalancing toward hard costs and event budgets should be evaluated at the next contract renewal.
        </Callout>
      </ReportPage>

      {/* Page 3 — Closing insights */}
      <ReportPage reportTitle={TITLE} period={PERIOD} pageNum={4}>
        <SectionTag num="03" label="Allocation Insights" />
        <SectionTitle><Em>Key takeaways</Em> from this cycle's allocation.</SectionTitle>

        <ClosingGrid cards={[
          { num: '01', title: 'Media dominates the mix', body: `${fmtPct(mediaPct)} of contracted budget is tied to media costs — a signal of a network heavily invested in paid channels.` },
          { num: '02', title: 'Eight concurrent programs', body: `Running ${rawContracts.length} active contracts in parallel adds flexibility but requires careful expiry tracking to avoid unused funds.` },
          { num: '03', title: 'Hard cost headroom', body: `At ${fmtPct(hardPct)}, hard cost allocation leaves room for event-driven and co-op physical campaigns without reallocating media budget.` },
          { num: '04', title: 'Staggered expiry calendar', body: 'Contracts expire on a rolling monthly basis throughout 2026, reducing year-end budget pressure and enabling continuous reauthorization.' },
        ]} />

        <EndMarker />
      </ReportPage>
    </Document>
  );
}
