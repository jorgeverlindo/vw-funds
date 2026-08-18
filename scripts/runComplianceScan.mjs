// ─── DMP Compliance Full Scan Script ─────────────────────────────────────────
// Scans all configured dealerships (website channel only — most reliable).
// Calls the local compliance server at :3001 which already has the two-layer
// cache wired in: screenshots cached 7 days, analysis cached permanently.
//
// Outputs:
//   scripts/scan-results.json  — WCMItem array ready to inject into localStorage
//   scripts/scan-log.txt       — detailed per-dealer log for review
//
// Usage: node scripts/runComplianceScan.mjs

import { writeFileSync, appendFileSync, existsSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_BASE  = "http://localhost:3001";
const LOG_PATH  = join(__dirname, "scan-log.txt");
const OUT_PATH  = join(__dirname, "scan-results.json");

// ─── Dealerships (identical to DEFAULT_DEALERSHIPS in WebMonitoringConfigModal) ─

const DEALERSHIPS = [
  { id: "d-1",  name: "Jack Daniels Volkswagen",       website: "jackdanielsvw.com"       },
  { id: "d-2",  name: "Emich Volkswagen",               website: "emichvw.com"             },
  { id: "d-3",  name: "Volkswagen of Downtown LA",      website: "vwdtla.com"              },
  { id: "d-4",  name: "Jim Ellis Volkswagen",           website: "jimellisvw.com"          },
  { id: "d-5",  name: "Hendrick Volkswagen Frisco",     website: "hendrickvwfrisco.com"    },
  { id: "d-6",  name: "Volkswagen of Union",            website: "vwunion.com"             },
  { id: "d-7",  name: "Palisades Volkswagen",           website: "palisadesvw.com"         },
  { id: "d-8",  name: "Trend Motors Volkswagen",        website: "trendmotorsvw.com"       },
  { id: "d-9",  name: "Open Road Volkswagen Manhattan", website: "openroadvw.com"          },
  { id: "d-10", name: "Douglas Volkswagen",             website: "douglasvw.com"           },
];

// ─── WCMItem counter (deterministic, per-run sequential) ─────────────────────

let scanCounter = 1;
function nextScanId() {
  return `SCN-${String(scanCounter++).padStart(5, "0")}`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  appendFileSync(LOG_PATH, line + "\n");
}

function buildWCMItem(violation, dealershipName, pageUrl, screenshotBase64, screenshotMimeType) {
  const dateStr = new Date().toLocaleDateString("en-US", {
    month: "short", day: "2-digit", year: "numeric",
  });
  return {
    id: nextScanId(),
    detectedOn: dateStr,
    dealership: dealershipName,
    violationType: violation.ruleName,
    source: "Web Monitoring",
    url: pageUrl,
    severity: violation.category === "A" ? "High" : "Medium",
    status: "Open",
    screenshotDataUrl: `data:${screenshotMimeType};base64,${screenshotBase64}`,
    createdAtISO: new Date().toISOString(),
    comments: `[${violation.ruleCode}] ${violation.description}${
      violation.quotedText ? ` — Found text: "${violation.quotedText}"` : ""
    }`,
    pins: [{
      title: violation.ruleName,
      description: violation.description,
      x: violation.pinX ?? 50,
      y: violation.pinY ?? 10,
      direction: violation.pinDirection ?? "top-right",
      category: violation.category,
      ruleNumber: violation.ruleCode.replace(/^CAT-[AB]-/, ""),
    }],
  };
}

// ─── Per-dealer scan ──────────────────────────────────────────────────────────

async function scanDealer(dealer) {
  const items = [];

  log(`── Scanning ${dealer.name} (website) …`);

  // Step 1: Screenshot
  let shotResult;
  try {
    const res = await fetch(`${API_BASE}/api/compliance/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dealershipName: dealer.name,
        channel: "website",
        urlOrHandle: dealer.website,
      }),
    });
    shotResult = await res.json();
  } catch (err) {
    log(`  ✗ FETCH ERROR – ${err.message}`);
    return items;
  }

  if ("error" in shotResult) {
    log(`  ✗ Screenshot failed: ${shotResult.error}`);
    return items;
  }

  const { screenshotBase64, screenshotMimeType, pageTitle, pageUrl } = shotResult;
  log(`  ✓ Screenshot OK – title="${pageTitle}" url=${pageUrl} size=${screenshotBase64.length}`);

  // Bot-protection heuristic: if the screenshot is tiny, it's probably a challenge page
  if (screenshotBase64.length < 5000) {
    log(`  ⚠ Screenshot suspiciously small (${screenshotBase64.length} chars) — likely bot page, skipping analysis`);
    return items;
  }

  // Step 2: Claude analysis
  let violations;
  try {
    const res = await fetch(`${API_BASE}/api/compliance/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        screenshotBase64,
        screenshotMimeType,
        channel: "website",
        dealershipName: dealer.name,
        pageUrl,
      }),
    });
    const data = await res.json();
    violations = data.violations ?? [];
  } catch (err) {
    log(`  ✗ Analyze error: ${err.message}`);
    return items;
  }

  // Only high confidence for the demo
  const highConf = violations.filter((v) => v.confidence === "high");
  log(`  → ${violations.length} violations total, ${highConf.length} HIGH confidence`);

  for (const v of highConf) {
    log(`    [${v.ruleCode}] ${v.ruleName} — ${v.description.slice(0, 80)}`);
    items.push(buildWCMItem(v, dealer.name, pageUrl, screenshotBase64, screenshotMimeType));
  }

  return items;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

if (existsSync(LOG_PATH)) unlinkSync(LOG_PATH);

log("═══════════════════════════════════════════════════════");
log("VW DMP Compliance Full Scan — website channel");
log(`Dealerships: ${DEALERSHIPS.length}`);
log("═══════════════════════════════════════════════════════");

const allItems = [];

for (const dealer of DEALERSHIPS) {
  const items = await scanDealer(dealer);
  allItems.push(...items);
  // Small pause between dealers to avoid hammering the browser/playwright
  await new Promise((r) => setTimeout(r, 1000));
}

log("═══════════════════════════════════════════════════════");
log(`SCAN COMPLETE — ${allItems.length} high-confidence infraction(s) found across ${DEALERSHIPS.length} dealerships`);
log("═══════════════════════════════════════════════════════");

for (const item of allItems) {
  log(`  ${item.id} | ${item.dealership} | ${item.violationType} | ${item.severity}`);
}

writeFileSync(OUT_PATH, JSON.stringify(allItems, null, 2));
log(`Results written to ${OUT_PATH}`);
log(`Log written to ${LOG_PATH}`);

console.log("\n");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`  Total infractions: ${allItems.length}`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
