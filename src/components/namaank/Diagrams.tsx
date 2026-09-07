import { LOSHU_LAYOUT, PLANE_CELLS } from "@/lib/numerology";
import type { PlaneKey } from "@/lib/langs/types";

export function LoShuGrid({
  grid,
  size = "md",
  lottery = [],
}: {
  grid: Record<number, number>;
  size?: "sm" | "md";
  lottery?: number[];
}) {
  return (
    <div data-nk="g3" className={`mx-auto grid w-full ${size === "sm" ? "max-w-[200px]" : "max-w-[260px]"} grid-cols-3 gap-2`}>
      {LOSHU_LAYOUT.map((n) => {
        const c = grid[n] ?? 0;
        const isLottery = lottery.includes(n);
        return (
          <div
            key={n}
            data-nk="cell"
            data-on={c ? "1" : "0"}
            className={`flex aspect-square flex-col items-center justify-center rounded-xl border text-center ${
              c ? "border-primary/60 bg-primary/15" : "border-border bg-[var(--input)]/60"
            }`}
          >
            <span
              {...(isLottery ? { "data-nk": "lot" } : {})}
              className={
                isLottery
                  ? "flex h-8 min-w-8 items-center justify-center rounded-full border-2 border-accent px-1.5 text-lg font-semibold text-accent"
                  : "text-lg font-semibold"
              }
            >

              {c ? String(n).repeat(c) : "—"}
            </span>
            <span className="text-[10px] text-muted-foreground">{n}</span>
          </div>
        );
      })}
    </div>
  );
}

export function SampleLoShu() {
  return (
    <div data-nk="g3" className="mx-auto grid w-full max-w-[220px] grid-cols-3 gap-2">
      {LOSHU_LAYOUT.map((n) => (
        <div
          key={n}
          data-nk="cell"
          className="flex aspect-square items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-lg font-semibold text-primary"
        >
          {n}
        </div>
      ))}
    </div>
  );
}

export function PlanesDiagram({
  grid,
  labels,
  activeText = "ACTIVE",
  inactiveText = "—",
}: {
  grid?: Record<number, number>;
  labels: Record<PlaneKey, { label: string; meaning: string }>;
  activeText?: string;
  inactiveText?: string;
}) {
  return (
    <div data-nk="planes" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {PLANE_CELLS.map((p) => {
        const active = grid ? p.cells.every((c) => (grid[c] ?? 0) > 0) : false;
        return (
          <div key={p.key} className="rounded-xl border border-border bg-[var(--input)]/40 p-2">
            <div data-nk="g3" className="grid grid-cols-3 gap-1">
              {LOSHU_LAYOUT.map((n) => {
                const inLine = p.cells.includes(n);
                return (
                  <div
                    key={n}
                    data-nk="cell"
                    data-on={inLine ? "1" : "0"}
                    className={`flex aspect-square items-center justify-center rounded-md border text-[11px] ${
                      inLine
                        ? "border-primary bg-primary/25 font-semibold text-primary"
                        : "border-border/60 bg-transparent text-muted-foreground/60"
                    }`}
                  >
                    {n}
                  </div>
                );
              })}
            </div>
            <p className="mt-1.5 text-[10px] leading-tight text-foreground/80">{labels[p.key].label}</p>
            {grid && (
              <p className={`text-[10px] ${active ? "text-primary" : "text-muted-foreground"}`}>
                {active ? activeText : inactiveText}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
