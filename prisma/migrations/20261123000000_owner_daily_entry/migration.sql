-- Owner-only Daily Entry: suppliers with paid/pending, day-level labour.
-- Additive only: no tables or columns are dropped, so it is safe to run before or after deploying the code.

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "supplierId" TEXT;

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierPayment" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "mode" "PaymentMode" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabourEntry" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "workers" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabourEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_name_key" ON "Supplier"("name");

-- CreateIndex
CREATE INDEX "LabourEntry_projectId_date_idx" ON "LabourEntry"("projectId", "date");

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPayment" ADD CONSTRAINT "SupplierPayment_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabourEntry" ADD CONSTRAINT "LabourEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Carry over existing data ---------------------------------------------------

-- Suppliers from the free-text vendor names on existing purchases
INSERT INTO "Supplier" ("id", "name")
SELECT gen_random_uuid()::text, v.name
FROM (SELECT DISTINCT TRIM("vendorName") AS name FROM "Purchase"
      WHERE "vendorName" IS NOT NULL AND TRIM("vendorName") <> '') v;

UPDATE "Purchase" p SET "supplierId" = s."id"
FROM "Supplier" s WHERE s."name" = TRIM(p."vendorName");

-- Day-level labour from per-worker attendance (same money totals; worker rows are kept)
INSERT INTO "LabourEntry" ("id", "projectId", "date", "workers", "amount", "note")
SELECT gen_random_uuid()::text, a."projectId", date_trunc('day', a."date"),
       COUNT(*) FILTER (WHERE a."status" <> 'ABSENT'), SUM(a."wageAmount"), 'From attendance'
FROM "WorkerAttendance" a
GROUP BY a."projectId", date_trunc('day', a."date")
HAVING SUM(a."wageAmount") > 0;
