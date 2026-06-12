import { NextResponse } from "next/server";

/**
 * POST /api/loyalty/claim
 *
 * Receives the end-of-round claim form payload and forwards it to a Google
 * Sheets Apps Script Web App (URL configured via `SHEETS_WEBHOOK_URL` env var).
 *
 * Why proxy instead of POSTing to Apps Script directly from the browser?
 *   - Keeps the webhook URL off the client bundle.
 *   - Lets us validate the payload before it hits the sheet.
 *   - Avoids the CORS dance with Apps Script Web Apps (which set permissive
 *     CORS by default, but tightening it would break a direct client call).
 *
 * Apps Script setup (one-time, on the merchant's side):
 *   1. Open the target Google Sheet → Extensions → Apps Script.
 *   2. Paste in something like:
 *
 *        function doPost(e) {
 *          const data = JSON.parse(e.postData.contents);
 *          const sheet = SpreadsheetApp.getActiveSheet();
 *          sheet.appendRow([
 *            new Date(),
 *            data.name, data.email, data.dialCode, data.phone,
 *            data.score, data.loyaltyPoints,
 *          ]);
 *          return ContentService
 *            .createTextOutput(JSON.stringify({ ok: true }))
 *            .setMimeType(ContentService.MimeType.JSON);
 *        }
 *
 *   3. Deploy → New deployment → Type "Web app" → Execute as "Me", Access
 *      "Anyone". Copy the resulting `/exec` URL.
 *   4. Add the URL to Vercel project env vars as `SHEETS_WEBHOOK_URL`.
 *
 * If the env var is missing, this route still returns 200 (so QA against a
 * non-production env doesn't surface a confusing error to the user) — but logs
 * a warning and reports `persisted: false` in the response body.
 */

// Force Node runtime so we get a real `fetch` against external hosts.
export const runtime = "nodejs";
// Don't try to cache POST responses.
export const dynamic = "force-dynamic";

interface ClaimPayload {
  name?: unknown;
  email?: unknown;
  dialCode?: unknown;
  phone?: unknown;
  score?: unknown;
  loyaltyPoints?: unknown;
  submittedAt?: unknown;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export async function POST(req: Request) {
  let body: ClaimPayload;
  try {
    body = (await req.json()) as ClaimPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Loose validation — the form validates client-side; this is a server-side
  // safety net against obvious bad payloads, not a strict schema.
  if (!isNonEmptyString(body.name)) {
    return NextResponse.json(
      { error: "missing_field", field: "name" },
      { status: 400 }
    );
  }
  if (!isNonEmptyString(body.phone)) {
    return NextResponse.json(
      { error: "missing_field", field: "phone" },
      { status: 400 }
    );
  }
  if (
    isNonEmptyString(body.email) &&
    !EMAIL_RE.test(body.email)
  ) {
    return NextResponse.json(
      { error: "invalid_email" },
      { status: 400 }
    );
  }

  // Normalize the payload before forwarding so the sheet rows are consistent
  // regardless of how the client formatted things.
  const normalized = {
    name: String(body.name).trim(),
    email: isNonEmptyString(body.email) ? body.email.trim() : "",
    dialCode: isNonEmptyString(body.dialCode) ? body.dialCode : "",
    phone: isNonEmptyString(body.phone)
      ? body.phone.replace(/\D/g, "")
      : "",
    score: Number(body.score) || 0,
    loyaltyPoints: Number(body.loyaltyPoints) || 0,
    submittedAt:
      isNonEmptyString(body.submittedAt)
        ? body.submittedAt
        : new Date().toISOString(),
  };

  const webhookUrl = process.env.SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    // No webhook configured — accept the submission so the UI flow still works
    // in dev / preview environments, and surface the payload in server logs.
    console.warn(
      "[loyalty/claim] SHEETS_WEBHOOK_URL not set — claim not persisted:",
      normalized
    );
    return NextResponse.json({ ok: true, persisted: false });
  }

  try {
    const sheetRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalized),
      // Apps Script can be slow on cold start — give it a generous timeout
      // via AbortSignal rather than relying on the platform default.
      signal: AbortSignal.timeout(10_000),
    });
    if (!sheetRes.ok) {
      console.error(
        "[loyalty/claim] Sheets webhook returned non-ok:",
        sheetRes.status,
        await sheetRes.text().catch(() => "")
      );
      return NextResponse.json(
        { error: "sheet_write_failed" },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("[loyalty/claim] Sheets webhook fetch error:", err);
    return NextResponse.json(
      { error: "sheet_unreachable" },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, persisted: true });
}
