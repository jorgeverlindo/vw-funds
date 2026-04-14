import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import svgPaths from '../../imports/svg-hsos8ht30n';
import svgR from '../../imports/svg-99t21k2j3x';
import svgQ from '../../imports/svg-qohtj05ash';
import svgE from '../../imports/svg-e444od4nhe';
// TASK 2.2 — 4 unique vehicle images, one per card, no stacking
import imgVehicle1 from 'figma:asset/b062b96e6c0a044fa24546ded146f5685102040c.png'; // Card 1: ID.4
import imgVehicle2 from 'figma:asset/f925b175d9f45ba629bdedc9c27563c3216090ba.png'; // Card 2: Atlas
import imgVehicle3 from 'figma:asset/dcd4a062f63eda60d1f2ae0b47f935693f998f44.png'; // Card 3: Tiguan
import imgVehicle4 from 'figma:asset/5b760d55d2388a38009c20fbc7474decb0d7b3fe.png'; // Card 4: Jetta
import imgAgentAvatar from 'figma:asset/a66b3945941bddb97efa53207e606703467e02b3.png';

// ─── Types ────────────────────────────────────────────────────────────────────
type PaneState = 'null' | 'loading' | 'response';
type AttachmentEntry = { file: File; url: string };

// ─── Inline Tooltip ───────────────────────────────────────────────────────────
function Tooltip({ label, children, side = 'top' }: {
  label: string; children: React.ReactNode; side?: 'top' | 'right';
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative flex items-center justify-center" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, ...(side === 'top' ? { y: 4 } : { x: -4 }) }}
            animate={{ opacity: 1, ...(side === 'top' ? { y: 0 } : { x: 0 }) }}
            exit={{ opacity: 0, ...(side === 'top' ? { y: 4 } : { x: -4 }) }}
            transition={{ duration: 0.14, ease: [0.25, 0.1, 0.25, 1] }}
            className={cn('absolute pointer-events-none z-50 px-[8px] py-[4px] bg-[#1f1d25] text-white rounded-[6px]',
              side === 'top' && 'bottom-full mb-[6px] whitespace-nowrap',
              side === 'right' && 'left-full ml-[6px]',
            )}
            style={{ fontSize: 11, fontFamily: "'Roboto', sans-serif", letterSpacing: '0.17px', lineHeight: '1.43', maxWidth: 220, whiteSpace: side === 'right' ? 'normal' : 'nowrap' }}
          >
            {label}
            {side === 'top' && <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-[#1f1d25]" />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Constellation 3-Arc Loader ───────────────────────────────────────────────
interface ArcState { outer: boolean; middle: boolean; inner: boolean; }

function ConstellationArcMark({ arcs, size = 20 }: { arcs: ArcState; size?: number }) {
  return (
    <svg width={size * 0.56} height={size} viewBox="0 0 18 33" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M2.22422 16.0471C2.22422 7.57204 8.61025 0.631495 16.6988 0.0413128C16.332 0.0118036 15.9594 0 15.5867 0C6.97648 0 0 7.18252 0 16.0471C0 24.9116 6.97648 32.0941 15.5867 32.0941C15.9594 32.0941 16.332 32.0823 16.6988 32.0528C8.61025 31.4626 2.22422 24.5221 2.22422 16.0471Z"
        fill="#473bab" style={{ opacity: arcs.outer ? 0.92 : 0.22, transition: 'opacity 120ms ease' }} />
      <path d="M6.12227 16.047C6.12227 9.69073 10.9089 4.48533 16.9796 4.04269C16.7045 4.02498 16.4236 4.01318 16.1427 4.01318C9.6879 4.01318 4.4541 9.40154 4.4541 16.047C4.4541 22.6924 9.6879 28.0808 16.1427 28.0808C16.4236 28.0808 16.7045 28.069 16.9796 28.0513C10.9146 27.6086 6.12227 22.4032 6.12227 16.047Z"
        fill="#6356e1" style={{ opacity: arcs.middle ? 0.82 : 0.18, transition: 'opacity 120ms ease' }} />
      <path d="M17.2605 8.04407C17.0771 8.03227 16.8937 8.02637 16.7045 8.02637C12.3994 8.02637 8.9082 11.6206 8.9082 16.0529C8.9082 20.4851 12.3994 24.0793 16.7045 24.0793C16.8937 24.0793 17.0771 24.0734 17.2605 24.0557C13.2134 23.7606 10.0261 20.2904 10.0261 16.0529C10.0261 11.8154 13.2191 8.34507 17.2605 8.04998V8.04407Z"
        fill="#8c86fc" style={{ opacity: arcs.inner ? 0.72 : 0.12, transition: 'opacity 120ms ease' }} />
    </svg>
  );
}

function useConstellationAnim(running: boolean) {
  const [arcs, setArcs] = useState<ArcState>({ outer: false, middle: false, inner: false });
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAll = () => { timerRefs.current.forEach(clearTimeout); timerRefs.current = []; };
  const all = (lit: boolean) => setArcs({ outer: lit, middle: lit, inner: lit });
  const setO = (lit: boolean) => setArcs(s => ({ ...s, outer: lit }));
  const setM = (lit: boolean) => setArcs(s => ({ ...s, middle: lit }));
  const setI = (lit: boolean) => setArcs(s => ({ ...s, inner: lit }));

  useEffect(() => {
    if (!running) { clearAll(); all(false); return; }
    let cancelled = false;
    function loop() {
      if (cancelled) return;
      const timers: ReturnType<typeof setTimeout>[] = [];
      let t = 80;
      const q = (delay: number, fn: () => void) => { t += delay; const id = setTimeout(() => { if (!cancelled) fn(); }, t); timers.push(id); };
      all(false);
      q(80,  () => setO(true));
      q(240, () => setM(true));
      q(240, () => setI(true));
      q(600, () => {});
      q(180, () => all(false));
      q(380, () => {});
      q(140, () => all(true));
      q(280, () => all(false));
      q(200, () => all(true));
      q(280, () => all(false));
      q(320, () => {});
      q(80,  () => { all(false); setO(true); });
      q(220, () => { setO(false); setM(true); });
      q(220, () => { setM(false); setI(true); });
      q(220, () => { setI(false); });
      q(140, () => all(true));
      q(420, () => all(false));
      q(380, () => loop());
      timerRefs.current = timers;
    }
    loop();
    return () => { cancelled = true; clearAll(); setArcs({ outer: false, middle: false, inner: false }); };
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps

  return arcs;
}

// ─── Loading State ────────────────────────────────────────────────────────────
const THINKING_STEPS = [
  { label: 'Reading accrued funds balance', tasks: ['Connecting to dealer fund ledger', 'Reading YTD accrual totals'] },
  { label: 'Analyzing April inventory',     tasks: ['Pulling VDP + inventory data', 'Scoring aging & turn-rate'] },
  { label: 'Mapping campaign priorities',   tasks: ['Comparing March performance signals', 'Applying OEM compliance rules'] },
  { label: 'Building budget allocation',    tasks: ['Ranking by priority & ROI', 'Formatting report output'] },
];

function LoadingState({ onComplete }: { onComplete: () => void }) {
  const [stepIdx, setStepIdx]             = useState(0);
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [taskPhase, setTaskPhase]         = useState(0);
  const arcs = useConstellationAnim(true);

  useEffect(() => {
    setTaskPhase(0);
    const t1 = setTimeout(() => setTaskPhase(1), 700);
    const t2 = setTimeout(() => setTaskPhase(2), 1300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [stepIdx]);

  useEffect(() => {
    if (stepIdx >= THINKING_STEPS.length - 1) { const done = setTimeout(onComplete, 2000); return () => clearTimeout(done); }
    const next = setTimeout(() => setStepIdx(i => i + 1), 1800);
    return () => clearTimeout(next);
  }, [stepIdx, onComplete]);

  const step = THINKING_STEPS[stepIdx];
  const getTaskState = (i: number) => {
    if (taskPhase === 0) return i === 0 ? 'active' : 'idle';
    if (taskPhase === 1) return i === 0 ? 'done' : 'active';
    return 'done';
  };

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.24 }} className="flex flex-col gap-[10px]">
      <div className="flex items-center gap-[8px]">
        <ConstellationArcMark arcs={arcs} size={20} />
        <AnimatePresence mode="wait">
          <motion.span key={step.label} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} transition={{ duration: 0.18 }}
            className="text-[12px] text-[#686576] tracking-[0.4px] leading-[1.66]" style={{ fontFamily: "'Roboto', sans-serif" }}>
            {step.label}…
          </motion.span>
        </AnimatePresence>
        <button onClick={() => setAccordionOpen(o => !o)} className="shrink-0 hover:bg-black/5 rounded p-[2px] transition-colors cursor-pointer">
          <motion.div animate={{ rotate: accordionOpen ? 180 : 0 }} transition={{ duration: 0.18 }}>
            <svg className="w-[9px] h-[5px]" fill="none" viewBox="0 0 9.5 5.3"><path d={svgPaths.p14229000} stroke="#686576" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>
          </motion.div>
        </button>
      </div>
      <AnimatePresence>
        {accordionOpen && (
          <motion.div key="subtasks" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
            <div className="ml-[28px] flex flex-col gap-[6px] pb-[2px]">
              {step.tasks.map((t, i) => {
                const state = getTaskState(i);
                return (
                  <motion.div key={t} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.16, delay: i * 0.06 }} className="flex items-center gap-[8px]">
                    <div className={cn('w-[14px] h-[14px] rounded-full flex items-center justify-center shrink-0 transition-all duration-300',
                      state === 'idle'   && 'border border-[rgba(0,0,0,0.2)]',
                      state === 'active' && 'border border-[#473bab] bg-[rgba(71,59,171,0.08)]',
                      state === 'done'   && 'bg-[#473bab]',
                    )}>
                      {state === 'active' && <motion.div className="w-[5px] h-[5px] rounded-full bg-[#473bab]" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />}
                      {state === 'done'   && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                    </div>
                    <span className={cn('text-[11px] tracking-[0.4px] leading-[1.5]',
                      state === 'idle'   && 'text-[#9c99a9]',
                      state === 'active' && 'text-[#473bab]',
                      state === 'done'   && 'text-[#686576] line-through',
                    )} style={{ fontFamily: "'Roboto', sans-serif" }}>{t}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Voice Wave Region ────────────────────────────────────────────────────────
interface VoiceWaveRegionProps { isActive: boolean; amplitudeData?: Uint8Array | null; }

function VoiceWaveRegion({ isActive, amplitudeData }: VoiceWaveRegionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number | null>(null);
  const phaseRef  = useRef(0);
  const wrapRef   = useRef<HTMLDivElement>(null);

  // Ref always holds the latest amplitudeData — readable inside tick() without stale closure.
  // Synced on every render; no effect needed.
  const amplitudeDataRef = useRef(amplitudeData);
  amplitudeDataRef.current = amplitudeData;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (!isActive) {
      if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      phaseRef.current = 0;
      return;
    }
    const initTimer = setTimeout(() => {
      const wrap = wrapRef.current;
      const W = (wrap?.offsetWidth) || (canvas.parentElement?.offsetWidth) || 340;
      const H = 40;
      canvas.width = W; canvas.height = H;
      const BARS = 32, barW = Math.max(2, (W - BARS * 3) / BARS), gap = (W - BARS * barW) / (BARS + 1), cy = H / 2;
      const R = 71, G = 59, B = 171;
      function tick() {
        ctx.clearRect(0, 0, W, H);
        const phase = phaseRef.current;
        const ampD = amplitudeDataRef.current; // always fresh — no stale closure
        for (let i = 0; i < BARS; i++) {
          let amp: number;
          if (ampD && ampD.length > 0) {
            const binIdx = Math.floor(i * ampD.length / BARS), binNext = Math.min(binIdx + 1, ampD.length - 1);
            amp = (ampD[binIdx] / 255) * 0.7 + (ampD[binNext] / 255) * 0.3;
          } else {
            const t = phase + i * 0.42, raw = Math.sin(t) * 0.5 + Math.sin(t * 1.8 + 1.1) * 0.3 + Math.sin(t * 3.3 + 2.3) * 0.2;
            amp = (raw + 1) / 2;
          }
          const barH = 3 + amp * (H * 0.82 - 3), alpha = parseFloat((0.35 + amp * 0.65).toFixed(2)), x = gap + i * (barW + gap);
          ctx.fillStyle = `rgba(${R},${G},${B},${alpha})`;
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') ctx.roundRect(x, cy - barH / 2, barW, barH, Math.min(barW / 2, 2));
          else ctx.rect(x, cy - barH / 2, barW, barH);
          ctx.fill();
        }
        phaseRef.current += 0.058;
        rafRef.current = requestAnimationFrame(tick);
      }
      rafRef.current = requestAnimationFrame(tick);
    }, 280);
    return () => { clearTimeout(initTimer); if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } };
  }, [isActive]); // amplitudeData removed — read via ref to avoid restarting the loop every frame

  return (
    <motion.div ref={wrapRef} initial={false}
      animate={isActive ? { maxHeight: 44, opacity: 1, marginBottom: 2 } : { maxHeight: 0, opacity: 0, marginBottom: 0 }}
      transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }} className="overflow-hidden w-full">
      <canvas ref={canvasRef} className="block w-full rounded-[8px]" style={{ height: 40, background: 'rgba(71,59,171,0.07)' }} />
    </motion.div>
  );
}

function VoiceStatus({ isActive }: { isActive: boolean }) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.p key="voice-status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          className="text-center select-none" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 500, fontSize: 10, color: '#473bab', letterSpacing: '0.03em', lineHeight: 1.5 }}>
          Listening…
        </motion.p>
      )}
    </AnimatePresence>
  );
}

// ─── AgentInput ───────────────────────────────────────────────────────────────
export interface AgentInputProps { onSubmit?: (text: string, attachment: File | null) => void; compact?: boolean; }

const SIM_PHRASES = [
  'Raise what I have in accrued funds', ' and plan strategies based on my inventory',
  ' for April.', ' Order them by priority', ' and justify each one', ' with the corresponding budget allocation.',
];

export function AgentInput({ onSubmit, compact = false }: AgentInputProps) {
  const [value, setValue]             = useState('');
  const [isFocused, setIsFocused]     = useState(false);
  const [attachment, setAttachment]   = useState<AttachmentEntry | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [amplitudeData, setAmplitudeData] = useState<Uint8Array | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const simTimerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef    = useRef<AnalyserNode | null>(null);
  const audioCtxRef    = useRef<AudioContext | null>(null);
  const ampArrayRef    = useRef<Uint8Array | null>(null);
  const ampRafRef      = useRef<number | null>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const isReadyToSend  = value.trim().length > 0 || !!attachment;

  const startAmpLoop = useCallback(() => {
    function poll() {
      if (!analyserRef.current || !ampArrayRef.current) return;
      analyserRef.current.getByteFrequencyData(ampArrayRef.current);
      setAmplitudeData(new Uint8Array(ampArrayRef.current));
      ampRafRef.current = requestAnimationFrame(poll);
    }
    ampRafRef.current = requestAnimationFrame(poll);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch (_) {} recognitionRef.current = null; }
    if (simTimerRef.current !== null) { clearInterval(simTimerRef.current); simTimerRef.current = null; }
    if (ampRafRef.current !== null) { cancelAnimationFrame(ampRafRef.current); ampRafRef.current = null; }
    if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch (_) {} audioCtxRef.current = null; }
    analyserRef.current = null; ampArrayRef.current = null;
    setAmplitudeData(null); setIsListening(false);
  }, []);

  const startListening = useCallback(async () => {
    setIsListening(true);
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    let usingRealASR = false;
    if (SpeechRec) {
      try {
        const recognition: SpeechRecognition = new SpeechRec();
        recognition.continuous = true; recognition.interimResults = true; recognition.lang = 'en-US';
        let finalText = value;
        recognition.onresult = (evt: SpeechRecognitionEvent) => {
          let interim = '';
          for (let i = evt.resultIndex; i < evt.results.length; i++) {
            const t = evt.results[i][0].transcript;
            if (evt.results[i].isFinal) { finalText += (finalText ? ' ' : '') + t; } else interim = t;
          }
          setValue(finalText + (interim ? (finalText ? ' ' : '') + interim : ''));
        };
        recognition.onerror = () => stopListening();
        recognition.onend   = () => { if (recognitionRef.current) stopListening(); };
        recognition.start(); recognitionRef.current = recognition; usingRealASR = true;
      } catch (_) {}
    }
    if (!usingRealASR) {
      setValue('');
      let idx = 0;
      simTimerRef.current = setInterval(() => {
        if (idx >= SIM_PHRASES.length) { if (simTimerRef.current !== null) { clearInterval(simTimerRef.current); simTimerRef.current = null; } return; }
        setValue(prev => prev + SIM_PHRASES[idx++]);
      }, 650);
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const AudioCx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCx(), source = audioCtx.createMediaStreamSource(stream), analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64; analyser.smoothingTimeConstant = 0.75; source.connect(analyser);
      const dataArr = new Uint8Array(analyser.frequencyBinCount);
      audioCtxRef.current = audioCtx; analyserRef.current = analyser; ampArrayRef.current = dataArr;
      startAmpLoop();
    } catch (_) {}
  }, [value, stopListening, startAmpLoop]);

  const handleMicToggle = useCallback(() => { if (isListening) stopListening(); else startListening(); }, [isListening, stopListening, startListening]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && isListening) stopListening(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isListening, stopListening]);

  useEffect(() => () => { stopListening(); }, [stopListening]);

  const handleAttach = useCallback((files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];
    setAttachment({ file, url: URL.createObjectURL(file) });
  }, []);

  const removeAttachment = () => { if (attachment) URL.revokeObjectURL(attachment.url); setAttachment(null); if (fileRef.current) fileRef.current.value = ''; };

  const handleSubmit = () => {
    if (isListening) stopListening();
    if (!isReadyToSend) return;
    onSubmit?.(value.trim(), attachment?.file ?? null);
    setValue(''); removeAttachment();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } };

  // Auto-resize: grow with content, never scroll internally
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <div className={cn('bg-white rounded-[16px] w-full transition-all duration-200 border border-[rgba(0,0,0,0.12)]',
      isFocused && 'border-[rgba(71,59,171,0.4)] shadow-[0_0_0_3px_rgba(71,59,171,0.06)]',
      !isFocused && 'shadow-[0px_2px_2px_0px_rgba(0,0,0,0.08)] hover:border-[rgba(0,0,0,0.2)]',
    )}>
      <div className="flex flex-col gap-[8px] p-[12px]">
        <AnimatePresence>
          {attachment && (
            <motion.div initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -4, height: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
              <div className="flex items-center gap-2 pb-1">
                <div className="flex items-center gap-1.5 pl-2 pr-1.5 py-1 bg-[rgba(71,59,171,0.06)] border border-[rgba(71,59,171,0.18)] rounded-[8px] text-[12px] text-[#473bab] max-w-full">
                  {attachment.file.type.startsWith('image/') ? <img src={attachment.url} alt="" className="w-5 h-5 rounded object-cover shrink-0" /> : <svg className="w-3.5 h-3.5 shrink-0 opacity-70" fill="none" viewBox="0 0 12 17"><path d={svgPaths.pb4add00} stroke="#473bab" strokeLinecap="round" strokeOpacity="0.9" strokeWidth="1.5" /></svg>}
                  <span className="truncate max-w-[160px] font-medium">{attachment.file.name}</span>
                  <button onClick={removeAttachment} className="ml-0.5 text-[#473bab]/60 hover:text-[#473bab] transition-colors p-0.5 rounded shrink-0" tabIndex={-1}><X className="w-3 h-3" /></button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-center w-full pb-[4px]">
          <textarea value={value} onChange={e => setValue(e.target.value)} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} onKeyDown={handleKeyDown}
            ref={textareaRef}
            placeholder={isListening ? '' : 'Ask anything'}
            className="flex-1 resize-none bg-transparent border-none outline-none text-[14px] text-[#1f1d25] placeholder-[#9c99a9] tracking-[0.15px] leading-[1.5] min-h-[22px] custom-scrollbar"
            style={{ fontFamily: "'Roboto', sans-serif" }} />
        </div>
        <VoiceWaveRegion isActive={isListening} amplitudeData={amplitudeData} />
        <VoiceStatus isActive={isListening} />
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-[4px]">
            <button onClick={() => fileRef.current?.click()} aria-label="Attach file" className="relative rounded-full p-[5px] border border-[rgba(0,0,0,0.12)] hover:bg-black/5 transition-colors cursor-pointer">
              <div className="size-[20px] flex items-center justify-center"><svg className="w-[12px] h-[17px]" fill="none" viewBox="0 0 11.9167 16.9167"><path d={svgPaths.pb4add00} stroke="#111014" strokeLinecap="round" strokeOpacity="0.56" strokeWidth="1.5" /></svg></div>
            </button>
            <button className="relative rounded-full border border-[rgba(0,0,0,0.12)] hover:bg-black/5 transition-colors cursor-pointer flex items-center gap-[8px] px-[10px] py-[4px]">
              <div className="size-[18px] relative shrink-0 flex items-center justify-center">
                <svg className="w-[15px] h-[15px]" fill="none" viewBox="0 0 15.375 15.375">
                  <path d={svgPaths.p1bd1a8c0} stroke="#111014" strokeLinejoin="round" strokeOpacity="0.56" strokeWidth="1.5" />
                  <path d={svgPaths.p2fb20000} fill="#111014" fillOpacity="0.56" />
                </svg>
              </div>
              <span className="text-[13px] text-[rgba(17,16,20,0.56)] tracking-[0.46px] whitespace-nowrap" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 500 }}>Jack Daniels Volkswagen</span>
            </button>
          </div>
          <div className="flex items-center gap-[10px]">
            <div className="relative flex items-center justify-center">
              {isListening && <motion.div className="absolute inset-0 rounded-full" style={{ border: '1px solid #473bab' }} animate={{ scale: [1, 1.75], opacity: [0.5, 0] }} transition={{ duration: 1.6, ease: 'easeOut', repeat: Infinity }} />}
              <Tooltip label={isListening ? 'Stop (ESC)' : 'Voice input'}>
                <button onClick={handleMicToggle} aria-label={isListening ? 'Stop voice input' : 'Voice input'}
                  className={cn('relative rounded-full p-[5px] transition-all duration-200 cursor-pointer', isListening ? 'border border-[#473bab] bg-[rgba(71,59,171,0.07)]' : 'border border-[rgba(17,16,20,0.56)] hover:bg-black/5')}>
                  <div className="size-[20px] flex items-center justify-center">
                    <svg className="w-[13px] h-[17px]" fill="none" viewBox="0 0 12.9603 16.9167">
                      <path d={svgPaths.p1d377a00} stroke={isListening ? '#473bab' : '#111014'} strokeLinecap="round" strokeLinejoin="round" strokeOpacity={isListening ? 1 : 0.56} strokeWidth="1.5" />
                    </svg>
                  </div>
                </button>
              </Tooltip>
            </div>
            <button onClick={handleSubmit} aria-label="Send" disabled={!isReadyToSend}
              className={cn('rounded-full p-[5px] transition-all duration-200 cursor-pointer', isReadyToSend ? 'bg-[#473bab] hover:bg-[#392e8a] shadow-sm' : 'bg-[#473bab] opacity-50 cursor-not-allowed')}>
              <div className="size-[20px] flex items-center justify-center"><svg className="w-[12px] h-[15px]" fill="none" viewBox="0 0 11.9167 15.25"><path d={svgPaths.p2332e980} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg></div>
            </button>
          </div>
        </div>
      </div>
      <input ref={fileRef} type="file" className="hidden" onChange={e => handleAttach(e.target.files)} />
    </div>
  );
}

