import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAccount, type Account } from "@/lib/account";
import { getTelegramSupport } from "@/lib/billing.functions";
import { Chat } from "@/components/panel/Chat";
import { PageHeader, Panel, Stat, Loading, btnGhost, btnAccent } from "@/components/panel/Ui";

export const Route = createFileRoute("/me")({
  staticData: { sitemap: false },
  ssr: false,
  head: () => ({
    meta: [
      { title: "Mera Dashboard — NAMAANK" },
      { name: "description", content: "Apni short aur full report, payment status, guide aur Telegram support — sab ek jagah." },
      { property: "og:title", content: "Mera Dashboard — NAMAANK" },
      { property: "og:description", content: "Reports, payment status aur guide support ek hi dashboard mein." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MePage,
});

interface SubmissionRow {
  id: string;
  created_at: string;
  name: string;
  dob: string;
  birth_time: string;
  place: string;
}

interface PaymentRow {
  id: string;
  created_at: string;
  amount: number;
  status: string;
  gateway: string;
  payment_id: string | null;
}

function MePage() {
  const navigate = useNavigate();
  const [me, setMe] = useState<Account | null>(null);
  const [rows, setRows] = useState<SubmissionRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [telegram, setTelegram] = useState<{ available: boolean; link?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const a = await getAccount();
      if (!a) {
        navigate({ to: "/auth" });
        return;
      }
      if (a.isSuper) return navigate({ to: "/superadmin" });
      if (a.isSub) return navigate({ to: "/subadmin" });
      setMe(a);

      const [{ data: subs }, { data: pays }, tg] = await Promise.all([
        supabase
          .from("namaank_submissions")
          .select("id,created_at,name,dob,birth_time,place")
          .eq("user_id", a.userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("payments")
          .select("id,created_at,amount,status,gateway,payment_id")
          .eq("user_id", a.userId)
          .order("created_at", { ascending: false }),
        getTelegramSupport().catch(() => ({ available: false as const })),
      ]);

      setRows((subs ?? []) as SubmissionRow[]);
      setPayments((pays ?? []) as PaymentRow[]);
      setTelegram(tg as { available: boolean; link?: string });
      setLoading(false);
    })();
  }, [navigate]);

  if (loading || !me) return <Loading />;

  const paid = me.access.full_unlocked;

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-5">
        <PageHeader
          title={`Namaste${me.fullName ? `, ${me.fullName}` : ""}`}
          sub="Aapki reports, payment status aur support — ek hi jagah."
          right={
            <div className="flex flex-wrap gap-2">
              <Link to="/" className={btnAccent}>
                Nayi Kundli
              </Link>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate({ to: "/auth", replace: true });
                }}
                className={btnGhost}
              >
                Sign out
              </button>
            </div>
          }
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Short report" value={me.access.short_unlocked ? "Unlocked ✓" : "Social steps baaki"} tone={me.access.short_unlocked ? "good" : "warn"} />
          <Stat label="Full report" value={paid ? "Paid ✓" : "Payment pending"} tone={paid ? "good" : "warn"} />
          <Stat label="Aapka guide (Subadmin)" value={me.subAdmin ? me.subAdmin.name || me.subAdmin.username : "—"} />
        </div>

        <Panel
          title="Report access"
          sub="Short report social steps ke baad, full report payment ke baad khulti hai."
          actions={
            <div className="flex gap-2">
              <Link to="/report" search={{ id: undefined }} className={btnAccent}>
                Report kholein
              </Link>
              {!paid && (
                <Link to="/pay" className={btnAccent}>
                  Full report kharidein
                </Link>
              )}
            </div>
          }
        >
          {rows.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Abhi tak koi kundli nahi bani.{" "}
              <Link to="/" className="text-primary underline">
                Nayi kundli banayein
              </Link>
              .
            </p>
          ) : (
            <div className="space-y-2">
              {rows.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 p-3 text-xs">
                  <div>
                    <p className="font-medium">{r.name}</p>
                    <p className="text-muted-foreground">
                      {r.dob} · {r.birth_time} · {r.place}
                    </p>
                  </div>
                  <Link to="/report" search={{ id: r.id }} className={btnAccent}>
                    Khole / PDF
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Assigned Subadmin">
          {me.subAdmin ? (
            <div className="grid gap-2 text-xs sm:grid-cols-2">
              <p>
                <span className="text-muted-foreground">Name:</span> {me.subAdmin.name}
              </p>
              <p>
                <span className="text-muted-foreground">Referral code:</span> {me.subAdmin.username}
              </p>
              <p>
                <span className="text-muted-foreground">Service:</span> {me.subAdmin.service_type || "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Location:</span> {me.subAdmin.location || "—"}
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Abhi koi subadmin assign nahi hua.</p>
          )}
        </Panel>

        <Panel title="Payment records">
          {payments.length === 0 ? (
            <p className="text-xs text-muted-foreground">Abhi tak koi payment nahi.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="p-2">Date</th>
                    <th className="p-2">Amount</th>
                    <th className="p-2">Gateway</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Transaction</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-t border-border/60">
                      <td className="p-2 whitespace-nowrap">{new Date(p.created_at).toLocaleDateString("en-IN")}</td>
                      <td className="p-2">₹{Math.round(p.amount / 100)}</td>
                      <td className="p-2">{p.gateway}</td>
                      <td className={`p-2 ${p.status === "paid" ? "text-primary" : "text-muted-foreground"}`}>{p.status}</td>
                      <td className="p-2 text-[11px] break-all">{p.payment_id ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Telegram support" sub="Full report payment ke baad aapke guide ka Telegram bot khul jaata hai.">
          {telegram?.available && telegram.link ? (
            <a href={telegram.link} target="_blank" rel="noreferrer" className={btnAccent}>
              Telegram par apne guide se baat karein
            </a>
          ) : (
            <p className="text-xs text-muted-foreground">
              {paid
                ? "Aapke guide ne abhi Telegram bot link set nahi kiya. Neeche chat se sampark karein."
                : "Full report payment ke baad Telegram support link yahan dikhega."}
            </p>
          )}
        </Panel>

        {me.subAdmin ? (
          <Chat meId={me.userId} peerId={me.subAdmin.id} peerName={me.subAdmin.name || "Aapka guide"} />
        ) : null}
      </div>
    </main>
  );
}
