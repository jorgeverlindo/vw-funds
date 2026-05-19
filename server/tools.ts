import type Anthropic from "@anthropic-ai/sdk";

// ─── Tool Definitions ─────────────────────────────────────────────────────────

export const agentTools: Anthropic.Tool[] = [
  // ── Step 1: project setup (used when no project is open yet) ──────────────
  {
    name: "setup_project",
    description:
      "Propose project metadata — name, account, brand, and date range — for the user to confirm " +
      "before the project is created. Use this as the FIRST step when the user wants to build a " +
      "campaign and no project is currently open. Always set flow_scope to match the user's intent. " +
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
        flow_scope: {
          type: "string",
          enum: ["full", "offers_only", "templates_only", "offers_and_templates", "templates_and_email", "offers_and_email"],
          description:
            "Scope of this build flow based on what the user asked for. " +
            "full = complete campaign (offers→templates→backgrounds→brand kit). " +
            "templates_only = just propose templates, then stop. " +
            "offers_only = just propose offers, then stop. " +
            "offers_and_templates = propose offers then templates, skip backgrounds & brand. " +
            "templates_and_email = propose templates then email share, skip backgrounds & brand. " +
            "offers_and_email = propose offers then email share, skip templates/backgrounds/brand.",
        },
        owner: {
          type: "string",
          description: "Full name of the project owner (e.g. 'Jorge Verlindo'). Leave blank to default to the current user.",
        },
        platforms: {
          type: "array",
          items: { type: "string" },
          description: "Ad platforms. Valid values: 'Google PMax', 'Google Display', 'Meta', 'Website', 'TikTok', 'YouTube', 'Email'. Map user language: 'Google Performance Max' / 'Performance Max' / 'PMax' → 'Google PMax'; 'Meta' / 'Instagram' / 'Facebook' → 'Meta'.",
        },
      },
      required: ["project_name", "oem", "start_date", "end_date", "flow_scope"],
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

  // ── Step 3.5: background selection ────────────────────────────────────────────
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
    name: "edit_offer",
    description:
      "Edit one or more fields on an offer that is already in the current project. " +
      "Use this when the user asks to correct or change a value on an existing offer — " +
      "e.g. 'fix the monthly payment to $322', 'change the term to 48 months', " +
      "'correct the due at signing'. " +
      "Look up the offer ID from the current offer IDs list in the project context. " +
      "Only include the fields that need to change.",
    input_schema: {
      type: "object" as const,
      properties: {
        offer_id: {
          type: "string",
          description: "ID of the offer to edit — must be in the current project.",
        },
        monthly_payment: {
          type: "number",
          description: "New monthly payment amount (dollars, no symbol).",
        },
        term: {
          type: "number",
          description: "New lease/finance term in months.",
        },
        total_due_at_signing: {
          type: "number",
          description: "New total due at signing (dollars).",
        },
        offer_type: {
          type: "string",
          description: "New offer type: 'Lease', 'Finance', or 'Purchase'.",
        },
        trim: {
          type: "string",
          description: "New trim level label.",
        },
        year: { type: "string", description: "New model year." },
        make: { type: "string", description: "New make." },
        model: { type: "string", description: "New model name." },
      },
      required: ["offer_id"],
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

  // ── Sharing mechanism chooser ──────────────────────────────────────────────────
  {
    name: "propose_share",
    description:
      "Propose a sharing mechanism when the user wants to send or share a project with someone " +
      "but has NOT specified whether to use email or the platform. " +
      "Shows a choice card: 'Send via Email' or 'Send via Platform Communications'. " +
      "Use this INSTEAD of propose_email when the user says things like 'send to [name]', " +
      "'share with [name]', 'send this to Katelyn' — without saying 'email'.",
    input_schema: {
      type: "object" as const,
      properties: {
        recipient_hint: {
          type: "string",
          description: "Name of the intended recipient (e.g. 'Katelyn', 'Sarah Collins'). Required.",
        },
        project_name: {
          type: "string",
          description: "Current project name, for display in the card. Leave blank to use the active project name.",
        },
      },
      required: ["recipient_hint"],
    },
  },

  // ── Email sharing ──────────────────────────────────────────────────────────────
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

  // ── Task owner assignment ──────────────────────────────────────────────────────
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

  // ── Notify task owners ─────────────────────────────────────────────────────────
  {
    name: "propose_notify_owners",
    description:
      "Show a card to notify all current task owners via Email or Platform. " +
      "Use this when the user says 'notify task owners', 'send to the task owners', " +
      "'notifique os responsáveis', or any similar phrasing. " +
      "Pass the known owners from the project context as hints.",
    input_schema: {
      type: "object" as const,
      properties: {
        owners: {
          type: "object",
          description: "Map of section → owner name from the project context taskOwners field. Pass what you know.",
          additionalProperties: { type: "string" },
        },
      },
      required: [],
    },
  },
];

// ─── Tool Executor ────────────────────────────────────────────────────────────

export function executeTool(
  toolName: string,
  input: Record<string, unknown>,
): Record<string, unknown> {
  switch (toolName) {
    case "setup_project":
      return {
        success: true,
        setup: input,
        message: "Project setup proposal ready for user review.",
      };

    case "propose_offers":
      return {
        success: true,
        offers: input,
        message: "Offers proposal ready for user review.",
      };

    case "propose_templates":
      return {
        success: true,
        templates: input,
        message: "Templates proposal ready for user review.",
      };

    case "propose_backgrounds":
      return {
        success: true,
        backgrounds: input,
        message: "Backgrounds proposal ready for user review.",
      };

    case "propose_brand":
      return {
        success: true,
        brand: input,
        message: "Brand kit proposal ready for user review.",
      };

    case "propose_project":
      return {
        success: true,
        proposal: input,
        message: "Full proposal ready for user review.",
      };

    case "add_offers_to_project":
      return {
        success: true,
        added: input.offer_ids,
        message: `Added ${(input.offer_ids as string[]).length} offer(s) to the project.`,
      };

    case "edit_offer":
      return {
        success: true,
        edited: input.offer_id,
        message: `Offer ${input.offer_id} updated.`,
      };

    case "remove_offers_from_project":
      return {
        success: true,
        removed: input.offer_ids,
        message: `Removed ${(input.offer_ids as string[]).length} offer(s) from the project.`,
      };

    case "add_templates_to_project":
      return {
        success: true,
        added: input.template_ids,
        message: `Added ${(input.template_ids as string[]).length} template(s) to the project.`,
      };

    case "remove_templates_from_project":
      return {
        success: true,
        removed: input.template_ids,
        message: `Removed ${(input.template_ids as string[]).length} template(s) from the project.`,
      };

    case "set_project_name":
      return {
        success: true,
        name: input.name,
        message: `Project renamed to "${input.name}".`,
      };

    case "propose_share":
      return {
        success: true,
        share: input,
        message: "Share mechanism choice card ready for user.",
      };

    case "propose_email":
      return {
        success: true,
        email: input,
        message: "Email proposal ready for user review.",
      };

    case "propose_task_owners":
      return {
        success: true,
        taskOwners: input,
        message: "Task owner proposal ready for user review.",
      };

    case "propose_notify_owners":
      return {
        success: true,
        notifyOwners: input,
        message: "Notify owners card ready for user.",
      };

    default:
      return { success: false, message: `Unknown tool: ${toolName}` };
  }
}
