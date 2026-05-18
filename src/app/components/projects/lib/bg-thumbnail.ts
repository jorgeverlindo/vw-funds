import { templates } from "@projects/lib/mock-data";

interface BgWithImages {
  thumbnail?: string;
  images?: Record<string, string>;
}

export function getSquareThumbnail(bg: BgWithImages): string {
  const images = bg.images ?? {};
  const keys = Object.keys(images);
  if (keys.length === 0) return bg.thumbnail ?? "";

  let bestKey = keys[0];
  let bestDistance = Infinity;

  for (const key of keys) {
    const t = templates.find((t) => t.id === key);
    if (!t) continue;
    const distance = Math.abs(t.width / t.height - 1);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestKey = key;
    }
  }

  return images[bestKey] ?? bg.thumbnail ?? "";
}
