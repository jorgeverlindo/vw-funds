// ─── WCAG luminance helpers ────────────────────────────────────────────────────

function toLinear(c255: number): number {
  const n = c255 / 255;
  return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
}

function wcagLuminance(r: number, g: number, b: number): number {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

// ─── Public API ────────────────────────────────────────────────────────────────

export interface ColorSample {
  luminance: number;
  avgR: number;
  avgG: number;
  avgB: number;
}

export interface AdaptiveColorSet {
  /** Full-weight text color */
  primary: string;
  /** ~60% visual weight — secondary labels */
  secondary: string;
  /** ~40% visual weight — tertiary/supplemental labels */
  tertiary: string;
}

/**
 * Compute a ColorSample from raw ImageData pixels.
 * Transparent pixels (alpha < 10) are skipped.
 */
export function computeSampleFromData(data: Uint8ClampedArray): ColorSample {
  let totalR = 0, totalG = 0, totalB = 0, count = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 10) continue;
    totalR += data[i];
    totalG += data[i + 1];
    totalB += data[i + 2];
    count++;
  }
  if (count === 0) return { luminance: 0.5, avgR: 128, avgG: 128, avgB: 128 };
  const avgR = totalR / count;
  const avgG = totalG / count;
  const avgB = totalB / count;
  return { luminance: wcagLuminance(avgR, avgG, avgB), avgR, avgG, avgB };
}

/**
 * Load an image URL into a hidden canvas and sample a region.
 * `region` uses normalised coordinates (0..1). Defaults to the full image.
 * Uses crossOrigin="anonymous" — works with Cloudinary CDN assets.
 * Returns null on CORS error or load failure (caller should fall back to brand color).
 */
export async function sampleImageUrl(
  url: string,
  region?: { x: number; y: number; w: number; h: number },
  sampleSize = 64,
): Promise<ColorSample | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const r = region ?? { x: 0, y: 0, w: 1, h: 1 };
        const canvas = document.createElement("canvas");
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(
          img,
          r.x * img.naturalWidth,
          r.y * img.naturalHeight,
          r.w * img.naturalWidth,
          r.h * img.naturalHeight,
          0, 0, sampleSize, sampleSize,
        );
        const { data } = ctx.getImageData(0, 0, sampleSize, sampleSize);
        resolve(computeSampleFromData(data));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Derive adaptive text colors from a background sample.
 *
 * - Very dark (lum < 0.30): white text with opacity variants
 * - Very light (lum > 0.70): near-black text with opacity variants
 * - Mid-range: take the dominant hue, darken it into a harmonised dark tone
 *   that contrasts against the mid-range background while staying on-palette
 */
export function deriveAdaptiveColors(sample: ColorSample): AdaptiveColorSet {
  if (sample.luminance < 0.30) {
    return {
      primary:   "rgba(255,255,255,0.92)",
      secondary: "rgba(255,255,255,0.65)",
      tertiary:  "rgba(255,255,255,0.42)",
    };
  }
  if (sample.luminance > 0.70) {
    return {
      primary:   "rgba(0,0,0,0.87)",
      secondary: "rgba(0,0,0,0.60)",
      tertiary:  "rgba(0,0,0,0.42)",
    };
  }
  // Mid-range: take the dominant hue and push it very dark so it contrasts
  // against the mid-tone background while preserving the hue harmony.
  const [h, s] = rgbToHsl(sample.avgR, sample.avgG, sample.avgB);
  const hueS = Math.min(Math.round(s * 0.7), 55);
  return {
    primary:   `hsl(${h}, ${hueS}%, 13%)`,
    secondary: `hsl(${h}, ${Math.round(hueS * 0.8)}%, 34%)`,
    tertiary:  `hsl(${h}, ${Math.round(hueS * 0.6)}%, 50%)`,
  };
}
