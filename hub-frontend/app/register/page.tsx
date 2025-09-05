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

        {/* Divider matches same width */}
        <div className="mt-6 flex items-center gap-3 max-w-md">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-white/50 text-xs">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Google register button: same width & height as blue button */}
        <div className="mt-4 max-w-md">
          <button
            type="button"
            onClick={registerWithGoogle}
            className="h-11 w-full rounded-xl bg-white text-black px-4 font-medium hover:bg-white/90 transition shadow-md hover:shadow-lg flex items-center justify-center gap-3"
          >
            <svg width="20" height="20" viewBox="0 0 533.5 544.3" aria-hidden="true">
              <path fill="#4285f4" d="M533.5 278.4c0-18.5-1.7-36.4-5-53.6H272.1v101.5h146.9c-6.3 34-25 62.8-53.4 82v68h86.5c50.6-46.6 81.4-115.3 81.4-198z"/>
              <path fill="#34a853" d="M272.1 544.3c72.5 0 133.4-24 177.8-65.1l-86.5-68c-24 16.1-54.6 25.6-91.3 25.6-70.1 0-129.5-47.3-150.8-110.7h-89.3v69.6c44 87.2 134.5 148.6 239.9 148.6z"/>
              <path fill="#fbbc04" d="M121.3 326.1c-10.1-30-10.1-62.1 0-92.1v-69.6H32C11.5 205.5 0 240.2 0 278.4s11.5 72.9 32 114.1l89.3-66.4z"/>
              <path fill="#ea4335" d="M272.1 107.7c39.4-.6 77.2 13.9 106.2 40.8l79.4-79.4C405.4 24.1 344.6 0 272.1 0 166.6 0 76.1 61.4 32 148.6l89.3 69.6C142.6 154.8 202 107.7 272.1 107.7z"/>
            </svg>
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
