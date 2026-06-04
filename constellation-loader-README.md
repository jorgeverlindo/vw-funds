# Constellation Arc Loader

The animated brand mark used as a loading indicator throughout the Constellation app — the three concentric arc segments that pulse in sequence while the AI agent is processing.

---

## What's included

| File | Description |
|------|-------------|
| `constellation-loader.html` | Self-contained preview — open in any browser, no install needed |
| `ConstellationArcMark.tsx` | Production React component (TypeScript) — drop into any React/Next.js project |

---

## Quick start — HTML (framework-agnostic)

Open `constellation-loader.html` directly in a browser. You'll see the animation running across four size variants with a start/stop toggle.

To embed it in any HTML project, copy the `<svg>` block and the `<script>` section:

```html
<!-- 1. The mark — swap width/height for the size you need -->
<svg id="my-loader" width="17" height="30" viewBox="0 0 18 33" fill="none">
  <path class="arc-outer"  d="M2.22422 16.0471C2.22422 7.57204 8.61025 0.631495 16.6988 0.0413128C16.332 0.0118036 15.9594 0 15.5867 0C6.97648 0 0 7.18252 0 16.0471C0 24.9116 6.97648 32.0941 15.5867 32.0941C15.9594 32.0941 16.332 32.0823 16.6988 32.0528C8.61025 31.4626 2.22422 24.5221 2.22422 16.0471Z"/>
  <path class="arc-middle" d="M6.12227 16.047C6.12227 9.69073 10.9089 4.48533 16.9796 4.04269C16.7045 4.02498 16.4236 4.01318 16.1427 4.01318C9.6879 4.01318 4.4541 9.40154 4.4541 16.047C4.4541 22.6924 9.6879 28.0808 16.1427 28.0808C16.4236 28.0808 16.7045 28.069 16.9796 28.0513C10.9146 27.6086 6.12227 22.4032 6.12227 16.047Z"/>
  <path class="arc-inner"  d="M17.2605 8.04407C17.0771 8.03227 16.8937 8.02637 16.7045 8.02637C12.3994 8.02637 8.9082 11.6206 8.9082 16.0529C8.9082 20.4851 12.3994 24.0793 16.7045 24.0793C16.8937 24.0793 17.0771 24.0734 17.2605 24.0557C13.2134 23.7606 10.0261 20.2904 10.0261 16.0529C10.0261 11.8154 13.2191 8.34507 17.2605 8.04998V8.04407Z"/>
</svg>

<!-- 2. Colors -->
<style>
  :root {
    --brand-accent: #473BAB;
    --brand-mid:    #6356e1;
    --brand-light:  #8c86fc;
  }
  .arc-outer  { fill: var(--brand-accent); transition: opacity 120ms ease; }
  .arc-middle { fill: var(--brand-mid);    transition: opacity 120ms ease; }
  .arc-inner  { fill: var(--brand-light);  transition: opacity 120ms ease; }
</style>

<!-- 3. Animation engine — call start() / stop() as needed -->
<script>
  const DIM = { outer: 0.22, middle: 0.18, inner: 0.12 };
  const LIT = { outer: 0.92, middle: 0.82, inner: 0.72 };

  const svg     = document.getElementById('my-loader');
  const outers  = svg.querySelectorAll('.arc-outer');
  const middles = svg.querySelectorAll('.arc-middle');
  const inners  = svg.querySelectorAll('.arc-inner');

  let cancelled = false;
  const timers  = [];

  function setArcs(o, m, i) {
    outers .forEach(el => el.style.opacity = o ? LIT.outer  : DIM.outer);
    middles.forEach(el => el.style.opacity = m ? LIT.middle : DIM.middle);
    inners .forEach(el => el.style.opacity = i ? LIT.inner  : DIM.inner);
  }

  function all(lit) { setArcs(lit, lit, lit); }
  function clearAll() { timers.forEach(clearTimeout); timers.length = 0; }

  function loop() {
    if (cancelled) return;
    let t = 80;
    function q(delay, fn) {
      t += delay;
      timers.push(setTimeout(() => { if (!cancelled) fn(); }, t));
    }
    all(false);
    q(80,  () => setArcs(1,0,0));  q(240, () => setArcs(1,1,0));  q(240, () => all(1));
    q(600, () => {});               q(180, () => all(0));           q(380, () => {});
    q(140, () => all(1));           q(280, () => all(0));           q(200, () => all(1));
    q(280, () => all(0));           q(320, () => {});
    q(80,  () => setArcs(1,0,0));
    q(220, () => setArcs(0,1,0));
    q(220, () => setArcs(0,0,1));
    q(220, () => setArcs(0,0,0));
    q(140, () => all(1));  q(420, () => all(0));  q(380, () => loop());
  }

  function start() { cancelled = false; loop(); }
  function stop()  { cancelled = true; clearAll(); all(false); }

  // Usage:
  start();   // begin looping
  // stop(); // halt and reset to dim state
</script>
```

