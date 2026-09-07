import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMe, type Me } from "@/lib/roles";
import { Chat } from "@/components/panel/Chat";

export const Route = createFileRoute("/subadmin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sub Admin Panel — NAMAANK" },
      { name: "description", content: "Apne referral se jude users aur unki kundli details ek jagah dekhein." },
      { property: "og:title", content: "Sub Admin Panel — NAMAANK" },
      { property: "og:description", content: "Apne users manage karein aur super admin se chat karein." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SubAdminPage,
});

interface Row {
  id: string;
  created_at: string;
  name: string;
  dob: string;
  birth_time: string;
  place: string;
  mobile: string;
  email: string;
  is_active: boolean;
  user_id: string | null;
}

interface UserRow {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
}

function SubAdminPage() {
  const navigate = useNavigate();
  const [me, setMe] = useState<Me | null>(null);
  const [state, setState] = useState<"loading" | "denied" | "ok">("loading");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [superId, setSuperId] = useState<string | null>(null);
  const [chatWith, setChatWith] = useState<{ id: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const m = await getMe();
      if (!m) {
        navigate({ to: "/auth" });
        return;
      }
      setMe(m);
      if (!m.isSub && !m.isSuper) {
        setState("denied");
        return;
      }
      const [{ data: u }, { data: s }] = await Promise.all([
        supabase.from("profiles").select("id,full_name,email,created_at").eq("referred_by", m.userId),
        supabase
          .from("namaank_submissions")
          .select("id,created_at,name,dob,birth_time,place,mobile,email,is_active,user_id")
          .eq("sub_admin_id", m.userId)
          .order("created_at", { ascending: false }),
      ]);
      setUsers((u ?? []) as UserRow[]);
      setRows((s ?? []) as Row[]);
      const { data: sup } = await supabase.from("user_roles").select("user_id").eq("role", "super_admin").limit(1);
      setSuperId(sup?.[0]?.user_id ?? null);
      setState("ok");
    })();
  }, [navigate]);

  if (state === "loading") return <main className="p-10 text-sm text-muted-foreground">Loading…</main>;
  if (state === "denied")
    return (
      <main className="flex min-h-screen items-center justify-center p-10 text-center text-sm text-muted-foreground">
        Aapke account ko sub admin access nahi mila. Super admin aapko sub admin bana sakta hai.
      </main>
    );

  const link = typeof window !== "undefined" ? `${window.location.origin}/auth?ref=${me?.referralCode ?? ""}` : "";

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold glow-text">Sub Admin Panel</h1>
            <p className="text-xs text-muted-foreground">
              {users.length} users · {rows.length} kundliyan
            </p>
          </div>
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

        <div className="surface p-4">
          <h2 className="text-sm font-semibold text-primary">Aapka referral link</h2>
          <p className="mb-2 text-[11px] text-muted-foreground">
            Is link se jo bhi sign up karega, wo aapke users mein aa jayega. Code: <b>{me?.referralCode}</b>
          </p>
          <div className="flex gap-2">
            <input readOnly value={link} className="flex-1 rounded-xl border border-border bg-[var(--input)] px-3 py-2 text-xs" />
            <button
              onClick={() => {
                void navigator.clipboard.writeText(link);
                setCopied(true);
              }}
              className="rounded-xl border border-primary/50 bg-primary/15 px-3 text-xs text-primary"
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
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
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border/60">
                    <td className="p-2 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString("en-IN")}</td>
                    <td className="p-2 font-medium">{r.name}</td>
                    <td className="p-2 whitespace-nowrap">
                      {r.dob} · {r.birth_time}
                    </td>
                    <td className="p-2 max-w-[180px] truncate">{r.place}</td>
                    <td className="p-2">{r.mobile}</td>
                    <td className="p-2">{r.email}</td>
                    <td className="p-2">{r.is_active ? "Active" : "Deactivated"}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td className="p-4 text-muted-foreground" colSpan={7}>
                      Abhi koi kundli nahi mili.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-3">
            <div className="surface p-3">
              <h2 className="mb-2 text-sm font-semibold text-primary">Mere users</h2>
              <div className="space-y-1">
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setChatWith({ id: u.id, name: u.full_name || u.email || "User" })}
                    className="w-full rounded-lg border border-border/60 px-3 py-2 text-left text-xs hover:bg-secondary"
                  >
                    {u.full_name || u.email}
                  </button>
                ))}
                {users.length === 0 && <p className="text-xs text-muted-foreground">Abhi koi user join nahi hua.</p>}
              </div>
              {superId && (
                <button
                  onClick={() => setChatWith({ id: superId, name: "Super Admin" })}
                  className="mt-3 w-full rounded-lg border border-primary/50 bg-primary/15 px-3 py-2 text-xs text-primary"
                >
                  Super Admin se chat
                </button>
              )}
            </div>
            {me && chatWith && <Chat meId={me.userId} peerId={chatWith.id} peerName={chatWith.name} />}
          </div>
        </div>
      </div>
    </main>
  );
}
