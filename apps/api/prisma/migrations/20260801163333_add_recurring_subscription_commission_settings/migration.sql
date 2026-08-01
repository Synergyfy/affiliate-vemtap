-- AlterTable
ALTER TABLE "PlatformSettings" ADD COLUMN     "recurringAffiliateCommission" DECIMAL(65,30) NOT NULL DEFAULT 10.0,
ADD COLUMN     "recurringAgentCommission" DECIMAL(65,30) NOT NULL DEFAULT 5.0,
ADD COLUMN     "recurringDurationMonths" INTEGER NOT NULL DEFAULT 12,
ADD COLUMN     "recurringLineManagerCommission" DECIMAL(65,30) NOT NULL DEFAULT 3.0,
ADD COLUMN     "recurringYear2Rate" DECIMAL(65,30) NOT NULL DEFAULT 50.0;
