import "dotenv/config";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";
import { agentTools, executeTool } from "./tools.js";
import { buildSystemPrompt, type ProjectContext } from "./system-prompt.js";
import { captureScreenshot, discoverUsedCarLinks, discoverInventoryPages } from "./playwright.js";
import { buildDmpPrompt, type ScanChannel } from "./dmpPrompt.js";
import {
  getCachedScreenshot,
  setCachedScreenshot,
  getCachedAnalysis,
  setCachedAnalysis,
  getScreenshotHash,
  getScreenshotFilePath,
  getCachedScreenshotHash,
  readScreenshotIndex,
  type ScanViolation,
} from "./cache/complianceCache.js";
import { readInfractions, writeInfractions, type StoredInfraction } from "./cache/infractionStore.js";

// ─── App ──────────────────────────────────────────────────────────────────────

const app = new Hono();

app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get("/api/health", (c) => c.json({ ok: true, ts: Date.now() }));

// ─── Agent Streaming Endpoint ─────────────────────────────────────────────────

app.post("/api/agent/stream", async (c) => {
  console.log(`[stream] ${new Date().toISOString()} – request received`);
  const apiKey = process.env.ANTHROPIC_KEY;
  if (!apiKey) {
    return c.json({ error: "ANTHROPIC_KEY not set in environment" }, 500);
  }

  let body: { messages: Anthropic.MessageParam[]; projectContext: ProjectContext };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { messages, projectContext } = body;
  const anthropic = new Anthropic({ apiKey });

  // Build the SSE ReadableStream
  const readable = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();

      const send = (payload: unknown) => {
        controller.enqueue(enc.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      try {
        let currentMessages: Anthropic.MessageParam[] = [...messages];
        let iterations = 0;
        const MAX_ITERATIONS = 8;

        while (iterations < MAX_ITERATIONS) {
          iterations++;

          // ── Start streaming turn ────────────────────────────────────────────
          const streamRunner = anthropic.messages.stream({
            model: "claude-sonnet-4-5",
            max_tokens: 2048,
            system: buildSystemPrompt(projectContext),
            tools: agentTools,
            messages: currentMessages,
          });

          // Stream text deltas as they arrive
          streamRunner.on("text", (text) => {
            send({ type: "text_delta", delta: text });
          });

          // Wait for the full message
          const finalMessage = await streamRunner.finalMessage();

          // ── Check stop reason ───────────────────────────────────────────────
          if (
            finalMessage.stop_reason === "end_turn" ||
            finalMessage.stop_reason === "stop_sequence" ||
            finalMessage.stop_reason !== "tool_use"
          ) {
            break;
          }

          // ── Handle tool use ─────────────────────────────────────────────────
          const toolUseBlocks = finalMessage.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
          );

          if (toolUseBlocks.length === 0) break;

          // Proposal tools hand control back to the UI — the user confirms before
          // the next step fires via sendInternal(). Do NOT loop again after these.
          const PROPOSAL_TOOLS = new Set([
            "setup_project", "propose_offers", "propose_templates",
            "propose_backgrounds", "propose_brand", "propose_project",
            "propose_email",
          ]);

          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          let hasProposalTool = false;

          for (const toolBlock of toolUseBlocks) {
            console.log(`[tool] ${toolBlock.name}`, JSON.stringify(toolBlock.input).slice(0, 120));
            if (PROPOSAL_TOOLS.has(toolBlock.name)) hasProposalTool = true;

            // Notify client that a tool is being called
            send({
              type: "tool_use",
              id: toolBlock.id,
              name: toolBlock.name,
              input: toolBlock.input,
            });

            // Execute the tool (server-side validation + mock execution)
            const result = executeTool(
              toolBlock.name,
              toolBlock.input as Record<string, unknown>,
            );

            // Notify client of the result (triggers UI card render)
            send({
              type: "tool_result",
              name: toolBlock.name,
              input: toolBlock.input,
              result,
            });

            toolResults.push({
              type: "tool_result",
              tool_use_id: toolBlock.id,
              content: JSON.stringify(result),
            });
          }

          // Proposal tools: stop here — the wizard continues when the user confirms
          if (hasProposalTool) break;

          // Direct-action tools: append turn + results and let Claude respond
          currentMessages = [
            ...currentMessages,
            { role: "assistant", content: finalMessage.content },
            { role: "user", content: toolResults },
          ];
        }

        send({ type: "done" });
      } catch (err) {
        console.error("[agent stream error]", err);
        send({ type: "error", message: String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
});

// ─── Offer Extraction Endpoint ───────────────────────────────────────────────
// Dedicated endpoint with a single tool + forced tool_choice.
// The model MUST call propose_parsed_offers — no text output possible.

const extractTool: Anthropic.Tool = {
  name: "propose_parsed_offers",
  description:
    "Extract every vehicle offer visible in the image or document and return them as structured rows. " +
    "You MUST call this tool — it is your only available action.",
  input_schema: {
    type: "object" as const,
    properties: {
      source:           { type: "string", description: "Brief description of the source, e.g. 'Toyota May 2026 rate sheet'." },
      offers: {
        type: "array",
        description: "All offer rows extracted from the document.",
        items: {
          type: "object",
          properties: {
            id:              { type: "string" },
            year:            { type: "string" },
            make:            { type: "string" },
            model:           { type: "string" },
            trim:            { type: "string" },
            offer_type:      { type: "string", description: "'Lease', 'Finance', or 'Purchase'." },
            monthly_payment: { type: "string" },
            term:            { type: "string" },
            due_at_signing:  { type: "string" },
            apr:             { type: "string" },
            notes:           { type: "string" },
            confidence_monthly_payment: { type: "string" },
            confidence_term:            { type: "string" },
            confidence_due_at_signing:  { type: "string" },
            confidence_trim:            { type: "string" },
            confidence_year:            { type: "string" },
            confidence_apr:             { type: "string" },
          },
          required: ["id", "year", "make", "model", "offer_type", "monthly_payment", "term"],
        },
      },
      extraction_notes: { type: "string" },
    },
    required: ["source", "offers"],
  },
};

app.post("/api/agent/extract", async (c) => {
  console.log(`[extract] ${new Date().toISOString()} – request received`);
  const apiKey = process.env.ANTHROPIC_KEY;
  if (!apiKey) return c.json({ error: "ANTHROPIC_KEY not set" }, 500);

  let body: { messages: Anthropic.MessageParam[] };
  try { body = await c.req.json(); } catch { return c.json({ error: "Invalid JSON" }, 400); }

  const anthropic = new Anthropic({ apiKey });

  const readable = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (payload: unknown) =>
        controller.enqueue(enc.encode(`data: ${JSON.stringify(payload)}\n\n`));
      try {
        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-5",
          max_tokens: 8192,
          system:
            "You are an offer extraction assistant. Your ONLY job is to extract every vehicle offer row " +
            "from the provided image or document and return them via the propose_parsed_offers tool.\n\n" +
            "EXTRACTION RULES:\n" +
            "- Extract EVERY row in the document — do not skip any, even partial rows.\n" +
            "- If the document is a rate sheet with residuals and money factors (not final payments), " +
            "still extract each row: put the money factor or rate in the 'apr' field, put the residual " +
            "percentage in the 'notes' field, and set monthly_payment to '0' with confidence 'low'.\n" +
            "- If monthly payment is shown, extract it exactly as written.\n" +
            "- For 'offer_type': use 'Lease' for lease/residual/money factor rows, 'Finance' for APR/loan " +
            "rows, 'Purchase' for cash/purchase rows.\n" +
            "- For each field, set confidence: 'high' = clearly visible, 'medium' = partially legible, " +
            "'low' = inferred or not shown.\n" +
            "- If a field is not present in the document, omit it or use an empty string — never fabricate values.\n" +
            "- Assign sequential IDs: p1, p2, p3, etc.\n" +
            "- Do NOT write any text — call the tool immediately.",
          tools: [extractTool],
          tool_choice: { type: "tool", name: "propose_parsed_offers" },
          messages: body.messages,
        });
        const toolBlock = response.content.find(
          (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
        );
        if (toolBlock) {
          const inp = toolBlock.input as { source?: string; offers?: unknown[]; extraction_notes?: string };
          console.log(`[extract] ✓ ${inp.offers?.length ?? 0} offers extracted — stop=${response.stop_reason} out_tokens=${response.usage.output_tokens}`);
          send({ type: "tool_result", name: toolBlock.name, input: toolBlock.input });
        } else {
          send({ type: "error", message: "No offers extracted." });
        }
        send({ type: "done" });
      } catch (err) {
        console.error("[extract error]", err);
        send({ type: "error", message: String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
});

// ─── DMP Compliance: Screenshot Capture ──────────────────────────────────────
// GET /api/compliance/demo-asset/:name
// Reads a local demo screenshot file, converts to base64, returns as ScreenshotResult.
// Skips the analysis cache so Claude re-analyses the image fresh each time.
// Supported names: "emich-used-cars"

const __dirname_server = dirname(fileURLToPath(import.meta.url));

const DEMO_ASSETS: Record<string, { path: string; pageUrl: string; pageTitle: string }> = {
  "emich-used-cars": {
    path: join(__dirname_server, "../guidelines/Infractions/Emich_Used-Cars-Trucks-SUVs-for-Sale-in-Denver-CO-Emich-Volkswagen-near-Aurora-08-17-2026_01_58_PM.png"),
    pageUrl: "https://www.emichvw.com/used-cars/",
    pageTitle: "Used Cars, Trucks & SUVs for Sale in Denver, CO | Emich Volkswagen",
  },
};

app.get("/api/compliance/demo-asset/:name", (c) => {
  const name = c.req.param("name");
  const asset = DEMO_ASSETS[name];
  if (!asset) return c.json({ error: `Unknown demo asset: ${name}` }, 404);

  try {
    const buf = readFileSync(asset.path);
    const screenshotBase64 = buf.toString("base64");
    console.log(`[demo-asset] serving ${name} — ${(buf.length / 1024).toFixed(0)} KB`);

    // Cache the binary under pageUrl so screenshotHash backfill works on reload
    const screenshotMimeType = "image/png" as const;
    const hash = setCachedScreenshot(asset.pageUrl, "website", {
      screenshotBase64,
      screenshotMimeType,
      pageTitle: asset.pageTitle,
      pageUrl: asset.pageUrl,
    });

    return c.json({
      screenshotBase64,
      screenshotMimeType,
      pageTitle: asset.pageTitle,
      pageUrl: asset.pageUrl,
      screenshotHash: hash,
    });
  } catch (err) {
    console.error("[demo-asset] read error:", err);
    return c.json({ error: "File not found" }, 404);
  }
});

// POST /api/compliance/discover-used  (kept for backward compat)
// POST /api/compliance/discover-inventory (preferred — includes new + used + specials)
// Body: { urlOrHandle }
// Returns: { urls: string[] } — internal links matching inventory/offers patterns

app.post("/api/compliance/discover-used", async (c) => {
  let body: { urlOrHandle?: string };
  try { body = await c.req.json(); } catch { return c.json({ urls: [] }); }
  const raw = body.urlOrHandle?.trim() ?? "";
  if (!raw) return c.json({ urls: [] });
  const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const urls = await discoverUsedCarLinks(url);
  return c.json({ urls });
});

app.post("/api/compliance/discover-inventory", async (c) => {
  let body: { urlOrHandle?: string };
  try { body = await c.req.json(); } catch { return c.json({ urls: [] }); }

  const raw = body.urlOrHandle?.trim() ?? "";
  if (!raw) return c.json({ urls: [] });

  const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  console.log(`[compliance/discover-inventory] crawling ${url}`);
  const urls = await discoverInventoryPages(url);
  console.log(`[compliance/discover-inventory] found ${urls.length} page(s):`, urls);
  return c.json({ urls });
});

// GET /api/compliance/screenshot/:hash
// Serves a cached screenshot binary by its SHA-256 hash.
// This lets the client reference screenshots without storing large base64 in
// localStorage/IndexedDB — avoiding stale-ID bugs across scan runs.

app.get("/api/compliance/screenshot/:hash", (c) => {
  const hash = c.req.param("hash");
  if (!/^[a-f0-9]{64}$/.test(hash)) return c.json({ error: "Invalid hash" }, 400);
  const found = getScreenshotFilePath(hash);
  if (!found) return c.json({ error: "Not found" }, 404);
  const data = readFileSync(found.path);
  c.header("Content-Type", found.mimeType);
  c.header("Cache-Control", "public, max-age=604800, immutable");
  return c.body(data as unknown as ReadableStream);
});

// POST /api/compliance/screenshot-hash
// Body: { url, channel }
// Returns: { hash } — looks up hash for existing cached screenshot by URL+channel.
// Used to backfill screenshotHash on existing WCMItems that were created before
// this field existed.

app.post("/api/compliance/screenshot-hash", async (c) => {
  let body: { url?: string; channel?: string };
  try { body = await c.req.json(); } catch { return c.json({ error: "Invalid JSON" }, 400); }
  const { url, channel } = body;
  if (!url || !channel) return c.json({ error: "url and channel are required" }, 400);
  const hash = getCachedScreenshotHash(url, channel);
  return c.json({ hash });
});

// POST /api/compliance/scan
// Body: { dealershipName, channel, urlOrHandle }
// Returns: ScreenshotResult | ScreenshotError (plus screenshotHash for server-side lookup)

app.post("/api/compliance/scan", async (c) => {
  const apiKey = process.env.ANTHROPIC_KEY;
  if (!apiKey) return c.json({ error: "ANTHROPIC_KEY not set" }, 500);

  let body: { dealershipName?: string; channel?: string; urlOrHandle?: string };
  try { body = await c.req.json(); } catch { return c.json({ error: "Invalid JSON" }, 400); }

  const { dealershipName, channel, urlOrHandle } = body;
  if (!channel || !urlOrHandle) return c.json({ error: "channel and urlOrHandle are required" }, 400);

  // Resolve handle → full URL
  let url = urlOrHandle.trim();
  if (channel === "instagram") {
    const handle = url.replace(/^@/, "");
    url = `https://www.instagram.com/${handle}/`;
  } else if (channel === "metaAds") {
    const q = url.replace(/^@/, "");
    url = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&is_targeted_country=false&media_type=all&q=${encodeURIComponent(q)}&search_type=keyword_unordered&sort_data[direction]=desc&sort_data[mode]=total_impressions`;
  } else if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  // Layer 1 cache check
  const cachedShot = getCachedScreenshot(url, channel);
  if (cachedShot) {
    console.log(`[compliance/scan] cache HIT – ${channel} – ${dealershipName}`);
    const hash = getScreenshotHash(cachedShot.screenshotBase64);
    return c.json({ ...cachedShot, screenshotHash: hash });
  }

  console.log(`[compliance/scan] cache MISS – ${channel} – ${dealershipName} – ${url}`);
  const result = await captureScreenshot(url, channel);

  if (!("error" in result)) {
    const hash = setCachedScreenshot(url, channel, result);
    return c.json({ ...result, screenshotHash: hash });
  }

  return c.json(result);
});

// ─── DMP Compliance: Claude Vision Analysis ───────────────────────────────────
// POST /api/compliance/analyze
// Body: { screenshotBase64, screenshotMimeType, channel, dealershipName, pageUrl }
// Returns: { violations: ScanViolation[] }

app.post("/api/compliance/analyze", async (c) => {
  const apiKey = process.env.ANTHROPIC_KEY;
  if (!apiKey) return c.json({ error: "ANTHROPIC_KEY not set" }, 500);

  let body: {
    screenshotBase64?: string;
    screenshotMimeType?: string;
    channel?: string;
    dealershipName?: string;
    pageUrl?: string;
    skipCache?: boolean;
  };
  try { body = await c.req.json(); } catch { return c.json({ error: "Invalid JSON" }, 400); }

  const { screenshotBase64, screenshotMimeType = "image/jpeg", channel, dealershipName = "", pageUrl = "", skipCache = false } = body;
  if (!screenshotBase64 || !channel) return c.json({ error: "screenshotBase64 and channel are required" }, 400);

  // Layer 2 cache check — keyed by SHA-256 of the screenshot pixels
  const screenshotHash = getScreenshotHash(screenshotBase64);
  if (!skipCache) {
    const cachedViolations = getCachedAnalysis(screenshotHash);
    if (cachedViolations !== null) {
      console.log(`[compliance/analyze] cache HIT – ${dealershipName} – ${cachedViolations.length} violation(s)`);
      return c.json({ violations: cachedViolations });
    }
  }

  const prompt = buildDmpPrompt(channel as ScanChannel, dealershipName, pageUrl);
  const anthropic = new Anthropic({ apiKey });
  const MODEL = "claude-opus-4-6";

  console.log(`[compliance/analyze] cache MISS – ${channel} – ${dealershipName}`);

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: screenshotMimeType as "image/jpeg" | "image/png",
                data: screenshotBase64,
              },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    });

    const rawText =
      response.content[0]?.type === "text" ? response.content[0].text.trim() : "[]";

    const match = rawText.match(/\[[\s\S]*\]/);
    let violations: ScanViolation[] = [];
    if (match) {
      try { violations = JSON.parse(match[0]); } catch { violations = []; }
    }

    violations = violations.filter((v) => v.confidence !== "low");

    // Store in cache so future calls with the same screenshot skip Claude entirely
    setCachedAnalysis(screenshotHash, violations, { model: MODEL, dealershipName, pageUrl, channel });

    console.log(`[compliance/analyze] ✓ ${violations.length} violation(s) – tokens: ${response.usage.output_tokens}`);
    return c.json({ violations });
  } catch (err) {
    console.error("[compliance/analyze error]", err);
    return c.json({ error: String(err) }, 500);
  }
});

// ─── Helpers for infraction store ────────────────────────────────────────────

interface DealerEntry {
  id: string;
  name: string;
  website: string;
  instagram: string;
  metaAds: string;
}

function buildMetaAdsUrl(query: string): string {
  return `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&is_targeted_country=false&media_type=all&q=${encodeURIComponent(query)}&search_type=keyword_unordered&sort_data[direction]=desc&sort_data[mode]=total_impressions`;
}

function buildInfractionItem(
  violations: ScanViolation[],
  dealershipName: string,
  pageUrl: string,
  channel: "website" | "metaAds",
  screenshotHash: string,
): StoredInfraction {
  const ruleNums = violations.map((v) => v.ruleCode.replace(/^CAT-[AB]-/i, ""));
  const descriptions = violations.map((v) =>
    v.ruleName.replace(/^Rule\s+[\w\d]+\s*[–—-]\s*/i, ""),
  );
  const violationType =
    violations.length === 1
      ? violations[0].ruleName
      : `Rules ${ruleNums.join(", ")} — ${descriptions.join("; ")}`;
  const hasAnyCatA = violations.some((v) => v.category === "A");
  const now = new Date();
  return {
    id: `SCN-${screenshotHash.slice(0, 6).toUpperCase()}`,
    detectedOn: now.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
    dealership: dealershipName,
    violationType,
    source: "Web Monitoring",
    url: pageUrl.startsWith("http") ? pageUrl : `https://${pageUrl}`,
    severity: hasAnyCatA ? "High" : "Medium",
    status: "Open",
    channel,
    comments: violations
      .map(
        (v, i) =>
          `${i + 1}. [${v.ruleCode}] ${v.ruleName} — ${v.description}${v.quotedText ? ` Found: "${v.quotedText}"` : ""}`,
      )
      .join("\n"),
    screenshotHash,
    createdAtISO: now.toISOString(),
    lifecycleStatus: "DETECTED",
    pins: violations.map((v) => ({
      title: v.ruleName,
      description: v.description,
      x: v.pinX ?? 50,
      y: v.pinY ?? 10,
      direction: v.pinDirection ?? "top-right",
      category: v.category,
      ruleNumber: v.ruleCode.replace(/^CAT-[AB]-/i, ""),
    })),
  };
}

async function analyzeWithClaude(
  anthropic: Anthropic,
  shot: { screenshotBase64: string; screenshotMimeType: "image/jpeg" | "image/png"; pageUrl: string },
  channel: string,
  dealershipName: string,
): Promise<ScanViolation[]> {
  const screenshotHash = getScreenshotHash(shot.screenshotBase64);
  const cached = getCachedAnalysis(screenshotHash);
  if (cached !== null) return cached;

  const prompt = buildDmpPrompt(channel as ScanChannel, dealershipName, shot.pageUrl);
  const MODEL = "claude-opus-4-6";

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: shot.screenshotMimeType, data: shot.screenshotBase64 } },
        { type: "text", text: prompt },
      ],
    }],
  });

  const rawText = response.content[0]?.type === "text" ? response.content[0].text.trim() : "[]";
  const match = rawText.match(/\[[\s\S]*\]/);
  let violations: ScanViolation[] = [];
  if (match) { try { violations = JSON.parse(match[0]); } catch { violations = []; } }
  violations = violations.filter((v) => v.confidence !== "low");

  setCachedAnalysis(screenshotHash, violations, { model: MODEL, dealershipName, pageUrl: shot.pageUrl, channel });
  return violations;
}

