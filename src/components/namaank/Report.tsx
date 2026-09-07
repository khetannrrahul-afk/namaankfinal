import { useEffect, useMemo, useState } from "react";
import type { Analysis } from "@/lib/numerology";
import { relation, LUCKY_SET, BAD_SET, digitSum, reduce1to9 } from "@/lib/numerology";
import { getPack, fmt, LANG_LABELS } from "@/lib/langs";
import type { Lang } from "@/lib/langs/types";
import { buildLifeReport } from "@/lib/lifeReport";
import { buildGuidance, guidanceHeadings } from "@/lib/ageGuidance";
import { LoShuGrid, SampleLoShu, PlanesDiagram } from "./Diagrams";
import { printReport, ANALYST, printedOnText } from "@/lib/reportPdf";
import { payForFullReport } from "@/lib/razorpay";
import { getPublicSettings, isAdminUser, DEFAULT_SETTINGS, type PublicSettings } from "@/lib/settings";



function Section({
  title,
  sub,
  children,
  print,
}: {
  title: string;
  sub?: string | undefined;
  children: React.ReactNode;
  print?: string;
}) {
  return (
    <section className="surface p-5 sm:p-6" {...(print ? { "data-print": print } : {})}>
      <h2 className="text-lg font-semibold glow-text">{title}</h2>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-foreground/90">{children}</div>
    </section>
  );
}

const Bullets = ({ items }: { items: string[] }) => (
  <ul className="space-y-1.5">
    {items.map((t, i) => (
      <li key={i} className="flex gap-2">
        <span data-nk="dot" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
        <span>{t}</span>
      </li>
    ))}
  </ul>
);

const Chip = ({ children }: { children: React.ReactNode }) => <span className="chip">{children}</span>;

const ALL9 = Array.from({ length: 9 }, (_, i) => i + 1);

const neutralOf = (n: number) => {
  const lucky = LUCKY_SET[n] ?? [];
  const bad = BAD_SET[n] ?? [];
  return ALL9.filter((x) => !lucky.includes(x) && !bad.includes(x));
};

const LuckyEnemyChart = ({ L }: { L: ReturnType<typeof getPack> }) => {
  const U = L.ui;
  return (
    <div className="lucky-enemy-chart" data-nk="lucky-enemy-chart">
      <div className="lec-head">
        <span>{U["lecNumber"] ?? "Number"}</span>
        <span>{U["lecLucky"] ?? "Lucky"}</span>
        <span>{U["lecEnemy"] ?? "Enemy"}</span>
        <span>{U["lecNeutral"] ?? "Neutral"}</span>
      </div>
      {ALL9.map((n) => (
        <div className="lec-row" key={n}>
          <div className="lec-number">
            <strong>{n}</strong>
            <span>{L.planets[n] ?? ""}</span>
          </div>
          <div className="lec-lucky">{(LUCKY_SET[n] ?? []).join(" · ") || "—"}</div>
          <div className="lec-enemy">{(BAD_SET[n] ?? []).join(" · ") || "—"}</div>
          <div className="lec-neutral">{neutralOf(n).join(" · ") || "—"}</div>
        </div>
      ))}
      <p className="lec-note">{U["lecNote"] ?? ""}</p>
    </div>
  );
};

/** "29 → 2 + 9 = 11 → 1 + 1 = 2" */
const chain = (n: number): string => {
  const steps = [String(n)];
  let x = Math.abs(n);
  while (x > 9) {
    const digits = String(x).split("");
    x = digits.reduce((s, d) => s + Number(d), 0);
    steps.push(`${digits.join(" + ")} = ${x}`);
  }
  return steps.join(" → ");
};

const CalcRow = ({ label, formula, value }: { label: string; formula: string; value: number }) => (
  <div className="calc-row">
    <span className="calc-label">{label}</span>
    <span className="calc-formula">{formula}</span>
    <span className="calc-value">{value}</span>
  </div>
);

