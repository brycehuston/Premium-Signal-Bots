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
        "rounded-2xl border border-stroke/70 bg-surface/90 backdrop-blur",
        "shadow-[var(--shadow-soft)]",
        "transition-transform duration-200 hover:-translate-y-0.5",
        "hover:shadow-[var(--shadow-hover)]",
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
  return <div className={cn("p-6 sm:p-7", className)}>{children}</div>;
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="text-lg font-semibold tracking-tight text-silver">{children}</h2>;
}

export function SectionHeading({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-5", className)}>
      <h2 className="text-xl font-semibold tracking-tight text-silver">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
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
        "inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em]",
        "backdrop-blur",
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
  size?: "md" | "lg";
  className?: string;
  disabled?: boolean;
  full?: boolean;
};

export function Button({
  children,
  onClick,
  href,
  type,
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  full,
}: ButtonProps) {
  const base =
    "relative inline-flex items-center justify-center rounded-xl whitespace-nowrap select-none antialiased overflow-hidden " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-0 " +
    "transition-all duration-200";

  const sizes =
    size === "lg"
      ? "h-12 px-6 text-[15px] leading-[1.15]"
      : "h-11 px-5 text-[15px] leading-[1.15]";

  const styles =
    variant === "primary" || variant === "gold"
      ? "font-bold tracking-[0.02em] text-black bg-metal-gold border border-gold/70 " +
        "shadow-[0_10px_30px_rgb(var(--gold)/0.35)] " +
        "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/60 before:opacity-70 " +
        "after:absolute after:inset-0 after:bg-[radial-gradient(80%_120%_at_50%_-40%,rgba(255,255,255,0.35),transparent_60%)] after:opacity-0 " +
        "hover:after:opacity-100 after:transition-opacity after:duration-200 " +
        "hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgb(var(--gold)/0.45)]"
      : variant === "outline"
      ? "font-semibold tracking-[0.02em] text-silver border border-silver/40 bg-surface/30 " +
        "hover:bg-surface2/70 hover:border-silver/60"
      : "font-semibold text-silver/80 bg-surface/30 border border-stroke/60 " +
        "hover:text-silver hover:bg-surface2/60";

  const width = full ? "w-full" : "";
  const classes = cn(base, sizes, styles, width, "disabled:opacity-60", className);

  if (href) {
    return (
      <Link href={href} className={classes} aria-disabled={disabled} data-no-link-style>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} onClick={onClick} disabled={disabled} type={type}>
      {children}
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
