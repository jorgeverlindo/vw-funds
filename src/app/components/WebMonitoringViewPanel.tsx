// [FV] WebMonitoringViewPanel — view-mode panel, decomposed from WebMonitoringPanel.tsx

import { useState, useRef, useEffect, ChangeEvent, DragEvent, ReactNode } from 'react';
import { Star, X, ShieldAlert, Check, UploadCloud, Bell, AlertTriangle, Clock, RefreshCw, CheckCircle2, Scale, ChevronRight, ChevronDown, Plus } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { WCMItem, wcmStatusToChipStatus } from './WebMonitoringContent';
import { StatusChip, SeverityChip } from './StatusChip';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { InteractiveAnnotation, type PinDirection } from './pre-approval/InteractiveAnnotation';
import { emitSnackbar } from './Snackbar';
import { type PanelCaseSolution } from './WebMonitoringPanel';
import type { WCMComment, WCMLifecycleStatus } from '../../data/types/compliance';
import { WorkflowHistoryTimeline } from './WorkflowHistoryTimeline';
import type { WorkflowEvent } from '../contexts/WorkflowContext';
import type { ComplianceConfig } from '../../data/types/client';

// Jack Daniels VW thumbnail — from RpWebMonitoring Figma component
const imgScreenshot = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071062/vw-funds/474e8b063908875e688d0c1396b3726c6afa9ce4.png';

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
  category?: string;
  ruleNumber?: string;
}

export function getPinsForItem(item: WCMItem, t: (s: string) => string): ViolationPin[] {
  // Use stored pins regardless of source — covers both scan-generated and report-infraction items
  if (item.pins && item.pins.length > 0) {
    return item.pins.map(p => ({
      title: p.title,
      description: p.description,
      x: p.x,
      y: p.y,
      direction: p.direction,
      category: p.category,
      ruleNumber: p.ruleNumber,
    }));
  }

  // Fallback: hardcoded positions for manually-added items
  const isOemLogo = item.source === 'Manually Added' && /oem logo/i.test(item.violationType);
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
        x: 26, y: 5, direction: 'top-left',
      },
    ];
  }
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
const ROW_VALUE_CLS = 'text-[#1f1d25] text-[13px] font-medium flex-1 min-w-0 text-left';

function LeftKVRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start py-3.5 border-b border-[#F0F0F0] last:border-0 gap-3">
      <span className={ROW_LABEL_CLS}>{label}</span>
      <span className={ROW_VALUE_CLS}>{value}</span>
    </div>
  );
}

// ─── Lifecycle status picker options ─────────────────────────────────────────
// All DMP states shown in the picker; destructive ones require confirmation.

const LIFECYCLE_STATUS_OPTIONS: { lifecycleStatus: WCMLifecycleStatus; destructive: boolean }[] = [
  { lifecycleStatus: 'DETECTED',            destructive: false },
  { lifecycleStatus: 'IN_REVIEW',           destructive: false },
  { lifecycleStatus: 'NOTIFIED',            destructive: false },
  { lifecycleStatus: 'REMEDIATION_PENDING', destructive: false },
  { lifecycleStatus: 'RE_MONITORING',       destructive: false },
  { lifecycleStatus: 'CURED',               destructive: false },
  { lifecycleStatus: 'APPEAL_GRANTED',      destructive: false },
  { lifecycleStatus: 'APPEAL_DENIED',       destructive: true  },
  { lifecycleStatus: 'DISMISSED',           destructive: true  },
  { lifecycleStatus: 'ESCALATED',           destructive: true  },
];

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
  onPatchItem?: (patch: Partial<WCMItem>) => void;
  currentDealerName?: string;
  // Discussion thread
  wcmComments?: WCMComment[];
  onAddComment?: (text: string) => void;
  currentUserName?: string;
  // DMP Lifecycle actions
  onOpenCase?: () => void;
  onIssueNotificationLetter?: (notificationNumber: number, caseCategory: 'A' | 'B') => void;
  onDismissCase?: () => void;
  onSubmitAppeal?: () => void;
  onDecideAppeal?: (decision: 'granted' | 'denied') => void;
  onMarkReMonitored?: () => void;
  onMarkCured?: () => void;
  onEscalateCase?: () => void;
  onRejectSolution?: () => void;
  complianceConfig?: ComplianceConfig | null;
}

