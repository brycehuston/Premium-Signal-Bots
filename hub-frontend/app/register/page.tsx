// app/register/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, H2 } from "@/components/ui";

declare global {
  interface Window {
    google?: any;
  }
}

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;
  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;

  // Keep the Google button the same width as the inputs
  const containerRef = useRef<HTMLDivElement>(null);
  const gsiRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const MAX_GSI_WIDTH = 400;
  const MIN_GSI_WIDTH = 240;

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const token = data.access_token || data.token;
      localStorage.setItem("token", token);
      router.push("/dashboard");
    } catch (e: any) {
      setErr(e.message ?? "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const src = "https://accounts.google.com/gsi/client";

    const renderAtContainerWidth = () => {
      if (!window.google || !gsiRef.current || !containerRef.current) return;

      const available = Math.floor(containerRef.current.clientWidth);
      const width = Math.max(MIN_GSI_WIDTH, Math.min(MAX_GSI_WIDTH, available));

      // Clear before re-render to avoid duplicates
      gsiRef.current.innerHTML = "";

      window.google.accounts.id.renderButton(gsiRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        logo_alignment: "left",
        width, // responsive width matches inputs
      });
    };

    const initAndRender = () => {
      if (!window.google) return;
      if (!initializedRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
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
              localStorage.setItem("token", data.access_token);
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
      renderAtContainerWidth();
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

    const onResize = () => renderAtContainerWidth();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [API_BASE, GOOGLE_CLIENT_ID, router]);

  return (
    <Card>
      <CardBody>
        <H2>Create account</H2>

        {/* Shared container ensures inputs and Google button have the same width */}
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
              autoComplete="new-password"
            />

            <button
              disabled={busy}
              className="h-11 w-full rounded-xl bg-brand-600 text-black font-medium hover:bg-brand-500 disabled:opacity-50 transition"
            >
              {busy ? "…" : "Create account"}
            </button>

            {err && <p className="text-red-400 text-sm">{err}</p>}
          </form>

          {/* Divider */}
          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-white/50">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Google button: same width as inputs */}
          <div className="mt-4">
            <div ref={gsiRef} className="w-full" />
          </div>

          <p className="mt-3 text-sm text-white/60">
            Already have an account?{" "}
            <a href="/login" className="text-brand-500 hover:underline">
              Log in
            </a>
            .
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
