import { Page, View, Text, Svg, Path, StyleSheet } from '@react-pdf/renderer';
import { C, LOGO_PATHS } from '../../reports/tokens';

interface ReportCoverProps {
  title: string[];
  subtitle: string;
  brand?: string;
  period?: string;
  generated?: string;
  docTag?: string;
}

// Parse LOGO_PATHS string to extract path d attributes
const logoDPaths: string[] = [...LOGO_PATHS.matchAll(/d="([^"]+)"/g)].map(m => m[1]);

export function ReportCover({
  title,
  subtitle,
  brand = 'Volkswagen — All Areas, All Dealerships',
  period = 'April 1, 2025 — April 27, 2026',
  generated = 'April 27, 2026',
  docTag = 'AI · Performance Report',
}: ReportCoverProps) {
  return (
    <Page size={[820, 1100]} style={styles.page}>
      {/* Background decorative corners (simulate radial gradients) */}
      <View style={styles.bgTopRight} />
      <View style={styles.bgBottomLeft} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <Svg width={176} height={33} viewBox="0 0 176 33">
          {logoDPaths.map((d, i) => (
            <Path key={i} d={d} fill="#1F1D25" />
          ))}
        </Svg>
        <View style={styles.docTagPill}>
          <Text style={styles.docTagText}>{docTag}</Text>
        </View>
      </View>

      {/* Title block */}
      <View style={styles.titleBlock}>
        <View>
          {title.map((line, i) => {
            const isLast = i === title.length - 1;
            return (
              <Text
                key={i}
                style={[styles.titleLine, isLast ? styles.titleLineAccent : {}]}
              >
                {line}
              </Text>
            );
          })}
        </View>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {/* Meta grid */}
      <View style={styles.metaGrid}>
        {[
          { label: 'Brand & Scope', value: brand },
          { label: 'Reporting Period', value: period },
          { label: 'Generated', value: generated },
        ].map(({ label, value }) => (
          <View key={label} style={styles.metaItem}>
            <Text style={styles.metaLabel}>{label}</Text>
            <Text style={styles.metaValue}>{value}</Text>
          </View>
        ))}
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: 0,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },

  // Decorative backgrounds
  bgTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 340,
    height: 340,
    backgroundColor: '#EFEDFF',
    borderBottomLeftRadius: 340,
    opacity: 0.7,
  },
  bgBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 280,
    height: 280,
    backgroundColor: '#FDEEE7',
    borderTopRightRadius: 280,
    opacity: 0.7,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 76,
    paddingTop: 64,
  },
  docTagPill: {
    borderWidth: 1,
    borderColor: C.purple,
    borderRadius: 100,
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  docTagText: {
    fontFamily: 'Poppins',
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: C.purple,
    fontWeight: 600,
  },

  // Title block
  titleBlock: {
    paddingHorizontal: 76,
    flex: 1,
    justifyContent: 'center',
    paddingTop: 60,
  },
  titleLine: {
    fontFamily: 'Poppins',
    fontSize: 78,
    lineHeight: 0.94,
    letterSpacing: -3.5,
    fontWeight: 700,
    color: C.text,
  },
  titleLineAccent: {
    color: C.purple,
    fontStyle: 'italic',
    fontWeight: 600,
  },
  subtitle: {
    marginTop: 36,
    fontSize: 17,
    color: C.textSoft,
    lineHeight: 1.55,
    fontFamily: 'Inter',
    fontWeight: 400,
  },

  // Meta grid
  metaGrid: {
    flexDirection: 'row',
    paddingHorizontal: 76,
    paddingTop: 28,
    paddingBottom: 72,
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginHorizontal: 76,
  },
  metaItem: {
    flex: 1,
    marginRight: 32,
  },
  metaLabel: {
    fontFamily: 'Poppins',
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: C.muted,
    marginBottom: 8,
    fontWeight: 600,
  },
  metaValue: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: C.text,
    fontWeight: 500,
  },
});