// ─── CategoryChip ──────────────────────────────────────────────────────────────
function CategoryChip({ label }: { label: string }) {
  return (
    <button className="relative rounded-full border border-[rgba(99,86,225,0.5)] px-[10px] py-[4px] hover:bg-[rgba(71,59,171,0.06)] transition-colors cursor-pointer">
      <span className="text-[13px] text-[#473bab] tracking-[0.46px] whitespace-nowrap capitalize" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 500, lineHeight: '22px' }}>{label}</span>
    </button>
  );
}

// ─── Warning-Box ────────────────────────────────────────────────────────────
interface WarningBoxProps { variant: 'green' | 'purple' | 'info' | 'neutral'; title: string; body: string; }

function WarningBox({ variant, title, body }: WarningBoxProps) {
  const TOKEN = {
    green:   { bg: 'bg-[#e8f5e9]', borderLeft: 'border-l-[3px] border-[#2e7d32]', dot: 'bg-[#2e7d32]',  titleColor: 'text-[#1e4620]', bodyColor: 'text-[#1e4620]' },
    purple:  { bg: 'bg-[#ede8ff]', borderLeft: 'border-l-[3px] border-[#473bab]',  dot: 'bg-[#473bab]',  titleColor: 'text-[#473bab]', bodyColor: 'text-[#473bab]' },
    info:    { bg: 'bg-[#e3f2fd]', borderLeft: 'border-l-[3px] border-[#0277bd]',  dot: 'bg-[#0277bd]',  titleColor: 'text-[#01579b]', bodyColor: 'text-[#01579b]' },
    neutral: { bg: 'bg-[#f4f5f6]', borderLeft: 'border-l-[3px] border-[#9c99a9]',  dot: 'bg-[#9c99a9]',  titleColor: 'text-[#1f1d25]', bodyColor: 'text-[#686576]' },
  }[variant];
  return (
    <div className={cn('rounded-[8px] flex gap-0 overflow-hidden', TOKEN.bg, TOKEN.borderLeft)}>
      <div className="flex flex-col items-center pt-[13px] pl-[10px] pr-[6px] shrink-0"><div className={cn('w-[5px] h-[5px] rounded-full shrink-0', TOKEN.dot)} /></div>
      <div className="flex flex-col gap-[3px] py-[10px] pr-[12px] min-w-0">
        <p className={cn('text-[13px] leading-[1.46] tracking-[0.17px]', TOKEN.titleColor)} style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 500 }}>{title}</p>
        <p className={cn('text-[12px] leading-[1.5] tracking-[0.17px]', TOKEN.bodyColor)} style={{ fontFamily: "'Roboto', sans-serif" }}>{body}</p>
      </div>
    </div>
  );
}

