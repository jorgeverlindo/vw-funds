"use client";


import { Folder, MoreHorizontal } from "lucide-react";
import { getSquareThumbnail } from "@projects/lib/bg-thumbnail";
import { AssetCard } from "@projects/ui/AssetCard";

export interface BackgroundDimension {
  width: number;
  height: number;
  url: string;
}

export interface BackgroundCollection {
  id: string;
  name: string;
  type: string;
  sizes: number;
  folder: string;
  color: string;
  thumbnail: string;
  images: Record<string, string>;        // templateId → url (for known template sizes)
  dimensions?: BackgroundDimension[];    // all available sizes with actual dimensions
  isLifestyle?: boolean;                 // already contains the product/car image
  vehicleTag?: string;                   // single-vehicle tag — e.g. "CRV-Trailsport"
  vehicleTags?: string[];               // multi-vehicle tags — all must match combo slots
}

interface BackgroundCollectionCardProps {
  collection: BackgroundCollection;
  selected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
}

/** Derives a "W × H" label from the first image key (used for non-collection assets) */
function getDimensionLabel(collection: BackgroundCollection): string {
  const firstKey = Object.keys(collection.images)[0] ?? "";
  const match = firstKey.match(/(\d+)x(\d+)/i);
  if (match) return `${match[1]} × ${match[2]}`;
  return `${collection.sizes} sizes`;
}

/** Derives display tags from the collection's metadata */
function getTags(collection: BackgroundCollection): string[] {
  const tags: string[] = [];
  if (collection.vehicleTag) {
    tags.push(collection.vehicleTag.split("-")[0]);
  }
  if (collection.isLifestyle) tags.push("lifestyle");
  tags.push(collection.type || "background");
  return tags;
}

export function BackgroundCollectionCard({
  collection,
  selected = false,
  onSelect,
}: BackgroundCollectionCardProps) {
  const tags = getTags(collection);
  const bgCount = collection.sizes ?? Object.keys(collection.images).length;
  const subtitle = collection.isLifestyle
    ? `PNG | ${getDimensionLabel(collection)}`
    : `${bgCount} background${bgCount !== 1 ? "s" : ""}`;

  return (
    <AssetCard
      selected={selected}
      onSelect={(checked) => onSelect?.(collection.id, checked)}
      onClick={() => onSelect?.(collection.id, !selected)}
      menuButton={null}
      preview={
        /*
         * object-contain: shows the full asset touching the edges of its
         * longest dimension; gray bg fills the remainder — revealing
         * actual asset proportions in the square shell.
         */
        <img
          src={getSquareThumbnail(collection)}
          alt={collection.name}
          style={{ objectFit: "contain" }}
         className="absolute inset-0 w-full h-full" />
      }
      footer={
        <>
          {/* Title + ⋮ */}
          <div className="flex items-start justify-between gap-1 min-w-0">
            <p className="text-[13px] font-medium text-gray-900 leading-snug truncate">
              {collection.name}
            </p>
            <button
              className="shrink-0 text-gray-400 hover:text-gray-600 mt-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal size={14} />
            </button>
          </div>

          {/* Subtitle: count for collections, file type + dimensions for others */}
          <p className="text-[11px] text-gray-500 mt-0.5">
            {subtitle}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] text-gray-600 bg-[#f0f2f4] px-2 py-[3px] rounded leading-none"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Folder path */}
          <div className="flex items-center gap-1.5 mt-2">
            <Folder size={11} className="text-[var(--brand-accent)]/60 shrink-0" />
            <span className="text-[11px] text-gray-400 truncate">{collection.folder}</span>
          </div>
        </>
      }
    />
  );
}
