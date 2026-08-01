-- AlterTable
ALTER TABLE "TrainingProgress" ADD COLUMN     "practiceResults" JSONB;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "driversLicense" TEXT,
ADD COLUMN     "idType" TEXT,
ADD COLUMN     "internationalPassport" TEXT,
ADD COLUMN     "isOnboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isTourCompleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "MarketMappingPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetVisits" INTEGER NOT NULL DEFAULT 0,
    "targetLeads" INTEGER NOT NULL DEFAULT 0,
    "targetConversions" INTEGER NOT NULL DEFAULT 0,
    "locationCluster" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketMappingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketMappingNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT,
    "leadId" TEXT,
    "businessName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "followUpDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketMappingNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketMappingTerritoryConfig" (
    "id" TEXT NOT NULL,
    "territoryCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Nigeria',
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "cluster" TEXT NOT NULL,
    "totalAssigned" INTEGER NOT NULL DEFAULT 0,
    "anchorCount" INTEGER NOT NULL DEFAULT 0,
    "prospectCount" INTEGER NOT NULL DEFAULT 0,
    "anchorsJson" JSONB,
    "priorityVisitsJson" JSONB,
    "partnershipsJson" JSONB,
    "maturityJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketMappingTerritoryConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TargetAdjustmentHistory" (
    "id" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "oldDailyLeadTarget" INTEGER NOT NULL,
    "newDailyLeadTarget" INTEGER NOT NULL,
    "oldMonthlyConversionTarget" INTEGER NOT NULL,
    "newMonthlyConversionTarget" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TargetAdjustmentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketMappingPlan_userId_idx" ON "MarketMappingPlan"("userId");

-- CreateIndex
CREATE INDEX "MarketMappingPlan_status_idx" ON "MarketMappingPlan"("status");

-- CreateIndex
CREATE INDEX "MarketMappingNote_userId_idx" ON "MarketMappingNote"("userId");

-- CreateIndex
CREATE INDEX "MarketMappingNote_businessId_idx" ON "MarketMappingNote"("businessId");

-- CreateIndex
CREATE INDEX "MarketMappingNote_leadId_idx" ON "MarketMappingNote"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketMappingTerritoryConfig_territoryCode_key" ON "MarketMappingTerritoryConfig"("territoryCode");

-- CreateIndex
CREATE INDEX "MarketMappingTerritoryConfig_territoryCode_idx" ON "MarketMappingTerritoryConfig"("territoryCode");

-- CreateIndex
CREATE INDEX "MarketMappingTerritoryConfig_cluster_idx" ON "MarketMappingTerritoryConfig"("cluster");

-- CreateIndex
CREATE INDEX "TargetAdjustmentHistory_managerId_idx" ON "TargetAdjustmentHistory"("managerId");

-- CreateIndex
CREATE INDEX "TargetAdjustmentHistory_memberId_idx" ON "TargetAdjustmentHistory"("memberId");

-- AddForeignKey
ALTER TABLE "MarketMappingPlan" ADD CONSTRAINT "MarketMappingPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketMappingNote" ADD CONSTRAINT "MarketMappingNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TargetAdjustmentHistory" ADD CONSTRAINT "TargetAdjustmentHistory_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TargetAdjustmentHistory" ADD CONSTRAINT "TargetAdjustmentHistory_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
