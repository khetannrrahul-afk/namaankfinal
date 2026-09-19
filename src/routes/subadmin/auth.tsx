import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAccount, homeFor } from "@/lib/account";
import { field, btnPrimary, PasswordInput } from "@/components/panel/Ui";
import { OtpBox } from "@/components/panel/OtpBox";

export const Route = createFileRoute("/subadmin/auth")({
  staticData: { sitemap: true },
  ssr: false,
  head: () => ({
    meta: [
      { title: "Subadmin Sign In / Sign Up — NAMAANK" },
      {
        name: "description",
        content: "NAMAANK subadmin banein — apna unique username hi aapka referral code hoga aur apne users manage karein.",
      },
      { property: "og:title", content: "Subadmin Sign In / Sign Up — NAMAANK" },
      { property: "og:description", content: "Subadmin account banayein aur apne referral users manage karein." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://namaank2.lovable.app/subadmin/auth" }],
  }),
  component: SubAdminAuth,
});

const USERNAME_RE = /^[A-Z0-9_]{4,20}$/;

function SubAdminAuth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [f, setF] = useState({
    name: "",
    username: "",
    adminCode: "",
    mobile: "",
    whatsapp: "",
    serviceType: "",
    location: "",
    email: "",
    facebook: "",
    instagram: "",
    password: "",
  });
  const [uState, setUState] = useState<"idle" | "checking" | "free" | "taken" | "bad">("idle");
  const [adminState, setAdminState] = useState<{ kind: "idle" | "checking" | "ok" | "bad"; name?: string }>({ kind: "idle" });
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

  // Username real-time uniqueness
  useEffect(() => {
    const u = f.username.trim();
    if (mode !== "up" || u.length === 0) return setUState("idle");
    if (!USERNAME_RE.test(u)) return setUState("bad");
    setUState("checking");
    const t = setTimeout(async () => {
      const free = await usernameAvailable({ data: u });
      setUState(free ? "free" : "taken");
    }, 400);
    return () => clearTimeout(t);
  }, [f.username, mode]);

  // Admin code real-time validation
  useEffect(() => {
    const c = f.adminCode.trim();
    if (mode !== "up" || c.length === 0) return setAdminState({ kind: "idle" });
    setAdminState({ kind: "checking" });
    const t = setTimeout(async () => {
      const rows = await validateAdminCode({ data: c });
      const row = rows[0];
      setAdminState(row ? { kind: "ok", name: row.company_name } : { kind: "bad" });
    }, 400);
    return () => clearTimeout(t);
  }, [f.adminCode, mode]);

  const afterAuth = async () => {
    const a = await getAccount();
    if (a) navigate({ to: homeFor(a) });
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
        if (a && !a.isSub && !a.isSuper) {
          setMsg({ kind: "error", text: "Yeh subadmin account nahi hai. User login use karein." });
        } else await afterAuth();
      }
      setBusy(false);
      return;
    }

    if (uState !== "free") {
      setMsg({ kind: "error", text: "Ek unique username chunein (4-20 akshar, A-Z 0-9 _)." });
      setBusy(false);
      return;
    }
    if (adminState.kind !== "ok") {
      setMsg({ kind: "error", text: "Sahi admin code daalein — bina admin ke subadmin account nahi banega." });
      setBusy(false);
      return;
    }
    if (!f.name.trim() || !f.mobile.trim() || !f.serviceType.trim() || !f.location.trim()) {
      setMsg({ kind: "error", text: "Name, mobile, service type aur location zaroori hain." });
      setBusy(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: f.email,
      password: f.password,
      options: {
        emailRedirectTo: `${window.location.origin}/subadmin`,
        data: {
          account_type: "sub_admin",
          full_name: f.name.trim(),
          username: f.username.trim().toUpperCase(),
          admin_code: f.adminCode.trim().toUpperCase(),
          mobile: f.mobile.trim(),
          whatsapp: f.whatsapp.trim(),
          service_type: f.serviceType.trim(),
          location: f.location.trim(),
          facebook_url: f.facebook.trim(),
          instagram_url: f.instagram.trim(),
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
          <h1 className="mb-4 text-xl font-semibold glow-text">Subadmin email verification</h1>
          <OtpBox email={otpFor} onDone={afterAuth} />
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <form onSubmit={submit} className="surface w-full max-w-lg p-6">
        <h1 className="mb-1 text-xl font-semibold glow-text">Subadmin Panel</h1>
        <p className="mb-5 text-xs text-muted-foreground">
          {mode === "in"
            ? "Email aur password se sign in karein. Email verification zaroori hai."
            : "Subadmin banein — admin ka code zaroori hai, aur aapka username hi aapka referral code hoga."}
        </p>

        <div className="space-y-3">
          {mode === "up" && (
            <>
              <input className={field} placeholder="Name*" value={f.name} onChange={(e) => set("name", e.target.value)} required />
              <div>
                <input
                  className={field}
                  placeholder="Admin code* (jis company ke under aa rahe hain)"
                  value={f.adminCode}
                  onChange={(e) => set("adminCode", e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                  required
                />
                {adminState.kind === "checking" && <p className="mt-1 text-[11px] text-muted-foreground">Check ho raha hai…</p>}
                {adminState.kind === "ok" && <p className="mt-1 text-[11px] text-primary">✓ Admin: {adminState.name}</p>}
                {adminState.kind === "bad" && <p className="mt-1 text-[11px] text-destructive">Yeh admin code galat ya abhi approve nahi hua.</p>}
              </div>
              <div>
                <input
                  className={field}
                  placeholder="Unique username* (yahi referral code hai)"
                  value={f.username}
                  onChange={(e) => set("username", e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                  required
                />
                {uState === "checking" && <p className="mt-1 text-[11px] text-muted-foreground">Check ho raha hai…</p>}
                {uState === "free" && <p className="mt-1 text-[11px] text-primary">✓ Username available — referral code: {f.username}</p>}
                {uState === "taken" && <p className="mt-1 text-[11px] text-destructive">Yeh username pehle se le liya gaya hai.</p>}
                {uState === "bad" && <p className="mt-1 text-[11px] text-destructive">4-20 akshar, sirf A-Z, 0-9 aur _</p>}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input className={field} placeholder="Mobile number*" value={f.mobile} onChange={(e) => set("mobile", e.target.value)} required />
                <input className={field} placeholder="WhatsApp number (91XXXXXXXXXX)" value={f.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input className={field} placeholder="Service type*" value={f.serviceType} onChange={(e) => set("serviceType", e.target.value)} required />
                <input className={field} placeholder="Location*" value={f.location} onChange={(e) => set("location", e.target.value)} required />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input className={field} placeholder="Facebook ID / page link" value={f.facebook} onChange={(e) => set("facebook", e.target.value)} />
                <input className={field} placeholder="Instagram ID / page link" value={f.instagram} onChange={(e) => set("instagram", e.target.value)} />
              </div>
            </>
          )}

          <input className={field} type="email" placeholder="Email*" value={f.email} onChange={(e) => set("email", e.target.value)} required />
          <PasswordInput placeholder="Password*" value={f.password} onChange={(v) => set("password", v)} required minLength={6} />

          {msg && <p className={`text-xs ${msg.kind === "error" ? "text-destructive" : "text-primary"}`}>{msg.text}</p>}

          <button type="submit" disabled={busy} className={`${btnPrimary} w-full py-3`}>
            {busy ? "Ruko…" : mode === "in" ? "Subadmin Sign In" : "Subadmin Sign Up"}
          </button>
          <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="w-full text-xs text-muted-foreground underline">
            {mode === "in" ? "Naya subadmin account banayein" : "Pehle se account hai? Sign in"}
          </button>
          <p className="pt-2 text-center text-[11px] text-muted-foreground">
            Company admin hain?{" "}
            <Link to="/admin/auth" className="text-primary underline">
              Admin login
            </Link>{" "}
            · User hain?{" "}
            <Link to="/auth" className="text-primary underline">
              User login
            </Link>
          </p>
        </div>
      </form>
    </main>
  );
}
