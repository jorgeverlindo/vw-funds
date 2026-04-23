import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useForm, Controller } from 'react-hook-form';
import { Info, Upload, Eye, Trash2, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { CustomSelect, Option } from '@/app/components/ui/CustomSelect';
import { useTranslation } from '@/app/contexts/LanguageContext';
import { useWorkflow } from '@/app/contexts/WorkflowContext';
import { DateRangePicker } from '../DateRangePicker';
import { DocumentPreviewModal } from './DocumentPreviewModal';

// ─── Types ─────────────────────────────────────────────────────────────────

interface FormValues {
  title: string;
  fund: string;
  dealershipName: string;
  initiativeType: string;
  mediaType: string;
  claimCount: string;
  details: string;
  contactInfo: string;
}

interface ClaimLine {
  description: string;
  amount: string;
}

interface PreApprovalFormProps {
  onClose?: () => void;
  onDone?: (data: FormValues) => void;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const FUND_OPTIONS: Option[] = [
  { value: 'dmf-hard-costs', label: 'DMF - Hard Costs' },
  { value: 'dmf-media-costs', label: 'DMF - Media Costs' },
];

const INITIATIVE_OPTIONS: Option[] = [
  { value: 'dmp-hard-costs', label: 'DMP - Hard Costs' },
];

const MEDIA_TYPE_OPTIONS: Option[] = [
  { value: 'auto-shows',           label: 'Auto Shows/Offsite Displays' },
  { value: 'crm',                  label: 'CRM' },
  { value: 'data-equity',          label: 'Data Equity Mining' },
  { value: 'dealer-showroom',      label: 'Dealer Showroom Components' },
  { value: 'driver-gear',          label: 'DriverGear/Halo Merchandise' },
  { value: 'email-campaigns',      label: 'Email Campaigns' },
  { value: 'inventory-management', label: 'Inventory Management Tools' },
  { value: 'non-certified-chat',   label: 'Non-Certified Chat' },
  { value: 'non-certified-trade-in', label: 'Non-Certified Trade-In Tools' },
  { value: 'outbound-sales',       label: 'Outbound Sales Calls/Call Tracking' },
  { value: 'promotional-events',   label: 'Promotional Events & Sponsorships' },
  { value: 'translation-software', label: 'Translation Software' },
];

const DEFAULT_RANGE: DateRange = { from: new Date(2026, 2, 1), to: new Date(2026, 2, 31) };

function formatRange(range: DateRange | undefined): string {
  if (!range?.from) return '';
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  const from = range.from.toLocaleDateString('en-US', opts);
  if (!range.to) return from;
  return `${from} – ${range.to.toLocaleDateString('en-US', opts)}`;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function PreApprovalForm({ onClose, onDone }: PreApprovalFormProps) {
  const { t } = useTranslation();
  const { workflow, addPreApprovalDocument, removePreApprovalDocument, updatePreApprovalData } = useWorkflow();

  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      title:        'December Offers - Specials - Pre-Approval Request',
      fund:         '',
      dealershipName: '',
      initiativeType: '',
      mediaType:    '',
      claimCount:   '1',
      details:      '',
      contactInfo:  '',
    },
  });

  // ── Date range state ──────────────────────────────────────────────────────
  const [activityRange, setActivityRange] = useState<DateRange | undefined>(DEFAULT_RANGE);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const activityBtnRef = useRef<HTMLButtonElement>(null);
  const [pickerAnchor, setPickerAnchor] = useState({ top: 0, left: 0 });

  const openDatePicker = () => {
    if (activityBtnRef.current) {
      const rect = activityBtnRef.current.getBoundingClientRect();
      setPickerAnchor({ top: rect.bottom + 4, left: Math.max(8, rect.right - 380) });
    }
    setShowDatePicker(true);
  };

  // ── Claim lines state ─────────────────────────────────────────────────────
  const claimCountRaw = watch('claimCount');
  const claimCountNum = Math.min(Math.max(parseInt(claimCountRaw || '1', 10) || 1, 1), 5);

  const [claimLines, setClaimLines] = useState<ClaimLine[]>([{ description: '', amount: '' }]);

  useEffect(() => {
    setClaimLines(prev =>
      Array.from({ length: claimCountNum }, (_, i) => prev[i] ?? { description: '', amount: '' })
    );
  }, [claimCountNum]);

  const computedTotal = claimLines.reduce((sum, line) => {
    const n = parseFloat(line.amount.replace(/[^0-9.]/g, '')) || 0;
    return sum + n;
  }, 0);

  const updateLine = (i: number, field: keyof ClaimLine, value: string) =>
    setClaimLines(prev => prev.map((l, j) => (j === i ? { ...l, [field]: value } : l)));

  // ── Sync with WorkflowContext ──────────────────────────────────────────────
  useEffect(() => {
    updatePreApprovalData(computedTotal, formatRange(activityRange));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computedTotal, activityRange]);

  // ── Expanded info ─────────────────────────────────────────────────────────
  const [isExpanded, setIsExpanded] = useState(false);
  const fundValue      = watch('fund');
  const initiativeValue = watch('initiativeType');
  useEffect(() => {
    if (fundValue && initiativeValue) setIsExpanded(true);
  }, [fundValue, initiativeValue]);

  // ── File upload ───────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeKB = file.size / 1024;
    const sizeStr = sizeKB >= 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${Math.round(sizeKB)} KB`;
    const ext = file.name.split('.').pop()?.toUpperCase() ?? 'FILE';
    // Generate blob URL for ALL file types (enables PDF iframe + image preview)
    const url = URL.createObjectURL(file);
    addPreApprovalDocument({ name: file.name, size: sizeStr, type: ext, url });
    e.target.value = '';
  };

  // Documents are always read from WorkflowContext (single source of truth)
  const uploadedDocs = workflow.preApproval.documents;

  // ── Document preview modal ────────────────────────────────────────────────
  const [previewDoc, setPreviewDoc] = useState<typeof uploadedDocs[number] | null>(null);

  // ── Form submission ───────────────────────────────────────────────────────
  const formContainerRef = useRef<HTMLDivElement>(null);

  const onSubmit = (data: FormValues) => onDone?.(data);

  const onError = (errs: Record<string, unknown>) => {
    const first = Object.keys(errs)[0];
    if (first) {
      document.getElementById(`field-${first}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit, onError)}
        className="flex flex-col h-full bg-white relative"
      >
        {/* Header */}
        <div className="flex-none flex items-center justify-between px-4 py-3 border-b border-[rgba(0,0,0,0.04)]">
          <h2 className="text-[16px] font-medium text-[#1F1D25]">{t('Details')}</h2>
          <Info size={16} className="text-[#686576]/60 cursor-help" />
        </div>

        {/* Scrollable body */}
        <div
          className="flex-1 overflow-y-auto px-4 py-4 pb-24 custom-scrollbar"
          ref={formContainerRef}
        >
          <div className="flex flex-col gap-5">

            {/* Title */}
            <div className="flex flex-col gap-1.5" id="field-title">
              <label className="text-[12px] text-[#686576] font-medium flex items-center gap-1">
                <span className="text-[#D2323F]">*</span> {t('Title')}:
              </label>
              <Controller
                name="title"
                control={control}
                rules={{ required: 'Title is required' }}
                render={({ field }) => (
                  <input
                    {...field}
                    className={cn(
                      'w-full h-10 px-3 bg-[#F9FAFA] border rounded-[4px] text-[13px] text-[#1F1D25] focus:outline-none focus:ring-1 focus:ring-[#473BAB] transition-all',
                      errors.title ? 'border-[#D2323F]' : 'border-[#CAC9CF]'
                    )}
                    placeholder={t('Enter title')}
                  />
                )}
              />
            </div>

            {/* Fund */}
            <div className="flex flex-col gap-1.5" id="field-fund">
              <label className="text-[12px] text-[#686576] font-medium flex items-center gap-1">
                <span className="text-[#D2323F]">*</span> {t('Funds')}
              </label>
              <Controller
                name="fund"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={FUND_OPTIONS.map(o => ({ ...o, label: t(o.label) }))}
                    placeholder={t('Select Fund')}
                    error={!!errors.fund}
                  />
                )}
              />
            </div>

            {/* Dealership Name */}
            <div className="flex flex-col gap-1.5" id="field-dealershipName">
              <label className="text-[12px] text-[#686576] font-medium flex items-center gap-1">
                <span className="text-[#D2323F]">*</span> {t('Dealership Name')}
              </label>
              <Controller
                name="dealershipName"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={[
                      { value: '12345',  label: '12345 - Volkswagen Anytown' },
                      { value: '408253', label: '408253 - Rick Case VW' },
                      { value: '408254', label: '408254 - Gunther VW' },
                      { value: '408255', label: '408255 - Emich VW' },
                    ]}
                    placeholder={t('Select Dealership')}
                    error={!!errors.dealershipName}
                  />
                )}
              />
            </div>

            {/* Initiative Type */}
            <div className="flex flex-col gap-1.5" id="field-initiativeType">
              <label className="text-[12px] text-[#686576] font-medium flex items-center gap-1">
                <span className="text-[#D2323F]">*</span> {t('Initiative Type')}
              </label>
              <Controller
                name="initiativeType"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={INITIATIVE_OPTIONS.map(o => ({ ...o, label: t(o.label) }))}
                    placeholder={t('Select Initiative')}
                    error={!!errors.initiativeType}
                  />
                )}
              />
            </div>

            {/* Expanded info block */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="bg-[#F0F2F4] rounded-[8px] p-4 flex flex-col gap-4 overflow-hidden"
                >
                  <div>
                    <h4 className="text-[12px] font-bold text-[#1F1D25] mb-2">{t('Description / Instruction (for Claims)')}</h4>
                    <p className="text-[11px] text-[#1F1D25] leading-relaxed">
                      {t('Please submit claims for all eligible categories for Co-Op Reimbursement:')}
                      <br />• {t('Media (except Online Inventory Listings)')}
                      <br />• {t('Experiential')}
                      <br />• {t('Tier 3 Digital Tools')}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-[12px] font-bold text-[#1F1D25]">{t('Details')}</h4>
                    <div className="flex justify-between items-center text-[11px] text-[#1F1D25] py-1 border-b border-[#111014]/10">
                      <span>{t('Reimbursement rate')}</span>
                      <span className="font-medium">100.00%</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-[#1F1D25] py-1 border-b border-[#111014]/10">
                      <span>{t('Max. Reimbursement per period')}</span>
                      <span className="font-medium">N/A</span>
                    </div>
                    <div className="flex justify-between items-start text-[11px] text-[#1F1D25] py-1">
                      <span className="max-w-[140px]">{t('Minimum expenditure threshold')}</span>
                      <span className="font-medium">N/A</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[12px] font-bold text-[#1F1D25] mb-1.5">{t('Required documents')}</h4>
                    <ul className="text-[11px] text-[#1F1D25] list-disc pl-4 space-y-0.5">
                      <li>{t('Invoice')}</li>
                      <li>{t('Proof of media / Tear sheet')}</li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Activity Period (DateRangePicker) — moved above Claim Number ── */}
            <div className="flex flex-col gap-1.5" id="field-activityPeriod">
              <label className="text-[12px] text-[#686576] font-medium flex items-center gap-1">
                <span className="text-[#D2323F]">*</span> {t('Activity Period')}
              </label>
              <button
                ref={activityBtnRef}
                type="button"
                onClick={openDatePicker}
                className="w-full h-10 px-3 bg-[#F9FAFA] border border-[#CAC9CF] rounded-[4px] text-[13px] flex items-center justify-between hover:border-[#473BAB] focus:outline-none focus:ring-1 focus:ring-[#473BAB] transition-all cursor-pointer"
              >
                <span className={activityRange?.from ? 'text-[#1F1D25]' : 'text-[#9C99A9]'}>
                  {formatRange(activityRange) || t('Select date range')}
                </span>
                <Calendar size={15} className="text-[#686576] shrink-0" />
              </button>
            </div>

            {/* ── Claim Number ── */}
            <div className="flex flex-col gap-1.5" id="field-claimCount">
              <label className="text-[12px] text-[#686576] font-medium flex items-center gap-1">
                <span className="text-[#D2323F]">*</span> {t('Claim number on this pre-approval')}
              </label>
              <Controller
                name="claimCount"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={['1', '2', '3', '4', '5'].map(v => ({ value: v, label: v }))}
                    placeholder="1"
                    error={!!errors.claimCount}
                  />
                )}
              />
            </div>

            {/* ── Claim Lines (conditional, based on claimCount) ── */}
            <div className="flex flex-col gap-2" id="field-claimLines">
              <div className="flex items-center justify-between">
                <label className="text-[12px] text-[#686576] font-medium">
                  {t('Claim Activities')}
                </label>
                <span className="text-[11px] text-[#9C99A9]">
                  {claimLines.length} {claimLines.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {claimLines.map((line, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-3 bg-[#F9FAFA] border border-[#E0E0E0] rounded-[6px]"
                >
                  <span className="text-[11px] font-bold text-[#9C99A9] w-5 text-center shrink-0">
                    {i + 1}
                  </span>
                  <input
                    value={line.description}
                    onChange={e => updateLine(i, 'description', e.target.value)}
                    placeholder={t('Activity description (e.g. Google Display)')}
                    className="flex-1 h-8 px-2 bg-white border border-[#E0E0E0] rounded-[4px] text-[12px] text-[#1F1D25] placeholder:text-[#C4C2CE] focus:outline-none focus:ring-1 focus:ring-[#473BAB] focus:border-transparent"
                  />
                  <div className="relative w-[110px] shrink-0">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[12px] text-[#686576] pointer-events-none">$</span>
                    <input
                      value={line.amount}
                      onChange={e => updateLine(i, 'amount', e.target.value)}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full h-8 pl-6 pr-2 bg-white border border-[#E0E0E0] rounded-[4px] text-[12px] text-[#1F1D25] focus:outline-none focus:ring-1 focus:ring-[#473BAB] focus:border-transparent"
                    />
                  </div>
                </div>
              ))}

              {/* Total row */}
              <div className="flex items-center justify-between px-3 py-2.5 bg-[#EEEDFB] border border-[#CAC9CF] rounded-[6px] mt-1">
                <span className="text-[12px] font-medium text-[#686576]">
                  {t('Total Amount')}
                  <span className="ml-1.5 text-[10px] font-normal text-[#9C99A9]">(auto-calculated)</span>
                </span>
                <span className="text-[15px] font-bold text-[#473BAB]">
                  ${computedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-col gap-1.5" id="field-details">
              <label className="text-[12px] text-[#686576] font-medium flex items-center gap-1">
                <span className="text-[#D2323F]">*</span> {t('Details')}
              </label>
              <Controller
                name="details"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <textarea
                    {...field}
                    className={cn(
                      'w-full min-h-[120px] p-3 bg-[#F9FAFA] border rounded-[4px] text-[13px] text-[#1F1D25] focus:outline-none focus:ring-1 focus:ring-[#473BAB] transition-all resize-none',
                      errors.details ? 'border-[#D2323F]' : 'border-[#CAC9CF]'
                    )}
                    placeholder={t('Enter details about your request...')}
                  />
                )}
              />
            </div>

            {/* Contact Info */}
            <div className="flex flex-col gap-1.5" id="field-contactInfo">
              <label className="text-[12px] text-[#686576] font-medium flex items-center gap-1">
                <span className="text-[#D2323F]">*</span> {t('Contact Information')}
              </label>
              <Controller
                name="contactInfo"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <input
                    {...field}
                    className={cn(
                      'w-full h-10 px-3 bg-[#F9FAFA] border rounded-[4px] text-[13px] text-[#1F1D25] focus:outline-none focus:ring-1 focus:ring-[#473BAB] transition-all',
                      errors.contactInfo ? 'border-[#D2323F]' : 'border-[#CAC9CF]'
                    )}
                    placeholder={t('Email or phone number')}
                  />
                )}
              />
            </div>

            {/* Media Type */}
            <div className="flex flex-col gap-1.5" id="field-mediaType">
              <label className="text-[12px] text-[#686576] font-medium flex items-center gap-1">
                <span className="text-[#D2323F]">*</span> {t('Media Type')}
              </label>
              <Controller
                name="mediaType"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={MEDIA_TYPE_OPTIONS.map(o => ({ ...o, label: t(o.label) }))}
                    placeholder={t('Select Media Type')}
                    error={!!errors.mediaType}
                  />
                )}
              />
            </div>

            {/* Supporting Documents */}
            <div className="flex flex-col gap-2 mt-2">
              <label className="text-[16px] text-[#1F1D25] font-normal">
                {t('Supporting Documents')}
              </label>

              {/* Hidden file input — must NOT use display:none (Safari blocks .click()) */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                className="absolute w-0 h-0 opacity-0 overflow-hidden pointer-events-none"
                tabIndex={-1}
                onChange={handleFileChange}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-[48px] bg-[#473BAB] hover:bg-[#3D3295] text-white rounded-[12px] text-[16px] font-medium transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload size={20} />
                {t('Upload Document')}
              </button>
              <p className="text-[11px] text-[#686576] text-center">PDF, PNG or JPG (Max. 3MB)</p>

              {uploadedDocs.length > 0 && (
                <div className="flex flex-col gap-2 mt-1">
                  {uploadedDocs.map((doc, idx) => (
                    <div key={doc.name + idx} className="border border-[#E0E0E0] rounded-lg flex overflow-hidden bg-white">
                      <div className="w-[56px] bg-[#F5F5F5] flex items-center justify-center border-r border-[#E0E0E0] shrink-0">
                        <div className="w-8 h-10 bg-white border border-[#E0E0E0] shadow-sm flex items-center justify-center">
                          <span className="text-[8px] font-bold text-[#FF5252]">{doc.type.slice(0, 4)}</span>
                        </div>
                      </div>
                      <div className="flex-1 px-3 py-2 flex items-center justify-between min-w-0">
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="text-[12px] font-medium text-[#1F1D25] break-all leading-snug">{doc.name}</span>
                          <span className="text-[10px] text-[#686576] uppercase tracking-wide">{doc.type} | {doc.size}</span>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="p-1.5 text-[#686576] hover:text-[#473BAB] hover:bg-[#473BAB]/8 rounded-full transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removePreApprovalDocument(doc.name)}
                            className="p-1.5 text-[#9C99A9] hover:text-[#D2323F] hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="flex-none p-4 bg-white border-t border-[rgba(0,0,0,0.08)] z-10">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-full text-sm font-medium text-[#111014]/60 hover:bg-black/5 transition-colors cursor-pointer"
            >
              {t('Cancel')}
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#473BAB] hover:bg-[#3D3295] text-white rounded-full text-sm font-medium transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {t('Submit')}
            </button>
          </div>
        </div>
      </form>

      {/* DateRangePicker portal overlay */}
      {showDatePicker && createPortal(
        <div
          className="fixed inset-0 z-[9998]"
          onClick={() => setShowDatePicker(false)}
        >
          <div
            className="absolute"
            style={{ top: pickerAnchor.top, left: pickerAnchor.left }}
            onClick={e => e.stopPropagation()}
          >
            <DateRangePicker
              initialRange={activityRange}
              onApply={range => { setActivityRange(range); setShowDatePicker(false); }}
              onCancel={() => setShowDatePicker(false)}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Document preview modal */}
      {previewDoc && (
        <DocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </>
  );
}
