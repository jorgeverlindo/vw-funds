import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import Anthropic from "@anthropic-ai/sdk";
import { agentTools, executeTool } from "./tools.js";
import { buildSystemPrompt, type ProjectContext } from "./system-prompt.js";

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

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = Number(process.env.AGENT_PORT ?? 3001);

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`🤖  Constellation Agent server → http://localhost:${PORT}`);
  console.log(
    `    ANTHROPIC_KEY: ${process.env.ANTHROPIC_KEY ? "✓ set" : "✗ missing — add to .env"}`,
  );
});
