"use client";
import Container from "@/components/Container";
import { Button } from "@/components/ui";

export default function Navbar() {
  return (
    <div className="sticky top-0 z-30 border-b border-edge/70 bg-bg/70 backdrop-blur">
      <Container>
        <div className="flex h-14 items-center justify-between">
          <a href="/" className="font-semibold tracking-tight">AlphaAlerts</a>
          <nav className="flex items-center gap-2">
            <a className="text-sm text-white/80 hover:text-white" href="/dashboard">Dashboard</a>
            <a className="text-sm text-white/80 hover:text-white" href="/billing">Billing</a>
            <Button href="/login" variant="ghost">Login</Button>
          </nav>
        </div>
      </Container>
    </div>
  );
}
