import crypto from "crypto";
import { prisma } from "./prisma.js";

/** Idempotent: mark ONLINE order paid once, decrement stock, clear cart */
export async function finalizePaidOrder(orderId, razorpayPaymentId) {
  await prisma.$transaction(async (tx) => {
    const paid = await tx.order.updateMany({
      where: {
        id: orderId,
        paymentMethod: "ONLINE",
        paymentStatus: "pending",
      },
      data: {
        paymentStatus: "paid",
        ...(razorpayPaymentId ? { razorpayPaymentId } : {}),
      },
    });
    if (paid.count === 0) return;

    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { lines: true },
    });
    if (!order) return;

    for (const line of order.lines) {
      if (line.productId) {
        await tx.product.update({
          where: { id: line.productId },
          data: { stock: { decrement: line.quantity } },
        });
      }
    }

    await tx.cartItem.deleteMany({ where: { userId: order.userId } });
  });
}

export function verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return expected === razorpay_signature;
}

export function verifyWebhookSignature(rawBodyBuffer, signatureHeader) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBodyBuffer).digest("hex");
  return expected === signatureHeader;
}
