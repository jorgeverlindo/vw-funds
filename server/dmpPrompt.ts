// ─── VW DMP Guidelines — Claude Vision Prompt Builder ─────────────────────────
// Builds the compliance audit prompt from exact VW DMP Guidelines (March 2026)
// rule text, filtered by the channel being scanned.
// Each rule entry maps directly to a WCMItem violation via its ruleCode.

export type ScanChannel = "website" | "instagram" | "metaAds";

export interface DmpRule {
  ruleCode: string;
  ruleName: string;
  category: "A" | "B";
  check: string;   // What to visually inspect
  channels: ScanChannel[];  // Which channels this rule applies to
}

// ─── Rule definitions ─────────────────────────────────────────────────────────

export const DMP_RULES: DmpRule[] = [
  // ── Category A ──────────────────────────────────────────────────────────────
  {
    ruleCode: "CAT-A-1A",
    ruleName: "Rule 1A — Non-Compliant Background Color",
    category: "A",
    channels: ["website", "instagram", "metaAds"],
    check:
      "Background color in any ad, banner, or vehicle image is NOT from the VW Primary or Secondary " +
      "brand color palette. VW-approved background colors are: Deep Navy Blue (#001e50), White (#FFFFFF), " +
      "Light Silver/Grey, and approved secondary palette colors. " +
      "Flag if the background is any color clearly outside this palette (e.g., bright yellow, green, red, purple).",
  },
  {
    ruleCode: "CAT-A-1B",
    ruleName: "Rule 1B — Non-Compliant Vehicle Placement",
    category: "A",
    channels: ["website", "instagram", "metaAds"],
    check:
      "Vehicle is NOT shown on a defined road, within lane lines (if present), or legitimately parked " +
      "in a defined parking space with pavement markings (if present). " +
      "PROHIBITED placements: beach/sand, football field, outer space, stadium, fantasy/surreal settings. " +
      "Flag only if you can clearly see the vehicle is placed in a setting that is not a road or parking area.",
  },
  {
    ruleCode: "CAT-A-1C",
    ruleName: "Rule 1C — Non-Compliant Typeface Color",
    category: "A",
    channels: ["website", "instagram", "metaAds"],
    check:
      "Headline, body copy, or lettering color is NOT from the VW Primary brand color palette " +
      "(Deep Navy Blue #001e50, White #FFFFFF, or Black). " +
      "Flag if large headline text uses a color clearly outside this palette (e.g., bright red, yellow, green, pink).",
  },
  {
    ruleCode: "CAT-A-1D",
    ruleName: "Rule 1D — Non-VW Approved Font",
    category: "A",
    channels: ["website", "instagram", "metaAds"],
    check:
      "Only VW-approved fonts are permitted: VW Head (Light, Regular, Bold, Extra Bold) and VW Text. " +
      "Flag if the headline or body copy uses a font that is visibly inconsistent with the VW brand typeface " +
      "(e.g., decorative, script, display, or highly condensed fonts that do not resemble the VW Head family).",
  },
  {
    ruleCode: "CAT-A-3A",
    ruleName: "Rule 3A — VW Logo Non-Compliant",
    category: "A",
    channels: ["website", "instagram", "metaAds"],
    check:
      "The Volkswagen roundel logo must be the current 2D version in VW Primary colors (navy on white, " +
      "or white on navy). Flag if the logo: (1) has a gradient fill, (2) has images/photos inside the logo, " +
      "(3) uses a color outside the VW palette (e.g., blue, green, gold, red), " +
      "(4) has insufficient contrast against the background (dark logo on dark background), " +
      "(5) appears to be the old 3D chrome logo instead of the current flat 2D version.",
  },
  {
    ruleCode: "CAT-A-3B",
    ruleName: "Rule 3B — DBA Name Missing or Oversized",
    category: "A",
    channels: ["website", "instagram", "metaAds"],
    check:
      "The full official Volkswagen Dealership DBA name must appear in all advertising. " +
      "Flag if: (1) no dealership name is visible at all, or (2) the dealership name text height visibly " +
      "exceeds 125% of the VW logo height (the DBA name appears dramatically larger than the VW logo).",
  },
  {
    ruleCode: "CAT-A-3H",
    ruleName: "Rule 3H — Logo Count or Quality Violation",
    category: "A",
    channels: ["website", "instagram", "metaAds"],
    check:
      "No more than 2 logos may appear on screen simultaneously. Flag if: " +
      "(1) more than 2 distinct logos are visible at the same time in this screenshot, or " +
      "(2) a logo appears blurry, pixelated, or low-resolution (raster artifact visible).",
  },
  {
    ruleCode: "CAT-A-4A",
    ruleName: "Rule 4A — Prohibited Sell-Down Language",
    category: "A",
    channels: ["website", "instagram", "metaAds"],
    check:
      "For current model year new vehicles, the following words are strictly PROHIBITED in any text: " +
      "\"Sell-down\", \"Inventory Reduction\", \"Clearance\". " +
      "Flag if any of these exact terms (or very close variants like 'CLEARANCE SALE', 'INVENTORY CLEARANCE') " +
      "appear in any headline, button, banner, overlay, or body copy.",
  },
  {
    ruleCode: "CAT-A-4B",
    ruleName: "Rule 4B — Prohibited Pricing Language",
    category: "A",
    channels: ["website", "instagram", "metaAds"],
    check:
      "The following terms are PROHIBITED: \"special pricing\", \"special purchase\", \"factory discount\", " +
      "\"manufacturer authorized\", \"manufacturer challenged\". " +
      "Flag if any of these phrases appear in any visible text.",
  },
  {
    ruleCode: "CAT-A-4C",
    ruleName: "Rule 4C — Below-Invoice Language",
    category: "A",
    channels: ["website", "instagram", "metaAds"],
    check:
      "The following below-invoice terms are PROHIBITED: \"Dealer cost\", \"Dealer's cost\", \"Wholesale price\", " +
      "\"Bargain price\", \"Rock bottom price\", \"Below invoice\", \"Under invoice\". " +
      "Flag if any of these phrases appear in any visible text.",
  },
  {
    ruleCode: "CAT-A-4D",
    ruleName: "Rule 4D — Brand-Eroding Language",
    category: "A",
    channels: ["website", "instagram", "metaAds"],
    check:
      "The following brand-eroding terms are PROHIBITED: \"Blowout\", \"Liquidation\", \"Outlet\", " +
      "\"Overstocked\", \"Massive reduction\", \"Unbeatable price\", \"Beat any price\", \"We will not be undersold\", " +
      "\"Finance anyone\", \"Finance everyone\", \"Bad credit OK\" (as a headline claim), " +
      "\"Everyone approved\". Flag if any of these appear in headlines or prominent copy.",
  },
  {
    ruleCode: "CAT-A-4E",
    ruleName: "Rule 4E — Offensive or Inappropriate Content",
    category: "A",
    channels: ["website", "instagram", "metaAds"],
    check:
      "Advertising must not contain offensive, sexual, racial, political, or inflammatory content. " +
      "Flag if the image, copy, or any element in this screenshot is clearly offensive, sexually suggestive, " +
      "racially insensitive, politically charged, or otherwise inflammatory.",
  },
  {
    ruleCode: "CAT-A-4G",
    ruleName: "Rule 4G — Vehicle Image Mismatch",
    category: "A",
    channels: ["website", "instagram", "metaAds"],
    check:
      "The vehicle shown in the photo must match the advertised model, year, and trim. " +
      "Flag if the text advertises a specific model (e.g., '2025 Jetta SE') but the vehicle image " +
      "clearly shows a different model or body style (e.g., an SUV shown for a sedan offer). " +
      "Only flag when the mismatch is clear and obvious.",
  },
  {
    ruleCode: "CAT-A-4H",
    ruleName: "Rule 4H — CPO/Used Called 'New'",
    category: "A",
    channels: ["website", "instagram", "metaAds"],
    check:
      "Certified Pre-Owned, used, or pre-owned vehicles must not be described as 'New'. " +
      "Flag if a vehicle labeled as CPO, Certified, or Pre-Owned is also called 'New' in the same " +
      "creative or in nearby text.",
  },
  {
    ruleCode: "CAT-A-4I",
    ruleName: "Rule 4I — Volkswagen Name or Model Misspelled",
    category: "A",
    channels: ["website", "instagram", "metaAds"],
    check:
      "\"Volkswagen\" must be spelled correctly and not abbreviated (except as 'VW' when VWoA allows). " +
      "VW model names must be spelled correctly. Flag if you can see 'Volkswagon', 'Volkswagan', " +
      "or a clearly misspelled model name (e.g., 'Tigun' instead of 'Tiguan', 'Jeta' instead of 'Jetta').",
  },
  {
    ruleCode: "CAT-A-6F",
    ruleName: "Rule 6F — Incorrect VWoA Offer Name",
    category: "A",
    channels: ["website", "instagram", "metaAds"],
    check:
      "VWoA offer names must be used exactly as provided by Volkswagen. Specifically: " +
      "the offer is called 'Customer Bonus' NOT 'Customer Cash'; " +
      "'Loyalty Bonus' NOT 'Loyalty Cash'; " +
      "'College Graduate Bonus' NOT 'College Bonus'. " +
      "Flag if any of the incorrect names ('Customer Cash', 'Loyalty Cash') appear in headlines or offer text.",
  },

  // ── Category B ──────────────────────────────────────────────────────────────
  {
    ruleCode: "CAT-B-2A",
    ruleName: "Rule 2A — 'Volkswagen' Not Spelled Out on First Mention",
    category: "B",
    channels: ["website", "instagram", "metaAds"],
    check:
      "On first mention of the brand in body copy, 'Volkswagen' must be spelled out in full, not abbreviated. " +
      "Flag if body copy text begins directly with 'VW' as the first brand reference without the full " +
      "'Volkswagen' name appearing first. (Headlines using 'VW' are generally acceptable; check body copy.)",
  },
  {
    ruleCode: "CAT-B-2C",
    ruleName: "Rule 2C — VW Trademark Used in Plural or Possessive",
    category: "B",
    channels: ["website", "instagram", "metaAds"],
    check:
      "Volkswagen trademarks must not be used in plural or possessive form. " +
      "Flag if you can see 'Volkswagen's', 'VW's', 'Jettas', 'Tiguans' (plural model names used as common nouns) " +
      "in any body copy or headline.",
  },
  {
    ruleCode: "CAT-B-2D",
    ruleName: "Rule 2D — Clip Art / Cartoon Elements in Vehicle Image",
    category: "B",
    channels: ["website", "instagram", "metaAds"],
    check:
      "Clip art, star bursts, cartoonish graphics, or illustrated elements must not appear superimposed " +
      "ON or WITHIN vehicle photography or product images. " +
      "Note: emojis used in social media post text/caption are allowed. " +
      "Flag if clip art or cartoon elements appear overlaid on the vehicle photo itself.",
  },
  {
    ruleCode: "CAT-B-2F",
    ruleName: "Rule 2F — New and CPO Vehicles Mixed in Same Creative",
    category: "B",
    channels: ["website", "instagram", "metaAds"],
    check:
      "New vehicles and CPO/Certified Pre-Owned/Pre-Owned vehicles must not appear together in the same " +
      "advertisement creative. Flag if the same ad, banner, or post promotes both new AND used/CPO inventory " +
      "simultaneously.",
  },
  {
    ruleCode: "CAT-B-2J",
    ruleName: "Rule 2J — Unsupported Comparative Claim",
    category: "B",
    channels: ["website", "instagram", "metaAds"],
    check:
      "Claims of being '#1 selling dealer' or any comparative superiority claim (e.g., 'Best prices', " +
      "'Lowest prices in LA', 'Top-rated dealer') require pre-approval and substantiation. " +
      "Flag if you see such claims without visible substantiation or disclaimer.",
  },
  {
    ruleCode: "CAT-B-4J",
    ruleName: "Rule 4J — VW Brand Exclusivity Violated",
    category: "B",
    channels: ["website", "instagram", "metaAds"],
    check:
      "VW brand exclusivity must be maintained. Non-VW brand vehicles or branding must not be promoted " +
      "alongside VW in the same creative. Flag if you see another automaker's logo, model, or branding " +
      "featured in the same ad or post as VW content.",
  },
  {
    ruleCode: "CAT-B-6D",
    ruleName: "Rule 6D — Conditional Offer Mixed into Base Price",
    category: "B",
    channels: ["website", "instagram", "metaAds"],
    check:
      "Conditional offers (College Graduate Bonus, Military Bonus, Loyalty Bonus) must be displayed " +
      "separately from the main advertised price — they cannot be incorporated into the headline price. " +
      "Flag if a headline price includes conditional bonuses without clearly separating them " +
      "(e.g., '$XXX/mo including $500 College Grad and $500 Military Bonus' as the main headline price).",
  },
  {
    ruleCode: "CAT-B-7B",
    ruleName: "Rule 7B — Competitor DBA in Ad Copy",
    category: "B",
    channels: ["metaAds"],
    check:
      "Competitor dealership DBA names must not appear in ad copy text. " +
      "Flag if you can see another Volkswagen dealership's name or any competing dealership's official name " +
      "used within the advertisement text (not in a user comment or unrelated element).",
  },
];

