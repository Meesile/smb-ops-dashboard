-- CreateTable
CREATE TABLE "StagingImportJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "validRows" INTEGER NOT NULL DEFAULT 0,
    "invalidRows" INTEGER NOT NULL DEFAULT 0,
    "processedRows" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "StagingRow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "rawText" TEXT,
    "sku" TEXT,
    "name" TEXT,
    "quantity" INTEGER,
    "threshold" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'RAW',
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME,
    CONSTRAINT "StagingRow_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "StagingImportJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryLevel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "asOf" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantity" INTEGER NOT NULL,
    CONSTRAINT "InventoryLevel_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "soldAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "units" INTEGER NOT NULL,
    CONSTRAINT "Sale_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "StagingRow_jobId_idx" ON "StagingRow"("jobId");

-- CreateIndex
CREATE INDEX "StagingRow_status_idx" ON "StagingRow"("status");

-- CreateIndex
CREATE INDEX "StagingRow_sku_idx" ON "StagingRow"("sku");

-- CreateIndex
CREATE INDEX "InventoryLevel_productId_asOf_idx" ON "InventoryLevel"("productId", "asOf");

-- CreateIndex
CREATE INDEX "Sale_productId_soldAt_idx" ON "Sale"("productId", "soldAt");
