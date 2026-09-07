import { supabase } from "@/integrations/supabase/client";

export interface PublicSettings {
  facebookUrl: string;
  instagramUrl: string;
  priceInr: number;
}

export const DEFAULT_SETTINGS: PublicSettings = {
  facebookUrl: "",
  instagramUrl: "",
  priceInr: 399,
};

/** Admin ke set kiye hue public settings (social links + price). */
export async function getPublicSettings(): Promise<PublicSettings> {
  const { data, error } = await supabase.from("app_settings").select("key,value").eq("is_public", true);
  if (error || !data) return DEFAULT_SETTINGS;
  const map = Object.fromEntries(data.map((r) => [r.key, r.value])) as Record<string, string>;
  const price = Number(map["full_report_price_inr"]);
  return {
    facebookUrl: (map["facebook_url"] ?? "").trim(),
    instagramUrl: (map["instagram_url"] ?? "").trim(),
    priceInr: Number.isFinite(price) && price > 0 ? price : DEFAULT_SETTINGS.priceInr,
  };
}

/** Signed-in user admin hai ya nahi. */
export async function isAdminUser(): Promise<boolean> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return false;
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .eq("role", "admin");
  return Boolean(roles && roles.length > 0);
}
