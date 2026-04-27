import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MonitorStage = 'preparing' | 'complete' | 'error' | 'cancelled';

export interface MonitorState {
  stage:       MonitorStage;
  reportName:  string;   // "Fund Allocation Report"
  displayName: string;   // "Fund Allocation Report.pdf"
  blobUrl:     string | null;
}

interface ActivityMonitorProps extends MonitorState {
  onClose: () => void;
}

// ─── Design tokens (matches Figma "Activity Monitor 2.0") ────────────────────

const T = {
  borderBlue:  '#5151D3',
  borderRed:   '#E53E3E',
  headerBg:    '#F2F2F5',
  bodyBg:      '#ffffff',
  cancelledBg: '#2D2D38',
  textDark:    '#1F1D25',
  textMuted:   '#6B6B78',
  green:       '#22C55E',
  red:         '#E53E3E',
  white:       '#ffffff',
} as const;

// ─── Keyframes (injected once into <head>) ────────────────────────────────────

const CSS = `
  @keyframes amSlideIn {
    from { transform: translateY(110%); }
    to   { transform: translateY(0);    }
  }
  @keyframes amSlideOut {
    from { transform: translateY(0);    }
    to   { transform: translateY(110%); }
  }
`;

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChevronIcon({ up }: { up: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
      style={{ transform: up ? 'rotate(180deg)' : 'none', transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)' }}>
      <path d="M4 6L8 10L12 6" stroke={T.textMuted} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function XIcon({ color = T.textMuted }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M1 1L13 13M13 1L1 13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function PdfFileIcon() {
  return (
    <svg width="28" height="34" viewBox="0 0 28 34" fill="none">
      <path d="M4 0h15l9 9v21a4 4 0 01-4 4H4a4 4 0 01-4-4V4a4 4 0 014-4z" fill="#E8E8EE"/>
      <path d="M19 0l9 9h-5a4 4 0 01-4-4V0z" fill="#C8C8D4"/>
      <text x="14" y="26" textAnchor="middle" fontSize="7" fontWeight="700"
        fontFamily="Inter,system-ui,sans-serif" fill="#6B6B78" letterSpacing="0.5">PDF</text>
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <circle cx="11" cy="11" r="9" stroke="#E8E8EE" strokeWidth="2.5"/>
      <path d="M11 2a9 9 0 019 9" stroke={T.borderBlue} strokeWidth="2.5" strokeLinecap="round"
        style={{ animation: 'spin 0.8s linear infinite', transformOrigin: '11px 11px' }}/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="11" fill={T.green}/>
      <path d="M6 11.5L9.5 15L16 8" stroke={T.white} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M11 2L21 20H1L11 2z" fill={T.red}/>
      <text x="11" y="17" textAnchor="middle" fontSize="9" fontWeight="700"
        fontFamily="Inter,system-ui,sans-serif" fill={T.white}>!</text>
    </svg>
  );
}

// ─── Icon button base style ───────────────────────────────────────────────────

const iconBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  padding: 6, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
};

// ─── Main component ───────────────────────────────────────────────────────────

export function ActivityMonitor({ stage, displayName, blobUrl, onClose }: ActivityMonitorProps) {
  const [collapsed,  setCollapsed]  = useState(false);
  const [isExiting,  setIsExiting]  = useState(false);

  // Reset collapsed state whenever a new download stage begins
  useEffect(() => { setCollapsed(false); }, [stage]);

  // Intercept close: play exit animation, then call real onClose
  const handleClose = () => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(onClose, 400);
  };

  const isCancelled = stage === 'cancelled';
  const isError     = stage === 'error';
  const borderColor = isError ? T.borderRed : T.borderBlue;

  const stageLabel: Record<MonitorStage, string> = {
    preparing: 'Preparing download',
    complete:  'Download complete',
    error:     'Download failed',
    cancelled: 'Download cancelled',
  };

  const node = (
    <>
      {/* Inject keyframes once */}
      <style>{CSS}</style>

      <div style={{
        position:    'fixed',
        bottom:      0,
        left:        24,
        zIndex:      9999,
        width:       340,
        borderRadius: '12px 12px 0 0',
        overflow:    'hidden',
        boxShadow:   '0 -2px 20px rgba(0,0,0,0.12)',
        fontFamily:  "'Inter', system-ui, -apple-system, sans-serif",
        WebkitFontSmoothing: 'antialiased',
        // Slide-in on mount, slide-out on dismiss
        animation: isExiting
          ? 'amSlideOut 0.4s cubic-bezier(0.4,0,1,1) forwards'
          : 'amSlideIn  0.4s cubic-bezier(0,0,0.2,1) forwards',
        ...(isCancelled
          ? { background: T.cancelledBg }
          : { border: `2px solid ${borderColor}`, borderBottom: 'none', background: T.bodyBg }),
      }}>

        {/* ── Cancelled ──────────────────────────────────────────────────────── */}
        {isCancelled ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 10px 0 16px', height: 46,
          }}>
            <span style={{ color: T.white, fontSize: 13, fontWeight: 500 }}>
              {stageLabel.cancelled}
            </span>
            <button onClick={handleClose} style={iconBtn} aria-label="Close">
              <XIcon color={T.white} />
            </button>
          </div>

        /* ── Default / Error / Complete ────────────────────────────────────── */
        ) : (
          <>
            {/* Header */}
            <div style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              padding:        '0 10px 0 16px',
              height:         46,
              background:     T.headerBg,
              gap:            4,
            }}>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: T.textDark, lineHeight: 1 }}>
                {stageLabel[stage]}
              </span>

              <button
                onClick={() => setCollapsed(c => !c)}
                style={iconBtn}
                aria-label={collapsed ? 'Expand' : 'Collapse'}
              >
                <ChevronIcon up={collapsed} />
              </button>

              <button onClick={handleClose} style={iconBtn} aria-label="Close">
                <XIcon />
              </button>
            </div>

            {/* File row — slides out/in when collapsing/expanding */}
            <div style={{
              overflow:   'hidden',
              height:     collapsed ? 0 : 56,
              transition: 'height 0.4s cubic-bezier(0.4,0,0.2,1)',
            }}>
              <div
                role={blobUrl ? 'button' : undefined}
                tabIndex={blobUrl ? 0 : undefined}
                onClick={() => blobUrl && window.open(blobUrl, '_blank')}
                onKeyDown={e => e.key === 'Enter' && blobUrl && window.open(blobUrl, '_blank')}
                style={{
                  display:    'flex',
                  alignItems: 'center',
                  padding:    '0 14px',
                  height:     56,
                  gap:        12,
                  background: T.bodyBg,
                  cursor:     blobUrl ? 'pointer' : 'default',
                  // Slides down when collapsing, up when expanding
                  transform:  collapsed ? 'translateY(100%)' : 'translateY(0)',
                  transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                <PdfFileIcon />

                <span style={{
                  flex:         1,
                  fontSize:     13,
                  color:        T.textDark,
                  fontWeight:   400,
                  lineHeight:   1.4,
                  overflow:     'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace:   'nowrap',
                }}>
                  {displayName}
                </span>

                {/* Status icon: spinner / check / warning */}
                {stage === 'preparing' && <Spinner />}
                {stage === 'complete'  && <CheckIcon />}
                {stage === 'error'     && <WarningIcon />}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );

  return createPortal(node, document.body);
}
