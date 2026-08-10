-- AlterTable
ALTER TABLE "PerformanceConfig" ADD COLUMN     "dailyVisitTarget" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "leadQualityPassThreshold" INTEGER NOT NULL DEFAULT 60;
