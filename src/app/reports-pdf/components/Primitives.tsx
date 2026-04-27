/**
 * react-pdf port of all primitive display components.
 * Imports from '@react-pdf/renderer' — no DOM elements.
 */
import type { ReactNode } from 'react';
import type { Style } from '@react-pdf/renderer';
import {
  View,
  Text,
  Svg,
  Path,
  Rect,
  Circle,
  StyleSheet,
} from '@react-pdf/renderer';
import { C } from '../../reports/tokens';
import { buildDonutSlices } from '../../reports/utils';

// ─── SectionTag ───────────────────────────────────────────────────────────────

export function SectionTag({ num, label }: { num: string; label: string }) {
  return (
    <View style={styles.sectionTagRow}>
      <View style={styles.sectionTagLine} />
      <Text style={styles.sectionTagText}>
        {num}{'  '}·{'  '}{label}
      </Text>
    </View>
  );
}

// ─── SectionTitle ─────────────────────────────────────────────────────────────

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Text style={styles.sectionTitle}>
      {children}
    </Text>
  );
}

// ─── Em (inline accent italic) ───────────────────────────────────────────────

export function Em({ children }: { children: ReactNode }) {
  return (
    <Text style={styles.em}>{children}</Text>
  );
}

// ─── Bold (inline bold) ──────────────────────────────────────────────────────

export function Bold({ children, style }: { children: ReactNode; style?: Style }) {
  return (
    <Text style={[styles.bold, style ?? {}]}>{children}</Text>
  );
}

// ─── Lead ────────────────────────────────────────────────────────────────────

export function Lead({ children, style }: { children: ReactNode; style?: Style }) {
  return (
    <Text style={[styles.lead, style ?? {}]}>{children}</Text>
  );
}

// ─── Body ────────────────────────────────────────────────────────────────────

export function Body({ children, style }: { children: ReactNode; style?: Style }) {
  return (
    <Text style={[styles.body, style ?? {}]}>{children}</Text>
  );
}

// ─── SubHead ─────────────────────────────────────────────────────────────────

export function SubHead({ children, style }: { children: ReactNode; style?: Style }) {
  return (
    <Text style={[styles.subHead, style ?? {}]}>{children}</Text>
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
    <View style={styles.kpiGrid}>
      {items.map(({ label, value, delta, accent }, idx) => (
        <View
          key={label}
          style={[
            styles.kpiCard,
            accent ? styles.kpiCardAccent : styles.kpiCardDefault,
            idx < items.length - 1 ? styles.kpiCardMarginRight : {},
          ]}
        >
          <Text style={styles.kpiLabel}>{label}</Text>
          <Text style={[styles.kpiValue, accent ? styles.kpiValueAccent : {}]}>
            {value}
          </Text>
          {delta ? <Text style={styles.kpiDelta}>{delta}</Text> : null}
        </View>
      ))}
    </View>
  );
}

// ─── Breakdown Table ──────────────────────────────────────────────────────────

export interface BreakdownRow {
  color?: string;
  name: string;
  pct?: string;
  amount: string;
  total?: boolean;
}

