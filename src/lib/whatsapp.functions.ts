import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

interface NotifyInput {
  to: string;
  text: string;
}

/**
 * WhatsApp Cloud API se text notification bhejta hai.
 * Config (phone number id + access token) superadmin whatsapp_configs mein set karta hai.
 * Config na hone par silently skip ho jaata hai.
 */
export const sendWhatsApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: NotifyInput) => {
    if (!d?.to || !d?.text) throw new Error("to and text required");
    return d;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cfg } = await supabaseAdmin
      .from("whatsapp_configs")
      .select("phone_number_id,access_token,is_enabled")
      .eq("id", "global")
      .maybeSingle();

    if (!cfg?.is_enabled || !cfg.phone_number_id || !cfg.access_token) {
      return { sent: false, reason: "not_configured" };
    }

    const to = data.to.replace(/\D/g, "");
    if (!to) return { sent: false, reason: "bad_number" };

    const res = await fetch(`https://graph.facebook.com/v20.0/${cfg.phone_number_id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.access_token}` },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: data.text } }),
    });

    if (!res.ok) {
      console.error(`WhatsApp send failed [${res.status}]`);
      return { sent: false, reason: `whatsapp_${res.status}` };
    }
    return { sent: true, reason: "ok" };
  });
