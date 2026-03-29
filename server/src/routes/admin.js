import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.use(requireAdmin);

router.get("/dashboard", async (_req, res) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const [todayOrders, lowStock, totalProducts, pendingOnline] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: start } } }),
    prisma.product.count({
      where: { isActive: true, stock: { lte: 10 } },
    }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count({
      where: { paymentMethod: "ONLINE", paymentStatus: "pending" },
    }),
  ]);

  res.json({
    todayOrders,
    lowStockCount: lowStock,
    activeProducts: totalProducts,
    pendingOnlinePayments: pendingOnline,
  });
});

// Categories
const categoryCreate = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

router.post("/categories", async (req, res) => {
  const parsed = categoryCreate.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  try {
    const cat = await prisma.category.create({ data: parsed.data });
    res.status(201).json({ category: cat });
  } catch (e) {
    if (e.code === "P2002") {
      return res.status(409).json({ error: "Slug already exists" });
    }
    throw e;
  }
});

router.patch("/categories/:id", async (req, res) => {
  const parsed = categoryCreate.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  try {
    const cat = await prisma.category.update({
      where: { id: req.params.id },
      data: parsed.data,
    });
    res.json({ category: cat });
  } catch (e) {
    if (e.code === "P2025") {
      return res.status(404).json({ error: "Not found" });
    }
    throw e;
  }
});

router.delete("/categories/:id", async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    if (e.code === "P2025") {
      return res.status(404).json({ error: "Not found" });
    }
    throw e;
  }
});

// Products
const productCreate = z.object({
  categoryId: z.string(),
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  pricePaise: z.number().int().positive(),
  unitLabel: z.string().min(1).optional(),
  imageUrl: z.union([z.string().url(), z.literal("")]).optional(),
  stock: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

router.post("/products", async (req, res) => {
  const parsed = productCreate.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const data = { ...parsed.data };
  if (data.imageUrl === "") delete data.imageUrl;
  try {
    const product = await prisma.product.create({ data });
    res.status(201).json({ product });
  } catch (e) {
    if (e.code === "P2002") {
      return res.status(409).json({ error: "Slug already exists" });
    }
    throw e;
  }
});

router.patch("/products/:id", async (req, res) => {
  const parsed = productCreate.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const data = { ...parsed.data };
  if (data.imageUrl === "") data.imageUrl = null;
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ product });
  } catch (e) {
    if (e.code === "P2025") {
      return res.status(404).json({ error: "Not found" });
    }
    throw e;
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    if (e.code === "P2025") {
      return res.status(404).json({ error: "Not found" });
    }
    throw e;
  }
});

router.get("/products", async (_req, res) => {
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    include: { category: { select: { id: true, name: true, slug: true } } },
  });
  res.json({ products });
});

// Orders (admin)
router.get("/orders", async (req, res) => {
  const status =
    typeof req.query.status === "string" && req.query.status
      ? req.query.status
      : undefined;
  const orders = await prisma.order.findMany({
    where: status ? { orderStatus: status } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, email: true, name: true, phone: true } },
      lines: true,
    },
    take: 200,
  });
  res.json({ orders });
});

const statusSchema = z.object({
  orderStatus: z.enum([
    "placed",
    "confirmed",
    "packed",
    "out_for_delivery",
    "delivered",
    "cancelled",
  ]),
});

router.patch("/orders/:id/status", async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  try {
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { orderStatus: parsed.data.orderStatus },
      include: { lines: true, user: { select: { email: true, name: true } } },
    });
    res.json({ order });
  } catch (e) {
    if (e.code === "P2025") {
      return res.status(404).json({ error: "Not found" });
    }
    throw e;
  }
});

export default router;
