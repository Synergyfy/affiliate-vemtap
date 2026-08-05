-- AlterTable
ALTER TABLE "MarketMappingAdminConfig" ADD COLUMN     "businessSizes" JSONB,
ADD COLUMN     "businessStatuses" JSONB,
ADD COLUMN     "contactPositions" JSONB,
ADD COLUMN     "customerRanges" JSONB,
ADD COLUMN     "dailyTarget" INTEGER,
ADD COLUMN     "faqs" JSONB,
ADD COLUMN     "interestOptions" JSONB,
ADD COLUMN     "monthlyTarget" INTEGER,
ADD COLUMN     "openingDays" JSONB,
ADD COLUMN     "paymentStatuses" JSONB,
ADD COLUMN     "planTypes" JSONB,
ADD COLUMN     "ticketStatuses" JSONB,
ADD COLUMN     "weeklyTarget" INTEGER;