// ─── Source chip + Rating badge ────────────────────────────────────────────────
function SourceChip({ label }: { label: string }) {
  const isVin = label.toLowerCase().startsWith('vin');
  return (
    <span className="inline-flex items-center gap-[3px] px-[5px] py-[1px] rounded-[5px] text-[10px] tracking-[0.3px] whitespace-nowrap shrink-0 bg-[#f0f2f4] text-[#686576]" style={{ fontFamily: "'Roboto', sans-serif" }}>
      {label}
      {isVin && <svg className="w-[5px] h-[5px] shrink-0 opacity-60" fill="none" viewBox="0 0 3 5"><path d="M0.5 4.5L2.32322 2.67678C2.42085 2.57915 2.42085 2.42085 2.32322 2.32322L0.5 0.5" stroke="#686576" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.1" /></svg>}
    </span>
  );
}

function RatingBadge({ rating }: { rating: 'Excellent' | 'Good' | 'OK' }) {
  return (
    <span className={cn('inline-flex items-center px-[6px] py-[2px] rounded-[4px] text-[10px] tracking-[0.3px] text-white shrink-0',
      rating === 'Excellent' && 'bg-[#3e8346]', rating === 'Good' && 'bg-[#f57c00]', rating === 'OK' && 'bg-[#9e9e9e]',
    )} style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 700 }}>{rating}</span>
  );
}

