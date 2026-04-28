'use client';

import { createPortal } from 'react-dom';
import { useRef, useState, useEffect, useCallback } from 'react';
import {
  X, Play, Pause, Volume2, VolumeX, SkipBack, SkipForward,
  AlertCircle, CheckSquare, Square, Trash2, Plus, Clock, Sparkles,
} from 'lucide-react';
import { WorkflowDocument } from '@/app/contexts/WorkflowContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VideoAnnotation {
  id: string;
  timestamp: number;
  xPct: number;   // % relative to the video frame (not container)
  yPct: number;
  cataCode: string;
  title: string;
  description: string;
  included: boolean;
}

interface VideoFrame {
  left: number;
  top: number;
  width: number;
  height: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const THUMB_COUNT = 16;

const CATA_CODES = [
  { code: 'CATA-01', title: 'Brand Compliance',         description: 'Brand guidelines not followed' },
  { code: 'CATA-02', title: 'Logo Misuse',              description: 'VW logo used incorrectly or in wrong context' },
  { code: 'CATA-03', title: 'Color Violation',          description: 'Brand palette not respected' },
  { code: 'CATA-04', title: 'Typography Non-Compliant', description: 'Wrong typeface or weight used' },
  { code: 'CATA-05', title: 'Disclaimer Missing',       description: 'Required pricing or offer disclaimer absent' },
  { code: 'CATA-06', title: 'Legal Text Missing',       description: 'Mandatory legal copy not present' },
  { code: 'CATA-07', title: 'Unauthorized Claims',      description: 'Superiority or unsubstantiated claim present' },
  { code: 'CATA-08', title: 'Competitive Reference',    description: 'Unauthorized competitor mention or comparison' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

// ─── useVideoThumbnails ───────────────────────────────────────────────────────
// Extracts THUMB_COUNT frames from a video blob URL using a hidden <video>
// element + canvas. Updates thumbs progressively as frames are captured.

function useVideoThumbnails(src: string | undefined, duration: number) {
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!src || !duration || duration <= 0) return;

    let cancelled = false;
    setLoading(true);
    setThumbs([]);

    const video = document.createElement('video');
    video.src = src;
    video.muted = true;
    video.preload = 'metadata';

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 72; // 16:9
    const ctx = canvas.getContext('2d');
    if (!ctx) { setLoading(false); return; }

    const captured: string[] = [];
    const timestamps = Array.from({ length: THUMB_COUNT }, (_, i) =>
      (i / THUMB_COUNT) * duration,
    );
    let idx = 0;

    const seekNext = () => {
      if (cancelled || idx >= timestamps.length) {
        if (!cancelled) { setThumbs([...captured]); setLoading(false); }
        video.src = '';
        return;
      }
      video.currentTime = timestamps[idx];
    };

    const onSeeked = () => {
      if (cancelled) return;
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        captured.push(canvas.toDataURL('image/jpeg', 0.5));
      } catch {
        captured.push('');
      }
      setThumbs([...captured]); // progressive
      idx++;
      setTimeout(seekNext, 40); // yield to browser
    };

    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', () => { if (!cancelled) setLoading(false); });
    video.addEventListener('loadedmetadata', seekNext, { once: true });

    return () => {
      cancelled = true;
      video.removeEventListener('seeked', onSeeked);
      video.src = '';
    };
  }, [src, duration]);

  return { thumbs, loading };
}

// ─── Filmstrip ────────────────────────────────────────────────────────────────

const FILMSTRIP_H = 52; // px

interface FilmstripProps {
  thumbs: string[];
  loading: boolean;
  duration: number;
  currentTime: number;
  annotations: VideoAnnotation[];
  onSeek: (t: number) => void;
  hoveredAnnId: string | null;
  onHoverAnn: (id: string | null) => void;
}

