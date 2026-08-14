-- AlterTable
ALTER TABLE "Business" ADD COLUMN "externalBusinessId" TEXT;

-- CreateIndex
CREATE INDEX "Business_externalBusinessId_idx" ON "Business"("externalBusinessId");
