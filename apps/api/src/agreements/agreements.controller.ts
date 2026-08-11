import { Controller, Get, Post, Put, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { AgreementsService } from './agreements.service';
import { CreateAgreementDto } from './dto/create-agreement.dto';
import { UpdateAgreementDto } from './dto/update-agreement.dto';
import { SignAgreementDto } from './dto/sign-agreement.dto';

@ApiTags('agreements')
@ApiBearerAuth()
@Controller('agreements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgreementsController {
  constructor(private readonly agreementsService: AgreementsService) {}

  /**
   * Admin: Create a new agreement
   */
  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: Create a new targeted agreement' })
  async create(@Body() dto: CreateAgreementDto) {
    return this.agreementsService.create(dto);
  }

  /**
   * Admin: Update an existing agreement (increments version if schema changes)
   */
  @Put(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: Update an existing agreement' })
  async update(@Param('id') id: string, @Body() dto: UpdateAgreementDto) {
    return this.agreementsService.update(id, dto);
  }

  /**
   * Admin: Get signature audit logs for a specific agreement
   */
  @Get(':id/signatures')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: Get signature statistics and lists of signed/pending users for an agreement' })
  async getAgreementSignaturesAudit(@Param('id') id: string) {
    return this.agreementsService.getAgreementSignaturesAudit(id);
  }

  /**
   * Admin: Get agreement details & signature history for a specific user
   */
  @Get('users/:userId')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: Get all targeted agreements and signature history for a specific user' })
  async getUserAgreementsAudit(@Param('userId') userId: string) {
    return this.agreementsService.getUserAgreementsAudit(userId);
  }

  /**
   * User: Fetch pending agreements that need signature (called on dashboard load)
   */
  @Get('pending')
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'User: Fetch pending agreements that the current user must sign' })
  async getPendingAgreements(@CurrentUser() user: { id: string; role: Role }) {
    return this.agreementsService.getPendingAgreements(user.id, user.role);
  }

  /**
   * User: Fetch current user's signed agreement history
   */
  @Get('my-signatures')
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "User: Get a history of all agreements signed by the current user" })
  async getUserSignatures(@CurrentUser() user: { id: string }) {
    return this.agreementsService.getUserSignatures(user.id);
  }

  /**
   * All Roles: List agreements (admins see all, users see active ones targeted at them)
   */
  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER)
  @ApiOperation({ summary: 'All Roles: List agreements (optionally filtered by role or active status)' })
  async findAll(
    @CurrentUser() user: { id: string; role: Role },
    @Query('role') role?: Role,
    @Query('isActive') isActive?: boolean,
  ) {
    const isAdmin = user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN;
    
    // Non-admins can only see active agreements targeted to their own role
    const targetRole = isAdmin ? role : user.role;
    const targetActive = isAdmin ? (isActive !== undefined ? isActive : undefined) : true;

    return this.agreementsService.findAll(targetRole, targetActive);
  }

  /**
   * All Roles: Get a specific agreement
   */
  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER)
  @ApiOperation({ summary: 'All Roles: Get detailed agreement by ID' })
  async findOne(@Param('id') id: string) {
    return this.agreementsService.findOne(id);
  }

  /**
   * User: Sign an agreement (confirming signature of the latest version)
   */
  @Post(':id/sign')
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "User: Sign the latest version of a specific agreement" })
  async signAgreement(
    @Param('id') id: string,
    @Body() dto: SignAgreementDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.agreementsService.signAgreement(user.id, id, dto);
  }
}
