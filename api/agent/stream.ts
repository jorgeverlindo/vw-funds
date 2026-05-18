import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";

// Use Node.js runtime (not Edge) — the Anthropic SDK uses EventEmitter
// which is a Node.js built-in not available in the Edge runtime.
export const config = { maxDuration: 60 };

// ─── Types (inlined from _lib/system-prompt) ──────────────────────────────────

interface OfferSummary {
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
}

interface TemplateSummary {
  id: string;
  name: string;
  format: string;
  width: number;
  height: number;
  brand: string;
}

interface ProjectContext {
  projectId: string;
  projectName: string;
  oem: string;
  currentOfferIds: string[];
  currentTemplateIds: string[];
  availableOffers: OfferSummary[];
  availableTemplates: TemplateSummary[];
  availableBackgrounds?: Array<{ id: string; name: string }>;
}

// ─── System Prompt Builder (inlined from _lib/system-prompt) ─────────────────

function buildSystemPrompt(ctx: ProjectContext): string {
  const offerList = ctx.availableOffers
    .map(
      (o) =>
        `  • ${o.id}: ${o.year} ${o.make} ${o.model} ${o.trim} | ${o.offerType} $${o.monthlyPayment}/mo × ${o.term}mo | PVI ${o.pvi} | Aging ${o.aging}d | Stock ${o.stock}`,
    )
    .join("\n");

  const templateList = ctx.availableTemplates
    .map(
      (t) =>
        `  • ${t.id}: ${t.name} | ${t.format} | ${t.width}×${t.height} | Brand: ${t.brand}`,
    )
    .join("\n");

  const bgList = [
    "  • dirt-road: Dirt Road | Scene: rural road environment",
    "  • gold-flare: Gold Flare | Scene: golden light/bokeh",
    "  • purple-city: Purple City | Scene: urban night cityscape",
    "  • snow-house: Snow House | Scene: winter residential",
    "  • ballon-festival: Balloon Festival | Scene: hot air balloons sky",
    "  • beach-sunset: Beach Sunset | Scene: coastal sunset",
    "  • desert-day: Desert Day | Scene: sandy desert landscape",
    "  • desert-pyramid-night-sky: Desert Pyramid Night Sky | Scene: desert night/stars",
    "  • docks-midday: Docks Midday | Scene: marina waterfront",
    "  • field-with-mountain: Field With Mountain | Scene: outdoor scenic",
    "  • forest-lodge: Forest Lodge | Scene: wooded resort setting",
    "  • frozen-lake-night: Frozen Lake Night | Scene: winter lake at night",
    "  • ice-lab: Ice Lab | Scene: futuristic cold interior",
    "  • stadium-night: Stadium Night | Scene: sports arena at night",
  ].join("\n");

  const currentOffers = ctx.currentOfferIds.length
    ? ctx.currentOfferIds.join(", ")
    : "none";

  const currentTemplates = ctx.currentTemplateIds.length
    ? ctx.currentTemplateIds.join(", ")
    : "none";

  return `You are Constellation AI, an intelligent assistant built into the Verlindo Funds platform — a co-op marketing funds management tool for automotive dealerships.

Your role is to help dealership users build advertising projects efficiently. You can:
- Recommend and add offers (vehicle lease/APR/purchase deals) based on campaign goals
- Select appropriate ad templates (banner sizes, social formats, display ads)
- Rename and configure projects
- Remove items that don't fit the campaign strategy

━━━ KNOWN CONTACTS ━━━
Constellation team (internal):
  • Luke Theobald — luke.theobald@helloconstellation.com
  • Jenny Park — jenny.park@helloconstellation.com
  • Sonya Koh — sonya.koh@helloconstellation.com
  • Zak Flaten — zak.flaten@helloconstellation.com
  • Rachel Hui — rachel.hui@helloconstellation.com
Dealer contacts:
  • Mike Henderson — mike.henderson@hondaofanywhere.com
  • Sarah Collins — sarah.collins@hondaofanywhere.com
  • James Whitaker — james.whitaker@hondaofanywhere.com
  • Ashley Morgan — ashley.morgan@hondaofanywhere.com

When the user mentions a name (e.g. "send to Luke", "share with Sarah"), match it to this list and pass their full name in recipient_hint. Never ask who they are — you already know them.

━━━ CURRENT PROJECT ━━━
Name: ${ctx.projectName}
ID: ${ctx.projectId}
OEM / Brand: ${ctx.oem}
Current offers: ${currentOffers}
Current templates: ${currentTemplates}

━━━ AVAILABLE OFFER CATALOG ━━━
${offerList || "  (no offers available for this brand)"}

━━━ AVAILABLE TEMPLATE CATALOG ━━━
${templateList || "  (no templates available for this brand)"}

━━━ AVAILABLE BACKGROUND CATALOG ━━━
${bgList}

━━━ CAMPAIGN BUILDING FLOW ━━━

STEP SELECTION — always set flow_steps in setup_project:

flow_steps is an ORDERED array of actions to perform after the project is created.
Valid steps: "offers", "templates", "backgrounds", "brand", "email".

Rules:
  - Include "email" last if the user wants to share/send/email the project to someone.
  - "full campaign" → ["offers", "templates", "backgrounds", "brand"]
  - User says "offers only" → ["offers"]
  - User says "templates only" → ["templates"]
  - User says "offers and email" → ["offers", "email"]
  - User says "templates and email" → ["templates", "email"]
  - User says "offers and backgrounds" → ["offers", "backgrounds"]
  - User says "offers, templates, email" → ["offers", "templates", "email"]
  - User says "offers and templates" → ["offers", "templates"]
  - No clear scope → ["offers", "templates", "backgrounds", "brand"]

⚠️ ALWAYS call setup_project FIRST — no exceptions, no clarifying questions before it.
⚠️ If OEM unknown: infer from catalog. If catalog empty: use "General" / "New Project".

CONTINUATION MESSAGES (automated — the UI sends these after each step is confirmed):
  "Step complete. Next: propose_offers"      → call propose_offers immediately
  "Step complete. Next: propose_templates"   → call propose_templates immediately
  "Step complete. Next: propose_backgrounds" → call propose_backgrounds immediately
  "Step complete. Next: propose_brand"       → call propose_brand immediately
  "Step complete. Next: propose_email"       → call propose_email immediately
  "Project created. Next: propose_offers"    → call propose_offers immediately
  "Project created. Next: propose_templates" → call propose_templates immediately
  (etc. for any first step)

Never ask the user what to do next during automated continuations — just fire the tool.

INDIVIDUAL REQUESTS (project already open):
  - "add offers" / "change offers"           → call propose_offers directly
  - "add templates" / "change templates"     → call propose_templates directly
  - "add backgrounds" / "change backgrounds" → call propose_backgrounds directly
  - "add brand" / "change theme"             → call propose_brand directly
  - "full refresh"                           → call propose_project (offers + templates)
  - "send by email" / "share" / "email this" → call propose_email directly
  Do NOT restart the full flow. Respond ONLY to what was asked.

KEY RULES:
- NEVER write a text description or markdown table of the proposal — the UI renders it as an interactive card.
- NEVER call add_offers_to_project or add_templates_to_project as part of a build request — use the propose tools.
- Each step shows one card at a time. The user confirms before you move to the next step.
- The continuation messages are automated — respond immediately with the next tool call based on the scope.
- If a project IS already open and the user asks for a full campaign, ask if they want to replace existing items or add to them.

OFFER SELECTION LOGIC:
- Prioritise PVI (Performance Value Index — projected return per vehicle at current price) > 90, stock ≥ 10 units, healthy aging spread across the selection
- Include at least one low-aging and one high-aging offer when building a full project build
- Prefer brand-matched offers to the project OEM
- In the offer rationale, always define PVI on first mention: "PVI > 90 (Performance Value Index — return per vehicle at current price)"
- Replace vague stock descriptions with a concrete figure: "≥ 10 units in stock per model"
- Never write "strong stock levels" — always cite the actual number

TEMPLATE SELECTION LOGIC:
- Cover the main digital formats: website banner + display leaderboard + display medium rectangle + social square
- Prefer templates whose brand tag matches the project OEM

BACKGROUND SELECTION LOGIC:
- Choose 2–3 backgrounds that complement the campaign mood and OEM brand
- Prefer environments that contrast or frame vehicles well (open roads, cityscapes, scenic)
- Avoid backgrounds that look generic for the brand — vary mood/lighting

PROJECT NAMING:
- project_name in propose_project is a short, human-readable campaign name (e.g. "Honda Summer Lease Event", "Spring SUV Push").
- Never generate WF-code identifiers (WF12345_...) — those are internal system codes, not campaign names.
- If the project already has a name, leave project_name blank (the field is optional).

COMMUNICATION:
- Be concise. Say at most ONE short sentence before calling a tool (e.g. "Here's my proposal:").
- After calling propose_project, say nothing — the interactive card speaks for itself.
- Never reproduce the proposal contents as text or markdown — the interactive card handles that.
- When answering questions (not building), use markdown tables to present structured data — they render beautifully in this UI.
- Never ask more than one clarifying question at a time.
- Don't add items already in the project (check current offers/templates above).

EMAIL SHARING:
- When the user says "send by email", "share by email", "email this", or mentions sending to someone → call propose_email immediately.
- If the user names a recipient (e.g. "send to Maria"), put that name in recipient_hint.
- Write a friendly, professional default message referencing the project name. Always use "project" — never "campaign" — in the generated email copy.
- Email body pattern: "I'd like to share the [OEM] project "[Project Name]" with you. You can view and collaborate on it using the link below:\\n\\n[Project link]"
- Email subject pattern: "[OEM] Project shared: [Project Name]"
- Include a placeholder for the project link.

FILE UPLOAD — OFFER EXTRACTION:
- When the user attaches an image, PDF, or spreadsheet (Excel/CSV), inspect it and call propose_parsed_offers immediately.
- Extract ALL visible offer rows — do not skip any.
- For each offer, assign per-field confidence:
  "high"   = clearly visible and unambiguous
  "medium" = partially legible or inferred from context
  "low"    = guessed / unclear — the user will need to correct it
- Set field_confidence for: monthly_payment, term, due_at_signing, trim, year, apr
- If a field is missing, leave it blank (don't invent values) but mark it "low" confidence so the UI highlights it.
- In extraction_notes, summarize any ambiguities, missing data, or quality issues.
- For Excel/CSV uploads, each data row is typically one offer.
- Be thorough — users upload these files specifically to import many offers at once.

Today's date: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.`;
}

