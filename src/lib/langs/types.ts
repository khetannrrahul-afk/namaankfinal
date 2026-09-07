// Language pack contract for NAMAANK.
// The numerology engine stays language-neutral (it returns numbers + keys);
// every user-visible word comes from a pack below.

export type Lang = "hinglish" | "hindi" | "english" | "bengali";

export const LANGS: { code: Lang; label: string; native: string }[] = [
  { code: "hinglish", label: "Hinglish", native: "Hinglish (Roman)" },
  { code: "hindi", label: "Hindi", native: "हिन्दी" },
  { code: "english", label: "English", native: "English" },
  { code: "bengali", label: "Bengali", native: "বাংলা" },
];

export type ColorKey =
  | "golden"
  | "orange"
  | "yellow"
  | "deepBlue"
  | "blackSlate"
  | "white"
  | "cream"
  | "silver"
  | "deepRed"
  | "slate"
  | "saffron"
  | "deepBrown"
  | "grey"
  | "electricBlue"
  | "khaki"
  | "green"
  | "turquoise"
  | "lightGrey"
  | "pink"
  | "lightBlue"
  | "chestnut"
  | "lightGreen"
  | "smokyGrey"
  | "blue"
  | "deepGreen"
  | "red"
  | "deepSaffron"
  | "coral";

export type DirKey = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";

export type DayPartKey = "lateNight" | "morning" | "afternoon" | "evening" | "night";

export type RelKey = "mitra" | "shatru" | "sam";

export type PlaneKey =
  | "mental"
  | "emotional"
  | "practical"
  | "thought"
  | "will"
  | "action"
  | "golden"
  | "silver";

export interface NumData {
  planet: string;
  title: string;
  short: string;
  keywords: string[];
  strengths: string[];
  weaknesses: string[];
  career: string[];
  money: string[];
  love: string[];
  health: string[];
  remedy: string[];
}

/** Page keys of the full life report, in print order. */
export type PageKey =
  | "sutra"
  | "personality"
  | "driverConductor"
  | "kua"
  | "luckyNumbers"
  | "colors"
  | "strengths"
  | "weaknesses"
  | "childhood"
  | "youth"
  | "midLife"
  | "maturity"
  | "career"
  | "money"
  | "love"
  | "family"
  | "health"
  | "education"
  | "chart"
  | "planes"
  | "yogas"
  | "nameNum"
  | "mobileNum"
  | "mobilePairs"
  | "remedies"
  | "year";

export interface ReportPage {
  /** Page heading; may contain {driver} {conductor} {kua} {year} placeholders. */
  title: string;
  /** Large bank of prose lines — the generator picks a seeded, non-repeating subset. */
  bank: string[];
}

export interface LangPack {
  code: Lang;
  label: string;

  ui: Record<string, string>;

  planets: Record<number, string>;
  weekdays: string[]; // index 0 = Sunday
  dayLords: string[]; // lord of each weekday, index 0 = Sunday
  dayParts: Record<DayPartKey, string>;
  months: string[];
  colors: Record<ColorKey, string>;
  dirs: Record<DirKey, string>;
  rel: Record<RelKey, string>;

  numbers: Record<number, NumData>;
  meanings: string[]; // 9 primer lines for 1..9
  missingRemedy: Record<number, string>;
  compat: Record<RelKey, { verdict: string; points: string[] }>;
  kua: Record<number, { element: string; trigram: string; msg: string }>;
  planes: Record<PlaneKey, { label: string; meaning: string }>;
  personalYear: Record<number, { theme: string; points: string[] }>;
  personalMonth: Record<number, string>;
  monthAction: Record<number, string>;

  /** Reusable one-line templates used by the generator for computed facts. */
  dyn: Record<string, string>;
  /** Remedy bank — every report gets its own seeded, non-repeating combination. */
  upay: string[];
  /** Full life report page definitions. */
  report: Record<PageKey, ReportPage>;
}

/** `fmt("Driver {d} ...", { d: 3 })` */
export const fmt = (tpl: string, vars: Record<string, string | number | undefined>): string =>
  tpl.replace(/\{(\w+)\}/g, (_, k: string) => {
    const v = vars[k];
    return v === undefined || v === null || v === "" ? "—" : String(v);
  });
