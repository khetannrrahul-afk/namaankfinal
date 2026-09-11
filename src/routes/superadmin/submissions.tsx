import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/superadmin/submissions")({
  staticData: { sitemap: false },
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Panel — NAMAANK Submissions" },
      {
        name: "description",
        content: "NAMAANK admin panel: user submissions dekhein aur kisi bhi user ko active/deactivate karein.",
      },
      { property: "og:title", content: "Admin Panel — NAMAANK" },
      { property: "og:description", content: "User submissions manage karein — activate ya deactivate." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

interface Row {
  id: string;
  created_at: string;
  lang: string;
  name: string;
  dob: string;
  birth_time: string;
  gender: string;
  place: string;
  mobile: string;
  email: string;
  is_active: boolean;
}

const SETTING_FIELDS: { key: string; label: string; hint: string; secret?: boolean }[] = [
  { key: "facebook_url", label: "Facebook page link", hint: "https://facebook.com/yourpage" },
  { key: "instagram_url", label: "Instagram profile link", hint: "https://instagram.com/yourprofile" },
  { key: "full_report_price_inr", label: "Full report price (₹)", hint: "399" },
  { key: "razorpay_key_id", label: "Razorpay Key ID", hint: "rzp_test_xxxxxxxx" },
  { key: "razorpay_key_secret", label: "Razorpay Key Secret", hint: "••••••••", secret: true },
];

function SettingsCard() {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("app_settings").select("key,value");
      setVals(Object.fromEntries((data ?? []).map((r) => [r.key, r.value])));
    })();
  }, []);

  const save = async () => {
    setMsg("");
    const rows = SETTING_FIELDS.map((f) => ({
      key: f.key,
      value: vals[f.key] ?? "",
      is_public: !f.key.startsWith("razorpay"),
    }));
    const { error } = await supabase.from("app_settings").upsert(rows, { onConflict: "key" });
    setMsg(error ? error.message : "Settings save ho gayi ✓");
  };

  return (
    <div className="surface mb-5 p-4">
      <h2 className="text-sm font-semibold text-primary">Settings — Social links & Payment</h2>
      <p className="mb-3 text-[11px] text-muted-foreground">
        Facebook/Instagram link aur Razorpay keys yahin se kabhi bhi add ya change kar sakte hain.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {SETTING_FIELDS.map((f) => (
          <label key={f.key} className="block text-xs">
            <span className="text-muted-foreground">{f.label}</span>
            <input
              type={f.secret ? "password" : "text"}
              autoComplete="off"
              placeholder={f.hint}
              value={vals[f.key] ?? ""}
              onChange={(e) => setVals((p) => ({ ...p, [f.key]: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-border bg-[var(--input)] px-3 py-2 text-sm"
            />
          </label>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button onClick={save} className="rounded-xl border border-primary/50 bg-primary/15 px-4 py-2 text-xs text-primary">
          Save settings
        </button>
        {msg && <span className="text-[11px] text-muted-foreground">{msg}</span>}
      </div>
    </div>
  );
}

function AdminPage() {

  const navigate = useNavigate();
  const [state, setState] = useState<"loading" | "denied" | "ok">("loading");
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("namaank_submissions")
      .select("id,created_at,lang,name,dob,birth_time,gender,place,mobile,email,is_active")
      .order("created_at", { ascending: false });
    if (error) setErr(error.message);
    else setRows((data ?? []) as Row[]);
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate({ to: "/auth" });
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin");
      if (!roles || roles.length === 0) {
        setState("denied");
        return;
      }
      setState("ok");
      await load();
    })();
  }, [navigate, load]);

  // Live connection: koi bhi change turant table mein dikhega.
  useEffect(() => {
    if (state !== "ok") return;
    const channel = supabase
      .channel("namaank_submissions_admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "namaank_submissions" }, () => {
        void load();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [state, load]);

  const toggle = async (r: Row) => {
    const { error } = await supabase
      .from("namaank_submissions")
      .update({ is_active: !r.is_active })
      .eq("id", r.id);
    if (error) setErr(error.message);
    else setRows((p) => p.map((x) => (x.id === r.id ? { ...x, is_active: !r.is_active } : x)));
  };

  const removeOne = async (r: Row) => {
    if (!confirm(`"${r.name}" ki submission delete karein? Ye wapas nahi aayegi.`)) return;
    const { error } = await supabase.from("namaank_submissions").delete().eq("id", r.id);
    if (error) setErr(error.message);
    else setRows((p) => p.filter((x) => x.id !== r.id));
  };

  const clearAll = async () => {
    if (!confirm("Saari submissions permanently delete karein? Ye undo nahi hoga.")) return;
    if (!confirm("Pakka? Poori history clear ho jayegi.")) return;
    const { error } = await supabase
      .from("namaank_submissions")
      .delete()
      .not("id", "is", null);
    if (error) setErr(error.message);
    else setRows([]);
  };



  const exportCsv = () => {
    const head = ["created_at", "name", "dob", "birth_time", "gender", "place", "mobile", "email", "lang", "is_active"];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
      head.join(","),
      ...rows.map((r) => head.map((h) => esc((r as unknown as Record<string, unknown>)[h])).join(",")),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "namaank-users.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (state === "loading") return <main className="p-10 text-sm text-muted-foreground">Loading…</main>;

  if (state === "denied")
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="text-xl font-semibold">Admin access nahi hai</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Aapka account signed in hai lekin usko abhi admin role nahi mila. Owner aapko admin bana sakta hai.
        </p>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/auth" });
          }}
          className="rounded-xl border border-border px-4 py-2 text-sm"
        >
          Sign out
        </button>
      </main>
    );

  const filtered = rows.filter((r) =>
    [r.name, r.email, r.mobile, r.place].join(" ").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold glow-text">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">
              {rows.length} submissions · {rows.filter((r) => r.is_active).length} active
            </p>
          </div>
          <div className="flex gap-2">
            <input
              className="rounded-xl border border-border bg-[var(--input)] px-3 py-2 text-sm"
              placeholder="Search naam / email / mobile"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button onClick={exportCsv} className="rounded-xl border border-primary/50 bg-primary/15 px-3 text-xs text-primary">
              CSV Export
            </button>
            <button
              onClick={clearAll}
              className="rounded-xl border border-destructive/50 bg-destructive/15 px-3 text-xs text-destructive"
            >
              Clear History
            </button>

            <button
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/auth" });
              }}
              className="rounded-xl border border-border px-3 text-xs"
            >
              Sign out
            </button>
          </div>
        </div>

        {err && <p className="mb-3 text-xs text-destructive">{err}</p>}

        <SettingsCard />


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
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-border/60">
                  <td className="p-2 whitespace-nowrap">{new Date(r.created_at).toLocaleString("en-IN")}</td>
                  <td className="p-2 font-medium">{r.name}</td>
                  <td className="p-2 whitespace-nowrap">
                    {r.dob} · {r.birth_time}
                  </td>
                  <td className="p-2 max-w-[220px] truncate">{r.place}</td>
                  <td className="p-2">{r.mobile}</td>
                  <td className="p-2">{r.email}</td>
                  <td className="p-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] ${
                        r.is_active ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"
                      }`}
                    >
                      {r.is_active ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    <button
                      onClick={() => toggle(r)}
                      className="rounded-lg border border-border px-2.5 py-1 text-[11px] hover:bg-secondary"
                    >
                      {r.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => removeOne(r)}
                      className="ml-2 rounded-lg border border-destructive/50 px-2.5 py-1 text-[11px] text-destructive hover:bg-destructive/10"
                    >
                      Delete
                    </button>

                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="p-4 text-muted-foreground" colSpan={8}>
                    Koi submission nahi mili.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
