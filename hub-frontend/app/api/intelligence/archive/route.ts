import { NextRequest, NextResponse } from "next/server";
import { alphaAccess } from "@/lib/alpha-access";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

export async function GET(request: NextRequest) {
  const access = await alphaAccess(request);
  if (access.level !== "owner") {
    return NextResponse.json({ state: access.level }, { status: access.status === 200 ? 403 : access.status, headers });
  }
  const origin = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const gateway = process.env.ALPHA_INSIGHTS_GATEWAY_TOKEN ?? "";
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(origin) || !anon || !gateway) {
    return NextResponse.json({ state: "unavailable" }, { status: 503, headers });
  }
  try {
    const response = await fetch(origin + "/functions/v1/alpha-v4-archive?view=owner", {
      headers: {
        Authorization: "Bearer " + access.token,
        apikey: anon,
        Accept: "application/json",
        "x-alpha-gateway": gateway,
        "x-alpha-tier": "owner",
      },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) {
      return NextResponse.json({ state: response.status === 401 || response.status === 403 ? "forbidden" : "unavailable" }, { status: response.status === 401 || response.status === 403 ? response.status : 503, headers });
    }
    const report = await response.json();
    if (report?.state !== "ready" || report?.tier !== "owner" || report?.source !== "V4_PRIVATE_BASELINE") {
      return NextResponse.json({ state: "unavailable" }, { status: 503, headers });
    }
    return NextResponse.json(report, { headers });
  } catch {
    return NextResponse.json({ state: "unavailable" }, { status: 503, headers });
  }
}
