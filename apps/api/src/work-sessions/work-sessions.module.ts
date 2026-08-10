import { Module } from '@nestjs/common';
import { WorkSessionsService } from './work-sessions.service';
import { WorkSessionsController } from './work-sessions.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WorkSessionsController],
  providers: [WorkSessionsService],
  exports: [WorkSessionsService],
})
export class WorkSessionsModule {}
