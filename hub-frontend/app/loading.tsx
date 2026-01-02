// app/loading.tsx
export default function AppLoading() {
  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-[rgba(6,9,16,0.85)] backdrop-blur">
      <div className="relative h-32 w-32">
        {/* core orb */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-600/80 to-white/70 blur-2xl opacity-30 animate-pulse" />
        {/* rings */}
        <div className="absolute inset-0 rounded-full border border-white/10" />
        <div className="absolute inset-3 rounded-full border border-white/10" />
        <div className="absolute inset-6 rounded-full border border-white/10" />

        {/* orbiting dots */}
        <span className="dot" style={{ ['--d' as any]: '0s' }} />
        <span className="dot" style={{ ['--d' as any]: '.2s' }} />
        <span className="dot" style={{ ['--d' as any]: '.4s' }} />

        <style>{`
          .dot {
            position: absolute;
            top: 50%; left: 50%;
            width: 10px; height: 10px;
            background: white;
            border-radius: 999px;
            box-shadow: 0 0 20px rgba(255,255,255,.6);
            transform-origin: -40px 0; /* orbit radius */
            animation: orbit 1.2s var(--d) infinite linear;
          }
          @keyframes orbit {
            0%   { transform: rotate(0deg) translateX(40px) rotate(0deg);   opacity: .4; }
            50%  { transform: rotate(180deg) translateX(40px) rotate(-180deg); opacity: 1; }
            100% { transform: rotate(360deg) translateX(40px) rotate(-360deg); opacity: .4; }
          }
        `}</style>
      </div>

      <div className="mt-6 text-center">
        <div className="text-white/90 font-semibold tracking-tight text-lg">Initializing AlphaAlerts…</div>
        <div className="text-white/60 text-sm mt-1">waking services • syncing auth • preloading charts</div>
      </div>
    </div>
  );
}
