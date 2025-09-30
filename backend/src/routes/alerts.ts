import { Router } from "express";
import { prisma } from "../lib/prisma";
import { runAlertJob } from "../jobs/alertJob";

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

// POST /api/alerts/run-job → manually trigger the alert job
router.post("/run-job", async (_req, res) => {
  try {
    console.log("Manual alert job triggered");
    const result = await runAlertJob();
    res.json(result);
  } catch (err) {
    console.error("Manual alert job error", err);
    res.status(500).json({ error: "Failed to run alert job" });
  }
});

export default router;