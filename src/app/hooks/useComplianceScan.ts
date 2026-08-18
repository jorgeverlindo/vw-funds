// ─── useComplianceScan ────────────────────────────────────────────────────────
// React hook that drives the DMP compliance scan pipeline:
//   1. POST /api/compliance/scan  → Playwright screenshot
//   2. POST /api/compliance/analyze → Claude vision DMP audit
//   3. Returns WCMItem[] ready for ComplianceContext.addInfraction()

import { useState, useCallback, useRef } from 'react';
import type { WCMItem } from '../../data/types/compliance';

interface DealershipEntry {
  id: string;
  name: string;
  website: string;
  instagram: string;
  metaAds: string;
}

type ScanChannel = 'website' | 'instagram' | 'metaAds';

export interface ScanViolation {
  ruleCode: string;
  ruleName: string;
  category: 'A' | 'B';
  description: string;
  confidence: 'high' | 'medium';
  quotedText: string;
  pinX: number;
  pinY: number;
  pinDirection: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

// ─── Sequential SCN-XXXXX counter ────────────────────────────────────────────

const COUNTER_KEY = 'constellation-scan-counter';

function getNextScanId(): string {
  const current = parseInt(localStorage.getItem(COUNTER_KEY) ?? '0', 10);
  const next = current + 1;
  localStorage.setItem(COUNTER_KEY, String(next));
  return `SCN-${String(next).padStart(5, '0')}`;
}

interface ScreenshotResult {
  screenshotBase64: string;
  screenshotMimeType: string;
  pageTitle: string;
  pageUrl: string;
  screenshotHash?: string;
}

interface ScreenshotError {
  error: 'TIMEOUT' | 'NAV_ERROR' | 'EMPTY_URL';
  pageUrl: string;
}

const API_BASE = 'http://localhost:3001';

// ─── WCMItem builder — groups all violations from one page into a single item ──

function buildGroupedWCMItem(
  violations: ScanViolation[],
  dealershipName: string,
  pageUrl: string,
  screenshotBase64: string,
  screenshotMimeType: string,
  channel: ScanChannel,
  overrideId?: string,
  screenshotHash?: string,
): WCMItem {
  const ruleNums = violations.map((v) => v.ruleCode.replace(/^CAT-[AB]-/i, ''));
  // ruleName already contains "Rule 3B — Description" — strip the "Rule XX — " prefix
  // to get just the description, then reassemble cleanly for multi-violation items.
  const descriptions = violations.map((v) =>
    v.ruleName.replace(/^Rule\s+[\w\d]+\s*[–—-]\s*/i, ''),
  );
  // "Rule 3B — DBA Name Oversized" (single) or "Rules 3B, 2F, 4J — Name Oversized; Badges; ..." (multi)
  const violationType = violations.length === 1
    ? violations[0].ruleName
    : `Rules ${ruleNums.join(', ')} — ${descriptions.join('; ')}`;

  const hasAnyCatA = violations.some((v) => v.category === 'A');

  return {
    id: overrideId ?? getNextScanId(),
    detectedOn: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }),
    dealership: dealershipName,
    violationType,
    source: 'Web Monitoring',
    channel: channel === 'metaAds' ? 'metaAds' : 'website',
    url: pageUrl,
    severity: hasAnyCatA ? 'High' : 'Medium',
    status: 'Open',
    lifecycleStatus: 'DETECTED' as const,
    screenshotDataUrl: `data:${screenshotMimeType};base64,${screenshotBase64}`,
    screenshotHash,
    createdAtISO: new Date().toISOString(),
    comments: violations
      .map((v, i) =>
        `${i + 1}. [${v.ruleCode}] ${v.ruleName} — ${v.description}${
          v.quotedText ? ` Found: "${v.quotedText}"` : ''
        }`,
      )
      .join('\n'),
    pins: violations.map((v) => ({
      title: v.ruleName,
      description: v.description,
      x: v.pinX ?? 50,
      y: v.pinY ?? 10,
      direction: v.pinDirection ?? 'top-right',
      category: v.category,
      ruleNumber: v.ruleCode.replace(/^CAT-[AB]-/i, ''),
    })),
  };
}

// ─── Inaccessible page infraction ─────────────────────────────────────────────

