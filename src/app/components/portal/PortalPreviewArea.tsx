import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, LayoutGrid, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollerAnnotations, AnnotationItem } from '../pre-approval/ScrollerAnnotations';
import { InteractiveAnnotation } from '../pre-approval/InteractiveAnnotation';
import { OnboardingBubble } from '../pre-approval/OnboardingBubble';
import { PreviewControlsZoom } from '../pre-approval/PreviewControlsZoom';
import { BeforeAfter } from '../pre-approval/BeforeAfter';

type ViewMode = 'single' | 'grid';

const MOCK_ANNOTATIONS: AnnotationItem[] = [
  { id: '1', number: 1, category: '3A', title: 'Background Colors',  description: 'Must adhere to Primary & Secondary brand color palettes.',                           x: 20, y: 30 },
  { id: '2', number: 2, category: '1D', title: 'Font Types',         description: 'Volkswagen approved fonts must be used across all assets.',                          x: 45, y: 15 },
  { id: '3', number: 3, category: '3A', title: 'Legal Disclaimer',   description: 'Add appropriate legal disclaimer as defined by policy.',                             x: 30, y: 70 },
  { id: '4', number: 4, category: '2D', title: 'No Graphics',        description: 'Assets may not contain graphics.',                                                   x: 80, y: 80 },
  { id: '5', number: 5, category: '2D', title: 'Logo Placement',     description: 'Logos must respect the protected area defined in the brand guidelines.',             x: 10, y: 10 },
];

export function PortalPreviewArea({ assets }: { assets: string[] }) {
  const [viewMode, setViewMode]       = useState<ViewMode>('single');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [baIndex, setBaIndex]         = useState(0);
  const [acceptedIndices, setAcceptedIndices] = useState<Set<number>>(new Set());
  const [zoom, setZoom]               = useState(1);

  // All portal assets converted to the same shape PreviewArea uses internally
  const files = assets.map(url => ({ url, annotations: MOCK_ANNOTATIONS }));

  const currentFile        = files[currentIndex] ?? files[0];
  const isCurrentAccepted  = acceptedIndices.has(currentIndex);
  const annotations        = isCurrentAccepted ? [] : MOCK_ANNOTATIONS;
  const canGoPrev          = currentIndex > 0;
  const canGoNext          = currentIndex < files.length - 1;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleOpenAutocorrect = () => {
    setBaIndex(currentIndex);
    setShowOnboarding(false);
    setShowBeforeAfter(true);
  };

  const handleBANext = () => {
    setAcceptedIndices(prev => new Set(prev).add(baIndex));
    setBaIndex(i => i + 1);
  };

  const handleAcceptAutocorrect = () => {
    setAcceptedIndices(prev => new Set(prev).add(baIndex));
    setCurrentIndex(baIndex);
    setShowBeforeAfter(false);
    setActiveAnnotationId(null);
  };

  const handleZoomIn  = () => setZoom(z => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.5));
  const handleReset   = () => setZoom(1);

  return (
    <div className="relative h-full w-full bg-[#F0F2F4] overflow-hidden flex flex-col p-4">
      <div className="flex flex-1 h-full w-full gap-4 overflow-hidden relative">

        {/* Left Sidebar: annotations — single view only */}
        {viewMode === 'single' && (
          <div className="w-[200px] flex-none flex flex-col h-full relative z-20">
            <ScrollerAnnotations
              annotations={annotations}
              activeId={activeAnnotationId}
              onSelect={setActiveAnnotationId}
              className="h-full"
            />
          </div>
        )}

        {/* Center Canvas */}
        <div className="flex-1 relative flex flex-col items-center bg-transparent rounded-lg z-0 overflow-hidden">

          {/* Top bar: counter + Grid/Single toggle */}
          <div className="w-full flex items-center justify-between mb-2 shrink-0 px-1">
            <span className="text-[11px] text-[#686576]">
              {files.length > 1 ? `${currentIndex + 1} / ${files.length}` : ''}
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
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    onClick={() => { setCurrentIndex(idx); setViewMode('single'); }}
                    className={cn(
                      'relative aspect-[4/3] rounded-lg overflow-hidden cursor-pointer border-2 transition-all group',
                      currentIndex === idx
                        ? 'border-[#473BAB] shadow-md'
                        : 'border-transparent hover:border-[#473BAB]/40',
                    )}
                  >
                    <img
                      src={file.url}
                      alt={`Asset ${idx + 1}`}
                      className="w-full h-full object-contain bg-white"
                    />
                    {/* Annotation count badge */}
                    {!acceptedIndices.has(idx) && file.annotations.length > 0 && (
                      <div className="absolute top-2 right-2 bg-[#D2323F] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {file.annotations.length}
                      </div>
                    )}
                    {/* Index badge */}
                    <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] font-bold rounded px-1.5 py-0.5">
                      {idx + 1}
                    </div>
                  </div>
                ))}
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

              {/* Image + annotation pins */}
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
                    onAutocorrect={handleOpenAutocorrect}
                    className="absolute left-0 top-16 z-[1005]"
                  />
                )}
              </AnimatePresence>
            </>
          )}

          {/* Toolbar — always visible at the bottom */}
          <div className="w-full max-w-[600px] mt-2 mb-1 shrink-0 z-10">
            <PreviewControlsZoom
              onAutocorrect={handleOpenAutocorrect}
              onReset={handleReset}
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
                image={files[baIndex]?.url ?? ''}
                annotations={acceptedIndices.has(baIndex) ? [] : MOCK_ANNOTATIONS}
                currentIndex={baIndex}
                totalCount={files.length}
                hasPrevious={baIndex > 0}
                hasNext={baIndex < files.length - 1}
                onNext={handleBANext}
                onPrev={() => setBaIndex(i => Math.max(0, i - 1))}
                onAccept={handleAcceptAutocorrect}
                onCancel={() => setShowBeforeAfter(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
