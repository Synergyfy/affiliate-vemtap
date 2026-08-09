ALTER TABLE "User" ADD COLUMN "supervisorId" TEXT;
ALTER TABLE "User" ADD COLUMN "managerId" TEXT;
ALTER TABLE "User" ADD COLUMN "workingDays" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE INDEX "User_supervisorId_idx" ON "User"("supervisorId");
CREATE INDEX "User_managerId_idx" ON "User"("managerId");

ALTER TABLE "User" ADD CONSTRAINT "User_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
