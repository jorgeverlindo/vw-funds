import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2 } from 'lucide-react';
import { DrawerOEMMainPane, OEM_ANNOTATIONS } from './DrawerOEMMainPane';
import { DrawerOEMSidePanel } from './DrawerOEMSidePanel';
import { Snackbar } from './Snackbar';

interface DrawerOEMProps {
  open: boolean;
  onClose: () => void;
}

const INTRO_SENTENCE = "Please address the following feedback:";

export function DrawerOEM({ open, onClose }: DrawerOEMProps) {
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [comment, setComment] = useState("");
  
  // Helper to generate comment text from ids
  const generateComment = (ids: Set<string>) => {
    if (ids.size === 0) return "";
    
    // Maintain insertion order consistent with the scroller order (which matches OEM_ANNOTATIONS order)
    const activeAnnotations = OEM_ANNOTATIONS.filter(ann => ids.has(ann.id));
    
    const textList = activeAnnotations.map(ann => {
      // Exclude numbering/rule labels (e.g. "1", "3A", "2D")
      // The content in OEM_ANNOTATIONS already has title/desc separated from category/number.
      // We just need to join Title and Description.
      const parts = [ann.title, ann.description].filter(Boolean);
      return parts.join("\n");
    });
    
    return `${INTRO_SENTENCE}\n\n${textList.join("\n\n")}`;
  };

  const handleToggleCheck = (id: string, checked: boolean) => {
    const next = new Set(checkedIds);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    setCheckedIds(next);
    setComment(generateComment(next));
  };

  const handleIncludeAll = () => {
    const allIds = new Set(OEM_ANNOTATIONS.map(a => a.id));
    setCheckedIds(allIds);
    setComment(generateComment(allIds));
  };

  const handleSend = () => {
    // Show snackbar and close
    // Annex 5 behavior: success message
    setShowSnackbar(true);
    
    // Close drawer immediately with dissolve (handled by AnimatePresence exit)
    setTimeout(() => {
       onClose();
    }, 500); // Wait for animation? Or close immediately? "The drawer must close using a dissolve animation."
    
    // Auto dismiss snackbar
    setTimeout(() => {
      setShowSnackbar(false);
    }, 3000);
  };

  // Reset state when opening/closing
  useEffect(() => {
    if (open) {
      setCheckedIds(new Set());
      setComment("");
    }
  }, [open]);

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
              onClick={onClose}
              className="absolute inset-0 bg-[#111014]/60 backdrop-blur-sm"
            />

            {/* Dialog Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "tween", duration: 0.2 }}
              className="relative flex w-[95vw] h-[90vh] bg-white rounded-[16px] shadow-2xl overflow-hidden"
            >
               {/* We don't need a top header here because DrawerOEMSidePanel has its own header and MainPane is full height */}
               {/* But wait, the SidePanel header has the 'X' to close. */}
               {/* The design shows Main Pane (Left) and Side Panel (Right) taking up the full space. */}
               {/* And "Drawer Title" in the top left? Annex 2 shows "{Drawer Title}"... */}
               {/* Actually Annex 2 shows a header bar across the top? No, "Review Pre-approval request" is on the right panel. */}
               {/* Left panel seems to be just the canvas. */}
               {/* I'll stick to split view. */}

              <div className="flex-1 min-w-0 bg-[#F0F2F4] p-4">
                 <DrawerOEMMainPane 
                   checkedIds={checkedIds} 
                   onToggleCheck={handleToggleCheck} 
                   onIncludeAll={handleIncludeAll}
                 />
              </div>

              {/* Right Panel */}
              <div className="w-[400px] flex-none border-l border-[rgba(0,0,0,0.08)] bg-white h-full">
                 <DrawerOEMSidePanel 
                   onClose={onClose} 
                   onSend={handleSend} 
                   comment={comment}
                   onCommentChange={setComment}
                 />
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <Snackbar 
        open={showSnackbar} 
        onClose={() => setShowSnackbar(false)} 
        message="Review submitted successfully" // Annex 5 likely text
        className="left-6 translate-x-0 bottom-6"
      />
    </>,
    document.body
  );
}
