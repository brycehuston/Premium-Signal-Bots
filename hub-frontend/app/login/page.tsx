"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, H2 } from "@/components/ui";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

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
      const token = data.access_token || data.token;
      localStorage.setItem("token", token);
      router.push("/dashboard");
    } catch (e: any) {
      setErr(e.message ?? "Login failed");
    } finally {
      setBusy(false);
    }
  }

  function loginWithGoogle() {
    // Redirect to your backend’s OAuth start route
    window.location.href = `${API_BASE}/auth/google/start`;
  }

  return (
    <Card>
      <CardBody>
        <H2>Login</H2>

        {/* Email / password form */}
        <form onSubmit={handle} className="mt-4 grid gap-3 max-w-md">
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

            {/* simple native button so we don't depend on Button props */}
            <button
              type="button"
              onClick={() => localStorage.removeItem("token")}
              className="rounded-xl border border-edge bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            >
              Clear token
            </button>
          </div>
          
{/* under the buttons, before the error message */}
<p className="mt-3 text-sm text-white/60">
  Don’t have an account?{" "}
  <a href="/register" className="text-brand-500 hover:underline">
    Create one
  </a>
  {" "}or{" "}
  <button
    type="button"
    onClick={() => (window.location.href = `${process.env.NEXT_PUBLIC_API_BASE}/auth/google/start`)}
    className="text-white/80 hover:underline"
  >
    continue with Google
  </button>
  .
</p>

          {err && <p className="text-red-400 text-sm">{err}</p>}
        </form>

        {/* Divider */}
        <div className="mt-6 flex items-center gap-3 max-w-md">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-white/50 text-xs">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Google login */}
        <div className="mt-4 max-w-md">
          <button
            type="button"
            onClick={loginWithGoogle}
            className="w-full rounded-xl bg-white text-black px-4 py-2 font-medium hover:bg-white/90 transition"
          >
            Continue with Google
          </button>
          <p className="mt-2 text-xs text-white/50">
            We’ll redirect you to Google, then back here.
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