function PriorityBadge({ level }: { level: 'High' | 'Medium' | 'Low' }) {
  return (
    <span className={cn('text-[11px] tracking-[0.4px] leading-[1.5] px-[6px] py-[2px] rounded-[4px] whitespace-nowrap',
      level === 'High' && 'bg-[#fde8e8] text-[#c62828]', level === 'Medium' && 'bg-[#fff8e1] text-[#f57f17]', level === 'Low' && 'bg-[#f0f2f4] text-[#686576]',
    )} style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 500 }}>{level}</span>
  );
}

// ─── TASK 2 + 4: RecommendationsCard ─────────────────────────────────────────
// - One image per card (no stacking), passed as prop
// - Include Campaign checkbox (TASK 2.3)
// - Hover elevation (TASK 4.1)
// - Checked/unchecked visual state (TASK 4.2/4.3)
interface OfferRow { type: string; detail: string; source: string; rating: 'Excellent' | 'Good' | 'OK' }

interface RecommendationsCardProps {
  priority: number;
  title: string;
  budget: string;
  stock: string;
  transit: string;
  description: string;
  offers: OfferRow[];
  image: string;           // single vehicle image — no stacking
  included: boolean;       // controlled by parent
  onToggleIncluded: () => void;
}

function RecommendationsCard({ priority, title, budget, stock, transit, description, offers, image, included, onToggleIncluded }: RecommendationsCardProps) {
  const [offersOpen, setOffersOpen] = useState(true);
  const [hovered, setHovered] = useState(false);

  return (
    // TASK 4 — hover: border highlight; unchecked: reduced opacity
    <div
      className={cn(
        'border rounded-[12px] overflow-hidden bg-white transition-all duration-200',
        hovered && included ? 'border-[rgba(71,59,171,0.35)] shadow-[0_2px_10px_rgba(71,59,171,0.1)]' : 'border-[rgba(0,0,0,0.1)]',
        !included && 'opacity-50',
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header: single thumbnail + title/budget/stock */}
      <div className="flex items-start gap-[10px] px-[10px] pt-[10px] pb-[8px]">
        {/* TASK 2.2 — single image, object-cover, no stacking */}
        <div className="relative shrink-0 w-[68px] h-[52px] rounded-[6px] overflow-hidden bg-[#eef0f2]">
          <img
            alt=""
            src={image}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Priority badge overlay */}
          <div className="absolute top-[4px] left-[4px] w-[17px] h-[17px] rounded-full bg-[#473bab] shadow-sm flex items-center justify-center shrink-0">
            <span style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 700, fontSize: 9, lineHeight: 1, color: 'white' }}>{priority}</span>
          </div>
        </div>
        <div className="flex flex-col gap-[5px] min-w-0 flex-1 pt-[1px]">
          <p className="text-[12px] text-[#1f1d25] tracking-[0.17px] leading-[1.43]" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 500 }}>{title}</p>
          <div className="flex items-center gap-[6px] flex-wrap">
            <span className="inline-flex items-center px-[7px] py-[2px] bg-[#e8f5e9] rounded-[6px] text-[11px] text-[#1b5e20] tracking-[0.4px] leading-[1.5] shrink-0" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 500 }}>{budget}</span>
            <span className="text-[11px] text-[#686576] tracking-[0.4px] leading-[1.5] whitespace-nowrap" style={{ fontFamily: "'Roboto', sans-serif" }}>{stock}</span>
            {transit && <><span className="text-[#ccc] select-none">·</span><span className="text-[11px] text-[#686576] tracking-[0.4px] leading-[1.5] whitespace-nowrap" style={{ fontFamily: "'Roboto', sans-serif" }}>{transit}</span></>}
          </div>
        </div>
      </div>

      {/* Rationale */}
      <div className="border-t border-[rgba(0,0,0,0.07)] px-[10px] py-[8px] bg-[#fafafa]">
        <p className="text-[11px] text-[#1f1d25] leading-[1.6] tracking-[0.16px]" style={{ fontFamily: "'Roboto', sans-serif" }}>{description}</p>
      </div>

      {/* Recommended Offers */}
      <div className="border-t border-[rgba(0,0,0,0.07)]">
        <button onClick={() => setOffersOpen(o => !o)} className="w-full flex items-center justify-between px-[10px] pt-[7px] pb-[5px] hover:bg-[rgba(0,0,0,0.02)] transition-colors cursor-pointer">
          <p className="text-[10px] text-[#686576] tracking-[0.5px] uppercase" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 600 }}>Recommended Offers</p>
          <motion.div animate={{ rotate: offersOpen ? 0 : -90 }} transition={{ duration: 0.18 }}>
            <svg className="w-[8px] h-[5px]" fill="none" viewBox="0 0 9.5 5.3"><path d={svgPaths.p14229000} stroke="#686576" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>
          </motion.div>
        </button>
        <AnimatePresence initial={false}>
          {offersOpen && (
            <motion.div key="offers-body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <div className="overflow-x-auto px-[10px] pb-[8px]">
                <table className="w-full min-w-[260px] border-collapse">
                  <colgroup><col style={{ width: '50px' }} /><col style={{ width: '110px' }} /><col /><col style={{ width: '64px' }} /></colgroup>
                  <thead>
                    <tr>{['Type', 'Terms', 'Source', 'Rating'].map(h => (
                      <th key={h} className="pb-[4px] text-left whitespace-nowrap" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 400, fontSize: 10, color: '#9c99a9', letterSpacing: '0.3px' }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {offers.map((o, i) => (
                      <tr key={i} className={cn('border-t border-[rgba(0,0,0,0.05)]', i === 0 && 'border-t-0')}>
                        <td className="py-[4px] pr-[6px] align-middle"><span className="text-[11px] text-[#686576] tracking-[0.17px] whitespace-nowrap" style={{ fontFamily: "'Roboto', sans-serif" }}>{o.type}</span></td>
                        <td className="py-[4px] pr-[6px] align-middle"><span className="text-[11px] text-[#1f1d25] tracking-[0.17px] whitespace-nowrap" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 500 }}>{o.detail}</span></td>
                        <td className="py-[4px] pr-[6px] align-middle"><SourceChip label={o.source} /></td>
                        <td className="py-[4px] text-right align-middle"><RatingBadge rating={o.rating} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* TASK 2.3 — Include Campaign checkbox */}
      <div className="border-t border-[rgba(0,0,0,0.07)] px-[10px] py-[8px] flex items-center gap-[8px]">
        <button
          onClick={onToggleIncluded}
          aria-label={included ? 'Uncheck campaign' : 'Include campaign'}
          className="shrink-0 cursor-pointer"
        >
          {included ? (
            // Checked state: filled purple checkbox using pcdaa200 path
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d={svgE.pcdaa200} fill="#473bab" />
            </svg>
          ) : (
            // Unchecked state: plain border box
            <div className="w-[15px] h-[15px] rounded-[2px] border-[1.5px] border-[rgba(0,0,0,0.3)]" />
          )}
        </button>
        <span
          className={cn('text-[11px] tracking-[0.4px] leading-[1.5] select-none cursor-pointer', included ? 'text-[#473bab]' : 'text-[#9c99a9]')}
          style={{ fontFamily: "'Roboto', sans-serif", fontWeight: included ? 500 : 400 }}
          onClick={onToggleIncluded}
        >
          Include Campaign
        </span>
      </div>
    </div>
  );
}

// ─── Footer Actions + Constellation Signature ─────────────────────────────────
const FOOTER_ACTIONS = [
  { label: 'Copy response', path: svgR.p23b57630, vb: '0 0 17 17' },
  { label: 'Like',          path: svgR.p36a72200, vb: '0 0 17 16' },
  { label: 'Dislike',       path: svgR.p4983df0,  vb: '0 0 17 16' },
  { label: 'Edit prompt',   path: svgR.p15a6eb00, vb: '0 0 17 17' },
  { label: 'Download',      path: svgR.p2e3480,   vb: '0 0 15.25 15.25' },
  { label: 'Share',         path: svgR.p378b0200, vb: '0 0 16.0833 16.9167' },
];

function ConstellationSignatureMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size * 0.56} height={size} viewBox="0 0 18 33" fill="none" aria-label="Constellation" className="shrink-0">
      <path d="M2.22422 16.0471C2.22422 7.57204 8.61025 0.631495 16.6988 0.0413128C16.332 0.0118036 15.9594 0 15.5867 0C6.97648 0 0 7.18252 0 16.0471C0 24.9116 6.97648 32.0941 15.5867 32.0941C15.9594 32.0941 16.332 32.0823 16.6988 32.0528C8.61025 31.4626 2.22422 24.5221 2.22422 16.0471Z" fill="#473bab" fillOpacity="0.85" />
      <path d="M6.12227 16.047C6.12227 9.69073 10.9089 4.48533 16.9796 4.04269C16.7045 4.02498 16.4236 4.01318 16.1427 4.01318C9.6879 4.01318 4.4541 9.40154 4.4541 16.047C4.4541 22.6924 9.6879 28.0808 16.1427 28.0808C16.4236 28.0808 16.7045 28.069 16.9796 28.0513C10.9146 27.6086 6.12227 22.4032 6.12227 16.047Z" fill="#6356e1" fillOpacity="0.62" />
      <path d="M17.2605 8.04407C17.0771 8.03227 16.8937 8.02637 16.7045 8.02637C12.3994 8.02637 8.9082 11.6206 8.9082 16.0529C8.9082 20.4851 12.3994 24.0793 16.7045 24.0793C16.8937 24.0793 17.0771 24.0734 17.2605 24.0557C13.2134 23.7606 10.0261 20.2904 10.0261 16.0529C10.0261 11.8154 13.2191 8.34507 17.2605 8.04998V8.04407Z" fill="#8c86fc" fillOpacity="0.42" />
    </svg>
  );
}

