import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TrainingService {
  constructor(private readonly prisma: PrismaService) {}

  // --- ADMIN METHODS ---

  async findAllModulesAdmin(pagination: { skip?: number; take?: number }) {
    const [data, total] = await Promise.all([
      this.prisma.trainingModule.findMany({
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { order: 'asc' },
        include: {
          _count: { select: { quizzes: true, scenarios: true, progress: true } },
        },
      }),
      this.prisma.trainingModule.count(),
    ]);
    return { data, total };
  }

  async findModuleDetailsAdmin(id: string) {
    const module = await this.prisma.trainingModule.findUnique({
      where: { id },
      include: {
        quizzes: { orderBy: { order: 'asc' } },
        scenarios: { orderBy: { order: 'asc' } },
      },
    });
    if (!module) throw new NotFoundException('Module not found');
    return module;
  }

  async createModule(data: any) {
    return this.prisma.trainingModule.create({
      data: {
        ...data,
        quizzes: data.quizzes ? { create: data.quizzes } : undefined,
        scenarios: data.scenarios ? { create: data.scenarios } : undefined,
      },
    });
  }

  async updateModule(id: string, data: any) {
    return this.prisma.trainingModule.update({
      where: { id },
      data,
    });
  }

  async deleteModule(id: string) {
    return this.prisma.trainingModule.delete({
      where: { id },
    });
  }

  // --- AFFILIATE METHODS ---

  async findAllModulesAffiliate(userId: string, pagination: { skip?: number; take?: number }) {
    const [data, total] = await Promise.all([
      this.prisma.trainingModule.findMany({
        where: { isPublished: true },
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { order: 'asc' },
        include: {
          progress: { where: { userId } },
        },
      }),
      this.prisma.trainingModule.count({ where: { isPublished: true } }),
    ]);
    return { data, total };
  }

  async getModuleProgress(userId: string, moduleId: string) {
    return this.prisma.trainingProgress.findUnique({
      where: { userId_moduleId: { userId, moduleId } },
    });
  }

  async updateProgress(userId: string, moduleId: string, data: any) {
    return this.prisma.trainingProgress.upsert({
      where: { userId_moduleId: { userId, moduleId } },
      update: data,
      create: { userId, moduleId, ...data },
    });
  }
}
