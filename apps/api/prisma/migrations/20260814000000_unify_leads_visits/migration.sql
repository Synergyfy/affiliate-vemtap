-- Unify Leads & Visits
-- 1) The old "Lead" table is dropped.
-- 2) "MarketMappingVisit" is renamed to "Lead" (one unified pipeline/lead record).
-- 3) A "visit" is a lead that has been visited (visitedAt IS NOT NULL).

-- 1. Drop FKs that point to the old "Lead" table
ALTER TABLE "MarketMappingNote" DROP CONSTRAINT IF EXISTS "MarketMappingNote_leadId_fkey";
ALTER TABLE "Demo" DROP CONSTRAINT IF EXISTS "Demo_leadId_fkey";
ALTER TABLE "SalesPipeline" DROP CONSTRAINT IF EXISTS "SalesPipeline_leadId_fkey";

-- 2. Drop the old Lead table (cascade removes any remaining dependents)
DROP TABLE IF EXISTS "Lead" CASCADE;

-- 3. Rename MarketMappingVisit -> Lead
ALTER TABLE "MarketMappingVisit" RENAME TO "Lead";

-- 4. Rename columns to canonical lead vocabulary
ALTER TABLE "Lead" RENAME COLUMN "name" TO "businessName";
ALTER TABLE "Lead" RENAME COLUMN "category" TO "industry";
ALTER TABLE "Lead" RENAME COLUMN "address" TO "businessAddress";
ALTER TABLE "Lead" RENAME COLUMN "exactAddress" TO "location";
ALTER TABLE "Lead" RENAME COLUMN "contactEmail" TO "email";
ALTER TABLE "Lead" RENAME COLUMN "ownerName" TO "contactName";
ALTER TABLE "Lead" RENAME COLUMN "contactPosition" TO "contactRole";
ALTER TABLE "Lead" RENAME COLUMN "visitNotes" TO "comments";

-- 5. Add new columns
ALTER TABLE "Lead" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'Market Mapping';
ALTER TABLE "Lead" ADD COLUMN "followUpDate" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE "Lead" ADD COLUMN "assignedAgentId" TEXT;
ALTER TABLE "Lead" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- 6. Rename indexes owned by the renamed table
ALTER INDEX "MarketMappingVisit_pkey" RENAME TO "Lead_pkey";
ALTER INDEX "MarketMappingVisit_userId_idx" RENAME TO "Lead_userId_idx";
ALTER INDEX "MarketMappingVisit_planId_idx" RENAME TO "Lead_planId_idx";
ALTER INDEX "MarketMappingVisit_status_idx" RENAME TO "Lead_status_idx";
ALTER INDEX "MarketMappingVisit_userId_createdAt_idx" RENAME TO "Lead_userId_createdAt_idx";

-- 7. Rename supporting FK columns visitId -> leadId
ALTER TABLE "FieldMissionBusiness" RENAME COLUMN "visitId" TO "leadId";
ALTER TABLE "ExceptionReport" RENAME COLUMN "visitId" TO "leadId";
ALTER TABLE "VisitTransition" RENAME COLUMN "visitId" TO "leadId";
ALTER TABLE "VisitTransition" RENAME COLUMN "fromVisitId" TO "fromLeadId";
ALTER TABLE "FieldActivityTimelineEvent" RENAME COLUMN "visitId" TO "leadId";

-- 8. Existing child rows pointed at the (now dropped) old Lead table; orphan them
UPDATE "Demo" SET "leadId" = NULL WHERE "leadId" IS NOT NULL;
UPDATE "MarketMappingNote" SET "leadId" = NULL WHERE "leadId" IS NOT NULL;
UPDATE "SalesPipeline" SET "leadId" = NULL WHERE "leadId" IS NOT NULL;

-- 9. Re-add FKs from referencing tables to the new unified Lead table
ALTER TABLE "Demo" ADD CONSTRAINT "Demo_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MarketMappingNote" ADD CONSTRAINT "MarketMappingNote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SalesPipeline" ADD CONSTRAINT "SalesPipeline_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 10. Additional indexes on the new Lead table
CREATE INDEX "Lead_visitedAt_idx" ON "Lead"("visitedAt");
CREATE INDEX "Lead_deletedAt_idx" ON "Lead"("deletedAt");
