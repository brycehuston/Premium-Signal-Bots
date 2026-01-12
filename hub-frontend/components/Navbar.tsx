"use client";
import Container from "@/components/Container";
import { Button } from "@/components/ui";

export default function Navbar() {
  return (
    <div className="sticky top-0 z-30 border-b border-stroke/60 bg-bg/80 backdrop-blur">
      <Container>
        <div className="flex h-14 items-center justify-between">
          <a href="/" className="font-semibold tracking-tight text-metal-silver">AlphaAlerts</a>
          <nav className="flex items-center gap-2">
            <a className="text-sm text-muted hover:text-text" href="/dashboard">Dashboard</a>
            <a className="text-sm text-muted hover:text-text" href="/billing">Billing</a>
            <Button href="/login" variant="ghost">Login</Button>
          </nav>
        </div>
      </Container>
    </div>
  );
}
