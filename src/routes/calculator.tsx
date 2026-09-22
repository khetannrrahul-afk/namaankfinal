import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CHALDEAN, digitSum, reduce1to9 } from "@/lib/numerology";
import { field, btnPrimary } from "@/components/panel/Ui";

export const Route = createFileRoute("/calculator")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Name Number Calculator (Chaldean) — NAMAANK" },
      {
        name: "description",
        content:
          "Free Chaldean name number calculator: apna poora naam aur mobile number daalkar naam ka total (compound + single) aur mobile number ka total dekhein.",
      },
      { property: "og:title", content: "Name Number Calculator (Chaldean) — NAMAANK" },
      {
        property: "og:description",
        content: "Chaldean numerology se naam ke letters ka breakdown aur mobile number ka total — turant result.",
      },
      { property: "og:url", content: "https://namaankfinal.lovable.app/calculator" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://namaankfinal.lovable.app/calculator" }],
  }),
  component: CalculatorPage,
});

function CalculatorPage() {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");

  const nameLetters = useMemo(() => {
    const clean = name.toUpperCase().replace(/[^A-Z]/g, "");
    return clean.split("").map((ch) => ({ ch, v: CHALDEAN[ch] ?? 0 }));
  }, [name]);

  const nameTotal = nameLetters.reduce((a, l) => a + l.v, 0);
  const mobileDigits = mobile.replace(/\D/g, "").slice(-10).split("").map(Number);
  const mobileTotal = digitSum(mobile);

  const hasName = nameLetters.length > 0;
  const hasMobile = mobileDigits.length > 0;

  return (
    <main className="min-h-screen">
      <header className="hero-grad relative border-b border-border px-4 py-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight glow-text sm:text-5xl">NAMAANK</h1>
        <p className="mt-2 text-sm tracking-[0.3em] text-accent uppercase">Har Ank ke Rahasye</p>
        <p className="mx-auto mt-3 max-w-md text-xs text-foreground/80">
          Chaldean Name Number Calculator — naam aur mobile number ka ank total
        </p>
        <Link to="/" className={`${btnPrimary} mt-4`}>
          Full Numerology Report
        </Link>
      </header>

      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <section className="surface space-y-4 p-4 sm:p-5">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground" htmlFor="calc-name">
              Full Name
            </label>
            <input
              id="calc-name"
              className={field}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Apna poora naam likhein"
              autoComplete="name"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground" htmlFor="calc-mobile">
              Mobile Number
            </label>
            <input
              id="calc-mobile"
              className={field}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/[^\d]/g, "").slice(0, 15))}
              placeholder="10-digit mobile number"
              inputMode="numeric"
              autoComplete="tel"
            />
          </div>
        </section>

        {hasName && (
          <section className="surface p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-primary">Naam ka Breakdown (Chaldean)</h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {nameLetters.map((l, i) => (
                <div
                  key={i}
                  className="flex w-9 flex-col items-center rounded-lg border border-border/60 py-1.5"
                >
                  <span className="text-sm font-semibold text-foreground">{l.ch}</span>
                  <span className="text-[10px] text-accent">{l.v}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border/60 p-3 text-center">
                <p className="text-[11px] text-muted-foreground">Name Total (Compound)</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{nameTotal}</p>
              </div>
              <div className="rounded-xl border border-primary/40 bg-primary/10 p-3 text-center">
                <p className="text-[11px] text-muted-foreground">Name Number (Single)</p>
                <p className="mt-1 text-2xl font-bold text-primary">{reduce1to9(nameTotal)}</p>
              </div>
            </div>
          </section>
        )}

        {hasMobile && (
          <section className="surface p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-primary">Mobile Number ka Total</h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {mobileDigits.map((d, i) => (
                <div
                  key={i}
                  className="flex w-9 items-center justify-center rounded-lg border border-border/60 py-2 text-sm font-semibold text-foreground"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border/60 p-3 text-center">
                <p className="text-[11px] text-muted-foreground">Mobile Total</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{mobileTotal}</p>
              </div>
              <div className="rounded-xl border border-primary/40 bg-primary/10 p-3 text-center">
                <p className="text-[11px] text-muted-foreground">Mobile Number (Single)</p>
                <p className="mt-1 text-2xl font-bold text-primary">{reduce1to9(mobileTotal)}</p>
              </div>
            </div>
          </section>
        )}

        {!hasName && !hasMobile && (
          <p className="text-center text-xs text-muted-foreground">
            Naam ya mobile number likhte hi result yahan turant dikhne lagega.
          </p>
        )}
      </div>
    </main>
  );
}
