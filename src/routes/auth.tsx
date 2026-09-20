import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAccount, homeFor } from "@/lib/account";
import { validateReferralCode } from "@/lib/signup.functions";
import { field, btnPrimary, PasswordInput } from "@/components/panel/Ui";

export const Route = createFileRoute("/auth")({
  staticData: { sitemap: true },
  ssr: false,
  head: () => ({
    meta: [
      { title: "User Sign In / Sign Up — NAMAANK" },
      {
        name: "description",
        content: "NAMAANK account banayein — apne guide ka referral code daalein aur apni numerology reports paayein.",
      },
      { property: "og:title", content: "User Sign In / Sign Up — NAMAANK" },
      { property: "og:description", content: "Apna NAMAANK account banayein ya sign in karein." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://namaankfinal.lovable.app/auth" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    mobile: "",
    city: "",
    ref: "",
  });
  const [refState, setRefState] = useState<{ status: "idle" | "checking" | "ok" | "bad"; name?: string }>({ status: "idle" });
  const [msg, setMsg] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("ref");
    if (code) {
      set("ref", code.toUpperCase());
      setMode("up");
    }
    void (async () => {
      const a = await getAccount();
      if (a) navigate({ to: homeFor(a) });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Referral code real-time validation
  useEffect(() => {
    const code = form.ref.trim();
    if (mode !== "up" || code.length < 2) {
      setRefState({ status: "idle" });
      return;
    }
    setRefState({ status: "checking" });
    const t = setTimeout(async () => {
      const rows = await validateReferralCode({ data: code });
      const row = rows[0] ?? null;
      setRefState(row ? { status: "ok", name: row.sub_admin_name } : { status: "bad" });
    }, 400);
    return () => clearTimeout(t);
  }, [form.ref, mode]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setBusy(true);

    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      if (error) setMsg({ kind: "error", text: error.message });
      else {
        const a = await getAccount();
        navigate({ to: a ? homeFor(a) : "/me" });
      }
      setBusy(false);
      return;
    }

    if (refState.status !== "ok") {
      setMsg({ kind: "error", text: "Sahi referral code daalna zaroori hai." });
      setBusy(false);
      return;
    }
    if (!form.fullName.trim() || !form.mobile.trim()) {
      setMsg({ kind: "error", text: "Naam aur mobile number zaroori hai." });
      setBusy(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/me`,
        data: {
          account_type: "user",
          full_name: form.fullName.trim(),
          mobile: form.mobile.trim(),
          city: form.city.trim(),
          referral_code: form.ref.trim().toUpperCase(),
        },
      },
    });

    if (error) setMsg({ kind: "error", text: error.message });
    else {
      const a = await getAccount();
      if (a) navigate({ to: homeFor(a) });
      else {
        setMsg({ kind: "ok", text: "Account ban gaya. Ab sign in karein." });
        setMode("in");
      }
    }
    setBusy(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <form onSubmit={submit} className="surface w-full max-w-md p-6">
        <h1 className="mb-1 text-xl font-semibold glow-text">NAMAANK — Account Sign In</h1>
        <p className="mb-5 text-xs text-muted-foreground">
          {mode === "in" ? "Apne account mein sign in karein." : "Naya account banayein — guide ka referral code zaroori hai."}
        </p>

        <div className="space-y-3">
          {mode === "up" && (
            <>
              <input className={field} placeholder="Poora naam*" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} required />
              <div className="grid gap-3 sm:grid-cols-2">
                <input className={field} placeholder="Mobile number*" value={form.mobile} onChange={(e) => set("mobile", e.target.value)} required />
                <input className={field} placeholder="Sheher / Location" value={form.city} onChange={(e) => set("city", e.target.value)} />
              </div>
            </>
          )}

          <input className={field} type="email" placeholder="Email*" value={form.email} onChange={(e) => set("email", e.target.value)} required />
          <PasswordInput
            placeholder="Password* (kam se kam 6 akshar)"
            value={form.password}
            onChange={(v) => set("password", v)}
            required
            minLength={6}
          />

          {mode === "up" && (
            <div>
              <input
                className={field}
                placeholder="Subadmin referral code* (zaroori)"
                value={form.ref}
                onChange={(e) => set("ref", e.target.value.toUpperCase())}
                required
              />
              {refState.status === "checking" && <p className="mt-1 text-[11px] text-muted-foreground">Code check ho raha hai…</p>}
              {refState.status === "ok" && <p className="mt-1 text-[11px] text-primary">✓ Guide: {refState.name}</p>}
              {refState.status === "bad" && <p className="mt-1 text-[11px] text-destructive">Yeh referral code valid nahi hai.</p>}
            </div>
          )}

          {msg && <p className={`text-xs ${msg.kind === "error" ? "text-destructive" : "text-primary"}`}>{msg.text}</p>}

          <button type="submit" disabled={busy} className={`${btnPrimary} w-full py-3`}>
            {busy ? "Ruko…" : mode === "in" ? "Sign In" : "Sign Up"}
          </button>

          <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="w-full text-xs text-muted-foreground underline">
            {mode === "in" ? "Naya account banayein" : "Pehle se account hai? Sign in"}
          </button>

          <p className="pt-2 text-center text-[11px] text-muted-foreground">
            Subadmin hain?{" "}
            <Link to="/subadmin/auth" className="text-primary underline">
              Subadmin login
            </Link>{" "}
            ·{" "}
            <Link to="/superadmin/login" className="text-primary underline">
              Superadmin
            </Link>
          </p>
        </div>
      </form>
    </main>
  );
}
