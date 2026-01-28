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
      <h1 className="sr-only">Join the Alpha-X Waitlist</h1>
      <div className="rounded-card border border-stroke/70 bg-surface/80 p-6 shadow-soft">
        <h2 className="mb-4 text-center font-display text-h3 font-semibold text-silver">
          Join the Alpha-X Waitlist
        </h2>
        <form onSubmit={submit} className="grid gap-3">
          <label className="block">
            <span className="sr-only">Your name</span>
            <input
              className="input"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="sr-only">Your email</span>
            <input
              className="input"
              placeholder="Your email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="sr-only">Comment</span>
            <textarea
              className="input min-h-[90px]"
              placeholder="Got an idea? Share it here..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </label>
          <Button type="submit" disabled={busy} className="mt-2">
            {busy ? "Working..." : "Join Waitlist"}
          </Button>
          {ok && <p className="text-success text-small">{ok}</p>}
          {err && <p className="text-danger text-small">{err}</p>}
        </form>
      </div>
    </div>
  );
}
