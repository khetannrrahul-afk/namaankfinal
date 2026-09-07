// Seeded variation engine: guarantees that two people with the same
// Driver/Conductor still get a different — and internally non-repeating — report.

const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export class Picker {
  private rand: () => number;
  private used = new Set<string>();

  constructor(seed: number) {
    this.rand = mulberry32(seed || 1);
  }

  /** Fisher-Yates shuffle driven by the report seed. */
  shuffle<T>(arr: T[]): T[] {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.rand() * (i + 1));
      const tmp = out[i]!;
      out[i] = out[j]!;
      out[j] = tmp;
    }
    return out;
  }

  /** True the first time a line is seen — used to kill duplicates report-wide. */
  fresh(line: string): boolean {
    const key = line.trim().toLowerCase();
    if (!key || this.used.has(key)) return false;
    this.used.add(key);
    return true;
  }

  /** Add already-composed lines, dropping anything seen earlier in the report. */
  take(lines: string[]): string[] {
    return lines.filter((l) => l && this.fresh(l));
  }

  /** Pick up to `count` unused lines from a bank, in a seed-specific order. */
  pick(bank: string[], count: number, render: (s: string) => string): string[] {
    const out: string[] = [];
    for (const raw of this.shuffle(bank)) {
      if (out.length >= count) break;
      const line = render(raw);
      if (this.fresh(line)) out.push(line);
    }
    return out;
  }
}
