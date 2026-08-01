import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Header,
  Res,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiResponse } from "@nestjs/swagger";
import { Response } from "express";
import { Role } from "@prisma/client";
import { MarketMappingService } from "./market-mapping.service";
import {
  CreateMissionPlanDto,
  UpdateMissionPlanDto,
  CreateMarketMappingNoteDto,
} from "./dto/market-mapping.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@ApiTags("market-mapping")
@ApiBearerAuth()
@Controller("market-mapping")
@UseGuards(JwtAuthGuard, RolesGuard)
export class MarketMappingController {
  constructor(private readonly marketMappingService: MarketMappingService) {}

  @Get("config")
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Get user territory market mapping configuration" })
  getConfig(@CurrentUser() user: { id: string }) {
    return this.marketMappingService.getConfig(user.id);
  }

  @Get("territory")
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Get market mapping territory statistics" })
  getTerritoryStats(@CurrentUser() user: { id: string }) {
    return this.marketMappingService.getTerritoryStats(user.id);
  }

  @Get("plans")
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Get user mission plans and target history" })
  getPlans(@CurrentUser() user: { id: string }) {
    return this.marketMappingService.getPlans(user.id);
  }

  @Post("plans")
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Create a new mission plan" })
  createPlan(@CurrentUser() user: { id: string }, @Body() dto: CreateMissionPlanDto) {
    return this.marketMappingService.createPlan(user.id, dto);
  }

  @Patch("plans/:id")
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Update mission plan targets" })
  updatePlan(
    @Param("id") id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateMissionPlanDto,
  ) {
    return this.marketMappingService.updatePlan(id, user.id, dto);
  }

  @Get("anchors")
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Get anchor businesses for user cluster" })
  getAnchors(@CurrentUser() user: { id: string }) {
    return this.marketMappingService.getAnchors(user.id);
  }

  @Get("priority-visits")
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Get AI-recommended priority visits" })
  getPriorityVisits(@CurrentUser() user: { id: string }) {
    return this.marketMappingService.getPriorityVisits(user.id);
  }

  @Get("partnerships")
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Get partnership candidates for cluster" })
  getPartnerships(@CurrentUser() user: { id: string }) {
    return this.marketMappingService.getPartnerships(user.id);
  }

  @Get("insights")
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Get AI recommendations and cluster maturity metrics" })
  getInsights(@CurrentUser() user: { id: string }) {
    return this.marketMappingService.getInsights(user.id);
  }

  @Get("notes")
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Get market mapping notes and follow-ups" })
  getNotes(@CurrentUser() user: { id: string }, @Query("businessId") businessId?: string) {
    return this.marketMappingService.getNotes(user.id, businessId);
  }

  @Post("notes")
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Create a note or follow-up for a business" })
  createNote(@CurrentUser() user: { id: string }, @Body() dto: CreateMarketMappingNoteDto) {
    return this.marketMappingService.createNote(user.id, dto);
  }

  @Get("performance")
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Get aggregated market mapping performance metrics" })
  getPerformance(@CurrentUser() user: { id: string }) {
    return this.marketMappingService.getPerformance(user.id);
  }

  @Get("reports")
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Get market mapping report data per period" })
  getReports(@CurrentUser() user: { id: string }, @Query("period") period?: string) {
    return this.marketMappingService.getReports(user.id, period);
  }

  @Get("reports/download")
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Download market mapping report CSV" })
  @Header("Content-Type", "text/csv")
  @Header("Content-Disposition", "attachment; filename=market_mapping_report.csv")
  async downloadReportCsv(
    @CurrentUser() user: { id: string },
    @Query("period") period: string,
    @Res() res: Response,
  ) {
    const csv = await this.marketMappingService.downloadReportCsv(user.id, period);
    return res.send(csv);
  }
}
