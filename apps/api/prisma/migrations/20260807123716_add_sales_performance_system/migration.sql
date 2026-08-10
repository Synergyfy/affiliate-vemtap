-- CreateEnum
CREATE TYPE "WorkSessionStatus" AS ENUM ('ACTIVE', 'ENDED', 'AUTO_ENDED');

-- CreateEnum
CREATE TYPE "ExceptionType" AS ENUM ('WAITING_FOR_DECISION_MAKER', 'BUSINESS_TEMPORARILY_CLOSED', 'TRAFFIC', 'SECURITY_RESTRICTIONS', 'CUSTOMER_REQUESTED_DELAY', 'TECHNICAL_ISSUE', 'NETWORK_PROBLEM', 'UNEXPECTED_MEETING', 'OTHER');

-- CreateEnum
CREATE TYPE "ExceptionStatus" AS ENUM ('PENDING', 'VALID', 'INVALID');

-- CreateEnum
CREATE TYPE "AnomalyType" AS ENUM ('BURST_SUBMISSION', 'SAME_LOCATION_MULTIPLE_BUSINESSES', 'IMPOSSIBLE_TRAVEL_TIME', 'OUT_OF_TERRITORY', 'DUPLICATE_LEAD', 'SUSPICIOUS_ACTIVITY');

-- CreateEnum
CREATE TYPE "AnomalyStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "PerformancePeriodType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "PerformanceStatus" AS ENUM ('EXCELLENT', 'ON_TRACK', 'AT_RISK');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SALES_EXECUTIVE';

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "duplicateOfId" TEXT,
ADD COLUMN     "isDuplicate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "qualifiedAt" TIMESTAMP(3),
ADD COLUMN     "qualityScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectionReason" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "basicSalary" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "currentPerformanceScore" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "employmentType" TEXT,
ADD COLUMN     "expectedWorkStart" TEXT DEFAULT '09:00',
ADD COLUMN     "hiredAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "WorkSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "gpsStartLat" TEXT,
    "gpsStartLng" TEXT,
    "gpsEndLat" TEXT,
    "gpsEndLng" TEXT,
    "device" TEXT,
    "territoryId" TEXT,
    "status" "WorkSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "lateStart" BOOLEAN NOT NULL DEFAULT false,
    "expectedStart" TEXT DEFAULT '09:00',
    "endComment" TEXT,
    "createdByDevice" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExceptionReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "ExceptionType" NOT NULL,
    "description" TEXT,
    "workSessionId" TEXT,
    "visitId" TEXT,
    "evidence" JSONB,
    "status" "ExceptionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewComment" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExceptionReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityAnomaly" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AnomalyType" NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" JSONB,
    "status" "AnomalyStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityAnomaly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodType" "PerformancePeriodType" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "score" DECIMAL(65,30) NOT NULL,
    "status" "PerformanceStatus" NOT NULL,
    "breakdown" JSONB NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceConfig" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "dailyLeadTarget" INTEGER NOT NULL DEFAULT 20,
    "weeklyLeadTarget" INTEGER NOT NULL DEFAULT 100,
    "monthlyLeadTarget" INTEGER NOT NULL DEFAULT 400,
    "conversionTarget" INTEGER NOT NULL DEFAULT 20,
    "demoTarget" INTEGER NOT NULL DEFAULT 80,
    "followUpTarget" INTEGER NOT NULL DEFAULT 20,
    "revenueTarget" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "expectedWorkStart" TEXT NOT NULL DEFAULT '09:00',
    "expectedWorkEnd" TEXT NOT NULL DEFAULT '17:00',
    "lateStartGraceMinutes" INTEGER NOT NULL DEFAULT 15,
    "performanceThreshold" DECIMAL(65,30) NOT NULL DEFAULT 90.0,
    "excellentThreshold" DECIMAL(65,30) NOT NULL DEFAULT 100.0,
    "weightQualifiedLead" DECIMAL(65,30) NOT NULL DEFAULT 20.0,
    "weightLeadQuality" DECIMAL(65,30) NOT NULL DEFAULT 10.0,
    "weightFieldActivity" DECIMAL(65,30) NOT NULL DEFAULT 15.0,
    "weightFollowUp" DECIMAL(65,30) NOT NULL DEFAULT 10.0,
    "weightDemo" DECIMAL(65,30) NOT NULL DEFAULT 10.0,
    "weightConversion" DECIMAL(65,30) NOT NULL DEFAULT 20.0,
    "weightRevenue" DECIMAL(65,30) NOT NULL DEFAULT 15.0,
    "requireContactInfo" BOOLEAN NOT NULL DEFAULT true,
    "requireDecisionMaker" BOOLEAN NOT NULL DEFAULT false,
    "requireGps" BOOLEAN NOT NULL DEFAULT true,
    "requireBusinessCategory" BOOLEAN NOT NULL DEFAULT true,
    "burstSubmissionWindowMinutes" INTEGER NOT NULL DEFAULT 10,
    "burstSubmissionMaxLeads" INTEGER NOT NULL DEFAULT 15,
    "maxSameLocationRadiusMeters" INTEGER NOT NULL DEFAULT 50,
    "maxTransitionGapMinutes" INTEGER NOT NULL DEFAULT 45,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkSession_userId_date_idx" ON "WorkSession"("userId", "date");

-- CreateIndex
CREATE INDEX "WorkSession_userId_status_idx" ON "WorkSession"("userId", "status");

-- CreateIndex
CREATE INDEX "WorkSession_date_idx" ON "WorkSession"("date");

-- CreateIndex
CREATE INDEX "ExceptionReport_userId_date_idx" ON "ExceptionReport"("userId", "date");

-- CreateIndex
CREATE INDEX "ExceptionReport_status_idx" ON "ExceptionReport"("status");

-- CreateIndex
CREATE INDEX "ExceptionReport_type_idx" ON "ExceptionReport"("type");

-- CreateIndex
CREATE INDEX "ActivityAnomaly_userId_idx" ON "ActivityAnomaly"("userId");

-- CreateIndex
CREATE INDEX "ActivityAnomaly_type_idx" ON "ActivityAnomaly"("type");

-- CreateIndex
CREATE INDEX "ActivityAnomaly_status_idx" ON "ActivityAnomaly"("status");

-- CreateIndex
CREATE INDEX "PerformanceScore_userId_periodType_periodEnd_idx" ON "PerformanceScore"("userId", "periodType", "periodEnd");

-- CreateIndex
CREATE INDEX "PerformanceScore_periodType_periodEnd_idx" ON "PerformanceScore"("periodType", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceScore_userId_periodType_periodStart_key" ON "PerformanceScore"("userId", "periodType", "periodStart");

-- CreateIndex
CREATE INDEX "Lead_isDuplicate_idx" ON "Lead"("isDuplicate");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_duplicateOfId_fkey" FOREIGN KEY ("duplicateOfId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkSession" ADD CONSTRAINT "WorkSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExceptionReport" ADD CONSTRAINT "ExceptionReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExceptionReport" ADD CONSTRAINT "ExceptionReport_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityAnomaly" ADD CONSTRAINT "ActivityAnomaly_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceScore" ADD CONSTRAINT "PerformanceScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