export function WebMonitoringViewPanel({
  item, onClose, onOpenModal, userType = 'oem',
  solution, onSubmitSolution, onMarkSolved, onAcceptReport, onPatchItem,
  currentDealerName, wcmComments = [], onAddComment, currentUserName,
  onOpenCase, onIssueNotificationLetter, onDismissCase,
  onSubmitAppeal, onDecideAppeal, onMarkReMonitored, onMarkCured, onEscalateCase, onRejectSolution,
  complianceConfig,
}: WebMonitoringViewPanelProps) {
  const { t } = useTranslation();
  // FIX 2 — annotation toggle state; start closed (pin) per spec
  const [annotationStates, setAnnotationStates] = useState({ '1': false, '2': false });

  // OEM findings review: which pin indices are currently accepted
  const [manualPins, setManualPins] = useState<ViolationPin[]>([]);
  const basePins = getPinsForItem(item, t);
  const allPins = [...basePins, ...manualPins];
  const hasMultiplePins = allPins.length > 1;
  const [acceptedPinIndices, setAcceptedPinIndices] = useState<Set<number>>(
    () => new Set(basePins.map((_, i) => i))
  );
  // Reset when item changes (new item selected)
  useEffect(() => {
    setManualPins([]);
    setAcceptedPinIndices(new Set(getPinsForItem(item, t).map((_, i) => i)));
  }, [item.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Manual rule form state
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);
  const [manualRuleCode, setManualRuleCode] = useState('');
  const [manualCategory, setManualCategory] = useState<'A' | 'B'>('A');
  const [manualTitle, setManualTitle] = useState('');
  const [manualDesc, setManualDesc] = useState('');

  function addManualPin() {
    if (!manualTitle.trim()) return;
    const code = manualRuleCode.trim().toUpperCase();
    const newPin: ViolationPin = {
      title: code ? `Rule ${code} — ${manualTitle.trim()}` : manualTitle.trim(),
      description: manualDesc.trim(),
      x: 50,
      y: 50,
      direction: 'top-right',
      category: manualCategory,
      ruleNumber: code || undefined,
    };
    const newIndex = basePins.length + manualPins.length;
    setManualPins(prev => [...prev, newPin]);
    setAcceptedPinIndices(prev => { const next = new Set(prev); next.add(newIndex); return next; });
    setManualRuleCode('');
    setManualCategory('A');
    setManualTitle('');
    setManualDesc('');
    setIsAddRuleOpen(false);
  }

  // Discussion thread
  const [commentDraft, setCommentDraft] = useState('');
  const handleSendComment = () => {
    const text = commentDraft.trim();
    if (!text) return;
    onAddComment?.(text);
    setCommentDraft('');
  };

  // ── DMP Lifecycle derived values ──────────────────────────────────────────
  const lifecycleStatus = item.lifecycleStatus;
  const penaltyLadder = complianceConfig?.penaltyLadder ?? [0, 1, 3, 6, 2];
  const penaltyStep = item.penaltyStep ?? 0;
  const currentPenaltyMonths = penaltyLadder[penaltyStep] ?? 0;
  const nextNotificationNum = (item.notificationNumber ?? 0) + 1;
  const appealDeadlineDate = item.appealDeadline ? new Date(item.appealDeadline) : null;
  const appealDaysLeft = appealDeadlineDate
    ? Math.max(0, Math.ceil((appealDeadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  // Notification Letter confirmation modal state
  const [showNotifModal, setShowNotifModal] = useState(false);
  // Status picker overlay (click the chip in header)
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  // Pending destructive action awaiting confirmation
  const [pendingDestructive, setPendingDestructive] = useState<{ type: 'dismiss' | 'escalate' | 'appeal-deny' } | null>(null);

  // ── DMP Lifecycle derived values — derived case category from pins ─────────
  const confirmedPins = (item.pins ?? []).filter(p => p.findingStatus !== 'rejected');
  const hasAnyCatA = confirmedPins.some(p => p.category === 'A');
  const derivedCaseCategory: 'A' | 'B' = hasAnyCatA ? 'A' : 'B';

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
  // Prefer server-cached screenshot (keyed by content hash — immune to stale ID collisions)
  const screenshotSrc = item.screenshotHash
    ? `http://localhost:3001/api/compliance/screenshot/${item.screenshotHash}`
    : item.screenshotDataUrl || imgScreenshot;
  const chromeUrl = stripUrlForChrome(item.url);
  // OEM finding review: filter pins to only accepted ones; non-OEM sees all
  const pins = userType === 'oem' && hasMultiplePins
    ? allPins.filter((_, i) => acceptedPinIndices.has(i))
    : allPins;
  // Smart crop: center the thumbnail around the first violation's y position.
  // object-position Y=p% + pin top=p% → pin renders exactly at top:p% of container.
  const focalY = pins[0]?.y ?? 0;
  // Status displayed in header: solution yields once OEM has taken a post-submission action
  const POST_SOLUTION_STATUSES: WCMLifecycleStatus[] = ['CURED', 'DISMISSED', 'RE_MONITORING', 'ESCALATED'];
  const oemActedOnSolution = POST_SOLUTION_STATUSES.includes(lifecycleStatus as WCMLifecycleStatus);
  const displayStatus = solution && !solution.solved && !oemActedOnSolution
    ? 'Solution Submitted'
    : item.appealStatus === 'submitted'
      ? 'Appeal Pending'
      : lifecycleStatus
        ? wcmStatusToChipStatus(lifecycleStatus)
        : item.status;

  // Viewer-role derivations (dealer privacy rules)
  // isTargetDealer  → the viewing dealer is the accused party → anonymize reporter in Activity
  // isReportingDealer → the viewing dealer is the one who filed the report → hide Activity + Issue Solution
  const isTargetDealer    = userType !== 'oem' && !!currentDealerName && item.dealership === currentDealerName;
  const isReportingDealer = userType !== 'oem' && !!item.reportedBy && item.reportedBy === currentUserName;
  // [FV] fim

  // ── Status picker: routes to the right action for each lifecycle status ──────
  function handleStatusSelect(newStatus: WCMLifecycleStatus) {
    setShowStatusPicker(false);
    switch (newStatus) {
      case 'IN_REVIEW':
        if (!lifecycleStatus || lifecycleStatus === 'DETECTED') {
          onOpenCase?.();
          emitSnackbar(t('Case opened for review'));
        } else {
          onPatchItem?.({ lifecycleStatus: 'IN_REVIEW' });
          emitSnackbar(t('Status updated to In Review'));
        }
        break;
      case 'NOTIFIED':
        setShowNotifModal(true);
        break;
      case 'DISMISSED':
        setPendingDestructive({ type: 'dismiss' });
        break;
      case 'ESCALATED':
        setPendingDestructive({ type: 'escalate' });
        break;
      case 'APPEAL_DENIED':
        setPendingDestructive({ type: 'appeal-deny' });
        break;
      case 'CURED':
        onMarkCured?.();
        emitSnackbar(t('Case marked as cured'));
        break;
      case 'RE_MONITORING':
        onMarkReMonitored?.();
        emitSnackbar(t('Re-monitoring started'));
        break;
      default:
        onPatchItem?.({ lifecycleStatus: newStatus });
        emitSnackbar(t('Status updated'));
    }
  }

  return (
    <>
      <div className="flex flex-col h-full bg-white relative">

        {/* ── FIX 1: Header — exact spec, verbatim from ClaimsPanel ── */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-[#E0E0E0] shrink-0">
          <div className="flex flex-col min-w-0">
            <h2 className="text-[#1f1d25] text-[20px] font-medium tracking-[0.15px] leading-tight truncate">
              {item.id}
            </h2>
            <span className="text-sm text-[#686576] mt-1">
              {item.channel === 'metaAds' ? t('Meta Ads Compliance Case') : t('Website Compliance Case')}
            </span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E0E0E0] hover:bg-gray-50 transition-colors cursor-pointer">
                <Star className="w-3.5 h-3.5 text-[#9C99A9]" />
                <span className="text-[13px] font-medium text-[#1f1d25]/80">{t('Follow')}</span>
              </button>
              {/* Status chip — OEM can click to open the status picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => userType === 'oem' && setShowStatusPicker(s => !s)}
                  className={`flex items-center gap-1 rounded-lg focus:outline-none ${userType === 'oem' ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-default'}`}
                >
                  <StatusChip status={displayStatus} />
                  {userType === 'oem' && (
                    <ChevronDown className={`w-3 h-3 text-[#9C99A9] transition-transform flex-shrink-0 ${showStatusPicker ? 'rotate-180' : ''}`} />
                  )}
                </button>
                {showStatusPicker && userType === 'oem' && (
                  <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setShowStatusPicker(false)} />
                    <div className="absolute right-0 top-[calc(100%+6px)] z-[70] bg-white rounded-2xl shadow-2xl border border-[rgba(0,0,0,0.12)] p-3 w-[264px]">
                      <p className="text-[10px] font-semibold text-[#9C99A9] uppercase tracking-wider px-1 mb-2">Change Status</p>
                      <div className="space-y-0.5">
                        {LIFECYCLE_STATUS_OPTIONS.map(opt => {
                          const chipLabel = wcmStatusToChipStatus(opt.lifecycleStatus);
                          const isCurrent = lifecycleStatus === opt.lifecycleStatus;
                          return (
                            <button
                              key={opt.lifecycleStatus}
                              type="button"
                              disabled={isCurrent}
                              onClick={() => handleStatusSelect(opt.lifecycleStatus)}
                              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-xl transition-colors text-left ${
                                isCurrent
                                  ? 'opacity-50 cursor-not-allowed'
                                  : opt.destructive
                                    ? 'hover:bg-[rgba(210,50,63,0.06)] cursor-pointer'
                                    : 'hover:bg-[#F5F4F8] cursor-pointer'
                              }`}
                            >
                              <StatusChip status={chipLabel} />
                              <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                                {isCurrent && <span className="text-[10px] text-[#9C99A9]">current</span>}
                                {opt.destructive && !isCurrent && <AlertTriangle className="w-3 h-3 text-[#D2323F]" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
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
                      src={screenshotSrc}
                      alt={item.dealership + ' website screenshot'}
                      className="w-full object-cover"
                      style={{ objectPosition: `50% ${focalY}%` }}
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
                        category={pin.category ?? 'A'}
                        ruleNumber={pin.ruleNumber}
                        title={pin.title}
                        description={pin.description}
                        x={pin.x}
                        y={pin.y}
                        isOpen={!!(annotationStates as Record<string, boolean>)[key]}
                        onToggle={() => setAnnotationStates(prev => ({ ...(prev as Record<string, boolean>), [key]: !(prev as Record<string, boolean>)[key] }))}
                        direction={pin.direction}
                        showCategory={!!(pin.category)}
                      />
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ── OEM Findings Review: only shown while building the case (DETECTED/IN_REVIEW or no lifecycle) ── */}
            {userType === 'oem' && hasMultiplePins && (!lifecycleStatus || lifecycleStatus === 'DETECTED' || lifecycleStatus === 'IN_REVIEW') && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[#1f1d25] text-[15px] font-medium">{t('Findings Review')}</h3>
                  <span className="text-[12px] text-[#686576]">
                    {acceptedPinIndices.size}/{allPins.length} {t('accepted')}
                  </span>
                </div>
                <div className="space-y-2">
                  {allPins.map((pin, idx) => {
                    const checked = acceptedPinIndices.has(idx);
                    const catColor = pin.category === 'B'
                      ? 'bg-[#EDE9F7] text-[#6B3FA0]'
                      : 'bg-[#FDECEA] text-[#be0e1c]';
                    return (
                      <label
                        key={idx}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer select-none ${
                          checked
                            ? 'border-[rgba(71,59,171,0.25)] bg-[rgba(71,59,171,0.03)]'
                            : 'border-[#F0F0F0] bg-[#FAFAFB] opacity-60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setAcceptedPinIndices(prev => {
                              const next = new Set(prev);
                              if (next.has(idx)) next.delete(idx);
                              else next.add(idx);
                              return next;
                            });
                          }}
                          className="mt-0.5 w-4 h-4 rounded accent-[#473BAB] flex-shrink-0 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[13px] font-medium text-[#1f1d25] leading-tight">{pin.title}</span>
                            {pin.ruleNumber && (
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${catColor}`}>
                                CAT-{pin.category ?? 'A'}-{pin.ruleNumber}
                              </span>
                            )}
                          </div>
                          <p className="text-[12px] text-[#686576] mt-0.5 leading-relaxed">{pin.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
                {/* Save findings button — persists accepted pins to storage */}
                <button
                  type="button"
                  disabled={acceptedPinIndices.size === 0}
                  onClick={() => {
                    const acceptedPins = allPins
                      .filter((_, i) => acceptedPinIndices.has(i))
                      .map(p => ({
                        title: p.title,
                        description: p.description,
                        x: p.x,
                        y: p.y,
                        direction: p.direction,
                        category: p.category,
                        ruleNumber: p.ruleNumber,
                      }));
                    const newViolationType = acceptedPins.map(p => p.title).join('; ');
                    onPatchItem?.({ pins: acceptedPins, violationType: newViolationType });
                  }}
                  className="mt-3 w-full py-2 rounded-xl border border-[#473BAB] text-[#473BAB] text-[13px] font-medium hover:bg-[rgba(71,59,171,0.06)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {t('Save Findings')}
                </button>

                {/* ── Add missed rule form ── */}
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setIsAddRuleOpen(prev => !prev)}
                    className="flex items-center gap-1.5 text-[13px] text-[#473BAB] font-medium hover:opacity-75 transition-opacity"
                  >
                    <Plus size={14} />
                    {isAddRuleOpen ? t('Cancel') : t('Add missed rule')}
                  </button>

                  {isAddRuleOpen && (
                    <div className="mt-3 p-3 rounded-xl border border-[rgba(71,59,171,0.2)] bg-[rgba(71,59,171,0.02)] space-y-3">
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <label className="block text-[11px] font-medium text-[#686576] mb-1">{t('Rule code')}</label>
                          <input
                            type="text"
                            placeholder="e.g. 3B"
                            value={manualRuleCode}
                            onChange={e => setManualRuleCode(e.target.value)}
                            className="w-full text-[13px] border border-[#E0DDE8] rounded-lg px-2.5 py-1.5 outline-none focus:border-[#473BAB] placeholder:text-[#C0BCC9] bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-[#686576] mb-1">{t('Category')}</label>
                          <div className="flex gap-1">
                            {(['A', 'B'] as const).map(cat => (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => setManualCategory(cat)}
                                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer ${
                                  manualCategory === cat
                                    ? cat === 'A'
                                      ? 'bg-[#FDECEA] text-[#be0e1c]'
                                      : 'bg-[#EDE9F7] text-[#6B3FA0]'
                                    : 'bg-[#F5F5F7] text-[#686576] hover:bg-[#EEEEF2]'
                                }`}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-[#686576] mb-1">{t('Rule name / title')}</label>
                        <input
                          type="text"
                          placeholder="e.g. DBA Name Missing or Oversized"
                          value={manualTitle}
                          onChange={e => setManualTitle(e.target.value)}
                          className="w-full text-[13px] border border-[#E0DDE8] rounded-lg px-2.5 py-1.5 outline-none focus:border-[#473BAB] placeholder:text-[#C0BCC9] bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-[#686576] mb-1">{t('Description')}</label>
                        <textarea
                          rows={2}
                          placeholder="Describe the violation…"
                          value={manualDesc}
                          onChange={e => setManualDesc(e.target.value)}
                          className="w-full text-[13px] border border-[#E0DDE8] rounded-lg px-2.5 py-1.5 outline-none focus:border-[#473BAB] placeholder:text-[#C0BCC9] resize-none bg-white"
                        />
                      </div>

                      <button
                        type="button"
                        disabled={!manualTitle.trim()}
                        onClick={addManualPin}
                        className="w-full py-1.5 rounded-xl bg-[#473BAB] text-white text-[13px] font-medium hover:bg-[#3b2f9c] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        {t('Add Rule')}
                      </button>
                    </div>
                  )}
                </div>
              </section>
            )}

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
                <LeftKVRow label={t('Channel')}        value={item.channel === 'metaAds' ? t('Meta Ads') : t('Website')} />
                <LeftKVRow
                  label={t('Website / URL')}
                  value={
                    <a
                      href={/^https?:\/\//i.test(item.url) ? item.url : `https://${item.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-[#473BAB] hover:underline"
                      title={item.url}
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

            {/* ── DMP Lifecycle: Notification details (NOTIFIED/REMEDIATION_PENDING/RE_MONITORING) ── */}
            {lifecycleStatus && ['NOTIFIED', 'REMEDIATION_PENDING', 'RE_MONITORING', 'APPEAL_GRANTED', 'APPEAL_DENIED', 'ESCALATED'].includes(lifecycleStatus) && (
              <section>
                <h3 className="text-[#1f1d25] text-[15px] font-medium mb-4">{t('Compliance Case')}</h3>
                <div className="rounded-2xl border border-[rgba(0,0,0,0.12)] overflow-hidden">
                  {/* Case category + notification number banner */}
                  <div className="px-5 py-4 bg-[rgba(210,50,63,0.04)] border-b border-[rgba(0,0,0,0.06)] flex items-center gap-4 flex-wrap">
                    {item.caseCategory && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-[#686576] uppercase tracking-wide">Category</span>
                        <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${item.caseCategory === 'A' ? 'bg-[#FDECEA] text-[#be0e1c]' : 'bg-[#EDE9F7] text-[#6B3FA0]'}`}>
                          CAT-{item.caseCategory}
                        </span>
                      </div>
                    )}
                    {item.notificationNumber !== undefined && (
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#D2323F]" />
                        <span className="text-[13px] font-medium text-[#1f1d25]">
                          Notification Letter #{item.notificationNumber}
                        </span>
                      </div>
                    )}
                    {currentPenaltyMonths > 0 && (
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-[#686576]" />
                        <span className="text-[13px] text-[#686576]">
                          {currentPenaltyMonths} month{currentPenaltyMonths !== 1 ? 's' : ''} withheld
                        </span>
                      </div>
                    )}
                    {item.notificationNumber === 1 && currentPenaltyMonths === 0 && (
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-[#686576]" />
                        <span className="text-[13px] text-[#686576]">Warning — no financial impact</span>
                      </div>
                    )}
                  </div>

                  {/* Appeal status */}
                  {item.appealStatus && (
                    <div className="px-5 py-3 border-b border-[rgba(0,0,0,0.06)] flex items-center gap-2">
                      {item.appealStatus === 'submitted' && <Clock className="w-4 h-4 text-[#E17613]" />}
                      {item.appealStatus === 'granted' && <CheckCircle2 className="w-4 h-4 text-[#4CAF50]" />}
                      {item.appealStatus === 'denied' && <AlertTriangle className="w-4 h-4 text-[#D2323F]" />}
                      <span className="text-[13px] text-[#1f1d25]">
                        Appeal {item.appealStatus === 'submitted' ? 'pending review' : item.appealStatus}
                      </span>
                    </div>
                  )}

                  {/* OEM appeal decision buttons */}
                  {userType === 'oem' && item.appealStatus === 'submitted' && (
                    <div className="px-5 py-4 flex items-center gap-3 bg-[rgba(225,118,19,0.04)]">
                      <span className="text-[13px] font-medium text-[#613f02] flex-1">{t('Dealer submitted an appeal. Review and decide:')}</span>
                      <button
                        onClick={() => { onDecideAppeal?.('granted'); emitSnackbar(t('Appeal granted')); }}
                        className="px-4 py-1.5 rounded-full bg-[#E8F5E9] text-[#1b5e20] text-[12px] font-medium hover:bg-[#C8E6C9] transition-colors cursor-pointer"
                      >
                        {t('Grant')}
                      </button>
                      <button
                        onClick={() => setPendingDestructive({ type: 'appeal-deny' })}
                        className="px-4 py-1.5 rounded-full bg-[rgba(210,50,63,0.08)] text-[#be0e1c] text-[12px] font-medium hover:bg-[rgba(210,50,63,0.15)] transition-colors cursor-pointer"
                      >
                        {t('Deny')}
                      </button>
                    </div>
                  )}

                  {/* Dealer appeal window */}
                  {userType !== 'oem' && (lifecycleStatus === 'NOTIFIED' || lifecycleStatus === 'REMEDIATION_PENDING' || lifecycleStatus === 'ESCALATED') && !item.appealStatus && appealDaysLeft !== null && (
                    <div className="px-5 py-4 flex items-center gap-3">
                      <Clock className="w-4 h-4 text-[#E17613] flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-[13px] font-medium text-[#1f1d25]">
                          {appealDaysLeft > 0 ? `${appealDaysLeft} day${appealDaysLeft !== 1 ? 's' : ''} left to appeal` : 'Appeal window closed'}
                        </p>
                        {appealDaysLeft > 0 && (
                          <p className="text-[11px] text-[#9C99A9] mt-0.5">
                            Deadline: {appealDeadlineDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                      {appealDaysLeft > 0 && (
                        <button
                          onClick={() => { onSubmitAppeal?.(); emitSnackbar(t('Appeal submitted to OEM for review')); }}
                          className="px-4 py-1.5 rounded-full border border-[#473BAB] text-[#473BAB] text-[12px] font-medium hover:bg-[rgba(71,59,171,0.06)] transition-colors cursor-pointer whitespace-nowrap"
                        >
                          {t('Submit Appeal')}
                        </button>
                      )}
                    </div>
                  )}

                  {/* OEM RE_MONITORING actions */}
                  {userType === 'oem' && (lifecycleStatus === 'RE_MONITORING' || lifecycleStatus === 'REMEDIATION_PENDING') && (
                    <div className="px-5 py-3 flex items-center gap-3 border-t border-[rgba(0,0,0,0.06)]">
                      <RefreshCw className="w-4 h-4 text-[#0288D1]" />
                      <span className="text-[13px] text-[#1f1d25] flex-1">{t('Monitoring for compliance resolution')}</span>
                      <button
                        onClick={() => { onMarkReMonitored?.(); emitSnackbar(t('Re-monitoring check recorded')); }}
                        className="px-4 py-1.5 rounded-full border border-[#0288D1] text-[#0288D1] text-[12px] font-medium hover:bg-[rgba(2,136,209,0.06)] transition-colors cursor-pointer whitespace-nowrap"
                      >
                        {t('Log Check')}
                      </button>
                      <button
                        onClick={() => { onMarkCured?.(); emitSnackbar(t('Case marked as cured')); }}
                        className="px-4 py-1.5 rounded-full bg-[#E8F5E9] text-[#1b5e20] text-[12px] font-medium hover:bg-[#C8E6C9] transition-colors cursor-pointer whitespace-nowrap"
                      >
                        {t('Mark Cured')}
                      </button>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ── DMP Lifecycle: Notification Record Retention ── */}
            {(() => {
              const notifEvents = (item.lifecycleHistory ?? [])
                .filter(e => e.type === 'NOTIFIED' || e.type === 'ESCALATED')
                .sort((a, b) => new Date(a.timestampISO).getTime() - new Date(b.timestampISO).getTime());
              if (notifEvents.length === 0) return null;
              const lastEvent = notifEvents[notifEvents.length - 1];
              const resetDate = new Date(lastEvent.timestampISO);
              resetDate.setMonth(resetDate.getMonth() + 6);
              const fmtDate = (iso: string) =>
                new Date(iso).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
              const fmtReset = resetDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
              return (
                <section>
                  <h3 className="text-[#1f1d25] text-[15px] font-medium mb-3">{t('Notification Record')}</h3>
                  <div className="rounded-2xl border border-[rgba(0,0,0,0.12)] px-5 py-4 space-y-2">
                    {notifEvents.map((ev, idx) => (
                      <div key={ev.id} className="flex items-center justify-between">
                        <span className="text-[13px] text-[#1f1d25]">
                          Notification {idx + 1}: Issued {fmtDate(ev.timestampISO)}
                        </span>
                        <button
                          onClick={() => emitSnackbar(t('Letter download not available in this version'))}
                          className="text-[12px] text-[#473BAB] hover:underline cursor-pointer"
                        >
                          View Letter
                        </button>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-[rgba(0,0,0,0.08)]">
                      <span className="text-[12px] text-[#9C99A9]">
                        All Notifications Will Reset On {fmtReset}
                      </span>
                    </div>
                  </div>
                </section>
              );
            })()}

            {/* ── DMP Lifecycle: dealer appeal submitted (pending OEM decision) ── */}
            {userType !== 'oem' && item.appealStatus === 'submitted' && (
              <section>
                <div className="rounded-2xl border border-[rgba(225,118,19,0.3)] bg-[rgba(225,118,19,0.04)] px-5 py-4 flex items-start gap-3">
                  <Clock className="w-4 h-4 text-[#E17613] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[13px] font-medium text-[#613f02]">{t('Appeal submitted — awaiting OEM decision')}</p>
                    {item.appealSubmittedAt && (
                      <p className="text-[11px] text-[#9C99A9] mt-0.5">
                        {new Date(item.appealSubmittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* ── DMP Lifecycle History timeline ── */}
            {item.lifecycleHistory && item.lifecycleHistory.length > 0 && (
              <section>
                <h3 className="text-[#1f1d25] text-[15px] font-medium mb-3">{t('Case Timeline')}</h3>
                <div className="space-y-0 relative">
                  {[...item.lifecycleHistory].sort((a, b) => new Date(a.timestampISO).getTime() - new Date(b.timestampISO).getTime()).map((ev, idx, arr) => (
                    <div key={ev.id} className="flex gap-3 relative">
                      {/* vertical connector */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${ev.actorRole === 'oem' ? 'bg-[#473BAB]' : 'bg-[#E17613]'}`} />
                        {idx < arr.length - 1 && <div className="w-px flex-1 bg-[#E0E0E0] mt-0.5 mb-0.5 min-h-[16px]" />}
                      </div>
                      <div className={`pb-4 flex-1 min-w-0 ${idx === arr.length - 1 ? '' : ''}`}>
                        <p className="text-[13px] text-[#1f1d25] leading-snug">{ev.label}</p>
                        <p className="text-[11px] text-[#9C99A9] mt-0.5">
                          {ev.actor} · {new Date(ev.timestampISO).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

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

        {/* ── Footer action bar — lifecycle-aware ── */}
        <div className={`flex items-center justify-between px-8 py-4 flex-shrink-0 ${userType !== 'oem' ? 'border-t border-[#E0E0E0]' : ''}`}>
          {/* Left group: secondary destructive / OEM-only actions */}
          <div className="flex items-center gap-2">
            {/* Dismiss case — OEM, IN_REVIEW only; goes through destructive confirm */}
            {userType === 'oem' && lifecycleStatus === 'IN_REVIEW' && (
              <button
                onClick={() => setPendingDestructive({ type: 'dismiss' })}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#D0CFD7] text-[#686576] text-[13px] font-medium hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                {t('Dismiss')}
              </button>
            )}
            {/* Assign Penalty — OEM: only at notification #4 (one step before the final penalty) */}
            {userType === 'oem'
              && (lifecycleStatus === 'APPEAL_DENIED' || lifecycleStatus === 'REMEDIATION_PENDING' || (lifecycleStatus === 'NOTIFIED' && !item.appealStatus))
              && (item.notificationNumber ?? 0) === 4
              && (
              <button
                onClick={() => setPendingDestructive({ type: 'escalate' })}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#D2323F] text-[#be0e1c] text-[13px] font-medium hover:bg-[rgba(210,50,63,0.08)] transition-colors cursor-pointer whitespace-nowrap"
              >
                <ShieldAlert className="w-4 h-4" />
                {t('Assign Penalty')}
              </button>
            )}
          </div>

          {/* Right group: primary action */}
          <div className="flex items-center gap-3">
            {/* Lifecycle primary action — OEM (hidden while a solution is pending review) */}
            {userType === 'oem' && lifecycleStatus === 'DETECTED' && !(solution && !solution.solved) && (
              <button
                onClick={() => { onOpenCase?.(); emitSnackbar(t('Case opened for review')); }}
                className="flex items-center gap-2 px-6 py-2 bg-[#473BAB] hover:bg-[#3D3295] text-white rounded-full text-sm font-medium transition-colors shadow-sm cursor-pointer whitespace-nowrap"
              >
                <ChevronRight className="w-4 h-4" />
                {t('Open Case')}
              </button>
            )}
            {userType === 'oem' && lifecycleStatus === 'IN_REVIEW' && !(solution && !solution.solved) && (
              <button
                onClick={() => setShowNotifModal(true)}
                className="flex items-center gap-2 px-6 py-2 bg-[#473BAB] hover:bg-[#3D3295] text-white rounded-full text-sm font-medium transition-colors shadow-sm cursor-pointer whitespace-nowrap"
              >
                <Bell className="w-4 h-4" />
                {t('Issue Notification Letter')}
              </button>
            )}

            {/* OEM solution review — shown whenever there's an unreviewed solution, regardless of lifecycleStatus */}
            {userType === 'oem' && !isReportingDealer && solution && !solution.solved && !oemActedOnSolution && (
              <>
                <button
                  onClick={() => {
                    onRejectSolution?.();
                    emitSnackbar(t('Solution rejected — dealer must re-submit'));
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#D2323F] text-[#be0e1c] text-[13px] font-medium hover:bg-[rgba(210,50,63,0.08)] transition-colors cursor-pointer whitespace-nowrap"
                >
                  {t('Reject Solution')}
                </button>
                <button
                  onClick={() => {
                    if (commentDraft.trim()) { onAddComment?.(commentDraft.trim()); setCommentDraft(''); }
                    onMarkCured?.();
                    emitSnackbar(t('Case marked as Cured'));
                  }}
                  className="flex items-center gap-2 px-6 py-2 bg-[#1b5e20] hover:bg-[#145218] text-white rounded-full text-[13px] font-medium transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <Check className="w-4 h-4" />
                  {t('Mark as Cured')}
                </button>
              </>
            )}

            {/* Non-lifecycle OEM actions (no solution pending) */}
            {userType === 'oem' && !lifecycleStatus && !isReportingDealer && !(solution && !solution.solved) && (() => {
              if (solution?.solved) return null;
              const isOemAcceptReport = !!item.reportedBy && item.status === 'Pending' && !solution;
              if (!isOemAcceptReport && solution?.solved) return null;
              const label = isOemAcceptReport ? t('Accept Report') : t('Mark As Reviewed');
              const handleClick = () => {
                if (commentDraft.trim()) { onAddComment?.(commentDraft.trim()); setCommentDraft(''); }
                if (isOemAcceptReport) {
                  if (hasMultiplePins) {
                    const acceptedPins = allPins.filter((_, i) => acceptedPinIndices.has(i)).map(p => ({ title: p.title, description: p.description, x: p.x, y: p.y, direction: p.direction, category: p.category, ruleNumber: p.ruleNumber }));
                    onPatchItem?.({ pins: acceptedPins, violationType: acceptedPins.map(p => p.title).join('; ') });
                  }
                  onAcceptReport?.();
                  emitSnackbar(t('Report accepted — status moved to Open'));
                }
              };
              return (
                <>
                  {!solution && (
                    <button onClick={onClose} className="px-6 py-2 rounded-full border border-[rgba(31,29,37,0.20)] text-[#111014]/60 text-sm font-medium hover:bg-black/5 transition-colors cursor-pointer whitespace-nowrap">
                      {t('Cancel')}
                    </button>
                  )}
                  <button onClick={handleClick} className="flex items-center gap-2 px-6 py-2 bg-[#473BAB] hover:bg-[#3D3295] text-white rounded-full text-sm font-medium transition-colors shadow-sm cursor-pointer whitespace-nowrap">
                    <Check className="w-4 h-4" />
                    {label}
                  </button>
                </>
              );
            })()}

            {/* Dealer primary action */}
            {userType !== 'oem' && !isReportingDealer && !solution &&
              !(['DISMISSED', 'CURED', 'APPEAL_GRANTED', 'RE_MONITORING'] as const).includes(lifecycleStatus as never) && (
              <button
                disabled={!(solutionScreenshot && solutionComment.trim())}
                onClick={() => {
                  if (!solutionScreenshot || !solutionComment.trim()) return;
                  onSubmitSolution?.({ screenshotDataUrl: solutionScreenshot, comment: solutionComment.trim() });
                  emitSnackbar(t('Correction evidence submitted to OEM'));
                }}
                className="flex items-center gap-2 px-6 py-2 bg-[#473BAB] hover:bg-[#3D3295] disabled:bg-[#D0CFD7] disabled:cursor-not-allowed text-white rounded-full text-sm font-medium transition-colors shadow-sm cursor-pointer whitespace-nowrap"
              >
                <Check className="w-4 h-4" />
                {t('Submit Correction')}
              </button>
            )}
          </div>{/* end right group */}
        </div>

        {/* ── Destructive action confirmation modal ── */}
        {pendingDestructive && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 rounded-2xl" onClick={() => setPendingDestructive(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-[360px] mx-4 p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-[rgba(210,50,63,0.1)] flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-[#D2323F]" />
                </div>
                <h3 className="text-[17px] font-semibold text-[#1f1d25]">
                  {pendingDestructive.type === 'dismiss' ? t('Dismiss Case')
                   : pendingDestructive.type === 'escalate' ? t('Assign Penalty')
                   : t('Deny Appeal')}
                </h3>
              </div>
              <p className="text-[13px] text-[#686576] mb-5 leading-relaxed">
                {pendingDestructive.type === 'dismiss'
                  ? t('The case will be closed and no penalty applied. The dealership will not receive a notification.')
                  : pendingDestructive.type === 'escalate'
                    ? `${t('Notification Letter')} #${nextNotificationNum} ${t('will be issued.')} ${
                        (penaltyLadder[nextNotificationNum - 1] ?? 0) > 0
                          ? `${penaltyLadder[nextNotificationNum - 1]} ${t('month(s) will be withheld from dealer funds.')}`
                          : t('This is a warning with no financial impact.')
                      }`
                    : t('The appeal will be denied. The case moves to Remediation Pending — the dealer must fix the issue before it can be closed.')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setPendingDestructive(null)}
                  className="flex-1 py-2 rounded-full border border-[rgba(31,29,37,0.20)] text-[#111014]/60 text-sm font-medium hover:bg-black/5 transition-colors cursor-pointer"
                >
                  {t('Cancel')}
                </button>
                <button
                  onClick={() => {
                    const type = pendingDestructive.type;
                    setPendingDestructive(null);
                    if (type === 'dismiss') { onDismissCase?.(); emitSnackbar(t('Case dismissed')); }
                    else if (type === 'escalate') { onEscalateCase?.(); emitSnackbar(t('Penalty assigned — new Notification Letter issued')); }
                    else { onDecideAppeal?.('denied'); emitSnackbar(t('Appeal denied')); }
                  }}
                  className="flex-1 py-2 rounded-full bg-[#D2323F] hover:bg-[#be0e1c] text-white text-sm font-medium transition-colors cursor-pointer"
                >
                  {t('Confirm')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Notification Letter confirmation modal ── */}
        {showNotifModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 rounded-2xl" onClick={() => setShowNotifModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-[360px] mx-4 p-6" onClick={e => e.stopPropagation()}>
              <h3 className="text-[17px] font-semibold text-[#1f1d25] mb-1">{t('Issue Notification Letter')}</h3>
              <p className="text-[12px] text-[#9C99A9] mb-4">
                {t('This will officially notify the dealership of the compliance violation.')}
              </p>

              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#686576]">{t('Dealership')}</span>
                  <span className="font-medium text-[#1f1d25]">{item.dealership}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#686576]">{t('Case Category')}</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${derivedCaseCategory === 'A' ? 'bg-[#FDECEA] text-[#be0e1c]' : 'bg-[#EDE9F7] text-[#6B3FA0]'}`}>
                    CAT-{derivedCaseCategory}
                  </span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#686576]">{t('Notification #')}</span>
                  <span className="font-medium text-[#1f1d25]">#{nextNotificationNum}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#686576]">{t('Non-Compliance Action')}</span>
                  <span className="font-medium text-[#1f1d25]">
                    {(penaltyLadder[nextNotificationNum - 1] ?? 0) === 0
                      ? t('Warning — no financial impact')
                      : `${penaltyLadder[nextNotificationNum - 1]} month${penaltyLadder[nextNotificationNum - 1] !== 1 ? 's' : ''} withheld`}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowNotifModal(false)}
                  className="flex-1 py-2 rounded-full border border-[rgba(31,29,37,0.20)] text-[#111014]/60 text-sm font-medium hover:bg-black/5 transition-colors cursor-pointer"
                >
                  {t('Cancel')}
                </button>
                <button
                  onClick={() => {
                    setShowNotifModal(false);
                    onIssueNotificationLetter?.(nextNotificationNum, derivedCaseCategory);
                    emitSnackbar(t('Notification Letter issued'));
                  }}
                  className="flex-1 py-2 rounded-full bg-[#473BAB] hover:bg-[#3D3295] text-white text-sm font-medium transition-colors shadow-sm cursor-pointer"
                >
                  {t('Confirm & Send')}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
