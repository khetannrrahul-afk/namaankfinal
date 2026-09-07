/** Server-only helpers for Razorpay: creds, price aur payment records. */

export interface RazorpayCreds {
  keyId: string;
  keySecret: string;
}

async function readSettings(): Promise<Record<string, string>> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("app_settings").select("key,value");
    return Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  } catch {
    return {};
  }
}

/** Pehle admin panel ki settings, warna environment secrets. */
export async function getCreds(): Promise<RazorpayCreds | null> {
  const s = await readSettings();
  const keyId = (s["razorpay_key_id"] || process.env["RAZORPAY_KEY_ID"] || "").trim();
  const keySecret = (s["razorpay_key_secret"] || process.env["RAZORPAY_KEY_SECRET"] || "").trim();
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret };
}

/** Full report ka price paise mein (default ₹399). */
export async function getAmountPaise(): Promise<number> {
  const s = await readSettings();
  const rupees = Number(s["full_report_price_inr"]);
  return Math.round((Number.isFinite(rupees) && rupees > 0 ? rupees : 399) * 100);
}

export async function recordPayment(row: {
  order_id: string;
  payment_id?: string | null;
  amount: number;
  status: string;
  name?: string | undefined;
  email?: string | undefined;
  mobile?: string | undefined;
}): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("payments").insert({
      order_id: row.order_id,
      payment_id: row.payment_id ?? null,
      amount: row.amount,
      status: row.status,
      name: row.name ?? null,
      email: row.email ?? null,
      mobile: row.mobile ?? null,
    });
  } catch {
    /* logging failure payment ko block na kare */
  }
}

export async function verifySignature(
  keySecret: string,
  orderId: string,
  paymentId: string,
  signature: string,
): Promise<boolean> {
  const { createHmac, timingSafeEqual } = await import("crypto");
  const expected = createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function createOrder(
  creds: RazorpayCreds,
  amount: number,
  notes: Record<string, string>,
): Promise<{ id: string; amount: number; currency: string } | null> {
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${btoa(`${creds.keyId}:${creds.keySecret}`)}`,
    },
    body: JSON.stringify({ amount, currency: "INR", receipt: `namaank_${Date.now()}`, notes }),
  });
  if (!res.ok) {
    console.error("razorpay order failed", res.status, await res.text());
    return null;
  }
  return (await res.json()) as { id: string; amount: number; currency: string };
}
