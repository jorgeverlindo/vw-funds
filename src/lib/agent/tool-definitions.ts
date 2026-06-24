// ─── Canonical agent tool definitions ────────────────────────────────────────
// Single source of truth. Use the production (api/agent/stream.ts) versions as
// canonical — they are more complete than the dev server versions.

import type Anthropic from "@anthropic-ai/sdk";

export const agentTools: Anthropic.Tool[] = [
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
        project_name: { type: "string", description: "If the user gives an explicit name (e.g. 'offers in a napkin', 'VW June push'), use it VERBATIM. Only generate a name if none was given." },
        account:      { type: "string", description: "Dealer/account name from the available accounts list" },
        oem:          { type: "string", description: "Brand / OEM (e.g. 'Honda', 'BMW', 'Audi'). Use what the user explicitly states. If not stated, infer from offer content." },
        start_date:   { type: "string", description: "Campaign start date (e.g. 'Jun 1, 2026'). Parse natural language: 'start of June' / 'início de junho' = 'Jun 1, 2026'." },
        end_date:     { type: "string", description: "Campaign end date (e.g. 'Jun 30, 2026'). Note: June has 30 days — 'June 31' = 'Jun 30, 2026'. 'end of June' = 'Jun 30, 2026'." },
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
          description: "Ad platforms. Valid values: 'Google PMax', 'Google Display', 'Meta', 'Facebook', 'Website', 'TikTok', 'YouTube', 'Email'. Map user language: 'Google Performance Max' / 'Performance Max' / 'PMax' → 'Google PMax'; 'Meta' / 'Instagram' → 'Meta'; 'Facebook' → 'Facebook'; 'social' / 'social media' → ['Meta', 'Facebook'].",
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

  // ── Step 3.5a: dealer custom background (full_dealer_bg flow only) ────────
  {
    name: "generate_dealer_background",
    description:
      "Generate a custom campaign background from a dealer-uploaded scene image. " +
      "Use ONLY in the full_dealer_bg flow, ONLY after offers have been confirmed. " +
      "The frontend will run the Replicate AI pipeline to produce the background. " +
      "Pass vehicle_context = comma-separated makes+models of confirmed offers.",
    input_schema: {
      type: "object" as const,
      properties: {
        vehicle_context: {
          type: "string",
          description: "Comma-separated makes+models from confirmed offers (e.g. 'Honda CR-V, Honda Civic')",
        },
        scene_description: {
          type: "string",
          description: "Brief description of the uploaded dealer scene (e.g. 'outdoor Honda dealership lot, daytime')",
        },
      },
      required: ["vehicle_context", "scene_description"],
    },
  },

  // ── Step 3.5b: background selection (standard flow) ───────────────────────
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
    name: "edit_offer",
    description:
      "Edit financial or metadata fields of an existing offer — price, term, due-at-signing, APR, offer type. " +
      "⛔ NEVER use this for vehicle color / exterior color changes. " +
      "⛔ NEVER put a color word (white, red, black, blue, silver, gray, green, orange) inside trim, model, or any patch field. " +
      "WRONG: edit_offer { patches: { trim: 'Sport 2WD White' } } — this is forbidden. " +
      "RIGHT for color: call list_jellybean_colors then swap_jellybean_color instead.",
    input_schema: {
      type: "object" as const,
      properties: {
        offer_id: {
          type: "string",
          description: "ID of the offer to edit (e.g. 'offer-1', 'p2')",
        },
        patches: {
          type: "object",
          description:
            "Fields to update. Valid keys: monthlyPayment (number), term (number), " +
            "totalDueAtSigning (number), apr (number), offerType (string), " +
            "year (string), make (string), model (string), trim (string). " +
            "⛔ If the user asked about a color — STOP. Do NOT call this tool. Call list_jellybean_colors instead.",
          additionalProperties: true,
        },
      },
      required: ["offer_id", "patches"],
    },
  },
  {
    name: "add_backgrounds_to_project",
    description:
      "Directly add one or more backgrounds to the project — no review card, no selection UI. " +
      "Use this when the user explicitly names a background to include/add/use " +
      "(e.g. 'include the desert background', 'add dirt road', 'use the beach sunset'). " +
      "ONLY pass IDs that exist in the AVAILABLE BACKGROUND CATALOG. " +
      "If the requested background does NOT exist in the catalog, do NOT call this tool — " +
      "instead reply with a short message explaining what was asked for is not available, " +
      "then list the closest available options by name. Never hallucinate background IDs.",
    input_schema: {
      type: "object" as const,
      properties: {
        background_ids: {
          type: "array",
          items: { type: "string" },
          description: "IDs of backgrounds to add directly (must exist in the AVAILABLE BACKGROUND CATALOG)",
        },
      },
      required: ["background_ids"],
    },
  },
  {
    name: "remove_backgrounds_from_project",
    description:
      "Remove one or more backgrounds that are currently applied to the project. " +
      "Use this when the user asks to remove, delete, or clear a specific background " +
      "(e.g. 'remove the beach background', 'delete background dirt-road'). " +
      "The IDs to pass are the ones listed under 'Current backgrounds' in CURRENT PROJECT STATE — " +
      "those are the backgrounds actively in the project. Never call remove_templates_from_project for a background ID.",
    input_schema: {
      type: "object" as const,
      properties: {
        background_ids: {
          type: "array",
          items: { type: "string" },
          description: "IDs of backgrounds to remove — use exact IDs from 'Current backgrounds' in the project state (e.g. ['beach-sunset', 'dirt-road'])",
        },
      },
      required: ["background_ids"],
    },
  },
  {
    name: "duplicate_template_in_project",
    description:
      "Create a copy of an existing template in the project. " +
      "Use this when the user asks to duplicate, copy, or clone a template " +
      "(e.g. 'duplicate the Honda banner template', 'make a copy of template X'). " +
      "Optionally provide a new name for the copy.",
    input_schema: {
      type: "object" as const,
      properties: {
        template_id: {
          type: "string",
          description: "ID of the template to duplicate",
        },
        new_name: {
          type: "string",
          description: "Optional name for the new copy. Defaults to '[original name] (Copy)' if omitted.",
        },
      },
      required: ["template_id"],
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
  {
    name: "update_project_display",
    description:
      "Update display-level project settings: the CTA button text, lease label, fine print line, " +
      "or dealer name shown on all banners. " +
      "Use this when the user asks to change the button text (e.g. 'change CTA to Shop Now'), " +
      "the lease label (e.g. 'change lease label to LEASE · 2025 HONDA'), " +
      "the fine print line (e.g. 'set fine print to 36 months | $3,999 due at signing'), " +
      "or the dealer name (e.g. 'rename dealer to Honda City'). " +
      "Pass only the fields that need changing — omit unchanged fields.",
    input_schema: {
      type: "object" as const,
      properties: {
        cta_text:    { type: "string", description: "New CTA button label, e.g. 'Shop Now' or 'Learn More'." },
        lease_label: { type: "string", description: "New lease label text, e.g. 'LEASE · 2025 HONDA' or 'Lease for'." },
        fine_print:  { type: "string", description: "Single-line fine print, e.g. '36 months | $3,999 due at signing | With approved credit'." },
        dealer_name: { type: "string", description: "New dealer name shown on the banner, e.g. 'Honda City'." },
      },
    },
  },

  // ── Offer extraction from uploaded file ───────────────────────────────────
  {
    name: "propose_parsed_offers",
    description:
      "Extract offers from an image, document, or the user's text and present them as an editable UI card. " +
      "This tool does NOT require the offers to be in the catalog — it creates a new card where the user " +
      "can review, correct, and confirm the extracted offers before they are added to the project. " +
      "Use this tool: (1) when the user shares an image/PDF/file with offer data, " +
      "(2) when the catalog has no offers for the project brand — ALWAYS use this instead of refusing, " +
      "(3) when the user describes offers in text. " +
      "Never tell the user 'these offers aren't in the catalog' — just call this tool and extract what you see.",
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
              confidence_monthly_payment: { type: "string", description: "Confidence for monthly_payment: 'high', 'medium', or 'low'." },
              confidence_term:            { type: "string", description: "Confidence for term: 'high', 'medium', or 'low'." },
              confidence_due_at_signing:  { type: "string", description: "Confidence for due_at_signing: 'high', 'medium', or 'low'." },
              confidence_trim:            { type: "string", description: "Confidence for trim: 'high', 'medium', or 'low'." },
              confidence_year:            { type: "string", description: "Confidence for year: 'high', 'medium', or 'low'." },
              confidence_apr:             { type: "string", description: "Confidence for apr: 'high', 'medium', or 'low'." },
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

  // ── Share for review (reviewer picker card) ───────────────────────────────
  {
    name: "propose_share",
    description:
      "Show the reviewer picker card when the user wants to share/send the project to one or more contacts. " +
      "List ALL contacts the user mentioned in recipient_hints. Internal/Constellation contacts default to " +
      "Platform Message; dealer contacts default to Email. The user can toggle each contact's channel in the UI.",
    input_schema: {
      type: "object" as const,
      properties: {
        recipient_hints: {
          type: "array",
          items: { type: "string" },
          description: "Full names of all intended recipients as known from the contacts list. Include everyone the user mentioned.",
        },
        project_name: {
          type: "string",
          description: "Name of the current project, for display in the share card.",
        },
      },
      required: ["recipient_hints"],
    },
  },

  // ── Email sharing ─────────────────────────────────────────────────────────
  {
    name: "propose_email",
    description:
      "Show the reviewer picker card pre-populated with the mentioned contact(s) when the user explicitly " +
      "asks to send or share the project by email. The user can still toggle each contact's channel.",
    input_schema: {
      type: "object" as const,
      properties: {
        recipient_hints: {
          type: "array",
          items: { type: "string" },
          description: "Full names of all intended recipients mentioned by the user.",
        },
        recipient_hint: {
          type: "string",
          description: "Single recipient name (legacy fallback — prefer recipient_hints).",
        },
      },
      required: [],
    },
  },

  // ── Task owner assignment ─────────────────────────────────────────────────
  {
    name: "propose_task_owners",
    description:
      "Show a card that lets the user assign a task owner to each project section " +
      "(Offers, Templates, Backgrounds, Brand, Assets). Use this when the user asks to " +
      "define or set task owners, regardless of language. " +
      "Pass suggested owners if the user named them, otherwise leave sections empty.",
    input_schema: {
      type: "object" as const,
      properties: {
        owners: {
          type: "object",
          description:
            "Suggested owner names per section. Keys: 'offers', 'templates', 'backgrounds', 'brand', 'assets'. " +
            "Values: full person name (e.g. 'Jenni Eckhart'). Omit sections with no suggestion.",
          additionalProperties: { type: "string" },
        },
      },
      required: [],
    },
  },

  // ── Proactive questions card ──────────────────────────────────────────────
  {
    name: "propose_proactive_questions",
    description:
      "Show a 3-question priority card before starting a proactive full campaign build. " +
      "Use this when the user's message expresses automatic/proactive project intent — including: " +
      "'proactively', 'automatic', 'automatically', 'auto', 'autopilot', 'auto-pilot', 'one-click campaign', " +
      "'build the whole campaign for me', 'build the entire project end to end', 'build it start to finish', " +
      "'create and finish the project/campaign', 'set up the full campaign and finish it', " +
      "'make the complete project for me', 'generate the full campaign automatically', " +
      "'put together the whole campaign', 'do everything for me', 'do it all automatically', " +
      "'handle the whole thing', 'take it from here', 'take care of the whole project', " +
      "'run the full project', 'run with it', 'you decide everything', 'pick everything for me', " +
      "'just make it happen', 'just go ahead and build it', 'complete the project for me', " +
      "'finish everything', 'wrap up the whole campaign', 'no input needed just build it', " +
      "\"don't ask me, just create it\", or any phrase meaning: build everything automatically. " +
      "After the user submits their answers, you will receive a continuation message with those " +
      "priorities to guide your selections across the full build.",
    input_schema: {
      type: "object" as const,
      properties: {
        intro_line: {
          type: "string",
          description: "Short sentence shown above the questions, e.g. \"I've reviewed your catalog and team data — let me ask three quick questions.\"",
        },
      },
      required: [],
    },
  },

  // ── Notify task owners ────────────────────────────────────────────────────
  {
    name: "propose_notify_owners",
    description: "Show a card to notify all current task owners via Email or Platform. Use this when the user says 'notify task owners', 'send to the task owners', 'notifique os responsáveis', or similar. Pass known owners from the project context taskOwners field.",
    input_schema: {
      type: "object" as const,
      properties: {
        owners: {
          type: "object",
          description: "Map of section → owner name from context. Pass what you know.",
          additionalProperties: { type: "string" },
        },
      },
      required: [],
    },
  },

  // ── Jellybean color tools ─────────────────────────────────────────────────
  {
    name: "list_jellybean_colors",
    description:
      "Returns all available exterior color families for a given Honda model (and optionally year). " +
      "Call this before swap_jellybean_color so you know which colors are available. " +
      "Use when the user asks 'what colors are available?' or wants to change the car color.",
    input_schema: {
      type: "object" as const,
      properties: {
        model:  { type: "string", description: "Vehicle model, e.g. 'CR-V', 'Civic', 'HR-V', 'Odyssey'." },
        year:   { type: "string", description: "Optional model year filter, e.g. '2026'." },
      },
      required: ["model"],
    },
  },

  {
    name: "swap_jellybean_color",
    description:
      "Changes the exterior color of a specific offer's jellybean image. " +
      "Call list_jellybean_colors first to confirm the color family is available. " +
      "Use when the user says 'change the car to blue', 'show a red CR-V', 'swap the color', etc.",
    input_schema: {
      type: "object" as const,
      properties: {
        offer_id:     { type: "string", description: "The ID of the offer whose jellybean image to swap." },
        color_family: { type: "string", description: "Target color family: 'black', 'white', 'silver', 'gray', 'red', 'blue', 'green', 'orange'." },
        year:         { type: "string", description: "Optional model year to narrow the match." },
        model:        { type: "string", description: "Vehicle model, e.g. 'CR-V'." },
        trim:         { type: "string", description: "Optional trim level to narrow the match." },
      },
      required: ["offer_id", "color_family", "model"],
    },
  },
];
