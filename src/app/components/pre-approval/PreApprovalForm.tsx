import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Info, Upload, Eye, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { CustomSelect, Option } from '@/app/components/ui/CustomSelect';
import { useTranslation } from '@/app/contexts/LanguageContext';
import { useWorkflow } from '@/app/contexts/WorkflowContext';

interface FormValues {
  title: string;
  fund: string;
  dealershipName: string;
  initiativeType: string;
  mediaType: string; // Changed to string for single select dropdown
  claimCount: string;
  activityPeriod: string;
  totalAmount: string;
  details: string;
  contactInfo: string;
}

interface PreApprovalFormProps {
  onClose?: () => void;
  onDone?: (data: FormValues) => void;
}

const FUND_OPTIONS: Option[] = [
  { value: "dmf-hard-costs", label: "DMF - Hard Costs" },
  { value: "dmf-media-costs", label: "DMF - Media Costs" }
];

const INITIATIVE_OPTIONS: Option[] = [
  { value: "dmp-hard-costs", label: "DMP - Hard Costs" }
];

const MEDIA_TYPE_OPTIONS: Option[] = [
  { value: "auto-shows", label: "Auto Shows/Offsite Displays" },
  { value: "crm", label: "CRM" },
  { value: "data-equity", label: "Data Equity Mining" },
  { value: "dealer-showroom", label: "Dealer Showroom Components" },
  { value: "driver-gear", label: "DriverGear/Halo Merchandise" },
  { value: "email-campaigns", label: "Email Campaigns" },
  { value: "inventory-management", label: "Inventory Management Tools" },
  { value: "non-certified-chat", label: "Non-Certified Chat" },
  { value: "non-certified-trade-in", label: "Non-Certified Trade-In Tools" },
  { value: "outbound-sales", label: "Outbound Sales Calls/Call Tracking" },
  { value: "promotional-events", label: "Promotional Events & Sponsorships" },
  { value: "translation-software", label: "Translation Software" }
];

