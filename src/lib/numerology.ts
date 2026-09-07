// NAMAANK core numerology engine — Chaldean + Indian (Lo Shu).
// The engine is language-neutral: it returns numbers and keys only.
// Every user-visible word comes from a language pack (src/lib/langs).

import type { ColorKey, DirKey, DayPartKey, Lang, PlaneKey, RelKey } from "./langs/types";

export type Gender = "purush" | "mahila";

export interface BirthInput {
  name: string;
  dob: string; // yyyy-mm-dd
  time: string; // HH:mm (required)
  timezone: string; // IANA
  gender: Gender;
  place: string;
  lat?: number;
  lon?: number;
  mobile: string;
  email: string;
  lang: Lang;
}

export const reduce1to9 = (n: number): number => {
  let x = Math.abs(n);
  while (x > 9) x = String(x).split("").reduce((a, d) => a + Number(d), 0);
  return x === 0 ? 0 : x;
};

export const digitSum = (s: string): number =>
  s.replace(/\D/g, "").split("").reduce((a, d) => a + Number(d), 0);

const FRIENDS: Record<number, number[]> = {
  1: [1, 2, 3, 5, 6, 9],
  2: [1, 2, 3, 5, 7],
  3: [1, 2, 3, 5, 6, 7, 9],
  4: [1, 5, 6, 7, 8],
  5: [1, 3, 5, 6, 9],
  6: [1, 3, 4, 5, 6, 8],
  7: [2, 3, 4, 5, 7],
  8: [4, 5, 6, 8],
  9: [1, 2, 3, 5, 6, 9],
};

const ENEMIES: Record<number, number[]> = {
  1: [4, 8],
  2: [4, 8, 9],
  3: [4, 8],
  4: [2, 3, 9],
  5: [2, 4, 8],
  6: [2, 7, 9],
  7: [1, 6, 8, 9],
  8: [1, 2, 3, 7, 9],
  9: [4, 7, 8],
};

export const LUCKY_SET: Record<number, number[]> = {
  1: [1, 2, 3, 5, 6, 9],
  2: [1, 2, 3, 5, 7],
  3: [1, 2, 3, 5, 6, 9],
  4: [1, 5, 6, 7],
  5: [1, 3, 5, 6],
  6: [1, 3, 5, 6, 8],
  7: [2, 3, 5, 7],
  8: [4, 5, 6, 8],
  9: [1, 3, 5, 6, 9],
};

export const BAD_SET: Record<number, number[]> = {
  1: [4, 8],
  2: [4, 8, 9],
  3: [4, 6, 8],
  4: [2, 3, 9],
  5: [2, 4, 8],
  6: [2, 7, 9],
  7: [1, 6, 8, 9],
  8: [1, 2, 3, 9],
  9: [4, 7, 8],
};

export const relation = (a: number, b: number): RelKey => {
  if (FRIENDS[a]?.includes(b)) return "mitra";
  if (ENEMIES[a]?.includes(b)) return "shatru";
  return "sam";
};

/** Colour keys per number — names come from the language pack. */
export const COLORS: Record<number, { lucky: ColorKey[]; bad: ColorKey[] }> = {
  1: { lucky: ["golden", "orange", "yellow"], bad: ["deepBlue", "blackSlate"] },
  2: { lucky: ["white", "cream", "silver"], bad: ["deepRed", "slate"] },
  3: { lucky: ["yellow", "saffron", "golden"], bad: ["slate", "deepBrown"] },
  4: { lucky: ["grey", "electricBlue", "khaki"], bad: ["deepRed"] },
  5: { lucky: ["green", "turquoise", "lightGrey"], bad: ["slate", "deepBrown"] },
  6: { lucky: ["white", "pink", "lightBlue"], bad: ["slate", "chestnut"] },
  7: { lucky: ["lightGreen", "smokyGrey", "white"], bad: ["deepRed", "slate"] },
  8: { lucky: ["blue", "grey", "deepGreen"], bad: ["red", "deepSaffron"] },
  9: { lucky: ["red", "coral", "saffron"], bad: ["slate", "grey"] },
};

