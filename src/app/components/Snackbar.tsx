/**
 * Snackbar — bottom-left toast for workflow submissions.
 *
 * Uses a tiny event-bus instead of a React context so non-component code
 * (WorkflowContext callbacks) can fire toasts without the provider chain
 * needing to wrap them. `emitSnackbar(msg)` is called anywhere; the
 * <SnackbarHost /> mounted once near the root renders them.
 *
 * Style matches Figma node 4896:983122: pill on #2a2831, white Roboto 12/14.3,
 * 24/24px from bottom-left, slide-in + fade 450ms, auto-dismiss after 3s,
 * no Undo action (only the X close).
 */
import { useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';

type SnackbarMsg = { id: number; message: string };

type Listener = (msg: SnackbarMsg) => void;
const listeners = new Set<Listener>();
let _counter = 0;

export function emitSnackbar(message: string) {
  const msg: SnackbarMsg = { id: ++_counter, message };
  listeners.forEach(l => l(msg));
}

export function SnackbarHost() {
  const [items, setItems] = useState<SnackbarMsg[]>([]);

  const removeItem = useCallback((id: number) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  useEffect(() => {
    const listener: Listener = msg => {
      setItems(prev => [...prev, msg]);
      // Auto-dismiss after 3s
      window.setTimeout(() => {
        setItems(prev => prev.filter(i => i.id !== msg.id));
      }, 3000);
    };
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  return (
    <div className="fixed bottom-6 left-6 z-[10002] flex flex-col gap-2 pointer-events-none">
      {items.map(item => (
        <SnackbarItem key={item.id} message={item.message} onClose={() => removeItem(item.id)} />
      ))}
    </div>
  );
}

function SnackbarItem({ message, onClose }: { message: string; onClose: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{ transitionDuration: '450ms' }}
      className={`pointer-events-auto flex items-center gap-3 bg-[#2a2831] text-white rounded px-4 py-3 shadow-[0_3px_5px_-1px_rgba(0,0,0,0.2),0_6px_10px_0_rgba(0,0,0,0.14),0_1px_18px_0_rgba(0,0,0,0.12)] transition-all ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <p
        className="text-[12px] leading-[1.43] tracking-[0.17px] font-normal"
        style={{ fontFamily: 'Roboto, system-ui, sans-serif' }}
      >
        {message}
      </p>
      <button
        onClick={onClose}
        aria-label="Dismiss"
        className="text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
