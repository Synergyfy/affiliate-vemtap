import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Header,
  Res,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Response } from "express";
import { Role } from "@prisma/client";
import { MarketMappingService } from "./market-mapping.service";
import {
  CreateMissionPlanDto,
  UpdateMissionPlanDto,
  CreateMarketMappingNoteDto,
  CreateHierarchyNodeDto,
  UpdateHierarchyNodeDto,
  CreateAssignmentDto,
  UpdateAssignmentDto,
  UpdateMarketMappingAdminConfigDto,
  CreateMarketMappingVisitDto,
  UpdateMarketMappingVisitDto,
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

  @Get("visits")
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  getVisits(@CurrentUser() user: { id: string }) {
    return this.marketMappingService.getVisits(user.id);
  }

  @Post("visits")
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  createVisit(@CurrentUser() user: { id: string }, @Body() dto: CreateMarketMappingVisitDto) {
    return this.marketMappingService.createVisit(user.id, dto);
  }

  @Patch("visits/:id")
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  updateVisit(@Param("id") id: string, @CurrentUser() user: { id: string }, @Body() dto: UpdateMarketMappingVisitDto) {
    return this.marketMappingService.updateVisit(id, user.id, dto);
  }

  @Get("history")
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  getHistory(@CurrentUser() user: { id: string }) {
    return this.marketMappingService.getHistory(user.id);
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
  getNotes(@CurrentUser() user: { id: string }, @Query("businessId") businessId?: string, @Query("reportKey") reportKey?: string) {
    return this.marketMappingService.getNotes(user.id, businessId, reportKey);
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

  // --- ADMIN ENDPOINTS ---

  @Get("admin/hierarchy")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Get complete market mapping hierarchy tree (Admin only)" })
  getHierarchyTree() {
    return this.marketMappingService.getHierarchyTree();
  }

  @Post("admin/hierarchy")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Create a hierarchy node (Admin only)" })
  createHierarchyNode(@Body() dto: CreateHierarchyNodeDto) {
    return this.marketMappingService.createHierarchyNode(dto);
  }

  @Patch("admin/hierarchy/:id")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Update a hierarchy node (Admin only)" })
  updateHierarchyNode(@Param("id") id: string, @Body() dto: UpdateHierarchyNodeDto) {
    return this.marketMappingService.updateHierarchyNode(id, dto);
  }

  @Delete("admin/hierarchy/:id")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Delete a hierarchy node (Admin only)" })
  deleteHierarchyNode(@Param("id") id: string) {
    return this.marketMappingService.deleteHierarchyNode(id);
  }

  @Get("admin/locations")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "List all locations/clusters (Admin only)" })
  getLocationsList() {
    return this.marketMappingService.getLocationsList();
  }

  @Get("admin/cluster/:id")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Get cluster details (Admin only)" })
  getClusterDetail(@Param("id") id: string) {
    return this.marketMappingService.getClusterDetail(id);
  }

  @Get("admin/assignments")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "List affiliate cluster assignments (Admin only)" })
  getAssignments() {
    return this.marketMappingService.getAssignments();
  }

  @Post("admin/assignments")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Assign affiliate to cluster (Admin only)" })
  createAssignment(@Body() dto: CreateAssignmentDto) {
    return this.marketMappingService.createAssignment(dto);
  }

  @Patch("admin/assignments/:id")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Update affiliate assignment targets (Admin only)" })
  updateAssignment(@Param("id") id: string, @Body() dto: UpdateAssignmentDto) {
    return this.marketMappingService.updateAssignment(id, dto);
  }

  @Delete("admin/assignments/:id")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Remove affiliate assignment (Admin only)" })
  deleteAssignment(@Param("id") id: string) {
    return this.marketMappingService.deleteAssignment(id);
  }

  @Get("admin/cluster/:id/submissions")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Get cluster capture submissions history (Admin only)" })
  getClusterSubmissions(@Param("id") id: string) {
    return this.marketMappingService.getClusterSubmissions(id);
  }

  @Get("admin/stats")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Get overall market mapping stats (Admin only)" })
  getGlobalStats() {
    return this.marketMappingService.getGlobalStats();
  }

  @Get("admin/editor-config")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Get market mapping admin config (Admin only)" })
  getAdminConfig() {
    return this.marketMappingService.getAdminConfig();
  }

  @Patch("admin/editor-config")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Update market mapping admin config (Admin only)" })
  updateAdminConfig(@Body() dto: UpdateMarketMappingAdminConfigDto) {
    return this.marketMappingService.updateAdminConfig(dto);
  }
}
