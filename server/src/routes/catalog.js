import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/categories", async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { products: { where: { isActive: true } } } },
    },
  });
  res.json({
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      sortOrder: c.sortOrder,
      productCount: c._count.products,
    })),
  });
});

router.get("/products", async (req, res) => {
  const q = req.query;
  const search = typeof q.q === "string" ? q.q.trim() : "";
  const categorySlug = typeof q.category === "string" ? q.category : undefined;
  const minPrice = q.minPrice != null ? Number(q.minPrice) : undefined;
  const maxPrice = q.maxPrice != null ? Number(q.maxPrice) : undefined;

  const where = {
    isActive: true,
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
          ],
        }
      : {}),
    ...(categorySlug
      ? { category: { slug: categorySlug } }
      : {}),
    ...(
      Number.isFinite(minPrice) || Number.isFinite(maxPrice)
        ? {
            pricePaise: {
              ...(Number.isFinite(minPrice) ? { gte: minPrice } : {}),
              ...(Number.isFinite(maxPrice) ? { lte: maxPrice } : {}),
            },
          }
        : {}
    ),
  };

  const products = await prisma.product.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
  });

  res.json({
    products: products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      pricePaise: p.pricePaise,
      unitLabel: p.unitLabel,
      imageUrl: p.imageUrl,
      stock: p.stock,
      isActive: p.isActive,
      category: p.category,
    })),
  });
});

router.get("/products/:slug", async (req, res) => {
  const product = await prisma.product.findFirst({
    where: { slug: req.params.slug, isActive: true },
    include: { category: { select: { id: true, name: true, slug: true } } },
  });
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json({
    product: {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      pricePaise: product.pricePaise,
      unitLabel: product.unitLabel,
      imageUrl: product.imageUrl,
      stock: product.stock,
      category: product.category,
    },
  });
});

export default router;
