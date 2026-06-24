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

/** One generated asset — bg + vehicle to be composited via Cloudinary URL transforms */
interface AssetItem {
  bgUrl: string;
  vehicleUrl?: string;
  offerName?: string;
  dims?: string;
  /** Full offer data for displaying ad copy */
  offerType?: string;
  monthlyPayment?: number;
  term?: number;
  trim?: string;
  make?: string;
}

interface ProjectSummary {
  projectId?: string;
  projectName: string;
  oem?: string;
  start_date?: string;
  end_date?: string;
  campaign_owner?: string;
  offers?: OfferSummary[];
  templates?: TemplateSummary[];
  /** Legacy: plain bg image URLs. Superseded by assetItems. */
  assets?: string[];
  /** Rich asset items — each carries bgUrl + vehicleUrl for Cloudinary compositing */
  assetItems?: AssetItem[];
}

interface SendReviewBody {
  recipient_email: string;
  recipient_name?: string;
  message?: string;
  project: ProjectSummary;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const APP_URL = "https://constellation-ux-app.vercel.app";

/** Resolve a (possibly relative) image path to an absolute URL, or "" if none.
 *
 * blob: URLs are browser-memory-only — they die with the tab and are completely
 * unreachable by email clients.  data: URLs (base64) are either stripped by
 * email clients as a security measure or make the message absurdly large.
 * Both cases fall back to the make-colour avatar rendered in the email template.
 */
function resolveImageUrl(image?: string): string {
  if (!image) return "";
  // blob: and data: URLs only exist inside the browser session — unusable in email
  if (image.startsWith("blob:") || image.startsWith("data:")) return "";
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

// ─── Cloudinary composite ──────────────────────────────────────────────────────
//
// Both bg and vehicle images live in the same Cloudinary account (dvq75cqna).
// We use URL-based layer transformations to composite the vehicle PNG (transparent
// cutout) over the background — zero server compute, result is cached by CDN.
//
// Output URL pattern:
//   .../image/upload/w_600,h_400,c_fill          ← resize bg
//   /l_PUBLIC_ID_WITH_COLONS,w_320,c_fit,g_south,y_-20  ← place vehicle
//   /fl_layer_apply                               ← flatten
//   /BG_PUBLIC_ID                                 ← base image
//
const CLOUD_NAME   = "dvq75cqna";
const CL_BASE      = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/`;

function extractPublicId(url: string): string | null {
  if (!url.startsWith(CL_BASE)) return null;
  return url
    .slice(CL_BASE.length)
    .replace(/^v\d+\//, "")   // strip version prefix
    .replace(/\.[^.]+$/, ""); // strip extension
}

/**
 * Return a Cloudinary URL that shows `vehicleUrl` composited over `bgUrl`.
 * Falls back to `bgUrl` alone if either ID can't be extracted.
 */
function buildCompositeUrl(
  bgUrl: string,
  vehicleUrl?: string,
  outputW = 600,
  outputH = 400,
): string {
  const bgId      = extractPublicId(bgUrl);
  const vehicleId = vehicleUrl ? extractPublicId(vehicleUrl) : null;

  if (!bgId) return bgUrl; // can't parse — return bg as-is

  if (!vehicleId) {
    // No vehicle — just resize the background
    return `${CL_BASE}w_${outputW},h_${outputH},c_fill/${bgId}`;
  }

  const vLayer = vehicleId.replace(/\//g, ":"); // folder sep → colon
  const vW     = Math.round(outputW * 0.55);    // vehicle ~55% of output width

  return (
    `${CL_BASE}w_${outputW},h_${outputH},c_fill` +
    `/l_${vLayer},w_${vW},c_fit,g_south,y_-15` +
    `/fl_layer_apply` +
    `/${bgId}`
  );
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
  <table width="100%" cellpadding="0" cellspacing="0" class="em-offer-card"
         style="border-collapse:separate;border-spacing:0;border:1.5px solid #ece9f5;border-radius:10px;overflow:hidden;margin-bottom:10px;">
    <tr>
      ${thumbnailCell}
      <td class="em-offer-card" style="padding:14px 16px;vertical-align:middle;background:#ffffff;border-radius:0 10px 10px 0;">
        <p class="em-offer-text" style="margin:0 0 3px;font-size:14px;font-weight:700;color:#1f1d25;line-height:1.3;font-family:Helvetica,Arial,sans-serif;">
          ${vehicleName}
        </p>
        <p class="em-offer-sub" style="margin:0 0 6px;font-size:12px;color:#8f8c9c;text-transform:capitalize;font-family:Helvetica,Arial,sans-serif;">
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

  // ── Metadata summary ────────────────────────────────────────────────────────
  const metaRows: string[] = [];
  if (project.oem)              metaRows.push(`<tr><td class="em-meta-label">Brand</td><td class="em-meta-val">${project.oem}</td></tr>`);
  if (project.campaign_owner)   metaRows.push(`<tr><td class="em-meta-label">Campaign Owner</td><td class="em-meta-val">${project.campaign_owner}</td></tr>`);
  if (project.start_date && project.end_date) {
    metaRows.push(`<tr><td class="em-meta-label">Duration</td><td class="em-meta-val">${project.start_date} → ${project.end_date}</td></tr>`);
  }
  if (project.offers?.length)   metaRows.push(`<tr><td class="em-meta-label">Offers</td><td class="em-meta-val">${project.offers.length}</td></tr>`);
  if (project.templates?.length) metaRows.push(`<tr><td class="em-meta-label">Templates</td><td class="em-meta-val">${project.templates.length}</td></tr>`);

  const metadataSection = metaRows.length > 0 ? `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #ece9f5;">
    ${metaRows.join('')}
  </table>` : '';

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
        `<span class="em-pill" style="display:inline-block;background:#f0eff4;border-radius:6px;
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

  // ── Assets preview ─────────────────────────────────────────────────────────────
  // Prefer rich assetItems (bg + vehicle → Cloudinary composite URL).
  // Fall back to legacy plain `assets` array.
  const rawItems: AssetItem[] = project.assetItems?.length
    ? project.assetItems
    : (project.assets ?? [])
        .filter(u => u.startsWith("http") && !u.startsWith("blob:") && !u.startsWith("data:"))
        .map(bgUrl => ({ bgUrl }));

  // Build composited (or plain bg) URLs via Cloudinary
  const compositeItems = rawItems.map(item => ({
    url:   buildCompositeUrl(item.bgUrl, item.vehicleUrl, 580, 390),
    label: item.offerName ?? "",
    dims:  item.dims ?? "",
  }));

  // Keep plain URLs list for the "Review Campaign" CTA link query param
  const validAssets = compositeItems.map(c => c.url);

  const assetsSection = compositeItems.length > 0 ? `
  <h3 style="margin:28px 0 12px;font-size:13px;font-weight:600;color:#8f8c9c;text-transform:uppercase;letter-spacing:.07em;font-family:Helvetica,Arial,sans-serif;">
    Generated Assets (${compositeItems.length})
  </h3>
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    ${(() => {
      const rows: string[] = [];
      for (let i = 0; i < compositeItems.length; i += 2) {
        const pair = compositeItems.slice(i, i + 2);
        const cells = pair.map((item, idx) => {
          const src = rawItems[i + idx];
          const offerLabel = src?.offerType
            ? `${src.offerType.toUpperCase()} · ${src.offerName ?? ''}`
            : (src?.offerName ?? '');
          const priceStr = src?.monthlyPayment ? `$${src.monthlyPayment.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '';
          const termStr  = src?.term ? `${src.term}mo${src.trim ? ' · ' + src.trim : ''}` : '';
          const dims     = src?.dims ?? '';

          return `<td width="50%" style="padding:4px;vertical-align:top;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #ece9f5;border-radius:10px;overflow:hidden;">
              <tr>
                <td style="padding:0;position:relative;">
                  <img src="${item.url}" width="100%" alt="${src?.offerName || 'Asset'}"
                       style="display:block;width:100%;border-radius:10px 10px 0 0;" />
                </td>
              </tr>
              <tr>
                <td style="padding:8px 10px;background:#ffffff;border-radius:0 0 10px 10px;">
                  ${dims ? `<div style="display:inline-block;background:rgba(71,59,171,0.10);color:#473bab;font-size:9px;font-weight:600;padding:2px 6px;border-radius:4px;letter-spacing:0.3px;margin-bottom:5px;font-family:Helvetica,Arial,sans-serif;">${dims}</div>` : ''}
                  ${offerLabel ? `<p style="margin:0 0 2px;font-size:9px;font-weight:600;color:#9c99a9;letter-spacing:0.5px;text-transform:uppercase;font-family:Helvetica,Arial,sans-serif;">${offerLabel}</p>` : ''}
                  ${priceStr ? `<p style="margin:0;font-size:16px;font-weight:700;color:#1f1d25;line-height:1;font-family:Helvetica,Arial,sans-serif;">
                    ${priceStr}<span style="font-size:11px;font-weight:400;color:#686576;">/mo</span>
                  </p>` : ''}
                  ${termStr ? `<p style="margin:2px 0 0;font-size:10px;color:#9c99a9;font-family:Helvetica,Arial,sans-serif;">${termStr}</p>` : ''}
                </td>
              </tr>
            </table>
          </td>`;
        });
        if (cells.length === 1) cells.push('<td width="50%"></td>');
        rows.push(`<tr>${cells.join('')}</tr>`);
      }
      return rows.join('');
    })()}
  </table>` : '';

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
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>Project Review — ${project.projectName}</title>
  <style>
    .em-meta-label { padding:8px 14px; font-size:12px; color:#8f8c9c; font-family:Helvetica,Arial,sans-serif; white-space:nowrap; border-bottom:1px solid #ece9f5; width:140px; }
    .em-meta-val   { padding:8px 14px; font-size:12px; color:#1f1d25; font-family:Helvetica,Arial,sans-serif; font-weight:500; border-bottom:1px solid #ece9f5; }
    @media (prefers-color-scheme: dark) {
      body, .em-outer { background: #13121e !important; }
      .em-card       { background: #1e1c2e !important; box-shadow: 0 1px 6px rgba(0,0,0,.4) !important; }
      .em-label      { color: #7370a0 !important; }
      .em-title      { color: #f0eff8 !important; }
      .em-oem        { color: #9d9ab5 !important; }
      .em-divider    { border-top-color: rgba(255,255,255,0.08) !important; }
      .em-greeting   { color: #d8d6eb !important; }
      .em-body-text  { color: #b8b5d0 !important; }
      .em-footer     { color: #6b6885 !important; }
      .em-footer a   { color: #6b6885 !important; }
      .em-pill       { background: #2c2a40 !important; color: #c4c1de !important; }
      .em-offer-card { background: #252339 !important; border-color: rgba(255,255,255,0.08) !important; }
      .em-offer-text { color: #d8d6eb !important; }
      .em-offer-sub  { color: #9d9ab5 !important; }
      .em-meta-label { background: #1e1c2e !important; color: #7370a0 !important; border-bottom-color: rgba(255,255,255,0.08) !important; }
      .em-meta-val   { background: #1e1c2e !important; color: #d8d6eb !important; border-bottom-color: rgba(255,255,255,0.08) !important; }
      /* Constellation logo: show white version, hide dark version */
      .em-logo-light { display: none !important; max-height: 0 !important; overflow: hidden !important; }
      .em-logo-dark  { display: block !important; max-height: none !important; }
    }
  </style>
</head>
<body class="em-outer" style="margin:0;padding:0;background:#f5f4f9;font-family:Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" class="em-outer" style="background:#f5f4f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Logo: dark version for light mode, white version for dark mode -->
          <tr>
            <td style="padding-bottom:24px;" align="center">
              <!-- Light mode logo (dark mark) -->
              <img class="em-logo-light" src="${APP_URL}/constellation-logo-2024.svg"
                   height="33" alt="Constellation"
                   style="display:block;height:33px;border:0;" />
              <!-- Dark mode logo (white mark) — hidden by default, shown via CSS media query -->
              <img class="em-logo-dark" src="${APP_URL}/constellation-logo-white.svg"
                   height="33" alt="Constellation"
                   style="display:none;max-height:0;overflow:hidden;height:33px;border:0;" />
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td class="em-card" style="background:#ffffff;border-radius:16px;padding:32px 32px 36px;
                       box-shadow:0 1px 4px rgba(0,0,0,.06);">

              <!-- Header -->
              <p class="em-label" style="margin:0 0 4px;font-size:12px;font-weight:600;color:#8f8c9c;text-transform:uppercase;letter-spacing:.08em;">Project Review</p>
              <h1 class="em-title" style="margin:0 0 6px;font-size:22px;font-weight:700;color:#1f1d25;line-height:1.2;">
                ${project.projectName}
              </h1>
              ${project.oem
                ? `<p class="em-oem" style="margin:0 0 24px;font-size:14px;color:#6b6878;">${project.oem}</p>`
                : `<div style="margin-bottom:24px;"></div>`}

              <!-- Divider -->
              <hr class="em-divider" style="border:none;border-top:1px solid #f0eff4;margin:0 0 24px;" />

              <!-- Greeting + message -->
              <p class="em-greeting" style="margin:0 0 8px;font-size:15px;color:#1f1d25;">${greeting}</p>
              ${customMessage}

              <!-- Metadata -->
              ${metadataSection}

              <!-- Offers -->
              ${offersSection}

              <!-- Assets -->
              ${assetsSection}

              <!-- Templates -->
              ${templatesSection}

              <!-- CTA -->
              <div style="margin-top:32px;text-align:center;">
                <a href="${(() => {
                  const base = `${APP_URL}/campaign-review.html`;
                  if (validAssets.length === 0) return base;
                  const params = validAssets.map(u => encodeURIComponent(u)).join(',');
                  return `${base}?assets=${params}`;
                })()}"
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
              <p class="em-footer" style="margin:0;font-size:11px;color:#aaa8b5;">
                Sent via Constellation ·
                <a href="${APP_URL}" class="em-footer" style="color:#aaa8b5;text-decoration:underline;">constellation-ux-app.vercel.app</a>
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
