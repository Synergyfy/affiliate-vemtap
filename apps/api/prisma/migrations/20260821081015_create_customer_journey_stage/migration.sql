-- CreateTable
CREATE TABLE "CustomerJourneyStage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "waitDays" INTEGER NOT NULL DEFAULT 0,
    "channel" "CommunicationChannel" NOT NULL,
    "templateId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerJourneyStage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerJourneyStage_sortOrder_idx" ON "CustomerJourneyStage"("sortOrder");

-- CreateIndex
CREATE INDEX "CustomerJourneyStage_enabled_idx" ON "CustomerJourneyStage"("enabled");

-- CreateIndex
CREATE INDEX "CustomerJourneyStage_templateId_idx" ON "CustomerJourneyStage"("templateId");

-- AddForeignKey
ALTER TABLE "CustomerJourneyStage" ADD CONSTRAINT "CustomerJourneyStage_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CommunicationTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
