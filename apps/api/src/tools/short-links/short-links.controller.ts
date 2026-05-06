import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Body, 
  Param, 
  UseGuards, 
  Request 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ShortLinksService } from './short-links.service';
import { CreateShortLinkDto } from './dto/create-short-link.dto';

@ApiTags('short-links')
@ApiBearerAuth()
@Controller('tools/short-links')
@UseGuards(JwtAuthGuard)
export class ShortLinksController {
  constructor(private readonly shortLinksService: ShortLinksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new custom short link' })
  create(@Request() req: any, @Body() dto: CreateShortLinkDto) {
    return this.shortLinksService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all short links for the logged-in affiliate' })
  findAll(@Request() req: any) {
    return this.shortLinksService.findAll(req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a short link' })
  remove(@Request() req: any, @Param('id') id: string) {
    return this.shortLinksService.remove(req.user.id, id);
  }
}
