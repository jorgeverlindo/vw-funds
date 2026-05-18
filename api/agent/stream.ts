import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { agentTools, executeTool } from "../_lib/tools";
import { buildSystemPrompt, type ProjectContext } from "../_lib/system-prompt";

// Use Node.js runtime (not Edge) — the Anthropic SDK uses EventEmitter
// which is a Node.js built-in not available in the Edge runtime.
export const config = { maxDuration: 60 };

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
      "propose_email",
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
