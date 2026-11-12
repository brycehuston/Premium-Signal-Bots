import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LANES = new Set(["EARLY", "GENESIS", "TREND", "STRICT", "RECLAIM", "RUNNER"]);
const SELECT = "event_id,event_at,symbol,mint,lane,alert_mc,liquidity_usd,m5_tx,proof_kind,outcome_status,observed_max_multiple,outcome_delivery_correlated,public_delivery_verified";

type HistoryRow = {
  event_id: string;
  event_at: string;
  symbol: string;
  mint: string;
  lane: string;
  alert_mc: number | null;
  liquidity_usd: number | null;
  m5_tx: number | null;
  proof_kind: string;
  outcome_status: string;
  observed_max_multiple: number | null;
  outcome_delivery_correlated: boolean;
  public_delivery_verified: boolean;
};

const noStore = { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" };
function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: noStore });
}
function asInt(value: string | null, fallback: number, maximum: number) {
  const n = Number(value);
  return value !== null && Number.isSafeInteger(n) && n >= 0
    ? Math.min(n, maximum) : fallback;
}

export async function GET(req: NextRequest) {
  const bearer = req.headers.get("authorization") || "";
  const match = /^Bearer ([A-Za-z0-9_.-]+)$/.exec(bearer);
  if (!match) return json({ error: "authentication_required" }, 401);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return json({ error: "history_not_configured" }, 503);

  // The client uses only the public key and the verified user's JWT.
  // RLS grants SELECT to authenticated, approved history ONLY; no service key.
  const db = createClient(url, anon, {
    global: { headers: { Authorization: "Bearer " + match[1] } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
  const { data: identity, error: authError } = await db.auth.getUser(match[1]);
  if (authError || !identity.user || identity.user.is_anonymous)
    return json({ error: "invalid_session" }, 401);

  const params = req.nextUrl.searchParams;
  const view = params.get("view") || "table";
  const lane = (params.get("lane") || "").trim().toUpperCase();
  if (lane && !LANES.has(lane)) return json({ error: "invalid_lane" }, 400);
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  if (view === "summary" || view === "lanes") {
    // PostgREST defaults to a 1,000-row server limit: page through the entire
    // cohort rather than silently turning 3,303 historical events into 1,000.
    const rows: HistoryRow[] = [];
    for (let offset = 0; offset < 50000; offset += 1000) {
      const { data, error } = await db.from("alpha_history_events")
        .select(SELECT).eq("approved_for_history", true)
        .order("event_at", { ascending: false }).range(offset, offset + 999);
      if (error) return json({ error: "history_query_failed" }, 502);
      const batch = (data || []) as HistoryRow[];
      rows.push(...batch);
      if (batch.length < 1000) break;
    }
    const lanes: Record<string, number> = {
      EARLY: 0, GENESIS: 0, TREND: 0, STRICT: 0, RECLAIM: 0, RUNNER: 0
    };
    for (const r of rows) if (Object.hasOwn(lanes, r.lane)) lanes[r.lane] += 1;
    const observed = rows.filter((r) =>
      r.outcome_status === "OBSERVED_PEAK" &&
      r.observed_max_multiple !== null &&
      Number.isFinite(Number(r.observed_max_multiple))
    );
    const summary = {
      total: rows.length,
      alerts_24h: rows.filter((r) => r.event_at >= cutoff).length,
      unique_mints: new Set(rows.map((r) => r.mint)).size,
      lanes,
      delivery_outcome_correlated: rows.filter((r) => r.outcome_delivery_correlated).length,
      public_delivery_verified: rows.filter((r) => r.public_delivery_verified).length,
      outcomes_observed: observed.length,
      runner_2x: observed.filter((r) => Number(r.observed_max_multiple) >= 2).length,
      runner_5x: observed.filter((r) => Number(r.observed_max_multiple) >= 5).length,
      runner_10x: observed.filter((r) => Number(r.observed_max_multiple) >= 10).length,
      runner_20x: observed.filter((r) => Number(r.observed_max_multiple) >= 20).length,
      executable_exit_pnl: null,
      exit_stats_state: "unavailable_no_observed_exits",
      provenance: "POST_SEND_RUNTIME_CORRELATION",
      as_of_utc: new Date().toISOString(),
    };
    return json(view === "lanes" ? { lanes, total: rows.length } : summary);
  }
  if (view !== "table") return json({ error: "invalid_view" }, 400);
  const page = asInt(params.get("page"), 0, 1000);
  const limit = Math.max(1, asInt(params.get("limit"), 50, 100));
  const period = params.get("period") === "24h" ? "24h" : "all";

  let query = db.from("alpha_history_events")
    .select(SELECT, { count: "exact" }).eq("approved_for_history", true)
    .order("event_at", { ascending: false })
    .range(page * limit, page * limit + limit - 1);
  if (lane) query = query.eq("lane", lane);
  if (period === "24h") query = query.gte("event_at", cutoff);
  const { data, error, count } = await query;
  if (error) return json({ error: "history_query_failed" }, 502);
  return json({ rows: (data || []) as HistoryRow[], total: count ?? 0, page, limit, period, lane: lane || null });
}
