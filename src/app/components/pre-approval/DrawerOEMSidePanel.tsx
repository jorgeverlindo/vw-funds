import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '@/app/contexts/LanguageContext';
import type { PreApproval } from '@/app/components/FundsPreApprovalsContent';

interface DrawerOEMSidePanelProps {
  onClose: () => void;
  onApprove: (comment: string) => void;
  onRequestRevision: (comment: string) => void;
  comment: string;
  onCommentChange: (value: string) => void;
  preApproval?: PreApproval;
}

export function DrawerOEMSidePanel({
  onClose,
  onApprove,
  onRequestRevision,
  comment,
  onCommentChange,
  preApproval,
}: DrawerOEMSidePanelProps) {
  const { t } = useTranslation();
  const [commentBoxHeight, setCommentBoxHeight] = useState(200);
  const isResizing = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between items-start py-3 border-b border-[rgba(0,0,0,0.04)]">
      <span className="text-[13px] text-[#686576] font-normal shrink-0">{label}</span>
      <span className="text-[13px] text-[#1F1D25] font-medium text-right max-w-[200px] break-words">{value}</span>
    </div>
  );

  const startResize = (e: React.MouseEvent) => {
    isResizing.current = true;
    startY.current = e.clientY;
    startHeight.current = commentBoxHeight;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResize);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const delta = startY.current - e.clientY;
    const newHeight = Math.max(150, Math.min(600, startHeight.current + delta));
    setCommentBoxHeight(newHeight);
  };

  const stopResize = () => {
    isResizing.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', stopResize);
  };

  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Derived display values — use live preApproval data when available, fall back to demo
  const id            = preApproval?.id ?? 'MFA386592';
  const lastUpdated   = preApproval ? fmt(preApproval.lastUpdated)  : 'Feb 4, 2025';
  const submittedAt   = preApproval ? fmt(preApproval.submittedAt)  : 'Feb 4, 2025';
  const submittedBy   = preApproval?.submittedBy.name ?? 'Mary Smit';
  const dealership    = preApproval
    ? `${preApproval.dealershipCode} - ${preApproval.dealershipName} (${preApproval.dealershipCity})`
    : '408252 - Jack Daniels Volkswagen (Paramus)';
  const initiativeType = preApproval?.initiativeType ?? 'Pre-Approval';
  const claimsCount   = String(preApproval?.claimsCount ?? 1);
  const contactEmail  = preApproval?.contactEmail ?? 'complianceteam@teamvelocitymarketing.com';
  const mediaChips    = (preApproval?.mediaType ?? 'SEM, Display, CRM')
    .split(',').map(s => s.trim()).filter(Boolean);
  const details       = preApproval?.description ?? 'Display Feb2025';

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      {/* Header */}
      <div className="flex-none flex items-center justify-between px-6 py-4 border-b border-[rgba(0,0,0,0.08)]">
        <h2 className="text-[16px] font-semibold text-[#1F1D25]">{t('Review Pre-approval request')}</h2>
        <button type="button" onClick={onClose} className="text-[#111014]/56 hover:text-[#111014] transition-colors cursor-pointer">
          <X size={20} />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar overflow-x-hidden pb-[220px]">
        <div className="flex flex-col gap-1">
          <h3 className="text-[14px] font-semibold text-[#1F1D25] mb-2">{t('Approval Request')}</h3>

          <Row label={t('Id')}                                     value={id} />
          <Row label={t('Last updated')}                           value={lastUpdated} />
          <Row label={t('Submitted at')}                           value={submittedAt} />
          <Row label={t('Submitted by')}                           value={submittedBy} />
          <Row label={t('Dealership')}                             value={dealership} />
          <Row label={t('Initiative Type')}                        value={t(initiativeType)} />
          <Row label={t('How many claims will you be making')}     value={claimsCount} />
          <Row label={t('Contact Information')}                    value={contactEmail} />

          <div className="py-4 border-b border-[rgba(0,0,0,0.04)]">
            <span className="text-[12px] font-bold text-[#1F1D25] block mb-2">{t('MEDIA TYPE')}</span>
            <div className="flex flex-wrap gap-2">
              {mediaChips.map(tag => (
                <span key={tag} className="px-2 py-1 bg-[#F0F2F4] rounded-[4px] text-[11px] text-[#1F1D25] font-medium">
                  {t(tag)}
                </span>
              ))}
            </div>
          </div>

          <div className="py-4">
            <span className="text-[14px] font-bold text-[#1F1D25] block mb-2">{t('Details')}</span>
            <div className="text-[13px] text-[#1F1D25] break-words whitespace-pre-wrap leading-relaxed">
              {details}
            </div>
          </div>
        </div>
      </div>

      {/* Resizable Comment + Action Section */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-[#E0E0E0] shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-20 flex flex-col"
        style={{ height: commentBoxHeight }}
      >
        {/* Drag Handle */}
        <div
          className="h-3 w-full cursor-row-resize flex items-center justify-center hover:bg-gray-50 transition-colors"
          onMouseDown={startResize}
        >
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Comment Input + Buttons */}
        <div className="flex-1 px-4 pb-4 flex flex-col gap-2 min-h-0">
          <label className="text-[12px] text-[#D2323F] font-medium shrink-0">
            * {t('Comment')}
          </label>
          <textarea
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            className="flex-1 w-full p-3 bg-[#F9FAFA] border border-[#CAC9CF] rounded-[4px] text-[13px] text-[#1F1D25] focus:outline-none focus:ring-1 focus:ring-[#473BAB] transition-all resize-none min-h-0"
            placeholder={t('Add your comments here...')}
          />

          <div className="flex justify-end gap-2 pt-1 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full text-sm font-medium text-[#473BAB] hover:bg-[#473BAB]/5 transition-colors cursor-pointer"
            >
              {t('Cancel')}
            </button>
            <button
              type="button"
              onClick={() => onRequestRevision(comment)}
              disabled={!comment.trim()}
              className="px-4 py-2 rounded-full text-sm font-medium border border-[#E17613] text-[#E17613] hover:bg-[rgba(225,118,19,0.06)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Request Revision
            </button>
            <button
              type="button"
              onClick={() => onApprove(comment)}
              className="px-6 py-2 bg-[#473BAB] hover:bg-[#3D3295] text-white rounded-full text-sm font-medium transition-colors shadow-sm cursor-pointer"
            >
              {t('Approve')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
