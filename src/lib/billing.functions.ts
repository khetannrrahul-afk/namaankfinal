import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Payment architecture modular hai: har payment row mein `gateway` field hai.
 * Abhi Razorpay implemented hai; naya gateway add karne ke liye sirf
 * `createGatewayOrder` / `verifyGatewayPayment` mein ek case add karna hoga.
 */
export type Gateway = "razorpay";

/** User ke assigned sub admin ka price + enabled gateway. */
export const getMyPricing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase.from("profiles").select("referred_by").eq("id", userId).maybeSingle();
    const subAdminId = profile?.referred_by ?? null;

    let priceInr = 399;
    let subAdminName = "";
    if (subAdminId) {
      const { data: sub } = await supabase
        .from("sub_admins")
        .select("name,full_report_price_inr")
        .eq("id", subAdminId)
        .maybeSingle();
      if (sub) {
        priceInr = sub.full_report_price_inr;
        subAdminName = sub.name;
      }
    }

    const { data: settings } = await supabase.from("app_settings").select("key,value").eq("is_public", true);
    const map = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value]));
    const gateways: Gateway[] = [];
    if ((map["gateway_razorpay_enabled"] ?? "true") === "true") gateways.push("razorpay");

    return { priceInr, subAdminId, subAdminName, gateways };
  });

/** Order banao — amount hamesha server par decide hota hai, client se nahi. */
export const createPaymentOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { gateway?: Gateway }) => ({ gateway: d?.gateway ?? ("razorpay" as Gateway) }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { getCreds, createOrder } = await import("./payments.server");

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name,email,mobile,referred_by")
      .eq("id", userId)
      .maybeSingle();
    const subAdminId = profile?.referred_by ?? null;

    let priceInr = 399;
    if (subAdminId) {
      const { data: sub } = await supabase.from("sub_admins").select("full_report_price_inr").eq("id", subAdminId).maybeSingle();
      if (sub) priceInr = sub.full_report_price_inr;
    }
    const amount = Math.round(priceInr * 100);

    const creds = await getCreds();
    if (!creds) return { error: "Payment abhi configure nahi hua hai. Apne guide ya support se sampark karein." } as const;

    const order = await createOrder(creds, amount, { user_id: userId, sub_admin_id: subAdminId ?? "" });
    if (!order) return { error: "Order banane mein samasya hui. Thodi der baad try karein." } as const;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("payments").insert({
      user_id: userId,
      sub_admin_id: subAdminId,
      gateway: data.gateway,
      purpose: "full_report",
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      status: "created",
      name: profile?.full_name ?? null,
      email: profile?.email ?? null,
      mobile: profile?.mobile ?? null,
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: creds.keyId,
      priceInr,
      name: profile?.full_name ?? "",
      email: profile?.email ?? "",
      mobile: profile?.mobile ?? "",
    } as const;
  });

/** Signature verify hone par hi full report unlock hoti hai. */
export const verifyPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string; paymentId: string; signature: string; gateway?: Gateway }) => {
    if (!d?.orderId || !d?.paymentId || !d?.signature) throw new Error("Invalid payment data");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { getCreds, verifySignature } = await import("./payments.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const creds = await getCreds();
    if (!creds) return { verified: false, reason: "not_configured" } as const;

    const verified = await verifySignature(creds.keySecret, data.orderId, data.paymentId, data.signature);

    const { data: row } = await supabaseAdmin
      .from("payments")
      .update({ payment_id: data.paymentId, status: verified ? "paid" : "failed" })
      .eq("order_id", data.orderId)
      .eq("user_id", userId)
      .select("id,sub_admin_id,amount")
      .maybeSingle();

    if (!verified) return { verified: false, reason: "signature_mismatch" } as const;

    const now = new Date().toISOString();
    await supabaseAdmin.from("report_access").upsert(
      { user_id: userId, full_unlocked: true, full_unlocked_at: now, payment_id: row?.id ?? null, updated_at: now },
      { onConflict: "user_id" },
    );

    if (row?.sub_admin_id) {
      await supabaseAdmin.from("notifications").insert({
        recipient_id: row.sub_admin_id,
        kind: "payment",
        title: "Naya payment mila",
        body: `₹${Math.round((row.amount ?? 0) / 100)} ka full report payment successful hua.`,
      });
    }

    return { verified: true, paymentId: data.paymentId } as const;
  });

/** Full report unlock hone ke baad assigned sub admin ka Telegram support link. */
export const getTelegramSupport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: access } = await supabase.from("report_access").select("full_unlocked").eq("user_id", userId).maybeSingle();
    if (!access?.full_unlocked) return { available: false as const };

    const { data: profile } = await supabase.from("profiles").select("referred_by").eq("id", userId).maybeSingle();
    if (!profile?.referred_by) return { available: false as const };

    const { data: sub } = await supabase
      .from("sub_admins")
      .select("name,telegram_bot_link")
      .eq("id", profile.referred_by)
      .maybeSingle();

    if (!sub?.telegram_bot_link) return { available: false as const };
    return { available: true as const, link: sub.telegram_bot_link, subAdminName: sub.name };
  });
