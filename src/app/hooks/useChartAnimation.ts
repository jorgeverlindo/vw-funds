import { useRef, useEffect } from 'react';

/**
 * Returns Recharts animation props that distinguish two scenarios:
 *
 *  • First render (mount): 600 ms entry animation — the full "draw in" effect.
 *  • Subsequent renders (filter / data change): 450 ms ease-out — bars and pie
 *    slices glide from their previous position to the new one without resetting
 *    to zero, preserving the visual reference for comparison.
 *
 * Usage:
 *   const chartAnim = useChartAnimation();
 *   <Bar {...chartAnim} ... />
 *   <Pie {...chartAnim} ... />
 */
export function useChartAnimation() {
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Flip after the first commit so every re-render triggered by a filter
    // change uses the lighter "update" animation.
    isFirstRender.current = false;
  }, []);

  return isFirstRender.current
    ? ({
        isAnimationActive: true,
        animationBegin: 0,
        animationDuration: 600,
        animationEasing: 'ease-out',
      } as const)
    : ({
        isAnimationActive: true,
        animationBegin: 0,
        animationDuration: 450,
        animationEasing: 'ease-out',
      } as const);
}
