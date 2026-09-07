import type { Analysis } from "./numerology";
import { getPack } from "./langs";

/** Astrologer / analyst details printed on the cover and in the running footer. */
export const ANALYST = {
  name: "Raahul Khetaan",
  brand: "NAMAANK",
  tagline: "Har Ank ke Rahasye",
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const prettyDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${d} ${months[Number(m) - 1] ?? m} ${y}`;
};

const prettyTime = (t: string) => {
  const [hRaw, mRaw] = t.split(":");
  const h = Number(hRaw);
  if (Number.isNaN(h)) return t;
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, "0")}:${mRaw ?? "00"} ${ampm}`;
};

/** "19 August 2026, 11:16 AM" — printed at the very bottom of every page. */
export const printedOnText = (d = new Date()) =>
  `${d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}, ` +
  `${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}`;

/** Decorative mandala / yantra used as cover graphic. */
const mandala = (id: string) => `
<svg class="mandala ${id}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <g fill="none" stroke="currentColor" stroke-width="0.8">
    <circle cx="100" cy="100" r="96"/>
    <circle cx="100" cy="100" r="80"/>
    <circle cx="100" cy="100" r="52"/>
    <circle cx="100" cy="100" r="26"/>
    ${Array.from({ length: 12 })
      .map((_, i) => {
        const ang = (i * 30 * Math.PI) / 180;
        const x1 = 100 + 26 * Math.cos(ang);
        const y1 = 100 + 26 * Math.sin(ang);
        const x2 = 100 + 96 * Math.cos(ang);
        const y2 = 100 + 96 * Math.sin(ang);
        return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
      })
      .join("")}
    ${Array.from({ length: 8 })
      .map((_, i) => `<rect x="52" y="52" width="96" height="96" transform="rotate(${i * 11.25} 100 100)"/>`)
      .join("")}
  </g>
</svg>`;

const coverPage = (a: Analysis) => {
  const L = getPack(a.input.lang);
  const U = L.ui;
  const rows: [string, string][] = [
    [U["coverName"] ?? "Name", a.input.name],
    [U["coverDob"] ?? "Date of Birth", prettyDate(a.input.dob)],
    [U["coverTime"] ?? "Time of Birth", `${prettyTime(a.input.time)} · ${L.dayParts[a.dayPart]}`],
    [U["coverDay"] ?? "Day", `${L.weekdays[a.weekdayIndex]} · ${L.dayLords[a.weekdayIndex]}`],
    [U["coverPlace"] ?? "Place of Birth", a.input.place],
    [U["coverMobile"] ?? "Mobile Number", a.input.mobile],
    [U["coverEmail"] ?? "Email", a.input.email],
  ];
  const stats: [string, number][] = [
    [U["driver"] ?? "Driver", a.driver],
    [U["conductor"] ?? "Conductor", a.conductor],
    [U["kua"] ?? "Kua", a.kua],
  ];
  return `<section class="cover">
  <div class="cover-frame">
    ${mandala("m-tl")}${mandala("m-br")}
    <div class="cover-body">
      <p class="jai">॥ Jai Paramatma ॥</p>

      <div class="brand-block">
        <h1 class="cover-title">${esc(ANALYST.brand)}</h1>
        <p class="cover-sub">${esc(ANALYST.tagline)}</p>
      </div>

      <div class="cover-rule"><span></span><i>✦</i><span></span></div>
      <p class="cover-kicker">${esc(U["coverKicker"] ?? "")}</p>

      <table class="cover-table">
        ${rows
          .filter(([, v]) => v && String(v).trim())
          .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(String(v))}</td></tr>`)
          .join("")}
      </table>

      <div class="cover-stats">
        ${stats
          .map(
            ([k, n]) =>
              `<div class="stat"><span class="stat-k">${k}</span><span class="stat-n">${n}</span><span class="stat-p">${esc(L.planets[n] ?? "")}</span></div>`,
          )
          .join("")}
      </div>

      <p class="cover-note">${esc(U["coverNote"] ?? "")}</p>

      <div class="cover-by">
        <p class="by-label">${esc(U["analysisBy"] ?? "Analysis by")}</p>
        <p class="by-name">${esc(ANALYST.name)}</p>
      </div>
    </div>
  </div>
