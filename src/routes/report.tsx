import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAccount, pendingSocialActions, SOCIAL_LABELS, type Account } from "@/lib/account";
import { getMyReport, completeSocialAction } from "@/lib/report.functions";
import type { Analysis } from "@/lib/numerology";
import type { Lang } from "@/lib/langs/types";
import Report from "@/components/namaank/Report";
import AiReport from "@/components/namaank/AiReport";
import type { Direction, FocusArea, GeneratorInput, ReportSegments } from "@/lib/aiReport.functions";
import { PageHeader, Panel, Loading, btnAccent, btnGhost, btnPrimary } from "@/components/panel/Ui";

export const Route = createFileRoute("/report")({
  staticData: { sitemap: false },
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({ id: typeof s['id'] === "string" ? (s['id'] as string) : undefined }),
  head: () => ({
    meta: [
      { title: "Meri Report — NAMAANK" },
      { name: "description", content: "Apni NAMAANK short aur full numerology report dekhein aur PDF download karein." },
      { property: "og:title", content: "Meri Report — NAMAANK" },
      { property: "og:description", content: "Short report social steps ke baad, full report payment ke baad." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportPage,
});

interface Row {
  id: string;
  name: string;
  dob: string;
  birth_time: string;
  place: string;
  lang: string;
}

function ReportPage() {
  const navigate = useNavigate();
  const { id } = Route.useSearch();
  const [me, setMe] = useState<Account | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [doneActions, setDoneActions] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [ai, setAi] = useState<{ input: GeneratorInput; segments: ReportSegments } | null>(null);

  const refresh = async () => {
    const a = await getAccount();
    if (!a) {
      navigate({ to: "/auth" });
      return null;
    }
    setMe(a);
    const [{ data: subs }, { data: acts }, { data: aiRow }] = await Promise.all([
      supabase
        .from("namaank_submissions")
        .select("id,name,dob,birth_time,place,lang")
        .eq("user_id", a.userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false }),
      supabase.from("social_actions").select("action").eq("user_id", a.userId),
      supabase
        .from("ai_reports")
        .select("name,dob,birth_time,place,direction,focus,segments")
        .eq("user_id", a.userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    setRows((subs ?? []) as Row[]);
    setDoneActions((acts ?? []).map((r) => r.action as string));
    setAi(
      aiRow
        ? {
            input: {
              name: aiRow.name,
              dob: aiRow.dob,
              time: aiRow.birth_time ?? "",
              place: aiRow.place,
              direction: aiRow.direction as Direction,
              focus: aiRow.focus as FocusArea,
            },
            segments: aiRow.segments as unknown as ReportSegments,
          }
        : null,
    );
    return a;
  };


  useEffect(() => {
    void (async () => {
      await refresh();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const open = async (submissionId: string, scope: "short" | "full", lang?: Lang) => {
    setBusy(true);
    setMsg(null);
    const res = await getMyReport({ data: { submissionId, scope, ...(lang ? { lang } : {}) } });
    setBusy(false);
    if (res.locked) {
      const reasons: Record<string, string> = {
        payment_required: "Full report ke liye pehle payment karein.",
        social_required: "Pehle apne guide ke social steps poore karein.",
        not_found: "Yeh kundli nahi mili.",
        deactivated: "Yeh kundli admin dwara deactivate ki gayi hai.",
      };
      setMsg(reasons[res.reason] ?? "Report abhi lock hai.");
      setAnalysis(null);
      return;
    }
    setAnalysis(res.analysis as Analysis);
  };

  useEffect(() => {
    if (!loading && id && me?.access.short_unlocked) {
      void open(id, me.access.full_unlocked ? "full" : "short");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, id, me?.access.short_unlocked]);

  if (loading || !me) return <Loading />;

  const pending = pendingSocialActions(me.subAdmin, doneActions);
  const sub = me.subAdmin;

  if (analysis) {
    return (
      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-4">
          <PageHeader
            title="Meri Report"
            sub={me.access.full_unlocked ? "Full report — PDF download available" : "Short report"}
            right={
              <Link to="/me" className={btnGhost}>
                Dashboard
              </Link>
            }
          />
          <Report
            a={analysis}
            skipGate
            initialFull={me.access.full_unlocked}
            onReset={() => setAnalysis(null)}
            onLangChange={(l) => {
              const target = id ?? rows[0]?.id;
              if (target) void open(target, me.access.full_unlocked ? "full" : "short", l);
            }}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-5">
        <PageHeader
          title="Meri Report"
          sub="Short report social steps ke baad, full report payment ke baad khulti hai."
          right={
            <Link to="/me" className={btnGhost}>
              Dashboard
            </Link>
          }
        />

        {!me.access.short_unlocked && (
          <Panel title="Step 1 — Apne guide ko support karein" sub={sub ? `${sub.name} (${sub.username})` : undefined}>
            {pending.length === 0 ? (
              <p className="text-xs text-muted-foreground">Saare steps poore hain — page refresh karein.</p>
            ) : (
              <div className="space-y-2">
                {pending.map((p) => (
                  <div key={p} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 p-3 text-xs">
                    <span>{SOCIAL_LABELS[p]}</span>
                    <div className="flex gap-2">
                      {p === "facebook_like" && sub?.facebook_url && (
                        <a href={sub.facebook_url} target="_blank" rel="noreferrer" className={btnGhost}>
                          Facebook kholein
                        </a>
                      )}
                      {p === "instagram_follow" && sub?.instagram_url && (
                        <a href={sub.instagram_url} target="_blank" rel="noreferrer" className={btnGhost}>
                          Instagram kholein
                        </a>
                      )}
                      <button
                        className={btnAccent}
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true);
                          if (p === "share" && typeof navigator !== "undefined" && navigator.share) {
                            try {
                              await navigator.share({ title: "NAMAANK", url: window.location.origin });
                            } catch {
                              /* user cancelled */
                            }
                          }
                          const r = await completeSocialAction({ data: { action: p } });
                          await refresh();
                          setBusy(false);
                          setMsg(r.ok && r.shortUnlocked ? "Short report unlock ho gayi!" : null);
                        }}
                      >
                        Ho gaya
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        )}

        {me.access.short_unlocked && !me.access.full_unlocked && (
          <Panel title="Full report" sub="Poori life report, PDF download ke saath.">
            <Link to="/pay" className={btnPrimary}>
              Full report unlock karein
            </Link>
          </Panel>
        )}

        <Panel title="Aapki kundliyan">
          {rows.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Koi kundli nahi mili.{" "}
              <Link to="/" className="text-primary underline">
                Nayi banayein
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
                  <button
                    className={btnAccent}
                    disabled={busy || !me.access.short_unlocked}
                    onClick={() => open(r.id, me.access.full_unlocked ? "full" : "short")}
                  >
                    {me.access.full_unlocked ? "Full report kholein" : "Short report kholein"}
                  </button>
                </div>
              ))}
            </div>
          )}
          {msg && <p className="mt-3 text-xs text-primary">{msg}</p>}
        </Panel>
      </div>
    </main>
  );
}
