import { Document } from '@react-pdf/renderer';
import rawOverview from '../../../data/clients/vw/overview.json';
import { ReportCover } from '../components/ReportCover';
import { ReportPage } from '../components/ReportPage';
import {
  SectionTag, SectionTitle, Em, Lead, Body, Bold, SubHead,
  KpiGrid, BreakdownTable, StatStrip, Callout, Divider,
  BarChartSvg, EndMarker, Legend,
} from '../components/Primitives';
import { fmtUSD, fmtPct, fmtMonthLabel, groupSum, sortedEntries } from '../../reports/utils';
import { C } from '../../reports/tokens';

const TITLE = 'VW Fund Usage Report';
const PERIOD = "Apr '25 — Apr '26";

export function FundUsageReport() {
  // ── Global KPIs ─────────────────────────────────────────────────────────────
  const totalAccrued   = rawOverview.reduce((s, r) => s + r.accrued, 0);
  const totalSubmitted = rawOverview.reduce((s, r) => s + r.submitted, 0);
  const totalApproved  = rawOverview.reduce((s, r) => s + r.approved, 0);
  const totalPending   = rawOverview.reduce((s, r) => s + r.pending, 0);
  const approvalRate   = (totalApproved / totalSubmitted) * 100;

  // ── Monthly rhythm (group by month, sum accrued + submitted) ────────────────
  const monthMap = groupSum(rawOverview, 'month', ['accrued', 'submitted', 'approved']);
  const months = Object.keys(monthMap).sort();
  const monthLabels   = months.map(fmtMonthLabel);
  const accruedVals   = months.map(m => monthMap[m].accrued);
  const submittedVals = months.map(m => monthMap[m].submitted);

  // ── By fund type breakdown ──────────────────────────────────────────────────
  const byFundType = groupSum(rawOverview, 'fundType', ['accrued', 'submitted', 'approved']);
  const fundEntries = sortedEntries(byFundType, 'accrued');
  const fundColors = [C.purple, C.coral, C.green];

  const fundBreakdown = fundEntries.map(([type, v], i) => ({
    color:  fundColors[i % 3],
    name:   type,
    pct:    fmtPct((v.accrued / totalAccrued) * 100),
    amount: fmtUSD(v.accrued),
  }));

  // ── Regional stat strip ─────────────────────────────────────────────────────
  const byArea = groupSum(rawOverview, 'area', ['submitted']);
  const areaTop3 = sortedEntries(byArea, 'submitted', 3);
  const statItems = areaTop3.map(([area, v]) => ({ num: fmtUSD(v.submitted, true), label: area }));

  return (
    <Document>
      <ReportCover
        title={['Fund', 'Usage', 'report.']}
        subtitle="Monthly accrual-vs-submission rhythm, fund type distribution, and regional activity patterns across the Volkswagen dealer network."
        docTag="AI · Usage Report"
      />

      {/* Page 1 — KPIs */}
      <ReportPage reportTitle={TITLE} period={PERIOD} pageNum={2}>
        <SectionTag num="01" label="Usage Overview" />
        <SectionTitle>How dealers are <Em>spending</Em> what they accrue.</SectionTitle>

        <Lead>
          Across the full period, your VW network accrued <Bold>{fmtUSD(totalAccrued)}</Bold> in co-op funds and submitted{' '}
          <Bold>{fmtUSD(totalSubmitted)}</Bold> in claims —{' '}
          a submission rate of <Bold>{fmtPct((totalSubmitted / totalAccrued) * 100)}</Bold>. Of submitted claims,{' '}
          <Bold>{fmtPct(approvalRate)}</Bold> were approved.
        </Lead>

        <KpiGrid items={[
          { label: 'Total Accrued',      value: fmtUSD(totalAccrued, true),    delta: 'Network-wide accrual',          accent: true },
          { label: 'Total Submitted',    value: fmtUSD(totalSubmitted, true),   delta: `${fmtPct((totalSubmitted / totalAccrued) * 100)} of accrued` },
          { label: 'Approved YTD',       value: fmtUSD(totalApproved, true),    delta: `${fmtPct(approvalRate)} approval rate` },
          { label: 'Pending Resolution', value: fmtUSD(totalPending, true),     delta: 'Awaiting review' },
        ]} />

        <Divider />

        <SubHead style={{ marginTop: 0 }}>Reading the usage gap</SubHead>
        <Body>
          The gap between accrued and submitted funds represents untouched budget that dealers have earned but not yet activated. At <Bold>{fmtPct(100 - (totalSubmitted / totalAccrued) * 100)}</Bold>, this is the activation opportunity your OEM team can address through co-op outreach.
        </Body>
      </ReportPage>

      {/* Page 2 — Monthly bar chart */}
      <ReportPage reportTitle={TITLE} period={PERIOD} pageNum={3}>
        <SectionTag num="02" label="Accrual vs. Submission Rhythm" />
        <SectionTitle>Month-over-month <Em>activation pattern</Em>.</SectionTitle>

        <Body>
          The chart below compares monthly accruals (purple) against claim submissions (coral) over the full reporting period. Months where submissions approach or exceed accruals indicate catch-up periods or high-activity campaigns.
        </Body>

        <BarChartSvg
          labels={monthLabels}
          series={[
            { label: 'Accrued',   values: accruedVals },
            { label: 'Submitted', values: submittedVals },
          ]}
          width={668}
          height={160}
        />

        <Legend items={[
          { color: C.purple, label: 'Accrued' },
          { color: C.coral,  label: 'Submitted' },
        ]} />

        <Callout label="Rhythm insight">
          Burst submission periods — where claims outpace fresh accruals — reflect backlog catch-ups or end-of-quarter campaign activations. From month 8 onward, a steadier rhythm indicates maturing claim behavior across the dealer network.
        </Callout>
      </ReportPage>

      {/* Page 3 — Fund type + regional */}
      <ReportPage reportTitle={TITLE} period={PERIOD} pageNum={4}>
        <SectionTag num="03" label="Fund Type & Regional Breakdown" />
        <SectionTitle>Where usage <Em>concentrates</Em>.</SectionTitle>

        <SubHead style={{ marginTop: 0 }}>By fund type</SubHead>
        <BreakdownTable rows={[
          ...fundBreakdown,
          { name: 'Total', amount: fmtUSD(totalAccrued), total: true },
        ]} />

        <SubHead>Submissions by region</SubHead>
        <StatStrip items={statItems} />

        <EndMarker />
      </ReportPage>
    </Document>
  );
}
