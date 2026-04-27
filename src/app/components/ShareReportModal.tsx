import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Minus, Plus, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CustomSelect } from './ui/CustomSelect';
import { SingleDatePicker } from './ui/SingleDatePicker';
import { CheckboxOEM } from './ui/CheckboxOEM';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShareReportModalProps {
  isOpen: boolean;
  reportName: string;
  onClose: () => void;
}

type Tab = 'send' | 'link';
type MessageType = 'email' | 'platform';
type LinkType = 'current' | 'thread';
type EndsType = 'never' | 'on' | 'after';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] text-[#686576] mb-1.5 leading-none">{children}</p>
  );
}

function RadioOption({
  id, checked, onChange, children,
}: { id: string; checked: boolean; onChange: () => void; children: React.ReactNode }) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 cursor-pointer group select-none">
      <div
        id={id}
        role="radio"
        aria-checked={checked}
        onClick={onChange}
        className={cn(
          'w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
          checked
            ? 'border-[var(--brand-accent)] bg-[var(--brand-accent)]'
            : 'border-[#CAC9CF] bg-white group-hover:border-[var(--brand-accent)]/50',
        )}
      >
        {checked && <div className="w-[7px] h-[7px] rounded-full bg-white" />}
      </div>
      <span className="text-[13px] text-[#1f1d25] leading-none">{children}</span>
    </label>
  );
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={cn(
        'w-9 h-5 rounded-full relative transition-colors duration-200 shrink-0 focus:outline-none',
        checked ? 'bg-[var(--brand-accent)]' : 'bg-[#D1D5DB]',
      )}
    >
      <span
        className={cn(
          'absolute top-[2px] left-[2px] w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200',
          checked ? 'translate-x-4' : 'translate-x-0',
        )}
      />
    </button>
  );
}

// ─── Recipient tag input ──────────────────────────────────────────────────────

