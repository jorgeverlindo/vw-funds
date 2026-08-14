// ─── Playwright singleton + screenshot capture ────────────────────────────────
// Primary: local Playwright/Chromium (works on US-hosted servers).
// Fallback: Microlink.io cloud screenshot (no API key, works from any IP).
// VW dealer sites use Akamai geo-IP filtering that blocks non-US IPs locally.

import { chromium, type Browser } from "playwright-core";

let _browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (_browser && _browser.isConnected()) return _browser;
  _browser = await chromium.launch({ headless: true });
  return _browser;
}

export interface ScreenshotResult {
  screenshotBase64: string;
  screenshotMimeType: "image/jpeg";
  pageTitle: string;
  pageUrl: string;
}

export interface ScreenshotError {
  error: "TIMEOUT" | "NAV_ERROR" | "EMPTY_URL";
  pageUrl: string;
}

// channel drives viewport: website = desktop, instagram/metaAds = mobile
const VIEWPORT: Record<string, { width: number; height: number }> = {
  website:  { width: 1280, height: 800 },
  instagram: { width: 390, height: 844 },
  metaAds:  { width: 1280, height: 900 },
};

// Realistic UA for Instagram public pages (avoids login wall redirect)
const MOBILE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) " +
  "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

const DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// ─── Cloud fallback via Microlink.io ─────────────────────────────────────────
// Used when Playwright is blocked by CDN geo-IP (common in dev from non-US IPs).

async function captureViaCloud(
  url: string,
): Promise<ScreenshotResult | ScreenshotError> {
  try {
    const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false`;
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) return { error: "NAV_ERROR", pageUrl: url };

    const data = await res.json() as {
      status: string;
      data?: { screenshot?: { url?: string }; title?: string; url?: string };
    };

    const screenshotUrl = data?.data?.screenshot?.url;
    if (!screenshotUrl) return { error: "NAV_ERROR", pageUrl: url };

    // Fetch the screenshot image and convert to base64
    const imgRes = await fetch(screenshotUrl, { signal: AbortSignal.timeout(15_000) });
    if (!imgRes.ok) return { error: "NAV_ERROR", pageUrl: url };

    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
    return {
      screenshotBase64: imgBuffer.toString("base64"),
      screenshotMimeType: "image/jpeg",
      pageTitle: data?.data?.title ?? "",
      pageUrl: data?.data?.url ?? url,
    };
  } catch {
    return { error: "TIMEOUT", pageUrl: url };
  }
}

export async function captureScreenshot(
  url: string,
  channel: string,
): Promise<ScreenshotResult | ScreenshotError> {
  if (!url.trim()) return { error: "EMPTY_URL", pageUrl: url };

  const browser = await getBrowser();
  const vp = VIEWPORT[channel] ?? VIEWPORT.website;
  const isMobile = channel === "instagram";

  const context = await browser.newContext({
    viewport: vp,
    userAgent: isMobile ? MOBILE_UA : DESKTOP_UA,
    extraHTTPHeaders: { "Accept-Language": "en-US,en;q=0.9" },
  });
  const page = await context.newPage();

  // Block heavy non-visual resources to speed up load
  await page.route("**/*.{woff,woff2,ttf,otf}", (r) => r.abort());

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25_000 });

    if (channel === "instagram") await page.waitForTimeout(4000);
    if (channel === "metaAds")   await page.waitForTimeout(5000);

    const title = await page.title();
    const finalUrl = page.url();

    const buffer = await page.screenshot({
      type: "jpeg",
      quality: 82,
      fullPage: false,
      clip: { x: 0, y: 0, width: vp.width, height: vp.height },
    });

    return {
      screenshotBase64: buffer.toString("base64"),
      screenshotMimeType: "image/jpeg",
      pageTitle: title,
      pageUrl: finalUrl,
    };
  } catch (err: unknown) {
    await context.close().catch(() => {});
    const msg = err instanceof Error ? err.message : String(err);
    const isBotBlock = msg.includes("Timeout") || msg.includes("timeout") || msg.includes("403");
    console.log(`[playwright] local failed (${isBotBlock ? "bot-block/timeout" : "nav error"}), trying cloud fallback → ${url}`);
    // Cloud fallback: routes through US infrastructure, bypasses geo-IP blocks
    return captureViaCloud(url);
  } finally {
    await context.close().catch(() => {});
  }
}
