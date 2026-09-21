import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getAccount } from "@/lib/account";
import {
  DIRECTIONS,
  FOCUS_AREAS,
  generateAiReport,
  type Direction,
  type FocusArea,
  type GeneratorInput,
  type ReportSegments,
} from "@/lib/aiReport.functions";
import AiReport from "@/components/namaank/AiReport";
import { PageHeader, Panel, Loading, btnGhost, btnPrimary, field } from "@/components/panel/Ui";

export const Route = createFileRoute("/generate")({
  staticData: { sitemap: true },
  ssr: false,
  head: () => ({
    meta: [
      { title: "Report Generator — NAMAANK" },
      {
        name: "description",
        content:
          "Naam, janm tarikh, sthaan aur ghar ki main-door disha se personalised numerology, jyotish aur vastu report banayein.",
      },
      { property: "og:title", content: "Report Generator — NAMAANK" },
      {
        property: "og:description",
        content: "Numerology, jyotish, vastu aur focus-area guidance ki personalised Hinglish report.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GeneratePage,
});

const label = "block text-xs font-medium text-foreground/90 mb-1.5";

function GeneratePage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [time, setTime] = useState("");
  const [noTime, setNoTime] = useState(false);
  const [place, setPlace] = useState("");
  const [direction, setDirection] = useState<Direction>("North");
  const [focus, setFocus] = useState<FocusArea>("General");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ input: GeneratorInput; segments: ReportSegments } | null>(null);

  useEffect(() => {
    void (async () => {
      const a = await getAccount();
      if (!a) {
        navigate({ to: "/auth" });
        return;
      }
      if (!name) setName(a.fullName);
      if (!place) setPlace(a.city);
      setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await generateAiReport({
        data: {
          name,
          dob,
          time: noTime ? "" : time,
          place,
          direction,
          focus,
        },
      });
      setResult({ input: res.input as GeneratorInput, segments: res.segments as ReportSegments });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Report generate nahi ho payi.");
    }
    setBusy(false);
  };

  if (!ready) return <Loading />;

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-5">
        <PageHeader
          title="Report Generator"
          sub="Numerology · Jyotish · Vastu · Focus guidance — sab ek personalised report mein."
          right={
            <Link to="/me" className={btnGhost}>
              Dashboard
            </Link>
          }
        />

        {result ? (
          <AiReport input={result.input} segments={result.segments} onReset={() => setResult(null)} />
        ) : (
          <Panel title="Apni details bharein" sub="Sab kuch sirf aapki report ke liye use hota hai.">
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className={label} htmlFor="g-name">
                  Poora naam
                </label>
                <input
                  id="g-name"
                  className={field}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jaise: Rahul Khetan"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={label} htmlFor="g-dob">
                    Janm tarikh (DD-MM-YYYY)
                  </label>
                  <input
                    id="g-dob"
                    type="date"
                    className={field}
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className={label} htmlFor="g-time">
                    Janm samay (optional)
                  </label>
                  <input
                    id="g-time"
                    type="time"
                    className={field}
                    value={time}
                    disabled={noTime}
                    onChange={(e) => setTime(e.target.value)}
                  />
                  <label className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <input type="checkbox" checked={noTime} onChange={(e) => setNoTime(e.target.checked)} />
                    Mujhe samay nahi pata
                  </label>
                </div>
              </div>

              <div>
                <label className={label} htmlFor="g-place">
                  Janm sthaan / shehar
                </label>
                <input
                  id="g-place"
                  className={field}
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  placeholder="Jaise: Kolkata"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={label} htmlFor="g-dir">
                    Ghar ke main darwaze ki disha
                  </label>
                  <select
                    id="g-dir"
                    className={field}
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as Direction)}
                  >
                    {DIRECTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={label} htmlFor="g-focus">
                    Focus area
                  </label>
                  <select
                    id="g-focus"
                    className={field}
                    value={focus}
                    onChange={(e) => setFocus(e.target.value as FocusArea)}
                  >
                    {FOCUS_AREAS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && <p className="text-xs text-destructive">{error}</p>}

              <button type="submit" className={btnPrimary} disabled={busy}>
                {busy ? "Report ban rahi hai…" : "Generate Report"}
              </button>
              {busy && (
                <p className="text-[11px] text-muted-foreground">
                  Aapki numerology, jyotish aur vastu analysis taiyaar ho rahi hai — 20–40 second lag sakte hain.
                </p>
              )}
            </form>
          </Panel>
        )}
      </div>
    </main>
  );
}
