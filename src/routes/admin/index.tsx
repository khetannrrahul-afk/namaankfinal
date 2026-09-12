import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAccount, type Account, type AdminInfo } from "@/lib/account";
import { PageHeader, Panel, Stat, Loading, field, btnGhost, btnAccent, btnPrimary } from "@/components/panel/Ui";

export const Route = createFileRoute("/admin/")({
  staticData: { sitemap: false },
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Panel — NAMAANK" },
      { name: "description", content: "Company admin panel: apne subadmins, unke users, payments aur WhatsApp/Telegram support manage karein." },
      { property: "og:title", content: "Admin Panel — NAMAANK" },
      { property: "og:description", content: "Apne subadmins aur unke users ka control." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPanel,
});

interface SubRow {
  id: string;
  name: string;
  username: string;
  mobile: string;
  whatsapp: string;
  service_type: string;
  location: string;
  email: string;
  telegram_bot_link: string;
  full_report_price_inr: number;
  is_active: boolean;
  created_at: string;
}

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  referred_by: string | null;
  is_active: boolean;
  created_at: string;
}

interface PaymentRow {
  id: string;
  created_at: string;
  amount: number;
  status: string;
  name: string | null;
  email: string | null;
  sub_admin_id: string | null;
}

function AdminPanel() {
  const navigate = useNavigate();
  const [me, setMe] = useState<Account | null>(null);
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async (adminId: string) => {
    const [{ data: s }, { data: u }, { data: p }] = await Promise.all([
      supabase.from("sub_admins").select("*").eq("admin_id", adminId).order("created_at", { ascending: false }),
      supabase.from("profiles").select("id,full_name,email,mobile,referred_by,is_active,created_at").order("created_at", { ascending: false }),
      supabase.from("payments").select("id,created_at,amount,status,name,email,sub_admin_id").order("created_at", { ascending: false }).limit(100),
    ]);
    setSubs((s ?? []) as SubRow[]);
    setUsers((u ?? []) as UserRow[]);
    setPayments((p ?? []) as PaymentRow[]);
  };

  useEffect(() => {
    void (async () => {
      const a = await getAccount();
      if (!a) return navigate({ to: "/admin/auth" });
      if (a.isSuper) return navigate({ to: "/superadmin" });
      if (!a.isAdmin) return navigate({ to: a.isSub ? "/subadmin" : "/me" });
      setMe(a);
      setAdmin(a.admin);
      if (a.admin?.is_approved) await load(a.userId);
      setLoading(false);
    })();
  }, [navigate]);

  if (loading || !me) return <Loading />;

  if (!admin) {
    return (
      <main className="p-10 text-center text-sm text-muted-foreground">
        Admin profile nahi mila. <Link to="/admin/auth" className="text-primary underline">Dobara sign in karein</Link>
      </main>
    );
  }

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/admin/auth", replace: true });
  };

  const saveProfile = async () => {
    const { error } = await supabase
      .from("admins")
      .update({ company_name: admin.company_name, mobile: admin.mobile, whatsapp: admin.whatsapp })
      .eq("id", admin.id);
    setMsg(error ? `Save nahi hua: ${error.message}` : "Profile save ho gaya ✓");
  };

  const toggleSub = async (s: SubRow) => {
    await supabase.from("sub_admins").update({ is_active: !s.is_active }).eq("id", s.id);
    await load(admin.id);
  };

  if (!admin.is_approved) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="surface w-full max-w-md p-6 text-center">
          <h1 className="text-xl font-semibold glow-text">Approval ka intezaar</h1>
          <p className="mt-2 text-xs text-muted-foreground">
            Aapka admin account ban gaya hai. Superadmin approve karega, uske baad aapka admin code{" "}
            <b className="text-primary">{admin.username}</b> chalu ho jayega aur subadmin us code se juda sakenge.
          </p>
          <button onClick={signOut} className={`${btnGhost} mt-4`}>
            Sign out
          </button>
        </div>
      </main>
    );
  }

  const subIds = new Set(subs.map((s) => s.id));
  const myUsers = users.filter((u) => u.referred_by && subIds.has(u.referred_by));
  const myPayments = payments.filter((p) => p.sub_admin_id && subIds.has(p.sub_admin_id));
  const revenue = myPayments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0) / 100;
  const subById = Object.fromEntries(subs.map((s) => [s.id, s]));

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <PageHeader
          title="Admin Panel"
          sub={`${admin.company_name} · admin code: ${admin.username}`}
          right={
            <button onClick={signOut} className={btnGhost}>
              Sign out
            </button>
          }
        />

        {msg && <p className="text-xs text-primary">{msg}</p>}

        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="Subadmins" value={subs.length} />
          <Stat label="Users" value={myUsers.length} />
          <Stat label="Paid orders" value={myPayments.filter((p) => p.status === "paid").length} tone="good" />
          <Stat label="Revenue" value={`₹${revenue}`} tone="good" />
        </div>

        <Panel title="Aapka admin code" sub="Subadmin signup ke waqt yahi code daalega, tabhi wo aapke under aayega.">
          <div className="flex flex-wrap items-center gap-2">
            <code className="flex-1 rounded-xl border border-border/60 p-2.5 text-sm tracking-widest text-primary">{admin.username}</code>
            <button className={btnAccent} onClick={() => void navigator.clipboard.writeText(admin.username)}>
              Copy
            </button>
          </div>
        </Panel>

        <Panel title="Meri profile" sub="WhatsApp number par aapko naye subadmin aur payment ki alert milegi.">
          <div className="grid gap-3 sm:grid-cols-3">
            <input className={field} placeholder="Company name" value={admin.company_name} onChange={(e) => setAdmin({ ...admin, company_name: e.target.value })} />
            <input className={field} placeholder="Mobile" value={admin.mobile} onChange={(e) => setAdmin({ ...admin, mobile: e.target.value })} />
            <input className={field} placeholder="WhatsApp (91XXXXXXXXXX)" value={admin.whatsapp} onChange={(e) => setAdmin({ ...admin, whatsapp: e.target.value })} />
          </div>
          <button className={`${btnPrimary} mt-3`} onClick={saveProfile}>
            Save karein
          </button>
        </Panel>

        <Panel title="Mere subadmins" sub="Sirf aapke admin code se jude subadmin.">
          {subs.length === 0 ? (
            <p className="text-xs text-muted-foreground">Abhi koi subadmin nahi juda. Apna code share karein.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="p-2">Name / code</th>
                    <th className="p-2">Contact</th>
                    <th className="p-2">Users</th>
                    <th className="p-2">Price</th>
                    <th className="p-2">Support</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {subs.map((s) => (
                    <tr key={s.id} className="border-t border-border/60">
                      <td className="p-2">
                        <p>{s.name || "—"}</p>
                        <p className="text-[11px] text-primary">{s.username}</p>
                      </td>
                      <td className="p-2">
                        <p>{s.mobile}</p>
                        <p className="text-[11px] text-muted-foreground break-all">{s.email}</p>
                      </td>
                      <td className="p-2">{myUsers.filter((u) => u.referred_by === s.id).length}</td>
                      <td className="p-2">₹{s.full_report_price_inr}</td>
                      <td className="p-2 whitespace-nowrap">
                        {s.whatsapp ? (
                          <a className="text-primary underline" href={`https://wa.me/${s.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                            WhatsApp
                          </a>
                        ) : (
                          <span className="text-muted-foreground">WA —</span>
                        )}
                        {" · "}
                        {s.telegram_bot_link ? (
                          <a className="text-primary underline" href={s.telegram_bot_link} target="_blank" rel="noreferrer">
                            Telegram
                          </a>
                        ) : (
                          <span className="text-muted-foreground">TG —</span>
                        )}
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
          )}
        </Panel>

        <Panel title="Mere users" sub="Aapke subadmins ke saare users.">
          {myUsers.length === 0 ? (
            <p className="text-xs text-muted-foreground">Abhi koi user nahi.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="p-2">Name</th>
                    <th className="p-2">Contact</th>
                    <th className="p-2">Subadmin</th>
                    <th className="p-2">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {myUsers.map((u) => (
                    <tr key={u.id} className="border-t border-border/60">
                      <td className="p-2">{u.full_name || "—"}</td>
                      <td className="p-2">
                        <p>{u.mobile}</p>
                        <p className="text-[11px] text-muted-foreground break-all">{u.email}</p>
                      </td>
                      <td className="p-2">{u.referred_by ? (subById[u.referred_by]?.username ?? "—") : "—"}</td>
                      <td className="p-2 whitespace-nowrap">{new Date(u.created_at).toLocaleDateString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Payments">
          {myPayments.length === 0 ? (
            <p className="text-xs text-muted-foreground">Abhi koi payment nahi.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="p-2">Date</th>
                    <th className="p-2">User</th>
                    <th className="p-2">Subadmin</th>
                    <th className="p-2">Amount</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myPayments.map((p) => (
                    <tr key={p.id} className="border-t border-border/60">
                      <td className="p-2 whitespace-nowrap">{new Date(p.created_at).toLocaleDateString("en-IN")}</td>
                      <td className="p-2">{p.name || p.email || "—"}</td>
                      <td className="p-2">{p.sub_admin_id ? (subById[p.sub_admin_id]?.username ?? "—") : "—"}</td>
                      <td className="p-2">₹{Math.round(p.amount / 100)}</td>
                      <td className={`p-2 ${p.status === "paid" ? "text-primary" : "text-muted-foreground"}`}>{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Telegram / WhatsApp support" sub="Yeh settings superadmin control karta hai.">
          <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
            <li>Telegram bot token aur chat ID superadmin panel se har subadmin ke liye set hote hain (Subadmins → Setup).</li>
            <li>WhatsApp alert ke liye superadmin ek WhatsApp Business number connect karta hai; aapka WhatsApp number upar se save karein.</li>
          </ul>
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
