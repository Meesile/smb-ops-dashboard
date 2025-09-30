import type { Request, Response, RequestHandler } from "express";
import { Router } from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { TextDecoder } from "util";
import { prisma } from "../lib/prisma";
import { ImportStatus, RowStatus } from "@prisma/client";

const upload = multer({ storage: multer.memoryStorage() });
const uploadSingle: RequestHandler = upload.single("file") as unknown as RequestHandler;

const router = Router();

// POST /api/imports/csv  → parse CSV and upsert products by SKU
router.post("/csv", uploadSingle, async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const job = await prisma.stagingImportJob.create({
      data: {
        source: "csv",
        filename: req.file.originalname,
        status: ImportStatus.PROCESSING,
      },
    });

    // Parse CSV with headers
    const buf = req.file.buffer;
    let text: string;
    // Detect UTF-16 (common from Excel/Numbers exports) by BOM or prevalence of NUL bytes
    const looksUtf16Le = (buf.length > 1 && buf[0] === 0xff && buf[1] === 0xfe) || buf.includes(0x00);
    const looksUtf16Be = buf.length > 1 && buf[0] === 0xfe && buf[1] === 0xff;
    if (looksUtf16Le) {
      text = new TextDecoder("utf-16le").decode(buf);
    } else if (looksUtf16Be) {
      // Convert BE → string (Node supports utf-16be in TextDecoder on recent versions)
      try {
        text = new TextDecoder("utf-16be").decode(buf);
      } catch {
        // Fallback: swap bytes to LE
        const swapped = Buffer.allocUnsafe(buf.length);
        for (let i = 0; i < buf.length; i += 2) {
          swapped[i] = buf[i + 1];
          swapped[i + 1] = buf[i];
        }
        text = new TextDecoder("utf-16le").decode(swapped);
      }
    } else {
      text = buf.toString("utf8");
    }

    // Normalize BOM and newlines
    const cleaned = text.replace(/\uFEFF/g, "").replace(/\r\n?/g, "\n");

    // Heuristic: guess delimiter from header line by highest count
    const firstLine = cleaned.split("\n")[0] || "";
    const counts: Record<string, number> = {
      ",": (firstLine.match(/,/g) || []).length,
      ";": (firstLine.match(/;/g) || []).length,
      "\t": (firstLine.match(/\t/g) || []).length,
      "|": (firstLine.match(/\|/g) || []).length,
    };
    const guessedDelim = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || ",";

    // Helper: try multiple delimiters
    const tryParse = (input: string) => {
      const delims = [guessedDelim, ",", ";", "\t", "|"]; // try guessed then fallbacks
      for (const d of delims) {
        try {
          const out = parse(input, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            delimiter: d,
            relax_column_count: true,
            bom: true,
          }) as Array<Record<string, string>>;
          if (out && out.length) return out;
        } catch (e) {
          // continue trying next delimiter
        }
      }
      return [] as Array<Record<string, string>>;
    };

    let rows = tryParse(cleaned);
    if (!rows.length) {
      const sample = cleaned.slice(0, 200);
      console.warn("CSV parse debug — len:", cleaned.length, "guessed:", guessedDelim, "sample:", JSON.stringify(sample));
      await prisma.stagingImportJob.update({
        where: { id: job.id },
        data: { status: ImportStatus.FAILED, totalRows: 0, invalidRows: 0 },
      });
      return res.status(400).json({ error: "CSV appears empty or could not be parsed. Ensure it's comma/semicolon/tab-delimited with a header row." });
    }

    // Validate required columns (case-insensitive)
    const required = ["sku", "name", "quantity", "threshold"];
    const header = Object.keys(rows[0]).map((h) => h.trim().toLowerCase());
    for (const col of required) {
      if (!header.includes(col)) {
        await prisma.stagingImportJob.update({ where: { id: job.id }, data: { status: ImportStatus.FAILED, totalRows: rows.length } });
        return res.status(400).json({ error: `Missing required column '${col}'` });
      }
    }

    // Normalize & validate rows
    const normalized: { sku: string; name: string; quantity: number; threshold: number }[] = [];
    let invalid = 0;

    for (const r of rows) {
      const sku = String((r as any).sku ?? (r as any).SKU ?? "").trim();
      const name = String((r as any).name ?? (r as any).Name ?? "").trim();
      const quantityRaw = (r as any).quantity ?? (r as any).Quantity ?? "";
      const thresholdRaw = (r as any).threshold ?? (r as any).Threshold ?? "";

      const quantity = Number(quantityRaw);
      const threshold = Number(thresholdRaw);

      let errorMsg = "";
      if (!sku) {
        errorMsg = "SKU is required";
      } else if (!name) {
        errorMsg = "Name is required";
      } else if (!Number.isInteger(quantity)) {
        errorMsg = "Quantity must be an integer";
      } else if (quantity < 0) {
        errorMsg = "Quantity cannot be negative";
      } else if (!Number.isInteger(threshold)) {
        errorMsg = "Threshold must be an integer";
      } else if (threshold < 0) {
        errorMsg = "Threshold cannot be negative";
      }

      if (errorMsg) {
        invalid++;
        continue;
      }

      normalized.push({ sku, name, quantity, threshold });
    }

    let validCount = 0;
    let invalidCount = 0;

    // Insert rows into staging table
    const rowCreates = rows.map((raw: any) => {
      const sku = String(raw.sku ?? raw.SKU ?? "").trim();
      const name = String(raw.name ?? raw.Name ?? "").trim();
      const quantityRaw = raw.quantity ?? raw.Quantity ?? "";
      const thresholdRaw = raw.threshold ?? raw.Threshold ?? "";

      const quantity = Number(quantityRaw);
      const threshold = Number(thresholdRaw);

      let errorMsg = "";
      if (!sku) {
        errorMsg = "SKU is required";
      } else if (!name) {
        errorMsg = "Name is required";
      } else if (!Number.isInteger(quantity)) {
        errorMsg = "Quantity must be an integer";
      } else if (quantity < 0) {
        errorMsg = "Quantity cannot be negative";
      } else if (!Number.isInteger(threshold)) {
        errorMsg = "Threshold must be an integer";
      } else if (threshold < 0) {
        errorMsg = "Threshold cannot be negative";
      }

      const ok = errorMsg === "";

      if (ok) validCount++; else invalidCount++;

      return prisma.stagingRow.create({
        data: {
          jobId: job.id,
          rawText: JSON.stringify(raw),
          sku: ok ? sku : null,
          name: ok ? name : null,
          quantity: ok ? quantity : null,
          threshold: ok ? threshold : null,
          status: ok ? RowStatus.VALID : RowStatus.INVALID,
          error: ok ? null : errorMsg,
        },
      });
    });

    await prisma.$transaction(rowCreates);

    await prisma.stagingImportJob.update({
      where: { id: job.id },
      data: {
        status: ImportStatus.COMPLETED,
        totalRows: rows.length,
        validRows: validCount,
        invalidRows: invalidCount,
      },
    });

    return res.json({ message: "Rows staged", jobId: job.id, total: rows.length, valid: validCount, invalid: invalidCount });
  } catch (err) {
    console.error("CSV import error:", err);
    return res.status(500).json({ error: "Failed to import CSV" });
  }
});