function FooterActions() {
  return (
    <div className="flex flex-col shrink-0 gap-[10px]">
      <div className="h-[1px] bg-[rgba(0,0,0,0.07)]" />
      <div className="flex items-center gap-[2px]">
        {FOOTER_ACTIONS.map(({ label, path, vb }) => (
          <Tooltip key={label} label={label}>
            <button aria-label={label} className="p-[5px] rounded-full hover:bg-[rgba(0,0,0,0.05)] active:bg-[rgba(0,0,0,0.08)] transition-colors cursor-pointer group">
              <div className="size-[18px] flex items-center justify-center">
                <svg className="w-[14px] h-[14px] transition-opacity duration-150 opacity-40 group-hover:opacity-70" fill="none" viewBox={vb}>
                  <path d={path} stroke="#111014" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              </div>
            </button>
          </Tooltip>
        ))}
      </div>
      <div className="flex items-center pt-[2px] pb-[4px]">
        <Tooltip label="Hi, I'm the Constellation Agent, let's help you with your tasks" side="right">
          <div className="flex items-center gap-[6px] cursor-default opacity-60 hover:opacity-100 transition-opacity duration-200">
            <ConstellationSignatureMark size={16} />
          </div>
        </Tooltip>
      </div>
    </div>
  );
}

// ─── Annex 4 — Campaign Data (source of truth) ────────────────────────────────
// Each card is unique: title, budget, stock/transit, description, offers, image
interface CampaignDef {
  id: number;
  priority: number;
  title: string;
  budget: string;
  stock: string;
  transit: string;
  description: string;
  offers: OfferRow[];
  image: string;
}

