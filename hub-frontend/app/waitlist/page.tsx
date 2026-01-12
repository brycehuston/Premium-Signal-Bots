"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

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
      setOk("Thanks! You're on the list.");
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
      <div className="rounded-2xl border border-stroke/70 bg-surface/80 p-6 shadow-glow">
        <h2 className="mb-4 text-center text-2xl font-semibold text-silver">
          Join the Alpha-X Waitlist
        </h2>
        <form onSubmit={submit} className="grid gap-3">
          <input
            className="input"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="input"
            placeholder="Your email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <textarea
            className="input min-h-[90px]"
            placeholder="Got an idea? Share it here..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button type="submit" disabled={busy} className="mt-2">
            {busy ? "Working..." : "Join Waitlist"}
          </Button>
          {ok && <p className="text-green-400 text-sm">{ok}</p>}
          {err && <p className="text-red-400 text-sm">{err}</p>}
        </form>
      </div>
    </div>
  );
}
