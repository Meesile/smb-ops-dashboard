import { prisma } from "../lib/prisma";
import { AlertStatus, AlertType } from "@prisma/client";

export interface AlertJobResult {
  success: boolean;
  alertsGenerated: number;
  errors: string[];
  timestamp: string;
}

export async function runAlertJob(): Promise<AlertJobResult> {
  const result: AlertJobResult = {
    success: true,
    alertsGenerated: 0,
    errors: [],
    timestamp: new Date().toISOString(),
  };

  try {
    console.log("Starting nightly alert job...");

    // Get all products
    const products = await prisma.product.findMany();
    const lowStockProducts = products.filter(
      (p) => p.threshold > 0 && p.quantity <= p.threshold
    );

    console.log(`Found ${lowStockProducts.length} products with low stock`);

    // Create ACTIVE alerts for any products that don't already have an active low-stock alert
    for (const product of lowStockProducts) {
      const existingActive = await prisma.alert.findFirst({
        where: { productId: product.id, type: AlertType.LOW_STOCK, status: AlertStatus.ACTIVE },
        select: { id: true },
      });
      if (!existingActive) {
        await prisma.alert.create({
          data: {
            productId: product.id,
            type: AlertType.LOW_STOCK,
            message: `${product.name} is below threshold (${product.quantity}/${product.threshold})`,
            status: AlertStatus.ACTIVE,
          },
        });
        result.alertsGenerated += 1;
        console.log(
          `ALERT CREATED: ${product.name} (${product.sku}) - Qty: ${product.quantity}, Threshold: ${product.threshold}`
        );
      }
    }

    // Resolve active alerts for products that have recovered above threshold
    const activeAlerts = await prisma.alert.findMany({
      where: { status: AlertStatus.ACTIVE, type: AlertType.LOW_STOCK },
      include: { product: true },
    });
    for (const alert of activeAlerts) {
      const p = alert.product;
      if (p.threshold > 0 && p.quantity > p.threshold) {
        await prisma.alert.update({
          where: { id: alert.id },
          data: { status: AlertStatus.RESOLVED, resolvedAt: new Date() },
        });
        console.log(
          `ALERT RESOLVED: ${p.name} (${p.sku}) - Qty: ${p.quantity}, Threshold: ${p.threshold}`
        );
      }
    }

    console.log(`Alert job completed. New alerts generated: ${result.alertsGenerated}.`);

  } catch (error) {
    console.error("Alert job failed:", error);
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : "Unknown error");
  }

  return result;
}

// For testing - can be called directly
if (require.main === module) {
  runAlertJob()
    .then(result => {
      console.log("Alert job result:", result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error("Alert job failed:", error);
      process.exit(1);
    });
}
