import { Document } from '@react-pdf/renderer';
import rawPayments from '../../../data/clients/vw/payment-transactions.json';
import { ReportCover } from '../components/ReportCover';
import { ReportPage } from '../components/ReportPage';
import {
  SectionTag, SectionTitle, Em, Lead, Body, Bold, SubHead,
  KpiGrid, ForecastTable, StatStrip, Callout, Divider,
  BarChartSvg, Legend, ClosingGrid, EndMarker,
} from '../components/Primitives';
import { fmtUSD, fmtDate, daysBetween, barWidth } from '../../reports/utils';
import { C } from '../../reports/tokens';

const TITLE = 'VW Payment Processing Report';
const PERIOD = "Apr '25 — Apr '26";

export function PaymentProcessingReport() {
  // ── Aggregations ────────────────────────────────────────────────────────────
  const paidTxns    = rawPayments.filter(p => p.status === 'Paid out');
  const pendingTxns = rawPayments.filter(p => p.status !== 'Paid out');
  const totalPaid    = paidTxns.reduce((s, p) => s + p.amount, 0);
  const totalPending = pendingTxns.reduce((s, p) => s + p.amount, 0);
  const totalVolume  = rawPayments.reduce((s, p) => s + p.amount, 0);

  // Average lag (paid transactions only)
  const lags = paidTxns
    .filter(p => p.paidDate)
    .map(p => daysBetween(p.submitDate, p.paidDate!));
  const avgLag = lags.length > 0 ? lags.reduce((s, d) => s + d, 0) / lags.length : 0;
  const minLag = lags.length > 0 ? Math.min(...lags) : 0;
  const maxLag = lags.length > 0 ? Math.max(...lags) : 0;

  // ── Top 15 transactions for table ──────────────────────────────────────────
  const maxTxnAmt = Math.max(...rawPayments.map(p => p.amount));
  const topTxns = [...rawPayments]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 15);

  const forecastRows = topTxns.map(p => {
    const lag = p.paidDate ? daysBetween(p.submitDate, p.paidDate) : 0;
    return {
      id:       p.id,
      label:    `${p.area} · ${fmtDate(p.submitDate)}`,
      amount:   fmtUSD(p.amount),
      barWidth: barWidth(p.amount, maxTxnAmt, 140),
      sub:      p.paidDate ? `${lag}d lag` : 'Pending',
    };
  });

  // ── Monthly payment volume ──────────────────────────────────────────────────
  const monthMap: Record<string, number> = {};
  for (const p of rawPayments) {
    monthMap[p.month] = (monthMap[p.month] ?? 0) + p.amount;
  }
  const months = Object.keys(monthMap).sort().slice(-10);
  const monthLabels = months.map(m => {
    const [, mo] = m.split('-');
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+mo - 1];
  });
  const volVals = months.map(m => monthMap[m] ?? 0);

  // ── By area stat strip ─────────────────────────────────────────────────────
  const areaMap: Record<string, number> = {};
  for (const p of paidTxns) areaMap[p.area] = (areaMap[p.area] ?? 0) + p.amount;
  const areaTop3 = Object.entries(areaMap).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const statItems = areaTop3.map(([area, v]) => ({ num: fmtUSD(v, true), label: area }));

  return (
    <Document>
      <ReportCover
        title={['Payment', 'Processing', 'report.']}
        subtitle="A detailed view of payment volumes, processing lag, transaction history, and regional disbursement patterns for the Volkswagen co-op fund network."
        docTag="AI · Payment Report"
      />

      {/* Page 1 — KPIs */}
      <ReportPage reportTitle={TITLE} period={PERIOD} pageNum={2}>
        <SectionTag num="01" label="Payment Overview" />
        <SectionTitle>What's been <Em>disbursed</Em> and what's waiting.</SectionTitle>

        <Lead>
          Of the <Bold>{fmtUSD(totalVolume)}</Bold> in total claim payment volume,{' '}
          <Bold>{fmtUSD(totalPaid)}</Bold> has been disbursed across <Bold>{paidTxns.length} paid transactions</Bold>.
          The average payment lag from submission to disbursement is <Bold>{avgLag.toFixed(1)} days</Bold>,
          ranging from {minLag} to {maxLag} days.
        </Lead>

        <KpiGrid items={[
          { label: 'Total Disbursed', value: fmtUSD(totalPaid, true),    delta: `${paidTxns.length} paid transactions`,  accent: true },
          { label: 'Avg Payment Lag', value: `${avgLag.toFixed(1)}d`,    delta: `${minLag}d min · ${maxLag}d max` },
          { label: 'Pending Payment', value: fmtUSD(totalPending, true), delta: `${pendingTxns.length} transactions` },
          { label: 'Total Volume',    value: fmtUSD(totalVolume, true),  delta: 'Submitted for payment' },
        ]} />

        <Divider />

        <SubHead style={{ marginTop: 0 }}>Understanding payment lag</SubHead>
        <Body>
          Payment lag is the number of days between a claim's submission date and the date funds are disbursed to the dealer. A lag under 15 days is considered best-in-class for co-op programs. Your network averages{' '}
          <Bold>{avgLag.toFixed(1)} days</Bold> — watch for outlier transactions above 25 days that may signal processing bottlenecks.
        </Body>
      </ReportPage>

      {/* Page 2 — Transaction table */}
      <ReportPage reportTitle={TITLE} period={PERIOD} pageNum={3}>
        <SectionTag num="02" label="Transaction Detail" />
        <SectionTitle>Top <Em>payment transactions</Em> by value.</SectionTitle>

        <Body>
          The table below shows the 15 largest payment transactions. Bar widths are proportional to disbursement amount.
        </Body>

        <ForecastTable
          headers={['ID', 'Area · Submit Date', 'Amount']}
          rows={forecastRows}
        />
      </ReportPage>

      {/* Page 3 — Monthly volume + regional */}
      <ReportPage reportTitle={TITLE} period={PERIOD} pageNum={4}>
        <SectionTag num="03" label="Volume & Regional Patterns" />
        <SectionTitle>Monthly disbursement <Em>rhythm</Em>.</SectionTitle>

        <BarChartSvg
          labels={monthLabels}
          series={[{ label: 'Payment volume', values: volVals }]}
          width={668}
          height={140}
        />
        <Legend items={[{ color: C.purple, label: 'Monthly disbursement volume ($)' }]} />

        <SubHead>Top regions by disbursement</SubHead>
        <StatStrip items={statItems} />

        <Callout label="Lag optimization">
          Transactions with lag above {Math.round(avgLag * 1.5)} days (1.5× the average) may indicate manual review holds or documentation issues. Flagging these early in the cycle reduces the probability of end-of-period payment backlogs.
        </Callout>

        <EndMarker />
      </ReportPage>
    </Document>
  );
}
