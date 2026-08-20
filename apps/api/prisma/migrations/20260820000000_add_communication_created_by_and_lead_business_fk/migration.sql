-- AlterTable
ALTER TABLE "CommunicationMessage" ADD COLUMN "createdById" TEXT;

-- CreateIndex
CREATE INDEX "CommunicationMessage_createdById_idx" ON "CommunicationMessage"("createdById");

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "businessId" TEXT;

-- CreateIndex
CREATE INDEX "Lead_businessId_idx" ON "Lead"("businessId");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;