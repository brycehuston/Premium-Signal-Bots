export default function Phase1Page() {
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
        src="/Part1-source-node.html"
        title="Phase 1 - Source Node"
        style={{ border: "0", width: "100%", height: "100%" }}
        allow="fullscreen"
      />
    </div>
  );
}
