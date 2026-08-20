import { Module } from "@nestjs/common";
import { MarketMappingController } from "./market-mapping.controller";
import { MarketMappingService } from "./market-mapping.service";
import { PrismaModule } from "../prisma/prisma.module";
import { CommunicationModule } from "../communication/communication.module";

@Module({
  imports: [PrismaModule, CommunicationModule],
  controllers: [MarketMappingController],
  providers: [MarketMappingService],
  exports: [MarketMappingService],
})
export class MarketMappingModule {}