// ─── Prompt builder ───────────────────────────────────────────────────────────

export function buildDmpPrompt(
  channel: ScanChannel,
  dealershipName: string,
  pageUrl: string,
): string {
  const rules = DMP_RULES.filter((r) => r.channels.includes(channel));

  const ruleBlock = rules
    .map(
      (r) =>
        `[${r.ruleCode}] ${r.ruleName} (Category ${r.category})\n` +
        `Check: ${r.check}`,
    )
    .join("\n\n");

  return (
    `You are a VW Dealer Marketing Program (DMP) compliance auditor reviewing dealer advertising for VWoA (Volkswagen of America).\n\n` +
    `CHANNEL UNDER REVIEW: ${channel.toUpperCase()}\n` +
    `DEALERSHIP: ${dealershipName}\n` +
    `URL: ${pageUrl}\n\n` +
    `Your task: carefully examine the provided screenshot and identify any visible violations of the ` +
    `VW DMP Guidelines (March 2026 edition). Only report violations you can actually SEE in this image.\n\n` +
    `=== DMP RULES TO CHECK ===\n\n` +
    `${ruleBlock}\n\n` +
    `=== OUTPUT INSTRUCTIONS ===\n\n` +
    `Return a JSON array. Each element is one violation you found. If no violations are visible, return [].\n\n` +
    `Each violation object must have EXACTLY these fields:\n` +
    `{\n` +
    `  "ruleCode": "<e.g. CAT-A-4A>",\n` +
    `  "ruleName": "<full rule name>",\n` +
    `  "category": "A" or "B",\n` +
    `  "description": "<one sentence: exactly what is visible in the image that constitutes this violation>",\n` +
    `  "confidence": "high" | "medium" | "low",\n` +
    `  "quotedText": "<the exact text or element visible in the image, or empty string if no text>"\n` +
    `}\n\n` +
    `IMPORTANT RULES:\n` +
    `- Only report violations with confidence "high" or "medium". Do NOT include "low" confidence findings.\n` +
    `- Do NOT speculate or infer. Only flag what is clearly visible in this screenshot.\n` +
    `- Do NOT flag the same violation twice.\n` +
    `- Return ONLY the JSON array. No markdown, no explanation, no preamble.\n` +
    `- If nothing is visible that violates any rule, return exactly: []`
  );
}

// ─── Helpers for WCMItem construction ─────────────────────────────────────────

export function getRuleByCode(code: string): DmpRule | undefined {
  return DMP_RULES.find((r) => r.ruleCode === code);
}
