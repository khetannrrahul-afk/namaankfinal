import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMe, type Me } from "@/lib/roles";
import { Chat } from "@/components/panel/Chat";

export const Route = createFileRoute("/me")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Meri Kundli — NAMAANK User Panel" },
      { name: "description", content: "Apni saari NAMAANK reports dekhein aur apne guide se seedhe baat karein." },
      { property: "og:title", content: "Meri Kundli — NAMAANK" },
      { property: "og:description", content: "Apni reports aur guide se chat, ek hi jagah." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MePage,
});

interface Sub {
  id: string;
  created_at: string;
  name: string;
  dob: string;
  birth_time: string;
  place: string;
  lang: string;
}

function MePage() {
  const navigate = useNavigate();
  const [me, setMe] = useState<Me | null>(null);
  const [rows, setRows] = useState<Sub[]>([]);
  const [guide, setGuide] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const m = await getMe();
      if (!m) {
        navigate({ to: "/auth" });
        return;
      }
      setMe(m);
      const { data } = await supabase
        .from("namaank_submissions")
        .select("id,created_at,name,dob,birth_time,place,lang")
        .eq("user_id", m.userId)
        .order("created_at", { ascending: false });
      setRows((data ?? []) as Sub[]);
      if (m.referredBy) {
        const { data: g } = await supabase
          .from("profiles")
          .select("id,full_name,email")
          .eq("id", m.referredBy)
          .maybeSingle();
        if (g) setGuide({ id: g.id, name: g.full_name || g.email || "Aapka guide" });
      }
      setLoading(false);
    })();
  }, [navigate]);

  if (loading) return <main className="p-10 text-sm text-muted-foreground">Loading…</main>;

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold glow-text">Namaste{me?.fullName ? `, ${me.fullName}` : ""}</h1>
            <p className="text-xs text-muted-foreground">Aapki saari kundliyan aur guide se baat — ek hi jagah.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate({ to: "/" })} className="rounded-xl border border-primary/50 bg-primary/15 px-3 py-2 text-xs text-primary">
              Nayi Kundli
            </button>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/auth" });
              }}
              className="rounded-xl border border-border px-3 py-2 text-xs"
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="surface p-4">
          <h2 className="mb-2 text-sm font-semibold text-primary">Meri reports ({rows.length})</h2>
          {rows.length === 0 && <p className="text-xs text-muted-foreground">Abhi tak koi kundli nahi bani.</p>}
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="rounded-xl border border-border/60 p-3 text-xs">
                <p className="font-medium">{r.name}</p>
                <p className="text-muted-foreground">
                  {r.dob} · {r.birth_time} · {r.place}
                </p>
                <p className="text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleString("en-IN")}</p>
              </div>
            ))}
          </div>
        </div>

        {guide && me ? (
          <Chat meId={me.userId} peerId={guide.id} peerName={guide.name} />
        ) : (
          <div className="surface p-4 text-xs text-muted-foreground">
            Abhi aapko koi guide assign nahi hua. Guide ka referral link se sign up karne par chat yahin khul jayegi.
          </div>
        )}
      </div>
    </main>
  );
}
