import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { ScrollerAnnotations, AnnotationItem } from './ScrollerAnnotations';
import { InteractiveAnnotation } from './InteractiveAnnotation';
import { OnboardingBubble } from './OnboardingBubble';
import { PreviewControlsZoom } from './PreviewControlsZoom';
import { BeforeAfter } from './BeforeAfter';

import imgEnhanced from "figma:asset/f925b175d9f45ba629bdedc9c27563c3216090ba.png";
// Correct "Next Ad" image imported from the provided snippet
import imgNextAd from "figma:asset/dcd4a062f63eda60d1f2ae0b47f935693f998f44.png";

// SVG Paths
const ICONS = {
  folderUpload: {
    path: "M33.2491 43.6984H39.4833C41.7787 43.6984 43.6395 41.639 43.6395 39.0986V20.6993C43.6395 18.1588 41.7787 16.0994 39.4833 16.0994H26.049C25.3542 16.0994 24.7053 15.7151 24.3199 15.0753L22.0145 11.248C21.2437 9.96831 19.946 9.19967 18.5564 9.19967H10.3903C8.09498 9.19967 6.23421 11.2591 6.23421 13.7995V39.0986C6.23421 41.639 8.09498 43.6984 10.3903 43.6984H16.6246M24.9368 43.6984V29.8989M24.9368 29.8989L30.132 35.6487M24.9368 29.8989L19.7417 35.6487",
    viewBox: "0 0 50 56"
  }
};

type PreviewState = 'dropzone' | 'loading' | 'populated';

interface PreviewAreaProps {
  initialState?: PreviewState;
  onFilesAccepted?: (files: File[]) => void;
  onSubmit?: () => void;
}

// Mock Annotations
const MOCK_ANNOTATIONS: AnnotationItem[] = [
  {
    id: '1',
    number: 1,
    category: '3A',
    title: 'Background Colors',
    description: 'Must adhere to Primary & Secondary brand color palettes. The background must not include any design elements.',
    x: 20,
    y: 30
  },
  {
    id: '2',
    number: 2,
    category: '1D',
    title: 'Font Types',
    description: 'Volkswagen approved fonts must be used across all assets. VW Head Light, VW Head Regular, VW Head Bold.',
    x: 45,
    y: 15
  },
  {
    id: '3',
    number: 3,
    category: '3A',
    title: 'Logo Protection',
    description: 'The VW logo has a protected zone. Design elements or type must not intrude on this zone.',
    x: 70,
    y: 20
  },
  {
    id: '4',
    number: 4,
    category: '2D',
    title: 'Assets',
    description: 'Assets may not contain graphics.',
    x: 80,
    y: 65
  },
  {
    id: '5',
    number: 5,
    category: '2D',
    title: 'Protected Area',
    description: 'Logos must respect the protected area defined in the brand guidelines.',
    x: 50,
    y: 85
  }
];

// Next Ad Annotations (Simulated)
const NEXT_AD_ANNOTATIONS: AnnotationItem[] = [
    {
      id: '1',
      number: 1,
      category: '2D',
      title: 'Logo Placement',
      description: 'Logo must be placed in the top right corner.',
      x: 80,
      y: 10
    },
    {
      id: '2',
      number: 2,
      category: '1D',
      title: 'Typo Check',
      description: 'Ensure "Volkswagen" is spelled correctly.',
      x: 50,
      y: 50
    }
  ];