// POST /api/imports/normalize/:jobId → promote staged rows into core tables
router.post("/normalize/:jobId", async (req: Request, res: Response) => {
  const { jobId } = req.params;
  try {
    const job = await prisma.stagingImportJob.findUnique({
      where: { id: jobId },
      include: { rows: true },
    });
    if (!job) return res.status(404).json({ error: "Job not found" });

    let created = 0,
      updated = 0;

    const ops: any[] = [];

    for (const row of job.rows) {
      if (row.status !== RowStatus.VALID || !row.sku || !row.name || row.quantity == null || row.threshold == null) {
        continue;
      }

      // Upsert product
      ops.push(
        prisma.product.upsert({
          where: { sku: row.sku },
          update: { name: row.name, quantity: row.quantity, threshold: row.threshold },
          create: { sku: row.sku, name: row.name, quantity: row.quantity, threshold: row.threshold },
        }).then((p) => {
          if (p.createdAt.getTime() === p.updatedAt.getTime()) {
            created++;
          } else {
            updated++;
          }
          return p;
        })
      );
    }

    const products = await Promise.all(ops);

    // Create inventory snapshots
    const inventoryOps = products.map((p) =>
      prisma.inventoryLevel.create({
        data: { productId: p.id, quantity: p.quantity },
      })
    );
    await prisma.$transaction(inventoryOps);

    // Mark rows processed
    await prisma.stagingRow.updateMany({
      where: { jobId, status: RowStatus.VALID },
      data: { status: RowStatus.PROCESSED, processedAt: new Date() },
    });

    await prisma.stagingImportJob.update({
      where: { id: jobId },
      data: { processedRows: products.length },
    });

    return res.json({
      message: "Normalization complete",
      created,
      updated,
      snapshots: products.length,
    });
  } catch (err) {
    console.error("Normalization error:", err);
    return res.status(500).json({ error: "Failed to normalize staged rows" });
  }
});

