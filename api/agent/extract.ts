import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";

export const config = { maxDuration: 60 };

// ─── Single tool ────────────────────────────────────────────────────────────

const extractTool: Anthropic.Tool = {
  name: "propose_parsed_offers",
  description:
    "Extract every vehicle offer visible in the image or document and return them as structured rows. " +
    "You MUST call this tool — it is your only available action.",
  input_schema: {
    type: "object" as const,
    properties: {
      source: {
        type: "string",
        description: "Brief description of the source, e.g. 'Toyota May 2026 rate sheet'.",
      },
      offers: {
        type: "array",
        description: "All offer rows extracted from the document.",
        items: {
          type: "object",
          properties: {
            id:              { type: "string",  description: "Unique row ID, e.g. 'p1'." },
            year:            { type: "string",  description: "Model year, e.g. '2025'." },
            make:            { type: "string",  description: "Vehicle make, e.g. 'Toyota'." },
            model:           { type: "string",  description: "Vehicle model, e.g. 'Tundra'." },
            trim:            { type: "string",  description: "Trim level if visible." },
            offer_type:      { type: "string",  description: "'Lease', 'Finance', or 'Purchase'." },
            monthly_payment: { type: "string",  description: "Monthly payment, e.g. '449'." },
            term:            { type: "string",  description: "Term in months, e.g. '36'." },
            due_at_signing:  { type: "string",  description: "Amount due at signing. Use '0' if not shown." },
            apr:             { type: "string",  description: "APR for finance offers." },
            notes:           { type: "string",  description: "Any extra notes or caveats." },
            confidence_monthly_payment: { type: "string", description: "Confidence: 'high', 'medium', or 'low'." },
            confidence_term:            { type: "string", description: "Confidence: 'high', 'medium', or 'low'." },
            confidence_due_at_signing:  { type: "string", description: "Confidence: 'high', 'medium', or 'low'." },
            confidence_trim:            { type: "string", description: "Confidence: 'high', 'medium', or 'low'." },
            confidence_year:            { type: "string", description: "Confidence: 'high', 'medium', or 'low'." },
            confidence_apr:             { type: "string", description: "Confidence: 'high', 'medium', or 'low'." },
          },
          required: ["id", "year", "make", "model", "offer_type", "monthly_payment", "term"],
        },
      },
      extraction_notes: {
        type: "string",
        description: "Notes about extraction quality or ambiguities.",
      },
    },
    required: ["source", "offers"],
  },
};

// ─── Handler ────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Method Not Allowed" }); return; }

  const apiKey = process.env.ANTHROPIC_KEY;
  if (!apiKey) { res.status(500).json({ error: "ANTHROPIC_KEY not configured" }); return; }

  const { messages } = req.body as { messages: Anthropic.MessageParam[] };

  const anthropic = new Anthropic({ apiKey });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.status(200);

  const send = (payload: unknown) => res.write(`data: ${JSON.stringify(payload)}\n\n`);

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
      messages,
    });

    const toolBlock = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );
    if (toolBlock) {
      send({ type: "tool_result", name: toolBlock.name, input: toolBlock.input });
    } else {
      send({ type: "error", message: "No offers extracted — model returned no tool call." });
    }
    send({ type: "done" });
  } catch (err) {
    send({ type: "error", message: String(err) });
  } finally {
    res.end();
  }
}
