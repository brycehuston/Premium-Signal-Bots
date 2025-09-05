"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import BtcMiniChart from "@/components/BtcMiniChart";

/* ---------- Types ---------- */
type Me = {
  email: string;
  plan?: string;
  is_active?: boolean;
};

type BotStatus = {
  bot: string;
  status: string; // e.g. "running", "stopped", etc.
};

/* ---------- UI helpers ---------- */
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

/* ---------- Utils ---------- */
function logsWsUrl(bot: string) {
  const base = new URL(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");
  base.protocol = base.protocol === "https:" ? "wss:" : "ws:";
  base.pathname = "/ws/logs";
  base.search = `?bot=${encodeURIComponent(bot)}`;
  return base.toString();
}

export default function Dashboard() {
  const [me, setMe] = useState<Me | null>(null);
  const [status, setStatus] = useState<BotStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeBot, setActiveBot] = useState<string>("trend_rider");
  const [logs, setLogs] = useState<string[]>([]);
  const [wsState, setWsState] = useState<"idle" | "connecting" | "open" | "closed" | "reconnecting">("idle");
  const [busy, setBusy] = useState<"start" | "stop" | null>(null); // to disable buttons during requests

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef({ tries: 0, timer: 0 });

  async function refresh() {
    try {
      const _me = await api("/me");
      setMe(_me as Me);
      const s = await api("/bot/status");
      setStatus((s.bots || []) as BotStatus[]);
    } finally {
      setLoading(false);
    }
  }

  // WebSocket connect with backoff
  function connectLogs(bot: string) {
    // cleanup any existing
    try {
      wsRef.current?.close();
    } catch {}
    wsRef.current = null;
    setLogs([]);
    setWsState("connecting");

    const sock = new WebSocket(logsWsUrl(bot));
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
      reconnectRef.current.timer = window.setTimeout(() => connectLogs(bot), delay);
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

  async function start(bot: string) {
    try {
      setBusy("start");
      await api("/bot/start", { method: "POST", body: JSON.stringify({ bot_name: bot }) });
      await refresh();
    } finally {
      setBusy(null);
    }
  }
  async function stop(bot: string) {
    try {
      setBusy("stop");
      await api("/bot/stop", { method: "POST", body: JSON.stringify({ bot_name: bot }) });
      await refresh();
    } finally {
      setBusy(null);
    }
  }
  async function portal() {
    const res = await api("/billing/create-portal-session", { method: "POST", body: JSON.stringify({}) });
    if (res?.url) window.location.href = res.url;
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
    connectLogs(activeBot);
    return () => {
      try {
        wsRef.current?.close();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBot]);

  if (loading) return <div className="text-white/70">Loading…</div>;
  if (!me) return <div className="text-red-400">Not authorized</div>;

  const isActive = !!me.is_active;

  return (
    <div className="space-y-6">
      {/* Top row: account + live BTC mini chart */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Account card */}
        <Card className="lg:col-span-1">
          <CardBody className="flex items-center justify-between">
            <div>
              <div className="text-xl font-semibold">{me.email}</div>
              <div className="mt-1 text-sm text-white/60">
                Plan:{" "}
                <span className="inline-flex items-center rounded-md border border-edge/70 bg-white/5 px-2 py-0.5 text-white/80">
                  {me.plan ?? "free"}
                </span>{" "}
                • Active:{" "}
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 ${
                    isActive
                      ? "bg-green-500/15 text-green-300 border border-green-400/30"
                      : "bg-red-500/15 text-red-300 border border-red-400/30"
                  }`}
                >
                  {isActive ? "yes" : "no"}
                </span>
              </div>
            </div>
            <Btn onClick={portal}>Manage Billing</Btn>
          </CardBody>
        </Card>

        {/* Live BTC chart */}
        <Card className="lg:col-span-2">
          <CardBody>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">Live BTC (1m)</div>
                <div className="text-sm text-white/60">Binance feed · updates in real-time</div>
              </div>
            </div>
            <BtcMiniChart height={300} />
          </CardBody>
        </Card>
      </div>

      {/* Bot controls */}
      <div className="grid gap-6 md:grid-cols-3">
        {["trend_rider", "scalper", "reversal"].map((b) => {
          const bs = status.find((x) => x.bot === b) || ({} as BotStatus);
          const running = (bs.status || "").toLowerCase().includes("running");
          return (
            <Card key={b}>
              <CardBody className="space-y-4">
                <div className="text-lg font-semibold capitalize">{b.replace("_", " ")}</div>
                <div className="text-white/60">
                  Status: <span className={`${running ? "text-green-400" : "text-white/70"}`}>{bs.status || "unknown"}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Btn onClick={() => start(b)} disabled={!isActive || busy !== null}>
                    {busy === "start" ? "Starting…" : "Start"}
                  </Btn>
                  <Btn onClick={() => stop(b)} disabled={!isActive || busy !== null} variant="ghost">
                    {busy === "stop" ? "Stopping…" : "Stop"}
                  </Btn>
                  <Btn onClick={() => setActiveBot(b)} variant="ghost">
                    Logs
                  </Btn>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Live logs */}
      <Card>
        <CardBody>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-lg font-semibold">
              Live logs: <span className="capitalize">{activeBot.replace("_", " ")}</span>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-2 rounded-md border px-2 py-0.5 text-xs ${
                  wsState === "open"
                    ? "border-green-400/30 bg-green-500/10 text-green-300"
                    : wsState === "reconnecting" || wsState === "connecting"
                    ? "border-yellow-400/30 bg-yellow-500/10 text-yellow-300"
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
          <div className="h-72 overflow-auto rounded-xl border border-edge/50 bg-[#0b0d13] p-3 font-mono text-sm text-white/90">
            {logs.length === 0 ? "Waiting for logs..." : logs.join("\n")}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
