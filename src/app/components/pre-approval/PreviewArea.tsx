import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, LayoutGrid, Maximize2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollerAnnotations, AnnotationItem } from './ScrollerAnnotations';
import { InteractiveAnnotation } from './InteractiveAnnotation';
import { OnboardingBubble } from './OnboardingBubble';
import { PreviewControlsZoom } from './PreviewControlsZoom';
import { BeforeAfter } from './BeforeAfter';

import imgEnhanced from "figma:asset/f925b175d9f45ba629bdedc9c27563c3216090ba.png";
import imgNextAd from "figma:asset/dcd4a062f63eda60d1f2ae0b47f935693f998f44.png";

// SVG Paths
const ICONS = {
  folderUpload: {
    path: "M33.2491 43.6984H39.4833C41.7787 43.6984 43.6395 41.639 43.6395 39.0986V20.6993C43.6395 18.1588 41.7787 16.0994 39.4833 16.0994H26.049C25.3542 16.0994 24.7053 15.7151 24.3199 15.0753L22.0145 11.248C21.2437 9.96831 19.946 9.19967 18.5564 9.19967H10.3903C8.09498 9.19967 6.23421 11.2591 6.23421 13.7995V39.0986C6.23421 41.639 8.09498 43.6984 10.3903 43.6984H16.6246M24.9368 43.6984V29.8989M24.9368 29.8989L30.132 35.6487M24.9368 29.8989L19.7417 35.6487",
    viewBox: "0 0 50 56"
  }
};

type PreviewState = 'dropzone' | 'loading' | 'populated';
type ViewMode = 'single' | 'grid';

interface PreviewAreaProps {
  initialState?: PreviewState;
  onFilesAccepted?: (files: File[]) => void;
  onSubmit?: () => void;
}

// Mock Annotations
const MOCK_ANNOTATIONS: AnnotationItem[] = [
  { id: '1', number: 1, category: '3A', title: 'Background Colors', description: 'Must adhere to Primary & Secondary brand color palettes. The background must not include any design elements.', x: 20, y: 30 },
  { id: '2', number: 2, category: '1D', title: 'Font Types', description: 'Volkswagen approved fonts must be used across all assets. VW Head Light, VW Head Regular, VW Head Bold.', x: 45, y: 15 },
  { id: '3', number: 3, category: '3A', title: 'Logo Protection', description: 'The VW logo has a protected zone. Design elements or type must not intrude on this zone.', x: 70, y: 20 },
  { id: '4', number: 4, category: '2D', title: 'Assets', description: 'Assets may not contain graphics.', x: 80, y: 65 },
  { id: '5', number: 5, category: '2D', title: 'Protected Area', description: 'Logos must respect the protected area defined in the brand guidelines.', x: 50, y: 85 },
];

const NEXT_AD_ANNOTATIONS: AnnotationItem[] = [
  { id: '1', number: 1, category: '2D', title: 'Logo Placement', description: 'Logo must be placed in the top right corner.', x: 80, y: 10 },
  { id: '2', number: 2, category: '1D', title: 'Typo Check', description: 'Ensure "Volkswagen" is spelled correctly.', x: 50, y: 50 },
];

// Demo files for the initial "already uploaded" experience
const DEMO_FILES = [
  { url: imgEnhanced, annotations: MOCK_ANNOTATIONS },
  { url: imgNextAd,   annotations: NEXT_AD_ANNOTATIONS },
];

