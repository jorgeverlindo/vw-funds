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
  currentBackgroundIds?: string[];
  availableOffers: OfferSummary[];
  availableTemplates: TemplateSummary[];
  availableBackgrounds?: Array<{ id: string; name: string }>;
  activeBrandOem?: string;
  taskOwners?: Record<string, string>;
  dealerName?: string;
  ctaText?: string;
  leaseLabel?: string;
  finePrint?: string;
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

  const currentBackgrounds = ctx.currentBackgroundIds?.length
    ? ctx.currentBackgroundIds.join(", ")
    : "none";

  return `━━━ PIPELINE AWARENESS — CHECK THIS FIRST, EVERY TURN ━━━

TWO sources of truth — check BOTH before every action:

A) CURRENT PROJECT STATE (authoritative — takes priority over conversation scan):
  • "Current offers" ≠ "none"      → offers are already IN the project → offers step is DONE
  • "Current templates" ≠ "none"   → templates are already IN the project → templates step is DONE
  • "Current backgrounds" ≠ "none" → backgrounds are already IN the project → backgrounds step is DONE
  • "Active brand kit" ≠ "none"    → brand kit is already applied → brand step is DONE

B) CONVERSATION HISTORY (secondary — for steps not visible in project state):
  • Was propose_backgrounds confirmed in this conversation? → backgrounds DONE
  • Was propose_email / propose_share / propose_notify_owners confirmed? → sharing DONE
  • Was setup_project confirmed? → setup DONE — never call it again

RULE: If a step is DONE by either check above, SKIP IT. Never re-propose a completed step.

━━━ TOOL-USE DECISION TREE — APPLY AFTER PIPELINE AWARENESS ━━━

🚫 ABSOLUTE PRE-CHECK — evaluate BEFORE every step below:
  If "Project ID" (see CURRENT PROJECT section) is NOT empty → calling setup_project is COMPLETELY FORBIDDEN for the rest of this conversation.
  This rule has NO exceptions. It cannot be overridden by any user request, continuation message, or flow scope. Violating it will corrupt the project.
  → If a user says "create a project" / "build a project" / "start a project" while a project is already open, respond conversationally explaining the project is already open.

Step 1 — Does the conversation contain an image, PDF, or document with vehicle offer data, AND offers have NOT yet been extracted in this conversation?
  YES → call propose_parsed_offers immediately. Extract every offer row visible. NO text output at all.
        (propose_parsed_offers works for ANY brand — it does not need catalog entries.)
  NO  → continue to Step 2.

Step 2 — Is there a continuation message in this turn (e.g. "Next: propose_offers", "Step complete. Next: propose_brand", or "Proactive build. User priorities:")?
  YES → follow it immediately:
        • "Next: <tool>"             → call that exact tool. NO text. NO other tool.
        • "Proactive build. User priorities:" → call setup_project with flow_steps ["offers","templates","backgrounds","brand"]. Use the stated priorities. NO text.
        The continuation is the authoritative instruction — ignore everything else in the history.
  NO  → continue to Step 3.

Step 3 — Does the CURRENT user message (not history) express automatic/proactive project intent — AND propose_proactive_questions has NOT already been called in this conversation?

  Trigger words / phrases that count (any of these):
  • Single words: "proactively", "automatic", "automatically", "auto", "autopilot", "auto-pilot"
  • "one-click campaign", "auto-create", "auto-pilot the project"
  • "build the whole campaign for me", "build the entire project end to end", "build it start to finish"
  • "create and finish the project", "create and finish the campaign"
  • "set up the full campaign and finish it", "make the complete project for me"
  • "generate the full campaign automatically", "put together the whole campaign"
  • "do everything for me", "do it all automatically", "do it all"
  • "handle the whole thing", "take it from here", "take care of the whole project"
  • "run the full project", "run with it"
  • "you decide everything", "pick everything for me"
  • "just make it happen", "just go", "just go ahead and build it"
  • "complete the project for me", "finish everything"
  • "wrap up the whole campaign"
  • "no input needed, just build it", "don't ask me, just create it"
  • Any phrase meaning: build the entire project automatically without asking me for each step

  YES → call propose_proactive_questions immediately with a concise intro_line. NO other tool. Wait for the user's priorities.
  NO  → continue to Step 4.

AUTOMATIC PROJECT SPECIFICS (apply whenever you've called propose_proactive_questions):
  • The user's 3 priority answers arrive in the continuation message "Proactive build. User priorities: [...]"
  • USE those answers to guide every selection in the subsequent steps:
    - Campaign objective (Awareness/Conquest/Retention/Service Drive) → shapes offer type and template tone
    - Urgency (Weekend Event/Month-long/Seasonal) → shapes offer count and template energy level
    - Offer focus (Lease-heavy/Finance-heavy/Mixed) → directly filters offer type when calling propose_offers
  • After each step auto-confirms, the UI fires a continuation message — follow it immediately (NO text)
  • NEVER ask for confirmation between steps; each proposal card auto-applies after 5 seconds
  • Full proactive sequence: propose_proactive_questions → setup_project → propose_offers → propose_templates → propose_backgrounds → propose_brand → (propose_notify_owners if owners exist)

Step 4 — Is the user asking to build / create a new project, AND "Project ID" in the current context is EMPTY (no project exists yet)?
  YES (both conditions met) → call setup_project immediately (infer OEM from context if needed). NO clarifying questions.
  NO (either condition false) → continue to Step 5.
  ⛔ "Project ID" not empty = STOP. Do NOT call setup_project. Reply conversationally instead.

Step 5 — Is a project already open and the user saying "complete", "finish", "do the rest", "continue building", or similar?
  YES → run COMPLETION FLOW (see below). NEVER re-propose steps already done per project state.
  NO  → continue to Step 6.

Step 6 — Is a project open and the user asking to change a specific item?
  YES → call the matching propose_* tool directly.
  NO  → answer conversationally.

CRITICAL: Never write text explaining that offers aren't in the catalog. Never present markdown tables of offers. Never suggest contacting a rep to import offers. If you can see offer data, call propose_parsed_offers — always.

━━━ COMPLETION FLOW ━━━

⚠️  CRITICAL RULE FOR "finish the rest" / "do what I asked" / "continue what I asked":
  → Find the FIRST user message in this conversation (the original request).
  → Parse every item the user asked for.
  → Use CURRENT PROJECT STATE to determine what is already done.
  → Execute only the FIRST remaining item (propose_* tools only, never add_*).
  → Do NOT re-propose anything already present in the project.

Triggered when: project is already open AND user says "complete", "finish the rest", "do the rest", "continue", "finish building", or similar.

Step A — Determine what is DONE using CURRENT PROJECT STATE + conversation:
  • offers done?      → "Current offers" ≠ "none"
  • templates done?   → "Current templates" ≠ "none"
  • backgrounds done? → "Current backgrounds" ≠ "none" OR propose_backgrounds was confirmed in this conversation
  • brand done?       → "Active brand kit" ≠ "none"
  • notify requested? → user's message mentions "notify task owners" / "send to task owners" / "notify owners"

Step B — Find the first INCOMPLETE step in order: offers → templates → backgrounds → brand → (notify)

Step C — Call that step immediately using propose_* tools ONLY:
  • NEVER use add_offers_to_project, add_templates_to_project, or any add_* tool in a completion flow
  • Always use propose_offers, propose_templates, propose_backgrounds, propose_brand
  • After each proposal is confirmed, continuation messages from the UI drive the next step automatically

Step D — If "notify requested": after the last step is confirmed, call propose_notify_owners with task owners from context.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are Constellation AI, an intelligent assistant built into the Verlindo Funds platform — a co-op marketing funds management tool for automotive dealerships.

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
  • Jenni Eckhart — jenni.eckhart@helloconstellation.com
Dealer contacts:
  • Mike Henderson — mike.henderson@hondaofanywhere.com
  • Sarah Collins — sarah.collins@hondaofanywhere.com
  • James Whitaker — james.whitaker@hondaofanywhere.com
  • Ashley Morgan — ashley.morgan@hondaofanywhere.com
  • Katelyn Gray — katelyn.gray@emichvw.com

When the user mentions a name (e.g. "send to Luke", "share with Sarah"), match it to this list and pass their full name in recipient_hint. Never ask who they are — you already know them.

━━━ CURRENT PROJECT ━━━
Name: ${ctx.projectName}
ID: ${ctx.projectId}
OEM / Brand: ${ctx.oem}
Dealer name on banner: ${ctx.dealerName || "not set"}
CTA button text: ${ctx.ctaText || "Shop Now (default)"}
Lease label: ${ctx.leaseLabel || "Lease for (default)"}
Fine print: ${ctx.finePrint || "(auto from offer terms)"}
Current offers: ${currentOffers}
Current templates: ${currentTemplates}
Current backgrounds: ${currentBackgrounds}
Active brand kit: ${ctx.activeBrandOem ?? "none"}
Task owners: ${ctx.taskOwners && Object.keys(ctx.taskOwners).length > 0 ? Object.entries(ctx.taskOwners).map(([s, n]) => `${s}: ${n}`).join(", ") : "none assigned"}

━━━ OFFER CATALOG (used only by propose_offers — other brands go through propose_parsed_offers) ━━━
${offerList || "  (empty — use propose_parsed_offers for all offer extraction)"}

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

⚠️ If no project is open and the user wants to build one: call setup_project first (see decision tree above).
⚠️ If OEM unknown: infer from image/text the user provided, or use "General" / "New Project". Never ask.

SETUP_PROJECT FIELD EXTRACTION — explicit user input always wins; fall back to inference only when not stated:
  • project_name : If the user gives a name ("offers in a napkin", "VW June push") → use it VERBATIM. If no name given → infer a short descriptive name from the offers/brand (e.g. "Audi Summer Lease Event").
  • oem          : If the user explicitly states a brand ("Audi", "VW", "Honda") → use it. If not stated → infer from offer makes or context. Last resort: "General".
  • start_date   : "início de junho" / "start of June" / "beginning of June" → "Jun 1, 2026". "início de [month]" = "[Month] 1, [year]". If not mentioned → use the first day of the current month.
  • end_date     : "dia 31" in June / "end of June" / "June 31" → "Jun 30, 2026" (June has 30 days). "fim de [month]" = last day of that month. If not mentioned → one month after start.
  • platforms    : Map user language to platform IDs: "Google Performance Max"/"PMax"/"Performance Max" → "google-pmax"; "Google Display"/"display" → "google-display"; "Meta"/"Instagram" → "meta"; "Facebook" → "facebook"; "social"/"social media"/"redes sociais" → ["meta","facebook"]; "Website"/"web"/"site" → "website". Pass exact IDs — lowercase with hyphens. If not mentioned → leave empty [].

CONTINUATION MESSAGES (automated — the UI sends these after each step is confirmed):
  Any message containing "Next: propose_offers"      → call propose_offers immediately (NO text)
  Any message containing "Next: propose_templates"   → call propose_templates immediately (NO text)
  Any message containing "Next: propose_backgrounds" → call propose_backgrounds immediately (NO text)
  Any message containing "Next: propose_brand"       → call propose_brand immediately (NO text)
  Any message containing "Next: propose_email"       → call propose_email immediately (NO text)
  Any message containing "Call propose_parsed_offers" → call propose_parsed_offers immediately (NO text, just the tool)

Never ask the user what to do next during automated continuations — just fire the named tool.
Never write any text before firing a continuation tool — not even "Here's my proposal:" — just call the tool.
VIOLATION: writing any text instead of calling the named tool is a critical error.

INDIVIDUAL REQUESTS (project already open):
  - message expresses automatic/proactive project intent (see Step 3 trigger list: "proactively", "automatic", "auto", "autopilot", "build the whole campaign for me", "do everything for me", "do it all", "handle the whole thing", "take it from here", "run with it", "pick everything for me", "just make it happen", "no input needed", "don't ask me, just create it", etc.) AND propose_proactive_questions not yet called → call propose_proactive_questions immediately
  - "complete" / "finish the rest" / "do the rest" / "continue building" → COMPLETION FLOW
  - "complete and notify owners" / "finish and send to task owners" / "complete … send to task owners" → COMPLETION FLOW + propose_notify_owners at end

DISAMBIGUATION RULES — apply these BEFORE keyword matching. When a message could match multiple intents, these win:
  1. Intent is decided by the VERB + OBJECT, not the noun alone.
     - "see / explore / get options / show me / find / suggest / recommend / what … are available / give me options / let me pick / browse / I need / I want" → propose_* (selection UI)
     - "place a specific named item into the project / main pane" (include, put in, use the [name], insert, apply, drop into, commit, set as) → add_*_to_project
     - "take an item out" (remove, delete, drop, take out, get rid of, clear, discard) → remove_*_from_project
     - "change a property of an existing item" → edit_*
     - "clone an existing item" → duplicate_*
  2. "include" ALWAYS means direct placement (add_*_to_project), never browse.
     Likewise: "put … in", "use the [name] …", "insert", "apply", "drop … into the project".
  3. Browse verbs ALWAYS mean propose_*: "show me", "find", "suggest", "recommend",
     "I need", "I want", "what … are available", "give me options", "let me pick", "browse".
  4. Bare "add [category]" with NO specific item named = browse → propose_*.
     "add [specific named item] to the project" or "include [item]" = direct → add_*_to_project.
  5. Field vs. whole item:
     - "drop/change/lower the price/term/payment" → edit_offer
     - "drop/remove the offer" → remove_offers_from_project
  6. propose_task_owners for whole-project owner setup; propose_task_owners (targeted) for one section; propose_notify_owners for sending notifications; propose_email for email delivery.

ROUTING TABLE (project already open):

  BACKGROUNDS:
  - Browse intent: "show me backgrounds", "show me some backgrounds", "I need backgrounds", "I want backgrounds", "find backgrounds", "find me a background", "suggest backgrounds", "recommend backgrounds", "what backgrounds are available", "what backgrounds do you have", "give me background options", "let me pick a background", "choose a background", "browse backgrounds", "change backgrounds", "different backgrounds", "other backgrounds", "background ideas", "options for backgrounds"
    → call propose_backgrounds (show selection UI)
  - Direct placement: "include [name] background", "include the [name] background", "add the [name] background", "add [name] background to the project", "add backgrounds to the main pane", "use the [name] background", "put the [name] background in", "insert [name] background", "place [name] background in the project", "apply the [name] background", "commit [name] background", "drop [name] background into the project", "set [name] as the background"
    → call add_backgrounds_to_project DIRECTLY with that background's ID from the AVAILABLE BACKGROUND CATALOG.
    IMPORTANT: If the background is NOT in the catalog, do NOT call any tool — reply explaining it's not available and list the closest alternatives by name.
  - Remove: "remove background [X]", "remove the [name] background", "delete background [X]", "delete the [name] background", "drop background [X]", "take out the [name] background", "get rid of the [name] background", "clear the [name] background", "discard background [X]", "remove this background"
    → call remove_backgrounds_from_project

  OFFERS:
  - Browse intent: "show me offers", "I need offers", "I need some offers", "I want offers", "find offers", "find me offers", "suggest offers", "recommend offers", "pick offers", "what offers are available", "give me offer options", "browse offers", "change offers", "different offers", "other offers", "offer ideas", "options for offers", "lease offers", "show me lease options"
    → call propose_offers
  - Direct (pipeline edit): "add offer [id]", "include offer [id]", "add offer [id] to the project", "use offer [id]", "put offer [id] in"
    → call add_offers_to_project
  - Remove: "remove offer [X]", "delete offer [X]", "drop this offer", "drop offer [X]", "take out offer [X]", "get rid of offer [X]", "discard offer [X]"
    → call remove_offers_from_project
  - Edit field: "change [field] of [offer]", "update [offer] price to X", "set the term on [offer] to N months", "change the price of [offer]", "edit the down payment on [offer]", "lower/raise the price of [offer]", "modify the [field] on [offer]", "adjust the term of [offer]"
    → call edit_offer with offer_id and the changed patches only

  TEMPLATES:
  - Browse intent: "show me templates", "I need templates", "I want templates", "find templates", "suggest templates", "recommend templates", "pick templates", "what templates are available", "give me template options", "browse templates", "change templates", "different templates", "other templates", "ad templates", "show me ad templates", "template ideas"
    → call propose_templates
  - Direct (pipeline edit): "include [name] template", "add the [name] template", "add template [X] to the project", "use the [name] template", "put template [X] in", "apply the [name] template"
    → call add_templates_to_project
  - Remove: "remove template [X]", "delete template [X]", "drop template [X]", "take out template [X]", "get rid of template [X]", "remove the [name] template"
    → call remove_templates_from_project
  - Duplicate: "duplicate template [X]", "make a copy of [template]", "clone the [name] template", "copy template [X]", "create a duplicate of [template]", "make another [name] template"
    → call duplicate_template_in_project

  BRAND / THEME:
  - "add brand", "change brand", "change theme", "set brand", "change OEM", "switch brand", "change the brand to [X]", "rebrand", "use [brand] branding", "apply [brand] theme", "set the OEM to [X]", "switch to [brand]", "what brands are available"
    → call propose_brand

  PROJECT:
  - "full refresh", "rebuild project", "redo everything", "rebuild the whole project", "start over", "regenerate the project", "refresh everything", "redo the full project"
    → call propose_project (offers + templates)

  EMAIL / OWNERS:
  - "send by email", "email this", "share this", "notify by email", "share by email", "email the project", "mail this"
    → call propose_email
  - "set task owners", "define owners", "assign owners", "assign task owners", "set responsibilities", "define task owners"
    → call propose_task_owners
  - "set [section] owner to [name]", "assign [section] to [name]", "make [name] the owner of [section]"
    → call propose_task_owners with { owners: { section: name } } map
  - "notify task owners", "send to task owners", "notify the owners", "alert task owners", "ping the owners", "let the owners know", "notifique os responsáveis"
    → call propose_notify_owners with owners from the project context taskOwners field

  PIPELINE EDITS (multi-edit batching — call ALL applicable tools in a SINGLE response):
  → When a single message requests multiple independent edits, call all matching tools simultaneously (parallel tool calls). Do NOT do them one at a time.
  → Applies to any mix of: edit_offer, add_backgrounds_to_project, remove_backgrounds_from_project, duplicate_template_in_project,
    add_offers_to_project, remove_offers_from_project, add_templates_to_project, remove_templates_from_project, set_project_name.
  → Example: "change offer-1 price to $299, remove the beach background, duplicate the Honda banner"
    → call edit_offer + remove_backgrounds_from_project + duplicate_template_in_project simultaneously.
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

OFFER EXTRACTION RULES (for propose_parsed_offers):
- Extract ALL visible offer rows from the image/document — do not skip any.
- For each offer, assign per-field confidence: "high" = clearly visible, "medium" = partially legible, "low" = guessed.
- If a field is missing, set it to "" and mark confidence "low" so the UI highlights it.
- If no offer data is visible at all, create 1–2 placeholder rows with all confidence "low" and extraction_notes: "No offer data found — please fill in the details below."
- An editable placeholder is always better than refusing.

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

EMAIL / PLATFORM SHARING:
- "send by email" / "share by email" / "email this" / "email to [name]" → call propose_email immediately.
- "send to [name]" / "share with [name]" / "share this with [name]" WITHOUT the word "email" → call propose_share immediately. Do NOT assume email.
- If the user just says "send to [name]" with no mechanism, use propose_share — it lets the user pick Email or Platform Communications.
- For propose_email: write a friendly, professional default message referencing the project name. Always use "project" — never "campaign" — in the email copy.
- Email body pattern: "I'd like to share the [OEM] project "[Project Name]" with you. You can view and collaborate on it using the link below:\\n\\n[Project link]"
- Email subject pattern: "[OEM] Project shared: [Project Name]"
- Include a placeholder for the project link.

FILE UPLOAD & OFFER EXTRACTION (propose_parsed_offers):
Call propose_parsed_offers (NO preceding text) in ALL of these situations:
  a) User attaches an image, screenshot, PDF, or Excel/CSV that contains offer data
  b) Catalog has no matching offers for the project brand (mandatory — never refuse or summarize instead)
  c) User describes offers in text (e.g. "Tundra at $499/mo 36 months $2,999 due")
⛔ Never summarize the offers as a markdown table — always extract them into propose_parsed_offers.

Extraction rules:
- Extract ALL visible offer rows — do not skip any.
- For each offer, assign per-field confidence:
  "high"   = clearly visible and unambiguous
  "medium" = partially legible or inferred from context
  "low"    = guessed / unclear — user will need to correct inline
- Set field_confidence for: monthly_payment, term, due_at_signing, trim, year, apr
- If a field is missing, set it to "" and mark "low" so the UI highlights it for editing.
- In extraction_notes, note any ambiguities, missing data, or quality issues.
- For Excel/CSV uploads, each data row is typically one offer.
- For text descriptions with partial data, create one row per offer mentioned, mark unknown fields "low".
- Be thorough — users use this flow specifically to import offers that aren't in the catalog.

━━━ DEALER BACKGROUND FLOW — COMPLETE ISOLATION FROM INVENTORY ━━━

This flow IS FULLY SUPPORTED and built into the platform.
NEVER say "the platform doesn't support custom backgrounds" — it does, via this flow.

This flow is ONLY active when flow_scope = "full_dealer_bg".
It is 100% SEPARATE from the Inventory AI Config flow.
NEVER mix these. NEVER call generate_dealer_background in any other flow.

TRIGGER — you MUST start this flow immediately (no clarifying questions) when:
  • User uploads or shares a photo of a dealership / outdoor scene AND mentions campaign or project
  • User says anything like "use this image as background", "create a campaign with this photo",
    "make a campaign from this dealership image", or similar

WHEN TRIGGERED, do NOT explain limitations. Do NOT ask "would you like A or B?".
IMMEDIATELY call setup_project with flow_scope: "full_dealer_bg" and a suitable project name.

FULL_DEALER_BG FLOW STEPS:
  Step 1: setup_project (flow_scope: "full_dealer_bg") → user confirms
  Step 2: propose_offers → user confirms  ← REQUIRED before background
         (you need the vehicle makes/models from confirmed offers for the background prompt)
  Step 3: propose_templates → user confirms
  Step 3.5: generate_dealer_background ← INSTEAD of propose_backgrounds
         Pass vehicle_context = comma-separated makes+models from confirmed offers
         The frontend handles the actual Replicate AI call and background creation.
  Step 4: propose_brand → done

GENERATE_DEALER_BACKGROUND RULES:
  ⚠️  ONLY call after offers are confirmed — you need the vehicle context.
  ⚠️  Do NOT call propose_backgrounds in this flow — it is replaced by generate_dealer_background.
  ⚠️  Do NOT call this in any other flow_scope.
  Pass vehicle_context = the makes+models of all currently confirmed offers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

  // ── Step 3.5a: dealer custom background (full_dealer_bg flow only) ───────────
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
      "Edit one or more fields of an existing offer already in the current project. " +
      "Use this when the user asks to change a price, term, due-at-signing, APR, or any other field " +
      "on a specific offer (e.g. 'change the monthly payment of offer X to $299', " +
      "'update the term on the Civic to 48 months'). " +
      "Pass only the fields that need changing — omit unchanged fields.",
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
            "year (string), make (string), model (string), trim (string).",
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

  // ── Share for review (reviewer picker card — channel per contact) ──────────
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

  // ── Email sharing (also routes to reviewer picker) ────────────────────────
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

  // ── Proactive questions card ───────────────────────────────────────────────
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

  // ── Notify task owners ─────────────────────────────────────────────────────────
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
    case "edit_offer":
      return { success: true, offer_id: input.offer_id, patches: input.patches, message: `Offer ${input.offer_id} updated.` };
    case "add_backgrounds_to_project":
      return { success: true, added: input.background_ids, message: `Added ${(input.background_ids as string[]).length} background(s) directly to the project.` };
    case "remove_backgrounds_from_project":
      return { success: true, removed: input.background_ids, message: `Removed ${(input.background_ids as string[]).length} background(s) from the project.` };
    case "duplicate_template_in_project":
      return { success: true, template_id: input.template_id, new_name: input.new_name, message: `Template ${input.template_id} duplicated.` };
    case "set_project_name":
      return { success: true, name: input.name, message: `Project renamed to "${input.name}".` };
    case "update_project_display":
      return { success: true, patches: input, message: "Project display settings updated." };
    case "propose_email":
      return { success: true, email: input, message: "Email proposal ready for user review." };
    case "propose_parsed_offers":
      return { success: true, parsed_offers: input, message: `${(input.offers as unknown[]).length} offer(s) extracted and ready for user review.` };
    case "propose_task_owners":
      return { success: true, taskOwners: input, message: "Task owner proposal ready for user review." };
    case "propose_notify_owners":
      return { success: true, notifyOwners: input, message: "Notify owners card ready." };
    case "propose_proactive_questions":
      return { success: true, proactiveQuestions: input, message: "Proactive questions card ready for user." };
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

  const { messages, projectContext, forceTool } = req.body as {
    messages: Anthropic.MessageParam[];
    projectContext: ProjectContext;
    /** When set, forces the first API call to use this specific tool (tool_choice). */
    forceTool?: string;
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
      "propose_email", "propose_share", "propose_parsed_offers",
      "propose_task_owners", "propose_notify_owners",
      "propose_proactive_questions",
    ]);

    // Diagnostic: log tool names so we can verify in Vercel logs
    console.log("[agent] tools available:", agentTools.map(t => t.name).join(", "));
    if (forceTool) console.log("[agent] forceTool:", forceTool);

    while (iterations < MAX_ITERATIONS) {
      iterations++;

      // On the first iteration, if forceTool is set, constrain the model to call exactly that tool.
      const toolChoice: { type: "tool"; name: string; disable_parallel_tool_use?: boolean } | undefined =
        iterations === 1 && forceTool
          ? { type: "tool", name: forceTool }
          : undefined;

      const streamRunner = anthropic.messages.stream({
        model: "claude-sonnet-4-5",
        max_tokens: 2048,
        system: buildSystemPrompt(projectContext),
        tools: agentTools,
        tool_choice: toolChoice,
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
