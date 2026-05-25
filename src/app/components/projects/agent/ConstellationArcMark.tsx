"use client";

import { useState, useRef, useEffect } from "react";

// ─── Constellation arc animation (matches AgentPane exactly) ──────────────────
interface ArcState { outer: boolean; middle: boolean; inner: boolean }

export function ConstellationArcMark({ arcs, size = 20 }: { arcs: ArcState; size?: number }) {
  return (
    <svg width={size * 0.56} height={size} viewBox="0 0 18 33" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M2.22422 16.0471C2.22422 7.57204 8.61025 0.631495 16.6988 0.0413128C16.332 0.0118036 15.9594 0 15.5867 0C6.97648 0 0 7.18252 0 16.0471C0 24.9116 6.97648 32.0941 15.5867 32.0941C15.9594 32.0941 16.332 32.0823 16.6988 32.0528C8.61025 31.4626 2.22422 24.5221 2.22422 16.0471Z"
        fill="var(--brand-accent)" style={{ opacity: arcs.outer ? 0.92 : 0.22, transition: "opacity 120ms ease" }} />
      <path d="M6.12227 16.047C6.12227 9.69073 10.9089 4.48533 16.9796 4.04269C16.7045 4.02498 16.4236 4.01318 16.1427 4.01318C9.6879 4.01318 4.4541 9.40154 4.4541 16.047C4.4541 22.6924 9.6879 28.0808 16.1427 28.0808C16.4236 28.0808 16.7045 28.069 16.9796 28.0513C10.9146 27.6086 6.12227 22.4032 6.12227 16.047Z"
        fill="var(--brand-mid)" style={{ opacity: arcs.middle ? 0.82 : 0.18, transition: "opacity 120ms ease" }} />
      <path d="M17.2605 8.04407C17.0771 8.03227 16.8937 8.02637 16.7045 8.02637C12.3994 8.02637 8.9082 11.6206 8.9082 16.0529C8.9082 20.4851 12.3994 24.0793 16.7045 24.0793C16.8937 24.0793 17.0771 24.0734 17.2605 24.0557C13.2134 23.7606 10.0261 20.2904 10.0261 16.0529C10.0261 11.8154 13.2191 8.34507 17.2605 8.04998V8.04407Z"
        fill="var(--brand-light)" style={{ opacity: arcs.inner ? 0.72 : 0.12, transition: "opacity 120ms ease" }} />
    </svg>
  );
}

export function useConstellationAnim(running: boolean) {
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
      q(80,  () => setO(true));  q(240, () => setM(true));  q(240, () => setI(true));
      q(600, () => {});          q(180, () => all(false));   q(380, () => {});
      q(140, () => all(true));   q(280, () => all(false));   q(200, () => all(true));
      q(280, () => all(false));  q(320, () => {});
      q(80,  () => { all(false); setO(true); });
      q(220, () => { setO(false); setM(true); });
      q(220, () => { setM(false); setI(true); });
      q(220, () => { setI(false); });
      q(140, () => all(true)); q(420, () => all(false)); q(380, () => loop());
      timerRefs.current = timers;
    }
    loop();
    return () => { cancelled = true; clearAll(); setArcs({ outer: false, middle: false, inner: false }); };
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps
  return arcs;
}
