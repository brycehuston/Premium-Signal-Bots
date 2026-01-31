"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";

type HeaderProps = {
  brand: string;
};

export default function Header({ brand }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-30 border-b border-stroke/60 bg-bg/80 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="text-lg sm:text-xl font-semibold tracking-tight">
            <span className="text-metal-silver">{brand}</span>
            <span className="ml-1 text-muted">Pro</span>
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              className="rounded-pill px-3 py-1.5 text-small text-muted hover:bg-surface2/60 hover:text-text"
              href="/pricing"
              data-no-link-style
            >
              Pricing
            </Link>

            <button
              type="button"
              className="inline-flex items-center rounded-pill border border-stroke/60 px-3 py-1.5 text-small text-muted hover:text-text hover:border-gold/40 md:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              {menuOpen ? "Close" : "Menu"}
            </button>

            <Link
              className="rounded-pill px-3 py-1.5 text-small text-muted hover:bg-surface2/60 hover:text-text hidden md:inline-flex"
              href="/dashboard"
              data-no-link-style
            >
              Dashboard
            </Link>
            <Link
              className="rounded-pill px-3 py-1.5 text-small text-muted hover:bg-surface2/60 hover:text-text hidden sm:inline-flex"
              href="/login"
              data-no-link-style
            >
              Login
            </Link>
            <Button
              href="/pricing#plans"
              size="sm"
              className="hidden h-9 px-4 text-small sm:inline-flex font-extrabold tracking-[0.06em] !text-black !rounded-[6px] !bg-[linear-gradient(135deg,rgb(var(--gold3)_/_0.95),rgb(var(--gold)_/_0.85))] !border-[rgb(var(--gold3)_/_0.9)] !shadow-[0_6px_16px_rgb(var(--gold3)/0.4)] hover:!shadow-[0_10px_24px_rgb(var(--gold3)/0.5)] !before:opacity-0 !after:opacity-0"
            >
              GO ALPHA
            </Button>
          </nav>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={[
          "md:hidden border-t border-stroke/60 bg-bg/95 backdrop-blur",
          menuOpen ? "block" : "hidden",
        ].join(" ")}
      >
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col gap-2">
            <Link
              className="rounded-pill px-3 py-2 text-small text-muted hover:bg-surface2/60 hover:text-text"
              href="/dashboard"
              data-no-link-style
              onClick={closeMenu}
            >
              Dashboard
            </Link>
            <Link
              className="rounded-pill px-3 py-2 text-small text-muted hover:bg-surface2/60 hover:text-text"
              href="/login"
              data-no-link-style
              onClick={closeMenu}
            >
              Login
            </Link>
            <Button
              href="/pricing#plans"
              size="sm"
              className="h-10 w-full justify-center font-extrabold tracking-[0.06em] !text-black !rounded-[6px] !bg-[linear-gradient(135deg,rgb(var(--gold3)_/_0.95),rgb(var(--gold)_/_0.85))] !border-[rgb(var(--gold3)_/_0.9)] !shadow-[0_6px_16px_rgb(var(--gold3)/0.4)] hover:!shadow-[0_10px_24px_rgb(var(--gold3)/0.5)] !before:opacity-0 !after:opacity-0"
              onClick={closeMenu}
            >
              GO ALPHA
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
