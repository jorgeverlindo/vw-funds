import { useRef, useState, useEffect } from 'react';
import { X, Eye, Star, Users, CheckCircle2, MessageSquare, Paperclip, Trash2, Sparkles, XCircle } from 'lucide-react';
import { PreApproval } from './FundsPreApprovalsContent';
import { OEM_ANNOTATIONS } from './pre-approval/DrawerOEMMainPane';
import { StatusChip } from './StatusChip';
import { useTranslation } from '../contexts/LanguageContext';
import { KeyValueRow } from './ui/KeyValueRow';
import { WorkflowHistoryTimeline } from './WorkflowHistoryTimeline';
import {
  useWorkflow,
} from '../contexts/WorkflowContext';
import type { PortalSubmission } from '../contexts/WorkflowContext';
import { DocumentPreviewModal } from './pre-approval/DocumentPreviewModal';

interface PreApprovalPanelProps {
  preApproval: PreApproval;
  onClose: () => void;
  userType?: 'dealer' | 'dealer-singular' | 'oem';
  onCreateClaim?: () => void;
  onOpenAIReview?: () => void;
}

export function PreApprovalPanel({
  preApproval,
  onClose,
  userType = 'dealer',
  onCreateClaim,
  onOpenAIReview,
}: PreApprovalPanelProps) {
  const { t } = useTranslation();
  const {
    workflow,
    approvePreApproval,
    requestPreApprovalRevision,
    declinePreApproval,
    resubmitPreApprovalWithComment,
    createClaim,
    addPreApprovalDocument,
    removePreApprovalDocument,
    updatePortalSubmissionStatus,
  } = useWorkflow();

  const fileInputRef      = useRef<HTMLInputElement>(null);
  const oemTextareaRef    = useRef<HTMLTextAreaElement>(null);
  const dealerTextareaRef = useRef<HTMLTextAreaElement>(null);

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

  const [previewDoc, setPreviewDoc] = useState<typeof wfPA.documents[number] | null>(null);

  const [oemDraftComment, setOemDraftComment] = useState('');
  const [dealerDraftComment, setDealerDraftComment] = useState('');

  // Auto-resize textareas whenever their value changes (handles typing and shortcut injection)
  useEffect(() => {
    const el = oemTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [oemDraftComment]);

  useEffect(() => {
    const el = dealerTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [dealerDraftComment]);

  // Determine whether this is the live workflow item
  // Matches the CURRENT active cycle — ID changes each time archiveAndReset is called
  const isWorkflowItem = preApproval.id === workflow.preApproval.id;
  // Detect portal submissions — these need OEM actions but are separate from the main PA
  const portalSub: PortalSubmission | undefined = workflow.portalSubmissions.find(
    s => s.id === preApproval.id,
  );
  const isPortalItem = !!portalSub;

  const wfPA = workflow.preApproval;
  const liveStatus = isWorkflowItem ? wfPA.status : preApproval.status;
  const liveOemComment = isWorkflowItem ? wfPA.oemComment : (portalSub?.oemComment ?? null);

  // ── OEM action handlers ───────────────────────────────────────────────────

  const handleApprove = () => {
    if (isPortalItem) {
      updatePortalSubmissionStatus(preApproval.id, 'Approved', oemDraftComment.trim() || undefined);
    } else {
      approvePreApproval(oemDraftComment.trim() || undefined);
    }
    setOemDraftComment('');
    onClose();
  };

  const handleRequestAdjustments = () => {
    if (!oemDraftComment.trim()) return;
    if (isPortalItem) {
      updatePortalSubmissionStatus(preApproval.id, 'Revision Requested', oemDraftComment.trim());
    } else {
      requestPreApprovalRevision(oemDraftComment.trim());
    }
    setOemDraftComment('');
    onClose();
  };

  const handleDeclinePreApproval = () => {
    if (isPortalItem) {
      updatePortalSubmissionStatus(preApproval.id, 'Declined', oemDraftComment.trim() || undefined);
    } else {
      declinePreApproval(oemDraftComment.trim() || undefined);
    }
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
    resubmitPreApprovalWithComment(dealerDraftComment.trim());
    setDealerDraftComment('');
    onClose();
  };

  // ── Double ⌥⌥ shortcut → fill focused input with OEM approval message ────
  useEffect(() => {
    let lastAltTs = 0;

    const buildMessage = () => {
      const id    = isWorkflowItem ? wfPA.id    : preApproval.id;
      const title = isWorkflowItem ? wfPA.title : preApproval.title;

      // Shorten activity period: "Mar 1, 2026 – Mar 31, 2026" → "Mar 26"
      const rawPeriod = isWorkflowItem ? wfPA.activityPeriod : '';
      const periodShort = rawPeriod
        ? (() => {
            const m = rawPeriod.match(/^(\w+)\s+\d+,\s+(\d{4})/);
            return m ? `${m[1]} ${m[2].slice(2)}` : rawPeriod;
          })()
        : '';

      // Parenthetical: use title if set, otherwise mediaType + period
      const mediaType  = isWorkflowItem ? wfPA.mediaType : preApproval.mediaType;
      const descriptor = title?.trim() || [mediaType, periodShort].filter(Boolean).join(' ');

      const dealerName = preApproval.dealershipName;
      const city       = preApproval.dealershipCity;

      // Derive fund from initiative type
      const init = preApproval.initiativeType ?? '';
      const fund = init.toLowerCase().includes('media') ? 'DMF - Media Costs'
                 : (init.toLowerCase().includes('cpo') || init.toLowerCase().includes('hard')) ? 'DMF - Hard Costs'
                 : 'DMF - Media Costs';

      return [
        'Hi there,',
        `Pre-approval ${id}${descriptor ? ` (${descriptor})` : ''} for ${dealerName} (${city}) has been reviewed in ${fund}. Status updated to approved.`,
        'Remarks: The ad you have submitted appears to comply with the Dealer Marketing Program Guidelines and therefore meets the requirements for pre-approval. As noted in the Guidelines, the pre-approval process does not constitute legal review by VWoA or its agency or advice from VWoA regarding compliance with any federal, state, and/or local laws, rules, or regulations. By disseminating the ad, you represent that the pre-approved ad complies with federal, state, and/or local laws, rules, or regulations and acknowledge that your dealership is solely responsible for the ad\'s compliance with federal, state, and/or local laws, rules, or regulations.',
      ].join('\n');
    };

    const inject = (el: HTMLTextAreaElement | HTMLInputElement, value: string) => {
      const proto  = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      setter?.call(el, value);
      el.dispatchEvent(new Event('input',  { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key !== 'Alt') return;
      const now = Date.now();
      if (now - lastAltTs < 450) {
        // Double ⌥ — fill whatever input/textarea is currently focused
        const el = document.activeElement;
        if (el instanceof HTMLTextAreaElement) {
          inject(el, buildMessage());
          lastAltTs = 0;
        } else if (el instanceof HTMLInputElement && el.type !== 'hidden') {
          inject(el, buildMessage());
          lastAltTs = 0;
        }
      } else {
        lastAltTs = now;
      }
    };

    // ── ⌥1 → fill focused input with revision-request template ──────────────
    const buildRevisionMessage = () => {
      const id         = isWorkflowItem ? wfPA.id    : preApproval.id;
      const title      = isWorkflowItem ? wfPA.title : preApproval.title;
      const mediaType  = isWorkflowItem ? wfPA.mediaType : preApproval.mediaType;
      const descriptor = title?.trim() || mediaType;
      const dealerName = preApproval.dealershipName;
      const dealerCity = preApproval.dealershipCity;

      return [
        `We would like to inform you that the creative asset${descriptor ? ` "${descriptor}"` : ''} submitted for pre-approval ${id} for ${dealerName} (${dealerCity}) is marked as "revision requested" as it currently does not comply with DMP guidelines.`,
        'For guidance, see the attached marked-up document:',
        'RULE – 1D - Font Types\nReference page 24 of the DMP guidelines.',
        'RULE – 6G - National Offer Advertising.\nReference page 33 of the DMP guidelines.',
        'RULE – 8E  - APR Selling Price must be disclosed in the ad.\nReference page 41 of the DMP guidelines.',
        'As noted in the Guidelines, the pre-approval process does not constitute legal review by VWoA or its agency or advice from VWoA regarding compliance with any federal, state, and/or local laws, rules, or regulations.  You represent that any ad you submit complies with federal, state, and/or local laws, rules, or regulations and acknowledge that your dealership is solely responsible for the ad\'s compliance with federal, state, and/or local laws, rules, or regulations.',
        'Thank you for your cooperation and understanding.',
      ].join('\n');
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey || e.code !== 'Digit1') return;
      e.preventDefault();
      const el = document.activeElement;
      if (el instanceof HTMLTextAreaElement) {
        inject(el, buildRevisionMessage());
      } else if (el instanceof HTMLInputElement && el.type !== 'hidden') {
        inject(el, buildRevisionMessage());
      }
    };

    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('keydown', onKeyDown);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preApproval, wfPA, isWorkflowItem]);

  // ── Footer content ────────────────────────────────────────────────────────

  const renderFooter = () => {
    // Static mock / non-interactive items: show a simple Close button
    // (workflow items and portal items both get the full OEM/dealer action bars below)
    if (!isWorkflowItem && !isPortalItem) {
      return (
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full text-sm font-medium text-[#111014]/60 hover:bg-black/5 transition-colors cursor-pointer"
          >
            {t('Close')}
          </button>
        </div>
      );
    }

    // ── OEM view ────────────────────────────────────────────────────────────
    if (userType === 'oem') {
      // OEM can review any PA that hasn't been finally approved/declined yet.
      // For the live workflow item this maps to 'Submitted'/'Resubmitted';
      // for static mock items it maps to 'Pending'/'In Review'/'Revision Requested'.
      const canAct = liveStatus !== 'Approved' && liveStatus !== 'Declined';

      if (canAct) {
        return (
          <div className="space-y-3">
            <textarea
              ref={oemTextareaRef}
              value={oemDraftComment}
              onChange={(e) => setOemDraftComment(e.target.value)}
              placeholder="Add a comment (required for Request Adjustments)…"
              rows={1}
              className="w-full rounded-xl border border-[#E0E0E0] px-3 py-2 text-[13px] text-[#1f1d25] placeholder:text-[#9C99A9] resize-none overflow-hidden focus:outline-none focus:border-[var(--brand-accent)] transition-colors"
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
                onClick={handleDeclinePreApproval}
                className="flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium border border-[#D2323F] text-[#D2323F] hover:bg-[rgba(210,50,63,0.06)] transition-colors cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                Decline
              </button>
              <button
                onClick={handleApprove}
                className="px-6 py-2 bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] text-white rounded-full text-sm font-medium transition-colors shadow-sm cursor-pointer"
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
            className="flex items-center gap-2 px-6 py-2 bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] text-white rounded-full text-sm font-medium transition-colors shadow-sm cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            Create Claim
          </button>
        </div>
      );
    }

    if (liveStatus === 'Revision Requested') {
      return (
        <div className="space-y-3">
          <textarea
            ref={dealerTextareaRef}
            value={dealerDraftComment}
            onChange={(e) => setDealerDraftComment(e.target.value)}
            placeholder="Add a reply to the OEM (optional)…"
            rows={1}
            className="w-full rounded-xl border border-[#E0E0E0] px-3 py-2 text-[13px] text-[#1f1d25] placeholder:text-[#9C99A9] resize-none overflow-hidden focus:outline-none focus:border-[var(--brand-accent)] transition-colors"
          />
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
              Resubmit for Review
            </button>
          </div>
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

          {/* AI Review button — OEM only, visible on any selected PA */}
          {userType === 'oem' && onOpenAIReview && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onOpenAIReview}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--brand-accent)] text-white text-[13px] font-medium hover:bg-[var(--brand-accent-hover)] transition-colors cursor-pointer shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                AI Review {OEM_ANNOTATIONS.length} Items
              </button>
            </div>
          )}

          {/* Visual Assets — horizontal thumbnail gallery (top of panel, both modes) */}
          {isWorkflowItem && (() => {
            const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']);
            const imageDocs = wfPA.documents.filter(
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
                            onClick={() => removePreApprovalDocument(doc.name)}
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

          {/* Approval Request Section — ordered to match the form */}
          <section>
            <h3 className="text-[#1f1d25] text-[15px] font-medium mb-4">{t('Approval Request')}</h3>
            <div className="space-y-0">
              {/* Title — first field in the form */}
              {(isWorkflowItem ? wfPA.title : preApproval.title) && (
                <KeyValueRow
                  label={t('Title')}
                  value={isWorkflowItem ? wfPA.title : (preApproval.title ?? '')}
                />
              )}
              <KeyValueRow label={t('Submitted by')} value={preApproval.submittedBy.name} />
              <KeyValueRow
                label={t('Submitted at')}
                value={preApproval.submittedAt.toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              />
              <KeyValueRow
                label={t('Last updated')}
                value={preApproval.lastUpdated.toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              />
              <KeyValueRow
                label={t('Dealership')}
                value={`${preApproval.dealershipCode} - ${preApproval.dealershipName} (${preApproval.dealershipCity})`}
              />
              <KeyValueRow label={t('Initiative Type')} value={t(preApproval.initiativeType)} />
              {isWorkflowItem && (
                <KeyValueRow label="Activity Period" value={wfPA.activityPeriod} />
              )}
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
                <div className="flex items-center justify-between py-3 border-t-2 border-[var(--brand-accent)]/20 mt-1">
                  <span className="text-[#1f1d25] text-[13px] font-medium">{t('Total Amount')}</span>
                  <span className="text-[var(--brand-accent)] text-[15px] font-bold">
                    ${wfPA.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* Details Section — before Media Type to match form order */}
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

          {/* Media Type Section */}
          <section>
            <h3 className="text-[#1f1d25] text-xs font-bold uppercase mb-3 tracking-[0.8px] text-[#686576]">
              {t('MEDIA TYPE')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {(() => {
                const mediaLabel = isWorkflowItem ? wfPA.mediaType : preApproval.mediaType;
                if (!mediaLabel) return null;
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

          {/* Supporting Documents */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[#1f1d25] text-[15px] font-medium">{t('Supporting Documents')}</h3>
              {/* Add Document button — all users on the live workflow item */}
              {isWorkflowItem && (
                <>
                  {/* Must NOT use display:none — browsers block .click() on hidden inputs */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.mp4,.webm,.mov,.avi,.m4v"
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
                          className="text-[#686576] hover:text-[var(--brand-accent)] p-2 hover:bg-[var(--brand-accent)]/8 rounded-full transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {/* Remove button — non-OEM users on the live workflow item */}
                        {isWorkflowItem && userType !== 'oem' && (
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
                  {isWorkflowItem
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
            <WorkflowHistoryTimeline
              history={wfPA.history}
              onPreviewDoc={setPreviewDoc}
            />
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
