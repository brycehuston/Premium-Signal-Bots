// app/login/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/SupabaseProvider";

export default function LoginPage() {
  const { supabase, session, loading } = useSupabase();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (session) router.replace("/dashboard");
  }, [loading, session, router]);

  async function signInWithGoogle() {
    if (!supabase) return;
    setBusy(true);
    setError(null);
    try {
      const origin = window.location.origin;
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=/dashboard`,
        },
      });
    } finally {
      setBusy(false);
    }
  }

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
        });
        if (signUpError) throw signUpError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  if (loading || session) return null;

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-card border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-8 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.7)]">
        <div className="text-center">
          <div className="text-xs uppercase tracking-[0.45em] text-muted/70">Alpha Alerts</div>
          <h1 className="mt-3 font-display text-3xl font-semibold text-silver">Sign in</h1>
          <p className="mt-2 text-sm text-muted">Use Google or email/password.</p>
        </div>
        <button
          onClick={signInWithGoogle}
          disabled={busy || !supabase}
          className="mt-6 w-full rounded-md border border-white/15 bg-white/90 px-4 py-3 text-sm font-semibold text-black transition hover:bg-white disabled:opacity-60"
        >
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-muted/60">
          <span className="h-px flex-1 bg-white/10" />
          or
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={signInWithEmail} className="space-y-3">
          <label className="block text-xs uppercase tracking-[0.3em] text-muted/60">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-silver outline-none transition focus:border-white/30"
              placeholder="you@email.com"
            />
          </label>
          <label className="block text-xs uppercase tracking-[0.3em] text-muted/60">
            Password
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-silver outline-none transition focus:border-white/30"
              placeholder="••••••••"
            />
          </label>
          <div className="flex items-center justify-between text-xs text-muted">
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="hover:text-silver"
            >
              {mode === "login" ? "Need an account? Sign up" : "Have an account? Sign in"}
            </button>
            <a className="hover:text-silver" href="/waitlist">
              Join waitlist
            </a>
          </div>
          {error && <div className="text-sm text-red-400">{error}</div>}
          <button
            type="submit"
            disabled={busy || !supabase}
            className="w-full rounded-md border border-gold/50 bg-gold/15 px-4 py-3 text-sm font-semibold text-gold transition hover:bg-gold/25 disabled:opacity-60"
          >
            {mode === "login" ? "Sign in with Email" : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-muted">
          Password sign-in requires Email provider enabled in Supabase Auth.
        </p>
      </div>
    </div>
  );
}
