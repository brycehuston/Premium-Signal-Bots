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

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;
  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
  const gsiRef = useRef<HTMLDivElement>(null);

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

  // Render the official Google button, full-width & large
  useEffect(() => {
    const src = "https://accounts.google.com/gsi/client";

    function renderButton() {
      if (!window.google || !gsiRef.current) return;

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

      // Big, pill, full-width; shows "Continue with Google"
      window.google.accounts.id.renderButton(gsiRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        logo_alignment: "left",
        width: 460, // px; button will clamp to container if smaller
      });
    }

    // Load script once
    if (!document.querySelector(`script[src="${src}"]`)) {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.defer = true;
      s.onload = renderButton;
      document.head.appendChild(s);
    } else {
      renderButton();
    }
  }, [API_BASE, GOOGLE_CLIENT_ID, router]);

  return (
    <Card>
      <CardBody>
        <H2>Login</H2>

        {/* Email / password form */}
        <form onSubmit={handle} className="mt-4 grid max-w-md gap-3">
          <input
            className="rounded-xl bg-white/5 border border-edge px-3 py-2 outline-none focus:border-brand-600"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <input
            className="rounded-xl bg-white/5 border border-edge px-3 py-2 outline-none focus:border-brand-600"
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

          <p className="mt-3 text-sm text-white/60">
            Don’t have an account?{" "}
            <a href="/register" className="text-brand-500 hover:underline">
              Create one
            </a>
            .
          </p>

          {err && <p className="text-red-400 text-sm">{err}</p>}
        </form>

        {/* Divider */}
        <div className="mt-6 flex max-w-md items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-white/50">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Google button (full width, larger). No extra caption. */}
        <div className="mt-4 max-w-md items-center">
          <div ref={gsiRef} className="w-full items-center" />
        </div>
      </CardBody>
    </Card>
  );
}
