-- Accelerate phone `contains` (LIKE '%tail%') lookups used by the
-- communication engine when matching leads to businesses (matchBusinessByPhone,
-- resolveBusinessStatus, notifyCommunicationEngine, expiry cron).
-- A plain b-tree index cannot serve a leading-wildcard LIKE, so use pg_trgm GIN.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "Business_phone_trgm_idx" ON "Business" USING GIN ("phone" gin_trgm_ops);
CREATE INDEX "Lead_phone_trgm_idx" ON "Lead" USING GIN ("phone" gin_trgm_ops);