import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldAlert, Check } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { WCMItem } from './WebMonitoringContent';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { InteractiveAnnotation } from './pre-approval/InteractiveAnnotation';

// Full-size Jack Daniels VW inventory screenshot — from Dialog.tsx Figma component
import imgDialog from 'figma:asset/e77c7a2ee09d8ca869445423a77526a5edbb0b4e.png';

interface WebMonitoringModalProps {
  item: WCMItem;
  open: boolean;
  onClose: () => void;
}

export function WebMonitoringModal({ item, open, onClose }: WebMonitoringModalProps) {
  const { t } = useTranslation();
  // FIX 2 — annotation toggle state; start closed (pin) per spec
  const [annotationStates, setAnnotationStates] = useState({ '1': false, '2': false });

  return createPortal(
    <AnimatePresence>
      {open && (
        // Backdrop — z-[9999] to render above annotation pins (zIndex: 3000) and all other overlays
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.48)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, bounce: 0.15, type: 'spring' }}
          onClick={onClose}
        >
          {/* ── Dialog paper ── */}
          <motion.div
            className="bg-white rounded-[24px] shadow-[0px_9px_46px_8px_rgba(0,0,0,0.12),0px_24px_38px_3px_rgba(0,0,0,0.14),0px_11px_15px_-7px_rgba(0,0,0,0.2)] flex flex-col w-full max-w-[900px] max-h-[90vh]"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          >

            {/* ── Title bar ── */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-[rgba(0,0,0,0.08)] flex-shrink-0">
              <p className="font-['Roboto'] font-medium text-[20px] tracking-[0.15px] text-[#1f1d25] leading-tight">
                {item.id} - {t('Website Compliance Case')}
              </p>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer flex-shrink-0"
              >
                <X className="w-5 h-5 text-[#686576]" />
              </button>
            </div>

            {/* ── Content — scrollable ── */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              {/*
                Screenshot container: relative + overflow-visible so annotation
                bubbles can expand outside the image frame (same pattern as PreviewArea).
              */}
              <div className="relative overflow-visible rounded-xl border border-[rgba(0,0,0,0.12)]">
                {/* Image clipped at its own level */}
                <div className="overflow-hidden rounded-xl">
                  <ImageWithFallback
                    src={imgDialog}
                    alt="Jack Daniels Volkswagen inventory page"
                    className="w-full object-cover"
                  />
                </div>

                {/* Annotation 1 — x={22} y={54} direction="top-right" */}
                <InteractiveAnnotation
                  id="modal-1"
                  number={1}
                  category="WCM"
                  title="Missing Legal Disclaimer"
                  description="Offer card displays payment terms without required disclaimer language visible near the promotional copy."
                  x={22}
                  y={54}
                  isOpen={annotationStates['1']}
                  onToggle={() => setAnnotationStates(prev => ({ ...prev, '1': !prev['1'] }))}
                  direction="top-right"
                  showCategory={false}
                />

                {/* Annotation 2 — x={50} y={54} direction="top-left" */}
                <InteractiveAnnotation
                  id="modal-2"
                  number={2}
                  category="WCM"
                  title="Missing Legal Disclaimer"
                  description="Offer card displays payment terms without required disclaimer language visible near the promotional copy."
                  x={50}
                  y={54}
                  isOpen={annotationStates['2']}
                  onToggle={() => setAnnotationStates(prev => ({ ...prev, '2': !prev['2'] }))}
                  direction="top-left"
                  showCategory={false}
                />
              </div>
            </div>

            {/* ── Actions ── */}
            <div className="border-t border-[rgba(0,0,0,0.08)] px-4 py-4 flex items-center justify-end gap-2 flex-shrink-0">
              {/* Assign Penalty — Error color, red outlined (matches Denied/PenaltyApplied palette) */}
              <button className="flex items-center gap-2 rounded-full border border-[#D2323F] text-[#be0e1c] px-4 py-1.5 text-[14px] font-medium hover:bg-[rgba(210,50,63,0.08)] transition-colors cursor-pointer whitespace-nowrap">
                <ShieldAlert size={14} />
                {t('Assign Penalty')}
              </button>

              {/* Cancel — text-only, ClaimsPanel pattern */}
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-full text-sm font-medium text-[#111014]/60 hover:bg-black/5 transition-colors cursor-pointer whitespace-nowrap"
              >
                {t('Cancel')}
              </button>

              {/* Mark As Reviewed — contained primary */}
              <button className="flex items-center gap-2 bg-[#473BAB] text-white rounded-full px-4 py-1.5 text-[14px] font-medium hover:bg-[#3d329b] transition-colors cursor-pointer whitespace-nowrap">
                <Check size={14} />
                {t('Mark As Reviewed')}
              </button>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}