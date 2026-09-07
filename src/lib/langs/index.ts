import type { Lang, LangPack } from "./types";
import * as hinBase from "./hinglish/base";
import * as hinRep from "./hinglish/report";
import * as hiBase from "./hindi/base";
import * as hiRep from "./hindi/report";
import * as enBase from "./english/base";
import * as enRep from "./english/report";
import * as bnBase from "./bengali/base";
import * as bnRep from "./bengali/report";

type Base = typeof hinBase;
type Rep = typeof hinRep;

const build = (code: Lang, label: string, b: Base, r: Rep): LangPack => ({
  code,
  label,
  ui: b.ui,
  planets: b.planets,
  weekdays: b.weekdays,
  dayLords: b.dayLords,
  dayParts: b.dayParts,
  months: b.months,
  colors: b.colors,
  dirs: b.dirs,
  rel: b.rel,
  numbers: b.numbers,
  meanings: b.meanings,
  missingRemedy: b.missingRemedy,
  compat: b.compat,
  kua: b.kua,
  planes: b.planes,
  personalYear: b.personalYear,
  personalMonth: b.personalMonth,
  monthAction: b.monthAction,
  dyn: r.dyn,
  upay: r.upay,
  report: r.report,
});

const PACKS: Record<Lang, LangPack> = {
  hinglish: build("hinglish", "Hinglish", hinBase, hinRep),
  hindi: build("hindi", "हिन्दी", hiBase as unknown as Base, hiRep as unknown as Rep),
  english: build("english", "English", enBase as unknown as Base, enRep as unknown as Rep),
  bengali: build("bengali", "বাংলা", bnBase as unknown as Base, bnRep as unknown as Rep),
};

export const getPack = (lang: Lang): LangPack => PACKS[lang] ?? PACKS.hinglish;
export * from "./types";

export const LANG_LABELS: Record<Lang, string> = {
  hinglish: "Hinglish",
  hindi: "हिन्दी (Hindi)",
  english: "English",
  bengali: "বাংলা (Bengali)",
};
