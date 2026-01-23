export default function Phase3Page() {
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
        src="/Part3-magnetic-router-forwarder.html"
        title="Phase 3 - Magnetic Router Forwarder"
        style={{ border: "0", width: "100%", height: "100%" }}
        allow="fullscreen"
      />
    </div>
  );
}
