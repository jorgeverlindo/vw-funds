import type { CSSProperties } from 'react';

// ─── Color palette (extracted from vw-funds-report.html) ─────────────────────
export const C = {
  purple:     '#6050E0',
  purpleLight:'#A8A8F8',
  purpleSoft: '#EFEDFF',
  coral:      'rgba(247,134,100,0.9)',
  coralSolid: '#F78664',
  coralSoft:  '#FDEEE7',
  green:      '#51B994',
  greenSoft:  '#E2F4EC',
  text:       '#14141B',
  textSoft:   '#2D2D38',
  muted:      '#6B6B78',
  muted2:     '#95959F',
  border:     '#E8E8EE',
  borderSoft: '#F1F1F5',
  bgSoft:     '#FAFAFD',
  bgPage:     '#E6E6EC',
  white:      '#ffffff',
} as const;

// ─── Font stacks ─────────────────────────────────────────────────────────────
export const F = {
  poppins: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
  inter:   "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
} as const;

// ─── Shared style objects ─────────────────────────────────────────────────────

export const S = {
  // Section tag line + label
  sectionTag: {
    display:       'flex',
    alignItems:    'center',
    gap:           '12px',
    fontFamily:    F.poppins,
    fontSize:      '11px',
    letterSpacing: '0.22em',
    textTransform: 'uppercase' as const,
    color:         C.purple,
    fontWeight:    600,
    marginBottom:  '18px',
  } satisfies CSSProperties,

  // Section titles (40px / Poppins 600)
  sectionTitle: {
    fontFamily:    F.poppins,
    fontSize:      '40px',
    fontWeight:    600,
    letterSpacing: '-0.035em',
    lineHeight:    1.1,
    marginBottom:  '28px',
    color:         C.text,
    maxWidth:      '580px',
  } satisfies CSSProperties,

  // Sub-heading (h2)
  subHeading: {
    fontFamily:    F.poppins,
    fontSize:      '16px',
    fontWeight:    600,
    letterSpacing: '-0.005em',
    color:         C.text,
    margin:        '32px 0 12px',
  } satisfies CSSProperties,

  // Lead text
  lead: {
    fontSize:   '16px',
    lineHeight: 1.7,
    color:      C.textSoft,
    maxWidth:   '640px',
    fontFamily: F.inter,
  } satisfies CSSProperties,

  // Body text
  body: {
    fontFamily:    F.inter,
    fontSize:      '14px',
    lineHeight:    1.65,
    color:         C.textSoft,
    marginBottom:  '12px',
  } satisfies CSSProperties,

  // Uppercase label (KPI, cover meta, etc.)
  label: {
    fontFamily:    F.poppins,
    fontSize:      '10px',
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    color:         C.muted,
    fontWeight:    600,
    marginBottom:  '8px',
  } satisfies CSSProperties,

  // Horizontal divider
  divider: {
    height:     '1px',
    background: C.border,
    margin:     '44px 0',
  } satisfies CSSProperties,
} as const;

// ─── Chart color sequences ────────────────────────────────────────────────────
export const CHART_COLORS = [C.purple, C.coral, C.green, C.purpleLight, C.coralSolid] as const;

// ─── Constellation logo ───────────────────────────────────────────────────────
// Only the three concentric arc paths that form the circular icon mark.
// Use with: <svg width="…" height="…" viewBox="0 0 18 33" fill="none">
// The wordmark text ("CONSTELLATION") is rendered as a styled <span> next to
// this SVG so html2canvas captures the full name reliably (the old full-path
// approach was missing S, L, L and T glyphs).
export const LOGO_ICON_PATHS = `
  <path d="M2.22422 16.0471C2.22422 7.57204 8.61025 0.631495 16.6988 0.0413128C16.332 0.0118036 15.9594 0 15.5867 0C6.97648 0 0 7.18252 0 16.0471C0 24.9116 6.97648 32.0941 15.5867 32.0941C15.9594 32.0941 16.332 32.0823 16.6988 32.0528C8.61025 31.4626 2.22422 24.5221 2.22422 16.0471Z" fill="#1F1D25"/>
  <path d="M6.12234 16.047C6.12234 9.69073 10.9089 4.48533 16.9796 4.04269C16.7045 4.02498 16.4236 4.01318 16.1427 4.01318C9.6879 4.01318 4.4541 9.40154 4.4541 16.047C4.4541 22.6924 9.6879 28.0808 16.1427 28.0808C16.4236 28.0808 16.7045 28.069 16.9796 28.0513C10.9146 27.6086 6.12234 22.4032 6.12234 16.047Z" fill="rgba(31,29,37,0.45)"/>
  <path d="M17.2605 8.04407C17.0771 8.03227 16.8937 8.02637 16.7045 8.02637C12.3994 8.02637 8.9082 11.6206 8.9082 16.0529C8.9082 20.4851 12.3994 24.0793 16.7045 24.0793C16.8937 24.0793 17.0771 24.0734 17.2605 24.0557C13.2134 23.7606 10.0261 20.2904 10.0261 16.0529C10.0261 11.8154 13.2191 8.34507 17.2605 8.04998V8.04407Z" fill="rgba(31,29,37,0.2)"/>
`;

// Legacy alias kept for any existing imports that reference LOGO_PATHS.
export const LOGO_PATHS = LOGO_ICON_PATHS;
