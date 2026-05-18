// [FV] WebMonitoringCreateForm — OEM Add Infraction + dealer Report Infraction flows.
// Decomposed from WebMonitoringPanel.tsx.

// [FV] WebMonitoringCreateForm — OEM Add Infraction + dealer Report Infraction flows.
// Decomposed from WebMonitoringPanel.tsx.

import { useState, useRef, ChangeEvent, DragEvent, ReactNode } from 'react';
import { X, Check, UploadCloud, Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { WCMItem } from './WebMonitoringContent';
import { StatusChip } from './StatusChip';
import { InteractiveAnnotation } from './pre-approval/InteractiveAnnotation';
import { CustomSelect } from './ui/CustomSelect';
import { emitSnackbar } from './Snackbar';

// ─── Constants ────────────────────────────────────────────────────────────────

const SEVERITY_OPTIONS = ['Low', 'Medium', 'High'] as const;
const STATUS_OPTIONS   = ['Open', 'In Review', 'Resolved', 'Penalty Applied'] as const;
const CHANNEL_OPTIONS  = ['Website', 'Social', 'Search', 'Display'] as const;

// Plausible variation pools used to simulate AI auto-fill from a screenshot
const AI_POOL = {
  dealerships: [
    'Jack Daniels Volkswagen',
    'Emich Volkswagen',
    'Volkswagen of Downtown LA',
    'Jim Ellis Volkswagen',
    'Hendrick Volkswagen Frisco',
    'Volkswagen of Union',
    'Palisades Volkswagen',
    'Trend Motors Volkswagen',
    'Open Road Volkswagen Manhattan',
    'Douglas Volkswagen',
  ],
  severities: ['Low', 'Medium', 'High'] as const,
};

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function todayFormatted(): string {
  const now = new Date();
  return now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function nextInfractionId(): string {
  // randomized 5-digit suffix in the WCM-2xxxx range to feel consistent
  const n = 24200 + Math.floor(Math.random() * 800);
  return `WCM-${n}`;
}

// ─── Row layout helpers ───────────────────────────────────────────────────────

const ROW_LABEL_CLS = 'text-[#686576] text-[13px] font-normal w-[160px] flex-shrink-0';

function FormRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center py-2.5 border-b border-[#F0F0F0] last:border-0 gap-3">
      <span className={ROW_LABEL_CLS}>{label}</span>
      {children}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

// [FV] fallback identity (Jack Daniels) used when role-derived identity isn't passed in
const DEALER_REPORTING_USER_NAME_FALLBACK = 'Mallory Manning';
const DEALER_OWN_DEALERSHIP_FALLBACK = 'Jack Daniels Volkswagen';

interface WebMonitoringCreateFormProps {
  onClose: () => void;
  onSave?: (infraction: WCMItem) => void;
  // [FV] when set to a dealer role, render the dealer-report banner and tag the saved row with reportedBy
  userType?: 'dealer' | 'dealer-singular' | 'dealer-emich' | 'oem';
  // [FV] dealer identity — drives AI auto-fill (excludes own dealer from target pool) and reportedBy
  currentDealerName?: string;
  currentReporterName?: string;
}

export function WebMonitoringCreateForm({
  onClose, onSave, userType = 'oem',
  currentDealerName, currentReporterName,
}: WebMonitoringCreateFormProps) {
  const { t } = useTranslation();
  const isDealerReport = userType !== 'oem';
  const ownDealership   = currentDealerName   ?? DEALER_OWN_DEALERSHIP_FALLBACK;
  const reporterName    = currentReporterName ?? DEALER_REPORTING_USER_NAME_FALLBACK;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [screenshot, setScreenshot]       = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing]     = useState(false);
  const [aiFilled, setAiFilled]           = useState(false);
  const [dropError, setDropError]         = useState<string | null>(null);
  const [isDragOver, setIsDragOver]       = useState(false);

  // [FV] open/close state for the OEM-logo pin overlaid on the uploaded screenshot
  const [createPinOpen, setCreatePinOpen] = useState(false);
  const [detectedOn, setDetectedOn]       = useState(todayFormatted());
  const [dealership, setDealership]       = useState('');
  const [violationType, setViolationType] = useState('');
  const [channel, setChannel]             = useState<string>('Website');
  const [url, setUrl]                     = useState('');
  const [severity, setSeverity]           = useState<string>('Medium');
  // [FV] dealer reports start Pending (awaiting OEM acceptance); OEM-added start Open
  const [status, setStatus]               = useState<string>(isDealerReport ? 'Pending' : 'Open');
  const [comments, setComments]           = useState('');

  function handleFile(file: File) {
    setDropError(null);
    if (!/^image\/(png|jpe?g)$/.test(file.type)) {
      setDropError(t('Only PNG or JPG screenshots are accepted.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setScreenshot(reader.result as string);
      runAiAutofill();
    };
    reader.readAsDataURL(file);
  }

  function runAiAutofill() {
    setIsAnalyzing(true);
    setAiFilled(false);
    setTimeout(() => {
      // [FV] início — demo flow
      // OEM mode: always Jack Daniels OEM-logo violation
      // Dealer mode: report is about ANOTHER dealership, so pick from the pool excluding own dealer
      if (isDealerReport) {
        // [FV] dealer-report: target a different dealership than the reporter's own
        // Jack Daniels → reports Emich; Emich → reports Jack Daniels (so the demo flows both ways)
        const target = ownDealership === 'Jack Daniels Volkswagen'
          ? { dealership: 'Emich Volkswagen', url: 'https://www.emichvw.com/' }
          : { dealership: 'Jack Daniels Volkswagen', url: 'https://www.jackdanielsvw.com/' };
        setDealership(target.dealership);
        setUrl(target.url);
        setViolationType('Missing Disclosure');
      } else {
        setDealership('Jack Daniels Volkswagen');
        setUrl('https://www.jackdanielsvw.com/');
        setViolationType('Incorrect OEM logo usage');
      }
      // [FV] dealer-report comments: Facebook Ads Library evidence link + violation label
      if (isDealerReport) {
        setComments(
          'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&id=1295584492020416&is_targeted_country=false&media_type=all&search_type=page&sort_data[mode]=total_impressions&sort_data[direction]=desc&view_all_page_id=108224100619\n\nMissing Disclosure'
        );
      } else {
        setComments(
          'The logo formatting, with address info between the OEM and the dealership logo, is a compliance infraction. Please make sure the OEM and the dealership logo appear together with the address information guarding more horizontal space from them.'
        );
      }
      // [FV] fim
      setSeverity(pickRandom(AI_POOL.severities));
      setChannel('Website');
      setDetectedOn(todayFormatted());
      setIsAnalyzing(false);
      setAiFilled(true);
      emitSnackbar(t('AI analyzed screenshot — fields populated. Review before saving.'));
    }, 1500);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function onSelectFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  const canSave = !!screenshot && dealership.trim() && violationType.trim() && url.trim();

  function handleSave() {
    if (!canSave) return;
    const infraction: WCMItem = {
      id: nextInfractionId(),
      detectedOn: detectedOn || todayFormatted(),
      dealership: dealership.trim(),
      violationType: violationType.trim(),
      source: 'Manually Added', // [FV] OEM-created infractions are always Manually Added
      url: url.trim(),
      severity,
      status,
      comments: comments.trim() || undefined,
      screenshotDataUrl: screenshot ?? undefined,
      // [FV] dealer-side report carries the reporter name so the OEM bell can surface it
      reportedBy: isDealerReport ? reporterName : undefined,
      createdAtISO: new Date().toISOString(),
    };
    onSave?.(infraction);
    onClose();
  }

  // [FV] left-aligned inputs to match the view-mode KV row alignment
  const inputCls = 'flex-1 text-left bg-transparent border border-[#E0E0E0] rounded-md px-2 py-1 text-[13px] text-[#1f1d25] focus:outline-none focus:border-[#473BAB] focus:ring-1 focus:ring-[#473BAB]';

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-[#E0E0E0] shrink-0">
        <div className="flex flex-col min-w-0">
          <h2 className="text-[#1f1d25] text-[20px] font-medium tracking-[0.15px] leading-tight truncate">
            {isDealerReport ? t('Report Infraction') : t('New Infraction')}
          </h2>
          <span className="text-sm text-[#686576] mt-1">
            {isDealerReport ? t('Flag a compliance violation by another dealership') : t('Manually report a compliance violation')}
          </span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          <StatusChip status={status} />
          <div className="w-px h-6 bg-[#E0E0E0]" />
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
            <X className="w-5 h-5 text-[#686576]" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="px-8 py-6 space-y-6">

          {/* [FV] início — dealer report banner (English, yellow alert) */}
          {isDealerReport && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-[10px] border border-[#F4C25A] bg-[#FFF8E1] p-3"
            >
              <AlertTriangle className="w-5 h-5 text-[#B45309] flex-shrink-0 mt-0.5" />
              <div className="text-[12px] leading-relaxed text-[#5C3A02]">
                <p className="font-medium text-[#5C3A02]">You are about to report an infraction by another dealership.</p>
                <p className="mt-0.5">The reported dealership will not be informed that you submitted this report.</p>
              </div>
            </div>
          )}
          {/* [FV] fim */}

          {/* Issue Preview — dropzone first so AI auto-fill happens before review */}
          <section>
            <div>
              <h3 className="text-[#1f1d25] text-[15px] font-medium">{t('Issue Preview')}</h3>
              <p className="text-[11px] text-[#9C99A9] mt-1">
                {t('Drop a PNG or JPG screenshot. Our AI will identify the violation and pre-fill the fields below.')}
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={onSelectFile}
            />

            {!screenshot ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`mt-3 rounded-2xl border-2 border-dashed transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 py-12 px-6 text-center ${
                  isDragOver ? 'border-[#473BAB] bg-[rgba(71,59,171,0.04)]' : 'border-[#D0CFD7] bg-[#FAFAFB] hover:bg-[#F5F4F8]'
                }`}
              >
                <UploadCloud className="w-8 h-8 text-[#9C99A9]" />
                <p className="text-[13px] font-medium text-[#1f1d25]">
                  {t('Drag a screenshot here, or click to browse')}
                </p>
                <p className="text-[11px] text-[#9C99A9]">PNG or JPG · max 10MB</p>
                {dropError && <p className="text-[11px] text-[#D2323F] mt-1">{dropError}</p>}
              </div>
            ) : (
              // [FV] outer keeps the rounded border but no overflow-hidden, so the pin bubble can expand outside the image
              <div className="mt-3 rounded-2xl border border-[rgba(0,0,0,0.12)] relative">
                {/* image is clipped at its own level */}
                <div className="overflow-hidden rounded-2xl max-h-[260px] relative">
                  <img src={screenshot} alt="Uploaded screenshot" className="w-full max-h-[260px] object-cover object-top" />
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 text-[#473BAB] animate-spin" />
                      <p className="text-[12px] font-medium text-[#1f1d25]">{t('AI analyzing screenshot…')}</p>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute top-2 right-2 px-3 py-1 rounded-full bg-white/90 text-[11px] font-medium text-[#1f1d25] border border-[#E0E0E0] hover:bg-white cursor-pointer z-10"
                >
                  {t('Replace')}
                </button>
                {aiFilled && !isAnalyzing && (
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 border border-[#E0E0E0] z-10">
                    <Sparkles className="w-3 h-3 text-[#473BAB]" />
                    <span className="text-[11px] font-medium text-[#473BAB]">{t('AI pre-filled')}</span>
                  </div>
                )}
                {/* [FV] pin label adapts to flow: dealer-report → Missing Disclosure; OEM → Incorrect OEM logo usage */}
                {aiFilled && !isAnalyzing && (
                  <InteractiveAnnotation
                    id="create-logo-pin"
                    number={1}
                    category="WCM"
                    title={isDealerReport ? t('Missing Disclosure') : t('Incorrect OEM logo usage')}
                    description={
                      isDealerReport
                        ? t('Required compliance disclosure is missing from the ad.')
                        : t('The logo formatting, with address info between the OEM and the dealership logo, is a compliance infraction.')
                    }
                    x={26}
                    y={5}
                    isOpen={createPinOpen}
                    onToggle={() => setCreatePinOpen((o) => !o)}
                    direction="top-left"
                    showCategory={false}
                  />
                )}
              </div>
            )}
          </section>

          {/* [FV] Comments — moved above Violation Details so the AI-generated note sits next to the screenshot */}
          <section>
            <h3 className="text-[#1f1d25] text-[15px] font-medium mb-2">{t('Comments')}</h3>
            <textarea
              className="w-full bg-white border border-[#E0E0E0] rounded-md px-3 py-2 text-[13px] text-[#1f1d25] focus:outline-none focus:border-[#473BAB] focus:ring-1 focus:ring-[#473BAB] resize-none"
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={t('Add internal notes about this infraction…')}
            />
          </section>

          {/* Violation Details — same field set as view mode, but as inputs */}
          <section>
            <h3 className="text-[#1f1d25] text-[15px] font-medium mb-4">{t('Violation Details')}</h3>
            <div className="space-y-0">
              <FormRow label={t('Detected On')}>
                <input className={inputCls} value={detectedOn} onChange={(e) => setDetectedOn(e.target.value)} placeholder={todayFormatted()} />
              </FormRow>
              <FormRow label={t('Dealership')}>
                <CustomSelect
                  className="flex-1"
                  value={dealership}
                  onChange={setDealership}
                  placeholder={t('Select dealership')}
                  options={AI_POOL.dealerships.map(d => ({ value: d, label: d }))}
                />
              </FormRow>
              <FormRow label={t('Violation Type')}>
                <input className={inputCls} value={violationType} onChange={(e) => setViolationType(e.target.value)} placeholder={t('Describe the violation')} />
              </FormRow>
              <FormRow label={t('Channel')}>
                <CustomSelect
                  className="flex-1"
                  value={channel}
                  onChange={setChannel}
                  options={CHANNEL_OPTIONS.map(c => ({ value: c, label: c }))}
                />
              </FormRow>
              <FormRow label={t('Website / URL')}>
                <input className={inputCls} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="example.com/path" />
              </FormRow>
              <FormRow label={t('Severity')}>
                <CustomSelect
                  className="flex-1"
                  value={severity}
                  onChange={setSeverity}
                  options={SEVERITY_OPTIONS.map(s => ({ value: s, label: s }))}
                />
              </FormRow>
              {/* [FV] dealer reports lock the status to Pending; OEM picks freely */}
              {!isDealerReport && (
                <FormRow label={t('Status')}>
                  <CustomSelect
                    className="flex-1"
                    value={status}
                    onChange={setStatus}
                    options={STATUS_OPTIONS.map(s => ({ value: s, label: s }))}
                  />
                </FormRow>
              )}
            </div>
          </section>

        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-8 py-4 border-t border-[#E0E0E0] flex-shrink-0">
        <button
          onClick={onClose}
          className="px-6 py-2 rounded-full text-sm font-medium text-[#111014]/60 hover:bg-black/5 transition-colors cursor-pointer"
        >
          {t('Cancel')}
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="flex items-center gap-2 px-6 py-2 bg-[#473BAB] hover:bg-[#3D3295] disabled:bg-[#D0CFD7] disabled:cursor-not-allowed text-white rounded-full text-sm font-medium transition-colors shadow-sm cursor-pointer whitespace-nowrap"
        >
          <Check className="w-4 h-4" />
          {t('Report Infraction')}
        </button>
      </div>
    </div>
  );
}
