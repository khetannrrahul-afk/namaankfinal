import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

interface SendInput {
  messageId: string;
}

/**
 * App chat ka message Telegram par bhi bhej deta hai.
 * Bot token / chat ID sirf super admin set karta hai (sub_admin_bots table).
 */
export const relayToTelegram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: SendInput) => {
    if (!d || typeof d.messageId !== "string") throw new Error("messageId required");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: msg } = await supabaseAdmin
      .from("messages")
      .select("id,sender_id,recipient_id,body,delivered_to_telegram")
      .eq("id", data.messageId)
      .maybeSingle();

    if (!msg) return { sent: false, reason: "not_found" };
    if (msg.sender_id !== context.userId) return { sent: false, reason: "forbidden" };
    if (msg.delivered_to_telegram) return { sent: true, reason: "already" };

    // Dono taraf mein se jo sub admin hai uska bot use hoga.
    const { data: bots } = await supabaseAdmin
      .from("sub_admin_bots")
      .select("sub_admin_id,bot_token,sub_admin_chat_id,super_admin_chat_id,is_enabled")
      .in("sub_admin_id", [msg.sender_id, msg.recipient_id]);

    const bot = (bots ?? []).find((b) => b.is_enabled && b.bot_token);
    if (!bot) return { sent: false, reason: "bot_not_configured" };

    // Recipient sub admin hai -> uska chat, warna super admin ka chat.
    const chatId = msg.recipient_id === bot.sub_admin_id ? bot.sub_admin_chat_id : bot.super_admin_chat_id;
    if (!chatId) return { sent: false, reason: "chat_id_missing" };

    const { data: sender } = await supabaseAdmin
      .from("profiles")
      .select("full_name,email")
      .eq("id", msg.sender_id)
      .maybeSingle();

    const from = sender?.full_name || sender?.email || "NAMAANK user";
    const res = await fetch(`https://api.telegram.org/bot${bot.bot_token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: `💬 ${from}:\n${msg.body}` }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`Telegram sendMessage failed [${res.status}]: ${text}`);
      return { sent: false, reason: `telegram_${res.status}` };
    }

    await supabaseAdmin.from("messages").update({ delivered_to_telegram: true }).eq("id", msg.id);
    return { sent: true, reason: "ok" };
  });

interface HookInput {
  subAdminId: string;
  baseUrl: string;
}

/** Super admin: sub admin ke bot ka webhook register karta hai. */
export const registerBotWebhook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: HookInput) => {
    if (!d?.subAdminId || !d?.baseUrl) throw new Error("subAdminId and baseUrl required");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { data: isSuper } = await context.supabase.rpc("is_super_admin");
    if (!isSuper) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { createHash } = await import("crypto");

    const { data: bot } = await supabaseAdmin
      .from("sub_admin_bots")
      .select("bot_token")
      .eq("sub_admin_id", data.subAdminId)
      .maybeSingle();
    if (!bot?.bot_token) return { ok: false, reason: "bot_token_missing" };

    const secret = createHash("sha256").update(`namaank-telegram:${bot.bot_token}`).digest("base64url");
    const url = `${data.baseUrl.replace(/\/$/, "")}/api/public/telegram/${data.subAdminId}`;
    const res = await fetch(`https://api.telegram.org/bot${bot.bot_token}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, secret_token: secret, allowed_updates: ["message", "edited_message"] }),
    });
    const text = await res.text();
    if (!res.ok) {
      console.error(`setWebhook failed [${res.status}]: ${text}`);
      return { ok: false, reason: `telegram_${res.status}`, detail: text };
    }
    return { ok: true, url };
  });
