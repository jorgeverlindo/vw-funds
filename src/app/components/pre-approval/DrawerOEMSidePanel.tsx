import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X, ChevronsUpDown } from 'lucide-react';
import { useTranslation } from '@/app/contexts/LanguageContext';

interface DrawerOEMSidePanelProps {
  onClose: () => void;
  onSend: () => void;
  comment: string;
  onCommentChange: (value: string) => void;
}

export function DrawerOEMSidePanel({ onClose, onSend, comment, onCommentChange }: DrawerOEMSidePanelProps) {
  const { t } = useTranslation();
  const [commentBoxHeight, setCommentBoxHeight] = useState(200);
  const isResizing = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  // Helper for read-only rows
  const Row = ({ label, value }: { label: string, value: React.ReactNode }) => (
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
    const delta = startY.current - e.clientY; // Dragging up increases height
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

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      {/* Header */}
      <div className="flex-none flex items-center justify-between px-6 py-4 border-b border-[rgba(0,0,0,0.08)]">
        <h2 className="text-[16px] font-semibold text-[#1F1D25]">{t('Review Pre-approval request')}</h2>
        <button onClick={onClose} className="text-[#111014]/56 hover:text-[#111014] transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar overflow-x-hidden pb-[200px]"> {/* Extra padding for comment box overlap */}
        <div className="flex flex-col gap-1">
          <h3 className="text-[14px] font-semibold text-[#1F1D25] mb-2">{t('Approval Request')}</h3>
          
          <Row label={t("Id")} value="MFA386592" />
          <Row label={t("Last updated")} value="Feb 4, 2025" />
          <Row label={t("Submitted at")} value="Feb 4, 2025" />
          <Row label={t("Submitted by")} value="Mary Smit" />
          <Row label={t("Dealership")} value="408252 - Jack Daniels Volkswagen (Paramus)" />
          <Row label={t("Initiative Type")} value={t("Pre-Approval")} />
          <Row label={t("How many claims will you be making")} value="1" />
          <Row label={t("Contact Information")} value="complianceteam@teamvelocitymarketing.com" />
          
          <div className="py-4 border-b border-[rgba(0,0,0,0.04)]">
             <span className="text-[12px] font-bold text-[#1F1D25] block mb-2">{t('MEDIA TYPE')}</span>
             <div className="flex flex-wrap gap-2">
                {['SEM', 'Display', 'CRM'].map(tag => (
                  <span key={tag} className="px-2 py-1 bg-[#F0F2F4] rounded-[4px] text-[11px] text-[#1F1D25] font-medium">
                    {t(tag)}
                  </span>
                ))}
             </div>
          </div>

          <div className="py-4">
             <span className="text-[14px] font-bold text-[#1F1D25] block mb-2">{t('Details')}</span>
             <div className="text-[13px] text-[#1F1D25] break-words">
                 Display Feb2025
             </div>
          </div>

        </div>
      </div>

      {/* Resizable Comment Section - Absolute at bottom, pushes up */}
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

         {/* Comment Input */}
         <div className="flex-1 px-4 pb-4 flex flex-col gap-2">
             <div className="flex items-center justify-between">
                <label className="text-[12px] text-[#D2323F] font-medium">
                   * {t('Comment')}
                </label>
             </div>
             <textarea 
               value={comment}
               onChange={(e) => onCommentChange(e.target.value)}
               className="flex-1 w-full p-3 bg-[#F9FAFA] border border-[#CAC9CF] rounded-[4px] text-[13px] text-[#1F1D25] focus:outline-none focus:ring-1 focus:ring-[#473BAB] transition-all resize-none"
               placeholder={t("Add your comments here...")}
             />
             
             {/* Footer Actions inside the resizable area */}
             <div className="flex justify-end gap-3 pt-2">
                <button 
                    onClick={onClose}
                    className="px-6 py-2 rounded-full text-sm font-medium text-[#473BAB] hover:bg-[#473BAB]/5 transition-colors cursor-pointer"
                >
                    {t('Cancel')}
                </button>
                <button 
                    onClick={onSend}
                    className="px-8 py-2 bg-[#473BAB] hover:bg-[#3D3295] text-white rounded-full text-sm font-medium transition-colors shadow-sm cursor-pointer"
                >
                    {t('Send')}
                </button>
             </div>
         </div>
      </div>
    </div>
  );
}
