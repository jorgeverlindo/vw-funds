// ─── Generated Main Image Store ───────────────────────────────────────────────
// Module-level reactive store: maps VIN → the active main generated image URL.
// Drives thumbnail overrides in Vehicles list and VIN Detail hero.
// Also persists the selected config ID so GeneratedImagesGrid survives remounts.

import { useState, useEffect } from 'react';

const imageStore  = new Map<string, string>();
const configStore = new Map<string, string>(); // VIN → selected config id
const listeners   = new Set<() => void>();

export function setMainGeneratedImage(vin: string, url: string, configId?: string): void {
  imageStore.set(vin, url);
  if (configId !== undefined) configStore.set(vin, configId);
  listeners.forEach(l => l());
}

export function getMainGeneratedImage(vin: string): string | null {
  return imageStore.get(vin) ?? null;
}

export function getMainConfigId(vin: string): string | null {
  return configStore.get(vin) ?? null;
}

export function useMainGeneratedImage(vin: string): string | null {
  const [url, setUrl] = useState<string | null>(() => imageStore.get(vin) ?? null);
  useEffect(() => {
    const handler = () => setUrl(imageStore.get(vin) ?? null);
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, [vin]);
  return url;
}
