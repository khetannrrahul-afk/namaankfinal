import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMe, type Me } from "@/lib/roles";
import { Chat } from "@/components/panel/Chat";
import { registerBotWebhook } from "@/lib/telegram.functions";

export const Route = createFileRoute("/superadmin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Super Admin Panel — NAMAANK" },
      { name: "description", content: "Sab sub admins, unke users aur Telegram bot settings ek jagah se control karein." },
      { property: "og:title", content: "Super Admin Panel — NAMAANK" },
      { property: "og:description", content: "Sub admin banayein, users dekhein, bot settings karein." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SuperAdminPage,
});

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  referral_code: string | null;
  referred_by: string | null;
  created_at: string;
}

interface Sub {
  id: string;
  created_at: string;
  name: string;
  dob: string;
  birth_time: string;
  place: string;
  mobile: string;
  email: string;
  user_id: string | null;
  sub_admin_id: string | null;
}

interface BotCfg {
  sub_admin_id: string;
  bot_token: string;
  bot_username: string;
  sub_admin_chat_id: string;
  super_admin_chat_id: string;
  is_enabled: boolean;
}

function SuperAdminPage() {
  const navigate = useNavigate();
  const [me, setMe] = useState<Me | null>(null);
  const [state, setState] = useState<"loading" | "denied" | "ok">("loading");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [subIds, setSubIds] = useState<string[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [bots, setBots] = useState<Record<string, BotCfg>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const [{ data: p }, { data: r }, { data: s }, { data: b }] = await Promise.all([
      supabase.from("profiles").select("id,full_name,email,referral_code,referred_by,created_at").order("created_at"),
      supabase.from("user_roles").select("user_id,role").eq("role", "sub_admin"),
      supabase
        .from("namaank_submissions")
        .select("id,created_at,name,dob,birth_time,place,mobile,email,user_id,sub_admin_id")
        .order("created_at", { ascending: false }),
      supabase.from("sub_admin_bots").select("*"),
    ]);
    setProfiles((p ?? []) as Profile[]);
    setSubIds((r ?? []).map((x) => x.user_id));
    setSubs((s ?? []) as Sub[]);
    setBots(Object.fromEntries(((b ?? []) as BotCfg[]).map((x) => [x.sub_admin_id, x])));
  }, []);

  useEffect(() => {
    (async () => {
      const m = await getMe();
      if (!m) {
        navigate({ to: "/auth" });
        return;
      }
      setMe(m);
      if (!m.isSuper) {
        setState("denied");
        return;
      }
      await load();
      setState("ok");
    })();
  }, [navigate, load]);

  const makeSub = async (id: string) => {
    const { error } = await supabase.from("user_roles").insert({ user_id: id, role: "sub_admin" });
    setMsg(error ? error.message : "Sub admin ban gaya ✓");
    await load();
  };

  const removeSub = async (id: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", id).eq("role", "sub_admin");
    setMsg(error ? error.message : "Sub admin hata diya");
    await load();
  };

  const saveBot = async (id: string, cfg: Partial<BotCfg>) => {
    const row = { sub_admin_id: id, ...(bots[id] ?? {}), ...cfg } as BotCfg;
    const { error } = await supabase.from("sub_admin_bots").upsert(row, { onConflict: "sub_admin_id" });
    setMsg(error ? error.message : "Bot settings save ✓");
    await load();
  };

  if (state === "loading") return <main className="p-10 text-sm text-muted-foreground">Loading…</main>;
  if (state === "denied")
    return (
      <main className="flex min-h-screen items-center justify-center p-10 text-center text-sm text-muted-foreground">
        Sirf super admin hi is panel ko khol sakta hai.
      </main>
    );

  const subAdmins = profiles.filter((p) => subIds.includes(p.id));
  const openSub = subAdmins.find((s) => s.id === open) ?? null;
  const openUsers = openSub ? profiles.filter((p) => p.referred_by === openSub.id) : [];
  const openRows = openSub ? subs.filter((r) => r.sub_admin_id === openSub.id) : [];
  const bot = openSub ? bots[openSub.id] : undefined;

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold glow-text">Super Admin Panel</h1>
            <p className="text-xs text-muted-foreground">
              {subAdmins.length} sub admins · {profiles.length} accounts · {subs.length} kundliyan
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate({ to: "/admin" })} className="rounded-xl border border-border px-3 py-2 text-xs">
              Settings & Payments
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

        {msg && <p className="text-xs text-muted-foreground">{msg}</p>}

        {!openSub ? (
          <>
            <div className="surface p-4">
              <h2 className="mb-3 text-sm font-semibold text-primary">Sub admins</h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {subAdmins.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setOpen(s.id)}
                    className="rounded-xl border border-border/60 p-3 text-left text-xs hover:bg-secondary"
                  >
                    <p className="font-medium">{s.full_name || s.email}</p>
                    <p className="text-muted-foreground">{s.email}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Code {s.referral_code} · {profiles.filter((p) => p.referred_by === s.id).length} users ·{" "}
                      {bots[s.id]?.is_enabled ? "Bot on" : "Bot off"}
                    </p>
                  </button>
                ))}
                {subAdmins.length === 0 && <p className="text-xs text-muted-foreground">Abhi koi sub admin nahi hai.</p>}
              </div>
            </div>

            <div className="surface p-4">
              <h2 className="mb-3 text-sm font-semibold text-primary">Sabhi accounts — sub admin banayein</h2>
              <div className="space-y-1">
                {profiles.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-xs">
                    <span>
                      {p.full_name || p.email} <span className="text-muted-foreground">· {p.email}</span>
                    </span>
                    {subIds.includes(p.id) ? (
                      <button onClick={() => void removeSub(p.id)} className="rounded-lg border border-destructive/50 px-2 py-1 text-[11px] text-destructive">
                        Sub admin hatayein
                      </button>
                    ) : (
                      <button onClick={() => void makeSub(p.id)} className="rounded-lg border border-primary/50 px-2 py-1 text-[11px] text-primary">
                        Sub admin banayein
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <button onClick={() => setOpen(null)} className="rounded-xl border border-border px-3 py-2 text-xs">
              ← Sab sub admins
            </button>

            <div className="surface p-4">
              <h2 className="text-sm font-semibold text-primary">{openSub.full_name || openSub.email}</h2>
              <p className="text-[11px] text-muted-foreground">
                Referral code {openSub.referral_code} · {openUsers.length} users · {openRows.length} kundliyan
              </p>
            </div>

            <div className="surface p-4">
              <h3 className="mb-2 text-sm font-semibold text-primary">Telegram bot settings (sirf aap)</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["bot_token", "Bot token (BotFather se)"],
                    ["bot_username", "Bot username (@namaank_bot)"],
                    ["sub_admin_chat_id", "Sub admin ka chat ID"],
                    ["super_admin_chat_id", "Super admin ka chat ID"],
                  ] as const
                ).map(([k, label]) => (
                  <label key={k} className="block text-xs">
                    <span className="text-muted-foreground">{label}</span>
                    <input
                      type={k === "bot_token" ? "password" : "text"}
                      autoComplete="off"
                      defaultValue={bot?.[k] ?? ""}
                      onBlur={(e) => void saveBot(openSub.id, { [k]: e.target.value } as Partial<BotCfg>)}
                      className="mt-1 w-full rounded-xl border border-border bg-[var(--input)] px-3 py-2 text-sm"
                    />
                  </label>
                ))}
              </div>
              <label className="mt-3 flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={bot?.is_enabled ?? false}
                  onChange={(e) => void saveBot(openSub.id, { is_enabled: e.target.checked })}
                />
                Bot chalu karein
              </label>
              <button
                onClick={async () => {
                  const res = await registerBotWebhook({
                    data: { subAdminId: openSub.id, baseUrl: window.location.origin },
                  });
                  setMsg(res.ok ? `Telegram bot jud gaya ✓ (${res.url})` : `Bot connect nahi hua: ${res.reason}`);
                }}
                className="mt-3 rounded-xl border border-primary/50 bg-primary/15 px-4 py-2 text-xs text-primary"
              >
                Telegram se connect karein
              </button>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Sub admin aur aap dono bot ko Telegram par start karein, phir chat ID yahan bharkar connect dabayein.
              </p>
            </div>



            <div className="surface overflow-x-auto p-2">
              <table className="w-full text-left text-xs">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="p-2">Date</th>
                    <th className="p-2">Naam</th>
                    <th className="p-2">DOB / Time</th>
                    <th className="p-2">Sthan</th>
                    <th className="p-2">Mobile</th>
                    <th className="p-2">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {openRows.map((r) => (
                    <tr key={r.id} className="border-t border-border/60">
                      <td className="p-2 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString("en-IN")}</td>
                      <td className="p-2 font-medium">{r.name}</td>
                      <td className="p-2 whitespace-nowrap">
                        {r.dob} · {r.birth_time}
                      </td>
                      <td className="p-2 max-w-[180px] truncate">{r.place}</td>
                      <td className="p-2">{r.mobile}</td>
                      <td className="p-2">{r.email}</td>
                    </tr>
                  ))}
                  {openRows.length === 0 && (
                    <tr>
                      <td className="p-4 text-muted-foreground" colSpan={6}>
                        Is sub admin ke users ki koi kundli nahi mili.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {me && <Chat meId={me.userId} peerId={openSub.id} peerName={openSub.full_name || openSub.email || "Sub admin"} />}
          </>
        )}
      </div>
    </main>
  );
}
