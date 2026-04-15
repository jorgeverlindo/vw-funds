import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../ui/utils';

interface SnackbarProps {
  open: boolean;
  onClose: () => void;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function Snackbar({ 
  open, 
  onClose, 
  message = "Pre-approval request created", 
  actionLabel = "See It",
  onAction,
  className
}: SnackbarProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={cn(
            "fixed bottom-6 left-6 z-[10000] flex items-center min-w-[320px] bg-[#2C2C2C] text-white px-4 py-3 rounded-[4px] shadow-lg gap-4",
            className
          )}
        >
          <span className="flex-1 text-[13px] font-normal tracking-[0.17px] font-['Roboto']">
            {message}
          </span>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={onAction}
              className="text-[#ACABFF] text-[13px] font-medium uppercase tracking-[0.46px] hover:text-[#ACABFF]/80 transition-colors font-['Roboto']"
            >
              {actionLabel}
            </button>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
