// app/login/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, H2 } from "@/components/ui";

declare global {
  interface Window {
    google?: any;
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  // Support either env key
  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE ||
    "";

  const containerRef = useRef<HTMLDivElement>(null);
  const gsiRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      localStorage.setItem("token", data.access_token || data.token);
      router.push("/dashboard");
    } catch (e: any) {
      setErr(e.message ?? "Login failed");
    } finally {
      setBusy(false);
    }
  }

  // Render official Google button sized to the container
  useEffect(() => {
    const src = "https://accounts.google.com/gsi/client";
    const MIN = 240;
    const MAX = 400;

    const renderAtWidth = () => {
      if (!window.google || !gsiRef.current || !containerRef.current) return;
      const w = Math.max(
        MIN,
        Math.min(MAX, Math.floor(containerRef.current.clientWidth))
      );
      gsiRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(gsiRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        logo_alignment: "left",
        width: w,
      });
    };

    const initAndRender = () => {
      if (!window.google) return;
      if (!initializedRef.current) {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          callback: async (resp: any) => {
            try {
              setBusy(true);
              const r = await fetch(`${API_BASE}/auth/google`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id_token: resp.credential }),
              });
              if (!r.ok) throw new Error(await r.text());
              const data = await r.json();
              localStorage.setItem("token", data.access_token || data.token);
              router.push("/dashboard");
            } catch (e: any) {
              setErr(e.message ?? "Google sign-in failed");
            } finally {
              setBusy(false);
            }
          },
        });
        initializedRef.current = true;
      }
      renderAtWidth();
    };

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      if (window.google) initAndRender();
      else existing.addEventListener("load", initAndRender, { once: true });
    } else {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.defer = true;
      s.onload = initAndRender;
      document.head.appendChild(s);
    }

    const onResize = () => renderAtWidth();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [router, API_BASE]);

  return (
    <Card>
      <CardBody>
        <H2>Login</H2>

        <div ref={containerRef} className="mt-4 w-full max-w-md">
          <form onSubmit={handle} className="grid gap-3">
            <input
              className="w-full rounded-xl bg-white/5 border border-edge px-3 py-2 outline-none focus:border-brand-600"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <input
              className="w-full rounded-xl bg-white/5 border border-edge px-3 py-2 outline-none focus:border-brand-600"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <div className="flex gap-2">
              <Button variant="primary" disabled={busy}>
                {busy ? "…" : "Login"}
              </Button>
              <button
                type="button"
                onClick={() => localStorage.removeItem("token")}
                className="rounded-xl border border-edge bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
              >
                Clear token
              </button>
            </div>

            <p className="mt-1 text-sm text-white/60">
              Don’t have an account?{" "}
              <a href="/register" className="text-brand-500 hover:underline">
                Create one
              </a>
              .
            </p>

            {err && <p className="text-red-400 text-sm">{err}</p>}
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-white/50">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="mt-4">
            <div ref={gsiRef} className="w-full" />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
