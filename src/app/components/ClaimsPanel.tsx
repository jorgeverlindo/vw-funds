import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Eye, Star, MessageSquare, Banknote, RefreshCw, Paperclip, Trash2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { CustomSelect } from './ui/CustomSelect';
import { SingleDatePicker } from './ui/SingleDatePicker';
import { StatusChip, ClaimStatus } from './StatusChip';
import { KeyValueRow } from './ui/KeyValueRow';
import { useTranslation } from '../contexts/LanguageContext';
import { WorkflowHistoryTimeline } from './WorkflowHistoryTimeline';
import { DocumentPreviewModal } from './pre-approval/DocumentPreviewModal';
import {
  useWorkflow,
  WORKFLOW_PA_ID,
  WORKFLOW_CAMPAIGN,
  WORKFLOW_DEALER,
} from '../contexts/WorkflowContext';

// ─── Strike & Penalty types ───────────────────────────────────────────────────
export interface Strike {
  level: 1 | 2 | 3;
  type: string;
  date: string;
  description: string;
}

export const VIOLATION_TYPES: { value: string; label: string; autoDetails: string }[] = [
  {
    value: 'duplicate_invoice',
    label: 'Duplicate Invoice',
    autoDetails: 'This claim contains an invoice that matches a previously submitted invoice by the same dealer. Please review and confirm uniqueness before approving.',
  },
  {
    value: 'spend_cap',
    label: 'Spend Cap Violation',
    autoDetails: 'The submitted amount exceeds the dealer\'s approved co-op budget for this period. Excess funds are flagged for OEM review.',
  },
  {
    value: 'brand_misuse',
    label: 'Brand Misuse',
    autoDetails: 'Incorrect brand asset usage detected. Non-approved logo, typography, or brand guidelines violated in submitted creative materials.',
  },
  {
    value: 'incentive_legal',
    label: 'Incentive / Legal Violation',
    autoDetails: 'Missing required legal disclaimer in advertising materials (e.g., APR, MSRP, lease terms). This may violate OEM compliance standards.',
  },
  {
    value: 'missing_proof',
    label: 'Missing Proof of Performance',
    autoDetails: 'Claim lacks sufficient proof of media in-market or campaign execution. Supporting documents must be resubmitted.',
  },
  {
    value: 'ad_violation',
    label: 'Website / Ad Violation',
    autoDetails: 'Active digital ads or website content found in violation of VW brand or advertising standards during monitoring review.',
  },
  {
    value: 'missing_docs',
    label: 'Missing Documents',
    autoDetails: 'One or more required documents are missing from this submission. Dealer must resubmit with complete documentation.',
  },
];

const STRIKE_OPTIONS: { level: 1 | 2 | 3; label: string; sublabel: string; dotColor: string }[] = [
  { level: 1, label: 'Strike 1', sublabel: 'Warning',    dotColor: '#F59E0B' },
  { level: 2, label: 'Strike 2', sublabel: 'Escalation', dotColor: '#E17613' },
  { level: 3, label: 'Strike 3', sublabel: 'Suspension', dotColor: '#D2323F' },
];

const DURATION_OPTIONS = ['7 days', '14 days', '30 days', '60 days', '90 days', 'Indefinite'];

// ─── Claim interface ──────────────────────────────────────────────────────────
// Reuse types or define new ones
export interface Claim {
  id: string;
  uid: string;
  date: Date;
  amount: number;
  status: ClaimStatus; // Update to use the shared type
  timeInClaim: number;
  timeInPayment: number;
  dealershipCode: string;
  dealershipName: string;
  dealershipCity: string;
  fund: string;
  submittedBy: {
    name: string;
    avatarUrl: string;
  };
  type: string;
  lastUpdated: string;
  details?: string;
  strikes?: Strike[];
  violationSummary?: string;
  /** Real status shown to dealers when OEM has flagged the claim as 'At risk' */
  underlyingStatus?: ClaimStatus;
}

interface ClaimsPanelProps {
  claim: Claim;
  onClose: () => void;
  userType?: 'dealer' | 'dealer-singular' | 'oem';
}

