"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export default function SubmitTxForm({
  plan,
  price,
  chain = "solana",
  asset = "USDC",
}: {
  plan: string;
  price: number;
  chain?: string;
  asset?: string;
}) {
  const [txHash, setTxHash] = useState("");
  const [telegram, setTelegram] = useState("");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setOk(null);
    setErr(null);
    try {
      await api("/crypto/submit", {
        method: "POST",
        body: JSON.stringify({
          plan,
          chain,
          asset,
          amount: price,
          tx_hash: txHash.trim(),
          telegram_username: telegram.trim(),
        }),
      });
      setOk("Submitted! We’ll review and approve shortly.");
      setTxHash("");
      setTelegram("");
    } catch (e: any) {
      setErr(e.message || "Failed to submit.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-3">
      <label className="block text-sm text-white/80">
        TX hash / explorer link
        <input
          required
          value={txHash}
          onChange={e => setTxHash(e.target.value)}
          className="mt-1 w-full rounded-xl border border-edge bg-black/30 p-2 text-white/90"
          placeholder="https://solscan.io/tx/..."
        />
      </label>

      <label className="block text-sm text-white/80">
        Telegram username (optional)
        <input
          value={telegram}
          onChange={e => setTelegram(e.target.value)}
          className="mt-1 w-full rounded-xl border border-edge bg-black/30 p-2 text-white/90"
          placeholder="@yourname"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-10 items-center rounded-xl bg-brand-600 px-4 text-black hover:bg-brand-500 disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit for approval"}
      </button>

      {ok && <div className="text-green-400 text-sm">{ok}</div>}
      {err && <div className="text-red-400 text-sm">{err}</div>}
    </form>
  );
}
