// app/dashboard/page.tsx
"use client";

/**
 * Expects /me to return at least:
 * {
 *   email: string,
 *   tier?: number,                         // optional; we fall back to entitlements length
 *   entitlements?: SignalKey[],            // ["alpha_early", "alpha_trend", ...]
 * }
 */

import { useEffect, useRef, useState } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Badge, Button, Card, CardBody, SectionHeading } from "@/components/ui";
import { api } from "@/lib/api";

/* ---------- Types ---------- */
type SignalKey = "alpha_early" | "alpha_trend" | "alpha_runner";
type BotKey = "trend_rider";
type LogChannel = SignalKey | "all";
type BtcInterval = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";

type Me = {
  email: string;
  tier?: number | null;
  entitlements?: SignalKey[] | null;
};

type BotStatus = { bot: string; status: string };

const BtcMiniChart = dynamic(() => import("@/components/BtcMiniChart"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] rounded-xl border border-stroke/60 bg-surface/60" />
  ),
});

/* ---------- Labels ---------- */
const BOT_LABELS: Record<BotKey, string> = {
  trend_rider: "ALPHA-X",
};

const SIGNAL_LABELS: Record<SignalKey, string> = {
  alpha_early: "Alpha Early",
  alpha_trend: "Alpha Trend",
  alpha_runner: "Alpha Runner",
};
const SIGNAL_ORDER: SignalKey[] = ["alpha_early", "alpha_trend", "alpha_runner"];
const LOG_LABELS: Record<LogChannel, string> = {
  ...SIGNAL_LABELS,
  all: "All Signals",
};
const LOG_TABS: LogChannel[] = ["all", ...SIGNAL_ORDER];
const BTC_INTERVALS: { key: BtcInterval; label: string }[] = [
  { key: "1m", label: "1 MIN" },
  { key: "5m", label: "5 MIN" },
  { key: "15m", label: "15 MIN" },
  { key: "1h", label: "1 HR" },
  { key: "4h", label: "4 HR" },
  { key: "1d", label: "1D" },
];
const BTC_INTERVAL_LABELS: Record<BtcInterval, string> = {
  "1m": "1 MIN",
  "5m": "5 MIN",
  "15m": "15 MIN",
  "1h": "1 HR",
  "4h": "4 HR",
  "1d": "1D",
};
const ME_CACHE_KEY = "dashboard.me.v1";

/* ---------- Utils ---------- */
function logsWsUrl(channel: string) {
  const base = new URL(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");
  base.protocol = base.protocol === "https:" ? "wss:" : "ws:";
  base.pathname = "/ws/logs";
  base.search = `?bot=${encodeURIComponent(channel)}`; // server can treat this as a channel key
  return base.toString();
}

function DashboardDivider() {
  const prefersReduced = useReducedMotion();
  const dividerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: dividerRef,
    offset: ["start end", "end start"],
  });
  const travel = useTransform(scrollYProgress, [0, 1], ["12%", "88%"]);
  const glow = useTransform(scrollYProgress, [0, 0.5, 1], [0.6, 1, 0.6]);
  const sweep = useTransform(scrollYProgress, [0, 1], ["10%", "90%"]);
  const sweepGlow = useTransform(scrollYProgress, [0, 0.5, 1], [0.35, 0.95, 0.35]);

  return (
    <div ref={dividerRef} aria-hidden className="relative flex items-center justify-center py-5 md:py-6">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-stroke/70 to-transparent" />
      <motion.div
        className="pointer-events-none absolute top-1/2 h-px w-36 -translate-y-1/2 bg-gradient-to-r from-transparent via-gold/80 to-transparent shadow-[0_0_16px_rgb(var(--gold)/0.4)] md:w-52"
        style={{
          left: prefersReduced ? "50%" : sweep,
          opacity: prefersReduced ? 0.6 : sweepGlow,
          translateX: "-50%",
        }}
      />
      <motion.div
        className="pointer-events-none absolute top-1/2 flex items-center gap-2 -translate-y-1/2"
        style={{
          left: prefersReduced ? "50%" : travel,
          opacity: prefersReduced ? 1 : glow,
          translateX: "-50%",
        }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-gold/70 shadow-[0_0_10px_rgb(var(--gold)/0.45)]" />
        <span className="h-1 w-1 rounded-full bg-gold/40" />
        <span className="h-1.5 w-1.5 rounded-full bg-gold/70 shadow-[0_0_10px_rgb(var(--gold)/0.45)]" />
      </motion.div>
    </div>
  );
}

