// ─── Shared agent types ───────────────────────────────────────────────────────

export interface OfferSummary {
  id: string;
  year: string;
  make: string;
  model: string;
  trim: string;
  offerType: string;
  monthlyPayment: number;
  term: number;
  pvi: number;
  aging: number;
  stock: number;
  exteriorColor?: string;
}

export interface TemplateSummary {
  id: string;
  name: string;
  format: string;
  width: number;
  height: number;
  brand: string;
}

export interface ProjectContext {
  projectId: string;
  projectName: string;
  oem: string;
  currentOfferIds: string[];
  currentTemplateIds: string[];
  currentBackgroundIds?: string[];
  availableOffers: OfferSummary[];
  availableTemplates: TemplateSummary[];
  availableBackgrounds?: Array<{ id: string; name: string }>;
  activeBrandOem?: string;
  taskOwners?: Record<string, string>;
  dealerName?: string;
  ctaText?: string;
  leaseLabel?: string;
  finePrint?: string;
}

export interface JBEntry {
  year: number;
  make: string;
  model: string;
  modelSlug: string;
  trim: string;
  colorFamily: string;
  cloudinaryUrl: string;
  s3Url: string;
  id: string;
  colorRaw: string;
}

export type CacheableTextBlock = {
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral" };
};
