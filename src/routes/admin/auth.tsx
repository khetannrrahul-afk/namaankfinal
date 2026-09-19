import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAccount, homeFor } from "@/lib/account";
import { usernameAvailable } from "@/lib/signup.functions";
import { field, btnPrimary, PasswordInput } from "@/components/panel/Ui";
import { OtpBox } from "@/components/panel/OtpBox";

export const Route = createFileRoute("/admin/auth")({
  staticData: { sitemap: true },
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Sign In / Sign Up — NAMAANK" },
      { name: "description", content: "NAMAANK company admin account banayein — apne subadmins aur unke users ka poora control." },
      { property: "og:title", content: "Admin Sign In / Sign Up — NAMAANK" },
      { property: "og:description", content: "Company admin panel ke liye account banayein ya sign in karein." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://namaank2.lovable.app/admin/auth" }],
  }),
  component: AdminAuth,
});

const CODE_RE = /^[A-Z0-9_]{4,20}$/;

function AdminAuth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [f, setF] = useState({ company: "", username: "", mobile: "", whatsapp: "", email: "", password: "" });
  const [uState, setUState] = useState<"idle" | "checking" | "free" | "taken" | "bad">("idle");
  const [msg, setMsg] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
  const [otpFor, setOtpFor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    void (async () => {
      const a = await getAccount();
      if (a) navigate({ to: homeFor(a) });
    })();
  }, [navigate]);

  useEffect(() => {
    const u = f.username.trim();
    if (mode !== "up" || u.length === 0) return setUState("idle");
    if (!CODE_RE.test(u)) return setUState("bad");
    setUState("checking");
    const t = setTimeout(async () => {
      const free = await usernameAvailable({ data: u });
      setUState(free ? "free" : "taken");
    }, 400);
    return () => clearTimeout(t);
  }, [f.username, mode]);

  const afterAuth = async () => {
    const a = await getAccount();
    if (!a) return;
    if (a.isAdmin && a.admin && !a.admin.is_approved) {
      navigate({ to: "/admin" });
      return;
    }
    navigate({ to: homeFor(a) });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setBusy(true);

    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email: f.email, password: f.password });
      if (error) {
        if (error.message.toLowerCase().includes("not confirmed")) setOtpFor(f.email);
        setMsg({ kind: "error", text: error.message });
      } else {
        const a = await getAccount();
        if (a && !a.isAdmin && !a.isSuper) setMsg({ kind: "error", text: "Yeh admin account nahi hai." });
        else await afterAuth();
      }
      setBusy(false);
      return;
    }

    if (uState !== "free") {
      setMsg({ kind: "error", text: "Ek unique admin code chunein (4-20 akshar, A-Z 0-9 _)." });
      setBusy(false);
      return;
    }
    if (!f.company.trim() || !f.mobile.trim()) {
      setMsg({ kind: "error", text: "Company name aur mobile zaroori hain." });
      setBusy(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: f.email,
      password: f.password,
      options: {
        emailRedirectTo: `${window.location.origin}/admin`,
        data: {
          account_type: "admin",
          full_name: f.company.trim(),
          username: f.username.trim().toUpperCase(),
          mobile: f.mobile.trim(),
          whatsapp: f.whatsapp.trim(),
        },
      },
    });

    if (error) setMsg({ kind: "error", text: error.message });
    else if (!data.session) setOtpFor(f.email);
    else await afterAuth();
    setBusy(false);
  };

  if (otpFor) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="surface w-full max-w-md p-6">
          <h1 className="mb-4 text-xl font-semibold glow-text">Admin email verification</h1>
          <OtpBox email={otpFor} onDone={afterAuth} />
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <form onSubmit={submit} className="surface w-full max-w-lg p-6">
        <h1 className="mb-1 text-xl font-semibold glow-text">Admin (Company) Panel</h1>
        <p className="mb-5 text-xs text-muted-foreground">
          {mode === "in"
            ? "Email aur password se sign in karein. Email verification zaroori hai."
            : "Company account banayein — aapka admin code se hi subadmin aapke under judenge. Superadmin approve karega."}
        </p>

        <div className="space-y-3">
          {mode === "up" && (
            <>
              <input className={field} placeholder="Company / Admin name*" value={f.company} onChange={(e) => set("company", e.target.value)} required />
              <div>
                <input
                  className={field}
                  placeholder="Unique admin code* (subadmin isi se judega)"
                  value={f.username}
                  onChange={(e) => set("username", e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                  required
                />
                {uState === "checking" && <p className="mt-1 text-[11px] text-muted-foreground">Check ho raha hai…</p>}
                {uState === "free" && <p className="mt-1 text-[11px] text-primary">✓ Available — admin code: {f.username}</p>}
                {uState === "taken" && <p className="mt-1 text-[11px] text-destructive">Yeh code pehle se le liya gaya hai.</p>}
                {uState === "bad" && <p className="mt-1 text-[11px] text-destructive">4-20 akshar, sirf A-Z, 0-9 aur _</p>}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input className={field} placeholder="Mobile number*" value={f.mobile} onChange={(e) => set("mobile", e.target.value)} required />
                <input className={field} placeholder="WhatsApp number (91XXXXXXXXXX)" value={f.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
              </div>
            </>
          )}

          <input className={field} type="email" placeholder="Email*" value={f.email} onChange={(e) => set("email", e.target.value)} required />
          <PasswordInput placeholder="Password*" value={f.password} onChange={(v) => set("password", v)} required minLength={6} />

          {msg && <p className={`text-xs ${msg.kind === "error" ? "text-destructive" : "text-primary"}`}>{msg.text}</p>}

          <button type="submit" disabled={busy} className={`${btnPrimary} w-full py-3`}>
            {busy ? "Ruko…" : mode === "in" ? "Admin Sign In" : "Admin Sign Up"}
          </button>
          <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="w-full text-xs text-muted-foreground underline">
            {mode === "in" ? "Naya admin (company) account banayein" : "Pehle se account hai? Sign in"}
          </button>
          <p className="pt-2 text-center text-[11px] text-muted-foreground">
            Subadmin hain?{" "}
            <Link to="/subadmin/auth" className="text-primary underline">
              Subadmin login
            </Link>
          </p>
        </div>
      </form>
    </main>
  );
}
