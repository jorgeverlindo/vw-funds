// ─── Playwright singleton + screenshot capture ────────────────────────────────
// Primary: local Playwright/Chromium with stealth plugin (bypasses Cloudflare JS challenges).
// Fallback: Microlink.io cloud screenshot (no API key, works from any IP).

// playwright-extra + stealth plugin for bypassing Cloudflare/Akamai bot detection
// Uses createRequire to load these CJS packages from an ESM context
import { createRequire } from "node:module";
const _require = createRequire(import.meta.url);
const { chromium: stealthChromium } = _require('playwright-extra') as { chromium: typeof import('playwright-core').chromium & { use: (p: unknown) => void } };
const StealthPlugin = _require('puppeteer-extra-plugin-stealth') as () => unknown;
stealthChromium.use(StealthPlugin());

import type { Browser } from "playwright-core";

let _browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (_browser && _browser.isConnected()) return _browser;
  _browser = await stealthChromium.launch({
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
    ignoreDefaultArgs: ['--enable-automation'],
  });
  return _browser;
}

export interface ScreenshotResult {
  screenshotBase64: string;
  screenshotMimeType: "image/jpeg" | "image/png";
  pageTitle: string;
  pageUrl: string;
}

export interface ScreenshotError {
  error: "TIMEOUT" | "NAV_ERROR" | "EMPTY_URL";
  pageUrl: string;
}

// channel drives viewport: website = desktop wide-view, instagram/metaAds = mobile
const VIEWPORT: Record<string, { width: number; height: number }> = {
  website:  { width: 1280, height: 1400 },
  instagram: { width: 390, height: 844 },
  metaAds:  { width: 1280, height: 1080 },
};

const MOBILE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) " +
  "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

const DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// ─── Cloud fallback via Microlink.io ─────────────────────────────────────────

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

    const imgRes = await fetch(screenshotUrl, { signal: AbortSignal.timeout(15_000) });
    if (!imgRes.ok) return { error: "NAV_ERROR", pageUrl: url };

    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
    // Detect actual image type from magic bytes (Microlink returns PNG despite some URLs saying .jpg)
    const isPng = imgBuffer[0] === 0x89 && imgBuffer[1] === 0x50;
    return {
      screenshotBase64: imgBuffer.toString("base64"),
      screenshotMimeType: isPng ? "image/png" : "image/jpeg",
      pageTitle: data?.data?.title ?? "",
      pageUrl: data?.data?.url ?? url,
    };
  } catch {
    return { error: "TIMEOUT", pageUrl: url };
  }
}

// ─── Challenge page detection ─────────────────────────────────────────────────
// Returns true when the page is a bot-protection interstitial, not the real site.

async function isChallengePage(page: import("playwright-core").Page, finalUrl: string): Promise<boolean> {
  const title = await page.title();

  // URL-based signals
  if (
    finalUrl.includes("__cf_chl") ||
    finalUrl.includes("__cf_chl_jschl")
  ) return true;

  // Title-based signals (Cloudflare, Akamai, generic WAF)
  if (
    title === "Dealer Website" ||
    title === "Just a moment..." ||
    title === "" ||
    title === "Access Denied" ||
    title === "Error | Drupal"
  ) return true;

  // Content-based signal: check for known challenge body text
  // This catches branded Cloudflare pages whose title matches the dealer name
  try {
    const bodyText = await page.evaluate(() => document.body?.innerText ?? "");
    const lower = bodyText.toLowerCase();
    if (
      lower.includes("we're working to keep your website experience safe") ||
      lower.includes("checking your browser") ||
      lower.includes("enable javascript and cookies") ||
      lower.includes("please wait while we verify") ||
      lower.includes("ddos protection by cloudflare") ||
      lower.includes("ray id:") ||
      (lower.includes("access denied") && lower.includes("cloudflare"))
    ) return true;
  } catch {
    // page.evaluate can fail on navigation errors — treat as unknown, don't block
  }

  return false;
}

// ─── Inventory page discovery ─────────────────────────────────────────────────
// Strategy (in order):
//   1. Homepage always included
//   2. Sitemap — fast, works for many VW dealer CMSes
//   3. HEAD probe — parallel requests to 40+ known VW-dealer URL patterns
//   4. DOM link extraction — Playwright crawl of nav/header links (broadened patterns)
// Returns up to 8 unique page URLs covering homepage, new, used, and specials.

// ─── Patterns for DOM/sitemap link matching ───────────────────────────────────
// Word-level matches (no mandatory leading slash) so compound paths like
// /lease-offers, /atlas-specials, /used-cars-inventory all match correctly.