export const CHALDEAN: Record<string, number> = {
  A: 1, I: 1, J: 1, Q: 1, Y: 1,
  B: 2, K: 2, R: 2,
  C: 3, G: 3, L: 3, S: 3,
  D: 4, M: 4, T: 4,
  E: 5, H: 5, N: 5, X: 5,
  U: 6, V: 6, W: 6,
  O: 7, Z: 7,
  F: 8, P: 8,
};

/** Weekday index (0 = Sunday) -> ruling number. Names live in the pack. */
export const DAY_NUMBER: Record<number, number> = {
  0: 1,
  1: 2,
  2: 9,
  3: 5,
  4: 3,
  5: 6,
  6: 8,
};

/** Lo Shu grid positions */
export const LOSHU_LAYOUT = [4, 9, 2, 3, 5, 7, 8, 1, 6];

export const PLANE_CELLS: { key: PlaneKey; cells: number[] }[] = [
  { key: "mental", cells: [4, 9, 2] },
  { key: "emotional", cells: [3, 5, 7] },
  { key: "practical", cells: [8, 1, 6] },
  { key: "thought", cells: [4, 3, 8] },
  { key: "will", cells: [9, 5, 1] },
  { key: "action", cells: [2, 7, 6] },
  { key: "golden", cells: [4, 5, 6] },
  { key: "silver", cells: [2, 5, 8] },
];

/** Kua number -> auspicious directions (keys). */
export const KUA_DIRS: Record<number, DirKey[]> = {
  1: ["N", "E", "SE", "S"],
  2: ["SW", "W", "NW", "NE"],
  3: ["E", "SE", "N", "S"],
  4: ["SE", "E", "S", "N"],
  5: ["SW", "NE", "W", "NW"],
  6: ["W", "NW", "NE", "SW"],
  7: ["W", "NW", "SW", "NE"],
  8: ["NE", "W", "NW", "SW"],
  9: ["S", "E", "SE", "N"],
};

export interface Analysis {
  input: BirthInput;
  effectiveDate: string;
  day: number;
  month: number;
  year: number;
  driver: number;
  conductor: number;
  kua: number;
  kuaBehavesAs: number;
  kuaDirs: DirKey[];
  weekdayIndex: number;
  dayNumber: number;
  timeNumber: number;
  dayPart: DayPartKey;
  utcInstant: string;
  grid: Record<number, number>;
  missing: number[];
  repeated: number[];
  lotteryNumbers: number[];
  activePlanes: PlaneKey[];
  finalLucky: number[];
  finalBad: number[];
  luckyColors: ColorKey[];
  badColors: ColorKey[];
  name: { compound: number; single: number; first: number; letters: { ch: string; v: number }[] };
  mobile: {
    total: number;
    single: number;
    zeros: number;
    pairs: { pair: string; sum: number; single: number; rel: RelKey }[];
    first4: number;
    last4: number;
    repeated: number[];
    absent: number[];
  };
  personalYear: { year: number; number: number; formula: string };
  nextYears: { year: number; number: number }[];
  yearPlans: { year: number; number: number; formula: string; months: { m: number; number: number }[] }[];
  seed: number;
}

/** Identity string: sirf yahi 6 cheezein user ko "same user" banati hain. */
export const identityKey = (i: BirthInput): string => {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const digits = (s: string) => s.replace(/\D/g, "").slice(-10);
  return [norm(i.name), i.dob.trim(), i.time.trim(), norm(i.place), digits(i.mobile), norm(i.email)].join("|");
};

/** Deterministic hash of the user's identity details. */
export const detailsHash = (i: BirthInput): number => {
  const s = identityKey(i);
  let h = 2166136261;
  for (let k = 0; k < s.length; k++) {
    h ^= s.charCodeAt(k);
    h = Math.imul(h, 16777619);
  }
  // second pass so tiny changes (ek letter) bhi seed poora badal de
  let g = 5381;
  for (let k = s.length - 1; k >= 0; k--) g = (Math.imul(g, 33) ^ s.charCodeAt(k)) >>> 0;
  return Math.abs((h ^ Math.imul(g, 2654435761)) >>> 0) || 1;
};

