-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'SUPERVISOR';
ALTER TYPE "Role" ADD VALUE 'MANAGER';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "attendanceRate" DECIMAL(65,30) NOT NULL DEFAULT 100,
ADD COLUMN     "reportingScore" DECIMAL(65,30) NOT NULL DEFAULT 100,
ADD COLUMN     "territoryId" TEXT;
