import { NextResponse } from "next/server";

const CACHE_TTL_MS = 30_000;
let cache: { data: any; ts: number } | null = null;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Upstream failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function GET() {
  const now = Date.now();
  if (cache && now - cache.ts < CACHE_TTL_MS) {
    return NextResponse.json(cache.data, {
      headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" },
    });
  }

  try {
    const [prices, fearGreed] = await Promise.all([
      fetchJson<{
        bitcoin?: { usd?: number };
        ethereum?: { usd?: number };
        solana?: { usd?: number };
      }>(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd"
      ),
      fetchJson<{ data?: Array<{ value?: string }> }>(
        "https://api.alternative.me/fng/?limit=1&format=json"
      ),
    ]);

    const data = {
      prices: {
        BTC: prices?.bitcoin?.usd ?? null,
        ETH: prices?.ethereum?.usd ?? null,
        SOL: prices?.solana?.usd ?? null,
      },
      fearGreed: (() => {
        const raw = fearGreed?.data?.[0]?.value;
        const parsed = raw != null ? Number(raw) : null;
        return Number.isNaN(parsed) ? null : parsed;
      })(),
    };

    cache = { data, ts: now };

    return NextResponse.json(data, {
      headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" },
    });
  } catch {
    if (cache) {
      return NextResponse.json(cache.data, {
        headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" },
      });
    }
    return NextResponse.json(
      { prices: { BTC: null, ETH: null, SOL: null }, fearGreed: null },
      { status: 200 }
    );
  }
}
