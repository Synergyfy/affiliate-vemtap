-- AlterTable
ALTER TABLE "PlatformSettings" ADD COLUMN     "agentMilestoneBonusAmount" DECIMAL(65,30) NOT NULL DEFAULT 5000,
ADD COLUMN     "basicPlanPrice" DECIMAL(65,30) NOT NULL DEFAULT 3000,
ADD COLUMN     "businessMilestoneBonusAmount" DECIMAL(65,30) NOT NULL DEFAULT 10000,
ADD COLUMN     "enterprisePlanPrice" DECIMAL(65,30) NOT NULL DEFAULT 15000,
ADD COLUMN     "fraudGuardActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "managerOverrideRate" DECIMAL(65,30) NOT NULL DEFAULT 0.10,
ADD COLUMN     "professionalPlanPrice" DECIMAL(65,30) NOT NULL DEFAULT 10000,
ADD COLUMN     "starterPlanPrice" DECIMAL(65,30) NOT NULL DEFAULT 5000,
ADD COLUMN     "supervisorOverrideRate" DECIMAL(65,30) NOT NULL DEFAULT 0.05;

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
