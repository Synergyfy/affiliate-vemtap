-- AlterTable
ALTER TABLE "Business" ADD COLUMN "planName" TEXT,
ADD COLUMN "planId" TEXT,
ADD COLUMN "externalReference" TEXT;

-- CreateIndex
CREATE INDEX "Business_externalReference_idx" ON "Business"("externalReference");

-- AlterTable
ALTER TABLE "Withdrawal" ADD COLUMN "externalReference" TEXT;

-- CreateIndex
CREATE INDEX "Withdrawal_externalReference_idx" ON "Withdrawal"("externalReference");

-- AlterTable
ALTER TABLE "PlatformSettings" ADD COLUMN "planPricingJson" JSONB;

-- CreateEnum
CREATE TYPE "ExternalSyncScope" AS ENUM ('REFERRAL', 'WITHDRAWAL');

-- CreateEnum
CREATE TYPE "ExternalSyncStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "ExternalSyncLog" (
    "id" TEXT NOT NULL,
    "scope" "ExternalSyncScope" NOT NULL,
    "idempotencyKey" TEXT,
    "externalReference" TEXT,
    "status" "ExternalSyncStatus" NOT NULL DEFAULT 'SUCCESS',
    "responseJson" JSONB,
    "errorJson" JSONB,
    "businessId" TEXT,
    "withdrawalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExternalSyncLog_scope_idempotencyKey_key" ON "ExternalSyncLog"("scope", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalSyncLog_scope_externalReference_key" ON "ExternalSyncLog"("scope", "externalReference");

-- CreateIndex
CREATE INDEX "ExternalSyncLog_scope_createdAt_idx" ON "ExternalSyncLog"("scope", "createdAt");

-- CreateIndex
CREATE INDEX "ExternalSyncLog_businessId_idx" ON "ExternalSyncLog"("businessId");

-- CreateIndex
CREATE INDEX "ExternalSyncLog_withdrawalId_idx" ON "ExternalSyncLog"("withdrawalId");