const CalcBlock = ({ a, L }: { a: Analysis; L: ReturnType<typeof getPack> }) => {
  const U = L.ui;
  const pad = (n: number) => String(n).padStart(2, "0");
  const dob = `${pad(a.day)}.${pad(a.month)}.${a.year}`;
  const dobDigits = `${pad(a.day)}${pad(a.month)}${a.year}`.split("").join(" + ");
  const dobSum = digitSum(`${pad(a.day)}${pad(a.month)}${a.year}`);
  const yearDigits = String(a.year).split("").join(" + ");
  const yearSum = reduce1to9(digitSum(String(a.year)));
  const male = a.input.gender === "purush";
  const kuaRaw = male ? 11 - yearSum : 4 + yearSum;

  return (
    <div className="calc-block" data-nk="calc">
      <CalcRow label={U["calcDriverLabel"] ?? ""} formula={`${pad(a.day)} → ${chain(a.day)}`} value={a.driver} />
      <CalcRow
        label={U["calcConductorLabel"] ?? ""}
        formula={`${dob} → ${dobDigits} = ${dobSum}${dobSum > 9 ? ` → ${chain(dobSum).split(" → ").slice(1).join(" → ")}` : ""}`}
        value={a.conductor}
      />
      <CalcRow
        label={U["calcKuaLabel"] ?? ""}
        formula={`${a.year} → ${yearDigits} = ${yearSum} → ${male ? `11 − ${yearSum}` : `4 + ${yearSum}`} = ${kuaRaw}${
          kuaRaw > 9 ? ` → ${a.kua}` : ""
        }${a.kua === 5 ? ` (5 → ${a.kuaBehavesAs} ${U["behavesAs"] ?? ""})` : ""}`}
        value={a.kua}
      />
      <p className="calc-note">{U["calcNote"] ?? ""}</p>
    </div>
  );
};


const top5 = (arr: string[], extra: string[]): string[] => [...arr, ...extra].filter(Boolean).slice(0, 5);

const SUB_KEY = "namaank_social_done";

/** Facebook + Instagram dono follow karne ke baad hi report khulti hai. */
function SocialGate({
  s,
  onDone,
}: {
  s: PublicSettings;
  onDone: () => void;
}) {
  const fbUrl = s.facebookUrl || "https://www.facebook.com/";
  const igUrl = s.instagramUrl || "https://www.instagram.com/";
  const [fb, setFb] = useState(false);
  const [ig, setIg] = useState(false);
  const ready = fb && ig;

  // Pehle se kiya hua like/subscribe yaad rakho.
  useEffect(() => {
    try {
      if (localStorage.getItem(`${SUB_KEY}_fb`) === "1") setFb(true);
      if (localStorage.getItem(`${SUB_KEY}_ig`) === "1") setIg(true);
    } catch {
      /* ignore */
    }
  }, []);

  const mark = (which: "fb" | "ig") => {
    try {
      localStorage.setItem(`${SUB_KEY}_${which}`, "1");
    } catch {
      /* ignore */
    }
    if (which === "fb") setFb(true);
    else setIg(true);
  };

  const Btn = ({ label, url, done, which }: { label: string; url: string; done: boolean; which: "fb" | "ig" }) => (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      data-testid={`social-${which}`}
      onClick={() => mark(which)}
      className={`block w-full rounded-xl px-4 py-3 text-center text-sm font-semibold transition ${
        done
          ? "border border-primary/60 bg-primary/15 text-primary"
          : "bg-[image:var(--grad-accent)] text-primary-foreground shadow-[var(--shadow-glow)] hover:brightness-110"
      }`}
    >
      {done ? `✓ ${label} — ho gaya` : label}
    </a>
  );

  return (
    <div className="mx-auto w-full max-w-md space-y-4 px-4 pb-16">
      <section className="surface space-y-4 p-6 text-center">
        <h2 className="text-lg font-semibold glow-text">Report dekhne se pehle</h2>
        <p className="text-sm text-foreground/85">
          Kripya hamare <b>Facebook</b> aur <b>Instagram</b> dono page ko Like &amp; Subscribe karein. Uske baad
          aapki report khul jayegi.
        </p>
        <div className="space-y-3 pt-1">
          <Btn label="Facebook page like karein" url={fbUrl} done={fb} which="fb" />
          <Btn label="Instagram par subscribe karein" url={igUrl} done={ig} which="ig" />
        </div>
        {(!s.facebookUrl || !s.instagramUrl) && (
          <p className="text-[11px] text-muted-foreground">
            Note: admin abhi apne page links Admin Panel → Settings mein add kar sakta hai.
          </p>
        )}
        <button
          data-testid="social-continue"
          disabled={!ready}
          onClick={() => {
            try {
              localStorage.setItem(SUB_KEY, "1");
            } catch {
              /* ignore */
            }
            onDone();
          }}
          className="w-full rounded-xl border border-primary/50 bg-primary/10 px-4 py-3 text-sm font-medium text-primary disabled:opacity-50"
        >
          {ready ? "Meri report dikhayein" : "Dono par like/subscribe karein"}
        </button>
      </section>
    </div>
  );
}


