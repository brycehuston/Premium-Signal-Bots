// components/ui.tsx
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* --------------------------- Card primitives --------------------------- */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-card border border-stroke/70 bg-surface/90 backdrop-blur",
        "shadow-soft transition-transform duration-200",
        "hover:-translate-y-0.5 hover:shadow-glow",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("p-6 md:p-7", className)}>{children}</div>;
}

export function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display text-h3 font-semibold tracking-tight text-silver">{children}</h2>
  );
}

export function SectionHeading({
  title,
  subtitle,
  eyebrow,
  className,
  align = "left",
}: {
  title: ReactNode;
  subtitle?: string;
  eyebrow?: string;
  className?: string;
  align?: "left" | "center";
}) {
  const alignClass = align === "center" ? "text-center" : "text-left";
  return (
    <div className={cn("space-y-3", alignClass, className)}>
      {eyebrow ? (
        <div className="text-eyebrow uppercase tracking-[0.35em] text-muted/70">{eyebrow}</div>
      ) : null}
      <h2 className="font-display text-h2 font-semibold tracking-tight text-silver">{title}</h2>
      {subtitle ? <p className="text-body text-muted">{subtitle}</p> : null}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "live" | "next" | "build" | "planned";
  className?: string;
}) {
  const toneClass =
    tone === "live"
      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
      : tone === "next"
      ? "border-gold/50 bg-gold/10 text-gold"
      : tone === "build"
      ? "border-sky-400/40 bg-sky-400/10 text-sky-200"
      : tone === "planned"
      ? "border-stroke/70 bg-surface2/60 text-muted"
      : "border-stroke/70 bg-surface2/60 text-muted";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em]",
        "backdrop-blur",
        toneClass,
        className
      )}
    >
      {children}
    </span>
  );
}

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "accent";
  className?: string;
}) {
  const toneClass =
    tone === "accent"
      ? "border-gold/40 bg-gold/10 text-gold"
      : "border-stroke/70 bg-surface/70 text-muted";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill border px-3 py-1.5 text-xs",
        toneClass,
        className
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------ Button -------------------------------- */
type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "ghost" | "outline" | "gold";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  full?: boolean;
};

export function Button({
  children,
  onClick,
  href,
  type = "button", // ✅ default prevents accidental form submits
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  full,
}: ButtonProps) {
  const base =
    "group relative inline-flex items-center justify-center rounded-control whitespace-nowrap select-none antialiased overflow-hidden " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-0 " +
    "transition-all duration-200";

  const sizes =
    size === "lg"
      ? "h-12 px-6 text-[15px] leading-[1.15]"
      : size === "md"
      ? "h-11 px-5 text-[15px] leading-[1.15]"
      : "h-10 px-4 text-[14px] leading-[1.1]";

  /**
   * ✅ Premium gold button:
   * - Uses bg-metal-gold (now real from tailwind.config.js)
   * - Has a slow shine sweep on hover
   */
  const styles =
    variant === "primary" || variant === "gold"
      ? cn(
          "font-bold tracking-[0.02em] text-black",
          "bg-metal-gold border border-gold/70",
          "shadow-[0_10px_30px_rgb(var(--gold)/0.35)]",
          "hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgb(var(--gold)/0.45)]",
          "active:translate-y-0 active:shadow-[0_10px_24px_rgb(var(--gold)/0.32)]",
          // top highlight line
          "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/60 before:opacity-70",
          // subtle radial punch (nice on hover)
          "after:absolute after:inset-0 after:bg-[radial-gradient(80%_120%_at_50%_-40%,rgba(255,255,255,0.35),transparent_60%)] after:opacity-0 after:transition-opacity after:duration-200",
          "hover:after:opacity-100"
        )
      : variant === "outline"
      ? "font-bold tracking-[0.02em] text-silver border border-stroke/70 bg-surface/30 hover:bg-surface2/70 hover:border-silver/50"
      : "font-bold text-silver/80 bg-surface/30 border border-stroke/60 hover:text-silver hover:bg-surface2/60";

  const width = full ? "w-full" : "";

  // ✅ Make disabled links ACTUALLY disabled
  const disabledClass = disabled
    ? "opacity-60 pointer-events-none cursor-not-allowed"
    : "";

  const classes = cn(base, sizes, styles, width, disabledClass, className);

  const Shine = (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0",
        // slow sweep highlight that only plays on hover
        "opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      )}
    >
      <span
        className={cn(
          "absolute -inset-y-8 left-[-60%] w-[55%]",
          "bg-gradient-to-r from-transparent via-white/35 to-transparent",
          "group-hover:animate-shine-sweep"
        )}
      />
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        aria-disabled={disabled}
        data-no-link-style
        onClick={onClick}
      >
        {Shine}
        <span className="relative z-[1]">{children}</span>
      </Link>
    );
  }

  return (
    <button className={classes} onClick={onClick} disabled={disabled} type={type}>
      {Shine}
      <span className="relative z-[1]">{children}</span>
    </button>
  );
}

/* ----------------------------- Section -------------------------------- */
export function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardBody>
        <SectionHeading title={title} subtitle={subtitle} />
        {children}
      </CardBody>
    </Card>
  );
}
