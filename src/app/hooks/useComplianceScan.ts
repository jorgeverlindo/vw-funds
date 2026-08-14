// ─── useComplianceScan ────────────────────────────────────────────────────────
// React hook that drives the DMP compliance scan pipeline:
//   1. POST /api/compliance/scan  → Playwright screenshot
//   2. POST /api/compliance/analyze → Claude vision DMP audit
//   3. Returns WCMItem[] ready for ComplianceContext.addInfraction()

import { useState, useCallback } from 'react';
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
}

interface ScreenshotResult {
  screenshotBase64: string;
  screenshotMimeType: string;
  pageTitle: string;
  pageUrl: string;
}

interface ScreenshotError {
  error: 'TIMEOUT' | 'NAV_ERROR' | 'EMPTY_URL';
  pageUrl: string;
}

const API_BASE = 'http://localhost:3001';

// ─── WCMItem builder ──────────────────────────────────────────────────────────

function buildWCMItem(
  violation: ScanViolation,
  dealershipName: string,
  pageUrl: string,
  screenshotBase64: string,
  screenshotMimeType: string,
): WCMItem {
  return {
    id: `wcm-scan-${Date.now()}-${violation.ruleCode}-${Math.random().toString(36).slice(2, 7)}`,
    detectedOn: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }),
    dealership: dealershipName,
    // violationType uses the exact DMP rule name from the Guidelines
    violationType: violation.ruleName,
    source: 'Web Monitoring',
    url: pageUrl,
    severity: violation.category === 'A' ? 'High' : 'Medium',
    status: 'Open',
    screenshotDataUrl: `data:${screenshotMimeType};base64,${screenshotBase64}`,
    createdAtISO: new Date().toISOString(),
    // Full description with rule code for DVR traceability
    comments: `[${violation.ruleCode}] ${violation.description}${
      violation.quotedText ? ` — Found text: "${violation.quotedText}"` : ''
    }`,
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

  const scanDealership = useCallback(
    async (
      dealership: DealershipEntry,
      channel: ScanChannel,
      urlOrHandle: string,
    ): Promise<WCMItem[]> => {
      if (!urlOrHandle.trim()) return [];

      setProgress(`Scanning ${dealership.name} — ${channel}…`);

      // Step 1: Screenshot
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

      // If screenshot failed, log an accessibility infraction
      if ('error' in screenshotResult) {
        return [buildAccessErrorItem(dealership.name, channel, screenshotResult.pageUrl, screenshotResult.error)];
      }

      const { screenshotBase64, screenshotMimeType, pageUrl } = screenshotResult;

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
          }),
        });
        const data = await res.json() as { violations?: ScanViolation[] };
        violations = data.violations ?? [];
      } catch (err) {
        console.error('[useComplianceScan] analyze fetch error:', err);
        return [];
      }

      // Step 3: Map to WCMItem[]
      return violations.map((v) =>
        buildWCMItem(v, dealership.name, pageUrl, screenshotBase64, screenshotMimeType),
      );
    },
    [],
  );

  const scanAllDealerships = useCallback(
    async (
      dealerships: DealershipEntry[],
      onInfraction: (item: WCMItem) => void,
    ): Promise<void> => {
      setIsScanning(true);

      const channels: Array<{ channel: ScanChannel; key: keyof DealershipEntry }> = [
        { channel: 'website',   key: 'website'   },
        { channel: 'instagram', key: 'instagram' },
        { channel: 'metaAds',   key: 'metaAds'   },
      ];

      for (const dealership of dealerships) {
        for (const { channel, key } of channels) {
          const urlOrHandle = String(dealership[key] ?? '').trim();
          if (!urlOrHandle) continue;

          const items = await scanDealership(dealership, channel, urlOrHandle);
          items.forEach((item) => onInfraction(item));
        }
      }

      setIsScanning(false);
      setProgress('');
    },
    [scanDealership],
  );

  return { isScanning, progress, scanAllDealerships };
}