function buildAccessErrorItem(
  dealershipName: string,
  channel: ScanChannel,
  pageUrl: string,
  errorCode: string,
): WCMItem {
  const channelLabel = { website: 'Website', instagram: 'Instagram', metaAds: 'Meta Ads' }[channel];
  return {
    id: `wcm-scan-${Date.now()}-access-${channel}`,
    detectedOn: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }),
    dealership: dealershipName,
    violationType: `Web Monitoring — ${channelLabel} Page Not Accessible`,
    source: 'Web Monitoring',
    url: pageUrl,
    severity: 'Medium',
    status: 'Open',
    createdAtISO: new Date().toISOString(),
    comments: `[${errorCode}] The ${channelLabel} page could not be loaded during automated compliance scan. ` +
      `Possible causes: site is down, URL is incorrect, or page requires login. ` +
      `Please verify the configured URL in Web Monitoring Configuration.`,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useComplianceScan() {
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState('');
  const shouldStopRef = useRef(false);

  const scanDealership = useCallback(
    async (
      dealership: DealershipEntry,
      channel: ScanChannel,
      urlOrHandle: string,
      demoScreenshotUrl?: string,  // local asset URL — bypasses Playwright for demo
    ): Promise<WCMItem[]> => {
      if (!urlOrHandle.trim() && !demoScreenshotUrl) return [];

      setProgress(`Scanning ${dealership.name} — ${channel}…`);

      let screenshotBase64: string;
      let screenshotMimeType: string;
      let pageUrl: string;
      let screenshotHashFromServer: string | undefined;

      if (demoScreenshotUrl) {
        // Demo mode: server reads the local file and returns it as ScreenshotResult.
        // Using the server endpoint avoids browser btoa stack-overflow on large PNGs
        // and ensures the analysis cache is bypassed so Claude re-analyses fresh.
        try {
          const res = await fetch(`${API_BASE}${demoScreenshotUrl}`);
          if (!res.ok) throw new Error(`demo-asset ${res.status}`);
          const data = await res.json() as ScreenshotResult & { screenshotHash?: string };
          screenshotBase64 = data.screenshotBase64;
          screenshotMimeType = data.screenshotMimeType;
          pageUrl = data.pageUrl;
          screenshotHashFromServer = data.screenshotHash;
        } catch (err) {
          console.error('[useComplianceScan] demo screenshot fetch error:', err);
          return [];
        }
      } else {
        // Step 1: Screenshot via Playwright server
        let screenshotResult: ScreenshotResult | ScreenshotError;
        try {
          const res = await fetch(`${API_BASE}/api/compliance/scan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dealershipName: dealership.name,
              channel,
              urlOrHandle,
            }),
          });
          screenshotResult = await res.json() as ScreenshotResult | ScreenshotError;
        } catch (err) {
          console.error('[useComplianceScan] scan fetch error:', err);
          return [buildAccessErrorItem(dealership.name, channel, urlOrHandle, 'FETCH_ERROR')];
        }

        if ('error' in screenshotResult) {
          return [buildAccessErrorItem(dealership.name, channel, screenshotResult.pageUrl, screenshotResult.error)];
        }

        screenshotBase64 = screenshotResult.screenshotBase64;
        screenshotMimeType = screenshotResult.screenshotMimeType;
        pageUrl = screenshotResult.pageUrl;
        screenshotHashFromServer = screenshotResult.screenshotHash;
      }

      // Step 2: Claude vision DMP analysis
      let violations: ScanViolation[] = [];
      try {
        const res = await fetch(`${API_BASE}/api/compliance/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            screenshotBase64,
            screenshotMimeType,
            channel,
            dealershipName: dealership.name,
            pageUrl,
            // Demo assets bypass cache so Claude always re-analyses the image
            skipCache: !!demoScreenshotUrl,
          }),
        });
        const data = await res.json() as { violations?: ScanViolation[] };
        violations = data.violations ?? [];
      } catch (err) {
        console.error('[useComplianceScan] analyze fetch error:', err);
        return [];
      }

      // Step 3: Group all violations into one WCMItem per page
      if (violations.length === 0) return [];
      return [buildGroupedWCMItem(violations, dealership.name, pageUrl, screenshotBase64, screenshotMimeType, channel, undefined, screenshotHashFromServer)];
    },
    [],
  );

  const stopScan = useCallback(() => {
    shouldStopRef.current = true;
  }, []);

  // Discovers New, Used, and Specials pages on a dealer website and scans each one
  const scanInventoryPages = useCallback(
    async (dealership: DealershipEntry): Promise<WCMItem[]> => {
      const base = dealership.website.trim();
      if (!base) return [];

      setProgress(`Discovering inventory pages — ${dealership.name}…`);

      let inventoryUrls: string[] = [];
      try {
        const res = await fetch(`${API_BASE}/api/compliance/discover-inventory`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urlOrHandle: base }),
        });
        const data = await res.json() as { urls?: string[] };
        inventoryUrls = data.urls ?? [];
      } catch (err) {
        console.error('[useComplianceScan] discover-inventory fetch error:', err);
        return [];
      }

      if (!inventoryUrls.length) return [];

      const allItems: WCMItem[] = [];
      for (const pageUrl of inventoryUrls) {
        if (shouldStopRef.current) break;
        const items = await scanDealership(dealership, 'website', pageUrl);
        allItems.push(...items);
      }
      return allItems;
    },
    [scanDealership],
  );

  const scanAllDealerships = useCallback(
    async (
      dealerships: DealershipEntry[],
      onInfraction: (item: WCMItem) => void,
      // Per-dealership demo screenshot URLs; keyed by dealership id.
      // When provided, bypasses Playwright and uses the local asset directly.
      demoScreenshots?: Record<string, string>,
    ): Promise<void> => {
      shouldStopRef.current = false;
      setIsScanning(true);

      outer:
      for (const dealership of dealerships) {
        const demoUrl = demoScreenshots?.[dealership.id];

        if (demoUrl) {
          // Demo mode: one pass using the local screenshot asset — no crawling
          if (shouldStopRef.current) break outer;
          const items = await scanDealership(dealership, 'website', dealership.website || 'emichvw.com/used-cars/', demoUrl);
          items.forEach((item) => onInfraction(item));
        } else {
          // Live scan: discover New, Used, Specials pages and scan each one
          if (shouldStopRef.current) break outer;

          const metaHandle = String(dealership.metaAds ?? '').trim();
          if (metaHandle) {
            const metaItems = await scanDealership(dealership, 'metaAds', metaHandle);
            metaItems.forEach((item) => onInfraction(item));
          }

          if (shouldStopRef.current) break outer;

          if (dealership.website.trim()) {
            const inventoryItems = await scanInventoryPages(dealership);
            inventoryItems.forEach((item) => onInfraction(item));
          }
        }
      }

      setIsScanning(false);
      setProgress('');
      shouldStopRef.current = false;
    },
    [scanDealership, scanInventoryPages],
  );

  return { isScanning, progress, scanAllDealerships, stopScan };
}
