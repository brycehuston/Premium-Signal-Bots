"use client";

import { useState } from "react";

export default function WaitlistPage() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setOk(null);
    setErr(null);
    try {
      const res = await fetch(`${API_BASE}/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, comment }),
      });
      if (!res.ok) throw new Error(await res.text());
      setOk("Thanks! You’re on the list.");
      setEmail("");
      setName("");
      setComment("");
    } catch (e: any) {
      setErr(e.message ?? "Failed to join waitlist");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-edge bg-card/80 p-6 shadow-glow">
        <h2 className="mb-4 text-center text-2xl font-semibold">
          Join the Alpha-X Waitlist
        </h2>
        <form onSubmit={submit} className="grid gap-3">
          <input
            className="rounded-xl bg-white/5 border border-edge px-3 py-2 outline-none focus:border-brand-600"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="rounded-xl bg-white/5 border border-edge px-3 py-2 outline-none focus:border-brand-600"
            placeholder="Your email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <textarea
            className="min-h-[90px] rounded-xl bg-white/5 border border-edge px-3 py-2 outline-none focus:border-brand-600"
            placeholder="Got an idea? Share it here…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button
            disabled={busy}
            className="mt-2 rounded-xl bg-[#f0b323] px-4 py-2 font-medium text-black hover:brightness-110 disabled:opacity-50"
          >
            {busy ? "…" : "Join Waitlist"}
          </button>
          {ok && <p className="text-green-400 text-sm">{ok}</p>}
          {err && <p className="text-red-400 text-sm">{err}</p>}
        </form>
      </div>
    </div>
  );
}
