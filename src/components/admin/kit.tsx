import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="font-display text-3xl font-normal tracking-tight md:text-4xl">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
  padded = true,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={cn("surface", className)}>
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-medium tracking-wide">{title}</h2>
          {action}
        </header>
      ) : null}
      <div className={padded ? "p-5" : undefined}>{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  delta,
  hint,
}: {
  label: string;
  value: string;
  delta?: string;
  hint?: string;
}) {
  const negative = delta?.startsWith("-");
  return (
    <div className="surface group relative p-5 transition-colors hover:border-gold">
      <span className="absolute inset-x-0 top-0 h-px rule-gold opacity-0 transition-opacity group-hover:opacity-100" />
      <p className="eyebrow">{label}</p>
      <p className="mt-3 font-display text-3xl leading-none">{value}</p>
      <div className="mt-3 flex items-center gap-2 text-xs">
        {delta ? (
          <span className={negative ? "text-destructive" : "text-success"}>{delta}</span>
        ) : null}
        {hint ? <span className="text-muted-foreground">{hint}</span> : null}
      </div>
    </div>
  );
}

const toneMap: Record<string, string> = {
  neutral: "border-border bg-muted text-muted-foreground",
  ink: "border-ink/20 bg-ink/5 text-foreground",
  gold: "border-gold/40 bg-gold-soft/40 text-blush-foreground",
  blush: "border-accent bg-accent/50 text-accent-foreground",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/40 bg-warning/10 text-warning",
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof toneMap;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        toneMap[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function statusTone(status: string): keyof typeof toneMap {
  switch (status) {
    case "Paid":
    case "Delivered":
    case "Published":
    case "Active":
    case "Subscribed":
    case "In stock":
    case "Approved":
      return "success";
    case "Pending":
    case "Low stock":
    case "Processing":
    case "Invited":
    case "Draft":
      return "warning";
    case "Failed":
    case "Cancelled":
    case "Out of stock":
    case "Rejected":
    case "Unsubscribed":
      return "danger";
    case "Refunded":
    case "Partially refunded":
    case "Archived":
      return "neutral";
    default:
      return "ink";
  }
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 border border-dashed border-border px-6 py-16 text-center">
      <h3 className="font-display text-xl">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-xs font-medium tracking-wide text-foreground">{label}</span>
      {children}
      {hint ? <span className="block text-[11px] text-muted-foreground">{hint}</span> : null}
    </label>
  );
}
