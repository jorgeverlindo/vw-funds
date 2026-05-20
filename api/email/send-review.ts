import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface OfferSummary {
  id: string;
  year: string;
  make: string;
  model: string;
  trim?: string;
  offerType: string;
  monthlyPayment: number;
  term: number;
}

interface TemplateSummary {
  id: string;
  name: string;
  format?: string;
}

interface ProjectSummary {
  projectId?: string;
  projectName: string;
  oem?: string;
  offers?: OfferSummary[];
  templates?: TemplateSummary[];
}

interface SendReviewBody {
  recipient_email: string;
  recipient_name?: string;
  message?: string;
  project: ProjectSummary;
}

// ─── HTML builder ──────────────────────────────────────────────────────────────

function buildEmailHtml(body: SendReviewBody): string {
  const { recipient_name, message, project } = body;
  const greeting = recipient_name ? `Hi ${recipient_name},` : "Hi there,";
  const appUrl = "https://constellation-ux-app.vercel.app";

  const offerRows = (project.offers ?? [])
    .slice(0, 5)
    .map(
      (o) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0eff4;font-size:13px;color:#1f1d25;">
          ${o.year} ${o.make} ${o.model}${o.trim ? ` ${o.trim}` : ""}
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0eff4;font-size:13px;color:#6b6878;text-transform:capitalize;">
          ${o.offerType}
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0eff4;font-size:13px;color:#1f1d25;font-weight:600;white-space:nowrap;">
          $${o.monthlyPayment}/mo · ${o.term}mo
        </td>
      </tr>`
    )
    .join("");

  const templatePills = (project.templates ?? [])
    .slice(0, 6)
    .map(
      (t) =>
        `<span style="display:inline-block;background:#f0eff4;border-radius:6px;padding:4px 10px;font-size:12px;color:#1f1d25;margin:3px 3px 3px 0;">${t.name}</span>`
    )
    .join("");

  const offersSection =
    project.offers && project.offers.length > 0
      ? `
    <h3 style="margin:24px 0 8px;font-size:13px;font-weight:600;color:#6b6878;text-transform:uppercase;letter-spacing:.06em;">
      Offers (${project.offers.length})
    </h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #f0eff4;border-radius:8px;overflow:hidden;">
      <tbody>${offerRows}</tbody>
    </table>`
      : "";

  const templatesSection =
    project.templates && project.templates.length > 0
      ? `
    <h3 style="margin:24px 0 8px;font-size:13px;font-weight:600;color:#6b6878;text-transform:uppercase;letter-spacing:.06em;">
      Templates (${project.templates.length})
    </h3>
    <div>${templatePills}</div>`
      : "";

  const customMessage = message
    ? `<p style="margin:0 0 24px;font-size:15px;color:#1f1d25;line-height:1.6;white-space:pre-wrap;">${message}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Campaign Review — ${project.projectName}</title>
</head>
<body style="margin:0;padding:0;background:#f5f4f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:24px;" align="center">
              <img src="${appUrl}/constellation-logo.png" height="22" alt="Constellation" style="display:block;" />
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;padding:32px 32px 36px;box-shadow:0 1px 4px rgba(0,0,0,.06);">

              <!-- Header -->
              <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#8f8c9c;text-transform:uppercase;letter-spacing:.08em;">Campaign Review</p>
              <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#1f1d25;line-height:1.2;">
                ${project.projectName}
              </h1>
              ${project.oem ? `<p style="margin:0 0 24px;font-size:14px;color:#6b6878;">${project.oem}</p>` : `<div style="margin-bottom:24px;"></div>`}

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #f0eff4;margin:0 0 24px;" />

              <!-- Greeting + message -->
              <p style="margin:0 0 8px;font-size:15px;color:#1f1d25;">${greeting}</p>
              ${customMessage}

              <!-- Offers & Templates -->
              ${offersSection}
              ${templatesSection}

              <!-- CTA -->
              <div style="margin-top:32px;text-align:center;">
                <a href="${appUrl}/campaign-review.html"
                   style="display:inline-block;background:#1f1d25;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;letter-spacing:.02em;">
                  Review Campaign →
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 0 0;text-align:center;">
              <p style="margin:0;font-size:11px;color:#aaa8b5;">
                Sent via Constellation · <a href="${appUrl}" style="color:#aaa8b5;text-decoration:underline;">constellation-ux-app.vercel.app</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[send-review] RESEND_API_KEY not set");
    res.status(500).json({ error: "Email service not configured." });
    return;
  }

  const body = req.body as SendReviewBody;

  if (!body?.recipient_email || !body?.project?.projectName) {
    res.status(400).json({ error: "recipient_email and project.projectName are required." });
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const html = buildEmailHtml(body);

    const { data, error } = await resend.emails.send({
      from: "Constellation <onboarding@resend.dev>",
      to: [body.recipient_email],
      subject: `Campaign Review: ${body.project.projectName}`,
      html,
    });

    if (error) {
      console.error("[send-review] Resend error:", error);
      res.status(502).json({ error: error.message });
      return;
    }

    res.status(200).json({ success: true, id: data?.id });
  } catch (err) {
    console.error("[send-review] Unexpected error:", err);
    res.status(500).json({ error: "Failed to send email." });
  }
}