const INVENTORY_PAGE_PATTERNS = [
  // Used / pre-owned
  /\bused\b/i, /pre.?owned/i, /certified/i, /\bcpo\b/i, /usados/i,
  // New vehicles (avoid false-positive on "renew", "knew" etc via word boundary)
  /\bnew[-/]/i, /\/new$/i, /new.?vehicles/i, /new.?inventory/i, /new.?cars/i, /vehicles\/new/i,
  // Specials / offers / deals
  /specials/i, /\boffers\b/i, /\bdeals\b/i, /promotions/i, /monthly.?offer/i, /current.?offer/i,
  // General inventory
  /\/inventory/i,
];

// ─── Common VW-dealer URL paths to probe directly ────────────────────────────

const PROBE_PATHS: string[] = [
  // New vehicles
  "/new-inventory", "/new-inventory/index.htm",
  "/new-vehicles", "/new-vehicles/index.htm",
  "/new-cars", "/new-vehicle-inventory",
  "/vehicles/new", "/inventory/new", "/new", "/shop/new",
  // Used / pre-owned
  "/used-inventory", "/used-inventory/index.htm",
  "/used-vehicles", "/used-vehicles/index.htm",
  "/used-cars", "/pre-owned-vehicles", "/pre-owned",
  "/certified-pre-owned", "/certified-inventory", "/certified-inventory/index.htm",
  "/certified", "/cpo", "/vehicles/used", "/inventory/used", "/used",
  // Specials / offers
  "/specials", "/offers", "/current-offers", "/monthly-offers",
  "/lease-offers", "/finance-offers", "/vw-offers", "/new-specials",
  "/used-specials", "/deals", "/promotions", "/promotions/new",
  "/promotions/new/index.htm", "/sales", "/incentives",
];

// ─── HEAD probe ───────────────────────────────────────────────────────────────
// Sends parallel HEAD requests; returns paths that respond 2xx on the same origin.
// Accepts www. redirects as valid (jackdanielsvw.com → www.jackdanielsvw.com).

function isSameOrWwwOrigin(a: string, b: string): boolean {
  if (a === b) return true;
  // strip leading "www." from both for comparison
  const strip = (o: string) => o.replace(/^(https?:\/\/)www\./, "$1");
  return strip(a) === strip(b);
}

async function probeCommonPaths(origin: string): Promise<string[]> {
  const seenFinal = new Set<string>();
  const results: string[] = [];

  await Promise.all(
    PROBE_PATHS.map(async (path) => {
      const url = `${origin}${path}`;
      try {
        const res = await fetch(url, {
          method: "HEAD",
          signal: AbortSignal.timeout(6_000),
          headers: { "User-Agent": DESKTOP_UA, "Accept-Language": "en-US,en;q=0.9" },
          redirect: "follow",
        });
        if (!res.ok) return;
        const finalUrl = new URL(res.url);
        // Accept same origin or www-redirect of the same domain
        if (!isSameOrWwwOrigin(finalUrl.origin, origin)) return;
        const key = finalUrl.origin + finalUrl.pathname;
        if (seenFinal.has(key)) return;
        seenFinal.add(key);
        // Navigate to the final resolved URL (correct host after www redirect)
        results.push(finalUrl.href);
      } catch { /* skip unreachable paths */ }
    }),
  );

  console.log(`[discover-inventory] probe found ${results.length} page(s):`, results);
  return results;
}

// ─── Sitemap parser ───────────────────────────────────────────────────────────
// Fetches /sitemap.xml (or /sitemap_index.xml) and returns used-car page URLs.

async function discoverViasSitemap(origin: string): Promise<string[]> {
  const sitemapCandidates = [
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
    `${origin}/sitemap/sitemap.xml`,
  ];

  for (const sitemapUrl of sitemapCandidates) {
    try {
      const res = await fetch(sitemapUrl, {
        signal: AbortSignal.timeout(10_000),
        headers: { "User-Agent": DESKTOP_UA },
      });
      if (!res.ok) continue;

      const xml = await res.text();
      // Extract all <loc> values
      const locs = [...xml.matchAll(/<loc>\s*(https?:\/\/[^\s<]+)\s*<\/loc>/gi)]
        .map((m) => m[1].trim());

      const seen = new Set<string>();
      const results: string[] = [];
      for (const loc of locs) {
        try {
          const parsed = new URL(loc);
          if (parsed.origin !== origin) continue;
          if (!INVENTORY_PAGE_PATTERNS.some((p) => p.test(parsed.pathname))) continue;
          const key = parsed.origin + parsed.pathname;
          if (seen.has(key)) continue;
          seen.add(key);
          results.push(parsed.href);
          if (results.length >= 6) break;
        } catch { /* ignore */ }
      }

      if (results.length) return results;
    } catch { /* try next */ }
  }
  return [];
}

// Exported under old name for backward compat — delegates to the new broader function
export async function discoverUsedCarLinks(baseUrl: string): Promise<string[]> {
  return discoverInventoryPages(baseUrl);
}

