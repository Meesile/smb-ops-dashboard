import { prisma } from "../lib/prisma";

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

    // Get all products with low stock
    const products = await prisma.product.findMany();
    const lowStockProducts = products.filter(p => p.quantity <= p.threshold && p.threshold > 0);

    console.log(`Found ${lowStockProducts.length} products with low stock`);

    // For now, just log the alerts (in the future, this would send emails/SMS)
    for (const product of lowStockProducts) {
      console.log(`ALERT: ${product.name} (${product.sku}) - Qty: ${product.quantity}, Threshold: ${product.threshold}`);
      
      // TODO: In the future, create Alert records in the database
      // await prisma.alert.create({
      //   data: {
      //     productId: product.id,
      //     type: 'LOW_STOCK',
      //     message: `${product.name} is below threshold (${product.quantity}/${product.threshold})`,
      //     status: 'ACTIVE',
      //   }
      // });
    }

    result.alertsGenerated = lowStockProducts.length;
    console.log(`Alert job completed. Generated ${result.alertsGenerated} alerts.`);

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
