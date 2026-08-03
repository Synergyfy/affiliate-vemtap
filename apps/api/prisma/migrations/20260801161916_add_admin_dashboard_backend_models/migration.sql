-- CreateEnum
CREATE TYPE "HierarchyType" AS ENUM ('COUNTRY', 'STATE', 'CITY', 'AREA', 'CLUSTER');

-- CreateTable
CREATE TABLE "MarketMappingHierarchy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "HierarchyType" NOT NULL,
    "parentId" TEXT,
    "totalBusinesses" INTEGER NOT NULL DEFAULT 0,
    "penetration" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketMappingHierarchy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketMappingAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clusterId" TEXT NOT NULL,
    "dailyLeadTarget" INTEGER NOT NULL DEFAULT 0,
    "weeklyLeadTarget" INTEGER NOT NULL DEFAULT 0,
    "monthlyConversionTarget" INTEGER NOT NULL DEFAULT 0,
    "allowUserEdit" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketMappingAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketMappingAdminConfig" (
    "id" TEXT NOT NULL,
    "pipelineStatuses" JSONB NOT NULL,
    "categories" JSONB NOT NULL,
    "fieldDefaults" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketMappingAdminConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDraft" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "targetRoles" "Role"[],
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketMappingHierarchy_parentId_idx" ON "MarketMappingHierarchy"("parentId");

-- CreateIndex
CREATE INDEX "MarketMappingHierarchy_type_idx" ON "MarketMappingHierarchy"("type");

-- CreateIndex
CREATE INDEX "MarketMappingAssignment_userId_idx" ON "MarketMappingAssignment"("userId");

-- CreateIndex
CREATE INDEX "MarketMappingAssignment_clusterId_idx" ON "MarketMappingAssignment"("clusterId");

-- CreateIndex
CREATE INDEX "NotificationDraft_createdById_idx" ON "NotificationDraft"("createdById");

-- AddForeignKey
ALTER TABLE "MarketMappingHierarchy" ADD CONSTRAINT "MarketMappingHierarchy_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MarketMappingHierarchy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketMappingAssignment" ADD CONSTRAINT "MarketMappingAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketMappingAssignment" ADD CONSTRAINT "MarketMappingAssignment_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "MarketMappingHierarchy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDraft" ADD CONSTRAINT "NotificationDraft_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