export async function discoverInventoryPages(baseUrl: string): Promise<string[]> {
  let origin: string;
  try {
    origin = new URL(baseUrl).origin;
  } catch {
    return [];
  }

  const seenKeys = new Set<string>();
  const addUnique = (url: string): boolean => {
    try {
      const key = new URL(url).origin + new URL(url).pathname;
      if (seenKeys.has(key)) return false;
      seenKeys.add(key);
      return true;
    } catch { return false; }
  };

  const pages: string[] = [];

  // ── 1. Homepage always included ──────────────────────────────────────────
  const homepage = `${origin}/`;
  addUnique(homepage);
  pages.push(homepage);

  // ── 2. Sitemap ───────────────────────────────────────────────────────────
  const sitemapResults = await discoverViasSitemap(origin);
  if (sitemapResults.length) {
    console.log(`[discover-inventory] sitemap found ${sitemapResults.length} page(s):`, sitemapResults);
    for (const u of sitemapResults) { if (addUnique(u)) pages.push(u); }
    if (pages.length >= 7) return pages.slice(0, 8);
  }

  // ── 3. HEAD probe (parallel, no Playwright needed) ───────────────────────
  console.log(`[discover-inventory] probing common paths for ${origin}`);
  const probeResults = await probeCommonPaths(origin);
  for (const u of probeResults) { if (addUnique(u)) pages.push(u); }
  if (pages.length >= 4) {
    console.log(`[discover-inventory] probe gave ${pages.length} page(s) total`);
    return pages.slice(0, 8);
  }

  // ── 4. DOM link extraction via Playwright (broadened nav-level search) ───
  console.log(`[discover-inventory] probe insufficient, falling back to Playwright DOM extraction for ${origin}`);
  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: VIEWPORT.website,
    userAgent: DESKTOP_UA,
    extraHTTPHeaders: { "Accept-Language": "en-US,en;q=0.9" },
  });
  const page = await context.newPage();
  await page.route("**/*.{woff,woff2,ttf,otf}", (r) => r.abort());

  try {
    await page.goto(`${origin}/`, { waitUntil: "load", timeout: 30_000 });
    await page.waitForTimeout(4_000);

    // Use the final URL's origin after any www-redirect so link filtering works correctly.
    const finalOrigin = new URL(page.url()).origin;

    // Prioritise nav/header links (most likely to contain inventory pages),
    // then fall back to all links on the page.
    const hrefs: string[] = await page.evaluate(() => {
      const navSels = [
        "nav a[href]", "header a[href]", "[role='navigation'] a[href]",
        ".nav a[href]", "#nav a[href]", ".menu a[href]", "#menu a[href]",
        ".header a[href]", "#header a[href]",
      ];
      const links = new Set<string>();
      for (const sel of navSels) {
        document.querySelectorAll(sel).forEach((el) =>
          links.add((el as HTMLAnchorElement).href),
        );
      }
      // Fallback: all links on the page
      if (links.size < 5) {
        document.querySelectorAll("a[href]").forEach((el) =>
          links.add((el as HTMLAnchorElement).href),
        );
      }
      return [...links];
    });

    for (const href of hrefs) {
      try {
        const parsed = new URL(href);
        // Accept links from the final origin (handles www redirects)
        if (!isSameOrWwwOrigin(parsed.origin, finalOrigin)) continue;
        if (!INVENTORY_PAGE_PATTERNS.some((p) => p.test(parsed.pathname))) continue;
        if (addUnique(href)) pages.push(parsed.href);
        if (pages.length >= 8) break;
      } catch { /* ignore unparseable hrefs */ }
    }

    console.log(`[discover-inventory] DOM extraction gave ${pages.length} page(s) total:`, pages);
    return pages.slice(0, 8);
  } catch {
    return pages;
  } finally {
    await context.close().catch(() => {});
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

  const originalUrl = url.startsWith("http") ? url : `https://${url}`;

  try {
    const waitUntil = channel === "website" ? "load" : "domcontentloaded";
    await page.goto(url, { waitUntil, timeout: 30_000 });

    if (channel === "website")   await page.waitForTimeout(4000);
    if (channel === "instagram") await page.waitForTimeout(4000);
    if (channel === "metaAds")   await page.waitForTimeout(5000);

    const finalUrl = page.url();
    const title = await page.title();

    if (await isChallengePage(page, finalUrl)) {
      console.log(`[playwright] Challenge page detected (title="${title}"), falling back to cloud → ${originalUrl}`);
      await context.close().catch(() => {});
      return captureViaCloud(originalUrl);
    }

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
    console.log(`[playwright] local failed (${msg.slice(0, 60)}), trying cloud → ${url}`);
    return captureViaCloud(url);
  } finally {
    await context.close().catch(() => {});
  }
}
