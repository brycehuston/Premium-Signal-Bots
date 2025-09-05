// app/dashboard/page.tsx
"use client";

/**
 * Expects /me to return at least:
 * {
 *   email: string,
 *   tier?: number,                         // optional; we fall back to entitlements length
 *   entitlements?: SignalKey[],            // ["ema_tracker", "whaleflow", ...]
 * }
 */

import { useEffect, useRef, useState } from "react";
import BtcMiniChart from "@/components/BtcMiniChart";
import { api } from "@/lib/api";

/* ---------- Types ---------- */
type SignalKey = "ema_tracker" | "whaleflow" | "signal_plus" | "liq_guard" | "divergence";
type BotKey = "trend_rider" | "scalper" | "reversal";

type Me = {
  email: string;
  tier?: number | null;
  entitlements?: SignalKey[] | null;
};

type BotStatus = { bot: string; status: string };

/* ---------- Small UI helpers ---------- */
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-edge/70 bg-card/80 backdrop-blur shadow-glow ${className}`}>
      {children}
    </div>
  );
}
function CardBody({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}
function Btn({
  children,
  onClick,
  disabled,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "danger";
}) {
  const base = "inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm transition disabled:opacity-50";
  const style =
    variant === "primary"
      ? "bg-brand-600 hover:bg-brand-500 text-black"
      : variant === "danger"
      ? "bg-red-500/80 hover:bg-red-500 text-white"
      : "bg-white/5 hover:bg-white/10 text-white";
  return (
    <button className={`${base} ${style}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

/* ---------- Labels ---------- */
const BOT_LABELS: Record<BotKey, string> = {
  trend_rider: "Alpha Bot",
  scalper: "Scalper Bot",
  reversal: "Master Bot",
};

const SIGNAL_LABELS: Record<SignalKey, string> = {
  ema_tracker: "EMA Tracker",
  whaleflow: "WhaleFlow",
  signal_plus: "Signal Plus",
  liq_guard: "Liq Guard",
  divergence: "Div Scan",
};

const SIGNAL_ORDER: SignalKey[] = ["ema_tracker", "whaleflow", "signal_plus", "liq_guard", "divergence"];

