-- AlterTable
ALTER TABLE "User" ADD COLUMN     "paystackRecipientCode" TEXT;

-- CreateIndex
CREATE INDEX "User_paystackRecipientCode_idx" ON "User"("paystackRecipientCode");
