import { createPaymentOrder, verifyPayment } from "./billing.functions";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadCheckout(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export type CheckoutResult =
  | { ok: true; paymentId: string; orderId: string }
  | { ok: false; message: string; orderId?: string };

/** Signed-in user ke liye full report payment. Amount server se aata hai. */
export async function payForFullReportAsUser(onStage?: (s: string) => void): Promise<CheckoutResult> {
  onStage?.("Payment window khul raha hai…");
  const loaded = await loadCheckout();
  if (!loaded) return { ok: false, message: "Payment window load nahi ho paya. Internet check karein." };

  const order = await createPaymentOrder({ data: { gateway: "razorpay" } });
  if ("error" in order) return { ok: false, message: order.error };

  return new Promise<CheckoutResult>((resolve) => {
    const rzp = new window.Razorpay!({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: "NAMAANK",
      description: "Full Report",
      order_id: order.orderId,
      prefill: { name: order.name, email: order.email, contact: order.mobile },
      theme: { color: "#f5b642" },
      modal: {
        ondismiss: () => resolve({ ok: false, message: "Payment cancel ho gaya.", orderId: order.orderId }),
      },
      handler: async (res: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
        onStage?.("Payment verify ho raha hai…");
        const v = await verifyPayment({
          data: {
            orderId: res.razorpay_order_id,
            paymentId: res.razorpay_payment_id,
            signature: res.razorpay_signature,
            gateway: "razorpay",
          },
        });
        if (v.verified) resolve({ ok: true, paymentId: res.razorpay_payment_id, orderId: res.razorpay_order_id });
        else resolve({ ok: false, message: "Payment verify nahi ho paya. Support se sampark karein.", orderId: res.razorpay_order_id });
      },
    });
    rzp.open();
  });
}