export function PreviewArea({ initialState = 'dropzone', onFilesAccepted, onSubmit }: PreviewAreaProps) {
  const [state, setState] = useState<PreviewState>(initialState);
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);

  // Multi-file: store uploaded blob URLs + per-file annotation overrides
  const [uploadedFiles, setUploadedFiles] = useState<{ url: string; annotations: AnnotationItem[] }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Zoom state
  const [zoom, setZoom] = useState(1);

  // Legacy states
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);

  // ── Derived ───────────────────────────────────────────────────────────────
  // Merge demo files with uploaded files so there's always content in populated state
  const allFiles = state === 'populated'
    ? [...DEMO_FILES, ...uploadedFiles]
    : uploadedFiles;

  const currentFile = allFiles[currentIndex] ?? allFiles[0];
  const annotations = currentFile?.annotations ?? MOCK_ANNOTATIONS;
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < allFiles.length - 1;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleDrop = (files: File[]) => {
    if (files.length === 0) return;
    const newEntries = files.map(f => ({ url: URL.createObjectURL(f), annotations: MOCK_ANNOTATIONS }));
    setUploadedFiles(prev => [...prev, ...newEntries]);
    setState('loading');
    setTimeout(() => {
      setState('populated');
      setShowOnboarding(true);
      // Navigate to the first newly added file
      setCurrentIndex(DEMO_FILES.length + uploadedFiles.length);
    }, 1500);
    onFilesAccepted?.(files);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: { 'image/*': [], 'application/pdf': [] },
    maxSize: 10485760,
  });

  const handleDelete = () => {
    // Only allow deleting user-uploaded files (not demo files)
    const uploadedIdx = currentIndex - DEMO_FILES.length;
    if (uploadedIdx < 0) return; // demo files are not deletable
    const next = [...uploadedFiles];
    next.splice(uploadedIdx, 1);
    setUploadedFiles(next);
    setCurrentIndex(Math.max(0, currentIndex - 1));
    if (next.length === 0 && DEMO_FILES.length === 0) setState('dropzone');
  };

  const handleZoomIn  = () => setZoom(z => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.5));
  const handleReset   = () => setZoom(1);

  const handleAcceptAutocorrect = () => {
    onSubmit?.();
    setShowBeforeAfter(false);
    if (canGoNext) {
      setCurrentIndex(i => i + 1);
    }
    setActiveAnnotationId(null);
  };

  const isUserFile = currentIndex >= DEMO_FILES.length;

  return (
    <div className="relative h-full w-full bg-[#F0F2F4] rounded-[12px] overflow-hidden flex flex-col">
      <AnimatePresence mode="wait">

        {/* ── Dropzone ── */}
        {state === 'dropzone' && (
          <motion.div key="dropzone" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center p-8">
            <div
              {...getRootProps()}
              className={cn("relative flex flex-col items-center justify-center w-full max-w-[700px] h-[400px] cursor-pointer transition-all", isDragActive && "scale-105")}
            >
              <input {...getInputProps()} />
              <div className="mb-6 text-[#473BAB]">
                <svg width="60" height="66" viewBox={ICONS.folderUpload.viewBox} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={ICONS.folderUpload.path} />
                </svg>
              </div>
              <p className="text-[16px] font-medium text-[#1F1D25] text-center mb-2">Drop your images, fonts or videos <br/> here to start uploading</p>
              <p className="text-[11px] text-[#686576] text-center tracking-[0.4px] max-w-[400px] leading-relaxed">Supported formats: PNG, JPG, PSD, MP3, WOFF, TTF, TTL, <br/> MP4, PDF, ZIP, MOV. Maximum file size: 10MB.</p>
            </div>
          </motion.div>
        )}

        {/* ── Loading ── */}
        {state === 'loading' && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E0E0E0] border-t-[#473BAB]" />
          </motion.div>
        )}

        {/* ── Populated ── */}
        {state === 'populated' && (
          <motion.div key="populated" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-1 h-full w-full p-4 gap-4 overflow-hidden relative">

            {/* Left Sidebar: Annotations */}
            {viewMode === 'single' && (
              <div className="w-[200px] flex-none flex flex-col h-full relative z-20">
                <ScrollerAnnotations annotations={annotations} activeId={activeAnnotationId} onSelect={setActiveAnnotationId} className="h-full" />
              </div>
            )}

            {/* Center Canvas */}
            <div className="flex-1 relative flex flex-col items-center bg-transparent rounded-lg z-0 overflow-hidden">

              {/* ── View mode toggle + file counter ── */}
              <div className="w-full flex items-center justify-between mb-2 shrink-0 px-1">
                <span className="text-[11px] text-[#686576]">
                  {allFiles.length > 1 ? `${currentIndex + 1} / ${allFiles.length}` : ''}
                </span>
                <button
                  onClick={() => setViewMode(v => v === 'single' ? 'grid' : 'single')}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium text-[#473BAB] border border-[rgba(71,59,171,0.3)] hover:bg-[#473BAB]/8 transition-colors cursor-pointer"
                >
                  {viewMode === 'single' ? <LayoutGrid size={13} /> : <Maximize2 size={13} />}
                  {viewMode === 'single' ? 'Grid' : 'Single'}
                </button>
              </div>

              {/* ── GRID VIEW ── */}
              {viewMode === 'grid' && (
                <div className="flex-1 min-h-0 w-full overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-2 gap-3 p-1 pb-4">
                    {allFiles.map((file, idx) => (
                      <div
                        key={idx}
                        onClick={() => { setCurrentIndex(idx); setViewMode('single'); }}
                        className={cn(
                          "relative aspect-[4/3] rounded-lg overflow-hidden cursor-pointer border-2 transition-all group",
                          currentIndex === idx ? "border-[#473BAB] shadow-md" : "border-transparent hover:border-[#473BAB]/40"
                        )}
                      >
                        <img src={file.url} alt={`Asset ${idx + 1}`} className="w-full h-full object-contain bg-white" />
                        {/* Annotation count badge */}
                        {file.annotations.length > 0 && (
                          <div className="absolute top-2 right-2 bg-[#D2323F] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {file.annotations.length}
                          </div>
                        )}
                        {/* Index badge */}
                        <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] font-bold rounded px-1.5 py-0.5">
                          {idx + 1}
                        </div>
                        {/* Delete overlay for user-uploaded files */}
                        {idx >= DEMO_FILES.length && (
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const uIdx = idx - DEMO_FILES.length;
                                const next = [...uploadedFiles];
                                next.splice(uIdx, 1);
                                setUploadedFiles(next);
                                if (currentIndex >= allFiles.length - 1) setCurrentIndex(Math.max(0, currentIndex - 1));
                              }}
                              className="p-1.5 bg-white rounded-full text-[#686576] hover:text-[#D2323F] shadow transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {/* Add more tile */}
                    <div
                      {...getRootProps()}
                      className={cn(
                        "aspect-[4/3] rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all",
                        isDragActive ? "border-[#473BAB] bg-[#f0eeff]" : "border-[rgba(0,0,0,0.15)] bg-white/50 hover:border-[#473BAB]/50"
                      )}
                    >
                      <input {...getInputProps()} />
                      <span className="text-[22px] text-[#473BAB]/60 mb-1">+</span>
                      <span className="text-[11px] text-[#686576]">Add more</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── SINGLE VIEW ── */}
              {viewMode === 'single' && (
                <>
                  {/* Nav arrows */}
                  {canGoPrev && (
                    <button
                      onClick={() => { setCurrentIndex(i => i - 1); setActiveAnnotationId(null); setZoom(1); }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-30 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5 text-[#686576]" />
                    </button>
                  )}
                  {canGoNext && (
                    <button
                      onClick={() => { setCurrentIndex(i => i + 1); setActiveAnnotationId(null); setZoom(1); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-30 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5 text-[#686576]" />
                    </button>
                  )}

                  {/* Image Container */}
                  <div className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden">
                    <motion.div
                      className="relative shadow-lg overflow-visible"
                      style={{ scale: zoom }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                      <img
                        src={currentFile?.url ?? ''}
                        alt="Preview"
                        className="max-h-[calc(100vh-320px)] max-w-full object-contain block"
                      />
                      {/* Annotation pins */}
                      <div className="absolute inset-0" style={{ overflow: 'visible' }}>
                        {annotations.map((ann, index) => (
                          <InteractiveAnnotation
                            key={ann.id}
                            {...ann}
                            isOpen={activeAnnotationId === ann.id}
                            onToggle={() => setActiveAnnotationId(activeAnnotationId === ann.id ? null : ann.id)}
                            delay={index * 0.15}
                            direction="bottom-right"
                          />
                        ))}
                      </div>
                    </motion.div>
                  </div>

                  {/* Onboarding Bubble */}
                  <AnimatePresence>
                    {showOnboarding && (
                      <OnboardingBubble
                        isVisible={true}
                        onSkip={() => setShowOnboarding(false)}
                        onAutocorrect={() => setShowBeforeAfter(true)}
                        className="absolute left-0 top-16 z-[1005]"
                      />
                    )}
                  </AnimatePresence>
                </>
              )}

              {/* Toolbar — always visible at the bottom */}
              <div className="w-full max-w-[600px] mt-2 mb-1 shrink-0 z-10">
                <PreviewControlsZoom
                  onAutocorrect={() => setShowBeforeAfter(true)}
                  onReset={handleReset}
                  onDelete={isUserFile ? handleDelete : undefined}
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                />
              </div>
            </div>

            {/* BeforeAfter Full Screen Overlay */}
            <AnimatePresence>
              {showBeforeAfter && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute inset-0 z-[3000] rounded-[12px] overflow-hidden"
                >
                  <BeforeAfter
                    isVisible={true}
                    onAccept={handleAcceptAutocorrect}
                    onCancel={() => setShowBeforeAfter(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
