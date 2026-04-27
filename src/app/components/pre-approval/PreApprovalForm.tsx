import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useForm, Controller } from 'react-hook-form';
import { Info, Upload, Eye, Trash2, Calendar, Plus, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { CustomSelect, Option } from '@/app/components/ui/CustomSelect';
import { useTranslation } from '@/app/contexts/LanguageContext';
import { useWorkflow, WORKFLOW_DEALER } from '@/app/contexts/WorkflowContext';
import { useFilters } from '@/app/contexts/FilterContext';
import { useOverviewData } from '@/data/access/useOverviewData';
import { DateRangePicker } from '../DateRangePicker';
import type { ClaimLineItem } from '@/app/contexts/WorkflowContext';
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

// Re-use the context type so they're always compatible
type ClaimLine = ClaimLineItem;

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
  { value: 'cpo-activity',   label: 'CPO Activity' },
  { value: 'dmp-media-costs', label: 'DMP - Media Costs' },
];

// Fund → eligible Initiative values (filters the dropdown so Media funds
// only show Media initiatives, and vice versa).
const FUND_TO_INITIATIVES: Record<string, string[]> = {
  'dmf-hard-costs':  ['cpo-activity'],
  'dmf-media-costs': ['dmp-media-costs'],
};

// Hard-costs media types (shown when CPO Activity is selected)
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

// Media-costs media types (shown when DMP - Media Costs is selected)
const MEDIA_COST_TYPE_OPTIONS: Option[] = [
  { value: 'broadcast-radio',          label: 'Broadcast Radio' },
  { value: 'broadcast-tv',             label: 'Broadcast TV/Cable' },
  { value: 'cds-ev',                   label: 'CDS - EV Digital Ad Campaign' },
  { value: 'cpo-15pct',                label: 'Certified Pre-Owned @ 15% Capped Spending' },
  { value: 'digital-audio',            label: 'Digital Audio/Podcast' },
  { value: 'direct-mail',              label: 'Direct Mail' },
  { value: 'display-banners',          label: 'Display/Internet Banners' },
  { value: 'email-campaigns-mc',       label: 'Email Campaigns' },
  { value: 'inventory-listing',        label: 'Inventory Listing/3rd Party Leads' },
  { value: 'non-certified-digital',    label: 'Non-Certified Digital Advertising' },
  { value: 'online-video',             label: 'Online Video Marketing/Pre-Roll/Connected TV/OTT' },
  { value: 'organic-social',           label: 'Organic Social/Online Reputation Management' },
  { value: 'promotional-events-mc',    label: 'Promotional Events & Sponsorships' },
  { value: 'search-sem',               label: 'Search (SEM)' },
  { value: 'search-seo',               label: 'Search (SEO)' },
  { value: 'sms',                      label: 'SMS' },
  { value: 'social-media-advertising', label: 'Social Media Advertising' },
  { value: 'social-influencers',       label: 'Social Media Influencers/Blog' },
  { value: 'website-banner',           label: 'Website Dashboard Banner' },
];

