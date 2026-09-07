import { createServerFn } from "@tanstack/react-start";

/** Razorpay order banao. Client ko sirf order id + public key id milta hai. */
export const createRazorpayOrder = createServerFn({ method: "POST" })
  .inputValidator((data: { name?: string; email?: string; mobile?: string }) => data)
  .handler(async ({ data }) => {
    const { getCreds, getAmountPaise, createOrder, recordPayment } = await import("./payments.server");
    const creds = await getCreds();
    if (!creds) {
      return { error: "Payment abhi configure nahi hua hai. Admin se sampark karein." as string } as const;
    }

    const amount = await getAmountPaise();
    const order = await createOrder(creds, amount, {
      name: data.name ?? "",
      email: data.email ?? "",
      mobile: data.mobile ?? "",
    });
    if (!order) return { error: "Order banane mein samasya hui. Thodi der baad try karein." as string } as const;

    await recordPayment({
      order_id: order.id,
      amount: order.amount,
      status: "created",
      name: data.name,
      email: data.email,
      mobile: data.mobile,
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: creds.keyId,
    } as const;
  });

/** Payment signature verify karo — tabhi full report unlock hota hai. */
export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .inputValidator((data: { orderId: string; paymentId: string; signature: string }) => {
    if (!data?.orderId || !data?.paymentId || !data?.signature) throw new Error("Invalid payment data");
    return data;
  })
  .handler(async ({ data }) => {
    const { getCreds, getAmountPaise, verifySignature, recordPayment } = await import("./payments.server");
    const creds = await getCreds();
    if (!creds) return { verified: false, paymentId: data.paymentId } as const;

    const verified = await verifySignature(creds.keySecret, data.orderId, data.paymentId, data.signature);
    await recordPayment({
      order_id: data.orderId,
      payment_id: data.paymentId,
      amount: await getAmountPaise(),
      status: verified ? "paid" : "failed",
    });
    return { verified, paymentId: data.paymentId } as const;
  });
