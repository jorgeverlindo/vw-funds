import { useState } from 'react';
import { Star, X, ShieldAlert, Check } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { WCMItem, wcmStatusToChipStatus } from './WebMonitoringContent';
import { StatusChip, SeverityChip } from './StatusChip';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { InteractiveAnnotation } from './pre-approval/InteractiveAnnotation';
import { KeyValueRow } from './ui/KeyValueRow';

// Jack Daniels VW thumbnail — from RpWebMonitoring Figma component
import imgScreenshot from 'figma:asset/474e8b063908875e688d0c1396b3726c6afa9ce4.png';

interface WebMonitoringPanelProps {
  item: WCMItem;
  onClose: () => void;
  onOpenModal: () => void;
}


export function WebMonitoringPanel({ item, onClose, onOpenModal }: WebMonitoringPanelProps) {
  const { t } = useTranslation();
  // FIX 2 — annotation toggle state; start closed (pin) per spec
  const [annotationStates, setAnnotationStates] = useState({ '1': false, '2': false });

  const handleOpenModal = () => {
    onOpenModal();
  };

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
              <StatusChip status={item.status} />
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

            {/* ── Section: Violation Details ── */}
            <section>
              <h3 className="text-[#1f1d25] text-[15px] font-medium mb-4">{t('Violation Details')}</h3>
              <div className="space-y-0">
                <KeyValueRow label={t('Detected On')}    value={item.detectedOn} />
                <KeyValueRow label={t('Dealership')}     value={item.dealership} />
                <KeyValueRow label={t('Violation Type')} value={item.violationType} />
                <KeyValueRow label={t('Channel')}        value="Website" />
                <KeyValueRow
                  label={t('Website / URL')}
                  value={
                    <a
                      href={`https://${item.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#473BAB] hover:underline"
                    >
                      {item.url}
                    </a>
                  }
                />
                <KeyValueRow label={t('Severity')} value={<SeverityChip severity={item.severity} />} />
              </div>
            </section>

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
                    jackdanielsvw.com/lease-offers
                  </span>
                </div>

                {/* Screenshot area — relative + overflow-visible for annotation expansion */}
                <div className="relative overflow-visible">
                  {/* Image clipped at its own level */}
                  <div className="max-h-[260px] overflow-hidden rounded-b-2xl">
                    <ImageWithFallback
                      src={imgScreenshot}
                      alt="Jack Daniels Volkswagen website screenshot"
                      className="w-full object-cover object-top"
                    />
                  </div>

                  {/* Annotation 1 */}
                  <InteractiveAnnotation
                    id="1"
                    number={1}
                    category="WCM"
                    title="Missing Legal Disclaimer"
                    description="Offer card displays payment terms without required disclaimer language visible near the promotional copy."
                    x={18}
                    y={56}
                    isOpen={annotationStates['1']}
                    onToggle={() => setAnnotationStates(prev => ({ ...prev, '1': !prev['1'] }))}
                    direction="top-right"
                    showCategory={false}
                  />

                  {/* Annotation 2 */}
                  <InteractiveAnnotation
                    id="2"
                    number={2}
                    category="WCM"
                    title="Missing Legal Disclaimer"
                    description="Offer card displays payment terms without required disclaimer language visible near the promotional copy."
                    x={48}
                    y={56}
                    isOpen={annotationStates['2']}
                    onToggle={() => setAnnotationStates(prev => ({ ...prev, '2': !prev['2'] }))}
                    direction="top-left"
                    showCategory={false}
                  />
                </div>
              </div>
            </section>

          </div>
        </div>

        {/* ── FIX 3: Footer action bar ── */}
        <div className="flex items-center justify-end gap-3 px-8 py-4 border-t border-[#E0E0E0] flex-shrink-0">
          {/* Assign Penalty — Error color, red outlined (matches Denied chip palette) */}
          <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#D2323F] text-[#be0e1c] text-[13px] font-medium hover:bg-[rgba(210,50,63,0.08)] transition-colors cursor-pointer whitespace-nowrap">
            <ShieldAlert className="w-4 h-4" />
            {t('Assign Penalty')}
          </button>
          {/* Cancel — text-only, ClaimsPanel pattern */}
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full text-sm font-medium text-[#111014]/60 hover:bg-black/5 transition-colors cursor-pointer"
          >
            {t('Cancel')}
          </button>
          {/* Mark As Reviewed — contained primary, ClaimsPanel pattern */}
          <button className="flex items-center gap-2 px-6 py-2 bg-[#473BAB] hover:bg-[#3D3295] text-white rounded-full text-sm font-medium transition-colors shadow-sm cursor-pointer whitespace-nowrap">
            <Check className="w-4 h-4" />
            {t('Mark As Reviewed')}
          </button>
        </div>

      </div>

    </>
  );
}