import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { AffiliateDashboardController } from './affiliate-dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DashboardController, AffiliateDashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
