import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// GET /api/kpis/summary → basic KPIs
router.get("/summary", async (_req, res) => {
  try {
    const now = new Date();
    const d24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [sumAll, sum24, sum7, products] = await Promise.all([
      prisma.sale.aggregate({ _sum: { units: true } }),
      prisma.sale.aggregate({ _sum: { units: true }, where: { soldAt: { gte: d24 } } }),
      prisma.sale.aggregate({ _sum: { units: true }, where: { soldAt: { gte: d7 } } }),
      prisma.product.findMany({ select: { id: true, quantity: true, threshold: true } }),
    ]);

    const unitsSoldTotal = sumAll._sum.units ?? 0;
    const unitsSold24h = sum24._sum.units ?? 0;
    const unitsSold7d = sum7._sum.units ?? 0;

    const lowStockProducts = products.filter(p => typeof p.threshold === "number" && p.threshold > 0 && p.quantity <= p.threshold).length;
    const stockOutProducts = products.filter(p => p.quantity <= 0).length;

    // Revenue and margin need price/cost data; return nulls for now
    const revenueTotal = null as number | null;
    const marginPct = null as number | null;

    return res.json({
      unitsSoldTotal,
      unitsSold24h,
      unitsSold7d,
      lowStockProducts,
      stockOutProducts,
      revenueTotal,
      marginPct,
      asOf: now.toISOString(),
    });
  } catch (err) {
    console.error("GET /api/kpis/summary error", err);
    return res.status(500).json({ error: "Failed to compute KPI summary" });
  }
});

// GET /api/kpis/sales-timeseries → daily sales over time
router.get("/sales-timeseries", async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sales = await prisma.sale.findMany({
      where: { soldAt: { gte: startDate } },
      include: { product: { select: { name: true, sku: true } } },
      orderBy: { soldAt: "asc" },
    });

    // Group by date and aggregate
    const dailySales = sales.reduce((acc, sale) => {
      const date = sale.soldAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, units: 0, products: new Set() };
      }
      acc[date].units += sale.units;
      acc[date].products.add(sale.product.sku);
      return acc;
    }, {} as Record<string, { date: string; units: number; products: Set<string> }>);

    // Convert to array and add product count
    const result = Object.values(dailySales).map(d => ({
      date: d.date,
      units: d.units,
      uniqueProducts: d.products.size,
    }));

    return res.json(result);
  } catch (err) {
    console.error("GET /api/kpis/sales-timeseries error", err);
    return res.status(500).json({ error: "Failed to fetch sales time series" });
  }
});

// GET /api/kpis/product-trends → top products by sales volume
router.get("/product-trends", async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const limit = parseInt(req.query.limit as string) || 10;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const productSales = await prisma.sale.groupBy({
      by: ['productId'],
      where: { soldAt: { gte: startDate } },
      _sum: { units: true },
      _count: { id: true },
      orderBy: { _sum: { units: 'desc' } },
      take: limit,
    });

    // Get product details
    const productIds = productSales.map(p => p.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true, quantity: true, threshold: true },
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    const result = productSales.map(ps => {
      const product = productMap.get(ps.productId);
      return {
        productId: ps.productId,
        name: product?.name || 'Unknown',
        sku: product?.sku || 'Unknown',
        quantity: product?.quantity || 0,
        threshold: product?.threshold || 0,
        unitsSold: ps._sum.units || 0,
        salesCount: ps._count.id || 0,
      };
    });

    return res.json(result);
  } catch (err) {
    console.error("GET /api/kpis/product-trends error", err);
    return res.status(500).json({ error: "Failed to fetch product trends" });
  }
});

// GET /api/kpis/product-sales/:productId → daily sales trend for specific product
router.get("/product-sales/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, sku: true },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const sales = await prisma.sale.findMany({
      where: { 
        productId,
        soldAt: { gte: startDate }
      },
      orderBy: { soldAt: "asc" },
    });

    // Group by date and aggregate
    const dailySales = sales.reduce((acc, sale) => {
      const date = sale.soldAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, units: 0, salesCount: 0 };
      }
      acc[date].units += sale.units;
      acc[date].salesCount += 1;
      return acc;
    }, {} as Record<string, { date: string; units: number; salesCount: number }>);

    // Convert to array and fill missing dates with zeros
    const result = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      result.unshift({
        date: dateStr,
        units: dailySales[dateStr]?.units || 0,
        salesCount: dailySales[dateStr]?.salesCount || 0,
      });
    }

    return res.json({
      product,
      salesData: result,
      totalUnits: sales.reduce((sum, s) => sum + s.units, 0),
      totalSales: sales.length,
    });
  } catch (err) {
    console.error("GET /api/kpis/product-sales/:productId error", err);
    return res.status(500).json({ error: "Failed to fetch product sales trend" });
  }
});

// GET /api/kpis/weekday-weekend → compare weekday vs weekend sales
router.get("/weekday-weekend", async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sales = await prisma.sale.findMany({
      where: { soldAt: { gte: startDate } },
      select: { soldAt: true, units: true },
      orderBy: { soldAt: "asc" },
    });

    let weekdayUnits = 0;
    let weekendUnits = 0;
    let weekdaySalesCount = 0;
    let weekendSalesCount = 0;

    for (const sale of sales) {
      const day = sale.soldAt.getDay(); // 0=Sun ... 6=Sat
      const isWeekend = day === 0 || day === 6;
      if (isWeekend) {
        weekendUnits += sale.units;
        weekendSalesCount += 1;
      } else {
        weekdayUnits += sale.units;
        weekdaySalesCount += 1;
      }
    }

    const data = [
      {
        label: "Weekday",
        units: weekdayUnits,
        salesCount: weekdaySalesCount,
        avgUnits: weekdaySalesCount > 0 ? Number((weekdayUnits / weekdaySalesCount).toFixed(2)) : 0,
      },
      {
        label: "Weekend",
        units: weekendUnits,
        salesCount: weekendSalesCount,
        avgUnits: weekendSalesCount > 0 ? Number((weekendUnits / weekendSalesCount).toFixed(2)) : 0,
      },
    ];

    return res.json({
      rangeDays: days,
      asOf: new Date().toISOString(),
      data,
    });
  } catch (err) {
    console.error("GET /api/kpis/weekday-weekend error", err);
    return res.status(500).json({ error: "Failed to compute weekday/weekend KPI" });
  }
});

export default router;
