// ─── Canonical tool executor ──────────────────────────────────────────────────
// Single source of truth for all tool execution logic.

import { jbListColors, jbResolve } from "./jellybean.js";

export function executeTool(
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
    case "generate_dealer_background":
      return { success: true, dealer_background: input, message: "Dealer background generation initiated. The frontend will process the uploaded image." };
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
    case "update_project_display": {
      const i = input as { cta_text?: string; lease_label?: string; fine_print?: string; dealer_name?: string };
      const patches: Record<string, string> = {};
      if (i.cta_text    !== undefined) patches.ctaText    = i.cta_text;
      if (i.lease_label !== undefined) patches.leaseLabel = i.lease_label;
      if (i.fine_print  !== undefined) patches.finePrint  = i.fine_print;
      if (i.dealer_name !== undefined) patches.dealerName = i.dealer_name;
      return { success: true, patches, message: "Project display settings updated." };
    }
    case "propose_email":
      return { success: true, email: input, message: "Email proposal ready for user review." };
    case "propose_share":
      return { success: true, share: input, message: "Share mechanism choice card ready for user." };
    case "propose_parsed_offers":
      return { success: true, parsed_offers: input, message: `${(input.offers as unknown[]).length} offer(s) extracted and ready for user review.` };
    case "propose_task_owners":
      return { success: true, taskOwners: input, message: "Task owner proposal ready for user review." };
    case "propose_notify_owners":
      return { success: true, notifyOwners: input, message: "Notify owners card ready." };
    case "propose_proactive_questions":
      return { success: true, proactiveQuestions: input, message: "Proactive questions card ready for user." };
    case "list_jellybean_colors": {
      const { model, year } = input as { model: string; year?: string };
      const colors = jbListColors(model, year);
      return {
        success: true, model, year, available_colors: colors,
        message: colors.length
          ? `Available colors for ${model}: ${colors.join(", ")}.`
          : `No jellybean entries found for model "${model}".`,
      };
    }
    case "swap_jellybean_color": {
      const { offer_id, color_family, model, year, trim } = input as { offer_id: string; color_family: string; model: string; year?: string; trim?: string };
      const match = jbResolve(model, color_family, year, trim);
      if (!match) {
        const available = jbListColors(model, year);
        return { success: false, message: `No jellybean found for ${model} in color family "${color_family}". Available colors: ${available.join(", ")}.` };
      }
      return { success: true, offer_id, color_family, jellybean_url: match.url, jellybean_id: match.id, message: `Jellybean swapped to ${color_family} for offer ${offer_id}.` };
    }
    default:
      return { success: false, message: `Unknown tool: ${toolName}` };
  }
}