const CAMPAIGNS: CampaignDef[] = [
  {
    id: 1,
    priority: 1,
    title: 'ID.4 AWD Pro S — Lease $209/mo',
    budget: '$48,800',
    stock: '18 in stock',
    transit: '2 in transit',
    description: 'EV tax credit window narrows mid-year. Lease at $209/mo is a nationally "Excellent"-rated offer — strongest conversion lever. Prioritize Google SEM + in-AOR display.',
    offers: [
      { type: 'Lease',   detail: '$349 · 36mo',      source: 'National',    rating: 'Excellent' },
      { type: 'Finance', detail: '1.99% APR · 60mo', source: 'VIN Offer 1', rating: 'Excellent' },
      { type: 'Finance', detail: '2.39% APR · 36mo', source: 'VIN Offer',   rating: 'Good' },
      { type: 'Finance', detail: '4.99% APR · 72mo', source: 'National',    rating: 'OK' },
    ],
    image: imgVehicle1,
  },
  {
    id: 2,
    priority: 2,
    title: 'Atlas SE R-Line — Finance 1.99% APR',
    budget: '$48,500',
    stock: '24 in stock',
    transit: '3 in transit',
    description: 'Finance + cash bonus format outperformed lease-only by 40% on lead volume. Spring family SUV peak season — leverage national APR offer now.',
    offers: [
      { type: 'Lease',   detail: '$389 · 36mo',      source: 'National',    rating: 'Excellent' },
      { type: 'Finance', detail: '1.99% APR · 60mo', source: 'VIN Offer 1', rating: 'Excellent' },
      { type: 'Finance', detail: '2.39% APR · 36mo', source: 'VIN Offer',   rating: 'Good' },
    ],
    image: imgVehicle2,
  },
  {
    id: 3,
    priority: 3,
    title: 'Tiguan SE — Lease $279/mo',
    budget: '$35,200',
    stock: '31 in stock',
    transit: '4 in transit',
    description: 'Highest stock depth with a competitive national lease. Target conquest audiences in-market SUV intenders. Strong national offer leverage available.',
    offers: [
      { type: 'Lease',   detail: '$279 · 36mo',      source: 'National',    rating: 'Excellent' },
      { type: 'Finance', detail: '1.99% APR · 60mo', source: 'VIN Offer 1', rating: 'Excellent' },
      { type: 'Finance', detail: '2.39% APR · 36mo', source: 'VIN Offer',   rating: 'Good' },
      { type: 'Finance', detail: '4.99% APR · 72mo', source: 'National',    rating: 'OK' },
    ],
    image: imgVehicle3,
  },
  {
    id: 4,
    priority: 4,
    title: 'Jetta — Volume SEM',
    budget: '$14,000',
    stock: '14 in stock',
    transit: '',
    description: 'Lower stock but highest efficiency — Jetta SEM consistently delivers sub-$18 CPL. Keep as a volume play to maximize total lead count within budget.',
    offers: [
      { type: 'Lease',   detail: '$199 · 36mo',      source: 'National',    rating: 'Good' },
      { type: 'Finance', detail: '2.90% APR · 60mo', source: 'National',    rating: 'Good' },
      { type: 'Finance', detail: '2.39% APR · 36mo', source: 'VIN Offer',   rating: 'Good' },
      { type: 'Finance', detail: '4.99% APR · 72mo', source: 'National',    rating: 'OK' },
    ],
    image: imgVehicle4,
  },
];

