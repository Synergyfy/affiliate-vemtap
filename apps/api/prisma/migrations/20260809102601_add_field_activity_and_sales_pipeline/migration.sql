/*
  Warnings:

  - The `status` column on the `WorkSession` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "GpsStatus" AS ENUM ('GRANTED', 'DENIED', 'UNAVAILABLE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "GpsEventType" AS ENUM ('START', 'END', 'CHECKPOINT');

-- CreateEnum
CREATE TYPE "AccountabilitySessionStatus" AS ENUM ('ACTIVE', 'ENDED', 'AUTO_ENDED');

-- CreateEnum
CREATE TYPE "TransitionStatus" AS ENUM ('NORMAL', 'UNUSUAL_DISTANCE', 'UNUSUAL_TIME', 'BOTH_UNUSUAL');

-- CreateEnum
CREATE TYPE "FieldTimelineEventType" AS ENUM ('WORK_STARTED', 'VISIT_STARTED', 'VISIT_COMPLETED', 'LEAD_CAPTURED', 'TRANSITION_UNUSUAL', 'WORK_ENDED');

-- CreateEnum
CREATE TYPE "SalesPipelineStage" AS ENUM ('NEW_LEAD', 'VISITED', 'CONTACTED', 'INTERESTED', 'DEMO_SCHEDULED', 'PROPOSAL_SENT', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "SalesLeadQuality" AS ENUM ('NEW', 'QUALIFIED', 'UNQUALIFIED', 'INTERESTED', 'CONVERTED', 'INVALID', 'DUPLICATE');

-- CreateEnum
CREATE TYPE "SalesExitState" AS ENUM ('NOT_INTERESTED', 'LOST', 'INVALID', 'DUPLICATE');

-- CreateEnum
CREATE TYPE "SalesPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "SalesDemoType" AS ENUM ('VIRTUAL', 'ONSITE');

-- CreateEnum
CREATE TYPE "SalesFollowUpStatus" AS ENUM ('PENDING', 'COMPLETED', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SalesDemoStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "WorkSessionStatus" ADD VALUE 'COMPLETED';
ALTER TYPE "WorkSessionStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "MarketMappingVisit" ADD COLUMN     "gpsAddress" TEXT;

-- AlterTable
ALTER TABLE "WorkSession" DROP COLUMN "status",
ADD COLUMN     "status" "AccountabilitySessionStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "SalesWorkSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "startLatitude" DOUBLE PRECISION,
    "startLongitude" DOUBLE PRECISION,
    "startAccuracy" DOUBLE PRECISION,
    "endLatitude" DOUBLE PRECISION,
    "endLongitude" DOUBLE PRECISION,
    "endAccuracy" DOUBLE PRECISION,
    "startGpsStatus" "GpsStatus" NOT NULL DEFAULT 'UNKNOWN',
    "endGpsStatus" "GpsStatus",
    "status" "WorkSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesWorkSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GpsEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "eventType" "GpsEventType" NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GpsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldMission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "targetCount" INTEGER NOT NULL DEFAULT 20,
    "horizon" TEXT NOT NULL DEFAULT 'DAY',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FieldMission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldMissionBusiness" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "visitId" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "address" TEXT,
    "gpsAddress" TEXT,
    "isAnchor" BOOLEAN NOT NULL DEFAULT false,
    "isPlaceholder" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'NOT_YET',
    "dailyCustomers" TEXT,
    "businessSize" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FieldMissionBusiness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldActivityTimelineEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionId" TEXT,
    "visitId" TEXT,
    "eventType" "FieldTimelineEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FieldActivityTimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitTransition" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "fromVisitId" TEXT,
    "transitionStatus" "TransitionStatus" NOT NULL DEFAULT 'NORMAL',
    "distanceMeters" DECIMAL(65,30),
    "durationSeconds" INTEGER,
    "gpsAccuracy" DECIMAL(65,30),
    "explanationReason" TEXT,
    "explanationNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisitTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesPipeline" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "leadId" TEXT,
    "businessName" TEXT NOT NULL,
    "industry" TEXT,
    "location" TEXT,
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "source" TEXT NOT NULL DEFAULT 'Direct Referral',
    "pipelineStage" "SalesPipelineStage" NOT NULL DEFAULT 'NEW_LEAD',
    "leadQuality" "SalesLeadQuality" NOT NULL DEFAULT 'NEW',
    "exitState" "SalesExitState",
    "priority" "SalesPriority" NOT NULL DEFAULT 'MEDIUM',
    "subscriptionInterest" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" TIMESTAMP(3),
    "demoScheduledDate" TIMESTAMP(3),
    "demoType" "SalesDemoType",
    "demoMeetingUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesPipeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesFollowUp" (
    "id" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "scheduledTime" TEXT,
    "status" "SalesFollowUpStatus" NOT NULL DEFAULT 'PENDING',
    "outcome" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesFollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesDemo" (
    "id" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "scheduledTime" TEXT,
    "type" "SalesDemoType" NOT NULL DEFAULT 'VIRTUAL',
    "meetingUrl" TEXT,
    "status" "SalesDemoStatus" NOT NULL DEFAULT 'SCHEDULED',
    "outcome" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesDemo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalesWorkSession_userId_idx" ON "SalesWorkSession"("userId");

-- CreateIndex
CREATE INDEX "SalesWorkSession_status_idx" ON "SalesWorkSession"("status");

-- CreateIndex
CREATE INDEX "SalesWorkSession_userId_status_idx" ON "SalesWorkSession"("userId", "status");

-- CreateIndex
CREATE INDEX "SalesWorkSession_startedAt_idx" ON "SalesWorkSession"("startedAt");

-- CreateIndex
CREATE INDEX "GpsEvent_sessionId_idx" ON "GpsEvent"("sessionId");

-- CreateIndex
CREATE INDEX "GpsEvent_createdAt_idx" ON "GpsEvent"("createdAt");

-- CreateIndex
CREATE INDEX "FieldMission_userId_idx" ON "FieldMission"("userId");

-- CreateIndex
CREATE INDEX "FieldMission_userId_startedAt_idx" ON "FieldMission"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "FieldMissionBusiness_missionId_idx" ON "FieldMissionBusiness"("missionId");

-- CreateIndex
CREATE INDEX "FieldMissionBusiness_visitId_idx" ON "FieldMissionBusiness"("visitId");

-- CreateIndex
CREATE INDEX "FieldActivityTimelineEvent_userId_idx" ON "FieldActivityTimelineEvent"("userId");

-- CreateIndex
CREATE INDEX "FieldActivityTimelineEvent_missionId_idx" ON "FieldActivityTimelineEvent"("missionId");

-- CreateIndex
CREATE INDEX "FieldActivityTimelineEvent_eventType_idx" ON "FieldActivityTimelineEvent"("eventType");

-- CreateIndex
CREATE INDEX "VisitTransition_userId_idx" ON "VisitTransition"("userId");

-- CreateIndex
CREATE INDEX "VisitTransition_visitId_idx" ON "VisitTransition"("visitId");

-- CreateIndex
CREATE INDEX "SalesPipeline_affiliateId_idx" ON "SalesPipeline"("affiliateId");

-- CreateIndex
CREATE INDEX "SalesPipeline_pipelineStage_idx" ON "SalesPipeline"("pipelineStage");

-- CreateIndex
CREATE INDEX "SalesPipeline_leadQuality_idx" ON "SalesPipeline"("leadQuality");

-- CreateIndex
CREATE INDEX "SalesPipeline_businessName_idx" ON "SalesPipeline"("businessName");

-- CreateIndex
CREATE INDEX "SalesPipeline_phone_idx" ON "SalesPipeline"("phone");

-- CreateIndex
CREATE INDEX "SalesFollowUp_pipelineId_idx" ON "SalesFollowUp"("pipelineId");

-- CreateIndex
CREATE INDEX "SalesFollowUp_userId_idx" ON "SalesFollowUp"("userId");

-- CreateIndex
CREATE INDEX "SalesFollowUp_scheduledDate_idx" ON "SalesFollowUp"("scheduledDate");

-- CreateIndex
CREATE INDEX "SalesFollowUp_status_idx" ON "SalesFollowUp"("status");

-- CreateIndex
CREATE INDEX "SalesDemo_pipelineId_idx" ON "SalesDemo"("pipelineId");

-- CreateIndex
CREATE INDEX "SalesDemo_userId_idx" ON "SalesDemo"("userId");

-- CreateIndex
CREATE INDEX "SalesDemo_scheduledDate_idx" ON "SalesDemo"("scheduledDate");

-- CreateIndex
CREATE INDEX "SalesDemo_status_idx" ON "SalesDemo"("status");

-- CreateIndex
CREATE INDEX "WorkSession_userId_status_idx" ON "WorkSession"("userId", "status");

-- AddForeignKey
ALTER TABLE "SalesWorkSession" ADD CONSTRAINT "SalesWorkSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GpsEvent" ADD CONSTRAINT "GpsEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SalesWorkSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldMission" ADD CONSTRAINT "FieldMission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldMissionBusiness" ADD CONSTRAINT "FieldMissionBusiness_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "FieldMission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldActivityTimelineEvent" ADD CONSTRAINT "FieldActivityTimelineEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldActivityTimelineEvent" ADD CONSTRAINT "FieldActivityTimelineEvent_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "FieldMission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitTransition" ADD CONSTRAINT "VisitTransition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesPipeline" ADD CONSTRAINT "SalesPipeline_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesFollowUp" ADD CONSTRAINT "SalesFollowUp_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "SalesPipeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesFollowUp" ADD CONSTRAINT "SalesFollowUp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesDemo" ADD CONSTRAINT "SalesDemo_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "SalesPipeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesDemo" ADD CONSTRAINT "SalesDemo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
