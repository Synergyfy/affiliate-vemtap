import { Injectable, Inject, OnModuleInit, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UpdateAgreementDto } from './dto/update-agreement.dto';

const AGREEMENT_CACHE_KEY = 'settings_agreement';

const DEFAULT_AGREEMENT_HTML = `<h4>1. Independent Contractor Status</h4>
<p>
  The Affiliate acknowledges and agrees that their relationship with Vemtap is that of an <strong>Independent Contractor</strong>. This agreement DOES NOT create an employee-employer relationship, a partnership, or a joint venture between the parties.
</p>

<h4>2. No Staff Benefits</h4>
<p>
  The Affiliate is not entitled to any benefits, including but not limited to health insurance, paid leave, pension contributions, or any other staff-related perks provided by Vemtap to its full-time employees.
</p>

<h4>3. Non-Representation</h4>
<p>
  The Affiliate shall not represent themselves as a staff member, agent, or legal representative of Vemtap in any capacity that could bind the Company to any contract or obligation. Any marketing materials used must clearly state the "Affiliate" status.
</p>

<h4>4. Tax Responsibility</h4>
<p>
  The Affiliate is solely responsible for reporting and paying any taxes applicable to the commissions earned through the Vemtap Affiliate Network according to local laws.
</p>

<h4>5. Confidentiality</h4>
<p>
  The Affiliate agrees to keep confidential any non-public information regarding Vemtap's business processes, technology, and partner businesses discovered during their participation in the program.
</p>`;

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async onModuleInit() {
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
          agreementTemplate: DEFAULT_AGREEMENT_HTML,
          agreementVersion: 1,
          linkExpiryDays: 30,
          managerRewardDurationMonths: 12,
          maxIpUsage: 2,
        },
      });
    } else {
      const settings = await this.prisma.platformSettings.findFirst();
      if (settings && !settings.agreementTemplate) {
        await this.prisma.platformSettings.update({
          where: { id: settings.id },
          data: { agreementTemplate: DEFAULT_AGREEMENT_HTML },
        });
      }
    }
  }

  async getSettings() {
    return this.prisma.platformSettings.findFirst();
  }

  async updateSettings(data: UpdateSettingsDto) {
    const settings = await this.prisma.platformSettings.findFirst();
    if (!settings) {
      throw new NotFoundException('Platform settings not found');
    }
    return this.prisma.platformSettings.update({
      where: { id: settings.id },
      data,
    });
  }

  async getAgreement() {
    const cached = await this.cacheManager.get<{ agreementTemplate: string; agreementVersion: number }>(AGREEMENT_CACHE_KEY);
    if (cached) {
      return cached;
    }

    let settings = await this.prisma.platformSettings.findFirst();

    if (!settings?.agreementTemplate) {
      settings = await this.prisma.platformSettings.update({
        where: { id: settings!.id },
        data: { agreementTemplate: DEFAULT_AGREEMENT_HTML },
      });
      await this.cacheManager.del(AGREEMENT_CACHE_KEY);
    }

    const data = {
      agreementTemplate: settings!.agreementTemplate,
      agreementVersion: settings!.agreementVersion || 1,
    };

    await this.cacheManager.set(AGREEMENT_CACHE_KEY, data, 3600 * 1000);
    return data;
  }

  async updateAgreement(dto: UpdateAgreementDto) {
    const settings = await this.prisma.platformSettings.findFirst();
    if (!settings) {
      throw new NotFoundException('Platform settings not found');
    }

    const updated = await this.prisma.platformSettings.update({
      where: { id: settings.id },
      data: {
        agreementTemplate: dto.agreementTemplate,
        agreementVersion: { increment: 1 },
      },
    });

    await this.cacheManager.del(AGREEMENT_CACHE_KEY);

    return {
      agreementTemplate: updated.agreementTemplate,
      agreementVersion: updated.agreementVersion,
    };
  }
}
