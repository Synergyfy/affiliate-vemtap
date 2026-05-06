-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hasClaimedAgentBonus" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasClaimedBusinessBonus" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isManagerMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "managerQualificationExpiry" TIMESTAMP(3);
