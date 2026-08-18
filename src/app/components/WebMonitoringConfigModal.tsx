// [FV] novo arquivo — OEM Web Monitoring Configuration modal (frequency + dealerships + compliance doc)
import { useState, useRef, ChangeEvent, DragEvent, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, FileText, UploadCloud, ChevronDown, Plus, Trash2, ExternalLink, Mail, Loader2, ScanLine, Eye } from 'lucide-react';
import { ActivityMonitor } from './ActivityMonitor';
import { useTranslation } from '../contexts/LanguageContext';
import { SchedulePanel } from './ShareReportModal';
import { emitSnackbar } from './Snackbar';
import { cn } from '../../lib/utils';
import { useComplianceScan } from '../hooks/useComplianceScan';
import { useCompliance } from '../contexts/ComplianceContext';
import { DocumentPreviewModal } from './pre-approval/DocumentPreviewModal';
import type { WorkflowDocument } from '../contexts/WorkflowContext';

interface DealershipEntry {
  id: string;
  name: string;
  website: string;
  instagram: string;
  metaAds: string;
}

// [FV] OEM platform users available to receive email reports
interface OemUser { id: string; name: string; email: string }
const DEFAULT_OEM_USERS: OemUser[] = [
  { id: 'u-1', name: 'Olivia Rivers',       email: 'olivia.rivers@vw.com' },
  { id: 'u-2', name: 'Marcus Chen',         email: 'marcus.chen@vw.com' },
  { id: 'u-3', name: 'Sarah Goldstein',     email: 'sarah.goldstein@vw.com' },
  { id: 'u-4', name: 'David Okafor',        email: 'david.okafor@vw.com' },
  { id: 'u-5', name: 'Priya Ramanathan',    email: 'priya.ramanathan@vw.com' },
  { id: 'u-6', name: 'Thomas Bauer',        email: 'thomas.bauer@vw.com' },
  { id: 'u-7', name: 'Camila Fernández',    email: 'camila.fernandez@vw.com' },
  { id: 'u-8', name: "James O'Connor",      email: 'james.oconnor@vw.com' },
];

const DEFAULT_DEALERSHIPS: DealershipEntry[] = [
  { id: 'd-1',  name: 'Jack Daniels Volkswagen',         website: 'jackdanielsvw.com',          instagram: '', metaAds: 'jackdanielsvw' },
  { id: 'd-2',  name: 'Emich Volkswagen',                 website: 'emichvw.com',                instagram: '', metaAds: 'emichvw' },
  { id: 'd-3',  name: 'Volkswagen of Downtown LA',        website: 'vwdtla.com',                 instagram: '', metaAds: 'vwdtla' },
  { id: 'd-4',  name: 'Jim Ellis Volkswagen',             website: 'jimellisvw.com',             instagram: '', metaAds: 'jimellisvw' },
  { id: 'd-5',  name: 'Hendrick Volkswagen Frisco',       website: 'hendrickvwfrisco.com',        instagram: '', metaAds: 'hendrickvwfrisco' },
  { id: 'd-6',  name: 'Volkswagen of Union',              website: 'vwunion.com',                instagram: '', metaAds: 'vwunion' },
  { id: 'd-7',  name: 'Palisades Volkswagen',             website: 'palisadesvw.com',            instagram: '', metaAds: 'palisadesvw' },
  { id: 'd-8',  name: 'Trend Motors Volkswagen',          website: 'trendmotorsvw.com',          instagram: '', metaAds: 'trendmotorsvw' },
  { id: 'd-9',  name: 'Open Road Volkswagen Manhattan',   website: 'openroadvw.com',             instagram: '', metaAds: 'openroadvw' },
  { id: 'd-10', name: 'Douglas Volkswagen',               website: 'douglasvw.com',              instagram: '', metaAds: 'douglasvw' },
  // ── Shortlisted dealerships (compliance scan — Aug 2026) ─────────────────
  { id: 'd-11', name: 'Schmelz Countryside Volkswagen',  website: 'schmelzvw.com',              instagram: '', metaAds: 'Schmelz Countryside Volkswagen' },
  { id: 'd-12', name: 'Capitol Volkswagen',               website: 'capitolvw.com',              instagram: '', metaAds: 'Capitol Volkswagen' },
  { id: 'd-13', name: 'Byers Volkswagen Columbus',        website: 'columbusvw.com',             instagram: '', metaAds: 'Byers Volkswagen' },
  { id: 'd-14', name: 'Volkswagen of Portland',           website: 'vwofportland.com',           instagram: '', metaAds: 'Volkswagen of Portland' },
  { id: 'd-15', name: 'Chapman Volkswagen Scottsdale',    website: 'chapmanvw.com',              instagram: '', metaAds: 'Chapman Volkswagen Scottsdale' },
  { id: 'd-16', name: 'Crestmont Volkswagen',             website: 'crestmontvolkswagen.com',    instagram: '', metaAds: 'Crestmont Volkswagen' },
  { id: 'd-17', name: 'Gunther Volkswagen Daytona',       website: 'gunthervwdaytona.com',       instagram: '', metaAds: 'Gunther Volkswagen Daytona' },
  { id: 'd-18', name: 'Alexandria Volkswagen',            website: 'alexandriavw.com',           instagram: '', metaAds: 'Alexandria Volkswagen' },
  { id: 'd-19', name: 'LHM Volkswagen Lakewood',          website: 'lhmvw.com',                  instagram: '', metaAds: 'Larry H. Miller Volkswagen Lakewood' },
  { id: 'd-20', name: 'Centennial Volkswagen',            website: 'centennialvolkswagen.com',   instagram: '', metaAds: 'Centennial Volkswagen Las Vegas' },
];

