import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NetworkService } from './network.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('network')
@ApiBearerAuth()
@Controller('network')
@UseGuards(JwtAuthGuard)
export class NetworkController {
  constructor(private readonly networkService: NetworkService) {}

  @Get('recruits')
  @ApiOperation({ summary: 'List direct recruits and their stats' })
  getRecruits(@CurrentUser() user: any) {
    return this.networkService.getRecruits(user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get network summary stats and milestone progress' })
  getStats(@CurrentUser() user: any) {
    return this.networkService.getStats(user.id);
  }
}
