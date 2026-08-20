-- CreateEnum
CREATE TYPE "CommunicationChannel" AS ENUM ('WHATSAPP', 'SMS');

-- CreateEnum
CREATE TYPE "CommunicationMessageStatus" AS ENUM ('PENDING', 'SCHEDULED', 'SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CommunicationMessageType" AS ENUM ('MANUAL', 'CAMPAIGN', 'AUTOMATION', 'WELCOME', 'CUSTOMER_JOURNEY', 'RE_ENGAGEMENT');

-- CreateEnum
CREATE TYPE "CommunicationTemplateStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AutomationTrigger" AS ENUM ('LEAD_CREATED', 'STATUS_CHANGED_TO_INTERESTED', 'STILL_INTERESTED_NOT_SUBSCRIBED', 'BECAME_SUBSCRIBED', 'BECAME_NOT_INTERESTED', 'BEFORE_EXPIRY', 'AFTER_EXPIRY');

-- CreateEnum
CREATE TYPE "AutomationAction" AS ENUM ('SEND_SMS', 'CREATE_WHATSAPP_TASK', 'STOP_LEAD_MESSAGES', 'START_CUSTOMER_JOURNEY');

-- CreateEnum
CREATE TYPE "NotInterestedPolicy" AS ENUM ('NO_MESSAGES', 'RE_ENGAGEMENT');

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "lastContactedAt" TIMESTAMP(3),
ADD COLUMN     "nextFollowUpAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "CommunicationTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" "CommunicationChannel" NOT NULL,
    "body" TEXT NOT NULL,
    "status" "CommunicationTemplateStatus" NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "channels" "CommunicationChannel"[],
    "templateId" TEXT,
    "body" TEXT,
    "audienceFilters" JSONB NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" "AutomationTrigger" NOT NULL,
    "condition" JSONB,
    "waitDays" INTEGER NOT NULL DEFAULT 0,
    "action" "AutomationAction" NOT NULL,
    "channel" "CommunicationChannel",
    "templateId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationMessage" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "phone" TEXT,
    "channel" "CommunicationChannel" NOT NULL,
    "type" "CommunicationMessageType" NOT NULL DEFAULT 'MANUAL',
    "status" "CommunicationMessageStatus" NOT NULL DEFAULT 'PENDING',
    "body" TEXT NOT NULL,
    "variables" JSONB,
    "templateId" TEXT,
    "campaignId" TEXT,
    "ruleId" TEXT,
    "scheduledForAt" TIMESTAMP(3),
    "preparedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "markedSentAt" TIMESTAMP(3),
    "sentById" TEXT,
    "failureReason" TEXT,
    "providerMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationSettings" (
    "id" TEXT NOT NULL,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "smsProvider" TEXT NOT NULL DEFAULT 'disabled',
    "smsSenderId" TEXT,
    "smsDailyCap" INTEGER NOT NULL DEFAULT 1000,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT true,
    "minIntervalHours" INTEGER NOT NULL DEFAULT 24,
    "maxMessagesPerContactPerDay" INTEGER NOT NULL DEFAULT 3,
    "maxMessagesPerContactPerWeek" INTEGER NOT NULL DEFAULT 10,
    "notInterestedPolicy" "NotInterestedPolicy" NOT NULL DEFAULT 'NO_MESSAGES',
    "reEngagementDelayDays" INTEGER NOT NULL DEFAULT 30,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunicationTemplate_channel_idx" ON "CommunicationTemplate"("channel");

-- CreateIndex
CREATE INDEX "CommunicationTemplate_status_idx" ON "CommunicationTemplate"("status");

-- CreateIndex
CREATE INDEX "CommunicationTemplate_createdById_idx" ON "CommunicationTemplate"("createdById");

-- CreateIndex
CREATE INDEX "CommunicationCampaign_status_idx" ON "CommunicationCampaign"("status");

-- CreateIndex
CREATE INDEX "CommunicationCampaign_createdById_idx" ON "CommunicationCampaign"("createdById");

-- CreateIndex
CREATE INDEX "AutomationRule_trigger_idx" ON "AutomationRule"("trigger");

-- CreateIndex
CREATE INDEX "AutomationRule_isActive_idx" ON "AutomationRule"("isActive");

-- CreateIndex
CREATE INDEX "AutomationRule_sortOrder_idx" ON "AutomationRule"("sortOrder");

-- CreateIndex
CREATE INDEX "CommunicationMessage_leadId_idx" ON "CommunicationMessage"("leadId");

-- CreateIndex
CREATE INDEX "CommunicationMessage_leadId_channel_status_idx" ON "CommunicationMessage"("leadId", "channel", "status");

-- CreateIndex
CREATE INDEX "CommunicationMessage_status_scheduledForAt_idx" ON "CommunicationMessage"("status", "scheduledForAt");

-- CreateIndex
CREATE INDEX "CommunicationMessage_channel_status_idx" ON "CommunicationMessage"("channel", "status");

-- CreateIndex
CREATE INDEX "CommunicationMessage_campaignId_idx" ON "CommunicationMessage"("campaignId");

-- CreateIndex
CREATE INDEX "CommunicationMessage_ruleId_idx" ON "CommunicationMessage"("ruleId");

-- CreateIndex
CREATE INDEX "CommunicationMessage_templateId_idx" ON "CommunicationMessage"("templateId");

-- CreateIndex
CREATE INDEX "CommunicationMessage_createdAt_idx" ON "CommunicationMessage"("createdAt");

-- CreateIndex
CREATE INDEX "Lead_lastContactedAt_idx" ON "Lead"("lastContactedAt");

-- CreateIndex
CREATE INDEX "Lead_nextFollowUpAt_idx" ON "Lead"("nextFollowUpAt");

-- AddForeignKey
ALTER TABLE "CommunicationCampaign" ADD CONSTRAINT "CommunicationCampaign_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CommunicationTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRule" ADD CONSTRAINT "AutomationRule_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CommunicationTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationMessage" ADD CONSTRAINT "CommunicationMessage_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationMessage" ADD CONSTRAINT "CommunicationMessage_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CommunicationTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationMessage" ADD CONSTRAINT "CommunicationMessage_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "CommunicationCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationMessage" ADD CONSTRAINT "CommunicationMessage_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AutomationRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
