-- Follow-up to 20260814000000_unify_leads_visits.
--
-- Postgres keeps object names when a table/column is renamed. The unify
-- migration renamed MarketMappingVisit -> Lead and visitId -> leadId columns
-- but left the FK constraint names, child indexes and the (now unused)
-- LeadStatus enum at their old names. Prisma expects Lead_*_fkey and
-- *_leadId_idx, so these renames remove migration drift without touching any
-- data.

-- Rename FK constraints that follow the renamed table.
ALTER TABLE "Lead" RENAME CONSTRAINT "MarketMappingVisit_planId_fkey" TO "Lead_planId_fkey";
ALTER TABLE "Lead" RENAME CONSTRAINT "MarketMappingVisit_userId_fkey" TO "Lead_userId_fkey";

-- Rename child indexes that follow the renamed visitId -> leadId columns.
ALTER INDEX "FieldMissionBusiness_visitId_idx" RENAME TO "FieldMissionBusiness_leadId_idx";
ALTER INDEX "VisitTransition_visitId_idx" RENAME TO "VisitTransition_leadId_idx";

-- Drop the enum type that was only used by the old (dropped) Lead table.
DROP TYPE IF EXISTS "LeadStatus";
