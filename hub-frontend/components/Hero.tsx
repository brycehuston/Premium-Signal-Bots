"use client";
import { motion } from "framer-motion";
import { Button, Card } from "@/components/ui";
import { Rocket, Zap } from "lucide-react";

export default function Hero() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-edge bg-card/80 shadow-glow">
      {/* Neon blob / grid */}
      <div className="pointer-events-none absolute -top-24 -right-20 h-80 w-80 rounded-full bg-brand-600/25 blur-3xl" />
      <div className="absolute inset-0 bg-hero-grid bg-grid opacity-[.18]" />
      <div className="relative p-8 md:p-12">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .6 }}
          className="text-3xl md:text-4xl font-semibold tracking-tight"
        >
          Trade faster with <span className="text-brand-600">Crypto Signal Scanner</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .1, duration: .6 }}
          className="mt-3 text-white/70 max-w-2xl"
        >
          Real‑time scans, sentiment + on‑chain signals, and smart alerts. Launch a bot in seconds — no code.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .2, duration: .6 }}
          className="mt-6 flex gap-2"
        >
          <Button href="/billing" variant="primary">
            <Rocket className="mr-2 h-4 w-4" /> Start Free Trial
          </Button>
          <Button href="/dashboard" variant="ghost">
            <Zap className="mr-2 h-4 w-4" /> View Dashboard
          </Button>
        </motion.div>

        {/* mini KPIs */}
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            { k: "Avg. signal latency", v: "120ms" },
            { k: "Markets watched", v: "120+" },
            { k: "Uptime (90d)", v: "99.98%" },
          ].map((i) => (
            <Card key={i.k}>
              <div className="p-4">
                <div className="text-xs uppercase tracking-wider text-white/50">{i.k}</div>
                <div className="text-lg font-semibold mt-1">{i.v}</div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
