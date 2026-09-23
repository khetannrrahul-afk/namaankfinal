import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Compass, Orbit, Sparkles, SunMedium } from "lucide-react";
import { SiteLayout } from "@/components/namaank/SiteChrome";
import { btnGhost, btnPrimary } from "@/components/panel/Ui";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({ meta: [
    { title: "NAMAANK — Astrology, Numerology & Vedic Jyotish" },
    { name: "description", content: "Personalised astrology, numerology and Vedic Jyotish reports, calculators and consultations from NAMAANK." },
    { property: "og:title", content: "NAMAANK — Decode Your Cosmic Blueprint" },
    { property: "og:description", content: "Explore numerology, astrology and Vedic Jyotish guidance with personalised reports." },
    { property: "og:url", content: "https://namaankfinal.lovable.app/" }, { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ], links:[{rel:"canonical",href:"https://namaankfinal.lovable.app/"}] }), component: Index,
});

const services=[
  {title:"Numerology",copy:"Life path, name vibration, lucky numbers aur destiny reports.",icon:Sparkles,to:"/services/numerology" as const},
  {title:"Astrology",copy:"Horoscope, zodiac compatibility aur transit forecasts.",icon:Orbit,to:"/services/astrology" as const},
  {title:"Vedic Jyotish",copy:"Kundli matching, dosha analysis aur gemstone guidance.",icon:SunMedium,to:"/services/jyotish" as const},
];
function Index(){return <SiteLayout><main>
  <section className="hero-grad relative overflow-hidden border-b border-border px-4 py-20 sm:py-28">
    <div className="mx-auto max-w-5xl text-center"><div className="mx-auto flex size-14 items-center justify-center rounded-full border border-accent/50 bg-background/30"><Compass className="size-7 text-accent"/></div><p className="mt-6 text-xs uppercase tracking-[0.3em] text-accent">Har Ank ke Rahasye</p><h1 className="mx-auto mt-5 max-w-4xl text-4xl font-bold leading-tight glow-text sm:text-6xl">Decode your cosmic blueprint</h1><p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-foreground/80 sm:text-base">Astrology, Numerology aur Vedic Jyotish ki ancient wisdom ke saath apne patterns, timing aur possibilities ko samjhein.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link to="/generate" className={btnPrimary}>Get Your Report <ArrowRight className="ml-2 size-4"/></Link><Link to="/calculator" className={btnGhost}>Calculate Your Numbers</Link></div></div>
  </section>
  <section className="mx-auto max-w-6xl px-4 py-16"><div className="mb-10 max-w-2xl"><p className="text-xs uppercase tracking-[0.3em] text-accent">Core Services</p><h2 className="mt-3 text-3xl font-bold">Three traditions. One deeper view.</h2><p className="mt-4 text-sm leading-7 text-muted-foreground">Har system alag lens deta hai—numbers, celestial movement aur Vedic graha patterns.</p></div><div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">{services.map((s)=><article key={s.title} className="bg-background p-7 sm:p-8"><s.icon className="size-7 text-accent"/><h3 className="mt-6 text-xl text-primary">{s.title}</h3><p className="mt-3 min-h-16 text-sm leading-7 text-muted-foreground">{s.copy}</p><Link to={s.to} className="mt-5 inline-flex text-xs font-semibold text-accent">Explore service →</Link></article>)}</div></section>
  <section className="border-y border-border bg-card/35 px-4 py-16"><div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-[1.2fr_.8fr]"><div><p className="text-xs uppercase tracking-[0.3em] text-accent">Personalised Report</p><h2 className="mt-3 text-3xl font-bold">Your details. Your patterns. Your guidance.</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">Numerology, Jyotish, Vastu aur chosen focus area ko ek clear, structured report mein dekhein.</p></div><div className="flex flex-col gap-3 md:items-end"><Link to="/generate" className={btnPrimary}>Generate Report</Link><Link to="/report" className={btnGhost}>View My Reports</Link></div></div></section>
  <section className="px-4 py-16 text-center"><p className="text-xs uppercase tracking-[0.3em] text-accent">Need personal clarity?</p><h2 className="mt-3 text-3xl font-bold">Speak with a guide</h2><p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted-foreground">Career, relationships, wellbeing ya general direction par focused consultation request karein.</p><Link to="/consultation" className={`${btnPrimary} mt-7`}>Book Consultation</Link></section>
</main></SiteLayout>}
