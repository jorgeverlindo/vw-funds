/**
 * All small stateless display components in one file to minimize imports.
 * Includes: SectionTag, KpiGrid, BreakdownTable, StatStrip, Callout, ForecastTable, EndMarker
 */
import type { CSSProperties, ReactNode } from 'react';
import { C, F, CHART_COLORS } from '../tokens';
import { fmtUSD } from '../utils';

// ─── Section tag ──────────────────────────────────────────────────────────────

export function SectionTag({ num, label }: { num: string; label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      fontFamily: F.poppins, fontSize: '11px', letterSpacing: '0.22em',
      textTransform: 'uppercase', color: C.purple, fontWeight: 600, marginBottom: '18px',
    }}>
      <span style={{ display: 'inline-block', width: '28px', height: '1.5px', background: C.purple }} />
      {num} &nbsp;·&nbsp; {label}
    </div>
  );
}

// ─── Section title ────────────────────────────────────────────────────────────

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h1 style={{
      fontFamily: F.poppins, fontSize: '40px', fontWeight: 600,
      letterSpacing: '-0.035em', lineHeight: 1.1,
      marginBottom: '28px', color: C.text, maxWidth: '580px',
      margin: '0 0 28px',
    }}>
      {children}
    </h1>
  );
}

export function Em({ children }: { children: ReactNode }) {
  return <span style={{ color: C.purple, fontStyle: 'italic', fontWeight: 500 }}>{children}</span>;
}

// ─── Lead / body text ─────────────────────────────────────────────────────────

export function Lead({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <p style={{ fontFamily: F.inter, fontSize: '16px', lineHeight: 1.7, color: C.textSoft, maxWidth: '640px', margin: '0 0 14px', ...style }}>
      {children}
    </p>
  );
}

export function Body({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <p style={{ fontFamily: F.inter, fontSize: '14px', lineHeight: 1.65, color: C.textSoft, margin: '0 0 12px', ...style }}>
      {children}
    </p>
  );
}

export function SubHead({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <h2 style={{ fontFamily: F.poppins, fontSize: '16px', fontWeight: 600, letterSpacing: '-0.005em', color: C.text, margin: '32px 0 12px', ...style }}>
      {children}
    </h2>
  );
}

// ─── KPI Grid ─────────────────────────────────────────────────────────────────

export interface KpiItem {
  label: string;
  value: string;
  delta?: string;
  accent?: boolean;
}

export function KpiGrid({ items }: { items: KpiItem[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: '14px', margin: '32px 0' }}>
      {items.map(({ label, value, delta, accent }) => (
        <div key={label} style={{
          padding: '18px 18px 20px',
          background: accent ? 'linear-gradient(180deg, #F4F2FF, #FAFAFE)' : C.bgSoft,
          border: `1px solid ${accent ? C.purpleSoft : C.borderSoft}`,
          borderRadius: '10px',
        }}>
          <div style={{ fontFamily: F.poppins, fontSize: '10px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px', fontWeight: 600 }}>
            {label}
          </div>
          <div style={{ fontFamily: F.poppins, fontSize: '26px', fontWeight: 600, color: accent ? C.purple : C.text, letterSpacing: '-0.025em', lineHeight: 1.05, fontVariantNumeric: 'tabular-nums' }}>
            {value}
          </div>
          {delta && <div style={{ fontFamily: F.inter, fontSize: '11px', color: C.muted, marginTop: '6px' }}>{delta}</div>}
        </div>
      ))}
    </div>
  );
}

// ─── Breakdown table ──────────────────────────────────────────────────────────

export interface BreakdownRow {
  color?: string;
  name: string;
  pct?: string;
  amount: string;
  total?: boolean;
}

