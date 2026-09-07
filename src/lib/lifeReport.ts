import type { Analysis } from "./numerology";
import { relation, PLANE_CELLS, DAY_NUMBER, COLORS } from "./numerology";
import { getPack, fmt, type LangPack, type PageKey } from "./langs";
import { Picker } from "./variation";

export interface ReportPage {
  no: number;
  title: string;
  points: string[];
}

/** Every user-visible value the templates can reference. */
export function reportVars(a: Analysis, L: LangPack): Record<string, string | number | undefined> {
  const D = L.numbers[a.driver]!;
  const C = L.numbers[a.conductor]!;
  const K = L.numbers[a.kuaBehavesAs]!;
  // Disha / Vastu / Urja ke liye Kua 5 nahi, uska behaves-as kua chalta hai
  const kua = L.kua[a.kuaBehavesAs]!;
  const dirNames = a.kuaDirs.map((d) => L.dirs[d]);
  const lc = a.luckyColors.map((c) => L.colors[c]);
  const bc = a.badColors.map((c) => L.colors[c]);
  return {
    name: a.input.name.split(" ")[0] ?? a.input.name,
    fullName: a.input.name,
    driver: a.driver,
    conductor: a.conductor,
    kua: a.kua,
    kuaEff: a.kuaBehavesAs,
    kuaBehavesAs: a.kuaBehavesAs,
    dp: D.planet,
    cp: C.planet,
    kp: K.planet,
    driverShort: D.short,
    conductorShort: C.short,
    element: kua.element,
    trigram: kua.trigram,

    lucky: a.finalLucky.join(", "),
    bad: a.finalBad.join(", "),
    luckyFirst: a.finalLucky[0] ?? a.driver,
    luckyColors: lc.join(", "),
    badColors: bc.join(", "),
    lc1: lc[0] ?? "",
    lc2: lc[1] ?? lc[0] ?? "",
    bc1: bc[0] ?? "",
    dirsAll: dirNames.join(", "),
    dir1: dirNames[0] ?? "",
    dir2: dirNames[1] ?? dirNames[0] ?? "",
    dir3: dirNames[2] ?? dirNames[0] ?? "",
    weekday: L.weekdays[a.weekdayIndex] ?? "",
    dayLord: L.dayLords[a.weekdayIndex] ?? "",
    dayKeyword: L.numbers[a.dayNumber]?.keywords[0] ?? "",
    dayPart: L.dayParts[a.dayPart],
    timeNumber: a.timeNumber,
    time: a.input.time,
    date: a.effectiveDate,
    day: a.day,
    place: a.input.place,
    mobile: a.input.mobile,
    email: a.input.email,
    missing: a.missing.join(", ") || L.ui["none"]!,
    missingFirst: a.missing[0] ?? a.driver,
    repeated: a.repeated.join(", ") || L.ui["none"]!,
    lottery: a.lotteryNumbers.join(", "),
    nameSingle: a.name.single,
    mobileSingle: a.mobile.single,
    relText: L.rel[relation(a.driver, a.conductor)],
    verdict: L.compat[relation(a.driver, a.conductor)]!.verdict,
  };
}

