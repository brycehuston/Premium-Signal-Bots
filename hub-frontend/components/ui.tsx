// components/ui.tsx
import Link from "next/link";
import type { ReactNode } from "react";

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
      className={[
        "rounded-2xl border bg-card/85 backdrop-blur",
        "border-edge shadow-glow",
        "bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]",
        "transition-all duration-200 hover:-translate-y-[1.5px] hover:shadow-[0_0_0_1px_rgba(110,231,255,.18),0_20px_60px_rgba(2,6,23,.35)]",
        className,
      ].join(" ")}
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
  return <div className={`p-6 sm:p-7 ${className}`}>{children}</div>;
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="text-lg font-semibold tracking-tight">{children}</h2>;
}

/* ------------------------------ Button -------------------------------- */
type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
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
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  full,
}: ButtonProps) {
  // base + sizing kept clean; variants should NOT re-define height/padding
  const base =
    "inline-flex items-center justify-center rounded-lg whitespace-nowrap select-none antialiased " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/70 focus-visible:ring-offset-0";
  const sizes =
    size === "lg"
      ? "h-12 px-6 text-[15px] leading-[1.15]"
      : "h-11 px-5 text-[15px] leading-[1.15]";

  let styles = "";
  if (variant === "primary") {
    styles =
      "font-semibold text-white " +
      "bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#60A5FA] " +
      "border border-[#3B82F6]/60 " +
      "shadow-[0_4px_15px_rgba(59,130,246,.55),inset_0_1px_2px_rgba(255,255,255,.25)] " +
      "hover:shadow-[0_6px_25px_rgba(59,130,246,.8),inset_0_1px_4px_rgba(255,255,255,.35)] " +
      "transition-all duration-200 ease-out hover:scale-[1.05]";
  } else if (variant === "gold") {
    styles =
      "font-bold text-black uppercase tracking-[0.02em] " +
      "bg-gradient-to-r from-[#FFD966] via-[#F6C453] to-[#FFB800] " +
      "border border-[#FFE27A] " +
      "shadow-[0_6px_25px_rgba(246,196,83,.55),inset_0_1px_2px_rgba(255,255,255,.25)] " +
      "hover:shadow-[0_8px_40px_rgba(246,196,83,.9),inset_0_1px_4px_rgba(255,255,255,.35)] " +
      "transition-all duration-200 ease-out hover:scale-[1.08]";
  } else if (variant === "outline") {
    styles =
      "font-semibold text-white border border-white/15 " +
      "hover:bg-white hover:text-black transition-colors";
  } else {
    styles =
      "font-semibold text-white bg-white/[0.06] " +
      "hover:bg-white hover:text-black transition-colors";
  }

  const width = full ? "w-full" : "";
  const classes = [base, sizes, styles, width, "disabled:opacity-60", className]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <Link href={href} className={classes} aria-disabled={disabled} data-no-link-style>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} onClick={onClick} disabled={disabled}>
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
        <div className="mb-5">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="mt-1 text-white/60">{subtitle}</p>}
        </div>
        {children}
      </CardBody>
    </Card>
  );
}
