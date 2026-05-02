-- CreateEnum
CREATE TYPE "ToolType" AS ENUM ('BANNER', 'EMAIL_SWIPE', 'SOCIAL_POST', 'VIDEO', 'PDF_GUIDE', 'LOGO');

-- CreateTable
CREATE TABLE "MarketingTool" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "ToolType" NOT NULL,
    "category" TEXT,
    "content" TEXT NOT NULL,
    "previewUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingTool_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketingTool_type_idx" ON "MarketingTool"("type");

-- CreateIndex
CREATE INDEX "MarketingTool_category_idx" ON "MarketingTool"("category");
