-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'AGENT';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dailyLeadTarget" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "monthlyConversionTarget" INTEGER NOT NULL DEFAULT 0;
