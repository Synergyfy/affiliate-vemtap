import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BusinessesService } from './businesses.service';
import { CreateBusinessDto } from './dto/business.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('businesses')
@ApiBearerAuth()
@Controller('businesses')
@UseGuards(JwtAuthGuard)
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get businesses referred by the current user' })
  findAll(@CurrentUser() user: any) {
    return this.businessesService.findAll(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Register a new business referral' })
  create(@CurrentUser() user: any, @Body() dto: CreateBusinessDto) {
    return this.businessesService.create(user.id, dto);
  }
}
