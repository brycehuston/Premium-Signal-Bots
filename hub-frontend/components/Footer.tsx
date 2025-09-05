import Container from "@/components/Container";

export default function Footer() {
  return (
    <div className="mt-14 border-t border-edge/70">
      <Container>
        <div className="py-8 text-sm text-white/50 flex flex-wrap items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Huston Solutions</p>
          <div className="flex gap-4">
            <a className="hover:text-white" href="/billing">Pricing</a>
            <a className="hover:text-white" href="/login">Login</a>
          </div>
        </div>
      </Container>
    </div>
  );
}
