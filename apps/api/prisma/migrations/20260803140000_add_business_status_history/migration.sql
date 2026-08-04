-- CreateTable
CREATE TABLE "BusinessStatusHistory" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "fromStatus" "BusinessStatus",
    "toStatus" "BusinessStatus" NOT NULL,
    "changedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessStatusHistory_businessId_createdAt_idx" ON "BusinessStatusHistory"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX "BusinessStatusHistory_changedById_idx" ON "BusinessStatusHistory"("changedById");

-- AddForeignKey
ALTER TABLE "BusinessStatusHistory" ADD CONSTRAINT "BusinessStatusHistory_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessStatusHistory" ADD CONSTRAINT "BusinessStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
