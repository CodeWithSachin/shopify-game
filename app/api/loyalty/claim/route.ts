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
 *   - Avoids the CORS dance with Apps Script Web Apps.
 *
 * --- Apps Script quirks worth knowing ---
 *
 * 1. The deployment URL must end in `/exec`, NOT `/dev`. The `/dev` URL only
 *    works while you're signed in.
 * 2. The deployment must be: Execute as "Me", Access "Anyone". Anything else
 *    refuses anonymous server calls.
 * 3. POSTing to `/exec` follows a 302 redirect to
 *    `script.googleusercontent.com/macros/echo?...` — Node's fetch follows
 *    redirects by default. We log the final URL on failure so you can spot
 *    if redirects are being blocked.
 * 4. Cold starts can take 5–10 seconds; we allow a generous 20 s timeout.
 *
 * --- Debugging GET ---
 *
 * `GET /api/loyalty/claim?ping=1` returns a small JSON status object so you
 * can verify (a) the route is deployed, (b) the env var is set, without
 * having to submit a real claim. This NEVER reveals the webhook URL.
 */

export const runtime = "nodejs";
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

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("ping") !== "1") {
    return NextResponse.json(
      { error: "method_not_allowed" },
      { status: 405 }
    );
  }
  const webhookUrl = process.env.SHEETS_WEBHOOK_URL;
  return NextResponse.json({
    ok: true,
    hasWebhook: Boolean(webhookUrl),
    // Last 12 chars only — enough to spot the wrong deployment without leaking
    webhookHint: webhookUrl ? `…${webhookUrl.slice(-12)}` : null,
    runtime: "nodejs",
    region: process.env.VERCEL_REGION ?? "unknown",
  });
}

export async function POST(req: Request) {
  let body: ClaimPayload;
  try {
    body = (await req.json()) as ClaimPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

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
  if (isNonEmptyString(body.email) && !EMAIL_RE.test(body.email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const normalized = {
    name: String(body.name).trim(),
    email: isNonEmptyString(body.email) ? body.email.trim() : "",
    dialCode: isNonEmptyString(body.dialCode) ? body.dialCode : "",
    phone: isNonEmptyString(body.phone)
      ? body.phone.replace(/\D/g, "")
      : "",
    score: Number(body.score) || 0,
    loyaltyPoints: Number(body.loyaltyPoints) || 0,
    submittedAt: isNonEmptyString(body.submittedAt)
      ? body.submittedAt
      : new Date().toISOString(),
  };

  const webhookUrl = process.env.SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn(
      "[loyalty/claim] SHEETS_WEBHOOK_URL not set — claim not persisted:",
      normalized
    );
    return NextResponse.json({ ok: true, persisted: false });
  }

  // Some operator-friendly diagnostics on the URL itself before we even fetch.
  if (!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec(\?.*)?$/.test(webhookUrl)) {
    console.error(
      "[loyalty/claim] SHEETS_WEBHOOK_URL doesn't look like an Apps Script /exec URL:",
      webhookUrl
    );
    return NextResponse.json(
      {
        error: "bad_webhook_url",
        hint: "Expected https://script.google.com/macros/s/.../exec",
      },
      { status: 500 }
    );
  }

  const startedAt = Date.now();
  let sheetRes: Response;
  try {
    sheetRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalized),
      redirect: "follow",
      // Generous: Apps Script cold starts can take 10+ s.
      signal: AbortSignal.timeout(20_000),
    });
  } catch (err) {
    const ms = Date.now() - startedAt;
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[loyalty/claim] Sheets webhook fetch threw after ${ms}ms:`,
      message
    );
    return NextResponse.json(
      { error: "sheet_unreachable", detail: message, ms },
      { status: 502 }
    );
  }

  const responseText = await sheetRes.text().catch(() => "");
  const ms = Date.now() - startedAt;

  if (!sheetRes.ok) {
    console.error(
      `[loyalty/claim] Sheets webhook returned ${sheetRes.status} after ${ms}ms (final URL: ${sheetRes.url}). Body:`,
      responseText.slice(0, 500)
    );
    return NextResponse.json(
      {
        error: "sheet_write_failed",
        status: sheetRes.status,
        finalUrl: sheetRes.url,
        body: responseText.slice(0, 500),
        ms,
      },
      { status: 502 }
    );
  }

  // Apps Script sometimes returns 200 with `{ ok: false, error }` in the body
  // (e.g. if the script itself threw). Try to surface that.
  try {
    const parsed = JSON.parse(responseText) as { ok?: boolean; error?: string };
    if (parsed && parsed.ok === false) {
      console.error(
        `[loyalty/claim] Apps Script reported failure after ${ms}ms:`,
        parsed
      );
      return NextResponse.json(
        {
          error: "script_reported_failure",
          scriptError: parsed.error ?? "unknown",
          ms,
        },
        { status: 502 }
      );
    }
  } catch {
    // Non-JSON response is fine — Apps Script returns text/html sometimes.
  }

  console.log(
    `[loyalty/claim] Sheets webhook ok in ${ms}ms (final URL host: ${new URL(sheetRes.url).host})`
  );
  return NextResponse.json({ ok: true, persisted: true, ms });
}
