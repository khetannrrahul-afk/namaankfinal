import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

export const field =
  "w-full rounded-xl border border-border bg-[var(--input)] px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/40";

export const btnPrimary =
  "inline-flex items-center justify-center rounded-xl bg-[image:var(--grad-accent)] px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60";

export const btnGhost =
  "inline-flex items-center justify-center rounded-xl border border-border px-3 py-2 text-xs transition hover:border-primary/50 hover:text-primary";

export const btnAccent =
  "inline-flex items-center justify-center rounded-xl border border-primary/50 bg-primary/15 px-3 py-2 text-xs text-primary transition hover:bg-primary/25";

export function Panel({ title, sub, children, actions }: { title?: string | undefined; sub?: string | undefined; children: ReactNode; actions?: ReactNode | undefined }) {
  return (
    <section className="surface p-4 sm:p-5">
      {(title || actions) && (
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            {title && <h2 className="text-sm font-semibold text-primary">{title}</h2>}
            {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageHeader({ title, sub, right }: { title: string; sub?: string | undefined; right?: ReactNode | undefined }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <Link to="/" className="text-[10px] tracking-[0.3em] text-accent uppercase">
          NAMAANK
        </Link>
        <h1 className="text-2xl font-bold glow-text">{title}</h1>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Stat({ label, value, tone = "default" }: { label: string; value: ReactNode; tone?: "default" | "good" | "warn" }) {
  const color = tone === "good" ? "text-primary" : tone === "warn" ? "text-destructive" : "text-foreground";
  return (
    <div className="rounded-xl border border-border/60 p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${color}`}>{value}</p>
    </div>
  );
}

export function Loading() {
  return <main className="p-10 text-center text-sm text-muted-foreground">Loading…</main>;
}
