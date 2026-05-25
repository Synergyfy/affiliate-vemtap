import { Injectable, Inject, OnModuleInit, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UpdateAgreementDto } from './dto/update-agreement.dto';

const AGREEMENT_CACHE_KEY = 'settings_agreement';
const SETTINGS_CACHE_KEY = 'platform_settings';

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
          onboardingBonusAmount: 2500,
          reqAgentActiveDays: 90,
          reqAgentActiveBusinesses: 40,
          reqAgentMinReportingScore: 85.0,
          reqAgentMinAttendanceRate: 90.0,
          reqAffiliateActiveAgents: 30,
          reqAffiliateNetworkBusinesses: 100,
          reqSupervisorActiveAgents: 10,
          reqSupervisorActiveSupervisors: 5,
          reqSupervisorNetworkBusinesses: 100,
        },
      });
      await this.cacheManager.del(SETTINGS_CACHE_KEY);
    } else {
      const settings = await this.prisma.platformSettings.findFirst();
      if (settings) {
        const updateData: any = {};
        if (!settings.agreementTemplate) {
          updateData.agreementTemplate = DEFAULT_AGREEMENT_HTML;
        }

        // Automatic backfill check for new customizable settings fields
        if (settings.onboardingBonusAmount === undefined || settings.onboardingBonusAmount === null) {
          updateData.onboardingBonusAmount = 2500;
        }

        if (settings.reqAgentActiveDays === undefined || settings.reqAgentActiveDays === null) {
          updateData.reqAgentActiveDays = 90;
          updateData.reqAgentActiveBusinesses = 40;
          updateData.reqAgentMinReportingScore = 85.0;
          updateData.reqAgentMinAttendanceRate = 90.0;
          updateData.reqAffiliateActiveAgents = 30;
          updateData.reqAffiliateNetworkBusinesses = 100;
          updateData.reqSupervisorActiveAgents = 10;
          updateData.reqSupervisorActiveSupervisors = 5;
          updateData.reqSupervisorNetworkBusinesses = 100;
        }

        if (Object.keys(updateData).length > 0) {
          await this.prisma.platformSettings.update({
            where: { id: settings.id },
            data: updateData,
          });
          await this.cacheManager.del(SETTINGS_CACHE_KEY);
        }
      }
    }
  }

  async getSettings() {
    const cached = await this.cacheManager.get<any>(SETTINGS_CACHE_KEY);
    if (cached) {
      return cached;
    }
    const settings = await this.prisma.platformSettings.findFirst();
    if (settings) {
      await this.cacheManager.set(SETTINGS_CACHE_KEY, settings, 3600 * 1000); // 1 hour cache
    }
    return settings;
  }

  async updateSettings(data: UpdateSettingsDto) {
    const settings = await this.prisma.platformSettings.findFirst();
    if (!settings) {
      throw new NotFoundException('Platform settings not found');
    }
    const updated = await this.prisma.platformSettings.update({
      where: { id: settings.id },
      data,
    });
    await this.cacheManager.del(SETTINGS_CACHE_KEY);
    return updated;
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
