import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMe, homeFor } from "@/lib/roles";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign In / Sign Up — NAMAANK" },
      { name: "description", content: "NAMAANK account banayein — apni reports sambhaal kar rakhein aur guide se baat karein." },
      { property: "og:title", content: "Sign In / Sign Up — NAMAANK" },
      { property: "og:description", content: "Apna NAMAANK account banayein ya sign in karein." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const field =
  "w-full rounded-xl border border-border bg-[var(--input)] px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/40";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [ref, setRef] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("ref");
    if (code) {
      setRef(code.toUpperCase());
      setMode("up");
    }
    (async () => {
      const me = await getMe();
      if (me) navigate({ to: homeFor(me) });
    })();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
      else {
        const me = await getMe();
        navigate({ to: me ? homeFor(me) : "/me" });
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/me`,
          data: { full_name: fullName, referral_code: ref },
        },
      });
      setMsg(error ? error.message : "Account ban gaya. Ab sign in karein.");
      if (!error) setMode("in");
    }
    setBusy(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="surface w-full max-w-sm p-6">
        <h1 className="mb-1 text-xl font-semibold glow-text">NAMAANK</h1>
        <p className="mb-5 text-xs text-muted-foreground">
          {mode === "in" ? "Apne account mein sign in karein." : "Naya account banayein — reports sambhal kar rahengi."}
        </p>
        <div className="space-y-3">
          {mode === "up" && (
            <input className={field} placeholder="Poora naam" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          )}
          <input
            className={field}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className={field}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {mode === "up" && (
            <input
              className={field}
              placeholder="Referral code (optional)"
              value={ref}
              onChange={(e) => setRef(e.target.value.toUpperCase())}
            />
          )}
          {msg && <p className="text-xs text-destructive">{msg}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-[image:var(--grad-accent)] px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {mode === "in" ? "Sign In" : "Sign Up"}
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === "in" ? "up" : "in")}
            className="w-full text-xs text-muted-foreground underline"
          >
            {mode === "in" ? "Naya account banayein" : "Pehle se account hai? Sign in"}
          </button>
        </div>
      </form>
    </main>
  );
}
