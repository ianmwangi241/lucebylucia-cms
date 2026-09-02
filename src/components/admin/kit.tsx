import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// ---- PageHeader ----

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="text-[11px] tracking-[0.2em] text-gold uppercase">{eyebrow}</p>
        )}
        <h1 className="mt-1 text-2xl font-medium text-foreground">{title}</h1>
        {description && (
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// ---- Pill ----

export type PillTone = "success" | "warning" | "danger" | "neutral" | "info" | "gold";

const toneClasses: Record<PillTone, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  neutral: "bg-muted text-muted-foreground border-border",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  gold: "bg-gold-soft/30 text-gold border-gold/40",
};

interface PillProps {
  tone: PillTone;
  children: ReactNode;
}

export function Pill({ tone, children }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium",
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}

export function statusTone(status: string): PillTone {
  switch (status) {
    case "Published":
      return "success";
    case "Draft":
      return "neutral";
    case "Archived":
      return "danger";
    default:
      return "neutral";
  }
}

// ---- Field ----

interface FieldProps {
  label: string;
  children: ReactNode;
  full?: boolean;
}

export function Field({ label, children, full }: FieldProps) {
  return (
    <label className={cn("block space-y-1.5", full && "sm:col-span-2")}>
      <span className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">{label}</span>
      {children}
    </label>
  );
}

// ---- Panel ----

interface PanelProps {
  title?: string;
  action?: ReactNode;
  padded?: boolean;
  children: ReactNode;
}

export function Panel({ title, action, padded = true, children }: PanelProps) {
  return (
    <div className="surface overflow-hidden">
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          {title && <h3 className="text-sm font-medium">{title}</h3>}
          {action}
        </div>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </div>
  );
}

// ---- EmptyState ----

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}
