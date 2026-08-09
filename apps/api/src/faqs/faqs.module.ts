import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FaqsController } from './faqs.controller';
import { FaqsService } from './faqs.service';

@Module({
  imports: [PrismaModule],
  controllers: [FaqsController],
  providers: [FaqsService],
})
export class FaqsModule {}
