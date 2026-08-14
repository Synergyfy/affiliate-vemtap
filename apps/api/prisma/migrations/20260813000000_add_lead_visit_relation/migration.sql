-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "visitId" TEXT;

-- CreateIndex
CREATE INDEX "Lead_visitId_idx" ON "Lead"("visitId");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "MarketMappingVisit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