function RecipientTagInput() {
  const [tags, setTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function addTag(raw: string) {
    const val = raw.trim().replace(/,+$/, '');
    if (val && !tags.includes(val)) setTags(prev => [...prev, val]);
    setInputValue('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(inputValue); }
    else if (e.key === 'Backspace' && !inputValue) setTags(prev => prev.slice(0, -1));
  }

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="min-h-10 w-full flex flex-wrap gap-1.5 items-center px-3 py-2 bg-[#F9FAFA] border border-[#CAC9CF] rounded-[4px] cursor-text hover:border-[#B0B0B5] focus-within:ring-1 focus-within:ring-[var(--brand-accent)] focus-within:border-[var(--brand-accent)] transition-all"
    >
      {tags.map(tag => (
        <span key={tag} className="inline-flex items-center gap-1 bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] text-[12px] font-medium px-2 py-0.5 rounded-full">
          {tag}
          <button type="button" onClick={e => { e.stopPropagation(); setTags(p => p.filter(t => t !== tag)); }} className="opacity-60 hover:opacity-100">
            <X size={10} strokeWidth={2.5} />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (inputValue.trim()) addTag(inputValue); }}
        placeholder={tags.length === 0 ? 'Add recipients…' : ''}
        className="flex-1 min-w-[100px] bg-transparent text-[13px] text-[#1f1d25] placeholder:text-[#686576]/60 outline-none"
      />
    </div>
  );
}

// ─── Day pills ────────────────────────────────────────────────────────────────

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function DayPills({ active, onChange }: { active: number[]; onChange: (d: number[]) => void }) {
  return (
    <div className="flex gap-2">
      {DAY_LABELS.map((d, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(active.includes(i) ? active.filter(x => x !== i) : [...active, i])}
          className={cn(
            'w-9 h-9 rounded-full text-[12px] font-medium transition-colors select-none',
            active.includes(i)
              ? 'bg-[var(--brand-accent)] text-white'
              : 'bg-[rgba(99,86,225,0.12)] text-[var(--brand-accent)] hover:bg-[rgba(99,86,225,0.2)]',
          )}
        >
          {d}
        </button>
      ))}
    </div>
  );
}

// ─── Number stepper ───────────────────────────────────────────────────────────

function NumberStepper({ value, onChange, min = 1, max = 99 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center h-10 border border-[#CAC9CF] rounded-[4px] bg-[#F9FAFA] overflow-hidden">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
        className="w-8 h-full flex items-center justify-center text-[#686576] hover:bg-gray-100 disabled:opacity-40 transition-colors">
        <Minus size={12} />
      </button>
      <span className="w-9 text-center text-[13px] text-[#1f1d25] font-medium select-none">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}
        className="w-8 h-full flex items-center justify-center text-[#686576] hover:bg-gray-100 disabled:opacity-40 transition-colors">
        <Plus size={12} />
      </button>
    </div>
  );
}

// ─── Schedule right panel ─────────────────────────────────────────────────────

function SchedulePanel() {
  const [enabled, setEnabled] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [repeatEvery, setRepeatEvery] = useState(1);
  const [repeatUnit, setRepeatUnit] = useState('week');
  const [activeDays, setActiveDays] = useState<number[]>([1]);
  const [endsType, setEndsType] = useState<EndsType>('never');
  const [endsDate, setEndsDate] = useState<Date | undefined>();
  const [endsAfter, setEndsAfter] = useState(10);

  const UNIT_OPTIONS = [
    { value: 'day', label: 'day' },
    { value: 'week', label: 'week' },
    { value: 'month', label: 'month' },
  ];

  function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    if (next) setExpanded(true);
    else setExpanded(false);
  }

  return (
    <div className="border border-[#E8E9EC] rounded-[10px] overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 px-5 py-3.5">
        <ToggleSwitch checked={enabled} onChange={handleToggle} />
        <span className={cn('flex-1 text-[13px] font-semibold tracking-[-0.1px]', enabled ? 'text-[var(--brand-accent)]' : 'text-[#686576]')}>
          Schedule
        </span>
        <button
          type="button"
          onClick={() => { if (enabled) setExpanded(v => !v); }}
          disabled={!enabled}
          className="p-1 disabled:opacity-30 text-[#686576] hover:text-[#1f1d25] transition-colors"
        >
          <motion.span
            animate={{ rotate: expanded && enabled ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="block"
          >
            <ChevronDown size={16} />
          </motion.span>
        </button>
      </div>

      {/* Expandable body */}
      <AnimatePresence initial={false}>
        {enabled && expanded && (
          <motion.div
            key="sched-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 flex flex-col gap-5 border-t border-[#E8E9EC]">
              {/* Repeat every */}
              <div className="pt-4">
                <SectionLabel>Repeat every</SectionLabel>
                <div className="flex gap-2 items-center">
                  <NumberStepper value={repeatEvery} onChange={setRepeatEvery} />
                  <CustomSelect value={repeatUnit} onChange={setRepeatUnit} options={UNIT_OPTIONS} className="w-[120px]" />
                </div>
              </div>

              {/* Repeat on (week only) */}
              {repeatUnit === 'week' && (
                <div>
                  <SectionLabel>Repeat on</SectionLabel>
                  <DayPills active={activeDays} onChange={setActiveDays} />
                </div>
              )}

              {/* Ends */}
              <div>
                <SectionLabel>Ends</SectionLabel>
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-3">
                    <RadioOption id="ends-never" checked={endsType === 'never'} onChange={() => setEndsType('never')}>Never</RadioOption>
                    {endsType === 'never' && (
                      <span className="text-[12px] text-[#686576] border border-[#E8E9EC] rounded-[4px] px-2.5 py-1">Jan, 11 2025</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <RadioOption id="ends-on" checked={endsType === 'on'} onChange={() => setEndsType('on')}>On</RadioOption>
                    {endsType === 'on' && (
                      <SingleDatePicker value={endsDate} onChange={setEndsDate} className="w-[140px]" />
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <RadioOption id="ends-after" checked={endsType === 'after'} onChange={() => setEndsType('after')}>After</RadioOption>
                    {endsType === 'after' && (
                      <div className="flex items-center gap-2">
                        <NumberStepper value={endsAfter} onChange={setEndsAfter} max={999} />
                        <span className="text-[12px] text-[#686576]">occurrences</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Send And Schedule tab ────────────────────────────────────────────────────

function SendAndScheduleTab({ reportName }: { reportName: string }) {
  const [messageType, setMessageType] = useState<MessageType>('email');

  return (
    <div className="flex gap-0 min-h-0">
      {/* Left column */}
      <div className="flex-1 px-6 py-6 flex flex-col gap-5 min-w-0">
        <div>
          <SectionLabel>Report title</SectionLabel>
          <input
            readOnly
            value={reportName}
            className="w-full h-10 px-3 bg-[#F9FAFA] border border-[#CAC9CF] rounded-[4px] text-[13px] text-[#1f1d25] outline-none cursor-default select-none"
          />
        </div>

        <div>
          <SectionLabel>Recipients</SectionLabel>
          <RecipientTagInput />
        </div>

        <div className="flex gap-5 items-center">
          <RadioOption id="msg-email" checked={messageType === 'email'} onChange={() => setMessageType('email')}>
            Send email
          </RadioOption>
          <RadioOption id="msg-platform" checked={messageType === 'platform'} onChange={() => setMessageType('platform')}>
            Send platform message
          </RadioOption>
        </div>
      </div>

      {/* Vertical divider */}
      <div className="w-px bg-[#E8E9EC] my-4 shrink-0" />

      {/* Right column — schedule */}
      <div className="w-[360px] px-5 py-5 shrink-0">
        <SchedulePanel />
      </div>
    </div>
  );
}

// ─── Public Link tab ──────────────────────────────────────────────────────────

function PublicLinkTab({ reportName }: { reportName: string }) {
  const [linkType, setLinkType] = useState<LinkType>('current');
  const [requireLogin, setRequireLogin] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `https://vwfunds.app/reports/shared/${encodeURIComponent(reportName.toLowerCase().replace(/\s+/g, '-'))}`;

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="px-6 py-5 flex flex-col gap-4">
      <div>
        <SectionLabel>Report title</SectionLabel>
        <input readOnly value={reportName}
          className="w-full h-10 px-3 bg-[#F9FAFA] border border-[#CAC9CF] rounded-[4px] text-[13px] text-[#1f1d25] outline-none cursor-default select-none" />
      </div>

      <div className="flex gap-5 items-center">
        <RadioOption id="link-current" checked={linkType === 'current'} onChange={() => setLinkType('current')}>Current Response</RadioOption>
        <RadioOption id="link-thread" checked={linkType === 'thread'} onChange={() => setLinkType('thread')}>Full Thread</RadioOption>
      </div>

      <div>
        <SectionLabel>Shareable link</SectionLabel>
        <div className="flex items-center gap-2 px-3 h-10 bg-[#F3F4F6] border border-[#E0E0E3] rounded-[4px]">
          <span className="flex-1 text-[12px] text-[#686576] truncate select-all">{shareUrl}</span>
          <button type="button" onClick={handleCopy}
            className="shrink-0 p-1 rounded hover:bg-gray-200 transition-colors text-[#686576] hover:text-[#1f1d25]">
            <AnimatePresence mode="wait" initial={false}>
              {copied
                ? <motion.span key="c" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}><Check size={14} className="text-green-600" /></motion.span>
                : <motion.span key="u" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}><Copy size={14} /></motion.span>
              }
            </AnimatePresence>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <CheckboxOEM checked={requireLogin} onCheckedChange={v => setRequireLogin(v === true)} id="require-login" />
        <label htmlFor="require-login" className="text-[13px] text-[#1f1d25] cursor-pointer select-none">Require login to view</label>
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function ShareReportModal({ isOpen, reportName, onClose }: ShareReportModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('send');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'send', label: 'Send And Schedule' },
    { id: 'link', label: 'Public Link' },
  ];

  useEffect(() => {
    if (isOpen) setActiveTab('send');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="share-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          className="fixed inset-0 z-[500] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/55" onClick={onClose} />

          {/* Card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="relative bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden w-full"
            style={{ maxWidth: activeTab === 'send' ? 880 : 480 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-0 shrink-0">
              <h2 className="text-[15px] font-semibold text-[#1f1d25] tracking-[-0.1px]">Share AI Report</h2>
              <button type="button" onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#686576] hover:bg-gray-100 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-6 mt-4 flex border-b border-[#E8E9EC] shrink-0">
              {tabs.map(tab => (
                <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'relative px-1 pb-2.5 mr-5 text-[13px] font-medium transition-colors',
                    activeTab === tab.id ? 'text-[var(--brand-accent)]' : 'text-[#686576] hover:text-[#1f1d25]',
                  )}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div layoutId="tab-underline"
                      className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[var(--brand-accent)]" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab body */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === 'send'
                  ? <SendAndScheduleTab reportName={reportName} />
                  : <PublicLinkTab reportName={reportName} />
                }
              </motion.div>
            </AnimatePresence>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E8E9EC] shrink-0">
              <button type="button" onClick={onClose}
                className="px-4 h-9 text-[13px] font-medium text-[#686576] hover:text-[#1f1d25] transition-colors rounded-full hover:bg-gray-100">
                Cancel
              </button>
              <button type="button" onClick={onClose}
                className="px-5 h-9 bg-[var(--brand-accent)] text-white text-[13px] font-medium rounded-full hover:opacity-90 transition-opacity">
                {activeTab === 'send' ? 'Send' : 'Done'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
