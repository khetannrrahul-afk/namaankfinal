import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAccount } from "@/lib/account";
import { field, btnPrimary } from "@/components/panel/Ui";

export const Route = createFileRoute("/superadmin/login")({
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
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const a = await getAccount();
      if (a?.isSuper) navigate({ to: "/superadmin" });
    })();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMsg(error.message);
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
        <p className="mb-5 text-xs text-muted-foreground">Poore NAMAANK system ka control panel.</p>
        <div className="space-y-3">
          <input className={field} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input
            className={field}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {msg && <p className="text-xs text-destructive">{msg}</p>}
          <button type="submit" disabled={busy} className={`${btnPrimary} w-full py-3`}>
            {busy ? "Ruko…" : "Sign In"}
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
