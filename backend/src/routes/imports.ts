import type { Request, Response, RequestHandler } from "express";
import { Router } from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { prisma } from "../lib/prisma";

const upload = multer({ storage: multer.memoryStorage() });
const uploadSingle: RequestHandler = upload.single("file") as unknown as RequestHandler;

const router = Router();

// POST /api/imports/csv  → parse CSV and upsert products by SKU
router.post("/csv", uploadSingle, async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const text = req.file.buffer.toString("utf8");

    // Parse CSV with headers
    const rows = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Array<Record<string, string>>;

    if (!rows.length) {
      return res.status(400).json({ error: "CSV is empty" });
    }

    // Validate required columns (case-insensitive)
    const required = ["sku", "name", "quantity", "threshold"];
    const header = Object.keys(rows[0]).map((h) => h.toLowerCase());
    for (const col of required) {
      if (!header.includes(col)) {
        return res.status(400).json({ error: `Missing required column '${col}'` });
      }
    }

    // Normalize & validate rows
    const normalized: { sku: string; name: string; quantity: number; threshold: number }[] = [];
    let invalid = 0;

    for (const r of rows) {
      const sku = String((r as any).sku ?? (r as any).SKU ?? "").trim();
      const name = String((r as any).name ?? (r as any).Name ?? "").trim();
      const quantity = Number((r as any).quantity ?? (r as any).Quantity ?? "");
      const threshold = Number((r as any).threshold ?? (r as any).Threshold ?? "");

      const ok =
        sku.length > 0 &&
        name.length > 0 &&
        Number.isFinite(quantity) &&
        Number.isFinite(threshold);

      if (!ok) {
        invalid++;
        continue;
      }

      normalized.push({ sku, name, quantity, threshold });
    }

    if (!normalized.length) {
      return res.status(400).json({ error: "No valid rows to import" });
    }

    // Determine which SKUs exist already
    const skus = normalized.map((r) => r.sku);
    const existing = await prisma.product.findMany({
      where: { sku: { in: skus } },
      select: { sku: true },
    });
    const existingSet = new Set(existing.map((e) => e.sku));

    // Build creates and updates (upsert behavior)
    const creates = normalized
      .filter((r) => !existingSet.has(r.sku))
      .map((r) =>
        prisma.product.create({
          data: r,
        })
      );

    const updates = normalized
      .filter((r) => existingSet.has(r.sku))
      .map((r) =>
        prisma.product.update({
          where: { sku: r.sku },
          data: { name: r.name, quantity: r.quantity, threshold: r.threshold },
        })
      );

    await prisma.$transaction([...creates, ...updates]);

    const result = {
      totalRows: rows.length,
      imported: normalized.length,
      created: creates.length,
      updated: updates.length,
      invalid,
    };

    return res.json({ message: "Import complete", result });
  } catch (err) {
    console.error("CSV import error:", err);
    return res.status(500).json({ error: "Failed to import CSV" });
  }
});

export default router;