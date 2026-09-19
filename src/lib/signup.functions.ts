import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Public signup validation helpers.
 * These run server-side with the service role so that the underlying
 * SECURITY DEFINER database functions are not exposed to anon/authenticated
 * callers directly.
 */

const codeSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_ -]+$/);

export const hasAnyAccount = createServerFn({ method: "GET" }).handler(
  async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true });
    if (error) throw new Error("Failed to check accounts");
    return (count ?? 0) > 0;
  },
);

export const usernameAvailable = createServerFn({ method: "GET" })
  .inputValidator((data) => codeSchema.parse(data))
  .handler(async ({ data: username }) => {
    const u = username.trim().toUpperCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: sub }, { data: adm }] = await Promise.all([
      supabaseAdmin.from("sub_admins").select("id").eq("username", u).limit(1),
      supabaseAdmin.from("admins").select("id").eq("username", u).limit(1),
    ]);
    return !(sub && sub.length > 0) && !(adm && adm.length > 0);
  });

export const validateAdminCode = createServerFn({ method: "GET" })
  .inputValidator((data) => codeSchema.parse(data))
  .handler(async ({ data: code }) => {
    const c = code.trim().toUpperCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("admins")
      .select("id, company_name")
      .eq("username", c)
      .eq("is_active", true)
      .eq("is_approved", true)
      .limit(1);
    return data ?? [];
  });

export const validateReferralCode = createServerFn({ method: "GET" })
  .inputValidator((data) => codeSchema.parse(data))
  .handler(async ({ data: code }) => {
    const c = code.trim().toUpperCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("sub_admins")
      .select("id, name")
      .eq("username", c)
      .eq("is_active", true)
      .limit(1);
    return (data ?? []).map((r) => ({
      sub_admin_id: r.id,
      sub_admin_name: r.name,
    }));
  });