// ─── Tool Definitions (inlined from _lib/tools) ───────────────────────────────

const agentTools: Anthropic.Tool[] = [
  // ── Step 1: project setup ──────────────────────────────────────────────────
  {
    name: "setup_project",
    description:
      "Propose project metadata — name, account, brand, and date range — for the user to confirm " +
      "before the project is created. Use this as the FIRST step when the user wants to build a " +
      "campaign and no project is currently open. Always set flow_steps to match the user's intent. " +
      "After the user confirms, the project is created and you will receive a continuation message " +
      "telling you what to propose next based on the scope.",
    input_schema: {
      type: "object" as const,
      properties: {
        project_name: { type: "string", description: "Human-readable campaign name (e.g. 'Honda Summer Lease Event'). Never use WF codes." },
        account:      { type: "string", description: "Dealer/account name from the available accounts list" },
        oem:          { type: "string", description: "Brand / OEM (e.g. 'Honda', 'BMW')" },
        start_date:   { type: "string", description: "Campaign start date (e.g. 'Jun 1, 2026')" },
        end_date:     { type: "string", description: "Campaign end date (e.g. 'Jun 30, 2026')" },
        flow_steps: {
          type: "array",
          items: { type: "string", enum: ["offers", "templates", "backgrounds", "brand", "email"] },
          description:
            "Ordered list of steps to execute after project setup. Choose from: " +
            "'offers', 'templates', 'backgrounds', 'brand', 'email'. " +
            "Always end with 'email' if the user wants to share the project. " +
            "Examples: full=[offers,templates,backgrounds,brand], offers+email=[offers,email], " +
            "templates+email=[templates,email], offers+templates+email=[offers,templates,email], " +
            "backgrounds only=[backgrounds], offers+backgrounds=[offers,backgrounds].",
        },
        owner: {
          type: "string",
          description: "Full name of the project owner (e.g. 'Jorge Verlindo'). Leave blank to default to the current user.",
        },
        platforms: {
          type: "array",
          items: { type: "string" },
          description: "Ad platforms for this project. Valid values: 'Google PMax', 'Google Display', 'Meta', 'Website', 'TikTok', 'YouTube', 'Email'.",
        },
      },
      required: ["project_name", "oem", "start_date", "end_date", "flow_steps"],
    },
  },

  // ── Step 2: offer selection ────────────────────────────────────────────────
  {
    name: "propose_offers",
    description:
      "Propose a curated set of offers for the user to review. Use this after a project has been " +
      "set up (or when the user asks to add/change offers on an existing project). " +
      "Select offers intelligently: prioritise PVI > 90, stock > 5, healthy aging spread. " +
      "After the user confirms, you will receive a continuation message to propose templates.",
    input_schema: {
      type: "object" as const,
      properties: {
        offer_ids: {
          type: "array",
          items: { type: "string" },
          description: "Proposed offer IDs from the available catalog",
        },
        rationale: {
          type: "string",
          description: "1–2 sentence rationale for this offer selection",
        },
      },
      required: ["offer_ids", "rationale"],
    },
  },

  // ── Step 3: template selection ─────────────────────────────────────────────
  {
    name: "propose_templates",
    description:
      "Propose a curated set of ad templates for the user to review. Use this after offers have " +
      "been confirmed (or when the user asks to add/change templates). " +
      "Cover the main digital formats: website banner + display leaderboard + display medium rectangle + social square. " +
      "Prefer templates matching the project OEM brand.",
    input_schema: {
      type: "object" as const,
      properties: {
        template_ids: {
          type: "array",
          items: { type: "string" },
          description: "Proposed template IDs from the available catalog",
        },
        rationale: {
          type: "string",
          description: "1–2 sentence rationale for this template selection",
        },
      },
      required: ["template_ids", "rationale"],
    },
  },

  // ── Step 3.5: background selection ────────────────────────────────────────
  {
    name: "propose_backgrounds",
    description:
      "Propose 1–3 background collections for the user to review. Use this as Step 3.5 after " +
      "templates have been confirmed. Choose scene/environment backgrounds (no vehicles) that " +
      "complement the campaign mood. After the user confirms, you will receive a continuation " +
      "message to propose the brand kit.",
    input_schema: {
      type: "object" as const,
      properties: {
        background_ids: {
          type: "array",
          items: { type: "string" },
          description: "Proposed background collection IDs from the available catalog",
        },
        rationale: {
          type: "string",
          description: "1–2 sentence rationale for this background selection",
        },
      },
      required: ["background_ids", "rationale"],
    },
  },

  // ── Step 4: brand / theme kit ──────────────────────────────────────────────
  {
    name: "propose_brand",
    description:
      "Propose a brand kit (theme and logos) for the project. Use this as the FOURTH step after " +
      "templates have been confirmed. The user selects which brand kit to activate.",
    input_schema: {
      type: "object" as const,
      properties: {
        oem: { type: "string", description: "The brand/OEM to activate (e.g. 'Honda', 'BMW')" },
        rationale: { type: "string", description: "One sentence on why this brand kit fits." },
      },
      required: ["oem", "rationale"],
    },
  },

  // ── Full proposal (existing projects only) ─────────────────────────────────
  {
    name: "propose_project",
    description:
      "Propose offers AND templates together — use this ONLY when a project already exists and " +
      "the user wants a full refresh of both. For new projects, use the 3-step flow instead: " +
      "setup_project → propose_offers → propose_templates.",
    input_schema: {
      type: "object" as const,
      properties: {
        offer_ids:    { type: "array", items: { type: "string" }, description: "Proposed offer IDs" },
        template_ids: { type: "array", items: { type: "string" }, description: "Proposed template IDs" },
        rationale:    { type: "string", description: "1–3 sentence strategy rationale" },
      },
      required: ["offer_ids", "template_ids", "rationale"],
    },
  },

  // ── Direct actions ─────────────────────────────────────────────────────────
  {
    name: "add_offers_to_project",
    description: "Directly add one or more offers to the current project (no review step). Use for small additions after initial setup.",
    input_schema: {
      type: "object" as const,
      properties: {
        offer_ids: { type: "array", items: { type: "string" }, description: "Offer IDs to add" },
      },
      required: ["offer_ids"],
    },
  },
  {
    name: "remove_offers_from_project",
    description: "Remove one or more offers from the current project.",
    input_schema: {
      type: "object" as const,
      properties: {
        offer_ids: { type: "array", items: { type: "string" } },
      },
      required: ["offer_ids"],
    },
  },
  {
    name: "add_templates_to_project",
    description: "Directly add one or more ad templates to the current project (no review step).",
    input_schema: {
      type: "object" as const,
      properties: {
        template_ids: { type: "array", items: { type: "string" } },
      },
      required: ["template_ids"],
    },
  },
  {
    name: "remove_templates_from_project",
    description: "Remove one or more ad templates from the current project.",
    input_schema: {
      type: "object" as const,
      properties: {
        template_ids: { type: "array", items: { type: "string" } },
      },
      required: ["template_ids"],
    },
  },
  {
    name: "set_project_name",
    description: "Update the project name.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "The new project name" },
      },
      required: ["name"],
    },
  },

  // ── Offer extraction from uploaded file ───────────────────────────────────
  {
    name: "propose_parsed_offers",
    description:
      "Extract and propose offers from an uploaded image, PDF, or spreadsheet. " +
      "Use this when the user attaches a file (flyer, rate sheet, Excel, screenshot) that contains offer data. " +
      "Parse all visible offers and return them structured with per-field confidence scores. " +
      "The UI will show an interactive card where the user can review, edit, check/uncheck offers, and confirm which ones to add.",
    input_schema: {
      type: "object" as const,
      properties: {
        source: {
          type: "string",
          description: "Description of the source file, e.g. 'Honda Summer Flyer (uploaded PDF)' or 'clipboard screenshot'.",
        },
        offers: {
          type: "array",
          description: "List of offers extracted from the file.",
          items: {
            type: "object",
            properties: {
              id:               { type: "string", description: "Unique ID for this offer row, e.g. 'p1', 'p2'." },
              year:             { type: "string", description: "Model year, e.g. '2025'." },
              make:             { type: "string", description: "Vehicle make, e.g. 'Honda'." },
              model:            { type: "string", description: "Vehicle model, e.g. 'Civic'." },
              trim:             { type: "string", description: "Trim level, e.g. 'LX'." },
              offer_type:       { type: "string", description: "'Lease', 'Finance', or 'Purchase'." },
              monthly_payment:  { type: "string", description: "Monthly payment amount, e.g. '299'." },
              term:             { type: "string", description: "Term in months, e.g. '36'." },
              due_at_signing:   { type: "string", description: "Amount due at signing, e.g. '3999'. Use '0' if not specified." },
              apr:              { type: "string", description: "APR percentage for finance offers, e.g. '1.9'." },
              notes:            { type: "string", description: "Any additional notes or caveats for this offer." },
              field_confidence: {
                type: "object",
                description: "Per-field confidence: 'high' = clearly visible, 'medium' = partially legible, 'low' = guessed.",
                additionalProperties: { type: "string", enum: ["high", "medium", "low"] },
              },
            },
            required: ["id", "year", "make", "model", "offer_type", "monthly_payment", "term"],
          },
        },
        extraction_notes: {
          type: "string",
          description: "Optional notes about extraction quality, ambiguities, or what could not be read.",
        },
      },
      required: ["source", "offers"],
    },
  },

  // ── Email sharing ──────────────────────────────────────────────────────────
  {
    name: "propose_email",
    description:
      "Propose sending a project share link via email. Use this when the user asks to share or " +
      "send the project by email. The UI will show a contact selector and editable message. " +
      "Provide a suggested recipient name (if known) and a default message body.",
    input_schema: {
      type: "object" as const,
      properties: {
        recipient_hint: {
          type: "string",
          description: "Name or email address of the intended recipient if mentioned by the user. Leave empty if unknown.",
        },
        message: {
          type: "string",
          description: "Default email message body. Should reference the project name and include a placeholder for the project link.",
        },
      },
      required: ["message"],
    },
  },
];

