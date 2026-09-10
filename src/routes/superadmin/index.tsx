import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAccount, type Account } from "@/lib/account";
import { PageHeader, Panel, Stat, Loading, field, btnGhost, btnAccent, btnPrimary, PasswordInput } from "@/components/panel/Ui";

export const Route = createFileRoute("/superadmin/")({
  staticData: { sitemap: false },
  ssr: false,
  head: () => ({
    meta: [
      { title: "Superadmin Control — NAMAANK" },
      { name: "description", content: "Subadmins, users, payments, Telegram bots aur global settings ka poora control." },
      { property: "og:title", content: "Superadmin Control — NAMAANK" },
      { property: "og:description", content: "NAMAANK ka master control panel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SuperAdminPanel,
});

interface SubRow {
  id: string;
  name: string;
  username: string;
  mobile: string;
  service_type: string;
  location: string;
  email: string;
  telegram_bot_link: string;
  full_report_price_inr: number;
  is_active: boolean;
  created_at: string;
}

interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  city: string;
  referred_by: string | null;
  is_active: boolean;
  created_at: string;
}

interface PaymentRow {
  id: string;
  created_at: string;
  amount: number;
  status: string;
  gateway: string;
  name: string | null;
  email: string | null;
  sub_admin_id: string | null;
}

interface BotRow {
  sub_admin_id: string;
  bot_username: string;
  sub_admin_chat_id: string | null;
  super_admin_chat_id: string | null;
  is_enabled: boolean;
}

const SETTING_KEYS = ["youtube_url", "facebook_url", "instagram_url", "price_min_inr", "price_max_inr", "razorpay_enabled"] as const;

function SuperAdminPanel() {
  const navigate = useNavigate();
  const [me, setMe] = useState<Account | null>(null);
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [bots, setBots] = useState<Record<string, BotRow>>({});
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [botFor, setBotFor] = useState<SubRow | null>(null);
  const [botForm, setBotForm] = useState({ bot_username: "", bot_token: "", sub_admin_chat_id: "", super_admin_chat_id: "", is_enabled: true });
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [{ data: s }, { data: u }, { data: p }, { data: b }, { data: st }] = await Promise.all([
      supabase.from("sub_admins").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id,full_name,email,mobile,city,referred_by,is_active,created_at").order("created_at", { ascending: false }),
      supabase.from("payments").select("id,created_at,amount,status,gateway,name,email,sub_admin_id").order("created_at", { ascending: false }).limit(100),
      supabase.from("sub_admin_bots").select("sub_admin_id,bot_username,sub_admin_chat_id,super_admin_chat_id,is_enabled"),
      supabase.from("app_settings").select("key,value"),
    ]);
    setSubs((s ?? []) as SubRow[]);
    setUsers((u ?? []) as ProfileRow[]);
    setPayments((p ?? []) as PaymentRow[]);
    setBots(Object.fromEntries(((b ?? []) as BotRow[]).map((r) => [r.sub_admin_id, r])));
    setSettings(Object.fromEntries((st ?? []).map((r) => [r.key, r.value])));
  };

  useEffect(() => {
    void (async () => {
      const a = await getAccount();
      if (!a) return navigate({ to: "/superadmin/login" });
      if (!a.isSuper) return navigate({ to: a.isSub ? "/subadmin" : "/me" });
      setMe(a);
      await load();
      setLoading(false);
    })();
  }, [navigate]);

  if (loading || !me) return <Loading />;

  const subById = Object.fromEntries(subs.map((s) => [s.id, s]));
  const plainUsers = users.filter((u) => !subById[u.id]);
  const revenue = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0) / 100;

  const toggleSub = async (s: SubRow) => {
    await supabase.from("sub_admins").update({ is_active: !s.is_active }).eq("id", s.id);
    await load();
  };

  const setSubPrice = async (s: SubRow, price: number) => {
    await supabase.from("sub_admins").update({ full_report_price_inr: price }).eq("id", s.id);
    await load();
  };

  const toggleUser = async (u: ProfileRow) => {
    await supabase.from("profiles").update({ is_active: !u.is_active }).eq("id", u.id);
    await load();
  };

  const reassign = async (u: ProfileRow, subId: string) => {
    await supabase.from("profiles").update({ referred_by: subId || null }).eq("id", u.id);
    await load();
    setMsg("User ka subadmin badal diya gaya ✓");
  };

  const saveSettings = async () => {
    const rows = SETTING_KEYS.map((k) => ({
      key: k,
      value: settings[k] ?? "",
      is_public: k !== "razorpay_enabled" ? true : true,
    }));
    const { error } = await supabase.from("app_settings").upsert(rows, { onConflict: "key" });
    setMsg(error ? `Save nahi hua: ${error.message}` : "Global settings save ho gayi ✓");
  };

  const saveBot = async () => {
    if (!botFor) return;
    const payload: Record<string, unknown> = {
      sub_admin_id: botFor.id,
      bot_username: botForm.bot_username.trim(),
      sub_admin_chat_id: botForm.sub_admin_chat_id.trim() || null,
      super_admin_chat_id: botForm.super_admin_chat_id.trim() || null,
      is_enabled: botForm.is_enabled,
      updated_at: new Date().toISOString(),
    };
    if (botForm.bot_token.trim()) payload["bot_token"] = botForm.bot_token.trim();
    const { error } = await supabase.from("sub_admin_bots").upsert(payload as never, { onConflict: "sub_admin_id" });
    if (!error && botForm.bot_username.trim()) {
      await supabase
        .from("sub_admins")
        .update({ telegram_bot_link: `https://t.me/${botForm.bot_username.trim().replace(/^@/, "")}` })
        .eq("id", botFor.id);
    }
    setMsg(error ? `Bot save nahi hua: ${error.message}` : "Telegram bot save ho gaya ✓");
    setBotFor(null);
    setBotForm({ bot_username: "", bot_token: "", sub_admin_chat_id: "", super_admin_chat_id: "", is_enabled: true });
    await load();
  };

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <PageHeader
          title="Superadmin Control"
          sub="Poore system ka master panel."
          right={
            <div className="flex gap-2">
              <Link to="/admin" className={btnGhost}>
                Payment keys
              </Link>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate({ to: "/superadmin/login", replace: true });
                }}
                className={btnGhost}
              >
                Sign out
              </button>
            </div>
          }
        />

        {msg && <p className="text-xs text-primary">{msg}</p>}

        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="Subadmins" value={subs.length} />
          <Stat label="Users" value={plainUsers.length} />
          <Stat label="Payments" value={payments.filter((p) => p.status === "paid").length} tone="good" />
          <Stat label="Total revenue" value={`₹${revenue}`} tone="good" />
        </div>

        <Panel title="Subadmins" sub="Details, price, activation aur Telegram bot.">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="p-2">Name</th>
                  <th className="p-2">Username</th>
                  <th className="p-2">Mobile</th>
                  <th className="p-2">Service</th>
                  <th className="p-2">Location</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Price</th>
                  <th className="p-2">Bot</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id} className="border-t border-border/60 align-top">
                    <td className="p-2">{s.name}</td>
                    <td className="p-2 text-primary">{s.username}</td>
                    <td className="p-2">{s.mobile}</td>
                    <td className="p-2">{s.service_type}</td>
                    <td className="p-2">{s.location}</td>
                    <td className="p-2 break-all">{s.email}</td>
                    <td className="p-2">
                      <input
                        type="number"
                        defaultValue={s.full_report_price_inr}
                        onBlur={(e) => void setSubPrice(s, Number(e.target.value))}
                        className="w-20 rounded-lg border border-border bg-[var(--input)] px-2 py-1"
                      />
                    </td>
                    <td className="p-2">
                      <button
                        className={btnGhost}
                        onClick={() => {
                          const b = bots[s.id];
                          setBotFor(s);
                          setBotForm({
                            bot_username: b?.bot_username ?? "",
                            bot_token: "",
                            sub_admin_chat_id: b?.sub_admin_chat_id ?? "",
                            super_admin_chat_id: b?.super_admin_chat_id ?? "",
                            is_enabled: b?.is_enabled ?? true,
                          });
                        }}
                      >
                        {bots[s.id]?.is_enabled ? "Bot ✓" : "Setup"}
                      </button>
                    </td>
                    <td className="p-2">
                      <button className={btnAccent} onClick={() => void toggleSub(s)}>
                        {s.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {botFor && (
          <Panel
            title={`Telegram bot — ${botFor.name} (${botFor.username})`}
            sub="Bot token surakshit rehta hai, kabhi user ko nahi dikhaya jaata."
            actions={
              <button className={btnGhost} onClick={() => setBotFor(null)}>
                Band karein
              </button>
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={field} placeholder="Bot username (bina @)" value={botForm.bot_username} onChange={(e) => setBotForm({ ...botForm, bot_username: e.target.value })} />
              <PasswordInput placeholder="Bot token (khali chhodein to purana rahega)" value={botForm.bot_token} onChange={(v) => setBotForm({ ...botForm, bot_token: v })} />
              <input className={field} placeholder="Subadmin chat id" value={botForm.sub_admin_chat_id} onChange={(e) => setBotForm({ ...botForm, sub_admin_chat_id: e.target.value })} />
              <input className={field} placeholder="Superadmin chat id" value={botForm.super_admin_chat_id} onChange={(e) => setBotForm({ ...botForm, super_admin_chat_id: e.target.value })} />
            </div>
            <label className="mt-3 flex items-center gap-2 text-xs">
              <input type="checkbox" checked={botForm.is_enabled} onChange={(e) => setBotForm({ ...botForm, is_enabled: e.target.checked })} />
              Bot enabled
            </label>
            <button className={`${btnPrimary} mt-3`} onClick={saveBot}>
              Bot save karein
            </button>
          </Panel>
        )}

        <Panel title="Users" sub="Har user ka subadmin badal sakte hain aur access band kar sakte hain.">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="p-2">Name</th>
                  <th className="p-2">Contact</th>
                  <th className="p-2">Subadmin</th>
                  <th className="p-2">Joined</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {plainUsers.map((u) => (
                  <tr key={u.id} className="border-t border-border/60">
                    <td className="p-2">{u.full_name || "—"}</td>
                    <td className="p-2">
                      <p>{u.mobile}</p>
                      <p className="text-[11px] text-muted-foreground break-all">{u.email}</p>
                    </td>
                    <td className="p-2">
                      <select
                        className="rounded-lg border border-border bg-[var(--input)] px-2 py-1"
                        value={u.referred_by ?? ""}
                        onChange={(e) => void reassign(u, e.target.value)}
                      >
                        <option value="">—</option>
                        {subs.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.username}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2 whitespace-nowrap">{new Date(u.created_at).toLocaleDateString("en-IN")}</td>
                    <td className="p-2">
                      <button className={btnAccent} onClick={() => void toggleUser(u)}>
                        {u.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Global settings" sub="Company channel, default social links, price limits aur gateway.">
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={field} placeholder="Company YouTube channel link" value={settings["youtube_url"] ?? ""} onChange={(e) => setSettings({ ...settings, youtube_url: e.target.value })} />
            <input className={field} placeholder="Company Facebook link" value={settings["facebook_url"] ?? ""} onChange={(e) => setSettings({ ...settings, facebook_url: e.target.value })} />
            <input className={field} placeholder="Company Instagram link" value={settings["instagram_url"] ?? ""} onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })} />
            <input className={field} placeholder="Enabled gateway (razorpay)" value={settings["razorpay_enabled"] ?? ""} onChange={(e) => setSettings({ ...settings, razorpay_enabled: e.target.value })} />
            <input className={field} type="number" placeholder="Minimum price (₹)" value={settings["price_min_inr"] ?? ""} onChange={(e) => setSettings({ ...settings, price_min_inr: e.target.value })} />
            <input className={field} type="number" placeholder="Maximum price (₹)" value={settings["price_max_inr"] ?? ""} onChange={(e) => setSettings({ ...settings, price_max_inr: e.target.value })} />
          </div>
          <button className={`${btnPrimary} mt-3`} onClick={saveSettings}>
            Settings save karein
          </button>
        </Panel>

        <Panel title="Saare payments">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="p-2">Date</th>
                  <th className="p-2">User</th>
                  <th className="p-2">Subadmin</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Gateway</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-border/60">
                    <td className="p-2 whitespace-nowrap">{new Date(p.created_at).toLocaleDateString("en-IN")}</td>
                    <td className="p-2">{p.name || p.email || "—"}</td>
                    <td className="p-2">{p.sub_admin_id ? (subById[p.sub_admin_id]?.username ?? "—") : "—"}</td>
                    <td className="p-2">₹{Math.round(p.amount / 100)}</td>
                    <td className="p-2">{p.gateway}</td>
                    <td className={`p-2 ${p.status === "paid" ? "text-primary" : "text-muted-foreground"}`}>{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </main>
  );
}