export function buildLifeReport(a: Analysis): ReportPage[] {
  const L = getPack(a.input.lang);
  const D = L.numbers[a.driver]!;
  const C = L.numbers[a.conductor]!;
  const K = L.numbers[a.kuaBehavesAs]!;
  const rel = relation(a.driver, a.conductor);
  const compat = L.compat[rel]!;
  const kua = L.kua[a.kuaBehavesAs]!;
  const V = reportVars(a, L);
  const dyn = (k: string) => L.dyn[k] ?? "";
  const t = (key: string, extra: Record<string, string | number | undefined> = {}) => fmt(dyn(key), { ...V, ...extra });
  const r = (s: string, extra: Record<string, string | number | undefined> = {}) => fmt(s, { ...V, ...extra });

  const p = new Picker(a.seed);
  const pages: ReportPage[] = [];

  const add = (key: PageKey, dynamic: string[], titleVars: Record<string, string | number | undefined> = {}) => {
    const def = L.report[key];
    const out = p.take(dynamic);
    // 2 seeded remedies per page — never repeated anywhere in the report
    out.push(...p.pick(L.upay, 2, (s) => `${dyn("upayPrefix")}${r(s)}`));
    // top up with page-specific prose until the page is full
    out.push(...p.pick(def.bank, Math.max(0, 18 - out.length), (s) => r(s)));
    pages.push({ no: pages.length + 1, title: r(def.title, titleVars), points: out });
  };

  add("sutra", [
    t("intro"),
    t("conductorLine"),
    t("relLine"),
    t("kuaLine"),
    a.kua === 5 ? t("kua5") : "",
    t("birthLine"),
    t("dayLine"),
    t("timeLine"),
    t("placeLine"),
    ...compat.points,
    t("luckyLine"),
    t("colorLine"),
  ]);

  add("personality", [
    ...D.strengths.slice(0, 3),
    ...C.weaknesses.slice(0, 2),
    ...D.keywords.map((k) => k),
    ...C.keywords.slice(0, 2),
  ]);

  add("driverConductor", [
    `${D.title} — ${D.short}`,
    `${C.title} — ${C.short}`,
    ...D.strengths.map((s) => t("strengthDriver", { text: s })),
    ...D.weaknesses.map((s) => t("strengthDriver", { text: s })),
    ...C.strengths.slice(0, 4).map((s) => t("strengthConductor", { text: s })),
    ...C.weaknesses.slice(0, 3).map((s) => t("strengthConductor", { text: s })),
    ...compat.points,
  ]);

  add("kua", [
    t("kuaLine"),
    t("dirLine"),
    kua.msg,
    t("strengthKua", { text: K.strengths[1] ?? K.strengths[0] }),
    t("strengthKua", { text: K.weaknesses[0] }),
    a.kua === 5 ? t("kua5") : "",
  ]);

  add("luckyNumbers", [t("luckyLine"), t("colorLine")]);

  const dayColors = Array.from({ length: 7 }, (_, i) => {
    const num = DAY_NUMBER[i] ?? 1;
    const c = COLORS[num]!;
    const support = a.finalLucky.includes(num);
    const wear = support ? L.colors[c.lucky[0]!] : String(V["lc1"] ?? "");
    return t("dayColor", {
      day: L.weekdays[i] ?? "",
      lord: L.dayLords[i] ?? "",
      num,
      wear,
      avoid: c.bad.map((x) => L.colors[x]).join(", "),
      note: support ? (dyn("dayColorGood")) : (dyn("dayColorCare")),
    });
  });
  add("colors", [t("colorLine"), ...dayColors]);

  add("strengths", [
    ...D.strengths.map((s) => t("strengthDriver", { text: s })),
    ...C.strengths.map((s) => t("strengthConductor", { text: s })),
    ...K.strengths.slice(0, 2).map((s) => t("strengthKua", { text: s })),
    ...a.repeated.map((n) => t("repeatedItem", { n, planet: L.planets[n], weakness: L.numbers[n]!.strengths[0] })),
  ]);

  add("weaknesses", [
    ...D.weaknesses.map((s) => t("strengthDriver", { text: s })),
    ...C.weaknesses.map((s) => t("strengthConductor", { text: s })),
    ...K.weaknesses.slice(0, 2).map((s) => t("strengthKua", { text: s })),
    a.missing.length ? t("missingLine") : t("noMissing"),
    ...a.missing.map((n) =>
      t("missingItem", {
        n,
        planet: L.planets[n],
        weakness: L.numbers[n]!.weaknesses[0],
        remedy: L.missingRemedy[n],
      }),
    ),
  ]);

  add("childhood", [t("dayLine")]);
  add("youth", [`${D.career[0]} · ${C.career[0]}`]);
  add("midLife", [t("relLine")]);
  add("maturity", [t("luckyLine")]);

  add("career", [
    t("careerDriver", { list: D.career.join(", ") }),
    t("careerConductor", { list: C.career.join(", ") }),
    t("careerMix", { a: D.career[0]!, b: C.career[1] ?? C.career[0]! }),
  ]);

  add("money", [...D.money, ...C.money, t("dirLine")]);
  add("love", [...D.love, ...C.love, t("luckyLine")]);
  add("family", [...D.love.slice(0, 1), t("dirLine")]);
  add("health", [...D.health, ...C.health]);
  add("education", [t("dirLine")]);

  add("chart", [
    a.missing.length ? t("missingLine") : t("noMissing"),
    ...a.missing.map((n) =>
      t("missingItem", {
        n,
        planet: L.planets[n],
        weakness: L.numbers[n]!.weaknesses[0],
        remedy: L.missingRemedy[n],
      }),
    ),
    a.repeated.length ? t("repeatedLine") : t("noRepeated"),
    ...a.repeated.map((n) => t("repeatedItem", { n, planet: L.planets[n], weakness: L.numbers[n]!.weaknesses[0] })),
    t("centre", { state: a.grid[5] ? (dyn("centreFull")) : (dyn("centreEmpty")) }),
    a.lotteryNumbers.length ? t("lotteryLine") : t("noLottery"),
  ]);

  add("planes", [
    ...PLANE_CELLS.map((pl) =>
      t("planeItem", {
        label: L.planes[pl.key]!.label,
        state: a.activePlanes.includes(pl.key) ? (dyn("planeActive")) : (dyn("planeIncomplete")),
        meaning: L.planes[pl.key]!.meaning,
      }),
    ),
    ...PLANE_CELLS.map((pl) =>
      t("planeNeed", {
        label: L.planes[pl.key]!.label,
        cells: pl.cells.join("-"),
        have: pl.cells.filter((c) => (a.grid[c] ?? 0) > 0).join(", ") || (L.ui["none"] ?? ""),
      }),
    ),
    a.activePlanes.length
      ? t("activePlanes", { list: a.activePlanes.map((k) => L.planes[k]!.label).join(", ") })
      : t("noActivePlane"),
  ]);

  add("yogas", [
    t("planeItem", {
      label: L.planes.golden.label,
      state: a.activePlanes.includes("golden") ? (dyn("planeActive")) : (dyn("planeIncomplete")),
      meaning: L.planes.golden.meaning,
    }),
    t("planeItem", {
      label: L.planes.silver.label,
      state: a.activePlanes.includes("silver") ? (dyn("planeActive")) : (dyn("planeIncomplete")),
      meaning: L.planes.silver.meaning,
    }),
  ]);

  add("nameNum", [
    t("nameLine", { compound: a.name.compound, namePlanet: L.planets[a.name.single] ?? "" }),
    t("nameFirst", { first: a.name.first }),
    t("nameRelD", { relName: L.rel[relation(a.name.single, a.driver)] }),
    t("nameRelC", { relNameC: L.rel[relation(a.name.single, a.conductor)] }),
    t("nameLetters", { letters: a.name.letters.map((l) => `${l.ch}=${l.v}`).join(", ") }),
    a.finalBad.includes(a.name.single) ? t("nameBad") : t("nameGood"),
  ]);

  add("mobileNum", [
    t("mobLine", { mobTotal: a.mobile.total, mobPlanet: L.planets[a.mobile.single] ?? "" }),
    t("mobZeros", { zeros: a.mobile.zeros }),
    t("mobFirst", { first4: a.mobile.first4 }),
    t("mobLast", { last4: a.mobile.last4 }),
    t("mobRep", {
      rep: a.mobile.repeated.join(", ") || (L.ui["none"] ?? ""),
      abs: a.mobile.absent.join(", ") || (L.ui["none"] ?? ""),
    }),
    t("mobRel", { relMob: L.rel[relation(a.mobile.single, a.driver)] }),
    a.finalBad.includes(a.mobile.single) ? t("mobBad") : t("mobGood"),
  ]);

  const mitra = a.mobile.pairs.filter((x) => x.rel === "mitra").length;
  const shatru = a.mobile.pairs.filter((x) => x.rel === "shatru").length;
  add("mobilePairs", [
    ...a.mobile.pairs.map((x) =>
      t("pairItem", {
        pair: x.pair,
        sum: x.sum,
        single: x.single,
        rel: L.rel[x.rel],
        effect:
          x.rel === "mitra"
            ? (dyn("pairMitra"))
            : x.rel === "shatru"
              ? (dyn("pairShatru"))
              : (dyn("pairSam")),
      }),
    ),
    t("pairCount", { m: mitra, s: shatru, n: a.mobile.pairs.length - mitra - shatru }),
    shatru > mitra ? t("pairVerdictBad") : t("pairVerdictGood"),
  ]);

  // Remedy page: a bigger, fully seeded remedy set — unique per report
  const remedyPage = L.report.remedies;
  const remedyLines = [t("remedyBasis"), ...p.pick(L.upay, 10, (s) => r(s))];
  pages.push({
    no: pages.length + 1,
    title: r(remedyPage.title),
    points: [...p.take(remedyLines), ...p.pick(remedyPage.bank, 6, (s) => r(s))],
  });

  a.yearPlans.forEach((yp) => {
    const py = L.personalYear[yp.number]!;
    add(
      "year",
      [
        t("yearCalc", { year: yp.year, formula: yp.formula }),
        t("yearTheme", { num: yp.number, theme: py.theme }),
        ...py.points,
        ...yp.months.map((m) =>
          t("monthLine", {
            month: L.months[m.m - 1] ?? "",
            year: yp.year,
            num: m.number,
            meaning: L.personalMonth[m.number] ?? "",
            action: L.monthAction[m.number] ?? "",
          }),
        ),
        t("yearStrong", {
          month: L.months[((yp.months.find((m) => [1, 5, 8].includes(m.number)) ?? yp.months[0]!).m) - 1] ?? "",
        }),
        t("yearWeak", {
          month: L.months[((yp.months.find((m) => [4, 7, 9].includes(m.number)) ?? yp.months[3]!).m) - 1] ?? "",
        }),
        t("yearRel", { num: yp.number, rel: L.rel[relation(yp.number, a.driver)] }),
      ],
      { year: yp.year },
    );
  });

  return pages;
}
