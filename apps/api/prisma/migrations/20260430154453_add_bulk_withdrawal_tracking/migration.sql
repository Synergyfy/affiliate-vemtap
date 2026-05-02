-- AlterTable
ALTER TABLE "Withdrawal" ADD COLUMN     "bulkRunId" TEXT;

-- CreateTable
CREATE TABLE "BulkWithdrawalRun" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "userCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BulkWithdrawalRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Withdrawal_bulkRunId_idx" ON "Withdrawal"("bulkRunId");

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_bulkRunId_fkey" FOREIGN KEY ("bulkRunId") REFERENCES "BulkWithdrawalRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
