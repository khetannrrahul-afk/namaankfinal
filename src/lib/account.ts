import { supabase } from "@/integrations/supabase/client";

export type Role = "super_admin" | "sub_admin" | "admin" | "user";

export interface SubAdminInfo {
  id: string;
  name: string;
  username: string;
  mobile: string;
  whatsapp: string;
  service_type: string;
  location: string;
  email: string;
  facebook_url: string;
  instagram_url: string;
  telegram_bot_link: string;
  require_facebook: boolean;
  require_instagram: boolean;
  require_share: boolean;
  full_report_price_inr: number;
  admin_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AdminInfo {
  id: string;
  company_name: string;
  username: string;
  mobile: string;
  whatsapp: string;
  email: string;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
}

export interface ReportAccess {
  short_unlocked: boolean;
  full_unlocked: boolean;
  short_unlocked_at: string | null;
  full_unlocked_at: string | null;
}

export interface Account {
  userId: string;
  email: string;
  fullName: string;
  mobile: string;
  city: string;
  isActive: boolean;
  roles: Role[];
  referralCode: string | null;
  referredBy: string | null;
  isSuper: boolean;
  isAdmin: boolean;
  isSub: boolean;
  subAdmin: SubAdminInfo | null;
  admin: AdminInfo | null;
  access: ReportAccess;
}

export const EMPTY_ACCESS: ReportAccess = {
  short_unlocked: false,
  full_unlocked: false,
  short_unlocked_at: null,
  full_unlocked_at: null,
};

/** Signed-in member ka poora account: profile, role, assigned sub admin aur report access. */
export async function getAccount(): Promise<Account | null> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return null;

  const [{ data: roleRows }, { data: profile }, { data: access }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", user.id),
    supabase.from("profiles").select("full_name,email,mobile,city,referral_code,referred_by,is_active").eq("id", user.id).maybeSingle(),
    supabase.from("report_access").select("short_unlocked,full_unlocked,short_unlocked_at,full_unlocked_at").eq("user_id", user.id).maybeSingle(),
  ]);

  const roles = (roleRows ?? []).map((r) => r.role) as Role[];

  let subAdmin: SubAdminInfo | null = null;
  if (profile?.referred_by) {
    const { data } = await supabase.from("sub_admins").select("*").eq("id", profile.referred_by).maybeSingle();
    subAdmin = (data as SubAdminInfo | null) ?? null;
  }

  let admin: AdminInfo | null = null;
  if (roles.includes("admin")) {
    const { data } = await supabase.from("admins").select("*").eq("id", user.id).maybeSingle();
    admin = (data as AdminInfo | null) ?? null;
  }

  return {
    userId: user.id,
    email: profile?.email || user.email || "",
    fullName: profile?.full_name ?? "",
    mobile: profile?.mobile ?? "",
    city: profile?.city ?? "",
    isActive: profile?.is_active ?? true,
    roles,
    referralCode: profile?.referral_code ?? null,
    referredBy: profile?.referred_by ?? null,
    isSuper: roles.includes("super_admin"),
    isAdmin: roles.includes("admin"),
    isSub: roles.includes("sub_admin"),
    subAdmin,
    admin,
    access: (access as ReportAccess | null) ?? EMPTY_ACCESS,
  };
}

/** Role ke hisaab se landing panel. */
export function homeFor(a: Account): string {
  if (a.isSuper) return "/superadmin";
  if (a.isAdmin) return "/admin";
  if (a.isSub) return "/subadmin";
  return "/me";
}

/** Kaunse social steps abhi baaki hain. */
export function pendingSocialActions(sub: SubAdminInfo | null, done: string[]): string[] {
  if (!sub) return [];
  const need: string[] = [];
  if (sub.require_facebook) need.push("facebook_like");
  if (sub.require_instagram) need.push("instagram_follow");
  if (sub.require_share) need.push("share");
  return need.filter((n) => !done.includes(n));
}

export const SOCIAL_LABELS: Record<string, string> = {
  facebook_like: "Facebook page like karein",
  instagram_follow: "Instagram page follow karein",
  share: "Report link share karein",
};