function Filmstrip({ thumbs, loading, duration, currentTime, annotations, onSeek, hoveredAnnId, onHoverAnn }: FilmstripProps) {

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    onSeek(((e.clientX - rect.left) / rect.width) * duration);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="relative select-none" style={{ height: FILMSTRIP_H }}>

      {/* ── Thumbnail strip ── */}
      <div
        className="flex h-full w-full overflow-hidden cursor-pointer rounded-sm"
        onClick={handleClick}
      >
        {loading && thumbs.length === 0
          /* Skeleton while capturing */
          ? Array.from({ length: THUMB_COUNT }).map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-white/8 animate-pulse border-r border-black/20"
                style={{ animationDelay: `${i * 60}ms` }}
              />
            ))
          : thumbs.length > 0
          /* Real frames */
          ? thumbs.map((url, i) => (
              <div key={i} className="flex-1 relative overflow-hidden border-r border-black/25 shrink-0">
                {url
                  ? <img src={url} alt="" className="w-full h-full object-cover" draggable={false} />
                  : <div className="w-full h-full bg-white/5" />
                }
              </div>
            ))
          /* Not started yet */
          : <div className="flex-1 bg-white/5" />
        }
      </div>

      {/* ── Annotation markers ── */}
      {annotations.map((ann, i) => {
        const pct = duration > 0 ? (ann.timestamp / duration) * 100 : 0;
        const isHov = hoveredAnnId === ann.id;
        return (
          <div
            key={ann.id}
            className="absolute top-0 h-full pointer-events-none"
            style={{ left: `${pct}%` }}
          >
            {/* Vertical rule */}
            <div className="absolute inset-y-0 w-px bg-[#EF5350]/70" />

            {/* Pin button */}
            <button
              className="absolute bottom-1 -translate-x-1/2 flex items-center justify-center rounded-full border-2 border-white shadow-md transition-all pointer-events-auto focus:outline-none"
              style={{
                width: 18, height: 18,
                background: isHov ? '#FF7043' : '#EF5350',
                transform: `translateX(-50%) scale(${isHov ? 1.35 : 1})`,
                zIndex: 10,
              }}
              onMouseEnter={() => onHoverAnn(ann.id)}
              onMouseLeave={() => onHoverAnn(null)}
              onClick={(e) => { e.stopPropagation(); onSeek(ann.timestamp); }}
            >
              <span className="text-white text-[7px] font-bold leading-none">{i + 1}</span>
            </button>

            {/* Hover bubble */}
            {isHov && (
              <div
                className="absolute z-20 pointer-events-none"
                style={{
                  bottom: FILMSTRIP_H - 4,
                  left: '50%',
                  transform: 'translateX(-50%)',
                }}
              >
                <div className="w-[160px] bg-[#1f1d25] rounded-xl px-3 py-2.5 shadow-2xl border border-white/10">
                  <p className="text-[10px] font-mono text-[#9C99A9]">{ann.cataCode}</p>
                  <p className="text-[12px] font-medium text-white leading-snug mt-0.5">{ann.title}</p>
                  <p className="text-[10px] text-[#9C99A9] mt-1.5 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {fmtTime(ann.timestamp)}
                  </p>
                  {/* Arrow */}
                  <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-1.5 overflow-hidden">
                    <div className="w-2.5 h-2.5 bg-[#1f1d25] border-r border-b border-white/10 rotate-45 translate-y-[-55%] translate-x-[1px]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* ── Playhead ── */}
      {duration > 0 && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none z-5"
          style={{ left: `${progress}%` }}
        >
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
        </div>
      )}

      {/* Filmstrip loading badge */}
      {loading && (
        <div className="absolute top-1 right-1 bg-black/60 px-2 py-0.5 rounded text-[9px] text-white/60 flex items-center gap-1 pointer-events-none">
          <div className="w-1.5 h-1.5 rounded-full bg-[#473BAB] animate-pulse" />
          Extracting frames…
        </div>
      )}
    </div>
  );
}

// ─── AnnotationCard ───────────────────────────────────────────────────────────

interface AnnotationCardProps {
  annotation: VideoAnnotation;
  index: number;
  isActive: boolean;
  onSeek: (t: number) => void;
  onToggleInclude: (id: string) => void;
  onDelete: (id: string) => void;
}

function AnnotationCard({ annotation, index, isActive, onSeek, onToggleInclude, onDelete }: AnnotationCardProps) {
  return (
    <div
      className={`rounded-xl border p-3 transition-colors cursor-pointer ${
        isActive
          ? 'border-[#473BAB] bg-[rgba(71,59,171,0.05)]'
          : 'border-[#E0E0E0] bg-white hover:border-[#C9C7D4]'
      }`}
      onClick={() => onSeek(annotation.timestamp)}
    >
      <div className="flex items-start gap-2.5">
        <div className="w-5 h-5 rounded-full bg-[#EF5350] flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-white text-[9px] font-bold leading-none">{index + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold text-[#686576] uppercase tracking-wide">{annotation.cataCode}</span>
          <p className="text-[13px] font-medium text-[#1f1d25] leading-snug mt-0.5">{annotation.title}</p>
          {annotation.description && (
            <p className="text-[12px] text-[#686576] mt-1 leading-relaxed">{annotation.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#F0F0F0]">
        <button
          onClick={(e) => { e.stopPropagation(); onSeek(annotation.timestamp); }}
          className="flex items-center gap-1 text-[11px] text-[#9C99A9] hover:text-[#473BAB] transition-colors"
        >
          <Clock className="w-3 h-3" />
          {fmtTime(annotation.timestamp)}
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleInclude(annotation.id); }}
            className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded transition-colors ${
              annotation.included
                ? 'text-[#473BAB] hover:bg-[rgba(71,59,171,0.08)]'
                : 'text-[#9C99A9] hover:bg-gray-100'
            }`}
          >
            {annotation.included ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
            <span>Include</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(annotation.id); }}
            className="p-1 rounded text-[#9C99A9] hover:text-[#D2323F] hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PinModal ─────────────────────────────────────────────────────────────────

interface PinModalProps {
  timestamp: number;
  onConfirm: (cataCode: string, title: string, description: string) => void;
  onCancel: () => void;
}

function PinModal({ timestamp, onConfirm, onCancel }: PinModalProps) {
  const [selectedCode, setSelectedCode] = useState(CATA_CODES[0].code);
  const [description, setDescription] = useState('');
  const selected = CATA_CODES.find(c => c.code === selectedCode)!;

  return (
    <div className="absolute inset-0 z-30 bg-black/60 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-[360px] p-5 mx-4">
        <div className="flex items-center gap-2 mb-1">
          <AlertCircle className="w-5 h-5 text-[#EF5350] shrink-0" />
          <h3 className="text-[15px] font-medium text-[#1f1d25]">Add Compliance Annotation</h3>
        </div>
        <p className="text-[12px] text-[#9C99A9] mb-4 ml-7">At <strong className="text-[#686576]">{fmtTime(timestamp)}</strong></p>

        <label className="block text-[12px] font-medium text-[#686576] mb-1.5">Violation Type</label>
        <select
          value={selectedCode}
          onChange={(e) => setSelectedCode(e.target.value)}
          className="w-full rounded-xl border border-[#E0E0E0] px-3 py-2 text-[13px] text-[#1f1d25] focus:outline-none focus:border-[#473BAB] mb-3 bg-white cursor-pointer"
        >
          {CATA_CODES.map(c => (
            <option key={c.code} value={c.code}>{c.code} — {c.title}</option>
          ))}
        </select>

        <label className="block text-[12px] font-medium text-[#686576] mb-1.5">
          Notes <span className="font-normal text-[#9C99A9]">(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={selected.description}
          rows={2}
          className="w-full rounded-xl border border-[#E0E0E0] px-3 py-2 text-[13px] text-[#1f1d25] placeholder:text-[#9C99A9] resize-none focus:outline-none focus:border-[#473BAB] transition-colors mb-4"
        />

        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-full text-[13px] font-medium text-[#686576] hover:bg-gray-100 transition-colors cursor-pointer">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selected.code, selected.title, description.trim() || selected.description)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#473BAB] text-white text-[13px] font-medium hover:bg-[#3c31a0] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Pin
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ProcessingOverlay ────────────────────────────────────────────────────────

interface ProcessingOverlayProps {
  onSkip: () => void;
}

function ProcessingOverlay({ onSkip }: ProcessingOverlayProps) {
  const [dot, setDot] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDot(d => (d + 1) % 4), 500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="absolute inset-0 z-20 bg-[#0a0a0a]/92 flex flex-col items-center justify-center gap-6 rounded-xl">
      {/* Animated icon */}
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-[#473BAB] animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-[#473BAB]" />
        </div>
      </div>

      {/* Text */}
      <div className="text-center">
        <p className="text-white text-[16px] font-medium">
          AI analyzing video{''.padEnd(dot, '.')}
        </p>
        <p className="text-white/45 text-[12px] mt-1.5 max-w-[260px] leading-relaxed">
          Scanning frames for brand compliance violations and CATA code matches
        </p>
      </div>

      {/* Skip */}
      <button
        onClick={onSkip}
        className="px-6 py-2 rounded-full border border-white/20 text-white/70 text-[13px] font-medium hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
      >
        Skip analysis
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface VideoAnnotationDrawerProps {
  doc: WorkflowDocument;
  onClose: () => void;
}

export function VideoAnnotationDrawer({ doc, onClose }: VideoAnnotationDrawerProps) {
  const videoRef        = useRef<HTMLVideoElement>(null);
  const containerRef    = useRef<HTMLDivElement>(null);  // the black video area

  // ── Video state ─────────────────────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted,   setIsMuted]   = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration,    setDuration]    = useState(0);

  // ── Video frame rect ─────────────────────────────────────────────────────
  // The actual rendered area of the video within containerRef (excluding letterbox).
  // Used for accurate pin placement and overlay positioning.
  const [videoFrame, setVideoFrame] = useState<VideoFrame | null>(null);

  const computeVideoFrame = useCallback(() => {
    const video     = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const scale = Math.min(cw / vw, ch / vh);
    const rw = vw * scale;
    const rh = vh * scale;
    setVideoFrame({ left: (cw - rw) / 2, top: (ch - rh) / 2, width: rw, height: rh });
  }, []);

  // Recompute on metadata load + window resize
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.addEventListener('loadedmetadata', computeVideoFrame);
    window.addEventListener('resize', computeVideoFrame);
    return () => {
      v.removeEventListener('loadedmetadata', computeVideoFrame);
      window.removeEventListener('resize', computeVideoFrame);
    };
  }, [computeVideoFrame]);

  // ── Filmstrip thumbnails ─────────────────────────────────────────────────
  const { thumbs, loading: thumbsLoading } = useVideoThumbnails(doc.url, duration);

  // ── Processing overlay ───────────────────────────────────────────────────
  const [processing, setProcessing] = useState(true);
  const processingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    processingTimerRef.current = setTimeout(() => setProcessing(false), 3000);
    return () => { if (processingTimerRef.current) clearTimeout(processingTimerRef.current); };
  }, []);

  const skipProcessing = () => {
    if (processingTimerRef.current) clearTimeout(processingTimerRef.current);
    setProcessing(false);
  };

  // ── Annotations ──────────────────────────────────────────────────────────
  const [annotations, setAnnotations] = useState<VideoAnnotation[]>([]);
  const [pendingPin,  setPendingPin]  = useState<{ xPct: number; yPct: number } | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [hoveredAnnId, setHoveredAnnId] = useState<string | null>(null);

  // Active = closest annotation within 1s of currentTime
  const activeAnnotation = annotations.reduce<VideoAnnotation | null>((best, ann) => {
    const dist = Math.abs(ann.timestamp - currentTime);
    if (dist > 1) return best;
    if (!best || dist < Math.abs(best.timestamp - currentTime)) return ann;
    return best;
  }, null);

  // ── Video controls ───────────────────────────────────────────────────────

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    isPlaying ? v.pause() : v.play();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  };

  const skip = (delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(duration, v.currentTime + delta));
  };

  const seekTo = useCallback((t: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(duration || Infinity, t));
  }, [duration]);

  // ── Click on video area → place pin ─────────────────────────────────────

  const handleVideoAreaClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (processing || showPinModal || !videoFrame) return;
    const container = containerRef.current;
    if (!container) return;

    const cr = container.getBoundingClientRect();
    const xInContainer = e.clientX - cr.left;
    const yInContainer = e.clientY - cr.top;

    // Reject clicks in the black letterbox areas
    if (
      xInContainer < videoFrame.left || xInContainer > videoFrame.left + videoFrame.width ||
      yInContainer < videoFrame.top  || yInContainer > videoFrame.top  + videoFrame.height
    ) return;

    videoRef.current?.pause();
    setPendingPin({
      xPct: ((xInContainer - videoFrame.left) / videoFrame.width) * 100,
      yPct: ((yInContainer - videoFrame.top)  / videoFrame.height) * 100,
    });
    setShowPinModal(true);
  }, [processing, showPinModal, videoFrame]);

  const handlePinConfirm = (cataCode: string, title: string, description: string) => {
    if (!pendingPin) return;
    const ann: VideoAnnotation = {
      id: uid(),
      timestamp: currentTime,
      xPct: pendingPin.xPct,
      yPct: pendingPin.yPct,
      cataCode, title, description,
      included: true,
    };
    setAnnotations(prev => [...prev, ann].sort((a, b) => a.timestamp - b.timestamp));
    setPendingPin(null);
    setShowPinModal(false);
  };

  const toggleInclude  = (id: string) => setAnnotations(prev => prev.map(a => a.id === id ? { ...a, included: !a.included } : a));
  const deleteAnnotation = (id: string) => setAnnotations(prev => prev.filter(a => a.id !== id));

  const includedCount     = annotations.filter(a => a.included).length;
  const sortedAnnotations = [...annotations].sort((a, b) => a.timestamp - b.timestamp);
  const progress          = duration > 0 ? (currentTime / duration) * 100 : 0;

  // ── Keyboard shortcuts ───────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showPinModal) return;
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') { e.preventDefault(); togglePlay(); }
      if (e.key === 'ArrowLeft')  skip(-5);
      if (e.key === 'ArrowRight') skip(5);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPinModal, isPlaying]);

  // ── Render ───────────────────────────────────────────────────────────────

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-stretch bg-black/80 backdrop-blur-sm">

      {/* ── Left panel ──────────────────────────────────────────────── */}
      <div className="w-[300px] shrink-0 bg-white flex flex-col border-r border-[#E0E0E0]">
        <div className="px-5 py-4 border-b border-[#E0E0E0] shrink-0">
          <h3 className="text-[14px] font-medium text-[#1f1d25]">Compliance Review</h3>
          <p className="text-[12px] text-[#9C99A9] mt-0.5 truncate">{doc.name}</p>
        </div>

        {annotations.length > 0 && (
          <div className="mx-3 mt-3 px-3 py-2 rounded-xl bg-[rgba(71,59,171,0.06)] border border-[rgba(71,59,171,0.15)] shrink-0">
            <p className="text-[12px] text-[#473BAB] font-medium">
              {annotations.length} annotation{annotations.length !== 1 ? 's' : ''} — {includedCount} in report
            </p>
          </div>
        )}

        {!processing && (
          <p className="text-[11px] text-[#9C99A9] leading-relaxed mx-3 mt-2 shrink-0">
            Pause the video and click on the frame to add a compliance pin.
          </p>
        )}

        {/* Cards */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3 space-y-2">
          {sortedAnnotations.length === 0
            ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <AlertCircle className="w-8 h-8 text-[#E0E0E0]" />
                <p className="text-[13px] text-[#9C99A9]">No annotations yet</p>
              </div>
            )
            : sortedAnnotations.map((ann, i) => (
              <AnnotationCard
                key={ann.id}
                annotation={ann}
                index={i}
                isActive={ann.id === activeAnnotation?.id}
                onSeek={seekTo}
                onToggleInclude={toggleInclude}
                onDelete={deleteAnnotation}
              />
            ))
          }
        </div>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-[#E0E0E0] shrink-0 space-y-2">
          {includedCount > 0 && (
            <button className="w-full px-4 py-2.5 rounded-xl bg-[#473BAB] text-white text-[13px] font-medium hover:bg-[#3c31a0] transition-colors cursor-pointer">
              Export Report ({includedCount})
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-xl border border-[#E0E0E0] text-[#686576] text-[13px] font-medium hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* ── Right side ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#1a1a1a] border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-7 h-8 bg-white/10 rounded flex items-center justify-center shrink-0">
              <span className="text-[8px] font-bold text-red-400 leading-tight">
                {doc.type.toUpperCase().slice(0, 4)}
              </span>
            </div>
            <p className="text-white/80 text-[13px] font-medium truncate">{doc.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-white/60 hover:text-white shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video canvas */}
        <div
          ref={containerRef}
          className="flex-1 min-h-0 bg-black relative"
          onClick={handleVideoAreaClick}
          style={{ cursor: processing || showPinModal ? 'default' : 'crosshair' }}
        >
          {/* The actual video element */}
          <video
            ref={videoRef}
            src={doc.url}
            className="absolute inset-0 w-full h-full object-contain"
            onTimeUpdate={() => { const v = videoRef.current; if (v) setCurrentTime(v.currentTime); }}
            onDurationChange={() => { const v = videoRef.current; if (v && v.duration) { setDuration(v.duration); computeVideoFrame(); } }}
            onLoadedMetadata={() => { const v = videoRef.current; if (v) { setDuration(v.duration || 0); computeVideoFrame(); } }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            // Prevent the click bubble from triggering the pin handler
            onClick={(e) => e.stopPropagation()}
          />

          {/* Pin overlay — positioned exactly over the video frame (no letterbox) */}
          {videoFrame && !processing && (
            <div
              className="absolute pointer-events-none"
              style={{
                left:   videoFrame.left,
                top:    videoFrame.top,
                width:  videoFrame.width,
                height: videoFrame.height,
              }}
            >
              {sortedAnnotations.map((ann, i) => (
                <button
                  key={ann.id}
                  className="absolute flex items-center justify-center rounded-full border-2 border-white shadow-lg transition-transform hover:scale-125 focus:outline-none pointer-events-auto"
                  style={{
                    left:       `${ann.xPct}%`,
                    top:        `${ann.yPct}%`,
                    width:      22,
                    height:     22,
                    background: ann.id === activeAnnotation?.id ? '#FF7043' : '#EF5350',
                    boxShadow:  '0 2px 8px rgba(0,0,0,0.6)',
                    transform:  'translate(-50%, -50%)',
                    zIndex:     10,
                  }}
                  onClick={(e) => { e.stopPropagation(); seekTo(ann.timestamp); }}
                  title={`${ann.cataCode}: ${ann.title} @ ${fmtTime(ann.timestamp)}`}
                >
                  <span className="text-white text-[9px] font-bold leading-none">{i + 1}</span>
                </button>
              ))}

              {/* Pending pin pulse */}
              {pendingPin && (
                <div
                  className="absolute rounded-full animate-ping pointer-events-none"
                  style={{
                    left:   `${pendingPin.xPct}%`,
                    top:    `${pendingPin.yPct}%`,
                    width:  22, height: 22,
                    background: 'rgba(239,83,80,0.5)',
                    border: '2px solid #EF5350',
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              )}
            </div>
          )}

          {/* Processing overlay */}
          {processing && <ProcessingOverlay onSkip={skipProcessing} />}

          {/* Pin modal */}
          {showPinModal && (
            <PinModal
              timestamp={currentTime}
              onConfirm={handlePinConfirm}
              onCancel={() => { setPendingPin(null); setShowPinModal(false); }}
            />
          )}
        </div>

        {/* ── Controls + Filmstrip ──────────────────────────────────── */}
        <div className="bg-[#1a1a1a] border-t border-white/10 px-5 pt-3 pb-3 shrink-0">

          {/* Playback controls */}
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => skip(-5)} className="p-1.5 text-white/50 hover:text-white transition-colors cursor-pointer" title="Back 5s">
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:bg-white/90 transition-colors cursor-pointer shrink-0"
            >
              {isPlaying
                ? <Pause className="w-4 h-4 text-[#1a1a1a]" />
                : <Play  className="w-4 h-4 text-[#1a1a1a] ml-0.5" />
              }
            </button>

            <button onClick={() => skip(5)} className="p-1.5 text-white/50 hover:text-white transition-colors cursor-pointer" title="Forward 5s">
              <SkipForward className="w-4 h-4" />
            </button>

            <span className="text-white/60 text-[12px] font-mono ml-1 select-none">
              {fmtTime(currentTime)} / {fmtTime(duration)}
            </span>

            <div className="flex-1" />

            {annotations.length > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-[#EF5350] text-white text-[11px] font-medium">
                {annotations.length} pin{annotations.length !== 1 ? 's' : ''}
              </span>
            )}

            <button onClick={toggleMute} className="p-1.5 text-white/50 hover:text-white transition-colors cursor-pointer">
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Filmstrip */}
          <Filmstrip
            thumbs={thumbs}
            loading={thumbsLoading}
            duration={duration}
            currentTime={currentTime}
            annotations={sortedAnnotations}
            onSeek={seekTo}
            hoveredAnnId={hoveredAnnId}
            onHoverAnn={setHoveredAnnId}
          />

          {/* Keyboard hint */}
          <p className="text-[10px] text-white/20 mt-1.5 select-none text-right">
            Space · play/pause &nbsp;·&nbsp; ← → · skip 5s &nbsp;·&nbsp; Esc · close
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
