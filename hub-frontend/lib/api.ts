// lib/api.ts
const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

function absolute(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

async function withTimeout<T>(p: Promise<T>, ms = 10000): Promise<T> {
  return await Promise.race<T>([
    p,
    new Promise<T>((_, r) => setTimeout(() => r(new Error("Request timed out")), ms)),
  ]);
}

export async function api(path: string, init: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await withTimeout(
    fetch(absolute(path), {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers || {}),
      },
      cache: "no-store",
      credentials: "omit",
    })
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status} ${res.statusText} at ${path}\n${text}`);
  }
  // handle 204
  const type = res.headers.get("content-type") || "";
  return type.includes("application/json") ? res.json() : null;
}