export function BreakdownTable({ rows }: { rows: BreakdownRow[] }) {
  return (
    <View style={styles.breakdownContainer}>
      {rows.map((row, i) => (
        <View
          key={i}
          style={[
            styles.breakdownRow,
            row.total ? styles.breakdownRowTotal : styles.breakdownRowDefault,
          ]}
        >
          {/* Color dot */}
          <View
            style={[
              styles.breakdownDot,
              { backgroundColor: row.color ?? 'transparent' },
            ]}
          />
          {/* Name */}
          <Text style={[styles.breakdownName, row.total ? { fontWeight: 600 } : {}]}>
            {row.name}
          </Text>
          {/* Pct badge */}
          <View style={styles.breakdownPctCol}>
            {row.pct ? (
              <View style={styles.breakdownPctBadge}>
                <Text style={styles.breakdownPctText}>{row.pct}</Text>
              </View>
            ) : null}
          </View>
          {/* Amount */}
          <Text style={[styles.breakdownAmount, row.total ? { fontWeight: 600 } : {}]}>
            {row.amount}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── Stat Strip ───────────────────────────────────────────────────────────────

export interface StatItem { num: string; label: string }

export function StatStrip({ items }: { items: StatItem[] }) {
  return (
    <View style={styles.statStrip}>
      {items.map(({ num, label }, i) => (
        <View
          key={label}
          style={[styles.statItem, i > 0 ? styles.statItemBorder : {}]}
        >
          <Text style={styles.statNum}>{num}</Text>
          <Text style={styles.statLabel}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Callout ─────────────────────────────────────────────────────────────────

export function Callout({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.callout}>
      <Text style={styles.calloutLabel}>{label}</Text>
      <Text style={styles.calloutBody}>{children}</Text>
    </View>
  );
}

// ─── Forecast Table ───────────────────────────────────────────────────────────

export interface ForecastRow {
  id: string;
  label: string;
  amount: string;
  barWidth: number;
  sub?: string;
}

export function ForecastTable({
  rows,
  headers = ['ID', 'Description', 'Amount'],
}: {
  rows: ForecastRow[];
  headers?: string[];
}) {
  return (
    <View style={styles.forecastTable}>
      {/* Header */}
      <View style={styles.forecastHeader}>
        <Text style={[styles.forecastCell1, styles.forecastHeaderText]}>{headers[0]}</Text>
        <Text style={[styles.forecastCellFlex, styles.forecastHeaderText]}>{headers[1]}</Text>
        <Text style={[styles.forecastCell3, styles.forecastHeaderText]}>{headers[2]}</Text>
      </View>
      {/* Rows */}
      {rows.map((row, i) => (
        <View key={i} style={styles.forecastRow}>
          <Text style={[styles.forecastCell1, styles.forecastId]}>{row.id}</Text>
          <View style={[styles.forecastCellFlex, styles.forecastBarCell]}>
            <View style={[styles.forecastBar, { width: row.barWidth }]} />
          </View>
          <Text style={[styles.forecastCell3, styles.forecastAmount]}>{row.amount}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Closing Grid ─────────────────────────────────────────────────────────────

export interface ClosingCard { num: string; title: string; body: string }

export function ClosingGrid({ cards }: { cards: ClosingCard[] }) {
  return (
    <View style={styles.closingGrid}>
      {cards.map(({ num, title, body }, idx) => (
        <View
          key={num}
          style={[
            styles.closingCard,
            idx % 2 === 0 ? styles.closingCardLeft : styles.closingCardRight,
          ]}
        >
          <Text style={styles.closingNum}>{num}</Text>
          <Text style={styles.closingTitle}>{title}</Text>
          <Text style={styles.closingBody}>{body}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────

export function Divider() {
  return <View style={styles.divider} />;
}

// ─── End Marker ──────────────────────────────────────────────────────────────

export function EndMarker() {
  return (
    <View style={styles.endMarker}>
      <View style={styles.endMarkerLine} />
      <Text style={styles.endMarkerText}>End of Report</Text>
    </View>
  );
}

// ─── Legend ──────────────────────────────────────────────────────────────────

export function Legend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <View style={styles.legend}>
      {items.map(({ color, label }) => (
        <View key={label} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: color }]} />
          <Text style={styles.legendText}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Two-column layout ────────────────────────────────────────────────────────

export function TwoCol({
  left,
  right,
  vizRight = false,
}: {
  left: ReactNode;
  right: ReactNode;
  vizRight?: boolean;
}) {
  return (
    <View style={[styles.twoCol, vizRight ? {} : styles.twoColTextHeavy]}>
      <View style={vizRight ? styles.twoColHalfLeft : styles.twoColLeft}>{left}</View>
      <View style={vizRight ? styles.twoColHalfRight : styles.twoColRight}>{right}</View>
    </View>
  );
}

// ─── DonutSvg ────────────────────────────────────────────────────────────────

export interface DonutSlice { value: number; color: string }

// We import SvgText from react-pdf as "SvgText" to avoid collision with DOM Text
import { Text as SvgText } from '@react-pdf/renderer';

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
  const cx = size / 2;
  const cy = size / 2;
  const paths = buildDonutSlices(slices, cx, cy, outerR);

  return (
    <Svg
      viewBox={`0 0 ${size} ${size}`}
      style={{ width: size, height: size }}
    >
      {paths.map((p, i) => (
        <Path key={i} d={p.path} fill={p.color} />
      ))}
      <Circle cx={String(cx)} cy={String(cy)} r={String(innerR)} fill="#ffffff" />
      {centerLabel ? (
        <SvgText
          x={String(cx)}
          y={String(cy - 8)}
          textAnchor="middle"
          fontFamily="Poppins"
          fontSize="9"
          fill={C.muted}
          fontWeight={600}
        >
          {centerLabel}
        </SvgText>
      ) : null}
      {centerValue ? (
        <SvgText
          x={String(cx)}
          y={String(cy + 10)}
          textAnchor="middle"
          fontFamily="Poppins"
          fontSize="13"
          fill={C.text}
          fontWeight={600}
        >
          {centerValue}
        </SvgText>
      ) : null}
    </Svg>
  );
}

// ─── BarChartSvg ─────────────────────────────────────────────────────────────

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
    <Svg viewBox={`0 0 ${width} ${height}`} style={{ width, height, marginTop: 8 }}>
      {labels.map((lbl, i) => {
        const groupX = padL + i * groupW;
        return (
          <SvgText
            key={lbl}
            x={String(groupX + groupW / 2)}
            y={String(height - 4)}
            textAnchor="middle"
            fontFamily="Inter"
            fontSize="9"
            fill={C.muted2}
          >
            {lbl}
          </SvgText>
        );
      })}
      {series.map((s, si) =>
        s.values.map((v, i) => {
          const bH = Math.max(2, (v / maxVal) * chartH);
          const groupX = padL + i * groupW;
          const x = groupX + (groupW - series.length * barW) / 2 + si * barW;
          return (
            <Rect
              key={`${si}-${i}`}
              x={String(x)}
              y={String(padT + chartH - bH)}
              width={String(barW - 2)}
              height={String(bH)}
              rx="2"
              fill={colors[si % colors.length]}
              opacity="0.88"
            />
          );
        })
      )}
    </Svg>
  );
}

// ─── StyleSheet ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // SectionTag
  sectionTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  sectionTagLine: {
    width: 28,
    height: 1.5,
    backgroundColor: C.purple,
    flexShrink: 0,
    marginRight: 12,
  },
  sectionTagText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    color: C.purple,
    fontWeight: 600,
  },

  // SectionTitle
  sectionTitle: {
    fontFamily: 'Poppins',
    fontSize: 40,
    fontWeight: 600,
    letterSpacing: -1.4,
    lineHeight: 1.1,
    marginBottom: 28,
    color: C.text,
  },

  // Em
  em: {
    color: C.purple,
    fontStyle: 'italic',
    fontWeight: 600,
  },

  // Bold
  bold: {
    fontWeight: 700,
    color: C.text,
  },

  // Lead
  lead: {
    fontFamily: 'Inter',
    fontSize: 16,
    lineHeight: 1.7,
    color: C.textSoft,
    marginBottom: 14,
  },

  // Body
  body: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 1.65,
    color: C.textSoft,
    marginBottom: 12,
  },

  // SubHead
  subHead: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: 600,
    color: C.text,
    marginTop: 32,
    marginBottom: 12,
  },

  // KpiGrid
  kpiGrid: {
    flexDirection: 'row',
    marginTop: 32,
    marginBottom: 32,
  },
  kpiCard: {
    flexGrow: 1,
    flexBasis: 0,
    padding: 18,
    borderRadius: 10,
    borderWidth: 1,
  },
  kpiCardDefault: {
    backgroundColor: C.bgSoft,
    borderColor: C.borderSoft,
  },
  kpiCardAccent: {
    backgroundColor: '#F4F2FF',
    borderColor: C.purpleSoft,
  },
  kpiCardMarginRight: {
    marginRight: 14,
  },
  kpiLabel: {
    fontFamily: 'Poppins',
    fontSize: 10,
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 10,
    fontWeight: 600,
  },
  kpiValue: {
    fontFamily: 'Poppins',
    fontSize: 26,
    fontWeight: 600,
    color: C.text,
    letterSpacing: -0.65,
    lineHeight: 1.05,
  },
  kpiValueAccent: {
    color: C.purple,
  },
  kpiDelta: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: C.muted,
    marginTop: 6,
  },

  // BreakdownTable
  breakdownContainer: {
    marginTop: 20,
    marginBottom: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 13,
    paddingBottom: 13,
    fontFamily: 'Inter',
    fontSize: 14,
  },
  breakdownRowDefault: {
    borderBottomWidth: 1,
    borderBottomColor: C.borderSoft,
  },
  breakdownRowTotal: {
    borderTopWidth: 2,
    borderTopColor: C.text,
    marginTop: 4,
    fontWeight: 600,
  },
  breakdownDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginRight: 14,
    flexShrink: 0,
  },
  breakdownName: {
    flex: 1,
    color: C.text,
    fontWeight: 500,
    fontFamily: 'Inter',
    fontSize: 14,
  },
  breakdownPctCol: {
    width: 60,
    alignItems: 'flex-start',
    marginRight: 14,
  },
  breakdownPctBadge: {
    backgroundColor: C.bgSoft,
    borderRadius: 100,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  breakdownPctText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: 600,
    color: C.muted,
  },
  breakdownAmount: {
    width: 100,
    textAlign: 'right',
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: 600,
    color: C.text,
  },

  // StatStrip
  statStrip: {
    flexDirection: 'row',
    marginTop: 32,
    marginBottom: 32,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: C.border,
    borderBottomColor: C.border,
    paddingVertical: 22,
  },
  statItem: {
    flex: 1,
    paddingLeft: 0,
  },
  statItemBorder: {
    borderLeftWidth: 1,
    borderLeftColor: C.border,
    paddingLeft: 24,
    marginLeft: 0,
  },
  statNum: {
    fontFamily: 'Poppins',
    fontSize: 30,
    fontWeight: 600,
    color: C.text,
    letterSpacing: -0.9,
  },
  statLabel: {
    fontFamily: 'Poppins',
    fontSize: 10,
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginTop: 6,
    fontWeight: 600,
  },

  // Callout
  callout: {
    backgroundColor: '#F5F3FF',
    borderLeftWidth: 3,
    borderLeftColor: C.purple,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    padding: 20,
    marginTop: 28,
    marginBottom: 28,
  },
  calloutLabel: {
    fontFamily: 'Poppins',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 1.8,
    color: C.purple,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  calloutBody: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: C.text,
    lineHeight: 1.6,
  },

  // ForecastTable
  forecastTable: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
  },
  forecastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: C.bgSoft,
  },
  forecastHeaderText: {
    fontFamily: 'Poppins',
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: C.muted,
    fontWeight: 600,
  },
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: C.borderSoft,
  },
  forecastCell1: {
    width: 90,
  },
  forecastCellFlex: {
    flex: 1,
    paddingHorizontal: 10,
  },
  forecastCell3: {
    width: 110,
  },
  forecastId: {
    fontFamily: 'Poppins',
    fontWeight: 600,
    color: C.text,
    fontSize: 12,
  },
  forecastBarCell: {
    height: 18,
    justifyContent: 'center',
  },
  forecastBar: {
    height: 6,
    backgroundColor: C.purple,
    borderRadius: 100,
    opacity: 0.85,
  },
  forecastAmount: {
    textAlign: 'right',
    fontFamily: 'Poppins',
    fontWeight: 600,
    color: C.text,
    fontSize: 12,
  },

  // ClosingGrid
  closingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 32,
    marginBottom: 0,
  },
  closingCard: {
    flexBasis: '48%',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 22,
    marginBottom: 16,
  },
  closingCardLeft: {
    marginRight: '4%',
  },
  closingCardRight: {
    marginRight: 0,
  },
  closingNum: {
    fontFamily: 'Poppins',
    fontSize: 11,
    letterSpacing: 1.8,
    color: C.purple,
    fontWeight: 600,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  closingTitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    marginBottom: 8,
    color: C.text,
    fontWeight: 600,
  },
  closingBody: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: C.muted,
    lineHeight: 1.55,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 44,
  },

  // EndMarker
  endMarker: {
    alignItems: 'center',
    paddingTop: 32,
  },
  endMarkerLine: {
    width: 40,
    height: 1,
    backgroundColor: C.purple,
    marginBottom: 12,
  },
  endMarkerText: {
    fontFamily: 'Poppins',
    fontSize: 10,
    letterSpacing: 4.8,
    textTransform: 'uppercase',
    color: C.muted,
    fontWeight: 600,
  },

  // Legend
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 18,
    marginBottom: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginRight: 7,
  },
  legendText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: C.muted,
  },

  // TwoCol
  twoCol: {
    flexDirection: 'row',
    marginTop: 36,
    marginBottom: 36,
    alignItems: 'center',
  },
  twoColTextHeavy: {},
  twoColLeft: {
    flex: 1.05,
    marginRight: 44,
  },
  twoColRight: {
    flex: 1,
  },
  twoColHalfLeft: {
    flex: 1,
    marginRight: 22,
  },
  twoColHalfRight: {
    flex: 1,
  },
});
