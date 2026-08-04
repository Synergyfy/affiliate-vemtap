import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto, UpdateLeadDto, LeadFilterDto } from './dto/leads.dto';
import { LeadStatus } from '@prisma/client';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: any, filters: LeadFilterDto) {
    const isPrivileged = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    const where: any = {
      deletedAt: null,
      ...(isPrivileged ? {} : { affiliateId: user.id }),
    };

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

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        take: filters.take,
        skip: filters.skip,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: filters.page,
        limit: filters.limit || 10,
        totalPages: Math.ceil(total / (filters.limit || 10)),
      },

    };
  }


  async findOne(id: string, user: any) {
    const lead = await this.prisma.lead.findUnique({
      where: { id, deletedAt: null },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    const isPrivileged = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    if (!isPrivileged && lead.affiliateId !== user.id) {
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

  async update(id: string, user: any, dto: UpdateLeadDto) {
    const lead = await this.findOne(id, user);

    return this.prisma.lead.update({
      where: { id },
      data: {
        ...dto,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : lead.followUpDate,
      },
    });
  }

  async remove(id: string, user: any) {
    await this.findOne(id, user);
    return this.prisma.lead.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getStats(user: any) {
    const isPrivileged = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    const where: any = isPrivileged ? {} : { affiliateId: user.id };

    const [total, contacted, interested, potential] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.lead.count({ where: { ...where, status: LeadStatus.CONTACTED } }),
      this.prisma.lead.count({ where: { ...where, status: LeadStatus.INTERESTED } }),
      this.prisma.lead.count({ where: { ...where, status: LeadStatus.POTENTIAL } }),
    ]);

    return {
      total,
      contacted,
      interested,
      potential,
    };
  }

}
