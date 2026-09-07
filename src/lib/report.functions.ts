import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { analyze, type BirthInput, type Analysis } from "./numerology";
import type { Lang } from "./langs/types";

type Scope = "short" | "full";

/**
 * Protected report gate.
 * Report tabhi banti hai jab user ka access unlock ho:
 *  - short  → assigned sub admin ke social steps poore hone chahiye
 *  - full   → payment successful hona chahiye
 * Access se pehle koi report data client par nahi jaata.
 */
export const getMyReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { submissionId: string; scope: Scope; lang?: Lang }) => {
    if (!d?.submissionId) throw new Error("submissionId required");
    if (d.scope !== "short" && d.scope !== "full") throw new Error("invalid scope");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: access } = await supabase
      .from("report_access")
      .select("short_unlocked,full_unlocked")
      .eq("user_id", userId)
      .maybeSingle();

    const unlocked = data.scope === "full" ? Boolean(access?.full_unlocked) : Boolean(access?.short_unlocked);
    if (!unlocked) {
      return {
        locked: true as const,
        reason: data.scope === "full" ? ("payment_required" as const) : ("social_required" as const),
      };
    }

    const { data: row } = await supabase
      .from("namaank_submissions")
      .select("id,user_id,is_active,lang,name,dob,birth_time,timezone,gender,place,lat,lon,mobile,email")
      .eq("id", data.submissionId)
      .maybeSingle();

    if (!row || row.user_id !== userId) return { locked: true as const, reason: "not_found" as const };
    if (!row.is_active) return { locked: true as const, reason: "deactivated" as const };

    const input: BirthInput = {
      lang: (data.lang ?? (row.lang as Lang)) || "hinglish",
      name: row.name,
      dob: row.dob,
      time: row.birth_time,
      timezone: row.timezone,
      gender: row.gender as BirthInput["gender"],
      place: row.place,
      lat: row.lat ?? undefined,
      lon: row.lon ?? undefined,
      mobile: row.mobile,
      email: row.email,
    };

    const analysis: Analysis = analyze(input);
    return { locked: false as const, scope: data.scope, analysis };
  });

/**
 * User ne sub admin ka social step poora kiya — record karo.
 * Saare zaroori steps poore hone par short report unlock ho jaati hai.
 */
export const completeSocialAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { action: string }) => {
    const allowed = ["facebook_like", "instagram_follow", "share"];
    if (!d?.action || !allowed.includes(d.action)) throw new Error("invalid action");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase.from("profiles").select("referred_by").eq("id", userId).maybeSingle();
    const subAdminId = profile?.referred_by ?? null;
    if (!subAdminId) return { ok: false as const, reason: "no_sub_admin" as const };

    const { data: sub } = await supabase
      .from("sub_admins")
      .select("require_facebook,require_instagram,require_share")
      .eq("id", subAdminId)
      .maybeSingle();

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("social_actions")
      .upsert({ user_id: userId, sub_admin_id: subAdminId, action: data.action }, { onConflict: "user_id,action" });

    const { data: done } = await supabaseAdmin.from("social_actions").select("action").eq("user_id", userId);
    const doneSet = new Set((done ?? []).map((d) => d.action));

    const required: string[] = [];
    if (sub?.require_facebook) required.push("facebook_like");
    if (sub?.require_instagram) required.push("instagram_follow");
    if (sub?.require_share) required.push("share");
    const allDone = required.every((r) => doneSet.has(r));

    if (allDone) {
      await supabaseAdmin.from("report_access").upsert(
        { user_id: userId, short_unlocked: true, short_unlocked_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );
    }

    return { ok: true as const, shortUnlocked: allDone, done: [...doneSet], required };
  });
