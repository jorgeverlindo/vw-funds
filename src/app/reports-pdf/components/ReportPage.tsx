import type { ReactNode } from 'react';
import { Page, View, Text, Svg, Path, StyleSheet } from '@react-pdf/renderer';
import { C, LOGO_PATHS } from '../../reports/tokens';

interface ReportPageProps {
  children: ReactNode;
  period?: string;
  reportTitle?: string;
  pageNum?: number;
}

// Parse LOGO_PATHS string to extract path d attributes
const logoDPaths: string[] = [...LOGO_PATHS.matchAll(/d="([^"]+)"/g)].map(m => m[1]);

function LogoSm() {
  return (
    <Svg width={96} height={18} viewBox="0 0 176 33">
      {logoDPaths.map((d, i) => (
        <Path key={i} d={d} fill="#1F1D25" />
      ))}
    </Svg>
  );
}

export function ReportPage({
  children,
  period = "Apr '25 — Apr '26",
  reportTitle = 'VW Funds Report',
  pageNum,
}: ReportPageProps) {
  return (
    <Page size={[820, 1100]} style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <LogoSm />
        <Text style={styles.headerPeriod}>{period}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>{children}</View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Constellation — {reportTitle}</Text>
        {pageNum !== undefined ? (
          <Text style={styles.footerText}>p. {String(pageNum).padStart(2, '0')}</Text>
        ) : null}
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    flexDirection: 'column',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 76,
    paddingTop: 30,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.borderSoft,
  },
  headerPeriod: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: C.muted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontWeight: 500,
  },

  content: {
    flex: 1,
    paddingHorizontal: 76,
    paddingTop: 32,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 76,
    paddingTop: 14,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: C.borderSoft,
  },
  footerText: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: C.muted2,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontWeight: 500,
  },
});
