-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('POTENTIAL', 'CONTACTED', 'INTERESTED', 'NOT_INTERESTED', 'COMPLETED');

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "location" TEXT,
    "website" TEXT,
    "contactName" TEXT NOT NULL,
    "contactRole" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "source" TEXT NOT NULL,
    "otherSource" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "LeadStatus" NOT NULL DEFAULT 'POTENTIAL',
    "followUpDate" TIMESTAMP(3),
    "comments" TEXT,
    "affiliateId" TEXT NOT NULL,
    "assignedAgentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lead_affiliateId_idx" ON "Lead"("affiliateId");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_priority_idx" ON "Lead"("priority");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
