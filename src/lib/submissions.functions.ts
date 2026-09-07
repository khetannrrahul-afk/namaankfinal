import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  mobile: z.string().trim().max(30).default(""),
  email: z.string().trim().max(200).default(""),
});

/** Server-side check: admin ne is contact ko deactivate kiya hai ya nahi. */
export const checkContactBlocked = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("namaank_submissions")
      .select("id")
      .eq("is_active", false)
      .or(`mobile.eq.${data.mobile},email.ilike.${data.email}`)
      .limit(1);
    if (error) return { blocked: false };
    return { blocked: Boolean(rows && rows.length > 0) };
  });