// ─── Tool Executor (inlined from _lib/tools) ──────────────────────────────────

function executeTool(
  toolName: string,
  input: Record<string, unknown>,
): Record<string, unknown> {
  switch (toolName) {
    case "setup_project":
      return { success: true, setup: input, message: "Project setup proposal ready for user review." };
    case "propose_offers":
      return { success: true, offers: input, message: "Offers proposal ready for user review." };
    case "propose_templates":
      return { success: true, templates: input, message: "Templates proposal ready for user review." };
    case "propose_backgrounds":
      return { success: true, backgrounds: input, message: "Backgrounds proposal ready for user review." };
    case "propose_brand":
      return { success: true, brand: input, message: "Brand kit proposal ready for user review." };
    case "propose_project":
      return { success: true, proposal: input, message: "Full proposal ready for user review." };
    case "add_offers_to_project":
      return { success: true, added: input.offer_ids, message: `Added ${(input.offer_ids as string[]).length} offer(s) to the project.` };
    case "remove_offers_from_project":
      return { success: true, removed: input.offer_ids, message: `Removed ${(input.offer_ids as string[]).length} offer(s) from the project.` };
    case "add_templates_to_project":
      return { success: true, added: input.template_ids, message: `Added ${(input.template_ids as string[]).length} template(s) to the project.` };
    case "remove_templates_from_project":
      return { success: true, removed: input.template_ids, message: `Removed ${(input.template_ids as string[]).length} template(s) from the project.` };
    case "set_project_name":
      return { success: true, name: input.name, message: `Project renamed to "${input.name}".` };
    case "propose_email":
      return { success: true, email: input, message: "Email proposal ready for user review." };
    case "propose_parsed_offers":
      return { success: true, parsed_offers: input, message: `${(input.offers as unknown[]).length} offer(s) extracted and ready for user review.` };
    default:
      return { success: false, message: `Unknown tool: ${toolName}` };
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "ANTHROPIC_KEY not configured on server" });
    return;
  }

  const { messages, projectContext } = req.body as {
    messages: Anthropic.MessageParam[];
    projectContext: ProjectContext;
  };

  const anthropic = new Anthropic({ apiKey });

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.status(200);

  const send = (payload: unknown) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  try {
    let currentMessages: Anthropic.MessageParam[] = [...messages];
    let iterations = 0;
    const MAX_ITERATIONS = 8;

    const PROPOSAL_TOOLS = new Set([
      "setup_project", "propose_offers", "propose_templates",
      "propose_backgrounds", "propose_brand", "propose_project",
      "propose_email", "propose_parsed_offers",
    ]);

    while (iterations < MAX_ITERATIONS) {
      iterations++;

      const streamRunner = anthropic.messages.stream({
        model: "claude-opus-4-5",
        max_tokens: 2048,
        system: buildSystemPrompt(projectContext),
        tools: agentTools,
        messages: currentMessages,
      });

      streamRunner.on("text", (text) => send({ type: "text_delta", delta: text }));

      const finalMessage = await streamRunner.finalMessage();

      if (
        finalMessage.stop_reason === "end_turn" ||
        finalMessage.stop_reason === "stop_sequence" ||
        finalMessage.stop_reason !== "tool_use"
      ) {
        break;
      }

      const toolUseBlocks = finalMessage.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
      );
      if (toolUseBlocks.length === 0) break;

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      let hasProposalTool = false;

      for (const toolBlock of toolUseBlocks) {
        if (PROPOSAL_TOOLS.has(toolBlock.name)) hasProposalTool = true;

        send({ type: "tool_use", id: toolBlock.id, name: toolBlock.name, input: toolBlock.input });

        const result = executeTool(toolBlock.name, toolBlock.input as Record<string, unknown>);

        send({ type: "tool_result", name: toolBlock.name, input: toolBlock.input, result });

        toolResults.push({
          type: "tool_result",
          tool_use_id: toolBlock.id,
          content: JSON.stringify(result),
        });
      }

      if (hasProposalTool) break;

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
    res.end();
  }
}
