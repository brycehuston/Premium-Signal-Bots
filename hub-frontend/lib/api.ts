// lib/api.ts
export class ApiHttpError extends Error {
  constructor(public readonly status: number) {
    super(`HTTP ${status}`);
    this.name = "ApiHttpError";
  }
}

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
    ...(init.headers as Record<string, string> | undefined),
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
      // Callers need the status to distinguish authentication from outages.
      // Do not surface raw server responses to the user.
      throw new ApiHttpError(res.status);
    }
    const ct = res.headers.get("content-type") || "";
    return ct.includes("application/json") ? res.json() : res.text();
  }

  try {
    return await doFetch(controller.signal);
  } catch (error) {
    // Invalid sessions, missing permissions, and other 4xx errors are not
    // transient; retrying them wastes time and obscures the real failure.
    if (error instanceof ApiHttpError && error.status >= 400 && error.status < 500) {
      throw error;
    }
    // One retry for transient network/server failures (e.g. waking a service).
    return await doFetch(controller.signal);
  } finally {
    clearTimeout(t);
  }
}

