import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * POST /api/loyalty/claim
 *
 * Persists the end-of-round claim form payload into Supabase.
 *
 * Why Supabase (instead of Google Sheets / Apps Script)?
 *   - Real auth headers, no "Anyone with link" quirks.
 *   - Direct REST insert via the official client — no proxy redirects.
 *   - Service-role key stays server-only; client bundle never sees it.
 *
 * --- Required env vars ---
 *   SUPABASE_URL                — e.g. https://abcdwxyz.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY   — from Supabase → Settings → API → "service_role"
 *
 * The service-role key bypasses Row Level Security. Keep it server-only —
 * NEVER prefix it with NEXT_PUBLIC_, never log it, never return it.
 *
 * --- Required table ---
 *   See SUPABASE_SETUP.md (or the inline CREATE TABLE statement in the
 *   docs the assistant provided). The table is named `claims` and has
 *   columns: name, email, dial_code, phone, score, loyalty_points,
 *   submitted_at, created_at.
 *
 * --- Diagnostics ---
 *   GET /api/loyalty/claim?ping=1  →  small status JSON, useful to verify
 *                                     the route is deployed and env vars
 *                                     are present (does NOT leak keys).
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

/**
 * Lazily create the Supabase client at request time so missing env vars
 * surface as a 500 we can surface, not a build-time crash.
 */
function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("ping") !== "1") {
    return NextResponse.json(
      { error: "method_not_allowed" },
      { status: 405 }
    );
  }
  return NextResponse.json({
    ok: true,
    hasSupabaseUrl: Boolean(process.env.SUPABASE_URL),
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
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

  // Server-side validation. The form validates client-side too; these checks
  // are the safety net against direct API calls with bad data.
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

  // Map camelCase client payload → snake_case Postgres columns.
  const row = {
    name: String(body.name).trim(),
    email: isNonEmptyString(body.email) ? body.email.trim() : null,
    dial_code: isNonEmptyString(body.dialCode) ? body.dialCode : null,
    phone: isNonEmptyString(body.phone)
      ? body.phone.replace(/\D/g, "")
      : "",
    score: Number(body.score) || 0,
    loyalty_points: Number(body.loyaltyPoints) || 0,
    submitted_at: isNonEmptyString(body.submittedAt)
      ? body.submittedAt
      : new Date().toISOString(),
  };

  const supabase = getSupabase();
  if (!supabase) {
    // No Supabase configured — accept the submission so the UI works in
    // preview / local dev, and log the payload so it isn't silently lost.
    console.warn(
      "[loyalty/claim] Supabase env vars not set — claim not persisted:",
      row
    );
    return NextResponse.json({ ok: true, persisted: false });
  }

  const startedAt = Date.now();
  const { error } = await supabase.from("claims").insert(row);
  const ms = Date.now() - startedAt;

  if (error) {
    console.error(
      `[loyalty/claim] Supabase insert failed after ${ms}ms:`,
      error.message,
      error.details ?? "",
      error.hint ?? ""
    );
    return NextResponse.json(
      {
        error: "db_insert_failed",
        // Echo Supabase's error message so the user can see it in the network
        // tab during setup. Once it's working you'll never see this branch.
        message: error.message,
        hint: error.hint ?? null,
        ms,
      },
      { status: 502 }
    );
  }

  console.log(`[loyalty/claim] Claim persisted to Supabase in ${ms}ms`);
  return NextResponse.json({ ok: true, persisted: true, ms });
}
