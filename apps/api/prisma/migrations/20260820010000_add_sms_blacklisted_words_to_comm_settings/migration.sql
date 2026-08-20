-- AlterTable
ALTER TABLE "CommunicationSettings" ADD COLUMN "smsBlacklistedWords" TEXT[] DEFAULT ARRAY[]::TEXT[];
