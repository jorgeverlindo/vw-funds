"use client";

import { ReactNode } from "react";

interface CardViewVerticalProps {
  children: ReactNode;
  /** Extra Tailwind classes forwarded to the grid wrapper */
  className?: string;
}

/**
 * Standard vertical card grid — Constellation Design System.
 *
 * Cards resize fluidly between 240 px (minimum) and 300 px (maximum)
 * as the viewport changes, fitting as many columns as possible.
 * Uses auto-fill so partially-filled last rows keep their column widths.
 *
 * Usage:
 *   <CardViewVertical>
 *     {items.map(item => <AssetCard key={item.id} ... />)}
 *   </CardViewVertical>
 */
export function CardViewVertical({ children, className = "" }: CardViewVerticalProps) {
  return (
    <div
      className={`grid gap-5 ${className}`}
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
    >
      {children}
    </div>
  );
}
