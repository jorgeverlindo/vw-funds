/**
 * Returns the render scale for a template thumbnail.
 * - Horizontal (width > height by ≥33%): max-height 100px
 * - Vertical / near-square:               max-height 200px
 */
export function thumbnailScale(width: number, height: number): number {
  const isHorizontal = width > height && (width - height) / height >= 0.34;
  return (isHorizontal ? 100 : 200) / height;
}