---

## Quick start — React / Next.js

Drop `ConstellationArcMark.tsx` into your components folder. It exports two things:

- **`ConstellationArcMark`** — the SVG mark itself, accepts an `arcs` state object and an optional `size` prop
- **`useConstellationAnim`** — a hook that drives the animation sequence; returns the current `arcs` state

```tsx
import { ConstellationArcMark, useConstellationAnim } from './ConstellationArcMark';

export function MyLoader({ isLoading }: { isLoading: boolean }) {
  const arcs = useConstellationAnim(isLoading);
  return <ConstellationArcMark arcs={arcs} size={30} />;
}
```

Pass `running={true}` to start the loop, `running={false}` to stop and reset it. The hook is side-effect-free — it cleans up all timers when `running` flips to false or when the component unmounts.

### Size

The `size` prop sets the height in pixels. Width is automatically `size × 0.56` to preserve the aspect ratio.

```tsx
<ConstellationArcMark arcs={arcs} size={20} />   {/* sm — inline / button label  */}
<ConstellationArcMark arcs={arcs} size={30} />   {/* md — default, chat header   */}
<ConstellationArcMark arcs={arcs} size={50} />   {/* lg — empty-state panel      */}
<ConstellationArcMark arcs={arcs} size={80} />   {/* xl — full-page loading gate */}
```

### Colors

The component reads three CSS custom properties. Override them at any scope level:

```css
:root {
  --brand-accent: #473BAB;   /* outer arc  */
  --brand-mid:    #6356e1;   /* middle arc */
  --brand-light:  #8c86fc;   /* inner arc  */
}
```

---

## How the animation works

The animation has no external dependencies — it's pure CSS `opacity` transitions (120ms ease) triggered by a queue of `setTimeout` calls.

Each loop cycle runs the following sequence:

```
outer on  →  middle on  →  all on  ──── hold ────  all off  ──── pause ────
all on  →  all off  →  all on  →  all off  ──── pause ────
outer on  →  outer off / middle on  →  middle off / inner on  →  inner off
all on  ──── hold ────  all off  ──── loop restarts
```

Total cycle duration: ~4.5 seconds. The three arcs each have a distinct resting opacity so the mark is always visible, never fully invisible:

| Arc | Dim opacity | Lit opacity |
|-----|------------|-------------|
| Outer | 0.22 | 0.92 |
| Middle | 0.18 | 0.82 |
| Inner | 0.12 | 0.72 |

---

## Integrating with your own design system

The only things you need to change to match a different brand:

1. **SVG paths** — the three `<path>` elements are the actual Constellation logotype. Replace them with your own mark's paths if needed.
2. **CSS variables** — update `--brand-accent`, `--brand-mid`, `--brand-light` to your palette.
3. **Timing** — the `q(delay, fn)` calls in the loop control every beat. Increase delays to slow the animation down, decrease them to speed it up.
