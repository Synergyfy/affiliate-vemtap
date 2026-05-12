-- AlterTable
ALTER TABLE "PlatformSettings" ADD COLUMN     "agreementTemplate" TEXT,
ADD COLUMN     "agreementVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "linkExpiryDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "managerRewardDurationMonths" INTEGER NOT NULL DEFAULT 12,
ADD COLUMN     "maxIpUsage" INTEGER NOT NULL DEFAULT 2;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastLoginIp" TEXT,
ADD COLUMN     "signedAgreementVersion" INTEGER,
ADD COLUMN     "signedAt" TIMESTAMP(3);
