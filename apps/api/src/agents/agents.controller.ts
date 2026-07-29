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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiHeader,
  ApiOkResponse,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { AgentsQueryDto } from './dto/agents-query.dto';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import {
  AgentListResponseDto,
  AgentDetailResponseDto,
  RevenueTrendResponseDto,
} from './dto/agent-response.dto';
import { ApiKeyGuard } from '../api-keys/guards/api-key.guard';

@ApiTags('agents')
@ApiHeader({
  name: 'x-api-key',
  description: 'API key issued by an admin for external integrations',
  required: true,
})
@Controller('agents')
@UseGuards(ApiKeyGuard)
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get()
  @ApiOperation({ summary: 'List agents with pagination, search, and status filter' })
  @ApiOkResponse({ type: AgentListResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query() query: AgentsQueryDto): Promise<AgentListResponseDto> {
    return this.agentsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agent detail with subordinates and businesses' })
  @ApiOkResponse({ type: AgentDetailResponseDto })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async findOne(@Param('id') id: string): Promise<AgentDetailResponseDto> {
    return this.agentsService.findOne(id);
  }

  @Get(':id/revenue')
  @ApiOperation({ summary: 'Get monthly revenue trend for an agent' })
  @ApiOkResponse({ type: RevenueTrendResponseDto })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async getRevenueTrend(@Param('id') id: string): Promise<RevenueTrendResponseDto> {
    return this.agentsService.getRevenueTrend(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new agent' })
  @ApiBody({ type: CreateAgentDto })
  @ApiOkResponse({ type: AgentDetailResponseDto })
  @ApiResponse({ status: 409, description: 'Email or phone already in use' })
  async create(@Body() dto: CreateAgentDto): Promise<AgentDetailResponseDto> {
    return this.agentsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an agent' })
  @ApiBody({ type: UpdateAgentDto })
  @ApiOkResponse({ type: AgentDetailResponseDto })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  @ApiResponse({ status: 409, description: 'Email or phone already in use' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAgentDto,
  ): Promise<AgentDetailResponseDto> {
    return this.agentsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove (deactivate) an agent' })
  @ApiResponse({ status: 204, description: 'Agent deactivated' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.agentsService.remove(id);
  }
}
