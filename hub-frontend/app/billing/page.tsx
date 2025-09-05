// app/billing/page.tsx (replace body inside your Card)
"use client";
import { useState } from "react";
import { Button, Section } from "@/components/ui";
import { motion } from "framer-motion";
import { CreditCard, Settings } from "lucide-react";
import { toast } from "sonner";

export default function Billing() {
  const [busy, setBusy] = useState(false);

  async function go(path: string) {
    setBusy(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) { window.location.href="/login"; return; }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      toast.success("Redirecting to secure checkout…");
      window.location.href = data.url;
    } catch (e:any) {
      toast.error(e.message || "Something went wrong");
    } finally { setBusy(false); }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Section title="Billing" subtitle="Secure payments by Stripe. Your card never touches our servers.">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => go("/billing/create-checkout-session")} variant="primary" disabled={busy}>
            <CreditCard className="mr-2 h-4 w-4" /> Subscribe
          </Button>
          <Button onClick={() => go("/billing/create-portal-session")} variant="ghost" disabled={busy}>
            <Settings className="mr-2 h-4 w-4" /> Manage Billing
          </Button>
        </div>
        <p className="text-white/60 mt-3 text-sm">14‑day money‑back guarantee. No lock‑in.</p>
      </Section>
    </motion.div>
  );
}