export function BreakdownTable({ rows }: { rows: BreakdownRow[] }) {
  return (
    <div style={{ margin: '20px 0 8px' }}>
      {rows.map((row, i) => (
        <div key={i} style={{
          display: 'grid',
          gridTemplateColumns: '14px 1fr auto auto',
          gap: '14px',
          alignItems: 'center',
          padding: '13px 0',
          borderBottom: row.total ? 'none' : `1px solid ${C.borderSoft}`,
          borderTop: row.total ? `2px solid ${C.text}` : 'none',
          fontFamily: F.inter,
          fontSize: '14px',
          fontWeight: row.total ? 600 : 400,
          marginTop: row.total ? '4px' : 0,
        }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: row.color ?? 'transparent', display: 'inline-block' }} />
          <span style={{ color: C.text, fontWeight: 500 }}>{row.name}</span>
          <span style={row.pct ? {
            color: C.muted, fontSize: '11px', padding: '3px 9px',
            background: C.bgSoft, borderRadius: '100px', fontWeight: 600,
            letterSpacing: '0.02em', fontVariantNumeric: 'tabular-nums', fontFamily: F.poppins,
          } : {}}>
            {row.pct ?? ''}
          </span>
          <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: C.text, minWidth: '92px', textAlign: 'right', fontFamily: F.poppins }}>
            {row.amount}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Stat strip ───────────────────────────────────────────────────────────────

export interface StatItem { num: string; label: string }

export function StatStrip({ items }: { items: StatItem[] }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 0,
      margin: '32px 0', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '22px 0',
    }}>
      {items.map(({ num, label }, i) => (
        <div key={label} style={{ padding: '0 24px', borderLeft: i === 0 ? 'none' : `1px solid ${C.border}`, paddingLeft: i === 0 ? 0 : '24px' }}>
          <div style={{ fontFamily: F.poppins, fontSize: '30px', fontWeight: 600, color: C.text, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{num}</div>
          <div style={{ fontFamily: F.poppins, fontSize: '10px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.14em', marginTop: '6px', fontWeight: 600 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Callout ──────────────────────────────────────────────────────────────────

export function Callout({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{
      padding: '20px 22px 22px',
      background: 'linear-gradient(180deg, #F5F3FF 0%, #FAF9FF 100%)',
      borderLeft: `3px solid ${C.purple}`,
      borderRadius: '0 10px 10px 0',
      margin: '28px 0',
    }}>
      <div style={{ fontFamily: F.poppins, fontSize: '10px', fontWeight: 600, letterSpacing: '0.18em', color: C.purple, textTransform: 'uppercase', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ fontFamily: F.inter, fontSize: '14px', color: C.text, lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  );
}

// ─── Forecast table ───────────────────────────────────────────────────────────

export interface ForecastRow {
  id: string;
  label: string;
  amount: string;
  barWidth: number; // 0–120 px
  sub?: string;
}

export function ForecastTable({ rows, headers = ['ID', 'Description', 'Amount'] }: { rows: ForecastRow[]; headers?: string[] }) {
  return (
    <div style={{ marginTop: '24px', border: `1px solid ${C.border}`, borderRadius: '10px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '90px 1fr 110px',
        alignItems: 'center', padding: '12px 16px',
        fontFamily: F.poppins, fontSize: '10px', letterSpacing: '0.12em',
        textTransform: 'uppercase', color: C.muted, fontWeight: 600, background: C.bgSoft,
      }}>
        {headers.map(h => <span key={h}>{h}</span>)}
      </div>
      {/* Rows */}
      {rows.map((row, i) => (
        <div key={i} style={{
          display: 'grid', gridTemplateColumns: '90px 1fr 110px',
          alignItems: 'center', padding: '10px 16px', borderTop: `1px solid ${C.borderSoft}`,
          fontFamily: F.inter, fontSize: '12px',
        }}>
          <span style={{ fontFamily: F.poppins, fontWeight: 600, color: C.text, fontVariantNumeric: 'tabular-nums' }}>{row.id}</span>
          <div style={{ padding: '0 10px', position: 'relative', height: '18px' }}>
            <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', height: '6px', width: `${row.barWidth}px`, background: C.purple, borderRadius: '100px', opacity: 0.85 }} />
          </div>
          <span style={{ textAlign: 'right', fontFamily: F.poppins, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: C.text }}>{row.amount}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Closing cards ────────────────────────────────────────────────────────────

export interface ClosingCard { num: string; title: string; body: string }

export function ClosingGrid({ cards }: { cards: ClosingCard[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', margin: '32px 0' }}>
      {cards.map(({ num, title, body }) => (
        <div key={num} style={{ padding: '22px 22px 24px', border: `1px solid ${C.border}`, borderRadius: '10px' }}>
          <div style={{ fontFamily: F.poppins, fontSize: '11px', letterSpacing: '0.18em', color: C.purple, fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px' }}>{num}</div>
          <h3 style={{ fontFamily: F.poppins, fontSize: '16px', marginBottom: '8px', color: C.text, fontWeight: 600, letterSpacing: '-0.01em' }}>{title}</h3>
          <p style={{ fontFamily: F.inter, fontSize: '13px', color: C.muted, lineHeight: 1.55, margin: 0 }}>{body}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
export function Divider() {
  return <div style={{ height: '1px', background: C.border, margin: '44px 0' }} />;
}

// ─── End marker ──────────────────────────────────────────────────────────────
export function EndMarker() {
  return (
    <div style={{ textAlign: 'center', padding: '32px 0 8px' }}>
      <div style={{ width: '40px', height: '1px', background: C.purple, margin: '0 auto 12px' }} />
      <span style={{ fontFamily: F.poppins, fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: C.muted, fontWeight: 600 }}>
        End of Report
      </span>
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────
export function Legend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px', fontFamily: F.inter, fontSize: '12px', color: C.muted, marginTop: '14px' }}>
      {items.map(({ color, label }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: color, display: 'inline-block' }} />
          {label}
        </div>
      ))}
    </div>
  );
}

// ─── Two-column layout ────────────────────────────────────────────────────────
export function TwoCol({ left, right, vizRight = false }: { left: ReactNode; right: ReactNode; vizRight?: boolean }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: vizRight ? '1fr 1fr' : '1.05fr 1fr',
      gap: '44px',
      alignItems: 'center',
      margin: '36px 0',
    }}>
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
}

// ─── DonutSvg ─────────────────────────────────────────────────────────────────
import { buildDonutSlices } from '../utils';

export interface DonutSlice { value: number; color: string }

export function DonutSvg({
  slices,
  centerLabel = 'TOTAL',
  centerValue,
  size = 240,
  outerR = 80,
  innerR = 38,
}: {
  slices: DonutSlice[];
  centerLabel?: string;
  centerValue?: string;
  size?: number;
  outerR?: number;
  innerR?: number;
}) {
  const cx = size / 2, cy = size / 2;
  const paths = buildDonutSlices(slices, cx, cy, outerR);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: `${size}px`, display: 'block', margin: '0 auto' }}>
      {paths.map((p, i) => <path key={i} d={p.path} fill={p.color} />)}
      <circle cx={cx} cy={cy} r={innerR} fill="#ffffff" />
      {centerLabel && (
        <text x={cx} y={cy - 8} textAnchor="middle" fontFamily="Poppins" fontSize="9" fill={C.muted} fontWeight="600" letterSpacing="1.4">{centerLabel}</text>
      )}
      {centerValue && (
        <text x={cx} y={cy + 10} textAnchor="middle" fontFamily="Poppins" fontSize="13" fill={C.text} fontWeight="600">{centerValue}</text>
      )}
    </svg>
  );
}

// ─── Inline bar chart (monthly) ───────────────────────────────────────────────
export interface BarSeries { label: string; values: number[] }

export function BarChartSvg({
  labels,
  series,
  width = 668,
  height = 140,
}: {
  labels: string[];
  series: BarSeries[];
  width?: number;
  height?: number;
}) {
  const padL = 0, padR = 0, padT = 8, padB = 28;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;
  const n = labels.length;
  const groupW = chartW / n;
  const barW = Math.max(6, groupW / (series.length + 1));

  const allVals = series.flatMap(s => s.values);
  const maxVal = Math.max(...allVals, 1);

  const colors = [C.purple, C.coral, C.green, C.purpleLight];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', display: 'block', marginTop: '8px' }}>
      {labels.map((lbl, i) => {
        const groupX = padL + i * groupW;
        return (
          <text key={lbl} x={groupX + groupW / 2} y={height - 4}
            textAnchor="middle" fontFamily="Inter" fontSize="9" fill={C.muted2}>
            {lbl}
          </text>
        );
      })}
      {series.map((s, si) =>
        s.values.map((v, i) => {
          const bH = Math.max(2, (v / maxVal) * chartH);
          const groupX = padL + i * groupW;
          const x = groupX + (groupW - series.length * barW) / 2 + si * barW;
          return (
            <rect key={`${si}-${i}`}
              x={x} y={padT + chartH - bH}
              width={barW - 2} height={bH}
              rx="2" fill={colors[si % colors.length]} opacity="0.88" />
          );
        })
      )}
    </svg>
  );
}
