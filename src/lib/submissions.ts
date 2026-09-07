import { supabase } from "@/integrations/supabase/client";
import type { BirthInput } from "./numerology";
import { identityKey } from "./numerology";
import { checkContactBlocked } from "./submissions.functions";

/** Admin ne is contact ko deactivate kiya hai ya nahi. */
export async function isContactBlocked(mobile: string, email: string): Promise<boolean> {
  try {
    const res = await checkContactBlocked({ data: { mobile, email } });
    return Boolean(res?.blocked);
  } catch {
    return false;
  }
}

/** User ki details database mein save karo (agar signed in ho to uske account se juda hua). */
export async function saveSubmission(v: BirthInput): Promise<string | null> {
  let userId: string | null = null;
  let subAdminId: string | null = null;

  const { data: auth } = await supabase.auth.getUser();
  if (auth.user) {
    userId = auth.user.id;
    const { data: profile } = await supabase.from("profiles").select("referred_by").eq("id", auth.user.id).maybeSingle();
    subAdminId = profile?.referred_by ?? null;
  }

  const { error } = await supabase.from("namaank_submissions").insert({
    lang: v.lang,
    name: v.name,
    dob: v.dob,
    birth_time: v.time,
    timezone: v.timezone,
    gender: v.gender,
    place: v.place,
    lat: v.lat ?? null,
    lon: v.lon ?? null,
    mobile: v.mobile,
    email: v.email,
    user_id: userId,
    sub_admin_id: subAdminId,
    identity_key: identityKey(v),
  });
  return error ? error.message : null;
}
