"use client";

import React from "react";

// ─── Markdown renderer ────────────────────────────────────────────────────────
export function inlineMarkdown(text: string): React.ReactNode[] {
  // Split on **bold** and render accordingly
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i} style={{ fontWeight: 600, color: "var(--ink)" }}>{p.slice(2, -2)}</strong>
      : p
  );
}

export function MarkdownContent({ text }: { text: string }) {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Detect table block — starts with |
    if (line.trim().startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      // Parse rows, skipping separator rows (---|---)
      const rows = tableLines
        .filter(l => !/^\s*\|[\s\-|]+\|\s*$/.test(l))
        .map(l =>
          l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(c => c.trim())
        );
      if (rows.length > 0) {
        const [header, ...body] = rows;
        nodes.push(
          <div key={`tbl-${i}`} className="overflow-x-auto my-[8px]">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
              <thead>
                <tr style={{ background: "rgba(71,59,171,0.06)", borderBottom: "1.5px solid rgba(71,59,171,0.18)" }}>
                  {header.map((cell, ci) => (
                    <th key={ci} style={{ padding: "5px 10px", textAlign: "left", fontWeight: 600, color: "var(--brand-accent)", whiteSpace: "nowrap", letterSpacing: "0.3px" }}>
                      {inlineMarkdown(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, ri) => (
                  <tr key={ri} style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: ri % 2 === 1 ? "rgba(0,0,0,0.015)" : "transparent" }}>
                    {row.map((cell, ci) => (
                      <td key={ci} style={{ padding: "5px 10px", color: "var(--ink)", whiteSpace: "nowrap" }}>
                        {inlineMarkdown(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // ### heading
    if (line.startsWith("### ")) {
      nodes.push(
        <p key={i} style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)", marginBottom: 2, marginTop: 6 }}>
          {inlineMarkdown(line.slice(4))}
        </p>
      );
      i++; continue;
    }

    // ## heading
    if (line.startsWith("## ")) {
      nodes.push(
        <p key={i} style={{ fontWeight: 700, fontSize: 13.5, color: "var(--ink)", marginBottom: 3, marginTop: 8 }}>
          {inlineMarkdown(line.slice(3))}
        </p>
      );
      i++; continue;
    }

    // Empty line → small gap
    if (line.trim() === "") {
      nodes.push(<div key={i} style={{ height: 6 }} />);
      i++; continue;
    }

    // Regular line
    nodes.push(
      <p key={i} style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.6, letterSpacing: "0.17px" }}>
        {inlineMarkdown(line)}
      </p>
    );
    i++;
  }

  return <div className="flex flex-col gap-[1px]">{nodes}</div>;
}
