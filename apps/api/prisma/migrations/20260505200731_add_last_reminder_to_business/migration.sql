-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "lastReminderAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Business_status_createdAt_idx" ON "Business"("status", "createdAt");
