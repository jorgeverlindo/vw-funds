interface ThumbnailProps {
  src?: string;
  alt?: string;
  /** Default 76 — matches Figma Card Image bg size */
  width?: number;
  height?: number;
}

export function Thumbnail({ src, alt = '', width = 76, height = 76 }: ThumbnailProps) {
  return (
    <div
      className="shrink-0 overflow-hidden"
      style={{ width, height, background: '#f0f2f4' }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover object-center"
          draggable={false}
        />
      ) : (
        // Fallback — vehicle silhouette
        <div className="w-full h-full flex items-center justify-center">
          <svg viewBox="0 0 40 28" fill="none" className="w-3/5 text-[rgba(17,16,20,0.18)]">
            <path
              d="M6 18l4-8h20l4 8v5H6v-5z"
              stroke="currentColor" strokeWidth="1.2"
              fill="currentColor" fillOpacity="0.3"
            />
            <circle cx="12" cy="23" r="3" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="28" cy="23" r="3" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </div>
      )}
    </div>
  );
}
