-- AlterTable
ALTER TABLE "Scenario" ADD COLUMN     "correctAnswerIndex" INTEGER,
ADD COLUMN     "options" JSONB;

-- AlterTable
ALTER TABLE "TrainingModule" ADD COLUMN     "pdfUrl" TEXT;
