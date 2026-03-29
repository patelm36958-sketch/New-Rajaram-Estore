import { Router } from "express";
import { z } from "zod";
import Razorpay from "razorpay";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const checkoutSchema = z.object({
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(3),
  phone: z.string().min(10),
  notes: z.string().optional(),
  paymentMethod: z.enum(["COD", "ONLINE"]),
});

function getRazorpay() {
  const key = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key || !secret) return null;
  return new Razorpay({ key_id: key, key_secret: secret });
}

/** Customer: create order from server cart */
router.post("/checkout", requireAuth, async (req, res) => {
  if (req.user.role !== "customer") {
    return res.status(403).json({ error: "Customers only" });
  }
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const body = parsed.data;
  const userId = req.user.sub;

  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
  });

  if (cartItems.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }

  for (const ci of cartItems) {
    if (!ci.product.isActive || ci.quantity > ci.product.stock) {
      return res.status(400).json({
        error: "Cart has invalid or out-of-stock items",
        productId: ci.productId,
      });
    }
  }

  const subtotalPaise = cartItems.reduce(
    (sum, ci) => sum + ci.product.pricePaise * ci.quantity,
    0
  );
  const totalPaise = subtotalPaise;

  if (body.paymentMethod === "COD") {
    const order = await prisma.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          userId,
          addressLine1: body.addressLine1,
          addressLine2: body.addressLine2,
          city: body.city,
          state: body.state,
          pincode: body.pincode,
          phone: body.phone,
          notes: body.notes,
          paymentMethod: "COD",
          paymentStatus: "pending",
          orderStatus: "placed",
          subtotalPaise,
          totalPaise,
          lines: {
            create: cartItems.map((ci) => ({
              productId: ci.productId,
              productName: ci.product.name,
              unitLabel: ci.product.unitLabel,
              unitPricePaise: ci.product.pricePaise,
              quantity: ci.quantity,
              lineTotalPaise: ci.product.pricePaise * ci.quantity,
            })),
          },
        },
      });

      for (const ci of cartItems) {
        await tx.product.update({
          where: { id: ci.productId },
          data: { stock: { decrement: ci.quantity } },
        });
      }

      await tx.cartItem.deleteMany({ where: { userId } });
      return o;
    });

    const full = await prisma.order.findUnique({
      where: { id: order.id },
      include: { lines: true },
    });
    return res.status(201).json({ order: full, razorpay: null });
  }

  // ONLINE
  const rzp = getRazorpay();
  if (!rzp) {
    return res.status(503).json({
      error: "Online payment is not configured (set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)",
    });
  }

  const order = await prisma.$transaction(async (tx) => {
    const o = await tx.order.create({
      data: {
        userId,
        addressLine1: body.addressLine1,
        addressLine2: body.addressLine2,
        city: body.city,
        state: body.state,
        pincode: body.pincode,
        phone: body.phone,
        notes: body.notes,
        paymentMethod: "ONLINE",
        paymentStatus: "pending",
        orderStatus: "placed",
        subtotalPaise,
        totalPaise,
        lines: {
          create: cartItems.map((ci) => ({
            productId: ci.productId,
            productName: ci.product.name,
            unitLabel: ci.product.unitLabel,
            unitPricePaise: ci.product.pricePaise,
            quantity: ci.quantity,
            lineTotalPaise: ci.product.pricePaise * ci.quantity,
          })),
        },
      },
    });

    const rzpOrder = await rzp.orders.create({
      amount: totalPaise,
      currency: "INR",
      receipt: o.id.slice(0, 40),
      notes: { orderId: o.id },
    });

    await tx.order.update({
      where: { id: o.id },
      data: { razorpayOrderId: rzpOrder.id },
    });

    return { orderId: o.id, rzpOrderId: rzpOrder.id, amount: totalPaise };
  });

  // Keep server cart until payment is verified; stock is decremented on payment success.

  const full = await prisma.order.findUnique({
    where: { id: order.orderId },
    include: { lines: true },
  });

  res.status(201).json({
    order: full,
    razorpay: {
      orderId: order.rzpOrderId,
      amount: order.amount,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
    },
  });
});

router.get("/mine", requireAuth, async (req, res) => {
  if (req.user.role !== "customer") {
    return res.status(403).json({ error: "Customers only" });
  }
  const orders = await prisma.order.findMany({
    where: { userId: req.user.sub },
    orderBy: { createdAt: "desc" },
    include: {
      lines: {
        select: {
          id: true,
          productName: true,
          quantity: true,
          unitPricePaise: true,
          lineTotalPaise: true,
          unitLabel: true,
        },
      },
    },
  });
  res.json({ orders });
});

router.get("/mine/:id", requireAuth, async (req, res) => {
  if (req.user.role !== "customer") {
    return res.status(403).json({ error: "Customers only" });
  }
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, userId: req.user.sub },
    include: { lines: true },
  });
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  res.json({ order });
});

export default router;
