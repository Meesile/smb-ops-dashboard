import * as cron from "node-cron";
import { runAlertJob } from "./alertJob";

// Schedule the alert job to run every night at 11 PM
const ALERT_CRON_SCHEDULE = "0 23 * * *"; // 11 PM daily

let alertJobTask: cron.ScheduledTask | null = null;

export function startScheduler() {
  console.log("Starting job scheduler...");
  
  // Schedule the alert job
  alertJobTask = cron.schedule(ALERT_CRON_SCHEDULE, async () => {
    console.log("Running scheduled alert job...");
    try {
      const result = await runAlertJob();
      console.log("Scheduled alert job completed:", result);
    } catch (error) {
      console.error("Scheduled alert job failed:", error);
    }
  }, {
    timezone: "UTC"
  });

  // Start the scheduler
  alertJobTask.start();
  console.log(`Alert job scheduled to run daily at 11 PM UTC (${ALERT_CRON_SCHEDULE})`);
}

export function stopScheduler() {
  if (alertJobTask) {
    alertJobTask.stop();
    alertJobTask.destroy();
    alertJobTask = null;
    console.log("Job scheduler stopped");
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log("Received SIGINT, stopping scheduler...");
  stopScheduler();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log("Received SIGTERM, stopping scheduler...");
  stopScheduler();
  process.exit(0);
});
