import { useState, useRef, useCallback } from "react";

// ─── Multimodal API types ─────────────────────────────────────────────────────
type ApiContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
  | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } };

export type ApiMessage = { role: "user" | "assistant"; content: string | ApiContentBlock[] };

// ─── ProjectContextPayload (minimal shape for the stream call) ─────────────────
export interface ProjectContextPayload {
  projectId: string;
  projectName: string;
  oem: string;
  currentOfferIds: string[];
  currentTemplateIds: string[];
  availableOffers: {
    id: string; year: string; make: string; model: string; trim: string;
    offerType: string; monthlyPayment: number; term: number;
    pvi: number; aging: number; stock: number;
  }[];
  availableTemplates: {
    id: string; name: string; format: string; width: number; height: number; brand: string;
  }[];
  activeBrandOem?: string;
  taskOwners?: Record<string, string>;
}

// ─── SSE streaming hook ────────────────────────────────────────────────────────
export function useAgentStream() {
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const streamMessage = useCallback(
    async (
      messages: ApiMessage[],
      ctx: ProjectContextPayload,
      onDelta:  (d: string) => void,
      onTool:   (name: string, input: Record<string, unknown>) => void,
      onDone:   () => void,
      onError:  (msg: string) => void,
      forceTool?: string,
    ) => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setStreaming(true);
      try {
        const res = await fetch("/api/agent/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortRef.current.signal,
          body: JSON.stringify({ messages, projectContext: ctx, ...(forceTool ? { forceTool } : {}) }),
        });
        if (!res.ok || !res.body) { onError(`Server error ${res.status}`); return; }
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n"); buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim(); if (!raw) continue;
            let ev: Record<string, unknown>;
            try { ev = JSON.parse(raw); } catch { continue; }
            if (ev.type === "text_delta")   onDelta(ev.delta as string);
            else if (ev.type === "tool_result") onTool(ev.name as string, ev.input as Record<string, unknown>);
            else if (ev.type === "done")    onDone();
            else if (ev.type === "error")   onError(ev.message as string);
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") onError(String(err));
      } finally { setStreaming(false); }
    }, []);
  const stop = useCallback(() => { abortRef.current?.abort(); setStreaming(false); }, []);
  return { streaming, setStreaming, streamMessage, stop };
}
