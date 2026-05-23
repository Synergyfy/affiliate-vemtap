-- AlterTable
ALTER TABLE "PlatformSettings" ADD COLUMN     "reqAffiliateActiveAgents" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "reqAffiliateNetworkBusinesses" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "reqAgentActiveBusinesses" INTEGER NOT NULL DEFAULT 40,
ADD COLUMN     "reqAgentActiveDays" INTEGER NOT NULL DEFAULT 90,
ADD COLUMN     "reqAgentMinAttendanceRate" DECIMAL(65,30) NOT NULL DEFAULT 90.0,
ADD COLUMN     "reqAgentMinReportingScore" DECIMAL(65,30) NOT NULL DEFAULT 85.0,
ADD COLUMN     "reqSupervisorActiveAgents" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "reqSupervisorActiveSupervisors" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "reqSupervisorNetworkBusinesses" INTEGER NOT NULL DEFAULT 100;
