import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAccount, homeFor } from "@/lib/account";
import { field, btnPrimary } from "@/components/panel/Ui";

export const Route = createFileRoute("/subadmin/auth")({
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
    mobile: "",
    serviceType: "",
    location: "",
    email: "",
    facebook: "",
    instagram: "",
    password: "",
  });
  const [uState, setUState] = useState<"idle" | "checking" | "free" | "taken" | "bad">("idle");
  const [msg, setMsg] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
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
      const { data } = await supabase.rpc("username_available", { _username: u });
      setUState(data ? "free" : "taken");
    }, 400);
    return () => clearTimeout(t);
  }, [f.username, mode]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setBusy(true);

    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email: f.email, password: f.password });
      if (error) setMsg({ kind: "error", text: error.message });
      else {
        const a = await getAccount();
        if (a && !a.isSub && !a.isSuper) {
          setMsg({ kind: "error", text: "Yeh subadmin account nahi hai. User login use karein." });
        } else navigate({ to: a ? homeFor(a) : "/subadmin" });
      }
      setBusy(false);
      return;
    }

    if (uState !== "free") {
      setMsg({ kind: "error", text: "Ek unique username chunein (4-20 akshar, A-Z 0-9 _)." });
      setBusy(false);
      return;
    }
    if (!f.name.trim() || !f.mobile.trim() || !f.serviceType.trim() || !f.location.trim()) {
      setMsg({ kind: "error", text: "Name, mobile, service type aur location zaroori hain." });
      setBusy(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: f.email,
      password: f.password,
      options: {
        emailRedirectTo: `${window.location.origin}/subadmin`,
        data: {
          account_type: "sub_admin",
          full_name: f.name.trim(),
          username: f.username.trim().toUpperCase(),
          mobile: f.mobile.trim(),
          service_type: f.serviceType.trim(),
          location: f.location.trim(),
          facebook_url: f.facebook.trim(),
          instagram_url: f.instagram.trim(),
        },
      },
    });

    if (error) setMsg({ kind: "error", text: error.message });
    else {
      const a = await getAccount();
      if (a) navigate({ to: homeFor(a) });
      else {
        setMsg({ kind: "ok", text: "Subadmin account ban gaya. Ab sign in karein." });
        setMode("in");
      }
    }
    setBusy(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <form onSubmit={submit} className="surface w-full max-w-lg p-6">
        <h1 className="mb-1 text-xl font-semibold glow-text">Subadmin Panel</h1>
        <p className="mb-5 text-xs text-muted-foreground">
          {mode === "in" ? "Apne subadmin account mein sign in karein." : "Subadmin banein — aapka username hi aapka referral code hoga."}
        </p>

        <div className="space-y-3">
          {mode === "up" && (
            <>
              <input className={field} placeholder="Name*" value={f.name} onChange={(e) => set("name", e.target.value)} required />
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
                <input className={field} placeholder="Service type*" value={f.serviceType} onChange={(e) => set("serviceType", e.target.value)} required />
              </div>
              <input className={field} placeholder="Location*" value={f.location} onChange={(e) => set("location", e.target.value)} required />
              <div className="grid gap-3 sm:grid-cols-2">
                <input className={field} placeholder="Facebook ID / page link" value={f.facebook} onChange={(e) => set("facebook", e.target.value)} />
                <input className={field} placeholder="Instagram ID / page link" value={f.instagram} onChange={(e) => set("instagram", e.target.value)} />
              </div>
            </>
          )}

          <input className={field} type="email" placeholder="Email*" value={f.email} onChange={(e) => set("email", e.target.value)} required />
          <input
            className={field}
            type="password"
            placeholder="Password*"
            value={f.password}
            onChange={(e) => set("password", e.target.value)}
            required
            minLength={6}
          />

          {msg && <p className={`text-xs ${msg.kind === "error" ? "text-destructive" : "text-primary"}`}>{msg.text}</p>}

          <button type="submit" disabled={busy} className={`${btnPrimary} w-full py-3`}>
            {busy ? "Ruko…" : mode === "in" ? "Subadmin Sign In" : "Subadmin Sign Up"}
          </button>
          <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="w-full text-xs text-muted-foreground underline">
            {mode === "in" ? "Naya subadmin account banayein" : "Pehle se account hai? Sign in"}
          </button>
          <p className="pt-2 text-center text-[11px] text-muted-foreground">
            User hain?{" "}
            <Link to="/auth" className="text-primary underline">
              User login
            </Link>
          </p>
        </div>
      </form>
    </main>
  );
}
