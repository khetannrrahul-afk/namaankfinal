import { createFileRoute } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "crypto";

function secretFor(token: string) {
  return createHash("sha256").update(`namaank-telegram:${token}`).digest("base64url");
}
function safeEqual(a: string, b: string) {
  const l = Buffer.from(a);
  const r = Buffer.from(b);
  return l.length === r.length && timingSafeEqual(l, r);
}

export const Route = createFileRoute("/api/public/telegram/$sub")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: bot } = await supabaseAdmin
          .from("sub_admin_bots")
          .select("sub_admin_id,bot_token,sub_admin_chat_id,super_admin_chat_id,is_enabled")
          .eq("sub_admin_id", params.sub)
          .maybeSingle();

        if (!bot || !bot.is_enabled || !bot.bot_token) return new Response("Not configured", { status: 404 });

        const got = request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";
        if (!safeEqual(got, secretFor(bot.bot_token))) return new Response("Unauthorized", { status: 401 });

        const update = (await request.json()) as {
          message?: { chat?: { id?: number }; text?: string };
          edited_message?: { chat?: { id?: number }; text?: string };
        };
        const m = update.message ?? update.edited_message;
        const chatId = String(m?.chat?.id ?? "");
        const body = (m?.text ?? "").trim();
        if (!chatId || !body) return Response.json({ ok: true, ignored: true });

        // Super admin ka id
        const { data: sup } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "super_admin").limit(1);
        const superId = sup?.[0]?.user_id ?? null;
        if (!superId) return Response.json({ ok: true, ignored: true });

        let sender: string | null = null;
        let recipient: string | null = null;
        if (chatId === bot.sub_admin_chat_id) {
          sender = bot.sub_admin_id;
          recipient = superId;
        } else if (chatId === bot.super_admin_chat_id) {
          sender = superId;
          recipient = bot.sub_admin_id;
        }
        if (!sender || !recipient) return Response.json({ ok: true, ignored: true });

        const { error } = await supabaseAdmin.from("messages").insert({
          sender_id: sender,
          recipient_id: recipient,
          body,
          delivered_to_telegram: true,
        });
        if (error) return Response.json({ error: error.message }, { status: 500 });

        return Response.json({ ok: true });
      },
    },
  },
});