// ─── Response State ────────────────────────────────────────────────────────────
function ResponseState({ prompt, attachment }: { prompt: string; attachment: File | null }) {
  const [thinkingOpen, setThinkingOpen] = useState(false);
  // TASK 2.3 + 3 — per-card inclusion state; all checked by default
  const [includedIds, setIncludedIds] = useState<Set<number>>(new Set(CAMPAIGNS.map(c => c.id)));

  const toggleIncluded = (id: number) => {
    setIncludedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // TASK 3 — dynamic CTA label
  const checkedCount = includedIds.size;
  const ctaLabel = checkedCount === 0
    ? 'Select campaigns to create'
    : checkedCount === 1
      ? 'Create 1 Campaign in Planner'
      : `Create ${checkedCount} Campaigns in Planner`;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }} className="flex flex-col gap-[12px]">

      {/* Prompt bubble */}
      <div className="flex flex-col items-end gap-[6px]">
        <div className="ml-[40px] bg-[#fafaff] rounded-bl-[12px] rounded-tl-[12px] rounded-tr-[12px] px-[12px] py-[10px] relative">
          <div aria-hidden="true" className="absolute inset-0 rounded-bl-[12px] rounded-tl-[12px] rounded-tr-[12px] border border-[rgba(99,86,225,0.5)] pointer-events-none" />
          <p className="text-[12px] text-[#1f1d25] leading-[1.43] tracking-[0.17px]" style={{ fontFamily: "'Roboto', sans-serif" }}>
            {prompt || 'Raise what I have in accrued funds and plan strategies based on my inventory for April. Order them by priority and justify each one, with the corresponding budget allocation.'}
          </p>
          {attachment && (
            <div className="mt-[6px] flex items-center gap-1.5 px-2 py-1 bg-[rgba(71,59,171,0.06)] border border-[rgba(71,59,171,0.18)] rounded-[8px] text-[11px] text-[#473bab] w-fit">
              <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 12 17"><path d={svgPaths.pb4add00} stroke="#473bab" strokeLinecap="round" strokeOpacity="0.9" strokeWidth="1.5" /></svg>
              <span className="truncate max-w-[140px]">{attachment.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Thinking summary */}
      <div className="flex items-center gap-[6px]">
        <span className="text-[11px] text-[#686576] tracking-[0.4px] leading-[1.66]" style={{ fontFamily: "'Roboto', sans-serif" }}>Thought for 41s</span>
        <button onClick={() => setThinkingOpen(o => !o)} className="hover:bg-black/5 rounded p-0.5 transition-colors cursor-pointer">
          <motion.div animate={{ rotate: thinkingOpen ? 180 : 0 }} transition={{ duration: 0.18 }}>
            <svg className="w-[9px] h-[5px]" fill="none" viewBox="0 0 9.5 5.3"><path d={svgPaths.p14229000} stroke="#686576" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>
          </motion.div>
        </button>
      </div>
      <AnimatePresence>
        {thinkingOpen && (
          <motion.div key="thinking" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="ml-[4px] flex flex-col gap-[5px] pb-[4px]">
              {THINKING_STEPS.map(s => (
                <div key={s.label} className="flex items-center gap-[8px]">
                  <div className="w-[14px] h-[14px] rounded-full bg-[#473bab] flex items-center justify-center shrink-0"><Check className="w-2.5 h-2.5 text-white" strokeWidth={3} /></div>
                  <span className="text-[11px] text-[#686576] tracking-[0.4px] line-through" style={{ fontFamily: "'Roboto', sans-serif" }}>{s.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Agent identity row */}
      <div className="flex items-center gap-[6px]">
        <img src={imgAgentAvatar} alt="AI Agent" className="w-[24px] h-[24px] rounded-full object-cover shrink-0" />
        <span className="text-[12px] text-[#1f1d25] tracking-[0.17px]" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 500 }}>AI Agent Auto</span>
        <div className="flex-1 h-[1px] bg-[rgba(0,0,0,0.12)]" />
      </div>

      {/* Budget Summary */}
      <div className="flex flex-col gap-[10px]">
        <div className="flex items-center gap-[8px]">
          <p className="text-[20px] text-[#1f1d25] tracking-[0.15px] leading-[1.6] shrink-0" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 500 }}>Budget Summary</p>
          <div className="flex-1 h-[1px] bg-[rgba(0,0,0,0.12)]" />
        </div>
        <p className="text-[11px] text-[#686576] tracking-[0.4px] -mt-[6px]" style={{ fontFamily: "'Roboto', sans-serif" }}>Company Plan · April 2025</p>
        <div className="flex gap-[8px]">
          <div className="flex-1 bg-[#edf7ed] rounded-[12px] border border-[rgba(0,0,0,0.12)] px-[12px] pt-[12px] pb-[8px] flex flex-col gap-[2px]">
            <span className="text-[11px] text-[#1b5e20] tracking-[0.4px] leading-[1.66]" style={{ fontFamily: "'Roboto', sans-serif" }}>Approved</span>
            <span className="text-[16px] text-[#1b5e20] tracking-[0.15px]" style={{ fontFamily: "'Roboto', sans-serif" }}>$140K</span>
          </div>
          <div className="flex-1 bg-[#f4f5f6] rounded-[12px] border border-[rgba(0,0,0,0.12)] px-[12px] pt-[12px] pb-[8px] flex flex-col gap-[2px]">
            <span className="text-[11px] text-[#1f1d25] tracking-[0.4px] leading-[1.66]" style={{ fontFamily: "'Roboto', sans-serif" }}>Recommended</span>
            <span className="text-[16px] text-[#686576] tracking-[0.15px]" style={{ fontFamily: "'Roboto', sans-serif" }}>$132K</span>
          </div>
          <div className="flex-1 bg-[#f4f5f6] rounded-[12px] border border-[rgba(0,0,0,0.12)] px-[12px] pt-[12px] pb-[8px] flex flex-col gap-[2px]">
            <span className="text-[11px] text-[#1f1d25] tracking-[0.4px] leading-[1.66]" style={{ fontFamily: "'Roboto', sans-serif" }}>Unallocated</span>
            <span className="text-[16px] text-[#686576] tracking-[0.15px]" style={{ fontFamily: "'Roboto', sans-serif" }}>$8K</span>
          </div>
        </div>
        {/* TASK 1 — "Nauman" replaced with "Mallory" */}
        <p className="text-[12px] text-[#1f1d25] leading-[1.43] tracking-[0.17px]" style={{ fontFamily: "'Roboto', sans-serif" }}>
          Hi Mallory — <strong>$140,000 in approved/accrued funds</strong> available for April. Based on inventory depth, offer quality, and March signals, I've prioritized four campaigns. Total recommended: $132,000, keeping $8,000 in reserve.
        </p>
      </div>

      {/* Inventory Mapping */}
      <div className="flex flex-col gap-[8px]">
        <p className="text-[14px] text-[#1f1d25] tracking-[0.15px]" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 500 }}>1. Inventory Mapping</p>
        <div className="overflow-x-auto rounded-[8px] border border-[rgba(0,0,0,0.1)]">
          <table className="w-full min-w-[340px] border-collapse text-[11px]" style={{ fontFamily: "'Roboto', sans-serif" }}>
            <thead>
              <tr className="bg-[#f4f5f6] border-b border-[rgba(0,0,0,0.1)]">
                {['Model', 'Inventory', 'State', 'Priority'].map(h => (
                  <th key={h} className="px-[10px] py-[6px] text-left text-[#686576] tracking-[0.4px] font-normal whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { model: 'ID.4',   inventory: '18 in stock · EV tax credit window closing',  state: 'High aging risk',  priority: 'High'   as const },
                { model: 'Atlas',  inventory: '24 in stock · Spring family SUV peak season',  state: 'Seasonal demand', priority: 'High'   as const },
                { model: 'Tiguan', inventory: '31 in stock · Strong national lease offer',    state: 'Offer leverage',  priority: 'Medium' as const },
                { model: 'Jetta',  inventory: '14 in stock · Volume model, lowest CPL',       state: 'Efficiency play', priority: 'Medium' as const },
              ].map((row, i) => (
                <tr key={row.model} className={i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}>
                  <td className="px-[10px] py-[6px] text-[#1f1d25] font-medium whitespace-nowrap">{row.model}</td>
                  <td className="px-[10px] py-[6px] text-[#1f1d25] max-w-[110px] truncate">{row.inventory}</td>
                  <td className="px-[10px] py-[6px] text-[#1f1d25] whitespace-nowrap">{row.state}</td>
                  <td className="px-[10px] py-[6px]"><PriorityBadge level={row.priority} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Insights */}
      <div className="flex flex-col gap-[8px]">
        <p className="text-[14px] text-[#1f1d25] tracking-[0.15px]" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 500 }}>2. Main Insights</p>
        <WarningBox variant="green"  title="ID.4"        body="EV lease campaigns drove 3.1× more VDP views vs March avg. Tax credit messaging converted at 2.4× the national rate — prioritize while window is open." />
        <WarningBox variant="purple" title="Atlas"       body="Finance + cash bonus format outperformed lease-only by 40% on lead volume. APR + customer bonus is the recommended combination." />
        <WarningBox variant="info"   title="Paid Social" body="Broad-audience social underperformed across all models (avg TI 1.6). All April campaigns should use in-AOR remarketing + conquest only." />
      </div>

      {/* TASK 2 — Recommended Campaigns: 4 unique cards with correct data from Annex 4 */}
      <div className="flex flex-col gap-[10px]">
        <p className="text-[14px] text-[#1f1d25] tracking-[0.15px]" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 500 }}>3. Recommended Campaigns</p>
        {CAMPAIGNS.map(c => (
          <RecommendationsCard
            key={c.id}
            priority={c.priority}
            title={c.title}
            budget={c.budget}
            stock={c.stock}
            transit={c.transit}
            description={c.description}
            offers={c.offers}
            image={c.image}
            included={includedIds.has(c.id)}
            onToggleIncluded={() => toggleIncluded(c.id)}
          />
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="flex flex-col gap-[10px] pb-[4px]">
        <p className="text-[12px] text-[#686576] leading-[1.43] tracking-[0.17px]" style={{ fontFamily: "'Roboto', sans-serif" }}>
          All offers subject to OEM availability and regional compliance. Budgets are based on March performance signals.
        </p>
        <p className="text-[12px] text-[#1f1d25] leading-[1.43] tracking-[0.17px]" style={{ fontFamily: "'Roboto', sans-serif" }}>
          Can I proceed and create these campaigns in your Planner?
        </p>
        {/* TASK 3 — dynamic count, disabled when 0 */}
        <button
          disabled={checkedCount === 0}
          className={cn(
            'w-full py-[11px] px-[16px] rounded-full text-[14px] tracking-[0.46px] transition-all duration-200',
            checkedCount > 0
              ? 'bg-[#473bab] hover:bg-[#392e8a] active:bg-[#2d2478] text-white cursor-pointer shadow-sm'
              : 'bg-[#473bab] opacity-40 text-white cursor-not-allowed',
          )}
          style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 500 }}
        >
          {ctaLabel}
        </button>
      </div>

      <FooterActions />
    </motion.div>
  );
}

