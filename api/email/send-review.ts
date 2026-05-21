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
  image?: string;   // relative path, e.g. "/cars/CR-V.png" — converted to absolute below
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const APP_URL = "https://constellation-ux-app.vercel.app";

/** Resolve a (possibly relative) image path to an absolute URL, or "" if none. */
function resolveImageUrl(image?: string): string {
  if (!image) return "";
  if (image.startsWith("http")) return image;
  // Relative path: "/cars/CR-V.png" → absolute
  return `${APP_URL}${image.startsWith("/") ? "" : "/"}${image}`;
}

/** Capitalise first letter of every word */
function titleCase(str: string): string {
  return str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

/** Format a dollar amount without decimals */
function formatMoney(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

// ─── Offer card (email-safe table layout) ─────────────────────────────────────

function offerCard(o: OfferSummary): string {
  const imgUrl = resolveImageUrl(o.image);
  const vehicleName = [o.year, o.make, o.model, o.trim].filter(Boolean).join(" ");
  const offerLabel  = titleCase(o.offerType.replace(/_/g, " "));
  const price       = `$${formatMoney(o.monthlyPayment)}/mo · ${o.term}mo`;

  // Make-colour avatar used when no car photo is available
  const makeColors: Record<string, string> = {
    honda:      "#cc0000",
    volkswagen: "#1c3f7c",
    bmw:        "#0066b1",
    mercedes:   "#999999",
    audi:       "#bb0a30",
    toyota:     "#eb0a1e",
    ford:       "#003178",
  };
  const avatarBg = makeColors[(o.make ?? "").toLowerCase()] ?? "#473bab";
  const initials  = (o.make ?? "?").slice(0, 2).toUpperCase();

  const thumbnailCell = imgUrl
    ? `<td width="120" style="padding:0;width:120px;min-width:120px;background:#f1f0f7;border-radius:10px 0 0 10px;overflow:hidden;vertical-align:middle;">
        <img src="${imgUrl}" width="120" height="84" alt="${vehicleName}"
             style="display:block;width:120px;height:84px;object-fit:cover;" />
       </td>`
    : `<td width="120" style="padding:0;width:120px;min-width:120px;background:${avatarBg};border-radius:10px 0 0 10px;text-align:center;vertical-align:middle;">
        <span style="font-family:Helvetica,Arial,sans-serif;font-size:22px;font-weight:700;color:rgba(255,255,255,0.9);letter-spacing:1px;">${initials}</span>
       </td>`;

  return `
  <table width="100%" cellpadding="0" cellspacing="0"
         style="border-collapse:separate;border-spacing:0;border:1.5px solid #ece9f5;border-radius:10px;overflow:hidden;margin-bottom:10px;">
    <tr>
      ${thumbnailCell}
      <td style="padding:14px 16px;vertical-align:middle;background:#ffffff;border-radius:0 10px 10px 0;">
        <p style="margin:0 0 3px;font-size:14px;font-weight:700;color:#1f1d25;line-height:1.3;font-family:Helvetica,Arial,sans-serif;">
          ${vehicleName}
        </p>
        <p style="margin:0 0 6px;font-size:12px;color:#8f8c9c;text-transform:capitalize;font-family:Helvetica,Arial,sans-serif;">
          ${offerLabel}
        </p>
        <p style="margin:0;font-size:15px;font-weight:700;color:#473bab;font-family:Helvetica,Arial,sans-serif;">
          ${price}
        </p>
      </td>
    </tr>
  </table>`;
}

// ─── HTML builder ──────────────────────────────────────────────────────────────

function buildEmailHtml(body: SendReviewBody): string {
  const { recipient_name, message, project } = body;
  const greeting = recipient_name ? `Hi ${recipient_name},` : "Hi there,";

  // ── Offers section ──────────────────────────────────────────────────────────
  const offersSection =
    project.offers && project.offers.length > 0
      ? `
    <h3 style="margin:28px 0 12px;font-size:13px;font-weight:600;color:#8f8c9c;text-transform:uppercase;
               letter-spacing:.07em;font-family:Helvetica,Arial,sans-serif;">
      Offers (${project.offers.length})
    </h3>
    ${project.offers.slice(0, 6).map(offerCard).join("")}`
      : "";

  // ── Templates section ────────────────────────────────────────────────────────
  const templatePills = (project.templates ?? [])
    .slice(0, 8)
    .map(
      (t) =>
        `<span style="display:inline-block;background:#f0eff4;border-radius:6px;
                      padding:5px 11px;font-size:12px;color:#1f1d25;margin:3px 4px 3px 0;
                      font-family:Helvetica,Arial,sans-serif;">${t.name}</span>`
    )
    .join("");

  const templatesSection =
    project.templates && project.templates.length > 0
      ? `
    <h3 style="margin:28px 0 10px;font-size:13px;font-weight:600;color:#8f8c9c;text-transform:uppercase;
               letter-spacing:.07em;font-family:Helvetica,Arial,sans-serif;">
      Templates (${project.templates.length})
    </h3>
    <div>${templatePills}</div>`
      : "";

  // ── Custom message ────────────────────────────────────────────────────────────
  const projectUrl = `${APP_URL}/OEM/Projects?project=${encodeURIComponent(project.projectId ?? "")}`;
  const formattedMessage = message
    ? message.replace(
        /https:\/\/constellation-ux-app\.vercel\.app\/OEM\/Projects\?project=[^\s]*/g,
        `<a href="${projectUrl}" style="color:#473bab;font-weight:600;text-decoration:none;">${project.projectName}</a>`
      )
    : "";
  const customMessage = formattedMessage
    ? `<p style="margin:0 0 24px;font-size:15px;color:#1f1d25;line-height:1.6;font-family:Helvetica,Arial,sans-serif;">${formattedMessage.trim()}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Project Review — ${project.projectName}</title>
</head>
<body style="margin:0;padding:0;background:#f5f4f9;font-family:Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:24px;" align="center">
              <img src="${APP_URL}/constellation-logo-2024.svg" height="33" alt="Constellation" style="display:block;" />
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;padding:32px 32px 36px;
                       box-shadow:0 1px 4px rgba(0,0,0,.06);">

              <!-- Header -->
              <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#8f8c9c;text-transform:uppercase;letter-spacing:.08em;">Project Review</p>
              <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#1f1d25;line-height:1.2;">
                ${project.projectName}
              </h1>
              ${project.oem
                ? `<p style="margin:0 0 24px;font-size:14px;color:#6b6878;">${project.oem}</p>`
                : `<div style="margin-bottom:24px;"></div>`}

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #f0eff4;margin:0 0 24px;" />

              <!-- Greeting + message -->
              <p style="margin:0 0 8px;font-size:15px;color:#1f1d25;">${greeting}</p>
              ${customMessage}

              <!-- Offers -->
              ${offersSection}

              <!-- Templates -->
              ${templatesSection}

              <!-- CTA -->
              <div style="margin-top:32px;text-align:center;">
                <a href="${APP_URL}/campaign-review.html"
                   style="display:inline-block;background:#473bab;color:#ffffff;text-decoration:none;
                          font-size:14px;font-weight:600;padding:13px 30px;border-radius:10px;letter-spacing:.02em;">
                  Review Campaign
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 0 0;text-align:center;">
              <p style="margin:0;font-size:11px;color:#aaa8b5;">
                Sent via Constellation ·
                <a href="${APP_URL}" style="color:#aaa8b5;text-decoration:underline;">constellation-ux-app.vercel.app</a>
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

  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST")    { res.status(405).json({ error: "Method Not Allowed" }); return; }

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
    const html   = buildEmailHtml(body);

    const { data, error } = await resend.emails.send({
      from:    "Constellation <onboarding@resend.dev>",
      to:      [body.recipient_email],
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
