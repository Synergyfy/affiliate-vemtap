import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateToolDto, UpdateToolDto } from './dto/tool.dto';

@Injectable()
export class ToolsService {
  constructor(private prisma: PrismaService) {}

  async findAll(onlyPublished = true) {
    return this.prisma.marketingTool.findMany({
      where: onlyPublished ? { isPublished: true } : {},
      orderBy: { createdAt: 'desc' },
    });
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
