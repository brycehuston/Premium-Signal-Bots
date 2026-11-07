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
  const timeoutMs = 12000;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };

  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  const url = `${base}${path}`;

  async function doFetch() {
    // Each attempt has its own deadline; a timed-out first attempt must not
    // poison the retry with an already-aborted signal.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        credentials: "include",
        ...init,
        headers,
        signal: controller.signal,
      });
      if (!res.ok) {
        // Callers need the status to distinguish authentication from outages.
        // Do not surface raw server responses to the user.
        throw new ApiHttpError(res.status);
      }
      const ct = res.headers.get("content-type") || "";
      return ct.includes("application/json") ? res.json() : res.text();
    } finally {
      clearTimeout(timer);
    }
  }

  try {
    return await doFetch();
  } catch (error) {
    // Authentication and permission denials are not transient.
    if (error instanceof ApiHttpError && error.status >= 400 && error.status < 500) {
      throw error;
    }
    // Retry one transient network/server failure with a fresh 12s deadline.
    return await doFetch();
  }
}

