import { Link } from "@tanstack/react-router";
import { Menu, MoonStar, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

const nav = [
  { label: "Home", to: "/" as const },
  { label: "Services", to: "/services" as const },
  { label: "Calculator", to: "/calculator" as const },
  { label: "Reports", to: "/report" as const },
  { label: "Book Consultation", to: "/consultation" as const },
  { label: "Contact", to: "/contact" as const },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2" aria-label="Namaank home">
          <MoonStar className="size-5 text-accent" />
          <span className="font-display text-lg font-bold glow-text">NAMAANK</span>
        </Link>
        <nav className="hidden items-center gap-5 lg:flex" aria-label="Main navigation">
          {nav.map((item) => (
            <Link key={item.to} to={item.to} activeOptions={{ exact: item.to === "/" }} className="text-xs text-muted-foreground transition hover:text-primary" activeProps={{ className: "text-xs font-semibold text-primary" }}>
              {item.label}
            </Link>
          ))}
        </nav>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen((value) => !value)} aria-label={open ? "Close menu" : "Open menu"}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>
      {open && (
        <nav className="grid border-t border-border/60 px-4 py-3 lg:hidden" aria-label="Mobile navigation">
          {nav.map((item) => (
            <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="border-b border-border/40 py-3 text-sm text-foreground last:border-0" activeProps={{ className: "border-b border-border/40 py-3 text-sm font-semibold text-primary last:border-0" }}>
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-card/30">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <p className="font-display text-xl font-bold glow-text">NAMAANK</p>
          <p className="mt-3 max-w-sm text-xs leading-6 text-muted-foreground">Astrology, numerology aur Vedic Jyotish ke madhyam se aapke jeevan ke patterns ko samajhne ki ek professional koshish.</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-accent">Quick Links</p>
          <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
            <Link to="/services" className="hover:text-primary">Services</Link>
            <Link to="/calculator" className="hover:text-primary">Calculators</Link>
            <Link to="/generate" className="hover:text-primary">Generate Report</Link>
            <Link to="/consultation" className="hover:text-primary">Consultation</Link>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-accent">Connect</p>
          <p className="mt-3 text-xs text-muted-foreground">Instagram · Facebook · YouTube</p>
          <p className="mt-4 text-[10px] leading-5 text-muted-foreground">Disclaimer: Readings self-reflection aur entertainment ke liye hain. Inka koi scientific proof nahi hai.</p>
        </div>
      </div>
      <div className="border-t border-border/40 px-4 py-4 text-center text-[10px] text-muted-foreground">© 2026 NAMAANK. All rights reserved.</div>
    </footer>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen"><SiteHeader />{children}<SiteFooter /></div>;
}