/**
 * Report seed = sirf details ka hash.
 * Matlab: bilkul same details -> bilkul same report (dobara bhi).
 * Naam/time/place/mobile/email mein zara sa bhi farq -> poori tarah alag
 * upay, remedies aur prose. Same DOB wale do log kabhi same report nahi payenge.
 */
export const makeSeed = (i: BirthInput): number => detailsHash(i);



const tzOffsetMinutes = (timeZone: string, date: Date): number => {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const parts = dtf.formatToParts(date);
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    const asUTC = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
    return (asUTC - date.getTime()) / 60000;
  } catch {
    return 0;
  }
};

export function analyze(input: BirthInput, seedOverride?: number): Analysis {
  const seed = seedOverride ?? makeSeed(input);

  const dparts = input.dob.split("-").map(Number);
  const y0 = dparts[0] ?? 2000;
  const m0 = dparts[1] ?? 1;
  const d0 = dparts[2] ?? 1;
  const tparts = input.time.split(":").map(Number);
  const hh = tparts[0] ?? 12;
  const mm = tparts[1] ?? 0;

  // Din raat 12 baje se badalta hai — calendar date hi effective date hai
  const base = new Date(Date.UTC(y0, m0 - 1, d0));
  const year = base.getUTCFullYear();
  const month = base.getUTCMonth() + 1;
  const day = base.getUTCDate();
  const effectiveDate = `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}.${year}`;

  const naive = Date.UTC(y0, m0 - 1, d0, hh, mm);
  const off = tzOffsetMinutes(input.timezone, new Date(naive));
  const utc = new Date(naive - off * 60000);

  const driver = reduce1to9(day);
  const conductor = reduce1to9(digitSum(`${year}${month}${day}`));
  const yearTotal = reduce1to9(digitSum(String(year)));
  let kua = input.gender === "purush" ? 11 - yearTotal : 4 + yearTotal;
  kua = reduce1to9(kua);
  const kuaBehavesAs = kua === 5 ? (input.gender === "purush" ? 2 : 8) : kua;

  const grid: Record<number, number> = {};
  for (let n = 1; n <= 9; n++) grid[n] = 0;
  const dobDigits = `${String(day).padStart(2, "0")}${String(month).padStart(2, "0")}${year}`
    .split("")
    .map(Number)
    .filter((n) => n !== 0);
  dobDigits.forEach((n) => (grid[n] = (grid[n] ?? 0) + 1));
  const dobOnly = { ...grid };
  [driver, conductor, kua].forEach((n) => {
    if (n >= 1 && n <= 9) grid[n] = (grid[n] ?? 0) + 1;
  });

  const missing = Object.keys(grid).map(Number).filter((n) => (grid[n] ?? 0) === 0);
  const repeated = Object.keys(grid).map(Number).filter((n) => (grid[n] ?? 0) > 1);
  const lotteryNumbers = Object.keys(grid)
    .map(Number)
    .filter((n) => (dobOnly[n] ?? 0) === 0 && (grid[n] ?? 0) > 0);

  const activePlanes = PLANE_CELLS.filter((p) => p.cells.every((c) => (grid[c] ?? 0) > 0)).map((p) => p.key);

  const dLucky = LUCKY_SET[driver] ?? [];
  const badUnion = Array.from(new Set([...(BAD_SET[driver] ?? []), ...(BAD_SET[conductor] ?? [])])).sort();
  const finalLucky = dLucky.filter((n) => !badUnion.includes(n));

  const cD = COLORS[driver] ?? { lucky: [], bad: [] };
  const cC = COLORS[conductor] ?? { lucky: [], bad: [] };
  const luckyColors = Array.from(new Set([...cD.lucky, ...cC.lucky]));
  const badColors = Array.from(new Set([...cD.bad, ...cC.bad]));

  // Name (Chaldean)
  const clean = input.name.toUpperCase().replace(/[^A-Z ]/g, "");
  const letters = clean.replace(/ /g, "").split("").map((ch) => ({ ch, v: CHALDEAN[ch] ?? 0 }));
  const compound = letters.reduce((a, l) => a + l.v, 0);
  const firstWord = clean.trim().split(/\s+/)[0] ?? "";
  const first = reduce1to9(firstWord.split("").reduce((a, ch) => a + (CHALDEAN[ch] ?? 0), 0));

  // Mobile
  const mob = input.mobile.replace(/\D/g, "");
  const mTotal = digitSum(mob);
  const pairs: Analysis["mobile"]["pairs"] = [];
  for (let i = 0; i + 1 < mob.length; i++) {
    const x = Number(mob[i] ?? 0);
    const y = Number(mob[i + 1] ?? 0);
    const rx = x === 0 ? y : x;
    const ry = y === 0 ? x : y;
    const rel: RelKey = x === 0 || y === 0 ? "sam" : relation(rx, ry);
    pairs.push({ pair: `${mob[i]}${mob[i + 1]}`, sum: x + y, single: reduce1to9(x + y), rel });
  }
  const digitsCount: Record<number, number> = {};
  mob.split("").forEach((d) => (digitsCount[Number(d)] = (digitsCount[Number(d)] ?? 0) + 1));
  const mobRepeated = Object.keys(digitsCount).map(Number).filter((d) => d !== 0 && (digitsCount[d] ?? 0) > 1);
  const mobAbsent = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => !digitsCount[d]);

  // Personal year: DOB day+month with the running year
  const cy = new Date().getFullYear();
  const pad = (n: number) => String(n).padStart(2, "0");
  const pyNum = reduce1to9(digitSum(`${pad(d0)}${pad(m0)}${cy}`));
  const nextYears = [1, 2, 3, 4, 5].map((k) => ({
    year: cy + k,
    number: reduce1to9(digitSum(`${pad(d0)}${pad(m0)}${cy + k}`)),
  }));
  const yearPlans = [0, 1, 2, 3, 4, 5].map((k) => {
    const yy = cy + k;
    const num = reduce1to9(digitSum(`${pad(d0)}${pad(m0)}${yy}`));
    return {
      year: yy,
      number: num,
      formula: `${pad(d0)}.${pad(m0)}.${yy} = ${num}`,
      months: Array.from({ length: 12 }, (_, i) => ({ m: i + 1, number: reduce1to9(num + i + 1) })),
    };
  });

  const weekdayIndex = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const timeNumber = reduce1to9(hh + mm);
  const dayPart: DayPartKey =
    hh < 6 ? "lateNight" : hh < 12 ? "morning" : hh < 16 ? "afternoon" : hh < 20 ? "evening" : "night";

  return {
    input,
    effectiveDate,
    day,
    month,
    year,
    driver,
    conductor,
    kua,
    kuaBehavesAs,
    // Kua 5 apni disha nahi rakhta — Disha / Vastu / Urja ke liye behavesAs kua lagu hota hai
    kuaDirs: KUA_DIRS[kuaBehavesAs] ?? KUA_DIRS[1]!,

    weekdayIndex,
    dayNumber: DAY_NUMBER[weekdayIndex] ?? 1,
    timeNumber,
    dayPart,
    utcInstant: utc.toISOString().replace("T", " ").slice(0, 16) + " UTC",
    grid,
    missing,
    repeated,
    lotteryNumbers,
    activePlanes,
    finalLucky,
    finalBad: badUnion,
    luckyColors,
    badColors,
    name: { compound, single: reduce1to9(compound), first, letters },
    mobile: {
      total: mTotal,
      single: reduce1to9(mTotal),
      zeros: (mob.match(/0/g) ?? []).length,
      pairs,
      first4: reduce1to9(digitSum(mob.slice(0, 4))),
      last4: reduce1to9(digitSum(mob.slice(-4))),
      repeated: mobRepeated,
      absent: mobAbsent,
    },
    personalYear: { year: cy, number: pyNum, formula: `${pad(d0)}.${pad(m0)}.${cy} = ${pyNum}` },
    nextYears,
    yearPlans,
    seed,
  };
}
