-- CreateEnum
CREATE TYPE "Role" AS ENUM ('AFFILIATE', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('BASIC', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "BusinessStatus" AS ENUM ('TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('DIRECT', 'INDIRECT', 'BONUS');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REJECTED');

-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'APPROVED', 'PROCESSING', 'PAID', 'REJECTED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('COMMISSION', 'WITHDRAWAL', 'REFERRAL_BONUS', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SYSTEM', 'COMMISSION', 'WITHDRAWAL', 'KYC', 'TRAINING', 'PROMOTIONAL');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "FraudType" AS ENUM ('MULTIPLE_ACCOUNTS', 'FAKE_REFERRALS', 'SELF_REFERRAL', 'SUSPICIOUS_ACTIVITY', 'KYC_MISMATCH');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "FraudStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'CONFIRMED', 'FALSE_POSITIVE', 'RESOLVED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "referredBy" TEXT,
    "referrerId" TEXT,
    "nin" TEXT,
    "bvn" TEXT,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "accountName" TEXT,
    "kycStatus" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "kycDocuments" JSONB,
    "totalEarnings" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "pendingEarnings" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "referralCount" INTEGER NOT NULL DEFAULT 0,
    "role" "Role" NOT NULL DEFAULT 'AFFILIATE',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "businessType" TEXT,
    "planType" "PlanType" NOT NULL DEFAULT 'BASIC',
    "referralCode" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "subscriptionAmount" DECIMAL(65,30) NOT NULL,
    "commissionRate" DECIMAL(65,30) NOT NULL DEFAULT 0.20,
    "commissionAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" "BusinessStatus" NOT NULL DEFAULT 'TRIAL',
    "trialEndsAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT,
    "subAffiliateId" TEXT,
    "type" "CommissionType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Withdrawal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "fee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(65,30) NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "processedAt" TIMESTAMP(3),
    "processedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Withdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "balanceAfter" DECIMAL(65,30) NOT NULL,
    "description" TEXT,
    "reference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingModule" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "videoUrl" TEXT,
    "order" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correctAnswer" INTEGER NOT NULL,
    "explanation" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "situation" TEXT NOT NULL,
    "objection" TEXT NOT NULL,
    "idealResponse" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "quizScore" INTEGER,
    "completedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL,
    "directCommissionRate" DECIMAL(65,30) NOT NULL DEFAULT 0.20,
    "indirectCommissionRate" DECIMAL(65,30) NOT NULL DEFAULT 0.05,
    "minWithdrawal" DECIMAL(65,30) NOT NULL DEFAULT 5000,
    "withdrawalFee" DECIMAL(65,30) NOT NULL DEFAULT 100,
    "subAffiliateUnlockCount" INTEGER NOT NULL DEFAULT 5,
    "fraudThresholdScore" INTEGER NOT NULL DEFAULT 80,
    "referralUnlockCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "FraudType" NOT NULL,
    "severity" "Severity" NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" JSONB,
    "status" "FraudStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FraudAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "adminId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "User_referralCode_idx" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "User_referredBy_idx" ON "User"("referredBy");

-- CreateIndex
CREATE INDEX "User_referrerId_idx" ON "User"("referrerId");

-- CreateIndex
CREATE INDEX "Business_affiliateId_idx" ON "Business"("affiliateId");

-- CreateIndex
CREATE INDEX "Business_referralCode_idx" ON "Business"("referralCode");

-- CreateIndex
CREATE INDEX "Business_status_idx" ON "Business"("status");

-- CreateIndex
CREATE INDEX "Commission_userId_idx" ON "Commission"("userId");

-- CreateIndex
CREATE INDEX "Commission_businessId_idx" ON "Commission"("businessId");

-- CreateIndex
CREATE INDEX "Commission_status_idx" ON "Commission"("status");

-- CreateIndex
CREATE INDEX "Commission_type_idx" ON "Commission"("type");

-- CreateIndex
CREATE INDEX "Withdrawal_userId_idx" ON "Withdrawal"("userId");

-- CreateIndex
CREATE INDEX "Withdrawal_status_idx" ON "Withdrawal"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_reference_key" ON "Transaction"("reference");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Quiz_moduleId_idx" ON "Quiz"("moduleId");

-- CreateIndex
CREATE INDEX "Scenario_moduleId_idx" ON "Scenario"("moduleId");

-- CreateIndex
CREATE INDEX "TrainingProgress_userId_idx" ON "TrainingProgress"("userId");

-- CreateIndex
CREATE INDEX "TrainingProgress_moduleId_idx" ON "TrainingProgress"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingProgress_userId_moduleId_key" ON "TrainingProgress"("userId", "moduleId");

-- CreateIndex
CREATE INDEX "FraudAlert_userId_idx" ON "FraudAlert"("userId");

-- CreateIndex
CREATE INDEX "FraudAlert_status_idx" ON "FraudAlert"("status");

-- CreateIndex
CREATE INDEX "FraudAlert_severity_idx" ON "FraudAlert"("severity");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_adminId_idx" ON "AuditLog"("adminId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "TrainingModule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scenario" ADD CONSTRAINT "Scenario_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "TrainingModule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingProgress" ADD CONSTRAINT "TrainingProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingProgress" ADD CONSTRAINT "TrainingProgress_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "TrainingModule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
