CREATE TABLE "MarketMappingVisit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'NOT_YET',
    "isPlaceholder" BOOLEAN NOT NULL DEFAULT false,
    "address" TEXT,
    "exactAddress" TEXT,
    "phone" TEXT,
    "ownerName" TEXT,
    "contactPosition" TEXT,
    "contactEmail" TEXT,
    "horizon" TEXT,
    "dailyCustomers" TEXT,
    "businessSize" TEXT,
    "openingHours" TEXT,
    "openingDays" JSONB,
    "gpsLat" TEXT,
    "gpsLng" TEXT,
    "nextVisitDate" TEXT,
    "nextVisitTime" TEXT,
    "decisionMakerMet" BOOLEAN,
    "interested" TEXT,
    "demoDone" BOOLEAN,
    "visitNotes" TEXT,
    "isAnchor" BOOLEAN NOT NULL DEFAULT false,
    "visitedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketMappingVisit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MarketMappingVisit_userId_idx" ON "MarketMappingVisit"("userId");
CREATE INDEX "MarketMappingVisit_planId_idx" ON "MarketMappingVisit"("planId");
CREATE INDEX "MarketMappingVisit_status_idx" ON "MarketMappingVisit"("status");
CREATE INDEX "MarketMappingVisit_userId_createdAt_idx" ON "MarketMappingVisit"("userId", "createdAt");

ALTER TABLE "MarketMappingVisit" ADD CONSTRAINT "MarketMappingVisit_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketMappingVisit" ADD CONSTRAINT "MarketMappingVisit_planId_fkey"
  FOREIGN KEY ("planId") REFERENCES "MarketMappingPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MarketMappingNote" ADD COLUMN "reportKey" TEXT;
CREATE INDEX "MarketMappingNote_reportKey_idx" ON "MarketMappingNote"("reportKey");
