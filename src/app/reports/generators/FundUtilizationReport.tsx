import rawOverview from '../../../data/clients/vw/overview.json';
import { ReportCover } from '../components/ReportCover';
import { ReportPage } from '../components/ReportPage';
import { SectionTag, SectionTitle, Em, Lead, Body, SubHead, KpiGrid, BreakdownTable, StatStrip, Callout, TwoCol, DonutSvg, Legend, Divider, EndMarker } from '../components/Primitives';
import { fmtUSD, fmtPct, groupSum, sortedEntries, dealerName, barWidth } from '../utils';
import { C, CHART_COLORS } from '../tokens';

const TITLE = 'VW Fund Utilization Report';
const PERIOD = "Apr '25 — Apr '26";

export function FundUtilizationReport() {
  // ── Aggregations ────────────────────────────────────────────────────────────
  const totalAccrued    = rawOverview.reduce((s, r) => s + r.accrued, 0);
  const totalPaid       = rawOverview.reduce((s, r) => s + r.paid, 0);
  const totalPending    = rawOverview.reduce((s, r) => s + r.pending, 0);
  const totalExpiring   = rawOverview.reduce((s, r) => s + r.expiringThisMonth, 0);
  const available       = totalAccrued - totalPaid;
  const availablePct    = (available / totalAccrued) * 100;
  const reimbursedPct   = (totalPaid / totalAccrued) * 100;

  // By area stat strip
  const byArea = groupSum(rawOverview, 'area', ['accrued', 'paid']);
  const areaEntries = sortedEntries(byArea, 'accrued', 5);
  const statItems = areaEntries.slice(0, 3).map(([area, v]) => ({
    num: fmtUSD(v.accrued, true),
    label: area,
  }));

  // By dealer (top 8)
  const byDealer = groupSum(rawOverview, 'dealershipCode', ['accrued', 'paid']);
  const topDealers = sortedEntries(byDealer, 'accrued', 8);
  const maxAccrued = topDealers[0]?.[1]?.accrued ?? 1;

  const breakdownRows = topDealers.map(([code, v]) => ({
    color: C.purple,
    name:  dealerName(code),
    pct:   fmtPct((v.accrued / totalAccrued) * 100),
    amount: fmtUSD(v.accrued),
  }));

  return (
    <div>
      <ReportCover
        title={['Fund', 'Utilization', 'report.']}
        subtitle="A detailed view of fund accrual, reimbursement, and available activation headroom across your Volkswagen dealer network."
        docTag="AI · Utilization Report"
      />

      {/* Page 1 — KPIs + overview text */}
      <ReportPage reportTitle={TITLE} period={PERIOD} pageNum={2}>
        <SectionTag num="01" label="Utilization Overview" />
        <SectionTitle>Where your funds <Em>stand today</Em>.</SectionTitle>

        <Lead>
          Of the <strong style={{ color: C.text }}>{fmtUSD(totalAccrued)}</strong> accrued across the period,{' '}
          <strong style={{ color: C.text }}>{fmtUSD(available)} ({fmtPct(availablePct)}) remains available</strong> and{' '}
          <strong style={{ color: C.text }}>{fmtUSD(totalPaid)} ({fmtPct(reimbursedPct)}) has been reimbursed</strong>.
          A further <strong style={{ color: C.text }}>{fmtUSD(totalPending)}</strong> sits in pending claims awaiting resolution.
        </Lead>

        <KpiGrid items={[
          { label: 'Total Accrued',     value: fmtUSD(totalAccrued, true),  delta: `${fmtUSD(totalAccrued)} total`,           accent: true },
          { label: 'Available Funds',   value: fmtUSD(available, true),      delta: `${fmtPct(availablePct)} of accrued` },
          { label: 'Reimbursed',        value: fmtUSD(totalPaid, true),       delta: `${fmtPct(reimbursedPct)} of accrued` },
          { label: 'Expiring YTD',      value: fmtUSD(totalExpiring, true),   delta: 'Activation risk window' },
        ]} />

        <Divider />

        <SubHead style={{ marginTop: 0 }}>How to read utilization</SubHead>
        <Body style={{ maxWidth: '620px' }}>
          Utilization is the ratio of reimbursed funds to total accrued. A healthy range sits between 40–65% — high enough to show active use, low enough to preserve headroom for upcoming campaigns.
          Your network currently tracks at <strong style={{ color: C.text }}>{fmtPct(reimbursedPct)}</strong>, indicating solid claim flow with real activation room still available.
        </Body>
      </ReportPage>

      {/* Page 2 — Donut + breakdown */}
      <ReportPage reportTitle={TITLE} period={PERIOD} pageNum={3}>
        <SectionTag num="02" label="Available vs. Reimbursed" />
        <SectionTitle>The <Em>split</Em> that drives activation.</SectionTitle>

        <TwoCol
          vizRight
          left={
            <>
              <SubHead style={{ marginTop: 0 }}>Fund utilization</SubHead>
              <Body style={{ marginBottom: '18px' }}>
                Of the total accrued balance, <strong style={{ color: C.text }}>{fmtPct(availablePct)} remains available</strong> and{' '}
                <strong style={{ color: C.text }}>{fmtPct(reimbursedPct)} has been reimbursed</strong>. A near-even split signals healthy claim flow without funds languishing.
              </Body>
              <Legend items={[
                { color: C.green, label: `Available · ${fmtPct(availablePct)} · ${fmtUSD(available)}` },
                { color: C.coral, label: `Reimbursed · ${fmtPct(reimbursedPct)} · ${fmtUSD(totalPaid)}` },
              ]} />
            </>
          }
          right={
            <DonutSvg
              slices={[
                { value: available, color: C.green },
                { value: totalPaid, color: C.coral },
              ]}
              centerLabel="TOTAL ACCRUED"
              centerValue={fmtUSD(totalAccrued, true)}
            />
          }
        />

        <Callout label="Reading the split">
          A utilization rate near 50% is a healthy signal — dealers are claiming regularly without draining the pool. Watch the available portion: if it drops below 30% before the cycle closes, prioritize accelerating pending claim approvals to free up buffer.
        </Callout>
      </ReportPage>

      {/* Page 3 — By dealer */}
      <ReportPage reportTitle={TITLE} period={PERIOD} pageNum={4}>
        <SectionTag num="03" label="By Dealership" />
        <SectionTitle>Utilization <Em>by rooftop</Em>.</SectionTitle>

        <Body style={{ maxWidth: '620px', marginBottom: '0' }}>
          The table below ranks dealerships by total accrued funds. Dealers with a high accrued share and lower reimbursement may need activation support.
        </Body>

        <BreakdownTable rows={[
          ...breakdownRows,
          { name: 'All Dealerships', amount: fmtUSD(totalAccrued), total: true },
        ]} />

        <StatStrip items={statItems} />

        <EndMarker />
      </ReportPage>
    </div>
  );
}
