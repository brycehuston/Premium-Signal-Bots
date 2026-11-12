// Independent authorization for private Alpha intelligence. A gateway token is
// service authentication, NOT an owner/subscriber entitlement.
export type PrivateTier = "owner" | "subscriber";
export type TierDecision = "allowed" | "forbidden" | "unavailable";
type Identity = { id: string; email?: string | null };
type DbRead = (path: string) => Promise<Response>;
type HttpFetch = (input: string, init?: RequestInit) => Promise<Response>;
const ACTIVE_PLANS = new Set([
  "alpha-early-alerts", "alpha-trend-alerts", "alpha-runner-alerts", "alpha-bundle",
]);

function memberOrigin(raw: string): string | null {
  try {
    const url = new URL(raw);
    // This is trusted deployment configuration, never an incoming request URL.
    if (url.protocol !== "https:" || !url.hostname || url.username || url.password ||
        url.search || url.hash) return null;
    // Match the Next.js membership base: optional trusted path prefix + /me.
    return url.origin + (url.pathname === "/" ? "" : url.pathname.replace(/\/$/, ""));
  } catch { return null; }
}

export async function authorizePrivateTier(
  view: PrivateTier,
  identity: Identity,
  bearer: string,
  dbRead: DbRead,
  fetcher: HttpFetch,
  membershipApiBase: string,
): Promise<TierDecision> {
  if (!/^[a-f0-9-]{36}$/i.test(identity.id)) return "forbidden";
  if (view === "owner") {
    try {
      const response = await dbRead("alpha_v4_archive?select=owner_user_id&id=eq.1&limit=1");
      if (!response.ok) return "unavailable";
      const rows = await response.json();
      if (!Array.isArray(rows) || rows.length !== 1 ||
          typeof rows[0]?.owner_user_id !== "string") return "unavailable";
      return identity.id === rows[0].owner_user_id ? "allowed" : "forbidden";
    } catch { return "unavailable"; }
  }
  if (view !== "subscriber") return "forbidden";
  const origin = memberOrigin(membershipApiBase);
  if (!origin) return "unavailable"; // No unverified fallback if backend is absent.
  if (!identity.email || typeof identity.email !== "string") return "forbidden";
  try {
    const response = await fetcher(origin + "/me", {
      headers: { Authorization: bearer, Accept: "application/json" },
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(5500),
    });
    if (response.status === 401 || response.status === 403) return "forbidden";
    if (!response.ok) return "unavailable";
    const profile = await response.json();
    if (!profile || typeof profile !== "object" || profile.role === "admin" ||
        profile.is_active !== true || typeof profile.plan !== "string" ||
        typeof profile.email !== "string") return "forbidden";
    if (profile.email.trim().toLowerCase() !== identity.email.trim().toLowerCase()) return "forbidden";
    return ACTIVE_PLANS.has(profile.plan.trim().toLowerCase()) ? "allowed" : "forbidden";
  } catch { return "unavailable"; }
}