// GET /api/imports/jobs → list recent import jobs
router.get("/jobs", async (req: Request, res: Response) => {
  try {
    const jobs = await prisma.stagingImportJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        filename: true,
        source: true,
        status: true,
        totalRows: true,
        validRows: true,
        invalidRows: true,
        processedRows: true,
        createdAt: true,
        completedAt: true,
      },
    });
    return res.json(jobs);
  } catch (err) {
    console.error("Error fetching import jobs:", err);
    return res.status(500).json({ error: "Failed to fetch import jobs" });
  }
});

// GET /api/imports/jobs/:jobId/errors → list invalid rows for a job
router.get("/jobs/:jobId/errors", async (req: Request, res: Response) => {
  const { jobId } = req.params;
  try {
    // Ensure job exists (optional but clearer error)
    const job = await prisma.stagingImportJob.findUnique({ where: { id: jobId }, select: { id: true } });
    if (!job) return res.status(404).json({ error: "Job not found" });

    const rows = await prisma.stagingRow.findMany({
      where: { jobId, status: RowStatus.INVALID },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        sku: true,
        name: true,
        quantity: true,
        threshold: true,
        error: true,
        rawText: true,
        createdAt: true,
      },
    });

    return res.json(rows);
  } catch (err) {
    console.error("Error fetching job errors:", err);
    return res.status(500).json({ error: "Failed to fetch import errors" });
  }
});

// DELETE /api/imports/jobs/:jobId → delete a specific import job and its rows
router.delete("/jobs/:jobId", async (req: Request, res: Response) => {
  const { jobId } = req.params;
  try {
    // Delete the job (cascade will delete associated rows)
    await prisma.stagingImportJob.delete({
      where: { id: jobId },
    });
    
    return res.json({ message: "Import job deleted successfully" });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "Import job not found" });
    }
    console.error("Error deleting import job:", err);
    return res.status(500).json({ error: "Failed to delete import job" });
  }
});

// DELETE /api/imports/jobs → delete all import jobs and their rows
router.delete("/jobs", async (req: Request, res: Response) => {
  try {
    // Delete all jobs (cascade will delete associated rows)
    const result = await prisma.stagingImportJob.deleteMany({});
    
    return res.json({ 
      message: "All import jobs deleted successfully",
      deletedCount: result.count 
    });
  } catch (err) {
    console.error("Error deleting all import jobs:", err);
    return res.status(500).json({ error: "Failed to delete import jobs" });
  }
});

export default router;