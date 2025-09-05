// hub-frontend/lib/api.ts
export async function api(path: string, init: RequestInit = {}) {
  const base = process.env.NEXT_PUBLIC_API_BASE!;
  const url = path.startsWith("http") ? path : `${base}${path}`;

  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, { ...init, headers, credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}