// ─── Infraction persistence endpoints ────────────────────────────────────────

// GET /api/compliance/infractions — returns persisted WCMItems
app.get("/api/compliance/infractions", (c) => {
  return c.json({ items: readInfractions() });
});

// PUT /api/compliance/infractions — replaces entire list (client sync)
app.put("/api/compliance/infractions", async (c) => {
  let body: { items?: unknown[] };
  try { body = await c.req.json(); } catch { return c.json({ error: "Invalid JSON" }, 400); }
  if (!Array.isArray(body.items)) return c.json({ error: "items array required" }, 400);
  writeInfractions(body.items as StoredInfraction[]);
  return c.json({ ok: true, count: body.items.length });
});

// POST /api/compliance/rebuild-infractions
// Rebuilds the infraction list from cache + runs Playwright+Claude for any gaps.
// Body: { dealers: DealerEntry[] }
// Only adds items whose screenshotHash is not already in the store — preserves lifecycle state.
app.post("/api/compliance/rebuild-infractions", async (c) => {
  const apiKey = process.env.ANTHROPIC_KEY;
  if (!apiKey) return c.json({ error: "ANTHROPIC_KEY not set" }, 500);

  let body: { dealers?: DealerEntry[] };
  try { body = await c.req.json(); } catch { return c.json({ error: "Invalid JSON" }, 400); }
  const dealers = body.dealers ?? [];
  if (!dealers.length) return c.json({ error: "dealers array required" }, 400);

  const anthropic = new Anthropic({ apiKey });
  const screenshotIndex = readScreenshotIndex();
  const existing = readInfractions();
  const existingHashes = new Set(existing.map((i) => i.screenshotHash).filter(Boolean));

  const newItems: StoredInfraction[] = [];
  const log: string[] = [];

  for (const dealer of dealers) {
    const websiteDomain = dealer.website.trim()
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./, "")
      .replace(/\/$/, "");
    const metaHandle = dealer.metaAds.trim();

    // ── Website: find all cached screenshot entries for this domain ──────────
    const websiteEntries = Object.entries(screenshotIndex).filter(([key, entry]) => {
      if (entry.channel !== "website") return false;
      const keyDomain = key
        .replace(/^website::https?:\/\//i, "")
        .replace(/^www\./, "")
        .split("/")[0];
      return keyDomain === websiteDomain;
    });

    if (websiteEntries.length > 0) {
      for (const [, entry] of websiteEntries) {
        if (existingHashes.has(entry.hash)) {
          log.push(`  SKIP ${dealer.name} website — already stored (${entry.hash.slice(0, 8)})`);
          continue;
        }
        let violations = getCachedAnalysis(entry.hash);
        if (violations === null) {
          // Screenshot cached but not analyzed — load binary + analyze
          const pageUrlKey = Object.keys(screenshotIndex).find((k) => screenshotIndex[k].hash === entry.hash);
          if (pageUrlKey) {
            const urlPart = pageUrlKey.replace(/^website::/, "");
            const shot = getCachedScreenshot(urlPart, "website");
            if (shot) {
              log.push(`  ANALYZE ${dealer.name} website — running Claude (no analysis cache)`);
              violations = await analyzeWithClaude(anthropic, shot, "website", dealer.name);
            }
          }
        }
        if (!violations || violations.length === 0) {
          log.push(`  OK   ${dealer.name} website — 0 violations (${entry.pageUrl})`);
          continue;
        }
        const pageUrl = entry.pageUrl.startsWith("http") ? entry.pageUrl : `https://${entry.pageUrl}`;
        newItems.push(buildInfractionItem(violations, dealer.name, pageUrl, "website", entry.hash));
        log.push(`  ADD  ${dealer.name} website — ${violations.length} violation(s) (${pageUrl})`);
      }
    } else {
      // No cached screenshot — run Playwright
      const websiteUrl = /^https?:\/\//i.test(dealer.website) ? dealer.website.trim() : `https://${dealer.website.trim()}`;
      log.push(`  SCAN ${dealer.name} website (no cache) — ${websiteUrl}`);
      const shot = await captureScreenshot(websiteUrl, "website");
      if (!("error" in shot)) {
        const hash = setCachedScreenshot(websiteUrl, "website", shot);
        if (!existingHashes.has(hash)) {
          const violations = await analyzeWithClaude(anthropic, shot, "website", dealer.name);
          if (violations.length > 0) {
            newItems.push(buildInfractionItem(violations, dealer.name, shot.pageUrl, "website", hash));
            log.push(`  ADD  ${dealer.name} website (fresh) — ${violations.length} violation(s)`);
          }
        }
      } else {
        log.push(`  ERR  ${dealer.name} website — ${shot.error}`);
      }
    }

    // ── MetaAds ───────────────────────────────────────────────────────────────
    if (metaHandle) {
      const metaUrl = buildMetaAdsUrl(metaHandle);
      const metaHash = getCachedScreenshotHash(metaUrl, "metaAds");

      if (metaHash) {
        if (existingHashes.has(metaHash)) {
          log.push(`  SKIP ${dealer.name} metaAds — already stored (${metaHash.slice(0, 8)})`);
        } else {
          let violations = getCachedAnalysis(metaHash);
          if (violations === null) {
            const shot = getCachedScreenshot(metaUrl, "metaAds");
            if (shot) {
              log.push(`  ANALYZE ${dealer.name} metaAds — running Claude (no analysis cache)`);
              violations = await analyzeWithClaude(anthropic, shot, "metaAds", dealer.name);
            }
          }
          if (violations && violations.length > 0) {
            const indexEntry = screenshotIndex[`metaAds::${metaUrl}`];
            const pageUrl = indexEntry?.pageUrl ?? metaUrl;
            newItems.push(buildInfractionItem(violations, dealer.name, pageUrl, "metaAds", metaHash));
            log.push(`  ADD  ${dealer.name} metaAds — ${violations.length} violation(s)`);
          } else {
            log.push(`  OK   ${dealer.name} metaAds — 0 violations`);
          }
        }
      } else {
        // No cached screenshot — run Playwright + Claude
        log.push(`  SCAN ${dealer.name} metaAds (no cache) — "${metaHandle}"`);
        const shot = await captureScreenshot(metaUrl, "metaAds");
        if (!("error" in shot)) {
          const hash = setCachedScreenshot(metaUrl, "metaAds", shot);
          if (!existingHashes.has(hash)) {
            const violations = await analyzeWithClaude(anthropic, shot, "metaAds", dealer.name);
            if (violations.length > 0) {
              newItems.push(buildInfractionItem(violations, dealer.name, shot.pageUrl, "metaAds", hash));
              log.push(`  ADD  ${dealer.name} metaAds (fresh) — ${violations.length} violation(s)`);
            } else {
              log.push(`  OK   ${dealer.name} metaAds (fresh) — 0 violations`);
            }
          }
        } else {
          log.push(`  ERR  ${dealer.name} metaAds — ${shot.error}`);
        }
      }
    }
  }

  const merged = [...existing, ...newItems];
  writeInfractions(merged);

  console.log("[rebuild-infractions] complete:");
  log.forEach((l) => console.log(l));
  console.log(`[rebuild-infractions] ${newItems.length} new items added; ${merged.length} total`);

  return c.json({ items: merged, newCount: newItems.length, totalCount: merged.length, log });
});

