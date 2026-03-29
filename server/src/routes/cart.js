import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const mergeItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(0),
});

const mergeSchema = z.object({
  items: z.array(mergeItemSchema),
});

router.use(requireAuth);

/** List cart with product details */
router.get("/", async (req, res) => {
  const items = await prisma.cartItem.findMany({
    where: { userId: req.user.sub },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          pricePaise: true,
          unitLabel: true,
          imageUrl: true,
          stock: true,
          isActive: true,
        },
      },
    },
  });
  res.json({
    items: items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      product: i.product,
    })),
  });
});

/** Replace quantities from guest localStorage merge */
router.post("/merge", async (req, res) => {
  const parsed = mergeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { items } = parsed.data;
  const userId = req.user.sub;

  for (const line of items) {
    const product = await prisma.product.findFirst({
      where: { id: line.productId, isActive: true },
    });
    if (!product) continue;

    if (line.quantity <= 0) {
      await prisma.cartItem.deleteMany({
        where: { userId, productId: line.productId },
      });
      continue;
    }

    const existing = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId: line.productId } },
    });
    const combined = (existing?.quantity ?? 0) + line.quantity;
    const qty = Math.min(combined, product.stock);
    if (qty <= 0) continue;

    await prisma.cartItem.upsert({
      where: { userId_productId: { userId, productId: line.productId } },
      create: { userId, productId: line.productId, quantity: qty },
      update: { quantity: qty },
    });
  }

  const merged = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          pricePaise: true,
          unitLabel: true,
          imageUrl: true,
          stock: true,
          isActive: true,
        },
      },
    },
  });

  res.json({
    items: merged.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      product: i.product,
    })),
  });
});

router.put("/items", async (req, res) => {
  const schema = z.object({
    productId: z.string(),
    quantity: z.number().int().min(0),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { productId, quantity } = parsed.data;
  const userId = req.user.sub;

  if (quantity === 0) {
    await prisma.cartItem.deleteMany({ where: { userId, productId } });
    return res.json({ ok: true });
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true },
  });
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  if (quantity > product.stock) {
    return res.status(400).json({ error: "Not enough stock", max: product.stock });
  }

  await prisma.cartItem.upsert({
    where: { userId_productId: { userId, productId } },
    create: { userId, productId, quantity },
    update: { quantity },
  });

  res.json({ ok: true });
});

router.delete("/items/:productId", async (req, res) => {
  await prisma.cartItem.deleteMany({
    where: { userId: req.user.sub, productId: req.params.productId },
  });
  res.json({ ok: true });
});

router.delete("/", async (req, res) => {
  await prisma.cartItem.deleteMany({ where: { userId: req.user.sub } });
  res.json({ ok: true });
});

export default router;