export default function Report({
  a,
  onReset,
  onLangChange,
  skipGate = false,
  initialFull = false,
}: {
  a: Analysis;
  onReset: () => void;
  onLangChange: (l: Lang) => void;
  /** Account panel se report kholte waqt gate/payment pehle hi verify ho chuka hota hai. */
  skipGate?: boolean;
  initialFull?: boolean;
}) {
  const [full, setFull] = useState(initialFull);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [payStage, setPayStage] = useState<string | null>(null);
  const [txn, setTxn] = useState<{ status: "success" | "failed"; paymentId?: string; orderId?: string } | null>(null);
  const [settings, setSettings] = useState<PublicSettings>(DEFAULT_SETTINGS);
  const [admin, setAdmin] = useState(false);
  const [gateDone, setGateDone] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [s, isAdmin] = await Promise.all([getPublicSettings(), isAdminUser()]);
      if (!alive) return;
      let done = false;
      try {
        done = localStorage.getItem(SUB_KEY) === "1";
      } catch {
        /* ignore */
      }
      setSettings(s);
      setAdmin(isAdmin);
      setGateDone(done || isAdmin || skipGate);
      if (isAdmin || initialFull) setFull(true);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [skipGate, initialFull]);

  const unlockFull = async () => {
    setPayError(null);
    setTxn(null);
    setPaying(true);
    const res = await payForFullReport(
      { name: a.input.name, email: a.input.email, mobile: a.input.mobile },
      setPayStage,
    );
    setPaying(false);
    setPayStage(null);
    if (res.ok) {
      setTxn({ status: "success", paymentId: res.paymentId, orderId: res.orderId });
      setFull(true);
    } else {
      setTxn({ status: "failed", ...(res.paymentId ? { paymentId: res.paymentId } : {}), ...(res.orderId ? { orderId: res.orderId } : {}) });
      setPayError(res.message);
    }
  };

  const L = useMemo(() => getPack(a.input.lang), [a.input.lang]);

  const pages = useMemo(() => buildLifeReport(a), [a]);

  const guide = useMemo(() => buildGuidance(a), [a]);
  const guideHead = useMemo(
    () => guidanceHeadings(a.input.lang, a.input.name, guide.age, guide.stageLabel),
    [a.input.lang, a.input.name, guide.age, guide.stageLabel],
  );

  if (!ready) return <p className="p-10 text-center text-sm text-muted-foreground">Loading…</p>;
  if (!gateDone) return <SocialGate s={settings} onDone={() => setGateDone(true)} />;

  const U = L.ui;

  const D = L.numbers[a.driver]!;
  const C = L.numbers[a.conductor]!;
  const K = L.numbers[a.kuaBehavesAs]!;
  const rel = relation(a.driver, a.conductor);
  const compat = L.compat[rel]!;
  // Disha / Vastu / Urja ke liye Kua 5 nahi chalta — uska behaves-as kua chalta hai
  const kuaEff = L.kua[a.kuaBehavesAs]!;
  const dirNames = a.kuaDirs.map((d) => L.dirs[d]).join(", ");
  const luckyColors = a.luckyColors.map((c) => L.colors[c]).join(", ");
  const badColors = a.badColors.map((c) => L.colors[c]).join(", ");

  const savePdf = () => printReport(a, document.getElementById("namaank-report")?.innerHTML ?? "");

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-4 pb-16">
      <div className="surface flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm font-medium text-foreground">{U["language"] ?? "Report ki Bhasha"}</p>
          <p className="text-[11px] text-muted-foreground">{U["languageSwitchNote"] ?? U["languageNote"]}</p>
        </div>
        <select
          aria-label={U["language"] ?? "Language"}
          className="rounded-xl border border-border bg-[var(--input)] px-3 py-2 text-sm text-foreground"
          value={a.input.lang}
          onChange={(e) => onLangChange(e.target.value as Lang)}
        >
          {(Object.keys(LANG_LABELS) as Lang[]).map((c) => (
            <option key={c} value={c}>
              {LANG_LABELS[c]}
            </option>
          ))}
        </select>
      </div>

      <div id="namaank-report" className="space-y-5">
        {/* Basic formula ek hi page par poora */}
        <Section title={U["basics"] ?? ""} print="basics">
          <p className="font-medium text-primary">{U["meaning19"]}</p>
          <Bullets items={L.meanings} />
          <LuckyEnemyChart L={L} />
          <p className="pt-2 font-medium text-primary">{U["calcBasicTitle"]}</p>
          <Bullets
            items={[U["calcFormulaDriver"] ?? "", U["calcFormulaConductor"] ?? "", U["calcFormulaKua"] ?? ""].filter(
              Boolean,
            )}
          />

          <p className="pt-2 font-medium text-primary">{U["whatIsChart"]}</p>
          <p>{U["chartNote"]}</p>
          <div className="py-1">
            <SampleLoShu />
            <p className="mt-2 text-center text-xs text-muted-foreground">{U["chartCaption"]}</p>
          </div>
          <p className="pt-2 font-medium text-primary">{U["whatArePlanes"]}</p>
          <p>{U["planesNote"]}</p>
          <div className="py-1">
            <PlanesDiagram labels={L.planes} />
          </div>
          <p className="pt-2 font-medium text-primary">{U["whatIsYoga"]}</p>
          <p>{U["yogaNote"]}</p>
        </Section>

        {/* Aapka analysis — yahan se naya page shuru hota hai */}
        <section data-print="break" className="border-0 bg-transparent p-0">
          <div data-print="analysis-head" className="pt-2 text-center">
            <h2 className="text-2xl font-bold glow-text">{U["yourAnalysis"]}</h2>
            <p className="mt-1 text-xs uppercase tracking-[0.25em] text-accent">{a.input.name}</p>
          </div>

          <div data-nk="stats" className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { k: U["driver"] ?? "Driver", n: a.driver },
              { k: U["conductor"] ?? "Conductor", n: a.conductor },
              {
                k: `${U["kua"]}${a.kua === 5 ? ` (${a.kuaBehavesAs} ${U["behavesAs"]})` : ""}`,
                n: a.kua,
              },
            ].map((c) => (
              <div key={c.k} className="surface p-4 text-center">
                <p className="text-xs text-muted-foreground">{c.k}</p>
                <p className="my-1 text-4xl font-bold glow-text">{c.n}</p>
                <p className="text-xs text-accent">{L.planets[c.n]}</p>
              </div>
            ))}
          </div>
        </section>

        <Section title={U["calcTitle"] ?? ""} sub={U["calcNote"]}>
          <CalcBlock a={a} L={L} />
        </Section>


        <Section title={U["birthChart"] ?? ""}>
          <LoShuGrid grid={a.grid} lottery={a.lotteryNumbers} />
          <p className="pt-3 text-sm">
            {U["missing"]}: {a.missing.join(", ") || U["none"]} · {U["repeated"]}:{" "}
            {a.repeated.join(", ") || U["none"]}
          </p>
          {a.lotteryNumbers.length > 0 && <p className="text-xs text-muted-foreground">{U["lotteryNote"]}</p>}
        </Section>

        <Section title={U["lottery"] ?? ""} sub={U["lotterySub"]}>
          {a.lotteryNumbers.length ? (
            <>
              <div className="flex flex-wrap gap-2">
                {a.lotteryNumbers.map((n) => (
                  <Chip key={n}>
                    {n} — {L.planets[n]}
                  </Chip>
                ))}
              </div>
              <Bullets items={a.lotteryNumbers.map((n) => `${n} (${L.planets[n]}): ${L.numbers[n]!.short}`)} />
            </>
          ) : (
            <p>{U["lotteryEmpty"]}</p>
          )}
        </Section>

        <Section title={`${U["driver"]} ${a.driver} — ${D.title}`}>
          <p>{D.short}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            {D.keywords.map((k: string) => (
              <Chip key={k}>{k}</Chip>
            ))}
          </div>
        </Section>
        <Section title={`${U["conductor"]} ${a.conductor} — ${C.title}`}>
          <p>{C.short}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            {C.keywords.map((k: string) => (
              <Chip key={k}>{k}</Chip>
            ))}
          </div>
        </Section>
        <Section
          title={`${U["kua"]} ${a.kua === 5 ? `5 → ${a.kuaBehavesAs}` : a.kua} — ${kuaEff.element} ${U["element"]}`}
        >
          <p>{K.short}</p>
          {a.kua === 5 && <p className="text-xs text-muted-foreground">{U["kua5Note"]}</p>}
          <p className="text-xs text-muted-foreground">
            {U["goodDirs"]}: {dirNames}
          </p>
        </Section>

        {!full && (
          <>
            <Section title={U["strengths"] ?? ""}>
              <Bullets
                items={top5(D.strengths.slice(0, 3), [...C.strengths.slice(0, 2), ...K.strengths.slice(0, 2)])}
              />
            </Section>

            <Section title={U["weaknesses"] ?? ""}>
              <Bullets
                items={top5(D.weaknesses.slice(0, 3), [...C.weaknesses.slice(0, 2), ...K.weaknesses.slice(0, 2)])}
              />
            </Section>

            <Section title={`${U["luckyBadNumbers"]} · ${U["colorsTitle"]}`} sub={U["luckyBadSub"]}>
              <Bullets
                items={[
                  `${U["lucky"]}: ${a.finalLucky.join(", ") || "—"}`,
                  `${U["bad"]}: ${a.finalBad.join(", ") || "—"}`,
                  `${U["luckyColors"]}: ${luckyColors || "—"}`,
                  `${U["badColors"]}: ${badColors || "—"}`,
                  U["colorsNote"] ?? "",
                ].filter(Boolean)}
              />
            </Section>

            <Section title={U["compatTitle"] ?? ""}>
              <Chip>{compat.verdict}</Chip>
              <Bullets items={compat.points.slice(0, 5)} />
            </Section>

            <Section title={guideHead.title} sub={guideHead.sub}>
              <p className="text-sm text-foreground/90">{guide.intro}</p>
              {guide.topics.map((t) => (
                <div key={t.key} className="pt-2">
                  <p className="font-medium text-primary">{t.title}</p>
                  <div className="mt-1">
                    <Bullets items={t.points.slice(0, 2)} />
                  </div>
                </div>
              ))}
              <p className="pt-1 text-xs text-muted-foreground">
                {U["getFullReport"] ?? "Get Full Report"} — {guide.topics.length * 3}+ aur upay full report mein.
              </p>
            </Section>



            <Section title={U["yogasTitle"] ?? ""}>
              <Bullets
                items={
                  a.activePlanes.length
                    ? a.activePlanes.slice(0, 5).map((k) => `${L.planes[k]!.label} — ${L.planes[k]!.meaning}`)
                    : [U["noYoga"] ?? ""]
                }
              />
            </Section>

            <Section title={U["nameNum"] ?? ""}>
              <Bullets
                items={[
                  fmt(L.dyn["nameLine"] ?? "", {
                    fullName: a.input.name,
                    compound: a.name.compound,
                    nameSingle: a.name.single,
                    namePlanet: L.planets[a.name.single] ?? "",
                  }),
                  fmt(L.dyn["nameFirst"] ?? "", { first: a.name.first }),
                  fmt(L.dyn["nameRelD"] ?? "", {
                    nameSingle: a.name.single,
                    driver: a.driver,
                    relName: L.rel[relation(a.name.single, a.driver)],
                  }),
                  a.finalBad.includes(a.name.single) ? (L.dyn["nameBad"] ?? "") : (L.dyn["nameGood"] ?? ""),
                ]
                  .filter(Boolean)
                  .slice(0, 5)}
              />
            </Section>

            <Section title={U["mobileNum"] ?? ""}>
              <Bullets
                items={[
                  fmt(L.dyn["mobLine"] ?? "", {
                    mobile: a.input.mobile,
                    mobTotal: a.mobile.total,
                    mobileSingle: a.mobile.single,
                    mobPlanet: L.planets[a.mobile.single] ?? "",
                  }),
                  fmt(L.dyn["mobFirst"] ?? "", { first4: a.mobile.first4 }),
                  fmt(L.dyn["mobLast"] ?? "", { last4: a.mobile.last4 }),
                  a.finalBad.includes(a.mobile.single) ? (L.dyn["mobBad"] ?? "") : (L.dyn["mobGood"] ?? ""),
                ]
                  .filter(Boolean)
                  .slice(0, 5)}
              />
            </Section>
          </>
        )}

        {full && (

        <>
        <Section title={U["compatTitle"] ?? ""}>
          <Chip>{compat.verdict}</Chip>
          <Bullets items={compat.points} />
        </Section>


        <Section title={U["luckyBadNumbers"] ?? ""} sub={U["luckyBadSub"]}>
          <p>
            {U["lucky"]}: <b className="text-primary">{a.finalLucky.join(", ") || "—"}</b>
          </p>
          <p>
            {U["bad"]}: <b className="text-destructive">{a.finalBad.join(", ") || "—"}</b>
          </p>
        </Section>

        <Section title={U["colorsTitle"] ?? ""}>
          <p>
            {U["luckyColors"]}: <b className="text-primary">{luckyColors}</b>
          </p>
          <p>
            {U["badColors"]}: <b className="text-destructive">{badColors}</b>
          </p>
          <p className="text-xs text-muted-foreground">{U["colorsNote"]}</p>
        </Section>

        <Section title={U["strengths"] ?? ""}>
          <Bullets items={top5(D.strengths.slice(0, 3), [...C.strengths.slice(0, 2), ...K.strengths.slice(0, 2)])} />
        </Section>
        <Section title={U["weaknesses"] ?? ""}>
          <Bullets items={top5(D.weaknesses.slice(0, 3), [...C.weaknesses.slice(0, 2), ...K.weaknesses.slice(0, 2)])} />
        </Section>
        <Section title={U["yogasTitle"] ?? ""}>
          <Bullets
            items={
              a.activePlanes.length
                ? a.activePlanes.map((k) => `${L.planes[k]!.label} — ${L.planes[k]!.meaning}`)
                : [U["noYoga"] ?? ""]
            }
          />
        </Section>

        <Section title={guideHead.title} sub={guideHead.sub}>
          <p className="text-sm text-foreground/90">{guide.intro}</p>
          {guide.topics.map((t) => (
            <div key={t.key} className="pt-2">
              <p className="font-medium text-primary">{t.title}</p>
              <div className="mt-1">
                <Bullets items={t.points} />
              </div>
            </div>
          ))}
        </Section>



        <Section title={U["nameNum"] ?? ""}>
          <Bullets
            items={[
              fmt(L.dyn["nameLine"] ?? "", {
                fullName: a.input.name,
                compound: a.name.compound,
                nameSingle: a.name.single,
                namePlanet: L.planets[a.name.single] ?? "",
              }),
              fmt(L.dyn["nameFirst"] ?? "", { first: a.name.first }),
              fmt(L.dyn["nameRelD"] ?? "", {
                nameSingle: a.name.single,
                driver: a.driver,
                relName: L.rel[relation(a.name.single, a.driver)],
              }),
              a.finalBad.includes(a.name.single) ? (L.dyn["nameBad"] ?? "") : (L.dyn["nameGood"] ?? ""),
            ]}
          />
        </Section>

        <Section title={U["mobileNum"] ?? ""}>
          <Bullets
            items={[
              fmt(L.dyn["mobLine"] ?? "", {
                mobile: a.input.mobile,
                mobTotal: a.mobile.total,
                mobileSingle: a.mobile.single,
                mobPlanet: L.planets[a.mobile.single] ?? "",
              }),
              fmt(L.dyn["mobFirst"] ?? "", { first4: a.mobile.first4 }),
              fmt(L.dyn["mobLast"] ?? "", { last4: a.mobile.last4 }),
              a.finalBad.includes(a.mobile.single) ? (L.dyn["mobBad"] ?? "") : (L.dyn["mobGood"] ?? ""),
            ]}
          />
          <p className="text-xs text-muted-foreground">{U["mobileNote"]}</p>
        </Section>

        <div className="space-y-6">
          {pages.map((p) => (
            <article key={p.no} className="a4-page">
              <div className="a4-inner">
                <div className="a4-page-label">NAMAANK · LIFE REPORT · {String(p.no).padStart(2, "0")}</div>
                <h3 className="mb-3 text-base font-semibold text-accent">{p.title}</h3>
                {p.no === 19 && (
                  <div className="mb-3">
                    <PlanesDiagram grid={a.grid} labels={L.planes} />
                  </div>
                )}
                <Bullets items={p.points} />
                <footer className="mt-4 flex items-center justify-end gap-3 border-t border-border pt-2 text-[11px] text-muted-foreground">
                  <span>
                    {U["page"]} {p.no} / {pages.length}
                  </span>
                </footer>
              </div>
            </article>
          ))}
        </div>
        </>
        )}
      </div>

      {/* App-only preview of the closing note — PDF apna version khud jodta hai */}
      <section className="surface p-5 text-center sm:p-6">
        <h2 className="text-lg font-semibold glow-text">{U["thanksTitle"]}</h2>
        <p className="mt-3 text-sm text-foreground/90">
          {U["thanksHello"]} {a.input.name}, {U["thanksBody"]}
        </p>
        <p className="mt-2 text-sm text-foreground/80">{U["thanksBody2"]}</p>
        <p className="mt-3 text-xs italic text-accent">{U["thanksQuote"]}</p>
        <p className="mt-4 text-sm font-semibold text-primary">{ANALYST.name}</p>
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          {ANALYST.brand} · {ANALYST.tagline}
        </p>
      </section>

      <button
        onClick={savePdf}
        className="w-full rounded-xl bg-[image:var(--grad-accent)] px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:brightness-110"
      >
        {U["downloadPdf"]}
      </button>

      {!full && (
        <>
          <button
            onClick={unlockFull}
            disabled={paying}
            className="w-full rounded-xl border border-primary/50 bg-primary/10 px-4 py-3 text-sm font-medium text-primary disabled:opacity-60"
          >
            {paying
              ? (payStage ?? "Payment processing…")
              : `${U["getFullReport"] ?? "Get Full Report"} — ₹${settings.priceInr}`}
          </button>
          {admin && (
            <button
              onClick={() => setFull(true)}
              className="w-full rounded-xl border border-accent/50 bg-accent/10 px-4 py-3 text-sm font-medium text-accent"
            >
              Admin: bina payment full report kholein
            </button>
          )}
          {payError && <p className="text-center text-xs text-destructive">{payError}</p>}
        </>
      )}

      {txn && (
        <div
          className={`rounded-xl border p-4 text-center text-xs ${
            txn.status === "success"
              ? "border-primary/50 bg-primary/10 text-primary"
              : "border-destructive/50 bg-destructive/10 text-destructive"
          }`}
        >
          <p className="text-sm font-semibold">
            {txn.status === "success" ? "✓ Payment Successful" : "✕ Payment Failed / Cancelled"}
          </p>
          {txn.paymentId && (
            <p className="mt-1">
              Transaction ID: <b>{txn.paymentId}</b>
            </p>
          )}
          {txn.orderId && <p className="mt-0.5 opacity-80">Order ID: {txn.orderId}</p>}
          <p className="mt-1 opacity-80">Amount: ₹{settings.priceInr}</p>
        </div>
      )}




      <button
        onClick={onReset}
        className="w-full rounded-xl border border-primary/50 bg-primary/10 px-4 py-3 text-sm font-medium text-primary"
      >
        {U["newReport"]}
      </button>

      <p className="pt-4 text-center text-xs text-muted-foreground">
        {U["analysisBy"]} {ANALYST.name} · {U["printedOn"] ?? "Printed on"}: {printedOnText()}
      </p>
    </div>
  );
}
