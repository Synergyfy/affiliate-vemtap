import { Module } from "@nestjs/common";
import { MarketMappingController } from "./market-mapping.controller";
import { MarketMappingService } from "./market-mapping.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [MarketMappingController],
  providers: [MarketMappingService],
  exports: [MarketMappingService],
})
export class MarketMappingModule {}
