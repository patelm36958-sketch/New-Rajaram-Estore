import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import {
  finalizePaidOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from "../lib/payments.js";

const router = Router();

const verifySchema = z.object({
  orderId: z.string(),
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

router.post("/verify", requireAuth, async (req, res) => {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: req.user.sub },
  });
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  if (order.paymentMethod !== "ONLINE") {
    return res.status(400).json({ error: "Not an online payment order" });
  }
  if (order.razorpayOrderId !== razorpay_order_id) {
    return res.status(400).json({ error: "Razorpay order mismatch" });
  }
  if (order.paymentStatus === "paid") {
    const full = await prisma.order.findUnique({
      where: { id: orderId },
      include: { lines: true },
    });
    return res.json({ ok: true, order: full, alreadyPaid: true });
  }

  if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return res.status(400).json({ error: "Invalid payment signature" });
  }

  await finalizePaidOrder(orderId, razorpay_payment_id);

  const full = await prisma.order.findUnique({
    where: { id: orderId },
    include: { lines: true },
  });
  res.json({ ok: true, order: full });
});

/** Express handler: use after express.raw({ type: 'application/json' }) */
export async function razorpayWebhookHandler(req, res) {
  const signature = req.get("x-razorpay-signature");
  const ok = verifyWebhookSignature(req.body, signature || "");
  if (!ok) {
    return res.status(400).json({ error: "Invalid webhook signature" });
  }

  let payload;
  try {
    payload = JSON.parse(req.body.toString("utf8"));
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const event = payload.event;
  const payEntity = payload.payload?.payment?.entity;

  if (event === "payment.captured" && payEntity?.order_id && payEntity?.id) {
    try {
      const order = await prisma.order.findFirst({
        where: { razorpayOrderId: payEntity.order_id },
      });
      if (order) await finalizePaidOrder(order.id, payEntity.id);
    } catch (e) {
      console.error(e);
    }
  }

  res.json({ ok: true });
}

export default router;
