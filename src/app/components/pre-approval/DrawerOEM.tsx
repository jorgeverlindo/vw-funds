import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { DrawerOEMMainPane, OEM_ANNOTATIONS } from './DrawerOEMMainPane';
import { DrawerOEMSidePanel } from './DrawerOEMSidePanel';
import type { PreApproval } from '@/app/components/FundsPreApprovalsContent';

interface DrawerOEMProps {
  open: boolean;
  onClose: () => void;
  preApproval?: PreApproval;
  onApprove?: (comment: string) => void;
  onRequestRevision?: (comment: string) => void;
}

const INTRO_SENTENCE = "Please address the following feedback:";
const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']);

export function DrawerOEM({ open, onClose, preApproval, onApprove, onRequestRevision }: DrawerOEMProps) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [comment, setComment] = useState("");

  const generateComment = (ids: Set<string>) => {
    if (ids.size === 0) return "";
    const activeAnnotations = OEM_ANNOTATIONS.filter(ann => ids.has(ann.id));
    const textList = activeAnnotations.map(ann => {
      const parts = [ann.title, ann.description].filter(Boolean);
      return parts.join("\n");
    });
    return `${INTRO_SENTENCE}\n\n${textList.join("\n\n")}`;
  };

  const handleToggleCheck = (id: string, checked: boolean) => {
    const next = new Set(checkedIds);
    if (checked) next.add(id); else next.delete(id);
    setCheckedIds(next);
    setComment(generateComment(next));
  };

  const handleIncludeAll = () => {
    const allIds = new Set(OEM_ANNOTATIONS.map(a => a.id));
    setCheckedIds(allIds);
    setComment(generateComment(allIds));
  };

  const handleApprove = () => {
    onApprove?.(comment);
    onClose();
  };

  const handleRequestRevision = () => {
    if (!comment.trim()) return;
    onRequestRevision?.(comment);
    onClose();
  };

  useEffect(() => {
    if (open) {
      setCheckedIds(new Set());
      setComment("");
    }
  }, [open]);

  // Extract image URLs from the preApproval documents (if provided)
  const images = preApproval?.documents
    .filter(d => d.url && IMAGE_EXTS.has(d.type.toLowerCase()))
    .map(d => d.url!) ?? [];

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
              <div className="flex-1 min-w-0 bg-[#F0F2F4] p-4">
                <DrawerOEMMainPane
                  checkedIds={checkedIds}
                  onToggleCheck={handleToggleCheck}
                  onIncludeAll={handleIncludeAll}
                  images={images}
                />
              </div>

              {/* Right Panel */}
              <div className="w-[400px] flex-none border-l border-[rgba(0,0,0,0.08)] bg-white h-full">
                <DrawerOEMSidePanel
                  onClose={onClose}
                  onApprove={handleApprove}
                  onRequestRevision={handleRequestRevision}
                  comment={comment}
                  onCommentChange={setComment}
                  preApproval={preApproval}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}
