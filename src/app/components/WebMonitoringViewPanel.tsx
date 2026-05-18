// [FV] WebMonitoringViewPanel — view-mode panel, decomposed from WebMonitoringPanel.tsx

import { useState, useRef, ChangeEvent, DragEvent, ReactNode } from 'react';
import { Star, X, ShieldAlert, Check, UploadCloud } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { WCMItem } from './WebMonitoringContent';
import { StatusChip, SeverityChip } from './StatusChip';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { InteractiveAnnotation, type PinDirection } from './pre-approval/InteractiveAnnotation';
import { emitSnackbar } from './Snackbar';
import { type PanelCaseSolution } from './WebMonitoringPanel';
import type { WCMComment } from '../../data/types/compliance';
import { WorkflowHistoryTimeline } from './WorkflowHistoryTimeline';
import type { WorkflowEvent } from '../contexts/WorkflowContext';

// Jack Daniels VW thumbnail — from RpWebMonitoring Figma component
import imgScreenshot from 'figma:asset/474e8b063908875e688d0c1396b3726c6afa9ce4.png';

// ─── Shared helpers ───────────────────────────────────────────────────────────

// [FV] strip protocol + leading www. for the chrome bar URL display
export function stripUrlForChrome(url: string): string {
  return url.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
}

// [FV] format ISO datetime for the solution summary row
export function formatSolutionDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

// [FV] início — single source of truth for the screenshot annotations
// Drives both the InteractiveAnnotation pins (Issue Preview) and the numbered list (Comments).

interface ViolationPin {
  title: string;
  description: string;
  x: number;
  y: number;
  direction: PinDirection;
}

export function getPinsForItem(item: WCMItem, t: (s: string) => string): ViolationPin[] {
  const isOemLogo = item.source === 'Manually Added' && /oem logo/i.test(item.violationType);
  // [FV] dealer-reported "Missing Disclosure" → single pin at the same anchor
  if (item.source === 'Manually Added' && /missing disclosure/i.test(item.violationType)) {
    return [
      {
        title: t('Missing Disclosure'),
        description: t('Required compliance disclosure is missing from the ad.'),
        x: 26, y: 5, direction: 'top-left',
      },
    ];
  }
  if (isOemLogo) {
    return [
      {
        title: t('Incorrect OEM logo usage'),
        description: t('The logo formatting, with address info between the OEM and the dealership logo, is a compliance infraction.'),
        // [FV] over the address text — between the VW (left) and Jack Daniels (center-right) logos
        x: 26, y: 5, direction: 'top-left',
      },
    ];
  }
  // Default: two "Missing Legal Disclaimer" pins on the offer cards
  const title = t('Missing Legal Disclaimer');
  const description = t('Offer card displays payment terms without required disclaimer language visible near the promotional copy.');
  return [
    { title, description, x: 18, y: 56, direction: 'top-right' },
    { title, description, x: 48, y: 56, direction: 'top-left' },
  ];
}
// [FV] fim

// [FV] left-aligned row layout — fixed-width label + flexed value
const ROW_LABEL_CLS = 'text-[#686576] text-[13px] font-normal w-[160px] flex-shrink-0';
const ROW_VALUE_CLS = 'text-[#1f1d25] text-[13px] font-medium flex-1 text-left';

function LeftKVRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start py-3.5 border-b border-[#F0F0F0] last:border-0 gap-3">
      <span className={ROW_LABEL_CLS}>{label}</span>
      <span className={ROW_VALUE_CLS}>{value}</span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface WebMonitoringViewPanelProps {
  item: WCMItem;
  onClose: () => void;
  onOpenModal?: () => void;
  userType?: 'dealer' | 'dealer-singular' | 'dealer-emich' | 'oem';
  solution?: PanelCaseSolution;
  onSubmitSolution?: (draft: { screenshotDataUrl: string; comment: string }) => void;
  onMarkSolved?: () => void;
  onAcceptReport?: () => void;
  currentDealerName?: string;
  // Discussion thread
  wcmComments?: WCMComment[];
  onAddComment?: (text: string) => void;
  currentUserName?: string;
}

export function WebMonitoringViewPanel({
  item, onClose, onOpenModal, userType = 'oem',
  solution, onSubmitSolution, onMarkSolved, onAcceptReport,
  currentDealerName, wcmComments = [], onAddComment, currentUserName,
}: WebMonitoringViewPanelProps) {
  const { t } = useTranslation();
  // FIX 2 — annotation toggle state; start closed (pin) per spec
  const [annotationStates, setAnnotationStates] = useState({ '1': false, '2': false });

  // Discussion thread
  const [commentDraft, setCommentDraft] = useState('');
  const handleSendComment = () => {
    const text = commentDraft.trim();
    if (!text) return;
    onAddComment?.(text);
    setCommentDraft('');
  };

  // [FV] início — Issue Solution section (dealer-only)
  const solutionInputRef = useRef<HTMLInputElement>(null);
  const [solutionScreenshot, setSolutionScreenshot] = useState<string | null>(null);
  const [solutionComment, setSolutionComment] = useState('');
  const [solutionDragOver, setSolutionDragOver] = useState(false);
  const [solutionDropError, setSolutionDropError] = useState<string | null>(null);

  function handleSolutionFile(file: File) {
    setSolutionDropError(null);
    if (!/^image\/(png|jpe?g)$/.test(file.type)) {
      setSolutionDropError(t('Only PNG or JPG screenshots are accepted.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSolutionScreenshot(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function onSolutionDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setSolutionDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleSolutionFile(f);
  }

  function onSolutionSelectFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleSolutionFile(f);
  }
  // [FV] fim

  const handleOpenModal = () => {
    onOpenModal?.();
  };

  // [FV] início — derived display values
  const screenshotSrc = item.screenshotDataUrl ?? imgScreenshot;
  const chromeUrl = stripUrlForChrome(item.url);
  const pins = getPinsForItem(item, t);
  // Status displayed in header overrides item.status when there's a submitted solution
  const displayStatus = solution?.solved ? 'Solved' : solution ? 'Solution Submitted' : item.status;

  // Viewer-role derivations (dealer privacy rules)
  // isTargetDealer  → the viewing dealer is the accused party → anonymize reporter in Activity
  // isReportingDealer → the viewing dealer is the one who filed the report → hide Activity + Issue Solution
  const isTargetDealer    = userType !== 'oem' && !!currentDealerName && item.dealership === currentDealerName;
  const isReportingDealer = userType !== 'oem' && !!item.reportedBy && item.reportedBy === currentUserName;
  // [FV] fim

  return (
    <>
      <div className="flex flex-col h-full bg-white">

        {/* ── FIX 1: Header — exact spec, verbatim from ClaimsPanel ── */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-[#E0E0E0] shrink-0">
          <div className="flex flex-col min-w-0">
            <h2 className="text-[#1f1d25] text-[20px] font-medium tracking-[0.15px] leading-tight truncate">
              {item.id}
            </h2>
            <span className="text-sm text-[#686576] mt-1">{t('Website Compliance Case')}</span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E0E0E0] hover:bg-gray-50 transition-colors cursor-pointer">
                <Star className="w-3.5 h-3.5 text-[#9C99A9]" />
                <span className="text-[13px] font-medium text-[#1f1d25]/80">{t('Follow')}</span>
              </button>
              <StatusChip status={displayStatus /* [FV] solution overrides */} />
            </div>
            <div className="w-px h-6 bg-[#E0E0E0]" />
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
              <X className="w-5 h-5 text-[#686576]" />
            </button>
          </div>
        </div>

        {/* ── Body — scrollable ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="px-8 py-6 space-y-6">

            {/* [FV] reordered: Issue Preview → Comments → Violation Details (matches create form) */}

            {/* ── Section: Issue Preview ── */}
            <section>
              {/* Header row */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-[#1f1d25] text-[15px] font-medium">{t('Issue Preview')}</h3>
                  <p className="text-[11px] text-[#9C99A9] mt-1">
                    {t('Annotated evidence captured from the monitored dealership page.')}
                  </p>
                </div>
              </div>

              {/* ── FIX 2: Preview thumbnail with InteractiveAnnotation ── */}
              {/*
                Outer wrapper has border + rounded but NO overflow-hidden so annotations
                can expand outside the image bounds. Chrome bar gets rounded-t-2xl,
                image gets rounded-b-2xl. Screenshot area has overflow-visible.
              */}
              <div
                className="mt-3 rounded-2xl border border-[rgba(0,0,0,0.12)] cursor-pointer hover:shadow-md transition-shadow"
                onClick={handleOpenModal}
              >
                {/* Chrome bar */}
                <div className="bg-white border-b border-[rgba(0,0,0,0.08)] px-3 py-2 flex items-center gap-2 rounded-t-2xl">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57] flex-shrink-0" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E] flex-shrink-0" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#28C840] flex-shrink-0" />
                  <span className="flex-1 text-[10px] text-[#9C99A9] truncate">
                    {/* [FV] use the actual stored URL */}
                    {chromeUrl}
                  </span>
                </div>

                {/* Screenshot area — relative + overflow-visible for annotation expansion */}
                <div className="relative overflow-visible">
                  {/* Image clipped at its own level */}
                  <div className="max-h-[260px] overflow-hidden rounded-b-2xl">
                    <ImageWithFallback
                      src={screenshotSrc /* [FV] uploaded screenshot when present */}
                      alt={item.dealership + ' website screenshot'}
                      className="w-full object-cover object-top"
                    />
                  </div>

                  {/* [FV] pins driven by getPinsForItem — same source feeds the Comments numbered list */}
                  {pins.map((pin, idx) => {
                    const key = String(idx + 1);
                    return (
                      <InteractiveAnnotation
                        key={key}
                        id={`pin-${key}`}
                        number={idx + 1}
                        category="WCM"
                        title={pin.title}
                        description={pin.description}
                        x={pin.x}
                        y={pin.y}
                        isOpen={!!(annotationStates as Record<string, boolean>)[key]}
                        onToggle={() => setAnnotationStates(prev => ({ ...(prev as Record<string, boolean>), [key]: !(prev as Record<string, boolean>)[key] }))}
                        direction={pin.direction}
                        showCategory={false}
                      />
                    );
                  })}
                </div>
              </div>
            </section>

            {/* [FV] início — Comments section (after Issue Preview): numbered list replicating the red-pin contents */}
            <section>
              <h3 className="text-[#1f1d25] text-[15px] font-medium mb-3">{t('Comments')}</h3>
              <ol className="list-decimal list-inside space-y-2 text-[13px] text-[#1f1d25]">
                {pins.map((pin, idx) => (
                  <li key={idx} className="leading-relaxed">
                    <span className="font-medium">{pin.title}</span>
                    <span className="text-[#686576]"> — {pin.description}</span>
                  </li>
                ))}
              </ol>
            </section>
            {/* [FV] fim */}

            {/* ── Section: Violation Details ── */}
            {/* [FV] uses LeftKVRow (local) instead of KeyValueRow so values stay left-aligned */}
            <section>
              <h3 className="text-[#1f1d25] text-[15px] font-medium mb-4">{t('Violation Details')}</h3>
              <div className="space-y-0">
                <LeftKVRow label={t('Detected On')}    value={item.detectedOn} />
                <LeftKVRow label={t('Dealership')}     value={item.dealership} />
                <LeftKVRow label={t('Violation Type')} value={item.violationType} />
                <LeftKVRow label={t('Source')}         value={t(item.source)} />
                <LeftKVRow label={t('Channel')}        value={t('Website')} />
                <LeftKVRow
                  label={t('Website / URL')}
                  value={
                    <a
                      href={/^https?:\/\//i.test(item.url) ? item.url : `https://${item.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#473BAB] hover:underline"
                    >
                      {item.url}
                    </a>
                  }
                />
                <LeftKVRow label={t('Severity')} value={<SeverityChip severity={item.severity} />} />
                {/* [FV] Reported by — hidden from the *target* dealer (they shouldn't see who reported them) */}
                {(() => {
                  const isTargetDealer = userType !== 'oem' && !!currentDealerName && item.dealership === currentDealerName;
                  const display = item.reportedBy && !isTargetDealer
                    ? item.reportedBy
                    : <span className="text-[#9C99A9]">—</span>;
                  return <LeftKVRow label={t('Reported by')} value={display} />;
                })()}
              </div>
            </section>

            {/* ── Section: Activity ── */}
            {!isReportingDealer && (() => {
              // Creation event — hide reporter identity from the accused dealer
              const creationEvent: WorkflowEvent = isTargetDealer
                ? {
                    id: `create-${item.id}`,
                    timestamp: item.createdAtISO ?? new Date(item.detectedOn).toISOString(),
                    actor: 'OEM',
                    actorName: 'Compliance Team',
                    action: `Compliance infraction reported against ${item.dealership}`,
                  }
                : {
                    id: `create-${item.id}`,
                    timestamp: item.createdAtISO ?? new Date(item.detectedOn).toISOString(),
                    actor: item.reportedBy ? 'Dealer' : 'OEM',
                    actorName: item.reportedBy ?? 'OEM',
                    action: item.reportedBy
                      ? `Reported a compliance infraction against ${item.dealership}`
                      : `Compliance infraction added for ${item.dealership}`,
                  };

              const events: WorkflowEvent[] = [
                creationEvent,
                // Solution submission
                ...(solution ? [{
                  id: `solution-${item.id}`,
                  timestamp: solution.submittedAtISO,
                  actor: 'Dealer' as const,
                  actorName: solution.submittedBy,
                  action: 'Solution submitted',
                  comment: solution.comment || undefined,
                }] : []),
                // OEM/dealer notes
                ...wcmComments.map(c => ({
                  id: c.id,
                  timestamp: c.timestampISO,
                  actor: c.role === 'oem' ? 'OEM' as const : 'Dealer' as const,
                  actorName: c.author,
                  action: c.role === 'oem' ? 'OEM note' : 'Note added',
                  comment: c.text,
                })),
              ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

              return (
                <section>
                  <WorkflowHistoryTimeline history={events} />
                </section>
              );
            })()}

            {/* [FV] início — Issue Solution: dealer form when no solution; read-only summary (dealer + OEM) once submitted */}
            {/* Reporting dealer never sees Issue Solution — privacy rule */}
            {!isReportingDealer && (userType !== 'oem' || !!solution) && (
              <section>
                <h3 className="text-[#1f1d25] text-[15px] font-medium mb-3">{t('Issue Solution')}</h3>

                {solution ? (
                  // ── Read-only summary (visible to both dealer and OEM after submit) ──
                  <div className="rounded-2xl border border-[rgba(0,0,0,0.12)] overflow-hidden">
                    {solution.screenshotDataUrl ? (
                      <div className="overflow-hidden">
                        <img src={solution.screenshotDataUrl} alt="Submitted solution screenshot" className="w-full max-h-[260px] object-cover object-top" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-8 bg-[#FAFAFB] text-[13px] text-[#9C99A9]">
                        Screenshot not available
                      </div>
                    )}
                    <div className="px-4 py-3 border-t border-[rgba(0,0,0,0.08)]">
                      <p className="text-[13px] text-[#1f1d25] leading-relaxed">{solution.comment}</p>
                      <div className="mt-2 flex items-center gap-2 text-[12px] text-[#686576]">
                        <span className="font-medium text-[#1f1d25]">{solution.submittedBy}</span>
                        <span>·</span>
                        <span>{formatSolutionDateTime(solution.submittedAtISO)}</span>
                        {solution.solved && (
                          <>
                            <span>·</span>
                            <span className="text-[#1b5e20] font-medium">{t('Marked as solved')}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  // ── Dealer-only form (only renders when no solution yet) ──
                  <>
                    <input
                      ref={solutionInputRef}
                      type="file"
                      accept="image/png,image/jpeg"
                      className="hidden"
                      onChange={onSolutionSelectFile}
                    />

                    {!solutionScreenshot ? (
                      <div
                        onDragOver={(e) => { e.preventDefault(); setSolutionDragOver(true); }}
                        onDragLeave={() => setSolutionDragOver(false)}
                        onDrop={onSolutionDrop}
                        onClick={() => solutionInputRef.current?.click()}
                        className={`rounded-2xl border-2 border-dashed transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 py-10 px-6 text-center ${
                          solutionDragOver ? 'border-[#473BAB] bg-[rgba(71,59,171,0.04)]' : 'border-[#D0CFD7] bg-[#FAFAFB] hover:bg-[#F5F4F8]'
                        }`}
                      >
                        <UploadCloud className="w-7 h-7 text-[#9C99A9]" />
                        <p className="text-[13px] font-medium text-[#1f1d25]">
                          {t('Drag a screenshot of the fix here, or click to browse')}
                        </p>
                        <p className="text-[11px] text-[#9C99A9]">PNG or JPG · max 10MB</p>
                        {solutionDropError && <p className="text-[11px] text-[#D2323F] mt-1">{solutionDropError}</p>}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-[rgba(0,0,0,0.12)] relative">
                        <div className="overflow-hidden rounded-2xl max-h-[220px]">
                          <img src={solutionScreenshot} alt="Solution screenshot" className="w-full max-h-[220px] object-cover object-top" />
                        </div>
                        <button
                          type="button"
                          onClick={() => solutionInputRef.current?.click()}
                          className="absolute top-2 right-2 px-3 py-1 rounded-full bg-white/90 text-[11px] font-medium text-[#1f1d25] border border-[#E0E0E0] hover:bg-white cursor-pointer"
                        >
                          {t('Replace')}
                        </button>
                      </div>
                    )}

                    <textarea
                      className="mt-3 w-full bg-white border border-[#E0E0E0] rounded-md px-3 py-2 text-[13px] text-[#1f1d25] focus:outline-none focus:border-[#473BAB] focus:ring-1 focus:ring-[#473BAB] resize-none"
                      rows={3}
                      value={solutionComment}
                      onChange={(e) => setSolutionComment(e.target.value)}
                      placeholder={t('Add a note for the OEM…')}
                    />
                  </>
                )}
              </section>
            )}
            {/* [FV] fim */}

          </div>
        </div>

        {/* ── Footer: OEM note composer — Send Note button removed; note is flushed on primary action ── */}
        {userType === 'oem' && (
          <div className="px-8 pt-3 pb-0 border-t border-[#E0E0E0] flex-shrink-0">
            <textarea
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSendComment(); }}
              placeholder={t('Write a note to the dealer…')}
              rows={2}
              className="w-full bg-white border border-[#E0E0E0] rounded-xl px-3 py-2 text-[13px] text-[#1f1d25] placeholder:text-[#9C99A9] resize-none focus:outline-none focus:border-[var(--brand-accent)] focus:ring-1 focus:ring-[var(--brand-accent)] transition-colors"
            />
          </div>
        )}

        {/* ── Footer action bar — [FV] dynamic per userType + solution state ── */}
        <div className={`flex items-center justify-end gap-3 px-8 py-4 flex-shrink-0 ${userType !== 'oem' ? 'border-t border-[#E0E0E0]' : ''}`}>
          {/* OEM-only secondary buttons — Assign Penalty visible until case is fully solved */}
          {userType === 'oem' && !solution?.solved && (
            <>
              <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#D2323F] text-[#be0e1c] text-[13px] font-medium hover:bg-[rgba(210,50,63,0.08)] transition-colors cursor-pointer whitespace-nowrap">
                <ShieldAlert className="w-4 h-4" />
                {t('Assign Penalty')}
              </button>
              {!solution && (
                <button
                  onClick={onClose}
                  className="px-6 py-2 rounded-full text-sm font-medium text-[#111014]/60 hover:bg-black/5 transition-colors cursor-pointer"
                >
                  {t('Cancel')}
                </button>
              )}
            </>
          )}

          {/* Primary action — varies by role + solution state + dealer-report acceptance */}
          {(() => {
            // Reporting dealer: no actions available (read-only view)
            if (isReportingDealer) return null;
            // Dealer: hide primary once solution submitted (read-only summary takes over)
            if (userType !== 'oem' && solution) return null;
            // OEM: hide primary once case is solved
            if (userType === 'oem' && solution?.solved) return null;

            const isDealerSubmit = userType !== 'oem';
            // [FV] OEM viewing a Pending dealer-report → primary action is Accept Report
            const isOemAcceptReport = userType === 'oem' && !!item.reportedBy && item.status === 'Pending' && !solution;
            const isOemMarkSolved = userType === 'oem' && !!solution && !solution.solved;
            const label = isDealerSubmit
              ? t('Submit Solution')
              : isOemAcceptReport
                ? t('Accept Report')
                : isOemMarkSolved
                  ? t('Mark as Solved')
                  : t('Mark As Reviewed');
            const disabled = isDealerSubmit && !(solutionScreenshot && solutionComment.trim());

            const handleClick = () => {
              if (isDealerSubmit) {
                if (!solutionScreenshot || !solutionComment.trim()) return;
                onSubmitSolution?.({ screenshotDataUrl: solutionScreenshot, comment: solutionComment.trim() });
                emitSnackbar(t('Solution submitted to OEM for review'));
                return;
              }
              // Flush any pending note before executing the primary OEM action
              if (commentDraft.trim()) {
                onAddComment?.(commentDraft.trim());
                setCommentDraft('');
              }
              if (isOemAcceptReport) {
                onAcceptReport?.();
                emitSnackbar(t('Report accepted — status moved to Open'));
                return;
              }
              if (isOemMarkSolved) {
                onMarkSolved?.();
                emitSnackbar(t('Case marked as solved'));
                return;
              }
              // OEM Mark As Reviewed default — visual demo only
            };

            return (
              <button
                onClick={handleClick}
                disabled={disabled}
                className="flex items-center gap-2 px-6 py-2 bg-[#473BAB] hover:bg-[#3D3295] disabled:bg-[#D0CFD7] disabled:cursor-not-allowed text-white rounded-full text-sm font-medium transition-colors shadow-sm cursor-pointer whitespace-nowrap"
              >
                <Check className="w-4 h-4" />
                {label}
              </button>
            );
          })()}
        </div>

      </div>
    </>
  );
}
