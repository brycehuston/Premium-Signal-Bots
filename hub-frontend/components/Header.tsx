"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSupabase } from "@/components/SupabaseProvider";
import { Button } from "@/components/ui";

const LINKS = [
  { href: "/pricing", label: "Pricing" },
  { href: "/apps", label: "Apps" },
  { href: "/support", label: "Support" },
] as const;

export default function Header({ brand: _brand }: { brand: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { session, loading } = useSupabase();
  const signedIn = !loading && Boolean(session);
  useEffect(() => setMenuOpen(false), [pathname]);
  const telegramUrl = process.env.NEXT_PUBLIC_TELEGRAM_URL || "https://t.me/alphaalerts";
  const xUrl = process.env.NEXT_PUBLIC_X_URL || "https://x.com/alphaalerts";

  const navLink = "rounded-md px-3 py-2 text-small text-muted transition-colors hover:bg-surface2/60 hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";
  return (
    <header className="sticky top-0 z-30 border-b border-stroke/60 bg-bg/90 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[70px] items-center justify-between gap-4">
          <Link href="/" aria-label="Alpha Alerts homepage" className="flex min-w-0 items-center gap-3 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold" onClick={() => setMenuOpen(false)} data-no-link-style>
            <Image src="/alpha-lane-v4-logo.png" alt="" width={38} height={40} className="h-[39px] w-[38px] shrink-0 object-contain" unoptimized priority />
            <span className="font-display whitespace-nowrap text-[15px] font-bold tracking-[0.15em] text-metal-silver sm:text-[17px]">
              ALPHA <span className="text-gold">ALERTS</span>
            </span>
          </Link>
          <nav aria-label="Primary navigation" className="flex items-center gap-1">
            {LINKS.map(({href,label})=>(
              <Link key={href} href={href} data-no-link-style aria-current={pathname===href||pathname.startsWith(href+"/")?"page":undefined}
                className={navLink+" hidden lg:inline-flex"}>
                {label}
              </Link>
            ))}
            <Link href="/dashboard" className={navLink+" hidden lg:inline-flex"} data-no-link-style
              aria-current={pathname.startsWith("/dashboard")?"page":undefined}>Dashboard</Link>
            {!signedIn && <Link href="/login" className={navLink+" hidden lg:inline-flex"} data-no-link-style>Login</Link>}
            <Button href="/pricing#plans" size="sm"
              className="hidden h-9 px-4 text-small font-extrabold tracking-[0.06em] !text-black !rounded-[6px] !bg-[linear-gradient(135deg,rgb(var(--gold3)_/_0.95),rgb(var(--gold)_/_0.85))] !border-[rgb(var(--gold3)_/_0.9)] !shadow-[0_6px_16px_rgb(var(--gold3)/0.25)] hover:!shadow-[0_8px_20px_rgb(var(--gold3)/0.35)] !before:opacity-0 !after:opacity-0 sm:inline-flex">
              GO ALPHA
            </Button>
            <button type="button" className="ml-1 inline-flex items-center rounded-md border border-stroke/70 px-3 py-2 text-small text-muted hover:border-gold/50 hover:text-text lg:hidden"
              aria-expanded={menuOpen} aria-controls="alpha-mobile-nav" aria-label={menuOpen?"Close navigation menu":"Open navigation menu"}
              onClick={()=>setMenuOpen(v=>!v)}>{menuOpen?"CLOSE":"MENU"}</button>
          </nav>
        </div>
      </div>
      <nav id="alpha-mobile-nav" aria-label="Mobile navigation" hidden={!menuOpen}
        className="border-t border-stroke/60 bg-bg/95 lg:hidden">
        <div className="mx-auto grid max-w-6xl gap-1 px-4 py-3 sm:px-6">
          {LINKS.map(({href,label})=><Link key={href} href={href} data-no-link-style
            className={navLink} aria-current={pathname===href||pathname.startsWith(href+"/")?"page":undefined}
            onClick={()=>setMenuOpen(false)}>{label}</Link>)}
          <Link href="/dashboard" className={navLink} data-no-link-style onClick={()=>setMenuOpen(false)}>Dashboard</Link>
          {!signedIn&&<Link href="/login" className={navLink} data-no-link-style onClick={()=>setMenuOpen(false)}>Login</Link>}
          <Link href="/pricing#plans" className={navLink+" font-bold !text-gold"} data-no-link-style onClick={()=>setMenuOpen(false)}>GO ALPHA</Link>
          <div className="mt-2 flex flex-wrap items-center gap-4 border-t border-stroke/60 pt-3 text-small">
            <a href={telegramUrl} data-no-link-style target="_blank" rel="noopener noreferrer" className="rounded-md px-3 py-2 text-muted transition-colors hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold">Telegram</a>
            <a href={xUrl} data-no-link-style target="_blank" rel="noopener noreferrer" className="rounded-md px-3 py-2 text-muted transition-colors hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold">X / Twitter</a>
          </div>
        </div>
      </nav>
    </header>
  );
}