</section>`;
};

/** Closing thank-you page — company ki taraf se. */
const thanksPage = (a: Analysis) => {
  const U = getPack(a.input.lang).ui;
  return `<section class="thanks" data-print="thanks">
  <div class="thanks-inner">
    <p class="thanks-om">✦</p>
    <h2 class="thanks-title">${esc(U["thanksTitle"] ?? "Dhanyavaad")}</h2>
    <p class="thanks-hi">${esc(U["thanksHello"] ?? "")}</p>
    <p class="thanks-body">${esc(U["thanksBody"] ?? "")}</p>
    <p class="thanks-body">${esc(U["thanksBody2"] ?? "")}</p>
    <p class="thanks-quote">${esc(U["thanksQuote"] ?? "")}</p>
    <div class="thanks-sign">
      <p class="thanks-name">${esc(ANALYST.name)}</p>
      <p class="thanks-brand">${esc(ANALYST.brand)} · ${esc(ANALYST.tagline)}</p>
    </div>
  </div>
</section>`;
};

const CSS = `
/* head/foot ke liye margin — browser ka apna about:blank header off rakhein */
@page { size: A4; margin: 16mm 12mm 15mm; }
* { box-sizing: border-box; }
html,body{margin:0;padding:0}
body{font-family:"Georgia","Times New Roman",serif;background:#fff;color:#12332b;line-height:1.6;font-size:12.5px}

/* content flow */
.doc{padding:0}
h1,h2,h3{color:#0d5c46;font-family:"Trebuchet MS",system-ui,sans-serif;margin:0 0 6px}
h2{font-size:16px} h3{font-size:14px}
h2,h3{break-after:avoid;page-break-after:avoid}
section{background:#fff;border:1px solid #cfe4d9;border-radius:12px;padding:14px 16px;margin:0 0 12px;
  break-inside:avoid;page-break-inside:avoid}
.doc > section.surface{break-before:page;page-break-before:always}
.doc > section.surface:first-child{break-before:page;page-break-before:always}
.doc > [data-print="break"]{break-before:page;page-break-before:always}
.a4-page{break-before:page;page-break-before:always;break-inside:avoid;page-break-inside:avoid}
.a4-inner{min-height:245mm}

section p{margin:4px 0}
p{overflow-wrap:anywhere}
b{color:#0d5c46}
svg{max-width:100%;height:auto}
button,[data-print="ui"]{display:none!important}

/* ---- bullets (app bhi flex-dot markup use karta hai) ---- */
ul{padding-left:2px;margin:6px 0;list-style:none}
li{margin:3px 0;display:flex;gap:7px;align-items:flex-start;break-inside:avoid;page-break-inside:avoid;
  overflow-wrap:anywhere}
li > span:last-child{flex:1 1 auto;min-width:0}
[data-nk="dot"]{flex:0 0 auto;display:block;width:5px;height:5px;margin-top:6px;border-radius:50%;background:#0d5c46}

.chip{display:inline-block;border:1px solid #9fd6c0;background:#f2fbf7;border-radius:999px;padding:1px 9px;margin:2px;font-size:11px}

/* ---- document footer line (fixed running head/foot print mein overlap karta tha) ---- */
.doc-foot{margin:6mm 0 0;text-align:center;font-family:"Trebuchet MS",sans-serif;font-size:9px;
  letter-spacing:.1em;text-transform:uppercase;color:#7d998f;break-inside:avoid;page-break-inside:avoid}

/* ---- Cover page ---- */
.cover{border:0;padding:0;margin:0;height:255mm;display:flex;page-break-after:always;border-radius:0;
  background:radial-gradient(circle at 22% 12%, #eaf7f1, #ffffff 62%)}
.cover-frame{position:relative;flex:1;margin:0;border:3px double #0d5c46;border-radius:14px;padding:12mm 10mm;
  text-align:center;box-shadow:0 0 0 4px #cfa94a2e inset;display:flex;overflow:hidden}
.cover-body{position:relative;z-index:2;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-start}
.mandala{position:absolute;width:80mm;color:#0d5c46;opacity:.10;z-index:1}
.m-tl{top:-22mm;left:-22mm}
.m-br{bottom:-22mm;right:-22mm;color:#b08a2e;opacity:.12}
.jai{font-family:"Trebuchet MS",sans-serif;letter-spacing:.22em;text-transform:uppercase;font-size:12px;color:#b08a2e;margin:0 0 9mm;
  border:1px solid #cfa94a;border-radius:999px;padding:5px 18px;background:#fffdf6}
.brand-block{margin:0}
.cover-title{font-size:46px;letter-spacing:.2em;margin:0;color:#0d5c46;line-height:1.05}
.cover-sub{letter-spacing:.34em;text-transform:uppercase;font-size:11px;color:#b08a2e;margin:8px 0 0}
.cover-rule{display:flex;align-items:center;justify-content:center;gap:10px;color:#cfa94a;margin:12px 0 6px}
.cover-rule span{height:1px;width:60px;background:#cfa94a}
.cover-rule i{font-style:normal;font-size:12px}
.cover-kicker{letter-spacing:.28em;text-transform:uppercase;font-size:10px;color:#5b7d72;margin:0 0 7mm}
.cover-table{width:100%;max-width:126mm;margin:0 auto;border-collapse:collapse;text-align:left;background:#ffffffcc;
  border:1px solid #cfe4d9;border-radius:10px}
.cover-table th,.cover-table td{padding:6px 10px;border-bottom:1px dotted #b9d6c9;font-size:12px;vertical-align:top}
.cover-table tr:last-child th,.cover-table tr:last-child td{border-bottom:0}
.cover-table th{width:40%;font-weight:600;color:#5b7d72;font-family:"Trebuchet MS",sans-serif;font-size:10px;
  letter-spacing:.08em;text-transform:uppercase}
.cover-table td{color:#12332b;font-weight:600}
.cover-stats{display:flex;justify-content:center;gap:10px;margin:8mm 0 0}
.stat{border:1px solid #9fd6c0;border-radius:12px;padding:9px 16px;min-width:32mm;background:#f7fdfa}
.stat-k{display:block;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#5b7d72}
.stat-n{display:block;font-size:30px;font-weight:700;color:#0d5c46;line-height:1.15}
.stat-p{display:block;font-size:10px;color:#b08a2e}
.cover-note{max-width:124mm;margin:7mm auto 0;font-size:11px;color:#5b7d72;font-style:italic;line-height:1.6}
.cover-by{margin-top:auto;padding-top:7mm;width:100%;max-width:110mm;border-top:1px dotted #cfa94a}
.by-label{font-size:9px;letter-spacing:.3em;text-transform:uppercase;color:#5b7d72;margin:0}
.by-name{font-size:22px;color:#0d5c46;margin:4px 0 0;font-weight:700;font-family:"Trebuchet MS",sans-serif}

/* ---- basics lucky / enemy reference chart ---- */
.lucky-enemy-chart{margin:7px 0 8px;border:1px solid #cfe4d9;border-radius:10px;overflow:hidden;background:#fbfefd}
.lec-head,.lec-row{display:grid;grid-template-columns:24mm 1fr 1fr 1fr;align-items:center}
.lec-head{background:#0d5c46;color:#fff;font-family:"Trebuchet MS",sans-serif;font-size:8.5px;letter-spacing:.08em;text-transform:uppercase}
.lec-head span,.lec-row>div{padding:4px 7px}
.lec-row{font-size:9.5px;border-top:1px solid #e3eee9}
.lec-row:nth-child(even){background:#f7fbf9}
.lec-number{display:flex;align-items:center;gap:6px;color:#0d5c46}
.lec-number strong{font-size:13px}
.lec-number span{font-size:8px;color:#7d998f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lec-lucky{color:#0d5c46;font-weight:600}
.lec-enemy{color:#a24a42;font-weight:600}
.lec-neutral{color:#5b7d72;font-weight:600}
.lec-note{padding:4px 7px!important;margin:0!important;border-top:1px dotted #cfe4d9;color:#7d998f;font-size:8px!important;font-style:italic}

/* ---- page break helpers ---- */
[data-print="break"]{break-before:page;page-break-before:always}
[data-print="basics"]{break-before:page;page-break-before:always;font-size:10.5px;padding:11px 13px}
[data-print="basics"] h2{font-size:15px}
[data-print="basics"] .lec-row{font-size:8.8px}
[data-print="basics"] .lec-head span,[data-print="basics"] .lec-row>div{padding:3px 6px}
[data-print="basics"] [data-nk="g3"]{max-width:42mm;margin:5px auto}
[data-print="basics"] [data-nk="planes"]{gap:5px;margin:5px 0}
[data-print="basics"] [data-nk="planes"]>div{padding:4px}
[data-print="basics"] p{margin:2px 0}

[data-print="basics"] li{margin:1.5px 0}
[data-print="basics"] [data-nk="g3"]{max-width:48mm;margin:6px auto}
[data-print="basics"] [data-nk="planes"] [data-nk="cell"]{font-size:7.5px}
[data-print="analysis-head"]{text-align:center;border:0;background:transparent;margin:0 0 10px;padding:0}
[data-print="analysis-head"] h2{font-size:24px;letter-spacing:.06em}
[data-print="analysis-head"] p{font-size:10px;letter-spacing:.25em;text-transform:uppercase;color:#b08a2e}

/* ---- Lo Shu / plane grids (app jaisa box look) ---- */
[data-nk="g3"]{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-width:62mm;margin:10px auto}
[data-nk="cell"]{aspect-ratio:1/1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  border:1.5px solid #9fd6c0;border-radius:10px;background:#f4fbf8;font-weight:700;color:#0d5c46;font-size:14px;
  text-align:center;line-height:1.1;padding:2px}
[data-nk="cell"] span:last-child{font-size:8px;font-weight:400;color:#7d998f;margin-top:2px}
[data-nk="cell"][data-on="1"]{background:#dff2e9;border-color:#0d5c46}
[data-nk="cell"][data-on="0"]{background:#fafefc;color:#a9c3ba;border-color:#e0eee8}
/* Paramatma ki Lottery — circle wapas dikhna chahiye */
[data-nk="lot"]{display:inline-flex!important;align-items:center;justify-content:center;min-width:22px;height:22px;
  padding:0 4px;border:2px solid #b08a2e;border-radius:999px;color:#b08a2e;background:#fffdf5;
  font-weight:700;line-height:1}
[data-nk="planes"]{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:8px 0;break-inside:avoid;page-break-inside:avoid}
[data-nk="planes"] > div{border:1px solid #cfe4d9;border-radius:10px;padding:6px;background:#fbfefd}
[data-nk="planes"] [data-nk="g3"]{max-width:none;margin:0;gap:3px}
[data-nk="planes"] [data-nk="cell"]{font-size:9px;border-radius:5px;border-width:1px}
[data-nk="planes"] p{font-size:8.5px;margin:4px 0 0;color:#12332b;line-height:1.25}

[data-nk="stats"]{display:flex;gap:10px;justify-content:center;margin:0 0 12px}
[data-nk="stats"] > div{flex:1;border:1px solid #9fd6c0;border-radius:12px;padding:10px;text-align:center;background:#f7fdfa}
[data-nk="stats"] p:nth-child(1){font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#5b7d72;margin:0}
[data-nk="stats"] p:nth-child(2){font-size:28px;font-weight:700;color:#0d5c46;margin:2px 0;line-height:1}
[data-nk="stats"] p:nth-child(3){font-size:10px;color:#b08a2e}

.a4-page-label{font-family:"Trebuchet MS",sans-serif;font-size:8px;letter-spacing:.18em;text-transform:uppercase;color:#7d998f;margin-bottom:5px}
/* ---- Full Life Report — white paper with subtle design ---- */
.a4-page{border:0;border-radius:0;padding:0;margin:0;max-width:none;background:#fff;page-break-before:always;break-before:page}
.a4-inner{position:relative;border:2px solid #0d5c46;border-radius:12px;padding:14px 16px;box-shadow:0 0 0 3px #cfa94a2e inset;
  color:#12332b;overflow:hidden;
  background-color:#ffffff;
  background-image:
    radial-gradient(circle at 8% 6%, #0d5c4614, transparent 38%),
    radial-gradient(circle at 92% 94%, #cfa94a24, transparent 36%),
    repeating-linear-gradient(45deg, #0d5c460a 0 2px, transparent 2px 15px),
    repeating-linear-gradient(-45deg, #0d5c4608 0 2px, transparent 2px 15px)}
.a4-inner h3{color:#0d5c46;font-size:15px}
.a4-inner header{display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid #b9d6c9;padding-bottom:6px;
  margin-bottom:10px;font-size:11px;color:#5b7d72}
.a4-inner header span:first-child{color:#0d5c46;font-weight:700}
.a4-inner footer{display:flex;justify-content:flex-end;gap:10px;border-top:1px solid #dcebe4;margin-top:12px;padding-top:6px;
  font-size:10px;color:#5b7d72}
.a4-page:last-child{page-break-after:auto}

/* ---- Thank you page ---- */
.thanks{border:0;border-radius:0;padding:0;margin:0;background:#fff;page-break-before:always;break-before:page}
.thanks-inner{border:2px double #0d5c46;border-radius:14px;padding:16mm 14mm;text-align:center;
  box-shadow:0 0 0 3px #cfa94a2e inset;background:radial-gradient(circle at 50% 0%, #eaf7f1, #ffffff 60%)}
.thanks-om{color:#cfa94a;font-size:22px;margin:0 0 6mm}
.thanks-title{font-size:26px;letter-spacing:.14em;margin:0 0 6mm}
.thanks-hi{font-weight:700;color:#0d5c46;margin:0 0 4mm;font-size:13px}
.thanks-body{max-width:135mm;margin:0 auto 4mm;font-size:12.5px;line-height:1.8;color:#12332b}
.thanks-quote{max-width:120mm;margin:6mm auto;font-style:italic;color:#b08a2e;font-size:12px}
.thanks-sign{margin-top:8mm;padding-top:5mm;border-top:1px dotted #cfa94a}
.thanks-name{margin:0;font-size:20px;font-weight:700;color:#0d5c46;font-family:"Trebuchet MS",sans-serif}
.thanks-brand{margin:2px 0 0;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#7d998f}

/* ---- driver / conductor / kua calculation ---- */
.calc-block{border:1px solid #cfe4d9;border-radius:10px;overflow:hidden;background:#fbfefd;margin:6px 0 2px}
.calc-row{display:grid;grid-template-columns:1fr 1.15fr 12mm;gap:8px;align-items:center;padding:6px 9px;border-bottom:1px solid #e3eee9}
.calc-row:last-of-type{border-bottom:0}
.calc-label{font-family:"Trebuchet MS",sans-serif;font-size:9.5px;color:#5b7d72;line-height:1.35}
.calc-formula{font-family:"Courier New",monospace;font-size:10px;color:#12332b;overflow-wrap:anywhere}
.calc-value{justify-self:end;min-width:9mm;text-align:center;border:1.5px solid #0d5c46;border-radius:8px;
  background:#dff2e9;color:#0d5c46;font-weight:700;font-size:15px;padding:2px 0}
.calc-note{margin:0!important;padding:4px 9px!important;border-top:1px dotted #cfe4d9;color:#7d998f;font-size:8.5px!important;font-style:italic}
[data-print="basics"] .lec-head,[data-print="basics"] .lec-row{grid-template-columns:22mm 1fr 1fr 1fr}
[data-print="basics"] .lec-number span{display:none}
`;


export function buildReportHtml(a: Analysis, bodyHtml: string) {
  const U = getPack(a.input.lang).ui;
  const printed = `${U["printedOn"] ?? "Printed on"}: ${printedOnText()}`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>NAMAANK — ${esc(a.input.name)}</title>
<style>${CSS}</style></head>
<body>
${coverPage(a)}
<main class="doc">${bodyHtml}${thanksPage(a)}</main>
<p class="doc-foot">${esc(ANALYST.brand)} · ${esc(U["analysisBy"] ?? "Analysis by")} ${esc(ANALYST.name)} · ${esc(printed)}</p>
</body></html>`;
}

/** Opens a print-ready window so the user can save a clean PDF. */
export function printReport(a: Analysis, bodyHtml: string) {
  const html = buildReportHtml(a, bodyHtml);
  const w = window.open("", "_blank", "width=900,height=1200");
  if (!w) {
    window.alert(getPack(a.input.lang).ui["printBlocked"] ?? "Please allow popups and try again.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  const go = () => {
    w.print();
  };
  if (w.document.readyState === "complete") setTimeout(go, 350);
  else w.addEventListener("load", () => setTimeout(go, 350));
}
