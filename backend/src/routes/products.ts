import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// GET /api/products → list all products from DB
router.get("/", async (_req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(products);
  } catch (err) {
    console.error("GET /products error", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// POST /api/products → create product in DB
router.post("/", async (req, res) => {
  try {
    const { name, sku, quantity = 0, threshold = 0 } = req.body || {};

    if (!name || !sku) {
      return res.status(400).json({ error: "'name' and 'sku' are required" });
    }

    // enforce unique sku at app layer (DB also enforces with @unique)
    const existing = await prisma.product.findUnique({ where: { sku: String(sku) } });
    if (existing) {
      return res.status(409).json({ error: "A product with this SKU already exists" });
    }

    const product = await prisma.product.create({
      data: {
        name: String(name),
        sku: String(sku),
        quantity: Number(quantity) || 0,
        threshold: Number(threshold) || 0,
      },
    });

    res.status(201).json(product);
  } catch (err: any) {
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "A product with this SKU already exists" });
    }
    console.error("POST /products error", err);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// Shared handler to update by SKU
async function updateBySku(req: any, res: any) {
  const currentSku = req.params.sku;
  const { name, sku: newSku, quantity, threshold } = req.body || {};

  try {
    // If SKU is changing, ensure the new one isn't taken by another product
    if (typeof newSku === "string" && newSku !== currentSku) {
      const exists = await prisma.product.findUnique({ where: { sku: newSku } });
      if (exists) {
        return res.status(409).json({ error: "A product with this new SKU already exists" });
      }
    }

    const data: any = {};
    if (typeof name === "string") data.name = name;
    if (typeof newSku === "string") data.sku = newSku;
    if (quantity !== undefined) data.quantity = Number(quantity);
    if (threshold !== undefined) data.threshold = Number(threshold);

    const updated = await prisma.product.update({
      where: { sku: currentSku },
      data,
    });

    return res.json(updated);
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "Product not found" });
    }
    return res.status(500).json({ error: "Failed to update product" });
  }
}

// Support both patterns: /api/products/sku/:sku and /api/products/:sku
router.patch("/sku/:sku", updateBySku);
router.patch("/:sku", updateBySku);

// DELETE /api/products/:sku  → delete by SKU (also supports /sku/:sku)
router.delete("/sku/:sku", async (req, res) => {
  const { sku } = req.params;
  try {
    const deleted = await prisma.product.delete({ where: { sku } });
    return res.json(deleted);
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "Product not found" });
    }
    return res.status(500).json({ error: "Failed to delete product" });
  }
});

router.delete("/:sku", async (req, res) => {
  const { sku } = req.params;
  try {
    const deleted = await prisma.product.delete({ where: { sku } });
    return res.json(deleted);
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "Product not found" });
    }
    return res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;