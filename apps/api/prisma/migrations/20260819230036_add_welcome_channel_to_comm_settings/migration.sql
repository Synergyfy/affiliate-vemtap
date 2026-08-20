-- AlterTable
ALTER TABLE "CommunicationSettings" ADD COLUMN     "welcomeBody" TEXT,
ADD COLUMN     "welcomeChannel" "CommunicationChannel" NOT NULL DEFAULT 'SMS';
