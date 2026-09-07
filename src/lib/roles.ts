import { supabase } from "@/integrations/supabase/client";

export type Role = "super_admin" | "sub_admin" | "admin" | "user";

export interface Me {
  userId: string;
  email: string;
  fullName: string;
  roles: Role[];
  referralCode: string;
  referredBy: string | null;
  isSuper: boolean;
  isSub: boolean;
}

/** Signed-in user ka role + profile. Signed out par null. */
export async function getMe(): Promise<Me | null> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return null;

  const [{ data: roleRows }, { data: profile }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", user.id),
    supabase.from("profiles").select("full_name,referral_code,referred_by,email").eq("id", user.id).maybeSingle(),
  ]);

  const roles = ((roleRows ?? []).map((r) => r.role) as Role[]) ?? [];
  return {
    userId: user.id,
    email: profile?.email ?? user.email ?? "",
    fullName: profile?.full_name ?? "",
    roles,
    referralCode: profile?.referral_code ?? "",
    referredBy: profile?.referred_by ?? null,
    isSuper: roles.includes("super_admin") || roles.includes("admin"),
    isSub: roles.includes("sub_admin"),
  };
}

/** Role ke hisaab se landing panel. */
export function homeFor(me: Me): string {
  if (me.isSuper) return "/superadmin";
  if (me.isSub) return "/subadmin";
  return "/me";
}