// ─── AgentTopBar ──────────────────────────────────────────────────────────────
function AgentTopBar({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center h-[40px] shrink-0 relative pb-[8px]">
      <button aria-label="Back" className="p-[5px] rounded-full hover:bg-black/5 transition-colors cursor-pointer shrink-0">
        <div className="size-[20px] flex items-center justify-center"><svg className="w-[13px] h-[13px]" fill="none" viewBox="0 0 12.9854 12.6458"><path d={svgPaths.p111f7e00} fill="#111014" fillOpacity="0.56" /></svg></div>
      </button>
      <span className="ml-0.5 text-[16px] text-[#1f1d25] tracking-[0.15px] whitespace-nowrap shrink-0" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 500, lineHeight: '1.5' }}>AI Agent Auto</span>
      <button aria-label="Select agent" className="p-[5px] rounded-full hover:bg-black/5 transition-colors cursor-pointer shrink-0 ml-[2px]">
        <div className="size-[20px] flex items-center justify-center"><svg className="w-[8px] h-[5px]" fill="none" viewBox="0 0 8.16667 4.66074"><path d={svgPaths.p13692480} stroke="#111014" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.56" strokeWidth="1.5" /></svg></div>
      </button>
      <div className="absolute right-[-6px] top-0 flex items-center gap-[2px]">
        <button aria-label="Conversation history" className="flex items-center justify-center rounded-full w-[28px] h-[28px] hover:bg-black/5 transition-colors cursor-pointer">
          <svg className="w-[16px] h-[16px]" fill="none" viewBox="0 0 17 17">
            <path d={svgR.p961d680} stroke="#111014" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.56" strokeWidth="1.5" />
            <path d={svgPaths.p3737ca00} stroke="#111014" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.56" strokeWidth="1.5" />
          </svg>
        </button>
        <button aria-label="Fullscreen" className="flex items-center justify-center rounded-full w-[28px] h-[28px] hover:bg-black/5 transition-colors cursor-pointer">
          <svg className="w-[14px] h-[14px]" fill="none" viewBox="0 0 15.25 15.25"><path d={svgPaths.p26113500} stroke="#111014" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.56" strokeWidth="1.5" /></svg>
        </button>
        <button onClick={onClose} aria-label="Close agent pane" className="flex items-center justify-center rounded-full w-[28px] h-[28px] hover:bg-black/5 transition-colors cursor-pointer">
          <svg className="w-[9px] h-[9px]" fill="none" viewBox="0 0 8.58333 8.58333"><path d={svgPaths.p26bf1e80} stroke="#111014" strokeLinecap="round" strokeOpacity="0.56" strokeWidth="1.5" /></svg>
        </button>
      </div>
    </div>
  );
}

// ─── AgentPane ────────────────────────────────────────────────────────────────
interface AgentPaneProps { isOpen: boolean; onClose: () => void; }

// TASK 1 — "Nauman" → "Mallory" everywhere
const CATEGORIES = ['Reports', 'Find a Specific Vehicle', 'Competitive Inventory', 'Create', 'Favorites'];

export function AgentPane({ isOpen, onClose }: AgentPaneProps) {
  const [paneState, setPaneState]                 = useState<PaneState>('null');
  const [submittedPrompt, setSubmittedPrompt]     = useState('');
  const [submittedAttachment, setSubmittedAttachment] = useState<File | null>(null);

  useEffect(() => { if (!isOpen) { setTimeout(() => setPaneState('null'), 350); } }, [isOpen]);

  const handleSubmit = (text: string, attachment: File | null) => {
    setSubmittedPrompt(text); setSubmittedAttachment(attachment); setPaneState('loading');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div key="agent-pane"
          initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex-none h-full w-[400px] overflow-hidden bg-white rounded-2xl shadow-sm border border-[rgba(0,0,0,0.04)]"
          style={{ willChange: 'transform' }}>
          <div className="flex flex-col h-full pt-[12px] px-[16px]">
            <AgentTopBar onClose={onClose} />
            <div className="flex flex-1 flex-col min-h-0">
              <AnimatePresence mode="wait">

                {/* NULL STATE — TASK 1: "Mallory" */}
                {paneState === 'null' && (
                  <motion.div key="null" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} className="flex flex-col flex-1 min-h-0">
                    <div className="pt-[12px] shrink-0">
                      {/* TASK 1 — "Welcome, Mallory" */}
                      <p className="text-[20px] tracking-[0.15px] leading-[1.6] opacity-90 mb-[10px]"
                        style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 700, backgroundImage: 'linear-gradient(99.7748deg, rgb(71,59,171) 37.41%, rgb(172,171,255) 55.078%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                        Welcome, Mallory
                      </p>
                      <p className="text-[14px] text-[#1f1d25] tracking-[0.15px] leading-[1.5] opacity-90 mb-[10px]" style={{ fontFamily: "'Roboto', sans-serif" }}>
                        {`Hi, I'm your Auto Intelligence Agent currently focused on your store, how can I help you today?`}
                      </p>
                      <div className="flex items-center gap-[10px]">
                        <p className="text-[14px] text-[#1f1d25] tracking-[0.15px] leading-[1.5] opacity-90 whitespace-nowrap shrink-0" style={{ fontFamily: "'Roboto', sans-serif" }}>My current focus is</p>
                        <button className="flex items-center cursor-pointer">
                          <span className="text-[14px] tracking-[0.15px] leading-[1.5] opacity-90 whitespace-nowrap"
                            style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 700, backgroundImage: 'linear-gradient(90deg, #473bab, #acabff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            Jack Daniels Volkswagen
                          </span>
                          <div className="size-[24px] flex items-center justify-center ml-[-2px]">
                            <svg className="w-[9px] h-[5px]" fill="none" viewBox="0 0 9.5 5.29289"><path d={svgPaths.p14229000} stroke="#473BAB" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>
                          </div>
                        </button>
                      </div>
                    </div>
                    <div className="flex-1" />
                    <div className="flex flex-col items-center gap-[8px] pb-[16px] shrink-0">
                      <AgentInput onSubmit={handleSubmit} />
                      <div className="flex flex-wrap gap-[8px] items-center justify-center w-full">
                        {CATEGORIES.map(cat => <CategoryChip key={cat} label={cat} />)}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* LOADING STATE */}
                {paneState === 'loading' && (
                  <motion.div key="loading" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }} className="flex flex-col flex-1 min-h-0 pt-[12px]">
                    <div className="flex justify-end mb-[16px]">
                      <div className="ml-[40px] bg-[#fafaff] rounded-bl-[12px] rounded-tl-[12px] rounded-tr-[12px] px-[12px] py-[10px] relative">
                        <div aria-hidden="true" className="absolute inset-0 rounded-bl-[12px] rounded-tl-[12px] rounded-tr-[12px] border border-[rgba(99,86,225,0.5)] pointer-events-none" />
                        <p className="text-[12px] text-[#1f1d25] leading-[1.43] tracking-[0.17px]" style={{ fontFamily: "'Roboto', sans-serif" }}>
                          {submittedPrompt || 'Raise what I have in accrued funds…'}
                        </p>
                      </div>
                    </div>
                    <LoadingState onComplete={() => setPaneState('response')} />
                  </motion.div>
                )}

                {/* RESPONSE STATE */}
                {paneState === 'response' && (
                  <motion.div key="response" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.28 }} className="flex flex-col flex-1 min-h-0">
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-[2px]">
                      <div className="flex flex-col gap-[14px] pt-[8px] pb-[8px]">
                        <ResponseState prompt={submittedPrompt} attachment={submittedAttachment} />
                      </div>
                    </div>
                    <div className="shrink-0 pt-[8px] pb-[12px]">
                      <AgentInput onSubmit={handleSubmit} compact />
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
