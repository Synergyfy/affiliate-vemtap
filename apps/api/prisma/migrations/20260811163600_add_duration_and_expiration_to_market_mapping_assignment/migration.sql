-- CreateEnum
CREATE TYPE "AssignmentDuration" AS ENUM ('ONE_DAY', 'ONE_WEEK', 'ONE_MONTH', 'CUSTOM', 'FOREVER');

-- AlterTable
ALTER TABLE "MarketMappingAssignment" ADD COLUMN "duration" "AssignmentDuration" NOT NULL DEFAULT 'FOREVER',
ADD COLUMN "expiresAt" TIMESTAMP(3),
ADD COLUMN "assignedBy" TEXT;

-- CreateIndex
CREATE INDEX "MarketMappingAssignment_expiresAt_idx" ON "MarketMappingAssignment"("expiresAt");