export function PreApprovalForm({ onClose, onDone }: PreApprovalFormProps) {
  const { t } = useTranslation();
  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      title: "December Offers - Specials - Pre-Approval Request",
      fund: "",
      dealershipName: "",
      initiativeType: "",
      mediaType: "",
      claimCount: "1",
      activityPeriod: "Mar 1, 2026 – Mar 31, 2026",
      totalAmount: "5000",
      details: "",
      contactInfo: ""
    }
  });

  const { workflow, addPreApprovalDocument, removePreApprovalDocument } = useWorkflow();

  const [isExpanded, setIsExpanded] = useState(false);
  const fundValue = watch('fund');
  const initiativeValue = watch('initiativeType');
  const formContainerRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeKB = file.size / 1024;
    const sizeStr = sizeKB >= 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${Math.round(sizeKB)} KB`;
    const ext = file.name.split('.').pop()?.toUpperCase() ?? 'FILE';
    // Generate blob URL for image files so the panel carousel can preview them
    const url = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
    addPreApprovalDocument({ name: file.name, size: sizeStr, type: ext, url });
    e.target.value = '';
  };

  // Read documents from WorkflowContext (single source of truth)
  const uploadedDocs = workflow.preApproval.documents;

  // Logic to show extra info when fund and initiative are selected
  useEffect(() => {
    if (fundValue && initiativeValue) {
      setIsExpanded(true);
    }
  }, [fundValue, initiativeValue]);

  const onSubmit = (data: FormValues) => {
    onDone?.(data);
  };

  const onError = (errors: any) => {
    if (!formContainerRef.current) return;
    
    // Find the first field with an error
    const firstErrorField = Object.keys(errors)[0];
    if (firstErrorField) {
        const containerId = `field-${firstErrorField}`;
        const container = document.getElementById(containerId);
        if (container) {
            container.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
  };

  return (
    <form 
      onSubmit={handleSubmit(onSubmit, onError)}
      className="flex flex-col h-full bg-white relative"
    >
      {/* Header */}
      <div className="flex-none flex items-center justify-between px-4 py-3 border-b border-[rgba(0,0,0,0.04)]">
        <h2 className="text-[16px] font-medium text-[#1F1D25]">{t('Details')}</h2>
        <div className="flex items-center gap-2">
           <Info size={16} className="text-[#686576]/60 cursor-help" />
        </div>
      </div>

      {/* Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 custom-scrollbar" ref={formContainerRef}>
        <div className="flex flex-col gap-5">
          
          {/* Title */}
          <div className="flex flex-col gap-1.5" id="field-title">
            <label className="text-[12px] text-[#686576] font-medium flex items-center gap-1">
              <span className="text-[#D2323F]">*</span> {t('Title')}:
            </label>
            <Controller
              name="title"
              control={control}
              rules={{ required: "Title is required" }}
              render={({ field }) => (
                <input 
                  {...field}
                  className={cn(
                    "w-full h-10 px-3 bg-[#F9FAFA] border rounded-[4px] text-[13px] text-[#1F1D25] focus:outline-none focus:ring-1 focus:ring-[#473BAB] transition-all cursor-pointer",
                    errors.title ? "border-[#D2323F]" : "border-[#CAC9CF]"
                  )}
                  placeholder={t("Enter title")}
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
                  options={FUND_OPTIONS.map(opt => ({ ...opt, label: t(opt.label) }))}
                  placeholder={t("Select Fund")}
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
                        { value: "12345",  label: "12345 - Volkswagen Anytown" },
                        { value: "408253", label: "408253 - Rick Case VW" },
                        { value: "408254", label: "408254 - Gunther VW" },
                        { value: "408255", label: "408255 - Emich VW" }
                    ]}
                    placeholder={t("Select Dealership")}
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
                  options={INITIATIVE_OPTIONS.map(opt => ({ ...opt, label: t(opt.label) }))}
                  placeholder={t("Select Initiative")}
                  error={!!errors.initiativeType}
                />
              )}
            />
          </div>

          {/* Expanded Info */}
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

          {/* Claim Number */}
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
                    options={["1", "2", "3", "4", "5"].map(v => ({ value: v, label: v }))}
                    placeholder="1"
                    error={!!errors.claimCount}
                />
              )}
            />
          </div>

          {/* Activity Period */}
          <div className="flex flex-col gap-1.5" id="field-activityPeriod">
            <label className="text-[12px] text-[#686576] font-medium flex items-center gap-1">
              <span className="text-[#D2323F]">*</span> {t('Activity Period')}
            </label>
            <Controller
              name="activityPeriod"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <input
                  {...field}
                  className={cn(
                    "w-full h-10 px-3 bg-[#F9FAFA] border rounded-[4px] text-[13px] text-[#1F1D25] focus:outline-none focus:ring-1 focus:ring-[#473BAB] transition-all cursor-pointer",
                    errors.activityPeriod ? "border-[#D2323F]" : "border-[#CAC9CF]"
                  )}
                  placeholder={t("e.g. Mar 1, 2026 – Mar 31, 2026")}
                />
              )}
            />
          </div>

          {/* Total Amount */}
          <div className="flex flex-col gap-1.5" id="field-totalAmount">
            <label className="text-[12px] text-[#686576] font-medium flex items-center gap-1">
              <span className="text-[#D2323F]">*</span> {t('Total Amount')}
            </label>
            <Controller
              name="totalAmount"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#686576] pointer-events-none">$</span>
                  <input
                    {...field}
                    type="number"
                    min="0"
                    step="0.01"
                    className={cn(
                      "w-full h-10 pl-7 pr-3 bg-[#F9FAFA] border rounded-[4px] text-[13px] text-[#1F1D25] focus:outline-none focus:ring-1 focus:ring-[#473BAB] transition-all cursor-pointer",
                      errors.totalAmount ? "border-[#D2323F]" : "border-[#CAC9CF]"
                    )}
                    placeholder="0.00"
                  />
                </div>
              )}
            />
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
                    "w-full min-h-[120px] p-3 bg-[#F9FAFA] border rounded-[4px] text-[13px] text-[#1F1D25] focus:outline-none focus:ring-1 focus:ring-[#473BAB] transition-all resize-none cursor-pointer",
                    errors.details ? "border-[#D2323F]" : "border-[#CAC9CF]"
                  )}
                  placeholder={t("Enter details about your request...")}
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
                    "w-full h-10 px-3 bg-[#F9FAFA] border rounded-[4px] text-[13px] text-[#1F1D25] focus:outline-none focus:ring-1 focus:ring-[#473BAB] transition-all cursor-pointer",
                    errors.contactInfo ? "border-[#D2323F]" : "border-[#CAC9CF]"
                  )}
                  placeholder={t("Email or phone number")}
                />
              )}
            />
          </div>

          {/* Media Type (New Dropdown) */}
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
                  options={MEDIA_TYPE_OPTIONS.map(opt => ({ ...opt, label: t(opt.label) }))}
                  placeholder={t("Select Media Type")}
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

            {/* Hidden file input — must NOT use display:none (blocks .click() in Safari) */}
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
            <p className="text-[11px] text-[#686576] text-center">
              PDF, PNG or JPG (Max. 3MB)
            </p>

            {/* Uploaded file cards */}
            {uploadedDocs.length > 0 && (
              <div className="flex flex-col gap-2 mt-1">
                {uploadedDocs.map((doc, idx) => (
                  <div key={idx} className="border border-[#E0E0E0] rounded-lg flex overflow-hidden bg-white">
                    <div className="w-[56px] bg-[#F5F5F5] flex items-center justify-center border-r border-[#E0E0E0] shrink-0">
                      <div className="w-8 h-10 bg-white border border-[#E0E0E0] shadow-sm flex items-center justify-center">
                        <span className="text-[8px] font-bold text-[#FF5252]">{doc.type.slice(0, 4)}</span>
                      </div>
                    </div>
                    <div className="flex-1 px-3 py-2 flex items-center justify-between min-w-0">
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="text-[12px] font-medium text-[#1F1D25] truncate">{doc.name}</span>
                        <span className="text-[10px] text-[#686576] uppercase tracking-wide">{doc.type} | {doc.size}</span>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button type="button" className="p-1.5 text-[#686576] hover:text-[#1f1d25] hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
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
  );
}
