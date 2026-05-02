import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateToolDto, UpdateToolDto } from './dto/tool.dto';

@Injectable()
export class ToolsService {
  constructor(private prisma: PrismaService) {}

  async findAll(onlyPublished = true, pagination: { skip?: number; take?: number } = {}) {
    const where = onlyPublished ? { isPublished: true } : {};
    const [data, total] = await Promise.all([
      this.prisma.marketingTool.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.marketingTool.count({ where }),
    ]);
    return { data, total };
  }

  async findOne(id: string) {
    const tool = await this.prisma.marketingTool.findUnique({
      where: { id },
    });
    if (!tool) {
      throw new NotFoundException(`Tool with ID ${id} not found`);
    }
    return tool;
  }

  async create(dto: CreateToolDto) {
    return this.prisma.marketingTool.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateToolDto) {
    await this.findOne(id);
    return this.prisma.marketingTool.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.marketingTool.delete({
      where: { id },
    });
  }
}
