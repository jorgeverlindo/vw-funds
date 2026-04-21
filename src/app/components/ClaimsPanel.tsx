import { useState } from 'react';
import { X, Eye, Star, MessageSquare, Banknote } from 'lucide-react';
import { StatusChip, ClaimStatus } from './StatusChip';
import { KeyValueRow } from './ui/KeyValueRow';
import { useTranslation } from '../contexts/LanguageContext';
import { WorkflowHistoryTimeline } from './WorkflowHistoryTimeline';
import {
  useWorkflow,
  WORKFLOW_CL_ID,
  WORKFLOW_PA_ID,
  WORKFLOW_CAMPAIGN,
  WORKFLOW_DEALER,
} from '../contexts/WorkflowContext';

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
}

interface ClaimsPanelProps {
  claim: Claim;
  onClose: () => void;
  userType?: 'dealer' | 'oem';
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
    resubmitClaim,
    processPayment,
  } = useWorkflow();

  const [oemDraftComment, setOemDraftComment] = useState('');

  // Detect live workflow item
  const isWorkflowItem = claim.id === WORKFLOW_CL_ID;
  const wfCL = workflow.claim;
  const liveStatus = isWorkflowItem ? (wfCL.status as ClaimStatus) : claim.status;
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
    resubmitClaim();
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
          <button className="px-6 py-2 bg-[#473BAB] hover:bg-[#3D3295] text-white rounded-full text-sm font-medium transition-colors shadow-sm cursor-pointer">
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
            <textarea
              value={oemDraftComment}
              onChange={(e) => setOemDraftComment(e.target.value)}
              placeholder="Add a comment (required for Request Adjustments)…"
              rows={3}
              className="w-full rounded-xl border border-[#E0E0E0] px-3 py-2 text-[13px] text-[#1f1d25] placeholder:text-[#9C99A9] resize-none focus:outline-none focus:border-[#473BAB] transition-colors"
            />
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
                className="px-6 py-2 bg-[#473BAB] hover:bg-[#3D3295] text-white rounded-full text-sm font-medium transition-colors shadow-sm cursor-pointer"
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
              className="flex items-center gap-2 px-6 py-2 bg-[#473BAB] hover:bg-[#3D3295] text-white rounded-full text-sm font-medium transition-colors shadow-sm cursor-pointer"
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
              className="px-6 py-2 bg-[#473BAB] hover:bg-[#3D3295] text-white rounded-full text-sm font-medium transition-colors shadow-sm cursor-pointer"
            >
              Submit Claim
            </button>
          </div>
        </div>
      );
    }

    if (liveStatus === 'Revision Requested') {
      return (
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full text-sm font-medium text-[#111014]/60 hover:bg-black/5 transition-colors cursor-pointer"
          >
            {t('Close')}
          </button>
          <button
            onClick={handleResubmit}
            className="flex items-center gap-2 px-6 py-2 bg-[#473BAB] hover:bg-[#3D3295] text-white rounded-full text-sm font-medium transition-colors shadow-sm cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            Resubmit Claim
          </button>
        </div>
      );
    }

    if (liveStatus === 'Paid') {
      return (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] text-[#2e7d32]">
            <Banknote className="w-4 h-4" />
            <span>Payment of ${WORKFLOW_CAMPAIGN.totalAmount.toLocaleString()} processed successfully.</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full text-sm font-medium text-[#111014]/60 hover:bg-black/5 transition-colors cursor-pointer"
          >
            {t('Close')}
          </button>
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

          {/* OEM comment banner — dealer sees when revision was requested */}
          {isWorkflowItem && userType === 'dealer' && liveStatus === 'Revision Requested' && liveOemComment && (
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
              <KeyValueRow
                label={t('Amount')}
                value={`$${(isWorkflowItem ? WORKFLOW_CAMPAIGN.totalAmount : claim.amount).toLocaleString()}`}
                valueClass="font-semibold text-lg"
              />
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

          {/* Channel Breakdown — workflow item only */}
          {isWorkflowItem && (
            <section>
              <h3 className="text-[#1f1d25] text-[15px] font-medium mb-3">Channel Breakdown</h3>
              <div className="space-y-0">
                {Object.entries(WORKFLOW_CAMPAIGN.channelBreakdown).map(([ch, amt]) => (
                  <KeyValueRow key={ch} label={ch} value={`$${amt.toLocaleString()}`} />
                ))}
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

          {/* Documents */}
          <section>
            <h3 className="text-[#1f1d25] text-[15px] font-medium mb-3">{t('Documents')}</h3>
            <div className="space-y-2">
              {(isWorkflowItem ? wfCL.documents : []).map((doc, idx) => (
                <div
                  key={idx}
                  className="border border-[#E0E0E0] rounded-lg p-0 flex overflow-hidden bg-white max-w-md"
                >
                  <div className="w-[72px] bg-[#F5F5F5] flex items-center justify-center border-r border-[#E0E0E0] shrink-0">
                    <div className="w-10 h-12 bg-white border border-[#E0E0E0] shadow-sm flex items-center justify-center">
                      <span className="text-[9px] font-bold text-[#FF5252]">PDF</span>
                    </div>
                  </div>
                  <div className="flex-1 p-3 flex items-center justify-between min-w-0">
                    <div className="flex flex-col min-w-0 pr-3">
                      <span className="text-[#1f1d25] text-[13px] font-medium truncate mb-0.5">
                        {doc.name}
                      </span>
                      <span className="text-[#686576] text-[11px] uppercase tracking-wide">
                        {doc.type.toUpperCase()} | {doc.size}
                      </span>
                    </div>
                    <button className="text-[#686576] hover:text-[#1f1d25] p-2 hover:bg-gray-50 rounded-full transition-colors cursor-pointer">
                      <Eye className="w-5 h-5" />
                    </button>
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
          </section>

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
    </div>
  );
}
