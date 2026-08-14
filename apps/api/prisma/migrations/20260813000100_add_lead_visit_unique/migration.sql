-- DropIndex
DROP INDEX "Lead_visitId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "Lead_visitId_key" ON "Lead"("visitId");
