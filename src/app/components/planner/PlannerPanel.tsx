import { useState, useRef, useCallback } from 'react';
import { X, Plus, Upload, File, Film, FileText, Image } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { Campaign } from './PlannerContent';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { cn } from '../../../lib/utils';
import { CustomSelect } from '../ui/CustomSelect';
import svgPathsPanel from '../../../imports/svg-cg0cwpd3w1';

// ─── Constants ────────────────────────────────────────────────────────────────
const ACCEPTED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/vnd.adobe.photoshop',
  'video/mp4',
  'video/quicktime',
  'video/mov',
  'application/pdf',
];
const ACCEPTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.psd', '.mp4', '.pdf', '.mov'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

type AssetEntry = {
  url: string;
  isImage: boolean;
  mimeType: string;
  name: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isImageMime(mime: string) {
  return mime.startsWith('image/');
}

function getFileIcon(entry: AssetEntry) {
  if (entry.isImage) return <Image className="w-6 h-6 text-blue-400" />;
  if (entry.mimeType === 'video/mp4' || entry.mimeType === 'video/quicktime' || entry.mimeType === 'video/mov')
    return <Film className="w-6 h-6 text-purple-400" />;
  if (entry.mimeType === 'application/pdf')
    return <FileText className="w-6 h-6 text-red-400" />;
  return <File className="w-6 h-6 text-gray-400" />;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface PlannerPanelProps {
  campaign?: Campaign | null;
  onClose: () => void;
  onSave?: (data: Partial<Campaign>) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function PlannerPanel({ campaign, onClose, onSave }: PlannerPanelProps) {
  const { t } = useTranslation();
  const isNew = !campaign;

  // ── Form state ──────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState<Partial<Campaign>>(
    campaign
      ? { ...campaign }
      : {
          name: '',
          campaignGroup: '',
          quarter: 'Q1',
          mediaType: [],
          startDate: 'Mar 20, 2026',
          endDate: 'Apr 5, 2026',
          budget: 0,
          assets: [],
          assetCount: 0,
        },
  );

  // ── Media Type dropdown — controlled open state (fixes hover boundary bug) ──
  const [isMediaTypeOpen, setIsMediaTypeOpen] = useState(false);
  const mediaTypeRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  const handleMediaTypeBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    // relatedTarget is null when clicking outside the container
    if (!mediaTypeRef.current?.contains(e.relatedTarget as Node)) {
      setIsMediaTypeOpen(false);
    }
  };

  // ── Asset entries (extend static assets with upload metadata) ──────────────
  const [assetEntries, setAssetEntries] = useState<AssetEntry[]>(() =>
    (campaign?.assets ?? []).map(url => ({ url, isImage: true, mimeType: 'image/png', name: '' })),
  );

  // ── Upload state ────────────────────────────────────────────────────────────
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File processing ─────────────────────────────────────────────────────────
  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const errors: string[] = [];
    const valid: File[] = [];

    fileArray.forEach(file => {
      const ext = '.' + (file.name.split('.').pop() ?? '').toLowerCase();
      const isMimeOk = ACCEPTED_MIME_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(ext);
      const isSizeOk = file.size <= MAX_FILE_SIZE;

      if (!isMimeOk) errors.push(`${file.name}: ${t('unsupported format')}`);
      else if (!isSizeOk) errors.push(`${file.name}: ${t('exceeds 10MB limit')}`);
      else valid.push(file);
    });

    if (errors.length) {
      setUploadError(errors.join(' · '));
      return;
    }
    setUploadError(null);

    if (!valid.length) return;

    const newEntries: AssetEntry[] = valid.map(file => ({
      url: URL.createObjectURL(file),
      isImage: isImageMime(file.type),
      mimeType: file.type,
      name: file.name,
    }));

    setAssetEntries(prev => {
      const merged = [...prev, ...newEntries];
      const urls = merged.map(e => e.url);
      const firstImageUrl = merged.find(e => e.isImage)?.url;

      setFormData(fd => ({
        ...fd,
        assets: urls,
        assetCount: urls.length,
        // Only set thumbnail if we don't already have one
        thumbnail: fd.thumbnail || firstImageUrl,
      }));

      return merged;
    });
  }, [t]);

  // ── Drag-and-drop handlers ──────────────────────────────────────────────────
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files?.length) processFiles(e.dataTransfer.files);
  };

  // ── Remove asset ────────────────────────────────────────────────────────────
  const removeAsset = (idx: number) => {
    setAssetEntries(prev => {
      const next = prev.filter((_, i) => i !== idx);
      const urls = next.map(e => e.url);
      const firstImageUrl = next.find(e => e.isImage)?.url;
      setFormData(fd => ({
        ...fd,
        assets: urls,
        assetCount: urls.length,
        thumbnail: firstImageUrl ?? fd.thumbnail,
      }));
      return next;
    });
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = () => {
    const urls = assetEntries.map(e => e.url);
    const firstImageUrl = assetEntries.find(e => e.isImage)?.url;
    const data: Partial<Campaign> = {
      ...formData,
      assets: urls,
      assetCount: urls.length,
      thumbnail: firstImageUrl ?? formData.thumbnail,
    };
    onSave?.(data);
    onClose();
  };

  // ── Select options ──────────────────────────────────────────────────────────
  const campaignOptions = [
    { value: 'SUV Launch Campaigns',            label: 'SUV Launch Campaigns' },
    { value: 'Always-On Inventory Ads',         label: 'Always-On Inventory Ads' },
    { value: 'Dealer Network Awareness',         label: 'Dealer Network Awareness' },
    { value: 'Brand & Awareness Campaigns',      label: 'Brand & Awareness Campaigns' },
  ];
  const quarterOptions = [
    { value: 'Q1',    label: 'Q1' },
    { value: 'Q2',    label: 'Q2' },
    { value: 'Q1–Q2', label: 'Q1–Q2' },
  ];
  const mediaTypeOptions = ['SEM', 'CRM', 'Display', 'Email Campaigns', 'Outbound Sales Calls/Call Tracking'];

  const hasAssets = assetEntries.length > 0;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-white font-['Roboto'] shadow-2xl relative">

      {/* Header */}
      <div className="flex items-center justify-between pt-3 px-4 pb-2 border-b border-[rgba(0,0,0,0.12)] shrink-0 z-10">
        <div className="flex flex-col font-medium text-[#1f1d25] text-[16px] tracking-[0.15px] truncate pr-2">
          <p className="leading-[1.5] truncate">{isNew ? t('New Campaign') : t(campaign.name)}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-black/5 rounded-full text-[#686576] transition-colors cursor-pointer shrink-0"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 9 9">
            <path d={svgPathsPanel.p26bf1e80} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.56" />
          </svg>
        </button>
      </div>

      {/* Body — Scrollable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">

        {/* ── Assets Section ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[12px] font-bold text-[#686576] uppercase tracking-wider">{t('Assets')}</h3>
            {hasAssets && (
              <span className="text-[11px] text-[#686576]">{assetEntries.length} {t('items')}</span>
            )}
          </div>

          {/* ── Dropzone — shown when no assets ── */}
          {!hasAssets && (
            <div
              role="button"
              tabIndex={0}
              aria-label={t('Drop your Assets')}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                'bg-[#f4f5f6] border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-1 text-center cursor-pointer transition-all select-none',
                isDraggingOver
                  ? 'border-[#473bab] bg-[#f0eeff] scale-[1.01]'
                  : 'border-[rgba(0,0,0,0.12)] hover:bg-gray-100 hover:border-[#473bab]/40',
              )}
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center mb-1 transition-colors',
                  isDraggingOver ? 'bg-[#473bab]/10' : 'bg-white/80',
                )}
              >
                <svg className="w-7 h-7" fill="none" viewBox="0 0 29 27">
                  <path d={svgPathsPanel.p9617d80} stroke="#6356E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-[12px] font-bold text-[#1f1d25]">
                {isDraggingOver ? t('Release to upload') : t('Drop your Assets')}
              </p>
              <p className="text-[11px] text-[#1f1d25]/60 max-w-[220px] leading-[1.66]">
                {t('Supported formats: PNG, JPG, PSD, MP4, PDF, MOV. Maximum file size: 10MB.')}
              </p>
              <div className="mt-2 flex items-center gap-1.5 px-3 py-1 bg-[#473bab] text-white rounded-full text-[11px] font-medium">
                <Upload className="w-3 h-3" />
                <span>{t('Browse files')}</span>
              </div>
            </div>
          )}

          {/* ── Filled state — thumbnail carousel + add more ── */}
          {hasAssets && (
            <div className="space-y-2">
              <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar snap-x">
                {assetEntries.map((entry, idx) => (
                  <div
                    key={idx}
                    className="w-[118px] h-[118px] rounded-xl overflow-hidden border border-[rgba(0,0,0,0.12)] shrink-0 snap-start relative group bg-[#f4f5f6]"
                  >
                    {entry.isImage ? (
                      <img src={entry.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1 px-2">
                        {getFileIcon(entry)}
                        <span className="text-[9px] text-[#686576] text-center leading-tight truncate w-full px-1">
                          {entry.name || t('file')}
                        </span>
                      </div>
                    )}
                    {/* Hover overlay with remove button */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => removeAsset(idx)}
                        className="p-1.5 bg-white rounded-full text-[#686576] hover:text-red-500 transition-colors shadow"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {/* Index badge */}
                    <div className="absolute top-1 left-1 bg-black/40 text-white text-[9px] font-bold rounded px-1 leading-tight">
                      {idx + 1}
                    </div>
                  </div>
                ))}

                {/* Add more files tile */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    'w-[118px] h-[118px] rounded-xl border-2 border-dashed shrink-0 snap-start flex flex-col items-center justify-center gap-1 cursor-pointer transition-all',
                    isDraggingOver
                      ? 'border-[#473bab] bg-[#f0eeff]'
                      : 'border-[rgba(0,0,0,0.12)] bg-[#f4f5f6] hover:border-[#473bab]/50 hover:bg-gray-100',
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-[#473bab]/10 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-[#473bab]" />
                  </div>
                  <span className="text-[10px] text-[#473bab] font-medium">{t('Add files')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_EXTENSIONS.join(',')}
            className="hidden"
            onChange={e => {
              if (e.target.files?.length) {
                processFiles(e.target.files);
                // Reset value so same file can be re-added
                e.target.value = '';
              }
            }}
          />

          {/* Upload error */}
          {uploadError && (
            <p className="text-[11px] text-red-500 px-1 leading-snug">{uploadError}</p>
          )}
        </section>

        {/* ── Metadata Section ── */}
        <section className="space-y-4">

          {/* 1. Title — FIRST: primary identifier */}
          <div className="space-y-1 px-1">
            <div className="flex items-center gap-1">
              <span className="text-[#d2323f] text-[12px]">*</span>
              <label className="text-[12px] text-[#686576] font-normal tracking-[0.15px]">{t('Title:')}</label>
            </div>
            <textarea
              value={formData.name || ''}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full min-h-[60px] px-3 py-2 border border-[#cac9cf] rounded-[4px] bg-[#f9fafa] text-[13px] text-[#1f1d25] leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-[#473bab]/20"
              placeholder={t('Enter campaign title...')}
            />
          </div>

          {/* 2. Campaign group */}
          <div className="space-y-1 px-1">
            <div className="flex items-center gap-1">
              <span className="text-[#d2323f] text-[12px]">*</span>
              <label className="text-[12px] text-[#686576] font-normal tracking-[0.15px]">{t('Campaign')}</label>
            </div>
            <CustomSelect
              value={formData.campaignGroup || ''}
              onChange={val => setFormData(prev => ({ ...prev, campaignGroup: val }))}
              options={campaignOptions}
              className="w-full"
            />
          </div>

          {/* 3. Quarter */}
          <div className="space-y-1 px-1">
            <div className="flex items-center gap-1">
              <span className="text-[#d2323f] text-[12px]">*</span>
              <label className="text-[12px] text-[#686576] font-normal tracking-[0.15px]">{t('Quarter')}</label>
            </div>
            <CustomSelect
              value={formData.quarter || ''}
              onChange={val => setFormData(prev => ({ ...prev, quarter: val }))}
              options={quarterOptions}
              className="w-full"
            />
          </div>

          {/* 4. Period */}
          <div className="space-y-1 px-1">
            <div className="flex items-center gap-1">
              <span className="text-[#d2323f] text-[12px]">*</span>
              <label className="text-[12px] text-[#686576] font-normal tracking-[0.15px]">{t('Period')}</label>
            </div>
            <div className="relative">
              <div className="w-full h-10 px-3 border border-[#cac9cf] rounded-[4px] bg-[#f9fafa] flex items-center justify-between text-[13px] text-[#1f1d25]">
                <span>{formData.startDate} – {formData.endDate}</span>
                <svg className="w-5 h-5 text-[#686576]" fill="none" viewBox="0 0 18 19">
                  <path d={svgPathsPanel.p3e216370} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.56" />
                </svg>
              </div>
            </div>
          </div>

          {/* 5. Budget */}
          <div className="space-y-1 px-1">
            <div className="flex items-center gap-1">
              <span className="text-[#d2323f] text-[12px]">*</span>
              <label className="text-[12px] text-[#686576] font-normal tracking-[0.15px]">{t('Budget')}</label>
            </div>
            <div className="w-full h-10 px-3 border border-[#cac9cf] rounded-[4px] bg-[#f9fafa] flex items-center text-[13px] text-[#1f1d25]">
              <input
                type="text"
                value={formData.budget ? `$${formData.budget.toLocaleString()}` : ''}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setFormData(prev => ({ ...prev, budget: parseInt(val) || 0 }));
                }}
                className="bg-transparent border-none outline-none w-full"
                placeholder="$0"
              />
            </div>
          </div>

          {/* 6. Media Type — controlled open state (no hover boundary issue) */}
          <div className="space-y-1 px-1">
            <div className="flex items-center gap-1">
              <span className="text-[#d2323f] text-[12px]">*</span>
              <label className="text-[12px] text-[#686576] font-normal tracking-[0.15px]">{t('Media Type')}</label>
            </div>
            <div
              ref={mediaTypeRef}
              className="relative"
              onBlur={handleMediaTypeBlur}
            >
              {/* Chip input row */}
              <div className="w-full min-h-[44px] p-2 border border-[#cac9cf] rounded-[4px] bg-[#f9fafa] flex flex-wrap gap-1.5 items-center">
                {formData.mediaType?.map(type => (
                  <div
                    key={type}
                    className="flex items-center gap-1 px-2 py-0.5 bg-[rgba(17,16,20,0.04)] text-[#1f1d25] rounded-[8px] text-[11px] border border-[#cac9cf]"
                  >
                    {t(type)}
                    <button
                      tabIndex={-1}
                      onClick={() => setFormData(prev => ({ ...prev, mediaType: prev.mediaType?.filter(m => m !== type) }))}
                    >
                      <X className="w-3 h-3 text-[#1f1d25]/40" />
                    </button>
                  </div>
                ))}
                {/* Add button — toggles dropdown */}
                <button
                  tabIndex={0}
                  className="ml-1 p-1 rounded-full border border-dashed border-[#cac9cf] text-[#686576] hover:bg-black/5 transition-colors cursor-pointer"
                  onClick={() => setIsMediaTypeOpen(o => !o)}
                  onFocus={() => setIsMediaTypeOpen(true)}
                  aria-haspopup="listbox"
                  aria-expanded={isMediaTypeOpen}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Dropdown — controlled, stays open until selection or outside click */}
              {isMediaTypeOpen && (
                <div
                  className="absolute left-0 top-full mt-1 bg-white border border-[#cac9cf] rounded shadow-lg z-50 min-w-[200px] py-1"
                  onMouseDown={e => e.preventDefault()} // prevent blur on list click
                >
                  {mediaTypeOptions.filter(o => !formData.mediaType?.includes(o)).length === 0 ? (
                    <div className="px-3 py-2 text-[12px] text-[#686576] italic">{t('All types selected')}</div>
                  ) : (
                    mediaTypeOptions
                      .filter(o => !formData.mediaType?.includes(o))
                      .map(opt => (
                        <div
                          key={opt}
                          role="option"
                          aria-selected={false}
                          className="px-3 py-2 text-[13px] text-[#1f1d25] hover:bg-[#f4f5f6] cursor-pointer transition-colors"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, mediaType: [...(prev.mediaType || []), opt] }));
                            setIsMediaTypeOpen(false);
                          }}
                        >
                          {t(opt)}
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>
          </div>

        </section>
      </div>

      {/* Footer Actions — single row: [Import From Projects] [Cancel] [Save] */}
      <div className="px-4 py-3 border-t border-[rgba(0,0,0,0.12)] bg-white flex items-center justify-between shrink-0">
        {/* LEFT — secondary text action */}
        <button className="text-[#473bab] text-[14px] font-medium hover:underline transition-all">
          {t('Import from Projects')}
        </button>

        {/* RIGHT — Cancel + Save */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-6 py-1.5 rounded-full border border-[rgba(99,86,225,0.5)] text-[#473bab] text-[14px] font-medium hover:bg-[#473bab]/5 transition-colors"
          >
            {t('Cancel')}
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-1.5 rounded-full bg-[#473bab] text-white text-[14px] font-medium hover:bg-[#392e8a] transition-shadow shadow-md active:scale-95"
          >
            {t('Save')}
          </button>
        </div>
      </div>
    </div>
  );
}