export function PreviewArea({ initialState = 'dropzone', onFilesAccepted, onSubmit }: PreviewAreaProps) {
  const [state, setState] = useState<PreviewState>(initialState);
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<AnnotationItem[]>(MOCK_ANNOTATIONS);
  
  // New States
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [adIndex, setAdIndex] = useState(1);
  
  // Fake loading simulation
  const handleDrop = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setState('loading');
      setTimeout(() => {
        setState('populated');
        setShowOnboarding(true); // Show onboarding bubble on populated
        onFilesAccepted?.(files);
      }, 1500);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop: handleDrop,
    accept: {
      'image/*': [],
      'application/pdf': []
    },
    maxSize: 10485760 // 10MB
  });

  const handleAcceptAutocorrect = () => {
      // Trigger submit flow if provided
      if (onSubmit) {
          onSubmit();
      }
      
      // Advance to next ad and close BeforeAfter (legacy behavior kept for safety)
      setAdIndex(prev => prev + 1);
      setShowBeforeAfter(false);
      setPreviewUrl(imgNextAd); 
      setAnnotations(NEXT_AD_ANNOTATIONS);
      setActiveAnnotationId(null);
  };

  return (
    <div className="relative h-full w-full bg-[#F0F2F4] rounded-[12px] overflow-hidden flex flex-col">
      <AnimatePresence mode="wait">
        
        {/* State: Dropzone */}
        {state === 'dropzone' && (
          <motion.div 
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-8"
          >
            <div 
              {...getRootProps()}
              className={cn(
                "relative flex flex-col items-center justify-center w-full max-w-[700px] h-[400px] cursor-pointer transition-all",
                isDragActive && "scale-105"
              )}
            >
              <input {...getInputProps()} />
              
              {/* Icon */}
              <div className="mb-6 text-[#473BAB]">
                <svg 
                  width="60" 
                  height="66" 
                  viewBox={ICONS.folderUpload.viewBox} 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d={ICONS.folderUpload.path} />
                </svg>
              </div>

              {/* Text */}
              <p className="text-[16px] font-medium text-[#1F1D25] text-center mb-2">
                Drop your images, fonts or videos <br/> here to start uploading
              </p>
              <p className="text-[11px] text-[#686576] text-center tracking-[0.4px] max-w-[400px] leading-relaxed">
                Supported formats: PNG, JPG, PSD, MP3, WOFF, TTF, TTL, <br/>
                MP4, PDF, ZIP, MOV. Maximum file size: 10MB.
              </p>
            </div>
          </motion.div>
        )}

        {/* State: Loading */}
        {state === 'loading' && (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center"
          >
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E0E0E0] border-t-[#473BAB]" />
          </motion.div>
        )}

        {/* State: Populated */}
        {state === 'populated' && (
          <motion.div 
            key="populated"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-1 h-full w-full p-4 gap-4 overflow-hidden relative"
          >
            {/* Left Sidebar: Annotations List */}
            <div className="w-[200px] flex-none flex flex-col h-full relative z-20">
               <ScrollerAnnotations 
                 annotations={annotations} 
                 activeId={activeAnnotationId}
                 onSelect={setActiveAnnotationId}
                 className="h-full"
               />
            </div>

            {/* Center Canvas */}
            <div className="flex-1 relative flex flex-col items-center justify-center bg-transparent rounded-lg z-0">
               
               {/* Image Container */}
               <div className="relative flex-1 w-full flex items-center justify-center overflow-visible">
                   <div className="relative max-h-full max-w-full shadow-lg overflow-visible">
                      <img 
                        src={previewUrl || "https://images.unsplash.com/photo-1563450217504-d5e70a902a40?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2b2xrc3dhZ2VuJTIwY2FyJTIwYWR2ZXJ0aXNlbWVudCUyMHBvc3RlcnxlbnwxfHx8fDE3NjkwODY5OTJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"} 
                        alt="Preview" 
                        className="max-h-full max-w-full object-contain block"
                      />

                      {/* Pins Overlay */}
                      <div className="absolute inset-0" style={{ overflow: 'visible' }} key={`pins-${adIndex}`}>
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
                   </div>
               </div>
               
               {/* Onboarding Bubble - Next to Scroller (Sidebar) */}
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

               {/* Zoom Control Bar */}
               <div className="w-full max-w-[600px] mt-4 mb-2 z-10">
                   <PreviewControlsZoom 
                        onAutocorrect={() => setShowBeforeAfter(true)}
                        onReset={() => {}}
                        onDelete={() => {}}
                        onZoomIn={() => {}}
                        onZoomOut={() => {}}
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