export function ClaimsPanel({
  claim,
  onClose,
  userType = 'dealer',
}: ClaimsPanelProps) {
  const { t } = useTranslation();
  const {
    workflow,
    submitClaim,
    approveClaimAction,
    requestClaimRevision,
    resubmitClaimWithComment,
    processPayment,
    archiveAndReset,
    addClaimDocument,
    removeClaimDocument,
  } = useWorkflow();

  const [oemDraftComment, setOemDraftComment] = useState('');
  const [dealerDraftComment, setDealerDraftComment] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);
  const [previewDoc, setPreviewDoc] = useState<typeof wfCL.documents[number] | null>(null);

  // ── Penalty form state ────────────────────────────────────────────────────
  const penaltyFormRef = useRef<HTMLDivElement>(null);
  const [penaltyFormOpen, setPenaltyFormOpen] = useState(false);

  // Auto-scroll to form when it opens
  useEffect(() => {
    if (penaltyFormOpen) {
      const t = setTimeout(() => {
        penaltyFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 80);
      return () => clearTimeout(t);
    }
  }, [penaltyFormOpen]);
  const [selectedViolationType, setSelectedViolationType] = useState('');
  const [penaltyDetails, setPenaltyDetails] = useState('');
  const [selectedStrike, setSelectedStrike] = useState<1 | 2 | 3 | null>(null);
  const [suspendEligibility, setSuspendEligibility] = useState(false);
  const [suspendStartDate, setSuspendStartDate] = useState<Date | undefined>(undefined);
  const [suspendDuration, setSuspendDuration] = useState('');

  const handleViolationTypeChange = (value: string) => {
    setSelectedViolationType(value);
    const found = VIOLATION_TYPES.find(v => v.value === value);
    setPenaltyDetails(found?.autoDetails ?? '');
  };

  const handleStrikeSelect = (level: 1 | 2 | 3) => {
    setSelectedStrike(level);
    if (level === 3) setSuspendEligibility(true);
  };

  const handleApplyPenalty = () => {
    // Demo: just close the form and show confirmation
    setPenaltyFormOpen(false);
    setSelectedViolationType('');
    setPenaltyDetails('');
    setSelectedStrike(null);
    setSuspendEligibility(false);
    setSuspendStartDate(undefined);
    setSuspendDuration('');
  };

  const handleCancelPenalty = () => {
    setPenaltyFormOpen(false);
    setSelectedViolationType('');
    setPenaltyDetails('');
    setSelectedStrike(null);
    setSuspendEligibility(false);
    setSuspendStartDate(undefined);
    setSuspendDuration('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeKB = file.size / 1024;
    const sizeStr = sizeKB >= 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB.toFixed(0)} KB`;
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'file';
    const url = URL.createObjectURL(file);
    addClaimDocument({ name: file.name, size: sizeStr, type: ext, url });
    e.target.value = '';
  };

  // Detect live workflow item — ID changes each cycle, never hardcode
  const isWorkflowItem = claim.id === workflow.claim.id;
  const wfCL = workflow.claim;
  const wfPA = workflow.preApproval;
  const rawStatus = isWorkflowItem ? (wfCL.status as ClaimStatus) : claim.status;
  // Dealers never see 'At risk' — show the underlying status instead
  const liveStatus: ClaimStatus =
    rawStatus === 'At risk' && userType !== 'oem'
      ? (claim.underlyingStatus ?? 'Pending')
      : rawStatus;
  const liveOemComment = isWorkflowItem ? wfCL.oemComment : null;

  // ── OEM action handlers ───────────────────────────────────────────────────

  const handleApprove = () => {
    approveClaimAction(oemDraftComment.trim() || undefined);
    setOemDraftComment('');
    onClose();
  };

  const handleRequestAdjustments = () => {
    if (!oemDraftComment.trim()) return;
    requestClaimRevision(oemDraftComment.trim());
    setOemDraftComment('');
    onClose();
  };

  const handleProcessPayment = () => {
    processPayment();
    onClose();
  };

  // ── Dealer action handlers ────────────────────────────────────────────────

  const handleResubmit = () => {
    resubmitClaimWithComment(dealerDraftComment.trim());
    setDealerDraftComment('');
    onClose();
  };

  // ── Footer content ────────────────────────────────────────────────────────

  const renderFooter = () => {
    // Non-workflow items: original Cancel + Process Payment
    if (!isWorkflowItem) {
      return (
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full text-sm font-medium text-[#111014]/60 hover:bg-black/5 transition-colors cursor-pointer"
          >
            {t('Cancel')}
          </button>
          <button className="px-6 py-2 bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] text-white rounded-full text-sm font-medium transition-colors shadow-sm cursor-pointer">
            {t('Process Payment')}
          </button>
        </div>
      );
    }

    // ── OEM view ────────────────────────────────────────────────────────────
    if (userType === 'oem') {
      const canReview = liveStatus === 'Submitted' || liveStatus === 'Resubmitted';
      const canApprove = liveStatus === 'Approved';

      if (canReview) {
        return (
          <div className="space-y-3">
            <div className="relative">
              <textarea
                value={oemDraftComment}
                onChange={(e) => setOemDraftComment(e.target.value)}
                placeholder="Add a comment (required for Request Adjustments)…"
                rows={3}
                className="w-full rounded-xl border border-[#E0E0E0] px-3 py-2 pr-10 text-[13px] text-[#1f1d25] placeholder:text-[#9C99A9] resize-none focus:outline-none focus:border-[var(--brand-accent)] transition-colors"
              />
              <input
                ref={replyFileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                className="absolute w-0 h-0 opacity-0 overflow-hidden pointer-events-none"
                onChange={handleFileChange}
                tabIndex={-1}
              />
              <button
                type="button"
                onClick={() => replyFileInputRef.current?.click()}
                className="absolute bottom-2 right-2 p-1.5 rounded-full hover:bg-gray-100 text-[#9C99A9] hover:text-[#686576] transition-colors cursor-pointer"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </button>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-full text-sm font-medium text-[#111014]/60 hover:bg-black/5 transition-colors cursor-pointer"
              >
                {t('Close')}
              </button>
              <button
                onClick={handleRequestAdjustments}
                disabled={!oemDraftComment.trim()}
                className="px-5 py-2 rounded-full text-sm font-medium border border-[#E17613] text-[#E17613] hover:bg-[rgba(225,118,19,0.06)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Request Adjustments
              </button>
              <button
                onClick={handleApprove}
                className="px-6 py-2 bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] text-white rounded-full text-sm font-medium transition-colors shadow-sm cursor-pointer"
              >
                Approve Claim
              </button>
            </div>
          </div>
        );
      }

      if (canApprove) {
        return (
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-full text-sm font-medium text-[#111014]/60 hover:bg-black/5 transition-colors cursor-pointer"
            >
              {t('Close')}
            </button>
            <button
              onClick={handleProcessPayment}
              className="flex items-center gap-2 px-6 py-2 bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] text-white rounded-full text-sm font-medium transition-colors shadow-sm cursor-pointer"
            >
              <Banknote className="w-4 h-4" />
              Process Payment
            </button>
          </div>
        );
      }

      // Paid or other terminal status
      return (
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full text-sm font-medium text-[#111014]/60 hover:bg-black/5 transition-colors cursor-pointer"
          >
            {t('Close')}
          </button>
        </div>
      );
    }

    // ── Dealer view ──────────────────────────────────────────────────────────
    if (liveStatus === 'Draft') {
      return (
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-[#686576]">Review the details and submit for OEM review.</p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-full text-sm font-medium text-[#111014]/60 hover:bg-black/5 transition-colors cursor-pointer"
            >
              {t('Close')}
            </button>
            <button
              onClick={() => { submitClaim(); onClose(); }}
              className="px-6 py-2 bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] text-white rounded-full text-sm font-medium transition-colors shadow-sm cursor-pointer"
            >
              Submit Claim
            </button>
          </div>
        </div>
      );
    }

    if (liveStatus === 'Revision Requested') {
      return (
        <div className="space-y-3">
          <div className="relative">
            <textarea
              value={dealerDraftComment}
              onChange={(e) => setDealerDraftComment(e.target.value)}
              placeholder="Add a reply to the OEM (optional)…"
              rows={3}
              className="w-full rounded-xl border border-[#E0E0E0] px-3 py-2 pr-10 text-[13px] text-[#1f1d25] placeholder:text-[#9C99A9] resize-none focus:outline-none focus:border-[var(--brand-accent)] transition-colors"
            />
            <input
              ref={replyFileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              className="absolute w-0 h-0 opacity-0 overflow-hidden pointer-events-none"
              onChange={handleFileChange}
              tabIndex={-1}
            />
            <button
              type="button"
              onClick={() => replyFileInputRef.current?.click()}
              className="absolute bottom-2 right-2 p-1.5 rounded-full hover:bg-gray-100 text-[#9C99A9] hover:text-[#686576] transition-colors cursor-pointer"
              title="Attach a file to prove the correction"
            >
              <Paperclip className="w-4 h-4" />
            </button>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-full text-sm font-medium text-[#111014]/60 hover:bg-black/5 transition-colors cursor-pointer"
            >
              {t('Close')}
            </button>
            <button
              onClick={handleResubmit}
              className="flex items-center gap-2 px-6 py-2 bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] text-white rounded-full text-sm font-medium transition-colors shadow-sm cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              Resubmit Claim
            </button>
          </div>
        </div>
      );
    }

    if (liveStatus === 'Paid') {
      return (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[13px] text-[#2e7d32] shrink-0">
            <Banknote className="w-4 h-4" />
            <span>Payment of ${WORKFLOW_CAMPAIGN.totalAmount.toLocaleString()} processed successfully.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-full text-sm font-medium text-[#111014]/60 hover:bg-black/5 transition-colors cursor-pointer"
            >
              {t('Close')}
            </button>
            <button
              onClick={() => { archiveAndReset(); onClose(); }}
              className="flex items-center gap-2 px-5 py-2 bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] text-white rounded-full text-sm font-medium transition-colors shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Start New Pre-approval
            </button>
          </div>
        </div>
      );
    }

    // Submitted / Resubmitted / Approved / In Review — read-only for dealer
    return (
      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="px-6 py-2 rounded-full text-sm font-medium text-[#111014]/60 hover:bg-black/5 transition-colors cursor-pointer"
        >
          {t('Close')}
        </button>
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-[#E0E0E0] shrink-0">
        <div className="flex flex-col">
          <h2 className="text-[#1f1d25] text-[20px] font-medium tracking-[0.15px] leading-tight">
            {t('Claim')} - {claim.id}
          </h2>
          <span className="text-sm text-[#686576] mt-1">
            {isWorkflowItem ? WORKFLOW_DEALER.name : claim.dealershipName}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E0E0E0] hover:bg-gray-50 transition-colors cursor-pointer">
              <Star className="w-3.5 h-3.5 text-[#9C99A9]" />
              <span className="text-[13px] font-medium text-[#1f1d25]/80">{t('Follow')}</span>
            </button>
            {liveStatus && <StatusChip status={liveStatus} />}
          </div>

          <div className="w-px h-6 bg-[#E0E0E0] mx-1" />

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-[#686576]" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="px-8 py-6 space-y-8">

          {/* Violation Summary banner — visible when claim has violations */}
          {claim.violationSummary && (
            <section className="bg-[rgba(210,50,63,0.04)] -mx-8 px-8 py-4 border-b border-[rgba(210,50,63,0.15)]">
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-[rgba(210,50,63,0.10)] flex items-center justify-center mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-[#D2323F]" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[#D2323F] mb-0.5">Violation Summary</p>
                  <p className="text-[13px] text-[#1f1d25] leading-relaxed">{claim.violationSummary}</p>
                </div>
              </div>
            </section>
          )}

          {/* OEM comment banner — dealer sees when revision was requested */}
          {isWorkflowItem && userType !== 'oem' && liveStatus === 'Revision Requested' && liveOemComment && (
            <section className="bg-[rgba(225,118,19,0.06)] -mx-8 px-8 py-4 border-b border-[rgba(225,118,19,0.2)]">
              <h3 className="text-[#E17613] text-[13px] font-medium mb-1.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#E17613]" />
                Adjustments Requested by OEM
              </h3>
              <p className="text-[13px] text-[#1f1d25] leading-relaxed pl-4 border-l-2 border-[rgba(225,118,19,0.3)]">
                {liveOemComment}
              </p>
            </section>
          )}

          {/* Overview Section */}
          <section>
            <h3 className="text-[#1f1d25] text-[15px] font-medium mb-4">{t('Claim Overview')}</h3>
            <div className="space-y-0">
              {!isWorkflowItem && (
                <KeyValueRow
                  label={t('Amount')}
                  value={`$${claim.amount.toLocaleString()}`}
                  valueClass="font-semibold text-lg"
                />
              )}
              <KeyValueRow
                label={t('Date Submitted')}
                value={
                  isWorkflowItem && wfCL.submittedAt
                    ? new Date(wfCL.submittedAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })
                    : claim.date.toLocaleDateString()
                }
              />
              <KeyValueRow
                label={t('Dealership')}
                value={
                  isWorkflowItem
                    ? `${WORKFLOW_DEALER.code} - ${WORKFLOW_DEALER.name} (${WORKFLOW_DEALER.city})`
                    : `${claim.dealershipCode} - ${claim.dealershipName}`
                }
              />
              <KeyValueRow label={t('Fund')} value={claim.fund} />
              <KeyValueRow
                label={t('Type')}
                value={isWorkflowItem ? WORKFLOW_CAMPAIGN.initiativeType : claim.type}
              />
              <KeyValueRow
                label={t('Submitted by')}
                value={isWorkflowItem ? WORKFLOW_DEALER.contact : claim.submittedBy.name}
              />
              {isWorkflowItem && (
                <KeyValueRow
                  label="Linked Pre-Approval"
                  value={WORKFLOW_PA_ID}
                />
              )}
              {!isWorkflowItem && (
                <>
                  <KeyValueRow label={t('Time in Claim')} value={`${claim.timeInClaim} days`} />
                  <KeyValueRow label={t('Time in Payment')} value={`${claim.timeInPayment} days`} />
                </>
              )}
            </div>
          </section>

          {/* Channel Breakdown — workflow item only. Total Amount sits directly
              underneath, so dealers read "line items → total" in one glance. */}
          {isWorkflowItem && (
            <section>
              <h3 className="text-[#1f1d25] text-[15px] font-medium mb-3">Channel Breakdown</h3>
              <div className="space-y-0">
                {(wfPA.claimLines.length > 0
                  ? wfPA.claimLines
                  : Object.entries(WORKFLOW_CAMPAIGN.channelBreakdown).map(([description, amount]) => ({ description, amount: String(amount) }))
                ).map((line, idx) => {
                  const amt = parseFloat(line.amount) || 0;
                  return (
                    <KeyValueRow
                      key={idx}
                      label={line.description || `Activity ${idx + 1}`}
                      value={`$${amt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    />
                  );
                })}
                <div className="flex items-center justify-between py-3 border-t-2 border-[var(--brand-accent)]/20 mt-1">
                  <span className="text-[#1f1d25] text-[13px] font-medium">{t('Total Amount')}</span>
                  <span className="text-[var(--brand-accent)] text-[15px] font-bold">
                    ${(wfCL.invoiceTotal || WORKFLOW_CAMPAIGN.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* Details Section */}
          <section>
            <h3 className="text-[#1f1d25] text-[15px] font-medium mb-3">{t('Details')}</h3>
            <div className="border border-[#E0E0E0] rounded-lg p-4 bg-gray-50">
              <p className="text-[13px] text-[#686576]">
                {isWorkflowItem
                  ? WORKFLOW_CAMPAIGN.description
                  : (claim.details || t('No additional details provided for this claim.'))}
              </p>
            </div>
          </section>

          {/* Visual Assets — horizontal thumbnail gallery, same pattern as PreApprovalPanel */}
          {isWorkflowItem && (() => {
            const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']);
            const imageDocs = wfCL.documents.filter(
              d => d.url && IMAGE_EXTS.has(d.type.toLowerCase()),
            );
            if (imageDocs.length === 0) return null;
            return (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[#1f1d25] text-[15px] font-medium">Visual Assets</h3>
                  <span className="text-[11px] text-[#686576]">
                    {imageDocs.length} {imageDocs.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar snap-x">
                  {imageDocs.map((doc, idx) => (
                    <div
                      key={doc.name + idx}
                      className="w-[118px] h-[118px] rounded-xl overflow-hidden border border-[rgba(0,0,0,0.12)] shrink-0 snap-start relative group bg-[#f4f5f6]"
                    >
                      <img
                        src={doc.url}
                        alt={doc.name}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setPreviewDoc(doc)}
                      />
                      {userType !== 'oem' && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <button
                            onClick={() => removeClaimDocument(doc.name)}
                            className="p-1.5 bg-white rounded-full text-[#686576] hover:text-red-500 transition-colors shadow pointer-events-auto"
                            aria-label={`Remove ${doc.name}`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <div className="absolute top-1 left-1 bg-black/40 text-white text-[9px] font-bold rounded px-1 leading-tight pointer-events-none">
                        {idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })()}

          {/* Documents */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[#1f1d25] text-[15px] font-medium">{t('Documents')}</h3>
              {isWorkflowItem && userType !== 'oem' && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    className="absolute w-0 h-0 opacity-0 overflow-hidden pointer-events-none"
                    onChange={handleFileChange}
                    tabIndex={-1}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E0E0E0] hover:bg-gray-50 text-[13px] text-[#686576] transition-colors cursor-pointer"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    {t('Add Document')}
                  </button>
                </>
              )}
            </div>

            {(isWorkflowItem ? wfCL.documents.length > 0 : true) ? (
              <div className="space-y-2">
                {(isWorkflowItem ? wfCL.documents : []).map((doc, idx) => (
                  <div
                    key={idx}
                    className="border border-[#E0E0E0] rounded-lg p-0 flex overflow-hidden bg-white max-w-md"
                  >
                    <div className="w-[72px] bg-[#F5F5F5] flex items-center justify-center border-r border-[#E0E0E0] shrink-0">
                      <div className="w-10 h-12 bg-white border border-[#E0E0E0] shadow-sm flex items-center justify-center">
                        <span className="text-[9px] font-bold text-[#FF5252]">{doc.type.toUpperCase().slice(0, 4)}</span>
                      </div>
                    </div>
                    <div className="flex-1 p-3 flex items-center justify-between min-w-0">
                      <div className="flex flex-col min-w-0 pr-3">
                        <span className="text-[#1f1d25] text-[13px] font-medium break-all leading-snug mb-0.5">
                          {doc.name}
                        </span>
                        <span className="text-[#686576] text-[11px] uppercase tracking-wide">
                          {doc.type.toUpperCase()} | {doc.size}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="text-[#686576] hover:text-[var(--brand-accent)] p-2 hover:bg-[var(--brand-accent)]/8 rounded-full transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isWorkflowItem && userType !== 'oem' && (
                          <button
                            onClick={() => removeClaimDocument(doc.name)}
                            className="text-[#9C99A9] hover:text-[#D2323F] p-2 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {!isWorkflowItem && (
                  <div className="border border-[#E0E0E0] rounded-lg p-0 flex overflow-hidden bg-white max-w-md">
                    <div className="w-[72px] bg-[#F5F5F5] flex items-center justify-center border-r border-[#E0E0E0] shrink-0">
                      <div className="w-10 h-12 bg-white border border-[#E0E0E0] shadow-sm flex items-center justify-center">
                        <span className="text-[9px] font-bold text-[#FF5252]">PDF</span>
                      </div>
                    </div>
                    <div className="flex-1 p-3 flex items-center justify-between min-w-0">
                      <div className="flex flex-col min-w-0 pr-3">
                        <span className="text-[#1f1d25] text-[13px] font-medium truncate mb-0.5">
                          Invoice_{claim.id}.pdf
                        </span>
                        <span className="text-[#686576] text-[11px] uppercase tracking-wide">PDF | 1.2 MB</span>
                      </div>
                      <button className="text-[#686576] hover:text-[#1f1d25] p-2 hover:bg-gray-50 rounded-full transition-colors cursor-pointer">
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-6 border border-dashed border-[#E0E0E0] rounded-xl text-center">
                <Paperclip className="w-6 h-6 text-[#9C99A9]" />
                <p className="text-[13px] text-[#9C99A9]">
                  {isWorkflowItem && userType !== 'oem'
                    ? 'No documents attached yet. Click Add Document to attach.'
                    : t('No documents attached')}
                </p>
              </div>
            )}
          </section>

          {/* Compliance & Penalties — OEM only */}
          {userType === 'oem' && (
            <section>
              {/* Section header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-[#1f1d25] text-[15px] font-medium">Compliance &amp; Penalties</h3>
                  <p className="text-[12px] text-[#686576] mt-0.5">Track prior violations and apply strikes directly from the claim review flow.</p>
                </div>

                {/* Assign Penalty button — dissolves out when form opens */}
                <AnimatePresence>
                  {!penaltyFormOpen && (
                    <motion.button
                      key="assign-btn"
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      onClick={() => setPenaltyFormOpen(true)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] text-white text-[13px] font-medium transition-colors cursor-pointer shrink-0"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      Assign Penalty
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Strike history — always visible */}
              {(claim.strikes ?? []).length > 0 && (
                <div className="space-y-2 mb-4">
                    {(claim.strikes ?? []).slice().reverse().map((strike, idx) => {
                      const dotColor = strike.level === 3 ? '#D2323F' : strike.level === 2 ? '#E17613' : '#F59E0B';
                      return (
                        <div key={idx} className="border border-[rgba(0,0,0,0.08)] rounded-xl p-4 bg-white">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
                              <span className="text-[13px] font-semibold text-[#1f1d25]">Strike {strike.level}</span>
                              <span className="text-[12px] text-[#686576]">{strike.type}</span>
                            </div>
                            <span className="text-[12px] text-[#686576] shrink-0">{strike.date}</span>
                          </div>
                          <p className="text-[12px] text-[#686576] pl-4">{strike.description}</p>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Penalty assignment form — accordion open/close */}
              <AnimatePresence>
                {penaltyFormOpen && (
                  <motion.div
                    key="penalty-form"
                    ref={penaltyFormRef}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="border border-[rgba(0,0,0,0.10)] rounded-xl overflow-visible">
                      {/* Form header — only X, no title */}
                      <div className="flex items-center justify-end px-4 pt-3 pb-0">
                        <button
                          onClick={handleCancelPenalty}
                          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4 text-[#686576]" />
                        </button>
                      </div>

                      <div className="px-5 pb-5 pt-2 space-y-5">
                        {/* Violation Type */}
                        <div>
                          <label className="text-[12px] font-medium text-[#D2323F] mb-1.5 block">* Violation Type</label>
                          <CustomSelect
                            value={selectedViolationType}
                            onChange={handleViolationTypeChange}
                            options={VIOLATION_TYPES.map(v => ({ value: v.value, label: v.label }))}
                            placeholder="Select a violation type…"
                            error={false}
                          />
                        </div>

                        {/* Details */}
                        <div>
                          <label className="text-[12px] font-medium text-[#D2323F] mb-1.5 block">* Details</label>
                          <textarea
                            value={penaltyDetails}
                            onChange={(e) => setPenaltyDetails(e.target.value)}
                            rows={4}
                            placeholder="Describe the violation in detail…"
                            className="w-full border border-[#CAC9CF] rounded-lg px-3 py-2.5 text-[13px] text-[#1f1d25] bg-[#F9FAFA] focus:outline-none focus:border-[var(--brand-accent)] focus:ring-1 focus:ring-[var(--brand-accent)] transition-colors resize-none"
                          />
                        </div>

                        {/* Assign Strike */}
                        <div>
                          <p className="text-[13px] font-semibold text-[#1f1d25] mb-3">Assign Strike</p>
                          <div className="grid grid-cols-3 gap-3">
                            {STRIKE_OPTIONS.map(opt => {
                              const isSelected = selectedStrike === opt.level;
                              return (
                                <button
                                  key={opt.level}
                                  type="button"
                                  onClick={() => handleStrikeSelect(opt.level)}
                                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer text-left ${
                                    isSelected
                                      ? 'border-[var(--brand-accent)] bg-[var(--brand-accent)]/5'
                                      : 'border-[#E0E0E0] hover:border-[#CAC9CF] bg-white'
                                  }`}
                                >
                                  <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                                    isSelected ? 'border-[var(--brand-accent)]' : 'border-[#CAC9CF]'
                                  }`}>
                                    {isSelected && <div className="w-2 h-2 rounded-full bg-[var(--brand-accent)]" />}
                                  </div>
                                  <div>
                                    <p className="text-[12px] font-semibold text-[#1f1d25] leading-tight">{opt.label}</p>
                                    <p className="text-[11px] text-[#686576] leading-tight">{opt.sublabel}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Suspend Co-op Funding Eligibility */}
                        <div className={`rounded-xl border-2 p-4 transition-colors ${
                          suspendEligibility ? 'border-[rgba(210,50,63,0.4)] bg-[rgba(210,50,63,0.03)]' : 'border-[#E0E0E0] bg-white'
                        }`}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[13px] font-semibold text-[#1f1d25]">Suspend Co-op Funding Eligibility</p>
                              <p className="text-[12px] text-[#686576] mt-0.5">This blocks new funding claims and flags active claims for manual review.</p>
                            </div>
                            {/* Accessible toggle switch */}
                            <button
                              type="button"
                              role="switch"
                              aria-checked={suspendEligibility}
                              onClick={() => setSuspendEligibility(v => !v)}
                              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] focus-visible:ring-offset-2 ${
                                suspendEligibility ? 'bg-[var(--brand-accent)]' : 'bg-[#CAC9CF]'
                              }`}
                            >
                              <span
                                aria-hidden="true"
                                className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${
                                  suspendEligibility ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>

                          <AnimatePresence>
                            {suspendEligibility && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                                className="overflow-visible"
                              >
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                  <div>
                                    <label className="text-[11px] font-medium text-[#D2323F] mb-1 block">* Start date</label>
                                    <SingleDatePicker
                                      value={suspendStartDate}
                                      onChange={setSuspendStartDate}
                                      placeholder="Select date…"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[11px] font-medium text-[#D2323F] mb-1 block">* Duration (days)</label>
                                    <CustomSelect
                                      value={suspendDuration}
                                      onChange={setSuspendDuration}
                                      options={DURATION_OPTIONS.map(d => ({ value: d, label: d }))}
                                      placeholder="Select…"
                                      openUpward
                                    />
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Form actions */}
                        <div className="flex justify-end gap-3 pt-1">
                          <button
                            onClick={handleCancelPenalty}
                            className="px-5 py-2 rounded-full text-[13px] font-medium text-[#111014]/60 hover:bg-black/5 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleApplyPenalty}
                            disabled={!selectedViolationType || !penaltyDetails.trim() || selectedStrike === null}
                            className="px-6 py-2 bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] text-white rounded-full text-[13px] font-medium transition-colors shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Apply Penalty
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          )}

          {/* Workflow Activity Timeline */}
          {isWorkflowItem && wfCL.history.length > 0 && (
            <WorkflowHistoryTimeline history={wfCL.history} />
          )}

        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-[#E0E0E0] bg-white shrink-0">
        {renderFooter()}
      </div>

      {previewDoc && (
        <DocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  );
}
