import { createFileRoute, Link } from "@tanstack/react-router";
import { Orbit, Sparkles, SunMedium } from "lucide-react";
import { SiteLayout } from "@/components/namaank/SiteChrome";
import { btnPrimary } from "@/components/panel/Ui";

export const Route = createFileRoute("/services")({
  staticData: { sitemap: true },
  head: () => ({ meta: [
    { title: "Astrology, Numerology & Jyotish Services — NAMAANK" },
    { name: "description", content: "Explore NAMAANK numerology, astrology and Vedic Jyotish services for personal guidance." },
    { property: "og:title", content: "Mystic Guidance Services — NAMAANK" },
    { property: "og:description", content: "Numerology, astrology and Vedic Jyotish guidance in one trusted place." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ]}), component: ServicesPage,
});

const services = [
  { title: "Numerology", icon: Sparkles, to: "/services/numerology" as const, copy: "Life path, name vibration, lucky numbers aur personalised destiny reports." },
  { title: "Astrology", icon: Orbit, to: "/services/astrology" as const, copy: "Western horoscope, zodiac compatibility aur important transit forecasts." },
  { title: "Vedic Jyotish", icon: SunMedium, to: "/services/jyotish" as const, copy: "Kundli matching, planetary dosha analysis aur gemstone recommendations." },
];
function ServicesPage() { return <SiteLayout><main><section className="hero-grad border-b border-border px-4 py-16 text-center"><p className="text-xs uppercase tracking-[0.3em] text-accent">Sacred systems · practical clarity</p><h1 className="mx-auto mt-4 max-w-3xl text-3xl font-bold glow-text sm:text-5xl">Guidance for every chapter of your journey</h1><p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-foreground/75">Ancient traditions ko clear, thoughtful aur modern interpretation ke saath samjhein.</p></section><section className="mx-auto grid max-w-6xl gap-px border-x border-border/60 bg-border/60 md:grid-cols-3">{services.map((s) => <article key={s.title} className="bg-background p-8 sm:p-10"><s.icon className="size-7 text-accent"/><h2 className="mt-6 text-xl font-semibold text-primary">{s.title}</h2><p className="mt-3 min-h-20 text-sm leading-7 text-muted-foreground">{s.copy}</p><Link to={s.to} className="mt-6 inline-flex text-xs font-semibold text-accent hover:text-primary">Explore {s.title} →</Link></article>)}</section><section className="border-t border-border/60 px-4 py-14 text-center"><h2 className="text-2xl font-bold text-foreground">Personalised insight chahiye?</h2><p className="mt-3 text-sm text-muted-foreground">Apni details se structured report generate karein.</p><Link to="/generate" className={`${btnPrimary} mt-6`}>Get Your Report</Link></section></main></SiteLayout>; }
