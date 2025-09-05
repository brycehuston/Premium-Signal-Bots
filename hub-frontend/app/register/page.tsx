"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, H2 } from "@/components/ui";

export default function RegisterPage() {
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

  function registerWithGoogle() {
    window.location.href = `${API_BASE}/auth/google/start`;
  }

  return (
    <Card>
      <CardBody>
        <H2>Create account</H2>
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
            autoComplete="new-password"
          />
          <button
            disabled={busy}
            className="rounded-xl bg-brand-600 text-black font-medium px-4 py-2 hover:bg-brand-500 disabled:opacity-50"
          >
            {busy ? "…" : "Create account"}
          </button>

          {err && <p className="text-red-400 text-sm">{err}</p>}
        </form>

        {/* Divider */}
        <div className="mt-6 flex items-center gap-3 max-w-md">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-white/50 text-xs">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Google register */}
        <div className="mt-4 max-w-md">
          <button
            type="button"
            onClick={registerWithGoogle}
            className="w-full rounded-xl bg-white text-black px-4 py-2 font-medium hover:bg-white/90 transition"
          >
            Continue with Google
          </button>

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
