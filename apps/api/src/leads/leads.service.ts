import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto, UpdateLeadDto, LeadFilterDto } from './dto/leads.dto';
import { LeadStatus, Priority } from '@prisma/client';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, filters: LeadFilterDto) {
    const where: any = { affiliateId: userId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { businessName: { contains: filters.search, mode: 'insensitive' } },
        { contactName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    if (lead.affiliateId !== userId) {
      throw new ForbiddenException('You do not have access to this lead');
    }

    return lead;
  }

  async create(userId: string, dto: CreateLeadDto) {
    return this.prisma.lead.create({
      data: {
        ...dto,
        affiliateId: userId,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateLeadDto) {
    const lead = await this.findOne(id, userId);

    return this.prisma.lead.update({
      where: { id },
      data: {
        ...dto,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : lead.followUpDate,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.lead.delete({
      where: { id },
    });
  }

  async getStats(userId: string) {
    const [total, contacted, interested, potential] = await Promise.all([
      this.prisma.lead.count({ where: { affiliateId: userId } }),
      this.prisma.lead.count({ where: { affiliateId: userId, status: LeadStatus.CONTACTED } }),
      this.prisma.lead.count({ where: { affiliateId: userId, status: LeadStatus.INTERESTED } }),
      this.prisma.lead.count({ where: { affiliateId: userId, status: LeadStatus.POTENTIAL } }),
    ]);

    return {
      total,
      contacted,
      interested,
      potential,
    };
  }
}
