import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Ensure default settings exist
    const count = await this.prisma.platformSettings.count();
    if (count === 0) {
      await this.prisma.platformSettings.create({
        data: {
          directCommissionRate: 0.15,
          indirectCommissionRate: 0.05,
          minWithdrawal: 5000,
          withdrawalFee: 100,
          subAffiliateUnlockCount: 5,
          fraudThresholdScore: 80,
          earningDurationMonths: 12,
        },
      });
    }
  }

  async getSettings() {
    return this.prisma.platformSettings.findFirst();
  }

  async updateSettings(data: any) {
    const settings = await this.prisma.platformSettings.findFirst();
    if (!settings) {
      throw new NotFoundException('Platform settings not found');
    }
    return this.prisma.platformSettings.update({
      where: { id: settings.id },
      data,
    });
  }
}
