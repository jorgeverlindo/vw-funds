import Anthropic from "@anthropic-ai/sdk";
import { agentTools, executeTool } from "../../server/tools";
import { buildSystemPrompt, type ProjectContext } from "../../server/system-prompt";

export const runtime = "edge";

export default async function handler(req: Request): Promise<Response> {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders() });
  }

  const apiKey = process.env.ANTHROPIC_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_KEY not configured on server" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders() } },
    );
  }

  let body: { messages: Anthropic.MessageParam[]; projectContext: ProjectContext };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders() } },
    );
  }

  const { messages, projectContext } = body;
  const anthropic = new Anthropic({ apiKey });

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

          const PROPOSAL_TOOLS = new Set([
            "setup_project", "propose_offers", "propose_templates",
            "propose_backgrounds", "propose_brand", "propose_project",
            "propose_email",
          ]);

          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          let hasProposalTool = false;

          for (const toolBlock of toolUseBlocks) {
            if (PROPOSAL_TOOLS.has(toolBlock.name)) hasProposalTool = true;

            send({ type: "tool_use", id: toolBlock.id, name: toolBlock.name, input: toolBlock.input });

            const result = executeTool(
              toolBlock.name,
              toolBlock.input as Record<string, unknown>,
            );

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
      "X-Accel-Buffering": "no",
      ...corsHeaders(),
    },
  });
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
