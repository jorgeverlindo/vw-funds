import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2 } from 'lucide-react';
import { PortalPreviewArea } from './PortalPreviewArea';
import { PreApprovalForm } from '../pre-approval/PreApprovalForm';
import { Snackbar } from '../pre-approval/Snackbar';

interface PortalPreApprovalDrawerProps {
  open: boolean;
  onClose: () => void;
  assets: string[];
}

export function PortalPreApprovalDrawer({ open, onClose, assets }: PortalPreApprovalDrawerProps) {
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && !isSubmitting && !isSubmitted) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, isSubmitting, isSubmitted]);

  const handleSubmit = (data: any) => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setShowSnackbar(true);
      
      // Auto dismiss snackbar and close drawer after delay
      setTimeout(() => {
        setShowSnackbar(false);
        onClose();
        // Reset state
        setTimeout(() => setIsSubmitted(false), 500);
      }, 3000);
    }, 1500);
  };

  if (!open) return null;

  return createPortal(
    <>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center isolate">
            {/* Scrim */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={!isSubmitting ? onClose : undefined}
              className="absolute inset-0 bg-[#111014]/60 backdrop-blur-sm cursor-pointer"
            />

            {/* Dialog Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
              className="relative flex flex-col w-[95vw] h-[90vh] bg-white rounded-[16px] shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex-none flex items-center justify-between px-6 py-4 border-b border-[rgba(0,0,0,0.08)] bg-white z-20">
                <div className="flex items-center gap-3">
                  <h2 className="text-[18px] font-semibold text-[#1F1D25] tracking-tight">Pre-approval Request</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-black/5 text-[#111014]/56 transition-colors cursor-pointer"
                  disabled={isSubmitting}
                >
                  <X size={24} strokeWidth={1.5} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 flex min-h-0 relative">
                {/* Left Pane: Portal Preview Area */}
                <div className="flex-1 bg-[#f0f2f4] min-w-0 overflow-hidden">
                  <PortalPreviewArea assets={assets} />
                </div>

                {/* Divider */}
                <div className="w-[1px] bg-[rgba(0,0,0,0.08)] my-4 relative z-10" />

                {/* Right Pane: Form */}
                <div className="w-[380px] flex-none h-full overflow-hidden bg-[#F9FAFA]">
                  <PreApprovalForm onClose={onClose} onDone={handleSubmit} />
                </div>

                {/* Submitting/Success Overlay */}
                <AnimatePresence>
                  {(isSubmitting || isSubmitted) && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center"
                    >
                      {isSubmitting ? (
                        <div className="flex flex-col items-center gap-4">
                           <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#E0E0E0] border-t-[#473BAB]" />
                           <p className="text-[16px] font-medium text-[#1F1D25]">Submitting request...</p>
                        </div>
                      ) : (
                        <motion.div 
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className="flex flex-col items-center gap-4 text-center px-8"
                        >
                           <div className="h-16 w-16 bg-[#473BAB] rounded-full flex items-center justify-center text-white shadow-lg">
                              <CheckCircle2 size={32} />
                           </div>
                           <div>
                             <h3 className="text-[20px] font-semibold text-[#1F1D25] mb-2">Request Submitted!</h3>
                             <p className="text-[14px] text-[#686576] max-w-[280px]">
                               Your pre-approval request has been successfully created and is being reviewed.
                             </p>
                           </div>
                           <button 
                             onClick={onClose}
                             className="mt-4 px-8 py-2.5 bg-[#473BAB] text-white rounded-full text-sm font-medium hover:bg-[#3D3295] transition-colors cursor-pointer"
                           >
                             Done
                           </button>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <Snackbar 
        open={showSnackbar} 
        onClose={() => setShowSnackbar(false)} 
        message="Pre-approval request created successfully"
      />
    </>,
    document.body
  );
}
