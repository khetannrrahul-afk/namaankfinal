import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import InputForm from "@/components/namaank/InputForm";
import Report from "@/components/namaank/Report";
import { analyze, type Analysis, type BirthInput } from "@/lib/numerology";
import { isContactBlocked, saveSubmission } from "@/lib/submissions";
import type { Lang } from "@/lib/langs/types";


export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Free Numerology Report in Hindi — NAMAANK" },
      {
        name: "description",
        content:
          "Free numerology report in Hindi/Hinglish: Chaldean aur Lo Shu se driver, conductor, kua, birth chart, lucky numbers aur 23-page full life report.",
      },
      { property: "og:title", content: "Free Numerology Report in Hindi — NAMAANK" },
      {
        property: "og:description",
        content: "Janm tarikh, samay aur sthaan se banaya gaya vistrit numerology report — 23 pages full life report ke saath.",
      },
      { property: "og:url", content: "https://namaankfinal.lovable.app/" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://namaankfinal.lovable.app/" }],
  }),
  component: Index,
});

function Index() {
  const [result, setResult] = useState<Analysis | null>(null);

  // Language export se pehle kabhi bhi badla ja sakta hai — seed wahi rehta hai,
  // isliye sirf bhasha badalti hai, analysis nahi.
  const changeLang = (lang: Lang) => {
    setResult((prev) => (prev ? analyze({ ...prev.input, lang }, prev.seed) : prev));
  };

  // Details database mein save hoti hain; admin ne deactivate kiya ho to report nahi banegi.
  const handleSubmit = async (v: BirthInput): Promise<string | null> => {
    if (await isContactBlocked(v.mobile, v.email)) {
      return "Aapka access admin dwara deactivate kiya gaya hai. Kripya support se sampark karein.";
    }
    const err = await saveSubmission(v);
    if (err) return `Details save nahi ho payi: ${err}`;
    setResult(analyze(v));
    return null;
  };

  return (
    <main className="min-h-screen">
      <header className="hero-grad relative border-b border-border px-4 py-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight glow-text sm:text-5xl">
          NAMAANK — Free Numerology Report in Hindi
        </h1>
        <p className="mt-2 text-sm tracking-[0.3em] text-accent uppercase">Har Ank ke Rahasye</p>
        <p className="mx-auto mt-3 max-w-md text-xs text-foreground/80">
          Chaldean + Indian (Lo Shu) numerology calculator in Hindi · janm tarikh, samay aur sthaan par aadharit
        </p>
      </header>


      <div className="px-4 py-8">
        {result ? (
          <Report a={result} onReset={() => setResult(null)} onLangChange={changeLang} />
        ) : (
          <InputForm onSubmit={handleSubmit} />
        )}
      </div>
    </main>
  );
}