// All options combined — used for label lookup across both lists
const ALL_MEDIA_TYPE_OPTIONS = [...MEDIA_TYPE_OPTIONS, ...MEDIA_COST_TYPE_OPTIONS];

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
  const { isLockedDealership } = useFilters();
  const { kpis } = useOverviewData();

  // Hydrate form defaults from the workflow so reopening the drawer preserves
  // whatever the dealer already filled in. Without this, the sync effect
  // dispatches empty defaults and wipes the context on remount.
  const wfPA = workflow.preApproval;
  // Hydrate saved state only when the PA is still a Draft — meaning the user
  // previously started filling the form but closed without submitting. For any
  // other status (Submitted, Approved, etc.) always start fresh so the Claim
  // Activities data grid doesn't pre-populate with demo / previous-cycle data.
  const isDraft = wfPA.status === 'Draft';
  const initialMediaTypeValue = isDraft
    ? MEDIA_TYPE_OPTIONS.find(o => o.label === wfPA.mediaType)?.value ?? ''
    : '';

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      title:        '',
      fund:         '',
      dealershipName: '',
      initiativeType: '',
      mediaType:    initialMediaTypeValue,
      claimCount:   String(isDraft ? Math.max(1, wfPA.claimLines.length) : 1),
      details:      isDraft ? wfPA.details ?? '' : '',
      contactInfo:  '',
    },
  });

  // ── Date range state ──────────────────────────────────────────────────────
  // Parse the stored `activityPeriod` string ("Mar 1, 2026 – Mar 31, 2026")
  // back into a DateRange so the picker opens on the saved selection.
  const parseActivityPeriod = (s: string): DateRange | undefined => {
    if (!s) return undefined;
    const [fromStr, toStr] = s.split(' – ');
    const from = fromStr ? new Date(fromStr) : undefined;
    const to   = toStr   ? new Date(toStr)   : undefined;
    if (!from || isNaN(from.getTime())) return undefined;
    return { from, to: to && !isNaN(to.getTime()) ? to : undefined };
  };
  const [activityRange, setActivityRange] = useState<DateRange | undefined>(
    () => isDraft ? parseActivityPeriod(wfPA.activityPeriod) ?? DEFAULT_RANGE : DEFAULT_RANGE,
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const activityBtnRef = useRef<HTMLButtonElement>(null);
  // "bottom" positions the picker above the button; "left" aligns it right-edge of the 600px panel
  const [pickerAnchor, setPickerAnchor] = useState({ bottom: 0, left: 0 });

  const openDatePicker = () => {
    if (activityBtnRef.current) {
      const rect = activityBtnRef.current.getBoundingClientRect();
      setPickerAnchor({
        bottom: window.innerHeight - rect.top + 6,   // 6px gap above button top
        left: Math.max(8, rect.right - 600),         // right-align to button, min 8px from left
      });
    }
    setShowDatePicker(true);
  };

  // ── Claim lines state ─────────────────────────────────────────────────────
  // Hydrate from the workflow so reopening the drawer preserves prior rows —
  // otherwise Add Activity looks like it "edits the first row" because the
  // sync effect immediately overwrites context with the empty seed.
  const [claimLines, setClaimLines] = useState<ClaimLine[]>(() =>
    isDraft && workflow.preApproval.claimLines.length > 0
      ? workflow.preApproval.claimLines
      : [{ description: '', amount: '' }]
  );

  // Keep the claimCount select mirrored to the current row count
  useEffect(() => {
    setValue('claimCount', String(claimLines.length));
  }, [claimLines.length, setValue]);

  const computedTotal = claimLines.reduce((sum, line) => {
    const n = parseFloat(line.amount.replace(/[^0-9.]/g, '')) || 0;
    return sum + n;
  }, 0);

  const updateLine = (i: number, field: keyof ClaimLine, value: string) =>
    setClaimLines(prev => prev.map((l, j) => (j === i ? { ...l, [field]: value } : l)));

  const addLine = () =>
    setClaimLines(prev => [...prev, { description: '', amount: '' }]);

  const removeLine = (i: number) =>
    setClaimLines(prev => (prev.length <= 1 ? prev : prev.filter((_, j) => j !== i)));

  // ── Watch extra fields for context sync ──────────────────────────────────
  const watchedTitle       = watch('title');
  const watchedMediaType   = watch('mediaType');
  const watchedDetails     = watch('details');
  const watchedContactInfo = watch('contactInfo');

  // ── Sync with WorkflowContext ──────────────────────────────────────────────
  // hasMounted prevents the first fire from overwriting context pre-populated data
  const hasMounted = useRef(false);
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    const mediaTypeLabel =
      ALL_MEDIA_TYPE_OPTIONS.find(o => o.value === watchedMediaType)?.label ?? watchedMediaType ?? '';
    updatePreApprovalData(
      watchedTitle ?? '',
      computedTotal,
      formatRange(activityRange),
      claimLines,
      mediaTypeLabel,
      watchedDetails ?? '',
      watchedContactInfo ?? '',
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computedTotal, activityRange, claimLines, watchedTitle, watchedMediaType, watchedDetails, watchedContactInfo]);

  // ── Expanded info ─────────────────────────────────────────────────────────
  const [isExpanded, setIsExpanded] = useState(false);
  const fundValue      = watch('fund');
  const initiativeValue = watch('initiativeType');
  useEffect(() => {
    if (fundValue && initiativeValue) setIsExpanded(true);
  }, [fundValue, initiativeValue]);

  // Filter Initiative options by the selected Fund so Media funds surface
  // Media initiatives (and vice versa). When the Fund changes, clear any
  // stale Initiative selection that's no longer valid.
  const eligibleInitiatives = useMemo(() => {
    if (!fundValue) return INITIATIVE_OPTIONS;
    const allowed = FUND_TO_INITIATIVES[fundValue];
    if (!allowed) return INITIATIVE_OPTIONS;
    return INITIATIVE_OPTIONS.filter(o => allowed.includes(o.value));
  }, [fundValue]);

  useEffect(() => {
    if (!fundValue || !initiativeValue) return;
    if (!eligibleInitiatives.some(o => o.value === initiativeValue)) {
      setValue('initiativeType', '');
    }
  }, [fundValue, initiativeValue, eligibleInitiatives, setValue]);

  // Media Type options change based on the selected initiative:
  // DMP - Media Costs → 19-item media cost list; otherwise hard-costs list.
  const mediaTypeOptions = useMemo(() =>
    initiativeValue === 'dmp-media-costs' ? MEDIA_COST_TYPE_OPTIONS : MEDIA_TYPE_OPTIONS,
  [initiativeValue]);

  // Clear media type selection when the initiative changes (the options change)
  const prevInitiativeRef = useRef(initiativeValue);
  useEffect(() => {
    if (prevInitiativeRef.current !== initiativeValue) {
      prevInitiativeRef.current = initiativeValue;
      setValue('mediaType', '');
    }
  }, [initiativeValue, setValue]);

  // Available funds from overview data (dealer-scoped when locked, aggregate otherwise)
  const availableFunds = kpis.availableFunds;
  const isOverBudget = computedTotal > 0 && availableFunds > 0 && computedTotal > availableFunds;

  // ── File upload ───────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeKB = file.size / 1024;
    const sizeStr = sizeKB >= 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${Math.round(sizeKB)} KB`;
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'file';
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

            {/* ID — read-only, auto-assigned, shown between Title and Funds */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] text-[#686576] font-medium">
                {t('ID')}:
              </label>
              <input
                type="text"
                readOnly
                disabled
                value={wfPA.id}
                className="w-full h-10 px-3 bg-[#F0F2F4] border border-[#CAC9CF] rounded-[4px] text-[13px] text-[#686576] cursor-not-allowed select-none"
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
              {isLockedDealership ? (
                <input
                  type="text"
                  readOnly
                  disabled
                  value={`${WORKFLOW_DEALER.code} - ${WORKFLOW_DEALER.name}`}
                  className="w-full h-10 px-3 bg-[#F0F2F4] border border-[#CAC9CF] rounded-[4px] text-[13px] text-[#686576] cursor-not-allowed select-none"
                />
              ) : (
                <Controller
                  name="dealershipName"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <CustomSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={[
                        { value: '12345',  label: '12345 - Volkswagen Any Town' },
                        { value: '408253', label: '408253 - Rick Case VW' },
                        { value: '408254', label: '408254 - Gunther VW' },
                        { value: '408255', label: '408255 - Emich VW' },
                      ]}
                      placeholder={t('Select Dealership')}
                      error={!!errors.dealershipName}
                    />
                  )}
                />
              )}
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
                    options={eligibleInitiatives.map(o => ({ ...o, label: t(o.label) }))}
                    placeholder={t('Select Initiative')}
                    error={!!errors.initiativeType}
                  />
                )}
              />
            </div>

            {/* Expanded info block — variant per initiative */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="bg-[#F0F2F4] rounded-[8px] p-4 flex flex-col gap-4 overflow-hidden"
                >
                  {initiativeValue === 'dmp-media-costs' ? (
                    // Variant: DMP - Media Costs
                    <>
                      <div>
                        <h4 className="text-[12px] font-bold text-[#1F1D25] mb-2">{t('Description / Instruction (for Claims)')}</h4>
                        <p className="text-[11px] text-[#1F1D25] leading-relaxed">
                          {t('Please submit claims for all eligible media categories for Co-Op Reimbursement:')}
                          <br />• {t('Digital Media (Display, Paid Search, Social, Video)')}
                          <br />• {t('Traditional Media (Print, Radio, OOH)')}
                          <br />• {t('Direct Mail')}
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
                    </>
                  ) : (
                    // Variant: DMP - Hard Costs (default)
                    <>
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
                    </>
                  )}
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

            {/* ── Claim Lines (unbounded — user adds/removes rows freely) ── */}
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
                      onChange={e => {
                        const raw = e.target.value.replace(/[^0-9.]/g, '');
                        updateLine(i, 'amount', raw);
                      }}
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      className="w-full h-8 pl-6 pr-2 bg-white border border-[#E0E0E0] rounded-[4px] text-[12px] text-[#1F1D25] focus:outline-none focus:ring-1 focus:ring-[#473BAB] focus:border-transparent"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLine(i)}
                    disabled={claimLines.length <= 1}
                    className="shrink-0 self-center p-1.5 rounded-full text-[#9C99A9] hover:text-[#D2323F] hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    aria-label={t('Remove activity')}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Add row button */}
              <button
                type="button"
                onClick={addLine}
                className="flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed border-[#CAC9CF] rounded-[6px] text-[12px] font-medium text-[#473BAB] hover:bg-[#473BAB]/5 hover:border-[#473BAB]/50 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('Add Activity')}
              </button>

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

              {/* Cost and claim details card */}
              {availableFunds > 0 && (
                <div className="flex flex-col gap-2 px-3 py-3 bg-[#F9FAFA] border border-[#E0E0E0] rounded-[6px] mt-1">
                  <span className="text-[11px] font-semibold text-[#686576] uppercase tracking-[0.4px]">
                    {t('Cost & Claim Details')}
                  </span>
                  <div className="flex justify-between items-center text-[11px] text-[#1F1D25]">
                    <span>{t('Available Funds')}</span>
                    <span className="font-medium">
                      ${availableFunds.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-start text-[11px] text-[#1F1D25]">
                    <span>{t('Expenditure threshold')}</span>
                    {isOverBudget ? (
                      <div className="flex flex-col items-end gap-0.5">
                        <div className="flex items-center gap-1 text-[#D2323F]">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span className="font-medium">{t('Limit exceeded')}</span>
                        </div>
                        <span className="text-[10px] text-[#D2323F] text-right max-w-[140px] leading-snug">
                          {t('Total exceeds available funds by')}{' '}
                          ${(computedTotal - availableFunds).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[#51B994]">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-medium">{t('Within limit')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
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
                    options={mediaTypeOptions.map(o => ({ ...o, label: t(o.label) }))}
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
          className="fixed inset-0 z-[10001]"
          onClick={() => setShowDatePicker(false)}
        >
          <div
            className="fixed"
            style={{ bottom: pickerAnchor.bottom, left: pickerAnchor.left }}
            onClick={e => e.stopPropagation()}
          >
            <DateRangePicker
              initialRange={activityRange}
              onApply={range => { setActivityRange(range); setShowDatePicker(false); }}
              onCancel={() => setShowDatePicker(false)}
              className="bg-white rounded-lg shadow-xl border border-[rgba(0,0,0,0.12)] p-6 w-[600px] animate-in fade-in zoom-in-95 duration-200"
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