// ─── Send WCM Report via Resend ───────────────────────────────────────────────

interface WCMReportInfraction {
  id: string;
  dealership: string;
  violationType: string;
  channel?: string;
  severity?: string;
  url?: string;
  detectedOn?: string;
}

const WCM_RECIPIENTS = [
  { name: "Olivia Rivers",  email: "olivia.rivers@helloconstellation.com" },
  { name: "Marcos Chen",    email: "marcos.chen@helloconstellation.com" },
  { name: "Jorge Verlindo", email: "jorge.verlindo@helloconstellation.com" },
];

const APP_URL = "https://constellation-ux-app.vercel.app";

function buildWcmEmailHtml(infractions: WCMReportInfraction[], recipientName: string, date: string): string {
  const greeting = `Hi ${recipientName},`;
  const channelLabel = (ch?: string) =>
    ch === "metaAds" ? "Meta Ads" : ch === "website" ? "Website" : ch ?? "—";
  const channelColor = (ch?: string) =>
    ch === "metaAds" ? "#1877F2" : "#473bab";
  const severityColor = (s?: string) =>
    s === "High" ? "#d42727" : s === "Medium" ? "#d47700" : "#686576";

  const infractionRows = infractions.map((item) => {
    const complianceUrl = `${APP_URL}/campaigns/funds/compliance`;
    const channel = channelLabel(item.channel);
    const chColor = channelColor(item.channel);
    const sevColor = severityColor(item.severity);
    return `
    <tr>
      <td style="padding:12px 14px;border-bottom:1px solid #ece9f5;vertical-align:top;">
        <p style="margin:0 0 2px;font-size:13px;font-weight:600;color:#1f1d25;font-family:Helvetica,Arial,sans-serif;">${item.dealership}</p>
        <span style="display:inline-block;background:#f0eff4;border-radius:5px;padding:2px 7px;font-size:11px;color:#686576;font-family:Helvetica,Arial,sans-serif;margin-top:2px;">${item.id}</span>
      </td>
      <td style="padding:12px 14px;border-bottom:1px solid #ece9f5;vertical-align:top;font-size:12px;color:#1f1d25;font-family:Helvetica,Arial,sans-serif;line-height:1.5;">
        ${item.violationType}
      </td>
      <td style="padding:12px 14px;border-bottom:1px solid #ece9f5;vertical-align:middle;white-space:nowrap;">
        <span style="display:inline-block;background:${chColor}18;color:${chColor};border-radius:5px;padding:3px 8px;font-size:11px;font-weight:600;font-family:Helvetica,Arial,sans-serif;">${channel}</span>
      </td>
      <td style="padding:12px 14px;border-bottom:1px solid #ece9f5;vertical-align:middle;white-space:nowrap;">
        <span style="font-size:11px;font-weight:700;color:${sevColor};font-family:Helvetica,Arial,sans-serif;">${item.severity ?? "—"}</span>
      </td>
      <td style="padding:12px 14px;border-bottom:1px solid #ece9f5;vertical-align:middle;text-align:center;">
        <a href="${complianceUrl}" style="display:inline-block;text-decoration:none;line-height:0;" title="View in platform">
          <img src="https://res.cloudinary.com/dvq75cqna/image/upload/v1787065626/_open__jy1rhc.svg" width="16" height="16" alt="View" style="display:block;border:0;" />
        </a>
      </td>
    </tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <title>Web Monitoring Report — ${date}</title>
  <style>
    .em-meta-label { padding:8px 14px; font-size:12px; color:#8f8c9c; font-family:Helvetica,Arial,sans-serif; white-space:nowrap; border-bottom:1px solid #ece9f5; width:140px; }
    .em-meta-val   { padding:8px 14px; font-size:12px; color:#1f1d25; font-family:Helvetica,Arial,sans-serif; font-weight:500; border-bottom:1px solid #ece9f5; }
    @media (prefers-color-scheme: dark) {
      body, .em-outer { background: #13121e !important; }
      .em-card       { background: #1e1c2e !important; box-shadow: 0 1px 6px rgba(0,0,0,.4) !important; }
      .em-label      { color: #7370a0 !important; }
      .em-title      { color: #f0eff8 !important; }
      .em-oem        { color: #9d9ab5 !important; }
      .em-divider    { border-top-color: rgba(255,255,255,0.08) !important; }
      .em-greeting   { color: #d8d6eb !important; }
      .em-body-text  { color: #b8b5d0 !important; }
      .em-footer     { color: #6b6885 !important; }
      .em-footer a   { color: #6b6885 !important; }
      .em-th         { background: #2a2840 !important; color: #9d9ab5 !important; border-bottom-color: rgba(255,255,255,0.06) !important; }
      .em-tr td      { border-bottom-color: rgba(255,255,255,0.06) !important; color: #d8d6eb !important; }
      .em-pill-id    { background: #2a2840 !important; color: #9d9ab5 !important; }
      .em-logo-light { display: none !important; max-height: 0 !important; overflow: hidden !important; }
      .em-logo-dark  { display: block !important; max-height: none !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f5f4f9;" class="em-outer">
<table width="100%" cellpadding="0" cellspacing="0" class="em-outer"
       style="background:#f5f4f9;padding:40px 16px;">
  <tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

    <!-- Logo: dark mark for light mode, white mark for dark mode -->
    <tr>
      <td style="padding:0 0 24px;text-align:center;">
        <img class="em-logo-light" src="${APP_URL}/constellation-logo-2024.svg"
             height="33" alt="Constellation"
             style="display:block;margin:0 auto;height:33px;border:0;" />
        <img class="em-logo-dark" src="${APP_URL}/constellation-logo-white.svg"
             height="33" alt="Constellation"
             style="display:none;max-height:0;overflow:hidden;height:33px;border:0;margin:0 auto;" />
      </td>
    </tr>

    <!-- Card -->
    <tr>
      <td class="em-card" style="background:#ffffff;border-radius:20px;padding:36px 40px;
          box-shadow:0 1px 6px rgba(71,59,171,0.10),0 4px 24px rgba(71,59,171,0.06);">

        <!-- Label + Title -->
        <p class="em-label" style="margin:0 0 8px;font-size:12px;font-weight:600;color:#8f8c9c;
            text-transform:uppercase;letter-spacing:.08em;font-family:Helvetica,Arial,sans-serif;">
          DMP Compliance · Web Monitoring
        </p>
        <h1 class="em-title" style="margin:0 0 4px;font-size:24px;font-weight:700;color:#1f1d25;
            line-height:1.2;font-family:Helvetica,Arial,sans-serif;">
          Web Monitoring Report
        </h1>
        <p class="em-oem" style="margin:0 0 24px;font-size:14px;color:#8f8c9c;font-family:Helvetica,Arial,sans-serif;">
          Volkswagen of America — ${date}
        </p>

        <hr class="em-divider" style="border:none;border-top:1px solid #ece9f5;margin:0 0 24px;" />

        <!-- Greeting -->
        <p class="em-greeting" style="margin:0 0 12px;font-size:15px;color:#1f1d25;font-family:Helvetica,Arial,sans-serif;font-weight:600;">
          ${greeting}
        </p>
        <p class="em-body-text" style="margin:0 0 28px;font-size:14px;color:#686576;line-height:1.6;font-family:Helvetica,Arial,sans-serif;">
          Below are the <strong style="color:#1f1d25;">${infractions.length} DMP infractions</strong> detected during the latest Web Monitoring scan. Each item links directly to the compliance platform for review and action.
        </p>

        <!-- Infractions table -->
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #ece9f5;border-radius:10px;overflow:hidden;margin-bottom:32px;">
          <thead>
            <tr class="em-th">
              <th class="em-th" style="padding:10px 14px;font-size:11px;font-weight:600;color:#8f8c9c;text-transform:uppercase;letter-spacing:.06em;text-align:left;background:#f8f7fc;border-bottom:1px solid #ece9f5;font-family:Helvetica,Arial,sans-serif;">Dealership / ID</th>
              <th class="em-th" style="padding:10px 14px;font-size:11px;font-weight:600;color:#8f8c9c;text-transform:uppercase;letter-spacing:.06em;text-align:left;background:#f8f7fc;border-bottom:1px solid #ece9f5;font-family:Helvetica,Arial,sans-serif;">Violation</th>
              <th class="em-th" style="padding:10px 14px;font-size:11px;font-weight:600;color:#8f8c9c;text-transform:uppercase;letter-spacing:.06em;text-align:left;background:#f8f7fc;border-bottom:1px solid #ece9f5;font-family:Helvetica,Arial,sans-serif;">Channel</th>
              <th class="em-th" style="padding:10px 14px;font-size:11px;font-weight:600;color:#8f8c9c;text-transform:uppercase;letter-spacing:.06em;text-align:left;background:#f8f7fc;border-bottom:1px solid #ece9f5;font-family:Helvetica,Arial,sans-serif;">Severity</th>
              <th class="em-th" style="padding:10px 14px;font-size:11px;font-weight:600;color:#8f8c9c;text-transform:uppercase;letter-spacing:.06em;text-align:center;background:#f8f7fc;border-bottom:1px solid #ece9f5;font-family:Helvetica,Arial,sans-serif;">View</th>
            </tr>
          </thead>
          <tbody>
            ${infractionRows}
          </tbody>
        </table>

        <!-- CTA -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <a href="${APP_URL}/campaigns/funds/compliance"
                 style="display:inline-block;background:#473bab;color:#ffffff;text-decoration:none;
                        padding:14px 32px;border-radius:50px;font-size:14px;font-weight:600;
                        font-family:Helvetica,Arial,sans-serif;letter-spacing:0.02em;">
                Open Compliance Platform
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td class="em-footer" style="padding:28px 0 0;text-align:center;font-size:12px;color:#9c99a9;font-family:Helvetica,Arial,sans-serif;">
        Sent via <a href="${APP_URL}" style="color:#9c99a9;text-decoration:underline;">Constellation</a>
        &nbsp;·&nbsp; Volkswagen DMP Compliance
      </td>
    </tr>

  </table>
  </td></tr>
</table>
</body>
</html>`;
}

app.post("/api/compliance/send-wcm-report", async (c) => {
  const body = await c.req.json() as { infractions?: WCMReportInfraction[] };
  const infractions = body.infractions ?? readInfractions().map((i) => ({
    id: i.id,
    dealership: i.dealership,
    violationType: i.violationType,
    channel: i.channel,
    severity: i.severity,
    url: i.url,
    detectedOn: i.detectedOn,
  }));

  if (infractions.length === 0) {
    return c.json({ error: "No infractions to report" }, 400);
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const results = await Promise.allSettled(
    WCM_RECIPIENTS.map(({ name, email }) =>
      resend.emails.send({
        from: "Constellation <onboarding@resend.dev>",
        to: [email],
        subject: `Web Monitoring Report — ${date} (${infractions.length} infractions)`,
        html: buildWcmEmailHtml(infractions, name.split(" ")[0], date),
      })
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  console.log(`[send-wcm-report] ${sent} sent, ${failed} failed — ${infractions.length} infractions`);
  return c.json({ success: true, sent, failed, infractionCount: infractions.length });
});

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = Number(process.env.AGENT_PORT ?? 3001);

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`🤖  Constellation Agent server → http://localhost:${PORT}`);
  console.log(
    `    ANTHROPIC_KEY: ${process.env.ANTHROPIC_KEY ? "✓ set" : "✗ missing — add to .env"}`,
  );
});
