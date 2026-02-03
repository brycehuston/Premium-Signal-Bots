"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui";

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

  function getErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    return "Failed to submit.";
  }

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
      setOk("Submitted! We'll review and approve shortly.");
      setTxHash("");
      setTelegram("");
    } catch (error: unknown) {
      setErr(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-7 space-y-4">
      <label className="block text-sm text-muted">
        TX hash / explorer link
        <input
          required
          value={txHash}
          onChange={e => setTxHash(e.target.value)}
          className="input mt-2"
          placeholder="https://solscan.io/tx/..."
        />
      </label>

      <label className="block text-sm text-muted">
        Telegram username (optional)
        <input
          value={telegram}
          onChange={e => setTelegram(e.target.value)}
          className="input mt-2"
          placeholder="@yourname"
        />
      </label>

      <Button type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Submit for approval"}
      </Button>

      {ok && <div className="text-green-400 text-sm">{ok}</div>}
      {err && <div className="text-red-400 text-sm">{err}</div>}
    </form>
  );
}

