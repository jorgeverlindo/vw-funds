import type { CSSProperties } from 'react';
import { C, F, LOGO_PATHS } from '../tokens';

interface ReportCoverProps {
  title: string[];          // lines of the title, last line gets accent style
  subtitle: string;
  brand?: string;
  period?: string;
  generated?: string;
  docTag?: string;
}

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&display=swap');`;

export function ReportCover({
  title,
  subtitle,
  brand = 'Volkswagen — All Areas, All Dealerships',
  period = 'April 1, 2025 — April 27, 2026',
  generated = 'April 27, 2026',
  docTag = 'AI · Performance Report',
}: ReportCoverProps) {
  // Use rgba(r,g,b,0) instead of `transparent` for gradient fade stops so that
  // html2canvas interpolates through the same hue rather than through black.
  const coverStyle: CSSProperties = {
    width: '820px',
    minHeight: '1100px',
    padding: '64px 76px 72px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
    background: `
      radial-gradient(ellipse at 110% -10%, ${C.purpleSoft} 0%, rgba(239,237,255,0) 55%),
      radial-gradient(ellipse at -10% 105%, ${C.coralSoft}  0%, rgba(253,238,231,0) 50%),
      #ffffff
    `,
    pageBreakAfter: 'always',
    breakAfter: 'page',
    WebkitFontSmoothing: 'antialiased',
  };

  const titleStyle: CSSProperties = {
    fontFamily:    F.poppins,
    fontSize:      '84px',
    lineHeight:    0.94,
    letterSpacing: '-0.045em',
    fontWeight:    700,
    color:         C.text,
    marginTop:     '180px',
  };

  const accentStyle: CSSProperties = {
    color:      C.purple,
    fontStyle:  'italic',
    fontWeight: 600,
  };

  return (
    <div style={coverStyle}>
      <style dangerouslySetInnerHTML={{ __html: FONT_IMPORT }} />

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Full wordmark SVG sourced from Constellation Logo 2024.svg */}
        <svg width="176" height="33" viewBox="0 0 176 33" fill="none" xmlns="http://www.w3.org/2000/svg"
          dangerouslySetInnerHTML={{ __html: LOGO_PATHS }}
        />
        <div style={{
          fontFamily:    F.poppins,
          fontSize:      '10px',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color:         C.purple,
          padding:       '7px 14px',
          border:        `1px solid ${C.purple}`,
          borderRadius:  '100px',
          fontWeight:    600,
          background:    'rgba(255,255,255,0.6)',
          whiteSpace:    'nowrap',
          lineHeight:    1,
        }}>
          {docTag}
        </div>
      </div>

      {/* Title block */}
      <div>
        <div style={titleStyle}>
          {title.map((line, i) => {
            const isLast = i === title.length - 1;
            return (
              <span key={i}>
                {isLast ? <span style={accentStyle}>{line}</span> : line}
                {i < title.length - 1 && <br />}
              </span>
            );
          })}
        </div>
        <p style={{ marginTop: '36px', fontSize: '17px', color: C.textSoft, maxWidth: '560px', lineHeight: 1.55, fontFamily: F.inter }}>
          {subtitle}
        </p>
      </div>

      {/* Meta grid */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: '1.2fr 1.4fr 1fr',
        gap:                 '32px',
        paddingTop:          '28px',
        borderTop:           `1px solid ${C.border}`,
        marginTop:           '60px',
      }}>
        {[
          { label: 'Brand & Scope',     value: brand },
          { label: 'Reporting Period',  value: period },
          { label: 'Generated',         value: generated },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontFamily: F.poppins, fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: C.muted, marginBottom: '8px', fontWeight: 600 }}>
              {label}
            </div>
            <div style={{ fontFamily: F.inter, fontSize: '14px', color: C.text, fontWeight: 500 }}>
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
