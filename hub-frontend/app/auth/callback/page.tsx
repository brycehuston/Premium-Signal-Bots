"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSupabase } from "@/components/SupabaseProvider";

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { supabase } = useSupabase();
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const didRun = useRef(false);

  useEffect(() => {
    if (!supabase) return;
    if (didRun.current) return;
    didRun.current = true;
    setStatus("working");
    const next = params.get("next") || "/dashboard";
    const run = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setStatus("error");
        setMessage(error.message || "OAuth session lookup failed.");
        return;
      }
      if (!data.session) {
        setStatus("error");
        setMessage("No session was created. Please try logging in again.");
        return;
      }
      router.replace(next);
    };

    void run();
  }, [supabase, params, router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted">
      {status === "working" && "Finishing sign in..."}
      {status === "error" && (
        <div className="max-w-md rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200">
          <div className="text-sm font-semibold">OAuth failed</div>
          <div className="mt-1 text-xs text-red-200/80">{message}</div>
          <button
            onClick={() => router.replace("/login?error=oauth")}
            className="mt-3 rounded-md border border-red-400/40 bg-red-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-red-200"
          >
            Back to login
          </button>
        </div>
      )}
    </div>
  );
}
