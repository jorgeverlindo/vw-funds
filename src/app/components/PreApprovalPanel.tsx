import { useState, useRef } from 'react';
import { X, Eye, Star, Users, CheckCircle2, MessageSquare, Paperclip, Trash2, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import { PreApproval } from './FundsPreApprovalsContent';
import { StatusChip } from './StatusChip';
import { useTranslation } from '../contexts/LanguageContext';
import { KeyValueRow } from './ui/KeyValueRow';
import { WorkflowHistoryTimeline } from './WorkflowHistoryTimeline';
import {
  useWorkflow,
  WORKFLOW_PA_ID,
} from '../contexts/WorkflowContext';
import { DocumentPreviewModal } from './pre-approval/DocumentPreviewModal';

interface PreApprovalPanelProps {
  preApproval: PreApproval;
  onClose: () => void;
  userType?: 'dealer' | 'oem';
  onCreateClaim?: () => void;
}

export function PreApprovalPanel({
  preApproval,
  onClose,
  userType = 'dealer',
  onCreateClaim,
}: PreApprovalPanelProps) {
  const { t } = useTranslation();
  const {
    workflow,
    approvePreApproval,
    requestPreApprovalRevision,
    resubmitPreApproval,
    createClaim,
    addPreApprovalDocument,
    removePreApprovalDocument,
  } = useWorkflow();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeKB = file.size / 1024;
    const sizeStr = sizeKB >= 1024
      ? `${(sizeKB / 1024).toFixed(1)} MB`
      : `${sizeKB.toFixed(0)} KB`;
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'file';
    // All file types get a blob URL — images appear in carousel, PDFs open in preview modal
    const url = URL.createObjectURL(file);
    addPreApprovalDocument({ name: file.name, size: sizeStr, type: ext, url });
    // Reset so the same file can be re-added if removed
    e.target.value = '';
  };

  // Visual carousel state
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [previewDoc, setPreviewDoc] = useState<typeof wfPA.documents[number] | null>(null);

  const [oemDraftComment, setOemDraftComment] = useState('');

  // Determine whether this is the live workflow item
  const isWorkflowItem = preApproval.id === WORKFLOW_PA_ID;
  const wfPA = workflow.preApproval;
  const liveStatus = isWorkflowItem ? wfPA.status : preApproval.status;
  const liveOemComment = isWorkflowItem ? wfPA.oemComment : null;

  // ── OEM action handlers ───────────────────────────────────────────────────

  const handleApprove = () => {
    approvePreApproval(oemDraftComment.trim() || undefined);
    setOemDraftComment('');
    onClose();
  };

  const handleRequestAdjustments = () => {
    if (!oemDraftComment.trim()) return;
    requestPreApprovalRevision(oemDraftComment.trim());
    setOemDraftComment('');
    onClose();
  };

  // ── Dealer action handlers ────────────────────────────────────────────────

  const handleCreateClaim = () => {
    createClaim();
    onCreateClaim?.();
    onClose();
  };

  const handleResubmit = () => {
    resubmitPreApproval();
    onClose();
  };

  // ── Footer content ────────────────────────────────────────────────────────

  const renderFooter = () => {
    // Non-workflow items: original Cancel + Submit
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
            {t('Submit')}
          </button>
        </div>
      );
    }

    // ── OEM view ────────────────────────────────────────────────────────────
    if (userType === 'oem') {
      const canAct = liveStatus === 'Submitted' || liveStatus === 'Resubmitted';

      if (canAct) {
        return (
          <div className="space-y-3">
            {/* Comment textarea */}
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
                Approve
              </button>
            </div>
          </div>
        );
      }

      // Already acted — close only
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
    if (liveStatus === 'Approved') {
      return (
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full text-sm font-medium text-[#111014]/60 hover:bg-black/5 transition-colors cursor-pointer"
          >
            {t('Close')}
          </button>
          <button
            onClick={handleCreateClaim}
            className="flex items-center gap-2 px-6 py-2 bg-[#473BAB] hover:bg-[#3D3295] text-white rounded-full text-sm font-medium transition-colors shadow-sm cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            Create Claim
          </button>
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
            Resubmit for Review
          </button>
        </div>
      );
    }

    // Submitted / Resubmitted / In Review — read-only for dealer
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
    <>
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-[#E0E0E0] shrink-0">
        <div className="flex flex-col">
          <h2 className="text-[#1f1d25] text-[20px] font-medium tracking-[0.15px] leading-tight">
            {t('Pre-approval')} - {preApproval.id}{' '}
            ({preApproval.mediaType.split('/')[0].split(' ')[0]})
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E0E0E0] hover:bg-gray-50 transition-colors cursor-pointer">
              <Star className="w-3.5 h-3.5 text-[#9C99A9]" />
              <span className="text-[13px] font-medium text-[#1f1d25]/80">{t('Follow')}</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E0E0E0] hover:bg-gray-50 transition-colors cursor-pointer">
              <Users className="w-3.5 h-3.5 text-[#9C99A9]" />
              <span className="text-[13px] font-medium text-[#1f1d25]/80">2</span>
            </button>
            <StatusChip status={liveStatus} />
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

      {/* Body — Scrollable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="px-8 py-6 space-y-8">

          {/* OEM comment banner — dealer sees this when revision was requested */}
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

          {/* Approval Request Section */}
          <section>
            <h3 className="text-[#1f1d25] text-[15px] font-medium mb-4">{t('Approval Request')}</h3>
            <div className="space-y-0">
              <KeyValueRow
                label={t('Last updated')}
                value={preApproval.lastUpdated.toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              />
              <KeyValueRow
                label={t('Submitted at')}
                value={preApproval.submittedAt.toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              />
              <KeyValueRow label={t('Submitted by')} value={preApproval.submittedBy.name} />
              <KeyValueRow
                label={t('Dealership')}
                value={`${preApproval.dealershipCode} - ${preApproval.dealershipName} (${preApproval.dealershipCity})`}
              />
              <KeyValueRow label={t('Initiative Type')} value={t(preApproval.initiativeType)} />
              {isWorkflowItem && (
                <>
                  <KeyValueRow label="Activity Period" value={wfPA.activityPeriod} />
                  <KeyValueRow label="Total Amount" value={`$${wfPA.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                </>
              )}
              <KeyValueRow
                label={t('How many claims will you be making')}
                value={preApproval.claimsCount.toString()}
              />
              <KeyValueRow
                label={t('Contact Information')}
                value={preApproval.contactEmail}
                valueClass="text-right max-w-[300px] break-all"
              />
            </div>
          </section>

          {/* Channel Breakdown — dynamic from form claim lines */}
          {isWorkflowItem && wfPA.claimLines.length > 0 && (
            <section>
              <h3 className="text-[#1f1d25] text-[15px] font-medium mb-3">Channel Breakdown</h3>
              <div className="space-y-0">
                {wfPA.claimLines.map((line, idx) => {
                  const amt = parseFloat(line.amount) || 0;
                  return (
                    <KeyValueRow
                      key={idx}
                      label={line.description || `Activity ${idx + 1}`}
                      value={`$${amt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* Media Type Section */}
          <section>
            <h3 className="text-[#1f1d25] text-xs font-bold uppercase mb-3 tracking-[0.8px] text-[#686576]">
              {t('MEDIA TYPE')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {(() => {
                // Workflow item: show the selected media type from the form
                const mediaLabel = isWorkflowItem ? wfPA.mediaType : preApproval.mediaType;
                if (!mediaLabel) return null;
                // If it's a comma-separated list, split; otherwise show as a single chip
                const chips = mediaLabel.split(',').map(s => s.trim()).filter(Boolean);
                return chips.map(chip => (
                  <span
                    key={chip}
                    className="px-3 py-1.5 rounded-md text-[13px] font-medium bg-[#F3F4F6] text-[#1f1d25]"
                  >
                    {chip}
                  </span>
                ));
              })()}
            </div>
          </section>

          {/* Details Section */}
          <section>
            <h3 className="text-[#1f1d25] text-[15px] font-medium mb-3">{t('Details')}</h3>
            <div className="border-t border-[#E0E0E0]">
              <div className="flex justify-between items-start py-4">
                <span className="text-[#686576] text-[13px] font-normal w-1/3">{t('Description')}</span>
                <span className="text-[#1f1d25] text-[13px] font-normal w-2/3 text-right whitespace-pre-wrap leading-relaxed">
                  {isWorkflowItem ? wfPA.details : preApproval.description}
                </span>
              </div>
            </div>
          </section>

          {/* Visual Assets Carousel — shown when the PA has image documents */}
          {isWorkflowItem && (() => {
            const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']);
          const imageDocs = wfPA.documents.filter(
            d => d.url && IMAGE_EXTS.has(d.type.toLowerCase()),
          );
            if (imageDocs.length === 0) return null;
            const safeIdx = Math.min(carouselIndex, imageDocs.length - 1);
            return (
              <section>
                <h3 className="text-[#1f1d25] text-[15px] font-medium mb-3">Visual Assets</h3>
                <div className="relative rounded-xl overflow-hidden bg-[#F0F2F4] aspect-[16/9] flex items-center justify-center">
                  <img
                    src={imageDocs[safeIdx].url}
                    alt={imageDocs[safeIdx].name}
                    className="max-h-full max-w-full object-contain"
                  />
                  {/* Prev arrow */}
                  {safeIdx > 0 && (
                    <button
                      onClick={() => setCarouselIndex(safeIdx - 1)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white rounded-full shadow hover:bg-gray-50 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-[#686576]" />
                    </button>
                  )}
                  {/* Next arrow */}
                  {safeIdx < imageDocs.length - 1 && (
                    <button
                      onClick={() => setCarouselIndex(safeIdx + 1)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white rounded-full shadow hover:bg-gray-50 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-[#686576]" />
                    </button>
                  )}
                  {/* Counter badge */}
                  {imageDocs.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[11px] font-medium px-2 py-0.5 rounded-full">
                      {safeIdx + 1} / {imageDocs.length}
                    </div>
                  )}
                </div>
                {/* Thumbnail strip */}
                {imageDocs.length > 1 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto pb-1 custom-scrollbar">
                    {imageDocs.map((doc, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCarouselIndex(idx)}
                        className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                          idx === safeIdx ? 'border-[#473BAB]' : 'border-transparent hover:border-[#473BAB]/40'
                        }`}
                      >
                        <img src={doc.url} alt={doc.name} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
                {/* Filename label */}
                <p className="mt-1.5 text-[11px] text-[#686576] truncate flex items-center gap-1">
                  <ImageIcon className="w-3 h-3 shrink-0" />
                  {imageDocs[safeIdx].name}
                </p>
              </section>
            );
          })()}

          {/* Supporting Documents */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[#1f1d25] text-[15px] font-medium">{t('Supporting Documents')}</h3>
              {/* Add Document button — dealer on workflow item only */}
              {isWorkflowItem && userType === 'dealer' && (
                <>
                  {/* Must NOT use display:none — browsers block .click() on hidden inputs */}
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
                    Add Document
                  </button>
                </>
              )}
            </div>

            {(isWorkflowItem ? wfPA.documents : preApproval.documents).length > 0 ? (
              <div className="space-y-2">
                {(isWorkflowItem ? wfPA.documents : preApproval.documents).map((doc, idx) => (
                  <div
                    key={idx}
                    className="border border-[#E0E0E0] rounded-lg p-0 flex overflow-hidden bg-white max-w-md"
                  >
                    <div className="w-[72px] bg-[#F5F5F5] flex items-center justify-center border-r border-[#E0E0E0] shrink-0">
                      <div className="w-10 h-12 bg-white border border-[#E0E0E0] shadow-sm flex items-center justify-center">
                        <span className="text-[9px] font-bold text-[#FF5252]">
                          {doc.type.toUpperCase().slice(0, 4)}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 p-3 flex items-center justify-between min-w-0">
                      <div className="flex flex-col min-w-0 pr-3">
                        <span className="text-[#1f1d25] text-[13px] font-medium break-all leading-snug mb-0.5">{doc.name}</span>
                        <span className="text-[#686576] text-[11px] uppercase tracking-wide">
                          {doc.type.toUpperCase()} | {doc.size}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="text-[#686576] hover:text-[#473BAB] p-2 hover:bg-[#473BAB]/8 rounded-full transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {/* Remove button — dealer on workflow item only */}
                        {isWorkflowItem && userType === 'dealer' && (
                          <button
                            onClick={() => removePreApprovalDocument(doc.name)}
                            className="text-[#9C99A9] hover:text-[#D2323F] p-2 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-6 border border-dashed border-[#E0E0E0] rounded-xl text-center">
                <Paperclip className="w-6 h-6 text-[#9C99A9]" />
                <p className="text-[13px] text-[#9C99A9]">
                  {isWorkflowItem && userType === 'dealer'
                    ? 'No documents attached yet. Click Add Document to attach.'
                    : t('No documents attached')}
                </p>
              </div>
            )}
          </section>

          {/* Revisions — static items only (non-workflow) */}
          {!isWorkflowItem && preApproval.status === 'Revision Requested' && (
            <section className="bg-[#FFF8E1] -mx-4 px-4 py-4 rounded-lg border border-[#FFE0B2]">
              <h3 className="text-[#EF6C00] text-[15px] font-medium mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#EF6C00]" />
                {t('Revisions Required')}
              </h3>
              <div className="space-y-2 pl-4 border-l-2 border-[#FFE0B2]">
                <div className="flex justify-between items-baseline">
                  <div className="text-[13px] font-medium text-[#1f1d25]">{t('Compliance Team')}</div>
                  <div className="text-[11px] text-[#686576]">Jan 10, 2026 9:16 AM</div>
                </div>
                <p className="text-[13px] text-[#1f1d25] leading-relaxed">
                  {t('Hi! Kindly resubmit the creative, as we are currently unable to view the file. Thank you! -CS')}
                </p>
              </div>
            </section>
          )}

          {/* Workflow Activity Timeline */}
          {isWorkflowItem && wfPA.history.length > 0 && (
            <WorkflowHistoryTimeline history={wfPA.history} />
          )}

        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-[#E0E0E0] bg-white shrink-0">
        {renderFooter()}
      </div>
    </div>
    {previewDoc && (
      <DocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
    )}
    </>
  );
}