/* ---------- Utils ---------- */
function logsWsUrl(channel: string) {
  const base = new URL(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");
  base.protocol = base.protocol === "https:" ? "wss:" : "ws:";
  base.pathname = "/ws/logs";
  base.search = `?bot=${encodeURIComponent(channel)}`; // server can treat this as a channel key
  return base.toString();
}

/* ---------- Page ---------- */
export default function Dashboard() {
  const [me, setMe] = useState<Me | null>(null);
  const [status, setStatus] = useState<BotStatus[]>([]);
  const [loading, setLoading] = useState(true);

  // Signals only for the log viewer
  const [activeSignal, setActiveSignal] = useState<SignalKey>("ema_tracker");
  const [logs, setLogs] = useState<string[]>([]);
  const [wsState, setWsState] = useState<"idle" | "connecting" | "open" | "closed" | "reconnecting">("idle");
  const [busy, setBusy] = useState<"start" | "stop" | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef({ tries: 0, timer: 0 });

  async function refresh() {
    try {
      const _me = await api("/me"); // requires Bearer token from api() helper
      setMe(_me as Me);

      // /bot/status may 403 for inactive accounts — that's fine
      try {
        const s = await api("/bot/status");
        setStatus((s?.bots || []) as BotStatus[]);
      } catch {
        setStatus([]);
      }
    } catch {
      // 401 / CORS / network — show Not Authorized instead of hanging
      setMe(null);
    } finally {
      setLoading(false);
    }
  }

  function connectLogs(channel: string) {
    try {
      wsRef.current?.close();
    } catch {}
    wsRef.current = null;
    setLogs([]);
    setWsState("connecting");

    const sock = new WebSocket(logsWsUrl(channel));
    wsRef.current = sock;

    sock.onopen = () => {
      setWsState("open");
      reconnectRef.current.tries = 0;
      if (reconnectRef.current.timer) {
        window.clearTimeout(reconnectRef.current.timer);
        reconnectRef.current.timer = 0;
      }
    };
    sock.onmessage = (ev) => {
      setLogs((prev) => {
        const next = [...prev, ev.data];
        if (next.length > 500) next.shift();
        return next;
      });
    };
    const scheduleReconnect = () => {
      setWsState("reconnecting");
      reconnectRef.current.tries += 1;
      const delay = Math.min(30_000, 1000 * 2 ** (reconnectRef.current.tries - 1)); // 1s, 2s, 4s … cap 30s
      reconnectRef.current.timer = window.setTimeout(() => connectLogs(channel), delay);
    };
    sock.onclose = () => {
      setWsState("closed");
      scheduleReconnect();
    };
    sock.onerror = () => {
      try {
        sock.close();
      } catch {}
    };
  }

  async function start(bot: BotKey) {
    try {
      setBusy("start");
      await api("/bot/start", { method: "POST", body: JSON.stringify({ bot_name: bot }) });
      await refresh();
    } finally {
      setBusy(null);
    }
  }
  async function stop(bot: BotKey) {
    try {
      setBusy("stop");
      await api("/bot/stop", { method: "POST", body: JSON.stringify({ bot_name: bot }) });
      await refresh();
    } finally {
      setBusy(null);
    }
  }
  function signOut() {
    try {
      localStorage.removeItem("token");
    } catch {}
    window.location.href = "/login";
  }

  useEffect(() => {
    refresh();
    return () => {
      try {
        wsRef.current?.close();
      } catch {}
      if (reconnectRef.current.timer) window.clearTimeout(reconnectRef.current.timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    connectLogs(activeSignal);
    return () => {
      try {
        wsRef.current?.close();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSignal]);

  if (loading) return <div className="text-white/70">Loading…</div>;
  if (!me) return <div className="text-red-400">Not Authorized</div>;

  // entitlement/tier logic
  const entSet = new Set<SignalKey>(me.entitlements ?? []);
  const computedTier = (me.tier ?? undefined) ?? entSet.size;

  return (
    <div className="space-y-6">
      {/* Top row: Account + Chart */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Account */}
        <Card className="lg:col-span-1">
          <CardBody className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              {/* email (trim so Sign Out never squishes) */}
              <div className="max-w-[72%] break-all text-base sm:text-lg font-semibold leading-6">
                {me.email}
              </div>
              <button
                onClick={signOut}
                className="shrink-0 mt-0.5 inline-flex h-9 items-center justify-center rounded-xl border border-edge/70 bg-white/5 px-3 text-sm text-white hover:bg-white/10"
              >
                Sign Out
              </button>
            </div>

            {/* Tier */}
            <div className="text-sm">
              <span className="text-white/60">TIER:</span>{" "}
              <span className="rounded-md border border-edge/70 bg-white/5 px-2 py-0.5 text-white/80">
                {String(computedTier)}
              </span>
            </div>

            <div className="h-px bg-white/10" />

            {/* Signals list: label left, pill right (perfectly aligned) */}
            <div className="space-y-2">
              {SIGNAL_ORDER.map((key) => {
                const active = entSet.has(key);
                return (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-white/80">
                      <span className="inline-block h-2 w-2 rounded-full bg-white/40" />
                      <span>{SIGNAL_LABELS[key]}</span>
                      <span className="text-white/60">— Access</span>
                    </div>

                    <span
                      className={`rounded-md border px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide ${
                        active
                          ? "border-green-400/30 bg-green-500/10 text-green-300"
                          : "border-red-400/30 bg-red-500/10 text-red-300"
                      }`}
                    >
                      {active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        {/* Live BTC chart */}
        <Card className="lg:col-span-2">
          <CardBody>
            <div className="mb-3">
              <div className="text-lg font-semibold">Live BTC (1m)</div>
              <div className="text-sm text-white/60">Binance feed · updates in real-time</div>
            </div>
            <BtcMiniChart height={300} />
          </CardBody>
        </Card>
      </div>

      {/* Three bot tiles */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Alpha Bot */}
        <Card>
          <CardBody className="space-y-4">
            <div className="text-lg font-semibold">{BOT_LABELS.trend_rider}</div>
            <div className="text-white/60">
              Status: <span className="text-white/80">Coming Soon</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Btn disabled onClick={() => start("trend_rider")}>Start</Btn>
              <Btn disabled variant="ghost" onClick={() => stop("trend_rider")}>Stop</Btn>
              <Btn variant="ghost">Logs</Btn>
            </div>
          </CardBody>
        </Card>

        {/* Scalper Bot */}
        <Card>
          <CardBody className="space-y-4">
            <div className="text-lg font-semibold">{BOT_LABELS.scalper}</div>
            <div className="text-white/60">
              Status: <span className="text-white/80">Coming Soon</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Btn disabled onClick={() => start("scalper")}>Start</Btn>
              <Btn disabled variant="ghost" onClick={() => stop("scalper")}>Stop</Btn>
              <Btn variant="ghost">Logs</Btn>
            </div>
          </CardBody>
        </Card>

        {/* Master Bot */}
        <Card>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">{BOT_LABELS.reversal}</div>
              <span className="rounded-md border border-yellow-400/30 bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-300">
                Limited spots available.
              </span>
            </div>
            <div className="text-white/60">
              Status: <span className="text-white/80">Coming Next Year</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Btn disabled>Start</Btn>
              <Btn disabled variant="ghost">Stop</Btn>
              <a
                href="/pricing"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-edge/70 bg-white/5 px-4 text-sm text-white hover:bg-white/10"
              >
                Get Updates
              </a>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Live logs — signals only */}
      <Card>
        <CardBody>
          <div className="mb-3 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="text-lg font-semibold">
              Live logs: <span>{SIGNAL_LABELS[activeSignal]}</span>
            </div>

            {/* non-wrapping, scrollable row so Clear stays on the same line */}
            <div className="overflow-x-auto">
              <div className="flex items-center gap-2 whitespace-nowrap">
                {SIGNAL_ORDER.map((key) => {
                  const isActive = activeSignal === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveSignal(key)}
                      className={`rounded-lg border px-3 py-1.5 text-sm ${
                        isActive
                          ? "border-brand-600 bg-brand-600/20 text-white"
                          : "border-edge/70 bg-white/5 text-white/80 hover:bg-white/10"
                      }`}
                    >
                      {SIGNAL_LABELS[key]}
                    </button>
                  );
                })}

                <span
                  className={`ml-2 inline-flex items-center gap-2 rounded-md border px-2 py-0.5 text-xs ${
                    wsState === "open"
                      ? "border-green-400/30 bg-green-500/10 text-green-300"
                      : wsState === "reconnecting" || wsState === "connecting"
                      ? "border-green-700 bg-green-500/10 text-green-300"
                      : "border-red-400/30 bg-red-500/10 text-red-300"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-current" />
                  {wsState}
                </span>

                <Btn variant="ghost" onClick={() => setLogs([])}>
                  Clear
                </Btn>
              </div>
            </div>
          </div>

          <div className="h-72 overflow-auto rounded-xl border border-edge/50 bg-[#0b0d13] p-3 font-mono text-sm text-white/90">
            {logs.length === 0 ? "Waiting for logs..." : logs.join("\n")}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
