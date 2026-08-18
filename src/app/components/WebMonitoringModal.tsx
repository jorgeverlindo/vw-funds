import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { WCMItem } from './WebMonitoringContent';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { InteractiveAnnotation } from './pre-approval/InteractiveAnnotation';
import { getPinsForItem } from './WebMonitoringViewPanel';

// Full-size Jack Daniels VW inventory screenshot — from Dialog.tsx Figma component
const imgDialog = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071137/vw-funds/e77c7a2ee09d8ca869445423a77526a5edbb0b4e.png';

interface WebMonitoringModalProps {
  item: WCMItem;
  open: boolean;
  onClose: () => void;
  userType?: 'dealer' | 'dealer-singular' | 'dealer-emich' | 'oem';
}

export function WebMonitoringModal({ item, open, onClose }: WebMonitoringModalProps) {
  const { t } = useTranslation();
  const [annotationStates, setAnnotationStates] = useState<Record<string, boolean>>({});

  const screenshotSrc = item.screenshotHash
    ? `http://localhost:3001/api/compliance/screenshot/${item.screenshotHash}`
    : item.screenshotDataUrl || imgDialog;
  const pins = getPinsForItem(item, t);

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
                {item.id} — {item.channel === 'metaAds' ? t('Meta Ads Compliance Case') : t('Website Compliance Case')}
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
                    src={screenshotSrc /* [FV] uploaded screenshot when present */}
                    alt={item.dealership + ' inventory page'}
                    className="w-full object-cover"
                  />
                </div>

                {pins.map((pin, idx) => {
                  const key = String(idx + 1);
                  return (
                    <InteractiveAnnotation
                      key={key}
                      id={`modal-pin-${key}`}
                      number={idx + 1}
                      category={pin.category ?? 'A'}
                      ruleNumber={pin.ruleNumber}
                      title={pin.title}
                      description={pin.description}
                      x={pin.x}
                      y={pin.y}
                      isOpen={!!annotationStates[key]}
                      onToggle={() => setAnnotationStates(prev => ({ ...prev, [key]: !prev[key] }))}
                      direction={pin.direction}
                      showCategory={!!(pin.category)}
                    />
                  );
                })}
              </div>
            </div>


          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
