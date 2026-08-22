import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaWorkerService } from './prisma-worker.service';
import { AuditService } from './audit.service';

@Global()
@Module({
  providers: [PrismaService, PrismaWorkerService, AuditService],
  exports: [PrismaService, PrismaWorkerService, AuditService],
})
export class PrismaModule {}