interface WebMonitoringConfigModalProps {
  open: boolean;
  onClose: () => void;
}

export function WebMonitoringConfigModal({ open, onClose }: WebMonitoringConfigModalProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { scanAllDealerships, isScanning, progress, stopScan } = useComplianceScan();
  const { addInfraction, userAddedInfractions } = useCompliance();
  const [isSending, setIsSending] = useState(false);

  const [scanMonitorStage, setScanMonitorStage] = useState<'preparing' | 'complete' | null>(null);
  const scanStoppedRef = useRef(false);

  const foundCountRef = useRef(0);
  const [scanCompleteLabel, setScanCompleteLabel] = useState('Scan complete');

  const [dealerships, setDealerships]           = useState<DealershipEntry[]>(DEFAULT_DEALERSHIPS);
  const [selectedIds, setSelectedIds]           = useState<Set<string>>(new Set(DEFAULT_DEALERSHIPS.map(d => d.id)));
  const [expandedIds, setExpandedIds]           = useState<Set<string>>(new Set());
  // [FV] multi-doc support — pre-seeded with the VW Brand Guidelines reference
  interface ComplianceDoc { id: string; name: string; size: number; url?: string }
  const [docs, setDocs] = useState<ComplianceDoc[]>([
    { id: 'doc-vw-brand', name: 'VW DMP Guidelines — March 2026.pdf', size: 4_710_000, url: '/vw-dmp-guidelines.pdf' },
  ]);
  const [previewDoc, setPreviewDoc] = useState<WorkflowDocument | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // [FV] notify-by-email multi-select
  const [notifyUserIds, setNotifyUserIds] = useState<Set<string>>(new Set());
  const [isUserPickerOpen, setIsUserPickerOpen] = useState(false);
  const userPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (isUserPickerOpen && userPickerRef.current && !userPickerRef.current.contains(e.target as Node)) {
        setIsUserPickerOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [isUserPickerOpen]);

  function toggleNotifyUser(id: string) {
    setNotifyUserIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleDealership(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function updateDealership(id: string, patch: Partial<DealershipEntry>) {
    setDealerships(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));
  }

  function addDealership() {
    // [FV] new dealership goes to the top of the list, auto-expanded
    const newId = `d-new-${Date.now()}`;
    setDealerships(prev => [{ id: newId, name: '', website: '', instagram: '', metaAds: '' }, ...prev]);
    setSelectedIds(prev => { const next = new Set(prev); next.add(newId); return next; });
    setExpandedIds(prev => { const next = new Set(prev); next.add(newId); return next; });
  }

  function removeDealership(id: string) {
    setDealerships(prev => prev.filter(d => d.id !== id));
    setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    setExpandedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
  }

  function toggleAll() {
    setSelectedIds(prev =>
      prev.size === dealerships.length ? new Set() : new Set(dealerships.map(d => d.id)),
    );
  }

  function handleFile(file: File) {
    const url = URL.createObjectURL(file);
    setDocs(prev => [...prev, { id: `doc-${Date.now()}`, name: file.name, size: file.size, url }]);
  }

  function openDocPreview(doc: ComplianceDoc) {
    if (!doc.url) return;
    const sizeStr = doc.size >= 1_048_576
      ? `${(doc.size / 1_048_576).toFixed(1)} MB`
      : `${(doc.size / 1024).toFixed(1)} KB`;
    setPreviewDoc({ name: doc.name, size: sizeStr, type: 'pdf', url: doc.url });
  }

  function removeDoc(id: string) {
    setDocs(prev => prev.filter(d => d.id !== id));
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  function onSelectFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  function handleSave() {
    onClose();
    emitSnackbar(t('Configuration saved'));
  }

  async function handleSendReport() {
    const wmItems = userAddedInfractions.filter(i => i.source === 'Web Monitoring');
    if (wmItems.length === 0) {
      emitSnackbar(t('No Web Monitoring infractions to send'));
      return;
    }
    setIsSending(true);
    try {
      const res = await fetch('http://localhost:3001/api/compliance/send-wcm-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          infractions: wmItems.map(i => ({
            id: i.id,
            dealership: i.dealership,
            violationType: i.violationType,
            channel: i.channel,
            severity: i.severity,
            url: i.url,
            detectedOn: i.detectedOn,
          })),
        }),
      });
      const data = await res.json() as { success?: boolean; sent?: number; failed?: number };
      if (data.success) {
        emitSnackbar(`Report sent to ${data.sent} recipient${data.sent !== 1 ? 's' : ''}`);
      } else {
        emitSnackbar(t('Failed to send report'));
      }
    } catch {
      emitSnackbar(t('Failed to send report'));
    } finally {
      setIsSending(false);
    }
  }

  // Demo screenshot overrides: these dealers use a local asset instead of live Playwright.
  const DEMO_SCREENSHOTS: Record<string, string> = {
    'd-2': '/api/compliance/demo-asset/emich-used-cars',
  };

  async function handleScanAll() {
    const selected = dealerships.filter((d) => selectedIds.has(d.id));
    scanStoppedRef.current = false;
    foundCountRef.current = 0;
    setScanMonitorStage('preparing');
    await scanAllDealerships(selected, (item) => {
      foundCountRef.current += 1;
      addInfraction(item);
    }, DEMO_SCREENSHOTS);
    if (!scanStoppedRef.current) {
      const n = foundCountRef.current;
      setScanCompleteLabel(n === 0
        ? t('Scan complete — no new issues found')
        : n === 1
          ? t('Scan complete — 1 issue found')
          : `${t('Scan complete')} — ${n} ${t('issues found')}`,
      );
      setScanMonitorStage('complete');
      setTimeout(() => setScanMonitorStage(null), 5000);
    }
  }

  async function handleScanOne(d: DealershipEntry) {
    scanStoppedRef.current = false;
    foundCountRef.current = 0;
    setScanMonitorStage('preparing');

    const demoScreenshots = DEMO_SCREENSHOTS[d.id] ? { [d.id]: DEMO_SCREENSHOTS[d.id] } : undefined;

    await scanAllDealerships([d], (item) => {
      foundCountRef.current += 1;
      addInfraction(item);
    }, demoScreenshots);

    if (!scanStoppedRef.current) {
      const n = foundCountRef.current;
      setScanCompleteLabel(n === 0
        ? t('Scan complete — no new issues found')
        : n === 1
          ? t('Scan complete — 1 issue found')
          : `${t('Scan complete')} — ${n} ${t('issues found')}`,
      );
      setScanMonitorStage('complete');
      setTimeout(() => setScanMonitorStage(null), 5000);
    }
  }

  function handleMonitorClose() {
    if (scanMonitorStage === 'preparing') {
      scanStoppedRef.current = true;
      stopScan();
    }
    setScanMonitorStage(null);
  }

  const scanIcon = (
    <div style={{ width: 28, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <ScanLine size={22} color="#473BAB" />
    </div>
  );

  return (
    <>
      {scanMonitorStage && (
        <ActivityMonitor
          stage={scanMonitorStage}
          reportName="DMP Compliance Scan"
          displayName={progress ?? t('DMP Compliance Scan')}
          blobUrl={null}
          onClose={handleMonitorClose}
          icon={scanIcon}
          stageLabels={{
            preparing: t('Scanning dealerships'),
            complete:  scanCompleteLabel,
          }}
        />
      )}
      {createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.48)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-[24px] shadow-[0px_9px_46px_8px_rgba(0,0,0,0.12),0px_24px_38px_3px_rgba(0,0,0,0.14),0px_11px_15px_-7px_rgba(0,0,0,0.2)] flex flex-col w-full max-w-[1100px] max-h-[90vh]"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[rgba(0,0,0,0.08)] flex-shrink-0">
              <div className="flex flex-col">
                <h2 className="text-[#1f1d25] text-[20px] font-medium tracking-[0.15px] leading-tight">
                  {t('Web Monitoring Configuration')}
                </h2>
                <span className="text-sm text-[#686576] mt-1">
                  {t('Configure how dealership websites are scanned for compliance violations')}
                </span>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer flex-shrink-0">
                <X className="w-5 h-5 text-[#686576]" />
              </button>
            </div>

            {/* Body — [FV] 2-column grid: left = Schedule + Docs, right = Dealerships (taller) */}
            <div className="flex-1 overflow-hidden px-6 py-5 grid grid-cols-2 gap-6 min-h-0">

              {/* ── LEFT COLUMN: Schedule + Compliance Documents ── */}
              <div className="flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-1 min-h-0">

                {/* Section 1: Monitoring frequency */}
                <section>
                  <h3 className="text-[#1f1d25] text-[14px] font-medium mb-3">{t('Monitoring frequency')}</h3>
                  <p className="text-[12px] text-[#686576] mb-3">
                    {t('Set how often the AI scans dealership sites for new infractions.')}
                  </p>
                  <SchedulePanel
                    defaultEnabled={true}
                    defaultExpanded={true}
                    defaultRepeatUnit="day"
                    defaultEndsType="never"
                  />
                </section>

                {/* [FV] Section 2: Notify by Email — between Monitoring frequency and Compliance documents */}
                <section>
                  <h3 className="text-[#1f1d25] text-[14px] font-medium mb-1">{t('Notify by Email')}</h3>
                  <p className="text-[12px] text-[#686576] mb-3">
                    {t('Selected users will receive an email report of the infractions found during the interval set above in Monitoring frequency.')}
                  </p>

                  <div ref={userPickerRef} className="relative">
                    {/* Multi-select input area (chips + chevron) */}
                    <div
                      onClick={() => setIsUserPickerOpen((o) => !o)}
                      role="button"
                      tabIndex={0}
                      aria-expanded={isUserPickerOpen}
                      className={cn(
                        'min-h-[40px] w-full bg-white border rounded-[10px] px-2 py-1.5 flex items-center gap-2 cursor-pointer transition-colors',
                        isUserPickerOpen ? 'border-[#473BAB] ring-1 ring-[#473BAB]' : 'border-[#E0E0E0] hover:border-[#9C99A9]',
                      )}
                    >
                      <Mail className="w-4 h-4 text-[#9C99A9] flex-shrink-0" />
                      <div className="flex-1 flex flex-wrap gap-1.5 min-w-0">
                        {notifyUserIds.size === 0 ? (
                          <span className="text-[13px] text-[#9C99A9]">{t('Click to select users…')}</span>
                        ) : (
                          DEFAULT_OEM_USERS
                            .filter((u) => notifyUserIds.has(u.id))
                            .map((u) => (
                              <span
                                key={u.id}
                                onClick={(e) => { e.stopPropagation(); toggleNotifyUser(u.id); }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[rgba(71,59,171,0.08)] text-[#473BAB] text-[12px] font-medium border border-[rgba(71,59,171,0.24)] hover:bg-[rgba(71,59,171,0.14)]"
                              >
                                {u.name}
                                <X className="w-3 h-3" />
                              </span>
                            ))
                        )}
                      </div>
                      <motion.span animate={{ rotate: isUserPickerOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0 text-[#686576]">
                        <ChevronDown className="w-4 h-4" />
                      </motion.span>
                    </div>

                    {/* Dropdown — list of OEM users with checkboxes */}
                    <AnimatePresence>
                      {isUserPickerOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute z-20 left-0 right-0 mt-1 bg-white border border-[#E0E0E0] rounded-[10px] shadow-lg max-h-[260px] overflow-y-auto custom-scrollbar"
                        >
                          {DEFAULT_OEM_USERS.map((u) => {
                            const checked = notifyUserIds.has(u.id);
                            return (
                              <label
                                key={u.id}
                                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer select-none"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleNotifyUser(u.id)}
                                  className="w-4 h-4 accent-[#473BAB] cursor-pointer"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] text-[#1f1d25] truncate">{u.name}</p>
                                  <p className="text-[11px] text-[#9C99A9] truncate">{u.email}</p>
                                </div>
                              </label>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </section>

                {/* Section 3: Compliance requirements documents (multi-doc) */}
                <section>
                  <h3 className="text-[#1f1d25] text-[14px] font-medium mb-1">{t('Compliance requirements documents')}</h3>
                  <p className="text-[12px] text-[#686576] mb-3">
                    {t('The AI uses these documents as the reference rulebook to identify compliance infractions.')}
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,application/pdf"
                    className="hidden"
                    onChange={onSelectFile}
                  />

                  {/* Existing docs list (cards) — pre-seeded with VW Brand Guidelines */}
                  {docs.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {docs.map((d) => (
                        <div key={d.id} className="flex items-center gap-3 px-4 py-3 border border-[#E0E0E0] rounded-[10px] bg-[#FAFAFB]">
                          <div className="w-10 h-10 rounded-md bg-[rgba(71,59,171,0.08)] flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-[#473BAB]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-[#1f1d25] truncate">{d.name}</p>
                            <p className="text-[11px] text-[#9C99A9]">{(d.size / 1024 / 1024).toFixed(1)} MB</p>
                          </div>
                          {d.url && (
                            <button
                              type="button"
                              onClick={() => openDocPreview(d)}
                              aria-label="Preview document"
                              className="p-1.5 rounded text-[#473BAB] hover:bg-[rgba(71,59,171,0.08)]"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeDoc(d.id)}
                            aria-label="Remove document"
                            className="p-1.5 rounded text-[#be0e1c] hover:bg-[rgba(210,50,63,0.06)]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Drop zone — always visible below the list */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`rounded-[10px] border-2 border-dashed transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 py-8 px-6 text-center ${
                      isDragOver ? 'border-[#473BAB] bg-[rgba(71,59,171,0.04)]' : 'border-[#D0CFD7] bg-[#FAFAFB] hover:bg-[#F5F4F8]'
                    }`}
                  >
                    <UploadCloud className="w-6 h-6 text-[#9C99A9]" />
                    <p className="text-[13px] font-medium text-[#1f1d25]">
                      {t('Drag a PDF or Word document here, or click to browse')}
                    </p>
                    <p className="text-[11px] text-[#9C99A9]">PDF · DOC · DOCX · TXT</p>
                  </div>
                </section>

              </div>

              {/* ── RIGHT COLUMN: Monitored Dealerships (flex, taller) ── */}
              <div className="flex flex-col min-h-0 overflow-hidden">
                <div className="flex items-center justify-between mb-3 gap-3 flex-shrink-0">
                  <h3 className="text-[#1f1d25] text-[14px] font-medium">{t('Monitored dealerships')}</h3>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={toggleAll}
                      className="text-[12px] font-medium text-[#473BAB] hover:underline"
                    >
                      {selectedIds.size === dealerships.length ? t('Deselect all') : t('Select all')}
                    </button>
                    <button
                      type="button"
                      onClick={addDealership}
                      className="flex items-center gap-1.5 px-3 h-8 border border-[#473BAB] text-[#473BAB] hover:bg-[rgba(71,59,171,0.06)] rounded-full text-[12px] font-medium transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {t('Add Dealership')}
                    </button>
                  </div>
                </div>
                <div className="flex-1 min-h-0 border border-[#E0E0E0] rounded-[10px] divide-y divide-[#F0F0F0] overflow-y-auto custom-scrollbar">
                  {dealerships.map((d) => {
                    const checked = selectedIds.has(d.id);
                    const expanded = expandedIds.has(d.id);
                    return (
                      <div key={d.id}>
                        {/* Header row */}
                        <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleDealership(d.id)}
                            className="w-4 h-4 accent-[#473BAB] cursor-pointer"
                          />
                          <span
                            className={cn('flex-1 text-[13px] text-[#1f1d25] cursor-pointer', !d.name && 'text-[#9C99A9] italic')}
                            onClick={() => toggleExpand(d.id)}
                          >
                            {d.name || t('New dealership')}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleExpand(d.id)}
                            className="p-1 text-[#686576] hover:text-[#1f1d25]"
                            aria-expanded={expanded}
                          >
                            <motion.span
                              animate={{ rotate: expanded ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                              className="block"
                            >
                              <ChevronDown size={16} />
                            </motion.span>
                          </button>
                        </div>

                        {/* Body */}
                        <AnimatePresence initial={false}>
                          {expanded && (
                            <motion.div
                              key="body"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.22, ease: 'easeInOut' }}
                              className="overflow-hidden bg-[#FAFAFB]"
                            >
                              <div className="px-4 py-3 flex flex-col gap-2">
                                <Field
                                  label={t('Dealership name')}
                                  value={d.name}
                                  onChange={(v) => updateDealership(d.id, { name: v })}
                                  placeholder="Jack Daniels Volkswagen"
                                  hideLink
                                />
                                <Field
                                  label={t('Website')}
                                  value={d.website}
                                  onChange={(v) => updateDealership(d.id, { website: v })}
                                  placeholder="example.com"
                                  linkBuilder={(v) => {
                                    const trimmed = v.trim();
                                    if (!trimmed) return null;
                                    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
                                  }}
                                />
                                {/* Instagram field hidden — not used in current monitoring scope
                                <Field
                                  label={t('Instagram account')}
                                  value={d.instagram}
                                  onChange={(v) => updateDealership(d.id, { instagram: v })}
                                  placeholder="@dealership"
                                  linkBuilder={(v) => {
                                    const handle = v.trim().replace(/^@/, '');
                                    return handle ? `https://www.instagram.com/${handle}/` : null;
                                  }}
                                /> */}
                                <Field
                                  label={t('Meta Ads')}
                                  value={d.metaAds}
                                  onChange={(v) => updateDealership(d.id, { metaAds: v })}
                                  placeholder="account-handle"
                                  linkBuilder={(v) => {
                                    const q = v.trim().replace(/^@/, '');
                                    return q
                                      ? `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&is_targeted_country=false&media_type=all&q=${encodeURIComponent(q)}&search_type=keyword_unordered&sort_data[direction]=desc&sort_data[mode]=total_impressions`
                                      : null;
                                  }}
                                />
                                <div className="flex items-center justify-end gap-2 mt-1">
                                  <button
                                    type="button"
                                    onClick={() => removeDealership(d.id)}
                                    className="flex items-center gap-1.5 px-3 h-8 text-[12px] font-medium text-[#be0e1c] hover:bg-[rgba(210,50,63,0.06)] rounded-full cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    {t('Remove')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => { toggleExpand(d.id); emitSnackbar(t('Dealership saved')); }}
                                    className="flex items-center gap-1.5 px-4 h-8 bg-[#473BAB] hover:bg-[#3D3295] text-white rounded-full text-[12px] font-medium transition-colors cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    {t('Save')}
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[11px] text-[#9C99A9] mt-2 flex-shrink-0">
                  {selectedIds.size} {t('of')} {dealerships.length} {t('dealerships selected')}
                </p>
              </div>

            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[rgba(0,0,0,0.08)] flex-shrink-0">
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-full text-sm font-medium text-[#111014]/60 hover:bg-black/5 transition-colors cursor-pointer"
              >
                {t('Cancel')}
              </button>
              <button
                onClick={handleSendReport}
                disabled={isSending || isScanning}
                className="flex items-center gap-2 px-6 py-2 border border-[#473BAB] text-[#473BAB] hover:bg-[rgba(71,59,171,0.06)] disabled:opacity-60 rounded-full text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {isSending ? t('Sending…') : t('Send')}
              </button>
              <button
                onClick={handleScanAll}
                disabled={isScanning}
                className="flex items-center gap-2 px-6 py-2 border border-[#473BAB] text-[#473BAB] hover:bg-[rgba(71,59,171,0.06)] disabled:opacity-60 rounded-full text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isScanning ? t('Scanning…') : selectedIds.size === dealerships.length ? t('Scan All') : t('Scan Selected')}
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 bg-[#473BAB] hover:bg-[#3D3295] text-white rounded-full text-sm font-medium transition-colors shadow-sm cursor-pointer whitespace-nowrap"
              >
                <Check className="w-4 h-4" />
                {t('Save')}
              </button>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )}
    {previewDoc && (
      <DocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
    )}
    </>
  );
}

// [FV] labeled text input row with optional "open in new tab" affordance
// hideLink: renders the icon slot as invisible to keep row widths consistent, but shows no link
function Field({
  label, value, onChange, placeholder, linkBuilder, hideLink,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  linkBuilder?: (value: string) => string | null;
  hideLink?: boolean;
}) {
  const link = linkBuilder?.(value) ?? null;
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-[#686576]">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-white border border-[#E0E0E0] rounded-md px-2.5 py-1.5 text-[13px] text-[#1f1d25] focus:outline-none focus:border-[#473BAB] focus:ring-1 focus:ring-[#473BAB]"
        />
        {/* Render the icon slot when linkBuilder is provided (active) or hideLink (invisible placeholder) */}
        {(linkBuilder || hideLink) && (
          <a
            href={link ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => { if (!link || hideLink) e.preventDefault(); }}
            aria-disabled={!link || hideLink}
            aria-label="Open in new tab"
            title={link ? 'Open in new tab' : 'Fill in a value to enable'}
            className={cn(
              'p-1.5 rounded transition-colors',
              hideLink
                ? 'invisible pointer-events-none'
                : link
                  ? 'text-[#473BAB] hover:bg-[rgba(71,59,171,0.06)]'
                  : 'text-[#D0CFD7] cursor-not-allowed pointer-events-none',
            )}
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </label>
  );
}
