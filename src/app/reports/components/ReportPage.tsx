import type { CSSProperties, ReactNode } from 'react';
import { C, F, LOGO_PATHS } from '../tokens';

interface ReportPageProps {
  children: ReactNode;
  period?: string;
  reportTitle?: string;
  pageNum?: number;
}

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&display=swap');`;

const pageStyle: CSSProperties = {
  width: '820px',
  minHeight: '1100px',
  background: '#ffffff',
  padding: '84px 76px 72px',
  position: 'relative',
  boxSizing: 'border-box',
  fontFamily: F.inter,
  fontSize: '14px',
  lineHeight: 1.55,
  color: C.text,
  WebkitFontSmoothing: 'antialiased',
};

const runnerStyle: CSSProperties = {
  position: 'absolute',
  left: '76px',
  right: '76px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '10px',
  color: C.muted,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  fontFamily: F.inter,
};

/** Scaled-down wordmark for page headers (54% of original 176×33). */
function LogoSm() {
  return (
    <svg width="96" height="18" viewBox="0 0 176 33" fill="none" xmlns="http://www.w3.org/2000/svg"
      dangerouslySetInnerHTML={{ __html: LOGO_PATHS }}
    />
  );
}

export function ReportPage({ children, period = "Apr '25 — Apr '26", reportTitle = 'VW Funds Report', pageNum }: ReportPageProps) {
  return (
    <div style={{ ...pageStyle, pageBreakAfter: 'always', breakAfter: 'page' }}>
      <style dangerouslySetInnerHTML={{ __html: FONT_IMPORT }} />

      {/* Header */}
      <div style={{ ...runnerStyle, top: '30px', paddingBottom: '14px', borderBottom: `1px solid ${C.borderSoft}` }}>
        <LogoSm />
        <span>{period}</span>
      </div>

      {/* Content */}
      {children}

      {/* Footer */}
      <div style={{ ...runnerStyle, bottom: '32px', paddingTop: '14px', borderTop: `1px solid ${C.borderSoft}`, color: C.muted2 }}>
        <span>Constellation — {reportTitle}</span>
        {pageNum && <span>p. {pageNum.toString().padStart(2, '0')}</span>}
      </div>
    </div>
  );
}
