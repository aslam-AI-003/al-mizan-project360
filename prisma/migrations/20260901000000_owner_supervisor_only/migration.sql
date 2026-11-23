-- Simplify to Owner (ADMIN) + Supervisor only.
-- Removes: client role/portal, client payments, documents, issues, suppliers,
-- BOQ, petty cash, notifications, approvals, audit log.
-- Written by hand (not `migrate diff`) so existing rows are carried over.

-- 1. Project: replace client user link with a plain client name
ALTER TABLE "Project" ADD COLUMN "clientName" TEXT;
UPDATE "Project" p SET "clientName" = u."name" FROM "User" u WHERE u."id" = p."clientId";
UPDATE "Project" SET "clientName" = '' WHERE "clientName" IS NULL;
ALTER TABLE "Project" ALTER COLUMN "clientName" SET NOT NULL;
ALTER TABLE "Project" DROP CONSTRAINT "Project_clientId_fkey";
ALTER TABLE "Project" DROP COLUMN "clientId";

-- 2. Purchase: becomes a direct "material bought" record (no supplier, no approval)
--    Requests that were never bought are not real spending, so they are removed.
DELETE FROM "Purchase" WHERE "status" NOT IN ('PURCHASED', 'PAID');
ALTER TABLE "Purchase" ADD COLUMN "createdById" TEXT;
ALTER TABLE "Purchase" ADD COLUMN "date" TIMESTAMP(3);
ALTER TABLE "Purchase" ADD COLUMN "vendorName" TEXT;
UPDATE "Purchase" SET "createdById" = "requestedById", "date" = "requiredDate";
UPDATE "Purchase" pu SET "vendorName" = s."name" FROM "Supplier" s WHERE s."id" = pu."supplierId";
ALTER TABLE "Purchase" ALTER COLUMN "createdById" SET NOT NULL;
ALTER TABLE "Purchase" ALTER COLUMN "date" SET NOT NULL;
ALTER TABLE "Purchase" DROP CONSTRAINT "Purchase_supplierId_fkey";
ALTER TABLE "Purchase" DROP CONSTRAINT "Purchase_requestedById_fkey";
ALTER TABLE "Purchase" DROP CONSTRAINT "Purchase_approvedById_fkey";
ALTER TABLE "Purchase" DROP COLUMN "approvedById",
DROP COLUMN "requestedById",
DROP COLUMN "requiredDate",
DROP COLUMN "status",
DROP COLUMN "supplierId",
DROP COLUMN "updatedAt";
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 3. Expense: no approval step; rejected expenses are not spending
DELETE FROM "Expense" WHERE "status" = 'REJECTED';
ALTER TABLE "Expense" DROP COLUMN "status";

-- 4. DailyReport: no approval step
ALTER TABLE "DailyReport" DROP CONSTRAINT "DailyReport_approvedById_fkey";
ALTER TABLE "DailyReport" DROP COLUMN "approvedAt",
DROP COLUMN "approvedById",
DROP COLUMN "status";

-- 5. Drop removed tables
DROP TABLE "SupplierPayment";
DROP TABLE "Supplier";
DROP TABLE "PettyCash";
DROP TABLE "ProjectDocument";
DROP TABLE "PaymentMilestone";
DROP TABLE "ClientPayment";
DROP TABLE "BoqItem";
DROP TABLE "Issue";
DROP TABLE "Notification";
DROP TABLE "Approval";
DROP TABLE "AuditLog";

-- 6. Remove client accounts, then the CLIENT role
DELETE FROM "User" WHERE "role" = 'CLIENT';
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'SUPERVISOR');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";

-- 7. Drop unused enums
DROP TYPE "PaymentStatus";
DROP TYPE "PurchaseStatus";
DROP TYPE "ExpenseStatus";
DROP TYPE "DailyReportStatus";
DROP TYPE "IssuePriority";
DROP TYPE "IssueStatus";
DROP TYPE "MilestoneStatus";
DROP TYPE "ApprovalType";
DROP TYPE "ApprovalStatus";
DROP TYPE "BoqCategory";
