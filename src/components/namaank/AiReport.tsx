import { useState } from "react";
import type { GeneratorInput, ReportSegments } from "@/lib/aiReport.functions";
import { DISCLAIMER } from "@/lib/aiReport.functions";

const SEGMENTS: { key: keyof ReportSegments; no: string; title: string; sub: string }[] = [
  { key: "numerology", no: "I", title: "Numerology Insight", sub: "Life Path · Destiny · Birth Day" },
  { key: "astrology", no: "II", title: "Jyotish Overview", sub: "Rashi · Nakshatra · Graha" },
  { key: "vastu", no: "III", title: "Vastu Analysis", sub: "Main-door disha ke aadhar par" },
  { key: "guidance", no: "IV", title: "Focus Guidance", sub: "Practical steps" },
  { key: "affirmation", no: "V", title: "Affirmation", sub: "Roz dohrayein" },
];

const ddmmyyyy = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}-${m}-${y}` : iso;
};

const plainText = (input: GeneratorInput, s: ReportSegments) =>
  [
    `NAMAANK — Personalised Report`,
    `${input.name} · ${ddmmyyyy(input.dob)} · ${input.time || "Samay: pata nahi"} · ${input.place}`,
    `Main-door disha: ${input.direction} · Focus: ${input.focus}`,
    "",
    ...SEGMENTS.map((seg) => `${seg.title.toUpperCase()}\n${s[seg.key]}\n`),
  ].join("\n");

function esc(v: string) {
  return v.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c);
}

function printHtml(input: GeneratorInput, s: ReportSegments) {
  const body = SEGMENTS.map(
    (seg) => `<section><h2><span>${seg.no}</span> ${esc(seg.title)}</h2>
      <p>${esc(s[seg.key]).replace(/\n+/g, "</p><p>")}</p></section>`,
  ).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>NAMAANK — ${esc(input.name)}</title>
<style>
  @page{margin:16mm}
  body{font-family:Georgia,"Times New Roman",serif;color:#1d2a26;line-height:1.65;font-size:12px}
  .brand{letter-spacing:.32em;text-transform:uppercase;font-size:10px;color:#8a7346;text-align:center}
  h1{text-align:center;font-size:26px;margin:4px 0 2px;letter-spacing:.06em}
  .meta{text-align:center;font-size:11px;color:#5d6b66;margin:0 0 14px}
  .rule{border:0;border-top:1px solid #d9cdb4;margin:14px 0}
  h2{font-size:14px;letter-spacing:.04em;margin:18px 0 6px;color:#0d4a3a}
  h2 span{color:#8a7346;font-size:11px;margin-right:6px}
  p{margin:0 0 8px;text-align:justify}
  .foot{margin-top:18px;border-top:1px solid #d9cdb4;padding-top:8px;font-size:10px;font-style:italic;color:#6d7b76;text-align:center}
</style></head><body>
<p class="brand">Namaank · Har Ank Ke Rahasye</p>
<h1>${esc(input.name)}</h1>
<p class="meta">${esc(ddmmyyyy(input.dob))} · ${esc(input.time || "Samay: pata nahi")} · ${esc(input.place)}<br/>
Main-door disha: ${esc(input.direction)} · Focus: ${esc(input.focus)}</p>
<hr class="rule"/>
${body}
<p class="foot">${esc(DISCLAIMER)}</p>
</body></html>`;
}

export default function AiReport({
  input,
  segments,
  onReset,
  visible,
}: {
  input: GeneratorInput;
  segments: ReportSegments;
  onReset?: (() => void) | undefined;
  /** Sirf ye segments dikhane hain (short report gate ke liye). */
  visible?: (keyof ReportSegments)[] | undefined;
}) {
  const [copied, setCopied] = useState(false);
  const shown = visible ? SEGMENTS.filter((s) => visible.includes(s.key)) : SEGMENTS;


  const copy = async () => {
    try {
      await navigator.clipboard.writeText(plainText(input, segments));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  const download = () => {
    const w = window.open("", "_blank", "width=900,height=1200");
    if (!w) {
      window.alert("Kripya popup allow karein aur dobara try karein.");
      return;
    }
    w.document.open();
    w.document.write(printHtml(input, segments));
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  };

  const meta: [string, string][] = [
    ["Naam", input.name],
    ["Janm tarikh", ddmmyyyy(input.dob)],
    ["Janm samay", input.time || "Pata nahi"],
    ["Janm sthaan", input.place],
    ["Main-door disha", input.direction],
    ["Focus area", input.focus],
  ];

  return (
    <article className="surface overflow-hidden">
      <header className="border-b border-border/70 px-5 py-6 text-center sm:px-8">
        <p className="text-[10px] tracking-[0.34em] text-accent uppercase">Namaank · Personalised Report</p>
        <h2 className="mt-2 text-3xl font-bold glow-text">{input.name}</h2>
        <div className="mx-auto mt-4 grid max-w-xl grid-cols-2 gap-x-6 gap-y-2 text-left sm:grid-cols-3">
          {meta.map(([k, v]) => (
            <div key={k}>
              <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">{k}</p>
              <p className="text-xs font-medium text-foreground">{v}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            onClick={copy}
            className="inline-flex items-center justify-center rounded-xl border border-border px-3 py-2 text-xs transition hover:border-primary/50 hover:text-primary"
          >
            {copied ? "Copy ho gaya" : "Copy"}
          </button>
          <button
            onClick={download}
            className="inline-flex items-center justify-center rounded-xl border border-primary/50 bg-primary/15 px-3 py-2 text-xs text-primary transition hover:bg-primary/25"
          >
            Download as PDF
          </button>
          {onReset && (
            <button
              onClick={onReset}
              className="inline-flex items-center justify-center rounded-xl border border-border px-3 py-2 text-xs transition hover:border-primary/50 hover:text-primary"
            >
              Nayi report
            </button>
          )}
        </div>
      </header>

      <div className="divide-y divide-border/60">
        {SEGMENTS.map((seg) => (
          <section key={seg.key} className="px-5 py-6 sm:px-8">
            <div className="flex items-baseline gap-3">
              <span className="text-xs font-semibold tracking-[0.2em] text-accent">{seg.no}</span>
              <div>
                <h3 className="text-base font-semibold text-primary">{seg.title}</h3>
                <p className="text-[11px] text-muted-foreground">{seg.sub}</p>
              </div>
            </div>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-foreground/90">
              {segments[seg.key]
                .split(/\n+/)
                .filter(Boolean)
                .map((p, i) => (
                  <p key={i} className={p.startsWith("Note:") ? "text-xs italic text-muted-foreground" : ""}>
                    {p}
                  </p>
                ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
