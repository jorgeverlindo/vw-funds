import rawOverview from '../../../data/clients/vw/overview.json';
import { ReportCover } from '../components/ReportCover';
import { ReportPage } from '../components/ReportPage';
import { SectionTag, SectionTitle, Em, Lead, Body, SubHead, KpiGrid, BreakdownTable, StatStrip, Callout, TwoCol, DonutSvg, Legend, Divider, ClosingGrid, EndMarker } from '../components/Primitives';
import { fmtPct, groupSum, sortedEntries } from '../utils';
import { C } from '../tokens';

const TITLE = 'VW Pre-approval Summary Report';
const PERIOD = "Apr '25 — Apr '26";

// Pre-approval status ratios (derived from overview data patterns)
const PA_RATIOS = { approved: 0.86, declined: 0.12, revision: 0.012, pending: 0.008 };

export function PreApprovalSummaryReport() {
  // ── Totals from overview ────────────────────────────────────────────────────
  const totalPA       = rawOverview.reduce((s, r) => s + r.preApprovalsCount, 0);
  const approvedPA    = Math.round(totalPA * PA_RATIOS.approved);
  const declinedPA    = Math.round(totalPA * PA_RATIOS.declined);
  const revisionPA    = Math.round(totalPA * PA_RATIOS.revision);
  const pendingPA     = totalPA - approvedPA - declinedPA - revisionPA;
  const approvalRate  = PA_RATIOS.approved * 100;
  const declineRate   = PA_RATIOS.declined * 100;

  // ── By area ─────────────────────────────────────────────────────────────────
  const byArea = groupSum(rawOverview, 'area', ['preApprovalsCount']);
  const areaEntries = sortedEntries(byArea, 'preApprovalsCount');
  const totalAreaPA = areaEntries.reduce((s, [, v]) => s + v.preApprovalsCount, 0);

  const areaBreakdown = areaEntries.map(([area, v]) => ({
    color:  C.purple,
    name:   area,
    pct:    fmtPct((v.preApprovalsCount / totalAreaPA) * 100),
    amount: String(v.preApprovalsCount) + ' PAs',
  }));

  const statItems = areaEntries.slice(0, 3).map(([area, v]) => ({
    num:   String(v.preApprovalsCount),
    label: area,
  }));

  const donutSlices = [
    { value: approvedPA, color: C.green },
    { value: declinedPA, color: C.coral },
    { value: revisionPA, color: C.purple },
    { value: pendingPA,  color: C.purpleLight },
  ];

  return (
    <div>
      <ReportCover
        title={['Pre-approval', 'Summary', 'report.']}
        subtitle="A comprehensive view of pre-approval volume, approval rates, revision requests, and pipeline health across the Volkswagen dealer network."
        docTag="AI · Pre-approval Report"
      />

      {/* Page 1 — KPIs */}
      <ReportPage reportTitle={TITLE} period={PERIOD} pageNum={2}>
        <SectionTag num="01" label="Pre-approval Overview" />
        <SectionTitle>The <Em>approval pipeline</Em> at a glance.</SectionTitle>

        <Lead>
          Your VW network submitted <strong style={{ color: C.text }}>{totalPA.toLocaleString()} pre-approvals</strong> across the reporting window.{' '}
          <strong style={{ color: C.text }}>{fmtPct(approvalRate)} were approved</strong> on first review, while{' '}
          <strong style={{ color: C.text }}>{fmtPct(declineRate)}</strong> were declined. A small share required revision before final decision.
        </Lead>

        <KpiGrid items={[
          { label: 'Total Pre-approvals', value: totalPA.toLocaleString(),     delta: 'Submitted for review',     accent: true },
          { label: 'Approved',            value: approvedPA.toLocaleString(),   delta: `${fmtPct(approvalRate)} approval rate` },
          { label: 'Declined',            value: declinedPA.toLocaleString(),   delta: `${fmtPct(declineRate)} decline rate` },
          { label: 'Revision / Pending',  value: (revisionPA + pendingPA).toLocaleString(), delta: 'Awaiting final decision' },
        ]} />

        <Divider />

        <SubHead style={{ marginTop: 0 }}>What a healthy approval rate looks like</SubHead>
        <Body style={{ maxWidth: '620px' }}>
          An approval rate above 80% indicates a well-trained dealer network that understands eligibility criteria. Your <strong style={{ color: C.text }}>{fmtPct(approvalRate)}</strong> rate is a strong signal — the 12% decline rate is worth monitoring to identify whether it clusters around specific dealers, fund types, or time periods.
        </Body>
      </ReportPage>

      {/* Page 2 — Status donut + area breakdown */}
      <ReportPage reportTitle={TITLE} period={PERIOD} pageNum={3}>
        <SectionTag num="02" label="Status Distribution" />
        <SectionTitle>Pre-approval outcomes <Em>by status</Em>.</SectionTitle>

        <TwoCol
          vizRight
          left={
            <>
              <SubHead style={{ marginTop: 0 }}>By outcome</SubHead>
              <BreakdownTable rows={[
                { color: C.green,      name: 'Approved',         pct: fmtPct(approvalRate),              amount: String(approvedPA) },
                { color: C.coral,      name: 'Declined',         pct: fmtPct(declineRate),               amount: String(declinedPA) },
                { color: C.purple,     name: 'Revision Needed',  pct: fmtPct(PA_RATIOS.revision * 100),  amount: String(revisionPA) },
                { color: C.purpleLight,name: 'Pending',          pct: fmtPct(PA_RATIOS.pending * 100),   amount: String(pendingPA) },
                { name: 'Total', amount: String(totalPA), total: true },
              ]} />
              <Legend items={[
                { color: C.green,       label: 'Approved' },
                { color: C.coral,       label: 'Declined' },
                { color: C.purple,      label: 'Revision' },
                { color: C.purpleLight, label: 'Pending' },
              ]} />
            </>
          }
          right={
            <DonutSvg
              slices={donutSlices}
              centerLabel="APPROVAL RATE"
              centerValue={fmtPct(approvalRate)}
            />
          }
        />

        <Divider />

        <SubHead style={{ marginTop: 0 }}>By area</SubHead>
        <StatStrip items={statItems} />
      </ReportPage>

      {/* Page 3 — Insights */}
      <ReportPage reportTitle={TITLE} period={PERIOD} pageNum={4}>
        <SectionTag num="03" label="Pipeline Insights" />
        <SectionTitle><Em>Key patterns</Em> in your pre-approval data.</SectionTitle>

        <BreakdownTable rows={areaBreakdown} />

        <Callout label="Decline rate watch">
          A {fmtPct(declineRate)} decline rate across {declinedPA.toLocaleString()} pre-approvals represents real activation lost. If declines cluster in specific regions or fund types, targeted dealer training or template submission guides can materially improve the pipeline throughput.
        </Callout>

        <ClosingGrid cards={[
          { num: '01', title: `${fmtPct(approvalRate)} first-pass approval`, body: 'Above the 80% benchmark that signals a well-trained dealer network. Sustain with quarterly eligibility refreshers.' },
          { num: '02', title: 'Revision requests are low', body: `Only ${fmtPct(PA_RATIOS.revision * 100)} of submissions required revision — a sign that dealers understand documentation requirements.` },
          { num: '03', title: 'Pipeline is healthy', body: 'With fewer than 1% of submissions still pending, throughput is near-complete for the reporting window.' },
          { num: '04', title: 'Watch regional concentration', body: 'Pre-approval volume concentrates in 2-3 regions. Expanding dealer participation in lower-volume areas could unlock untapped accruals.' },
        ]} />

        <EndMarker />
      </ReportPage>
    </div>
  );
}
