import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-[52ch] text-pretty text-[13px] text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const washes: Record<string, string> = {
  teal: "from-accent/25",
  amber: "from-primary/30",
  red: "from-destructive/30",
  sky: "from-info/30",
  olive: "from-olive/30",
};

export function StatCard({
  label,
  value,
  hint,
  tone = "teal",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: keyof typeof washes;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-card p-5 ring-1 ring-border">
      <div className={cn("skew-wash bg-gradient-to-r to-transparent", washes[tone])} />
      <div className="relative">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="ledger-num mt-2 font-display text-xl font-semibold sm:text-2xl">{value}</div>
        {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
      </div>
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("overflow-hidden rounded-xl bg-card ring-1 ring-border", className)}>
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-5">
          {title && <h2 className="font-display text-[13px] font-medium">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <p className="text-[13px] text-muted-foreground">{message}</p>
      {action}
    </div>
  );
}

export function LoadingRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-5">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full bg-secondary" />
      ))}
    </div>
  );
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <p className="text-[13px] text-destructive">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

const tones: Record<string, string> = {
  paid: "bg-success/15 text-success ring-success/25",
  active: "bg-success/15 text-success ring-success/25",
  completed: "bg-success/15 text-success ring-success/25",
  occupied: "bg-success/15 text-success ring-success/25",
  vacant: "bg-olive/20 text-foreground ring-olive/30",
  pending: "bg-secondary text-muted-foreground ring-border",
  submitted: "bg-info/15 text-info ring-info/25",
  accepted: "bg-info/15 text-info ring-info/25",
  in_progress: "bg-info/15 text-info ring-info/25",
  reserved: "bg-info/15 text-info ring-info/25",
  partially_paid: "bg-primary/15 text-primary ring-primary/25",
  expiring_soon: "bg-primary/15 text-primary ring-primary/25",
  maintenance: "bg-primary/15 text-primary ring-primary/25",
  medium: "bg-primary/15 text-primary ring-primary/25",
  high: "bg-destructive/15 text-destructive ring-destructive/25",
  urgent: "bg-destructive/15 text-destructive ring-destructive/25",
  overdue: "bg-destructive/15 text-destructive ring-destructive/25",
  expired: "bg-destructive/15 text-destructive ring-destructive/25",
  rejected: "bg-destructive/15 text-destructive ring-destructive/25",
  suspended: "bg-destructive/15 text-destructive ring-destructive/25",
  terminated: "bg-destructive/15 text-destructive ring-destructive/25",
  moved_out: "bg-secondary text-muted-foreground ring-border",
  low: "bg-secondary text-muted-foreground ring-border",
};

export function StatusPill({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  const tone = tones[value] ?? "bg-secondary text-muted-foreground ring-border";
  return (
    <span className={cn("inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] ring-1", tone)}>
      {value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
}

export function Field({
  label,
  children,
  hint,
  className,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-[12px] text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
