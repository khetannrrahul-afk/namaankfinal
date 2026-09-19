import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAccount } from "@/lib/account";
import { hasAnyAccount } from "@/lib/signup.functions";
import { field, btnPrimary, PasswordInput } from "@/components/panel/Ui";

export const Route = createFileRoute("/superadmin/login")({
  staticData: { sitemap: false },
  ssr: false,
  head: () => ({
    meta: [
      { title: "Superadmin Login — NAMAANK" },
      { name: "description", content: "NAMAANK superadmin control panel ka surakshit login." },
      { property: "og:title", content: "Superadmin Login — NAMAANK" },
      { property: "og:description", content: "Sirf superadmin ke liye — poore system ka control panel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SuperLogin,
});

function SuperLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [setup, setSetup] = useState<boolean | null>(null);

  useEffect(() => {
    void (async () => {
      const a = await getAccount();
      if (a?.isSuper) {
        navigate({ to: "/superadmin" });
        return;
      }
      const has = await hasAnyAccount();
      setSetup(!has);
    })();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");

    if (setup) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/superadmin`,
          data: { account_type: "super_admin", full_name: fullName.trim() },
        },
      });
      if (error) {
        setMsg(error.message);
        setBusy(false);
        return;
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setMsg("Account ban gaya. Ab email-password se sign in karein.");
        setSetup(false);
        setBusy(false);
        return;
      }
      const created = await getAccount();
      if (created?.isSuper) {
        navigate({ to: "/superadmin" });
      } else {
        setMsg("Account ban gaya, lekin superadmin role nahi mila. Support se sampark karein.");
      }
      setBusy(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMsg(error.message === "Invalid login credentials" ? "Email ya password galat hai." : error.message);
      setBusy(false);
      return;
    }
    const a = await getAccount();
    if (!a?.isSuper) {
      await supabase.auth.signOut();
      setMsg("Is account ko superadmin access nahi hai.");
    } else {
      navigate({ to: "/superadmin" });
    }
    setBusy(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="surface w-full max-w-sm p-6">
        <h1 className="mb-1 text-xl font-semibold glow-text">Superadmin</h1>
        <p className="mb-5 text-xs text-muted-foreground">
          {setup
            ? "Abhi tak koi account nahi bana. Pehla account banayein — wahi superadmin hoga."
            : "Poore NAMAANK system ka control panel."}
        </p>
        <div className="space-y-3">
          {setup && (
            <input className={field} placeholder="Aapka naam*" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          )}
          <input className={field} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <PasswordInput placeholder="Password" value={password} onChange={setPassword} required minLength={6} />
          {msg && <p className="text-xs text-destructive">{msg}</p>}
          <button type="submit" disabled={busy} className={`${btnPrimary} w-full py-3`}>
            {busy ? "Ruko…" : setup ? "Superadmin account banayein" : "Sign In"}
          </button>
          <p className="pt-1 text-center text-[11px] text-muted-foreground">
            <Link to="/auth" className="text-primary underline">
              User login
            </Link>{" "}
            ·{" "}
            <Link to="/subadmin/auth" className="text-primary underline">
              Subadmin login
            </Link>
          </p>
        </div>
      </form>
    </main>
  );
}
