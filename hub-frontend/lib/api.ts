// lib/api.ts
export async function api(
  path: string,
  init: RequestInit = {},
  options: { token?: string } = {}
) {
  const base =
    process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL;
  if (!base) {
    throw new Error("Missing NEXT_PUBLIC_API_URL/NEXT_PUBLIC_API_BASE");
  }
  const controller = new AbortController();
  const timeoutMs = 12000;
  const t = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as any),
  };

  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  const url = `${base}${path}`;

  async function doFetch(signal?: AbortSignal) {
    const res = await fetch(url, {
      credentials: "include",
      ...init,
      headers,
      signal,
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => res.statusText);
      throw new Error(txt || `HTTP ${res.status}`);
    }
    const ct = res.headers.get("content-type") || "";
    return ct.includes("application/json") ? res.json() : res.text();
  }

  try {
    return await doFetch(controller.signal);
  } catch (e) {
    // one quick retry (often fixes first request after sleep)
    try {
      return await doFetch();
    } finally {
      clearTimeout(t);
    }
  } finally {
    clearTimeout(t);
  }
}

