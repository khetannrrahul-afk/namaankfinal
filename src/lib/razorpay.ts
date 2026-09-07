import { createRazorpayOrder, verifyRazorpayPayment } from "./payments.functions";

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
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export type PayResult =
  | { ok: true; paymentId: string; orderId: string }
  | { ok: false; message: string; paymentId?: string; orderId?: string };

/** Razorpay checkout kholo aur payment verify karke result do. */
export async function payForFullReport(
  user: { name: string; email: string; mobile: string },
  onStage?: (stage: string) => void,
): Promise<PayResult> {
  onStage?.("Payment window load ho raha hai…");
  const loaded = await loadCheckout();
  if (!loaded) return { ok: false, message: "Payment window load nahi hua. Internet check karein." };

  onStage?.("Order ban raha hai…");
  const order = await createRazorpayOrder({ data: user });
  if ("error" in order) return { ok: false, message: order.error };

  return new Promise<PayResult>((resolve) => {
    const rzp = new window.Razorpay!({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: "NAMAANK",
      description: "Full Life Report (23 pages)",
      prefill: { name: user.name, email: user.email, contact: user.mobile },
      theme: { color: "#7c3aed" },
      modal: {
        ondismiss: () => resolve({ ok: false, message: "Payment cancel ho gaya.", orderId: order.orderId }),
      },
      handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        onStage?.("Payment verify ho raha hai…");
        const v = await verifyRazorpayPayment({
          data: {
            orderId: r.razorpay_order_id,
            paymentId: r.razorpay_payment_id,
            signature: r.razorpay_signature,
          },
        });
        resolve(
          v.verified
            ? { ok: true, paymentId: r.razorpay_payment_id, orderId: r.razorpay_order_id }
            : {
                ok: false,
                message: "Payment verify nahi ho paya.",
                paymentId: r.razorpay_payment_id,
                orderId: r.razorpay_order_id,
              },
        );
      },
    });
    rzp.open();
  });
}
