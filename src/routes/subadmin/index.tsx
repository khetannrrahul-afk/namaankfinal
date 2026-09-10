import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAccount, type Account, type SubAdminInfo } from "@/lib/account";
import { Chat } from "@/components/panel/Chat";
import { PageHeader, Panel, Stat, Loading, field, btnGhost, btnAccent, btnPrimary } from "@/components/panel/Ui";

export const Route = createFileRoute("/subadmin/")({
  staticData: { sitemap: false },
  ssr: false,
  head: () => ({
    meta: [
      { title: "Subadmin Panel — NAMAANK" },
      { name: "description", content: "Apne referral users, unki report access, payments aur settings ek hi panel se manage karein." },
      { property: "og:title", content: "Subadmin Panel — NAMAANK" },
      { property: "og:description", content: "Referral code, users, payments aur social requirements ka control." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SubAdminPanel,
});

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  city: string;
  is_active: boolean;
  created_at: string;
}

interface Access {
  user_id: string;
  short_unlocked: boolean;
  full_unlocked: boolean;
}

interface PaymentRow {
  id: string;
  created_at: string;
  amount: number;
  status: string;
  name: string | null;
  email: string | null;
  payment_id: string | null;
}

interface NotifRow {
  id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

function SubAdminPanel() {
  const navigate = useNavigate();
  const [me, setMe] = useState<Account | null>(null);
  const [profile, setProfile] = useState<SubAdminInfo | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [access, setAccess] = useState<Record<string, Access>>({});
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [notifs, setNotifs] = useState<NotifRow[]>([]);
  const [limits, setLimits] = useState({ min: 99, max: 4999 });
  const [chatWith, setChatWith] = useState<UserRow | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const a = await getAccount();
      if (!a) return navigate({ to: "/subadmin/auth" });
      if (a.isSuper) return navigate({ to: "/superadmin" });
      if (!a.isSub) return navigate({ to: "/me" });
      setMe(a);

      const [{ data: sub }, { data: us }, { data: pays }, { data: ns }, { data: st }] = await Promise.all([
        supabase.from("sub_admins").select("*").eq("id", a.userId).maybeSingle(),
        supabase
          .from("profiles")
          .select("id,full_name,email,mobile,city,is_active,created_at")
          .eq("referred_by", a.userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("payments")
          .select("id,created_at,amount,status,name,email,payment_id")
          .eq("sub_admin_id", a.userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("notifications")
          .select("id,title,body,is_read,created_at")
          .eq("recipient_id", a.userId)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase.from("app_settings").select("key,value").eq("is_public", true),
      ]);

      setProfile(sub as SubAdminInfo | null);
      const list = (us ?? []) as UserRow[];
      setUsers(list);
      setPayments((pays ?? []) as PaymentRow[]);
      setNotifs((ns ?? []) as NotifRow[]);

      const map = Object.fromEntries((st ?? []).map((r) => [r.key, r.value])) as Record<string, string>;
      setLimits({ min: Number(map["price_min_inr"]) || 99, max: Number(map["price_max_inr"]) || 4999 });

      if (list.length) {
        const { data: acc } = await supabase
          .from("report_access")
          .select("user_id,short_unlocked,full_unlocked")
          .in("user_id", list.map((u) => u.id));
        setAccess(Object.fromEntries(((acc ?? []) as Access[]).map((r) => [r.user_id, r])));
      }
      setLoading(false);
    })();
  }, [navigate]);

  if (loading || !me || !profile) return <Loading />;

  const setP = (patch: Partial<SubAdminInfo>) => setProfile({ ...profile, ...patch });

  const save = async () => {
    setSaveMsg(null);
    const price = Math.max(limits.min, Math.min(limits.max, Number(profile.full_report_price_inr) || limits.min));
    const { error } = await supabase
      .from("sub_admins")
      .update({
        name: profile.name,
        mobile: profile.mobile,
        service_type: profile.service_type,
        location: profile.location,
        facebook_url: profile.facebook_url,
        instagram_url: profile.instagram_url,
        require_facebook: profile.require_facebook,
        require_instagram: profile.require_instagram,
        require_share: profile.require_share,
        full_report_price_inr: price,
      })
      .eq("id", me.userId);
    setP({ full_report_price_inr: price });
    setSaveMsg(error ? `Save nahi hua: ${error.message}` : "Settings save ho gayi ✓");
  };

  const refLink = typeof window !== "undefined" ? `${window.location.origin}/auth?ref=${profile.username}` : "";
  const paidCount = Object.values(access).filter((a) => a.full_unlocked).length;
  const revenue = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0) / 100;

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <PageHeader
          title="Subadmin Panel"
          sub={`${profile.name} · referral code: ${profile.username}`}
          right={
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/subadmin/auth", replace: true });
              }}
              className={btnGhost}
            >
              Sign out
            </button>
          }
        />

        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="Total users" value={users.length} />
          <Stat label="Paid users" value={paidCount} tone="good" />
          <Stat label="Revenue" value={`₹${revenue}`} tone="good" />
          <Stat label="Status" value={profile.is_active ? "Active" : "Deactivated"} tone={profile.is_active ? "good" : "warn"} />
        </div>

        <Panel title="Aapka referral link" sub="Is link se jo bhi signup karega, wo aapke users mein aayega.">
          <div className="flex flex-wrap items-center gap-2">
            <code className="flex-1 rounded-xl border border-border/60 p-2.5 text-[11px] break-all">{refLink}</code>
            <button className={btnAccent} onClick={() => void navigator.clipboard.writeText(refLink)}>
              Copy
            </button>
          </div>
        </Panel>

        <Panel title="Mere users" sub="Sirf aapke referral se jude users yahan dikhte hain.">
          {users.length === 0 ? (
            <p className="text-xs text-muted-foreground">Abhi koi user nahi juda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="p-2">Name</th>
                    <th className="p-2">Contact</th>
                    <th className="p-2">Short</th>
                    <th className="p-2">Full</th>
                    <th className="p-2">Joined</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const a = access[u.id];
                    return (
                      <tr key={u.id} className="border-t border-border/60">
                        <td className="p-2">{u.full_name || "—"}</td>
                        <td className="p-2">
                          <p>{u.mobile}</p>
                          <p className="text-[11px] text-muted-foreground break-all">{u.email}</p>
                        </td>
                        <td className={`p-2 ${a?.short_unlocked ? "text-primary" : "text-muted-foreground"}`}>{a?.short_unlocked ? "✓" : "—"}</td>
                        <td className={`p-2 ${a?.full_unlocked ? "text-primary" : "text-muted-foreground"}`}>{a?.full_unlocked ? "Paid" : "—"}</td>
                        <td className="p-2 whitespace-nowrap">{new Date(u.created_at).toLocaleDateString("en-IN")}</td>
                        <td className="p-2">
                          <button className={btnGhost} onClick={() => setChatWith(u)}>
                            Message
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        {chatWith && (
          <Panel
            title={`Chat — ${chatWith.full_name || chatWith.email}`}
            actions={
              <button className={btnGhost} onClick={() => setChatWith(null)}>
                Band karein
              </button>
            }
          >
            <Chat meId={me.userId} peerId={chatWith.id} peerName={chatWith.full_name || "User"} />
          </Panel>
        )}

        <Panel title="Meri settings" sub={`Full report price ₹${limits.min} se ₹${limits.max} ke beech rakh sakte hain.`}>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={field} placeholder="Name" value={profile.name} onChange={(e) => setP({ name: e.target.value })} />
            <input className={field} placeholder="Mobile" value={profile.mobile} onChange={(e) => setP({ mobile: e.target.value })} />
            <input className={field} placeholder="Service type" value={profile.service_type} onChange={(e) => setP({ service_type: e.target.value })} />
            <input className={field} placeholder="Location" value={profile.location} onChange={(e) => setP({ location: e.target.value })} />
            <input className={field} placeholder="Facebook page link" value={profile.facebook_url} onChange={(e) => setP({ facebook_url: e.target.value })} />
            <input className={field} placeholder="Instagram page link" value={profile.instagram_url} onChange={(e) => setP({ instagram_url: e.target.value })} />
            <input
              className={field}
              type="number"
              min={limits.min}
              max={limits.max}
              placeholder="Full report price (₹)"
              value={profile.full_report_price_inr}
              onChange={(e) => setP({ full_report_price_inr: Number(e.target.value) })}
            />
            <div className="rounded-xl border border-border/60 p-3 text-xs">
              <p className="mb-1 text-muted-foreground">Telegram bot</p>
              <p>{profile.telegram_bot_link ? "Superadmin ne set kar diya hai ✓" : "Superadmin se bot setup karwayein."}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-4 text-xs">
            {(["require_facebook", "require_instagram", "require_share"] as const).map((k) => (
              <label key={k} className="flex items-center gap-2">
                <input type="checkbox" checked={profile[k]} onChange={(e) => setP({ [k]: e.target.checked } as Partial<SubAdminInfo>)} />
                {k === "require_facebook" ? "Facebook like zaroori" : k === "require_instagram" ? "Instagram follow zaroori" : "Share zaroori"}
              </label>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button className={btnPrimary} onClick={save}>
              Save settings
            </button>
            {saveMsg && <span className={`text-xs ${saveMsg.startsWith("Settings") ? "text-primary" : "text-destructive"}`}>{saveMsg}</span>}
          </div>
        </Panel>

        <Panel title="Payments">
          {payments.length === 0 ? (
            <p className="text-xs text-muted-foreground">Abhi koi payment nahi.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="p-2">Date</th>
                    <th className="p-2">User</th>
                    <th className="p-2">Amount</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-t border-border/60">
                      <td className="p-2 whitespace-nowrap">{new Date(p.created_at).toLocaleDateString("en-IN")}</td>
                      <td className="p-2">{p.name || p.email || "—"}</td>
                      <td className="p-2">₹{Math.round(p.amount / 100)}</td>
                      <td className={`p-2 ${p.status === "paid" ? "text-primary" : "text-muted-foreground"}`}>{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Notifications">
          {notifs.length === 0 ? (
            <p className="text-xs text-muted-foreground">Koi notification nahi.</p>
          ) : (
            <div className="space-y-2">
              {notifs.map((n) => (
                <div key={n.id} className="rounded-xl border border-border/60 p-3 text-xs">
                  <p className="font-medium">{n.title}</p>
                  <p className="text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString("en-IN")}</p>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <p className="pb-6 text-center text-[11px] text-muted-foreground">
          <Link to="/" className="underline">
            NAMAANK home
          </Link>
        </p>
      </div>
    </main>
  );
}