/* ---------- Page ---------- */
export default function Dashboard() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { signOut: clerkSignOut } = useClerk();
  const [me, setMe] = useState<Me | null>(null);
  const [status, setStatus] = useState<BotStatus[]>([]);
  const [loading, setLoading] = useState(true);

  // Signals only for the log viewer
  const [activeSignal, setActiveSignal] = useState<LogChannel>("alpha_early");
  const [btcInterval, setBtcInterval] = useState<BtcInterval>("1m");
  const [logs, setLogs] = useState<string[]>([]);
  const [wsState, setWsState] = useState<"idle" | "connecting" | "open" | "closed" | "reconnecting">("idle");
  const [busy, setBusy] = useState<"start" | "stop" | null>(null);

  const cachedRef = useRef(false);
  const wsSessionRef = useRef(0);
  const wsOpenCountRef = useRef(0);
  const wsExpectedRef = useRef(0);
  const wsMetaRef = useRef({
    sockets: new Map<SignalKey, WebSocket>(),
    timers: new Map<SignalKey, number>(),
    tries: new Map<SignalKey, number>(),
  });

  async function authedApi(path: string, init: RequestInit = {}) {
    const token = await getToken();
    if (!token) throw new Error("not_authenticated");
    return api(path, init, { token });
  }

  async function refresh() {
    try {
      const _me = await authedApi("/me");
      setMe(_me as Me);
      try {
        sessionStorage.setItem(ME_CACHE_KEY, JSON.stringify(_me));
        cachedRef.current = true;
      } catch {}
      setLoading(false);
    } catch {
      if (!cachedRef.current) {
        // 401 / CORS / network - show Not Authorized instead of hanging
        setMe(null);
      }
      setLoading(false);
      return;
    }

    // /bot/status may 403 for inactive accounts - that's fine
    try {
      const s = await authedApi("/bot/status");
      setStatus((s?.bots || []) as BotStatus[]);
    } catch {
      setStatus([]);
    }
  }

  function resetConnections() {
    wsMetaRef.current.sockets.forEach((sock) => {
      try {
        sock.close();
      } catch {}
    });
    wsMetaRef.current.sockets.clear();
    wsMetaRef.current.timers.forEach((timer) => window.clearTimeout(timer));
    wsMetaRef.current.timers.clear();
    wsMetaRef.current.tries.clear();
    wsOpenCountRef.current = 0;
    wsExpectedRef.current = 0;
  }

  function scheduleReconnect(channel: SignalKey, session: number, prefix: string | null) {
    setWsState("reconnecting");
    const tries = (wsMetaRef.current.tries.get(channel) ?? 0) + 1;
    wsMetaRef.current.tries.set(channel, tries);
    const delay = Math.min(30_000, 1000 * 2 ** (tries - 1)); // 1s, 2s, 4s ... cap 30s

    const existing = wsMetaRef.current.timers.get(channel);
    if (existing) window.clearTimeout(existing);

    const timer = window.setTimeout(() => {
      wsMetaRef.current.timers.delete(channel);
      if (wsSessionRef.current !== session) return;
      connectChannel(channel, session, prefix);
    }, delay);

    wsMetaRef.current.timers.set(channel, timer);
  }

  function connectChannel(channel: SignalKey, session: number, prefix: string | null) {
    const sock = new WebSocket(logsWsUrl(channel));
    wsMetaRef.current.sockets.set(channel, sock);

    sock.onopen = () => {
      if (wsSessionRef.current !== session) return;
      wsOpenCountRef.current += 1;
      wsMetaRef.current.tries.set(channel, 0);
      setWsState(wsOpenCountRef.current >= wsExpectedRef.current ? "open" : "connecting");
    };

    sock.onmessage = (ev) => {
      if (wsSessionRef.current !== session) return;
      const line = prefix ? `${prefix}: ${ev.data}` : ev.data;
      setLogs((prev) => {
        const next = [...prev, line];
        if (next.length > 500) next.shift();
        return next;
      });
    };

    sock.onclose = () => {
      if (wsSessionRef.current !== session) return;
      wsOpenCountRef.current = Math.max(0, wsOpenCountRef.current - 1);
      scheduleReconnect(channel, session, prefix);
    };
    sock.onerror = () => {
      try {
        sock.close();
      } catch {}
    };
  }

  function connectLogs(channel: LogChannel) {
    wsSessionRef.current += 1;
    const session = wsSessionRef.current;
    resetConnections();
    setLogs([]);
    setWsState("connecting");

    const channels = channel === "all" ? SIGNAL_ORDER : [channel];
    wsExpectedRef.current = channels.length;
    wsOpenCountRef.current = 0;

    channels.forEach((entry) => {
      const prefix = channel === "all" ? SIGNAL_LABELS[entry] : null;
      connectChannel(entry, session, prefix);
    });
  }

  async function start(bot: BotKey) {
    try {
      setBusy("start");
      await authedApi("/bot/start", { method: "POST", body: JSON.stringify({ bot_name: bot }) });
      await refresh();
    } finally {
      setBusy(null);
    }
  }
  async function stop(bot: BotKey) {
    try {
      setBusy("stop");
      await authedApi("/bot/stop", { method: "POST", body: JSON.stringify({ bot_name: bot }) });
      await refresh();
    } finally {
      setBusy(null);
    }
  }
  function signOut() {
    clerkSignOut({ redirectUrl: "/login" });
  }

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(ME_CACHE_KEY);
      if (!cached) return;
      setMe(JSON.parse(cached) as Me);
      cachedRef.current = true;
      setLoading(false);
    } catch {}
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setMe(null);
      setLoading(false);
      return;
    }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (!me) {
      resetConnections();
      setWsState("idle");
      return;
    }
    connectLogs(activeSignal);
    return () => {
      resetConnections();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSignal, me]);

  if (loading) return <div className="text-muted">Loading...</div>;
  if (!me) return <div className="text-red-400">Not Authorized</div>;

  // entitlement/tier logic
  const entSet = new Set<SignalKey>(me.entitlements ?? []);
  const computedTier = (me.tier ?? undefined) ?? entSet.size;

  return (
    <div className="relative -mt-6 space-y-6 md:-mt-8 md:space-y-8">
      <h1 className="sr-only">Dashboard</h1>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 right-6 h-64 w-64 rounded-full bg-gold/12 blur-[140px]" />
        <div className="absolute top-[35%] -left-10 h-64 w-64 rounded-full bg-silver/10 blur-[150px]" />
      </div>

      <div className="flex flex-col gap-2 md:gap-3">
        <SectionHeading
          eyebrow="Alpha Command"
          title="DASHBOARD"
          subtitle="Live access to your alerts, signals, and log feed."
          className="space-y-1 md:space-y-2"
        />
      </div>

      {/* Top row: Account + Chart */}
      <div className="grid gap-6 lg:grid-cols-4 xl:grid-cols-5">
        {/* Account */}
        <Card className="relative overflow-hidden lg:col-span-2 xl:col-span-2 bg-[linear-gradient(140deg,rgba(255,255,255,0.04),rgba(255,255,255,0))]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent"
          />
          <CardBody className="flex h-full flex-col gap-4 pt-4 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="text-[11px] uppercase tracking-[0.3em] text-muted/70">
                  Account
                </div>
                <div className="break-all text-base font-semibold text-silver">{me.email}</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="!h-7 !px-2 !rounded-md text-[10px] uppercase tracking-[0.2em] opacity-80 hover:opacity-100"
              >
                Sign Out
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-muted/70">
                <span>Signal Stack</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold/70 shadow-[0_0_8px_rgb(var(--gold)/0.45)]" />
                  Tier {String(computedTier)}
                </span>
              </div>
              <div className="space-y-2">
                {SIGNAL_ORDER.map((key) => {
                  const active = entSet.has(key);
                  return (
                    <div
                      key={key}
                      className={[
                        "group flex items-center justify-between gap-3 rounded-lg border px-3 py-3 transition-all",
                        "bg-[linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0))]",
                        active
                          ? "border-emerald-400/30 bg-surface/70 hover:border-emerald-300/60 hover:shadow-[0_0_0_1px_rgba(52,211,153,0.18)]"
                          : "border-stroke/70 bg-surface/50 opacity-80 hover:opacity-90 hover:border-white/15 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.04)]",
                      ].join(" ")}
                    >
                      <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-silver">
                        {SIGNAL_LABELS[key]}
                      </div>
                      <span
                        className={[
                          "inline-flex min-w-[92px] items-center justify-center rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]",
                          active
                            ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                            : "border-red-400/40 bg-red-500/10 text-red-200",
                        ].join(" ")}
                      >
                        {active ? "ACTIVE" : "LOCKED"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-auto pt-1">
              <div className="rounded-control border border-stroke/70 bg-surface/70 px-3 py-2 text-xs text-muted">
                Unlock Tier 5 to access the full Alpha stack.
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Live BTC chart */}
        <Card className="relative overflow-hidden lg:col-span-2 xl:col-span-3">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent"
          />
          <CardBody className="relative">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-sm font-semibold uppercase tracking-[0.25em] text-silver">
                  BTC - BINANCE FEED
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {BTC_INTERVALS.map((item) => {
                    const active = btcInterval === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => setBtcInterval(item.key)}
                        className={[
                          "h-7 rounded-md border px-2 text-[10px] uppercase tracking-[0.2em]",
                          active
                            ? "border-white/50 bg-white/15 text-silver"
                            : "border-stroke/70 bg-surface/70 text-muted hover:bg-surface2/80",
                        ].join(" ")}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <Badge tone="live" className="!h-8 !rounded-md text-[11px] absolute right-6 top-6 translate-y-[2px]">
              Live
            </Badge>
            <div className="mt-4">
              <BtcMiniChart height={300} interval={btcInterval} />
            </div>
          </CardBody>
        </Card>
      </div>

      <DashboardDivider />

      {/* Bot tile */}
      <div className="grid gap-6">
        {/* ALPHA-X */}
        <Card className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-44 w-44 -translate-x-1/2 alpha-x-glow" />
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-eyebrow uppercase tracking-[0.35em] text-muted/70">
                Alpha Bot
              </div>
              <Badge tone="planned" className="text-silver">In Build</Badge>
            </div>
            <div className="font-display text-3xl font-semibold tracking-[0.06em] text-silver">
              {BOT_LABELS.trend_rider}
            </div>
            <p className="text-sm text-muted">
              ALPHA-X is in build. Controls and logs will unlock once the bot is live.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button disabled size="sm" onClick={() => start("trend_rider")}>
                Start
              </Button>
              <Button disabled size="sm" variant="ghost" onClick={() => stop("trend_rider")}>
                Stop
              </Button>
              <Button disabled size="sm" variant="outline">
                Logs
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      <DashboardDivider />

      {/* Live logs - signals only */}
      <Card className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent"
        />
        <CardBody>
          <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-1">
              <div className="text-eyebrow uppercase tracking-[0.35em] text-muted/70">Console</div>
              <div className="text-lg font-semibold text-silver">
                <span className="uppercase">Live Logs:</span>{" "}
                <span className="text-metal-gold uppercase">{LOG_LABELS[activeSignal]}</span>
              </div>
            </div>

            {/* non-wrapping, scrollable row so Clear stays on the same line */}
            <div className="overflow-x-auto">
              <div className="flex items-center gap-2 whitespace-nowrap">
                {LOG_TABS.map((key) => {
                  const isActive = activeSignal === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveSignal(key)}
                      className={[
                        "rounded-pill border px-3 py-1.5 text-[11px] uppercase tracking-[0.3em]",
                        key === "all" ? "font-bold" : "font-semibold",
                        isActive
                          ? "border-gold/50 bg-gold/15 text-gold"
                          : "border-stroke/70 bg-surface/70 text-muted hover:bg-surface2/80",
                      ].join(" ")}
                    >
                      {LOG_LABELS[key]}
                    </button>
                  );
                })}

                <span
                  className={[
                    "ml-2 inline-flex items-center gap-2 rounded-pill border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em]",
                    wsState === "open"
                      ? "border-green-400/30 bg-green-500/10 text-green-300"
                      : wsState === "reconnecting" || wsState === "connecting"
                      ? "border-green-700 bg-green-500/10 text-green-300"
                      : "border-red-400/30 bg-red-500/10 text-red-300",
                  ].join(" ")}
                >
                  <span className="h-2 w-2 rounded-full bg-current" />
                  {wsState}
                </span>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setLogs([])}
                  className="!h-9 !px-3 text-[11px] uppercase tracking-[0.3em]"
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>

          <div className="h-72 overflow-auto rounded-xl border border-stroke/50 bg-surface2/80 p-3 font-mono text-sm text-silver">
            {logs.length === 0 ? "Waiting for logs..." : logs.join("\n")}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
