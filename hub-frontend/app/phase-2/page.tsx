export default function Phase2Page() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100dvh",
        minHeight: "100vh",
        zIndex: 50,
        background: "#000",
      }}
    >
      <iframe
        src="/Part2-python-scanner-bots.html"
        title="Phase 2 - Python Scanner Bots"
        style={{ border: "0", width: "100%", height: "100%" }}
        allow="fullscreen"
      />
    </div>
  );
}
