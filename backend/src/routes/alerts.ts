import { Router } from "express";
import { prisma } from "../lib/prisma";
import { runAlertJob } from "../jobs/alertJob";
import { AlertStatus, AlertType } from "@prisma/client";

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

// GET /api/alerts/history → recent alerts with product info
router.get("/history", async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit || 50)), 200) || 50;
    const alerts = await prisma.alert.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { product: { select: { id: true, name: true, sku: true } } },
    });
    res.json(alerts);
  } catch (err) {
    console.error("GET /alerts/history error", err);
    res.status(500).json({ error: "Failed to fetch alert history" });
  }
});

// PATCH /api/alerts/:id/ack → acknowledge an alert
router.patch("/:id/ack", async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await prisma.alert.update({
      where: { id },
      data: { status: AlertStatus.ACKNOWLEDGED, acknowledgedAt: new Date() },
    });
    res.json(updated);
  } catch (err: any) {
    if (err?.code === "P2025") return res.status(404).json({ error: "Alert not found" });
    console.error("PATCH /alerts/:id/ack error", err);
    res.status(500).json({ error: "Failed to acknowledge alert" });
  }
});

// PATCH /api/alerts/:id/resolve → resolve an alert
router.patch("/:id/resolve", async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await prisma.alert.update({
      where: { id },
      data: { status: AlertStatus.RESOLVED, resolvedAt: new Date() },
    });
    res.json(updated);
  } catch (err: any) {
    if (err?.code === "P2025") return res.status(404).json({ error: "Alert not found" });
    console.error("PATCH /alerts/:id/resolve error", err);
    res.status(500).json({ error: "Failed to resolve alert" });
  }
});

export default router;