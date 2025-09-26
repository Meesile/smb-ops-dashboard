import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// GET /api/alerts/low-stock → products where quantity < threshold
router.get("/low-stock", async (_req, res) => {
  try {
    const products = await prisma.product.findMany();
    const low = products.filter(p => p.quantity < p.threshold);
    res.json(low);
  } catch (err) {
    console.error("GET /alerts/low-stock error", err);
    res.status(500).json({ error: "Failed to compute low-stock alerts" });
  }
});

export default router;