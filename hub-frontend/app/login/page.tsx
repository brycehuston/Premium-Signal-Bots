// app/login/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/SupabaseProvider";

export default function LoginPage() {
  const { supabase, session, loading } = useSupabase();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (session) router.replace("/dashboard");
  }, [loading, session, router]);

  async function signInWithGoogle() {
    setBusy(true);
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

  if (loading || session) return null;

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-card border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-8 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.7)]">
        <div className="text-center">
          <div className="text-xs uppercase tracking-[0.45em] text-muted/70">Alpha Alerts</div>
          <h1 className="mt-3 font-display text-3xl font-semibold text-silver">Sign in</h1>
          <p className="mt-2 text-sm text-muted">Use Google to access your dashboard.</p>
        </div>
        <button
          onClick={signInWithGoogle}
          disabled={busy}
          className="mt-6 w-full rounded-md border border-white/15 bg-white/90 px-4 py-3 text-sm font-semibold text-black transition hover:bg-white disabled:opacity-60"
        >
          Continue with Google
        </button>
        <p className="mt-4 text-center text-xs text-muted">
          Don&apos;t have access yet?{" "}
          <a href="/waitlist" className="text-silver hover:text-white">
            Join the waitlist
          </a>
        </p>
      </div>
    </div>
  );
}
