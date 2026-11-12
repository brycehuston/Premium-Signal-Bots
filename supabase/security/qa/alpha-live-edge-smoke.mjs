import assert from "node:assert/strict";

const EDGE = "https://ennbnofvmnkcuhftzlhr.supabase.co/functions/v1/alpha-insights";
const SITE = "https://alphaalerts.dev";
const results = [];

async function probe(name, url, expectedStatuses, headers = {}, expected = null) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url, {
        method: "GET", headers: { Accept: "application/json", ...headers },
        redirect: "error", cache: "no-store", signal: AbortSignal.timeout(12000),
      });
      const raw = await response.text();
      let body = null;
      try { body = JSON.parse(raw); } catch { throw Error("Expected JSON, received non-JSON response"); }
      assert(expectedStatuses.includes(response.status), `Unexpected HTTP ${response.status}`);
      assert(body && typeof body === "object", "Response must be JSON object");
      assert(body.tier !== "owner" && !body.dataset, "Private owner payload exposed");
      if (expected) expected(body);
      results.push({ name, status: response.status, state: body.state ?? null, pass: true });
      return;
    } catch (error) {
      lastError = error;
      if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 1200));
    }
  }
  results.push({ name, pass: false, error: String(lastError).slice(0,300) });
}

// Read-only HTTP requests: no auth secrets, no modified production records.
await probe("edge-public", EDGE + "?view=public", [200], {}, body => {
  assert(["unavailable", "verified", "empty", "historical"].includes(body.state), "Unknown public state");
});
await probe("edge-owner-anonymous", EDGE + "?view=owner", [401,403], {"x-alpha-tier":"owner"}, body => {
  assert(body.state !== "ready", "Anonymous owner read must fail closed");
});
await probe("edge-owner-forged-gateway", EDGE + "?view=owner", [401,403], {
  "x-alpha-tier": "owner", "x-alpha-gateway": "0".repeat(64),
}, body => {
  assert(body.state !== "ready", "Forged gateway must fail closed");
});
await probe("edge-subscriber-anonymous", EDGE + "?view=subscriber", [401,403], {"x-alpha-tier":"subscriber"}, body => {
  assert(body.state !== "ready", "Anonymous subscriber read must fail closed");
});
await probe("site-owner-route-anonymous", SITE + "/api/intelligence/data", [401,403], {}, body => {
  assert(body.state !== "ready", "Anonymous site private data must fail closed");
});
await probe("site-access-route-anonymous", SITE + "/api/intelligence/access", [401,403], {}, body => {
  assert(body.state !== "owner", "Anonymous site access must fail closed");
});
await probe("site-top-movers-public", SITE + "/api/public/top-movers", [200], {}, body => {
  assert(Array.isArray(body.movers), "Public movers list must be an array");
});
await probe("membership-service-health", "https://premium-signal-bots.onrender.com/health", [200], {}, body => {
  assert.equal(body.status,"ok");
});
await probe("membership-service-anonymous", "https://premium-signal-bots.onrender.com/me", [401,403], {}, body => {
  assert(body.detail !== undefined || body.state !== "ready", "Unauthenticated /me must be denied");
});

console.log(JSON.stringify({ run: "alpha-edge-production-smoke", results }, null, 2));
if (results.some(row => !row.pass)) process.exitCode = 1;
