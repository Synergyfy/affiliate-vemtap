import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { OperationsService } from './operations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { 
  CreateTaskDto, UpdateTaskDto, 
  CreateDemoDto, UpdateDemoDto, 
  UpdateOnboardingDto 
} from './dto/operations.dto';

@Controller('operations')
@UseGuards(JwtAuthGuard)
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @Get('stats')
  getStats(@Req() req: any) {
    return this.operationsService.getOperationalStats(req.user.id, req.user.role);
  }

  @Get('tasks')
  getTasks(@Req() req: any) {
    return this.operationsService.findAllTasks(req.user.id, req.user.role);
  }

  @Post('tasks')
  createTask(@Req() req: any, @Body() dto: CreateTaskDto) {
    return this.operationsService.createTask(req.user.id, dto);
  }

  @Patch('tasks/:id')
  updateTask(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.operationsService.updateTask(id, req.user.id, req.user.role, dto);
  }

  @Get('demos')
  getDemos(@Req() req: any) {
    return this.operationsService.findAllDemos(req.user.id, req.user.role);
  }

  @Post('demos')
  createDemo(@Req() req: any, @Body() dto: CreateDemoDto) {
    return this.operationsService.createDemo(req.user.id, dto);
  }

  @Patch('demos/:id')
  updateDemo(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateDemoDto) {
    return this.operationsService.updateDemo(id, req.user.id, req.user.role, dto);
  }

  @Get('onboarding')
  getOnboarding(@Req() req: any) {
    return this.operationsService.findAllOnboarding(req.user.id, req.user.role);
  }

  @Patch('onboarding/:id')
  updateOnboarding(@Param('id') id: string, @Body() dto: UpdateOnboardingDto) {
    return this.operationsService.updateOnboarding(id, dto);
  }

  @Get('activities')
  getActivities(@Req() req: any) {
    return this.operationsService.findAllActivities(req.user.id, req.user.role);
  }
}
